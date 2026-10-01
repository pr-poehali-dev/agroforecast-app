"""
Цены закупщиков сервиса «Цена Зерна» (ценазерна.рф / cenazerna.ru).
Источник — открытый адрес api.silkagro.ru/api/prices/calc/, который использует сам сайт.
Официального соглашения о доступе нет: при изменении или закрытии адреса сбор просто
вернёт статус «failed», остальные источники продолжат работать.
"""
import json
import statistics
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

API = "https://api.silkagro.ru/api/prices/calc/"
SOURCE = "Цена Зерна"

# название культуры у нас -> (название в API, класс/подвид в API)
CROPS = {
    "Пшеница озимая": ("Пшеница", ""),
    "Подсолнечник": ("Подсолнечник", ""),
    "Кукуруза": ("Кукуруза", ""),
    "Ячмень яровой": ("Ячмень", ""),
    "Рожь": ("Рожь", ""),
}
# защита от явно ошибочных значений, ₽/т
BOUNDS = {"Подсолнечник": (10000, 90000)}
DEFAULT_BOUNDS = (3000, 40000)


def _get(culture: str, sub: str, timeout: int = 12, attempts: int = 1):
    """Запрос с одной повторной попыткой: первое соединение с сервером иногда обрывается."""
    q = urllib.parse.urlencode({"culture": culture, "sub_name": sub, "basis": "CPT"})
    req = urllib.request.Request(f"{API}?{q}", headers={
        "Accept": "application/json",
        "User-Agent": "AgroPort/2.0 (+https://agroport-ai.ru)",
    })
    last = None
    for _ in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            last = e
    raise last


def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _rows(crop: str, payload) -> list[dict]:
    """Плоский список цен закупщиков для одной культуры."""
    lo, hi = BOUNDS.get(crop, DEFAULT_BOUNDS)
    out = []
    groups = payload if isinstance(payload, list) else payload.get("results", [])
    for g in groups or []:
        for x in g.get("data") or []:
            price = _num(x.get("price"))
            if price is None or not (lo <= price <= hi):
                continue
            wh = x.get("warehouseObj") or {}
            cult = x.get("culture") or {}
            out.append({
                "source_price_id": str(x.get("priceId") or ""),
                "crop": crop,
                "crop_class": (cult.get("subName") or None),
                "price": price,
                "diff": _num(x.get("diffPrice")),
                "region": (wh.get("region") or g.get("city") or "").strip() or None,
                "warehouse": (wh.get("title") or x.get("warehouse") or "")[:255] or None,
                "company": (x.get("company") or "")[:255] or None,
                "inn": (x.get("companyInn") or "")[:20] or None,
                "railway": bool(x.get("railway")),
                "verified": bool(x.get("verified")),
                "specs": (x.get("specs") or "")[:500] or None,
                "lat": _num(wh.get("latCoord")),
                "lon": _num(wh.get("longCoord")),
                "date": (x.get("dateTime") or "")[:10] or None,
            })
    return [r for r in out if r["source_price_id"] and r["date"]]


def fetch_all() -> tuple[dict[str, list[dict]], str]:
    """Возвращает ({культура: [цены закупщиков]}, статус: ok | no_data | failed).
    Сервер источника медленно отвечает на одновременные запросы, поэтому не больше двух сразу."""
    res: dict[str, list[dict]] = {}
    errors = 0
    with ThreadPoolExecutor(max_workers=2) as ex:
        futs = {crop: ex.submit(_get, *api) for crop, api in CROPS.items()}
        for crop, f in futs.items():
            try:
                res[crop] = _rows(crop, f.result(timeout=20))
            except Exception as e:
                print(f"[cenazerna] {crop}: {e}")
                errors += 1
    if errors == len(CROPS):
        return {}, "failed"
    return res, ("ok" if any(res.values()) else "no_data")


def summarize(rows: list[dict]) -> dict | None:
    """Сводка по культуре на последнюю дату: медиана, разброс, число закупщиков и регионов."""
    if not rows:
        return None
    last = max(r["date"] for r in rows)
    day = [r for r in rows if r["date"] == last]
    prices = [r["price"] for r in day]
    diffs = [r["diff"] for r in day if r["diff"] is not None]
    med = statistics.median(prices)
    return {
        "price": round(med),
        "min": round(min(prices)),
        "max": round(max(prices)),
        "n": len(prices),
        "companies": len({r["company"] for r in day if r["company"]}),
        "regions": len({r["region"] for r in day if r["region"]}),
        "day_change": round(statistics.median(diffs)) if diffs else None,
        "date": last,
    }


def save(cur, schema: str, by_crop: dict[str, list[dict]]) -> int:
    """Сохраняет все цены одним запросом; повтор той же цены в тот же день только обновляет время сбора."""
    rows = [r for rs in by_crop.values() for r in rs]
    if not rows:
        return 0
    cols = ["source_price_id", "crop", "crop_class", "price", "diff", "region", "warehouse", "company",
            "inn", "railway", "verified", "specs", "lat", "lon", "date"]
    payload = json.dumps([{c: r[c] for c in cols} for r in rows], ensure_ascii=False)
    cur.execute(
        f"""INSERT INTO {schema}.buyer_prices
            (source, source_price_id, crop, crop_class, price_rub_t, diff_rub_t, basis, region,
             warehouse, company, company_inn, railway, verified, specs, lat, lon, price_date)
            SELECT 'cenazerna', x.source_price_id, x.crop, x.crop_class, x.price, x.diff, 'CPT', x.region,
                   x.warehouse, x.company, x.inn, x.railway, x.verified, x.specs, x.lat, x.lon, x.date
            FROM jsonb_to_recordset(%s::jsonb) AS x(
                source_price_id text, crop text, crop_class text, price numeric, diff numeric, region text,
                warehouse text, company text, inn text, railway boolean, verified boolean, specs text,
                lat numeric, lon numeric, date date)
            ON CONFLICT (source, source_price_id, price_date) DO UPDATE
              SET price_rub_t = EXCLUDED.price_rub_t, diff_rub_t = EXCLUDED.diff_rub_t, fetched_at = now()""",
        (payload,))
    return max(cur.rowcount, 0)
