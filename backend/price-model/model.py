"""
Модель прогноза цен производителей (руб/т) на горизонт h месяцев.

Цель: log(P[t+h] / P[t]) — относительное изменение цены.
Признаки на момент t (только то, что известно к t):
  1) импульс внутренней цены за 1, 3 и 12 мес.;
  2) изменение мировой цены в рублях (цена Всемирного банка × курс ЦБ) за 1 и 3 мес.;
  3) спред: log(внутренняя цена) − log(мировая цена в рублях) — отклонение от экспортного паритета;
  4) сезонность (sin/cos месяца).
Оценка: гребневая регрессия на стандартизованных признаках.
Итоговый прогноз: P[t] · exp(w · ŷ), где w ∈ [0..1] — степень доверия модели
(w = 0 означает «наивный» прогноз «цена не изменится»). λ и w подбираются
только на периоде валидации, оценка качества — на отложенном периоде.
"""
import math

def prev(k, n):
    y, m = int(k[:4]), int(k[5:7]) - n
    while m <= 0:
        m += 12; y -= 1
    while m > 12:
        m -= 12; y += 1
    return f"{y}-{m:02d}"


def features(k, P, Wr):
    need = (k, prev(k, 1), prev(k, 3), prev(k, 12))
    if any(x not in P for x in need):
        return None
    if any(x not in Wr for x in (k, prev(k, 1), prev(k, 3))):
        return None
    p = P[k]
    w0, w1, w3 = Wr[k], Wr[prev(k, 1)], Wr[prev(k, 3)]
    mo = int(k[5:7])
    return [1.0,
            math.log(p / P[prev(k, 1)]),
            math.log(p / P[prev(k, 3)]),
            math.log(p / P[prev(k, 12)]),
            w0 - w1, w0 - w3,
            math.log(p) - w0,
            math.sin(2 * math.pi * mo / 12), math.cos(2 * math.pi * mo / 12)]


def _solve(A, b):
    n = len(A)
    M = [row[:] + [b[i]] for i, row in enumerate(A)]
    for c in range(n):
        piv = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[piv] = M[piv], M[c]
        d = M[c][c] or 1e-12
        for r in range(n):
            if r != c:
                f = M[r][c] / d
                if f:
                    for j in range(c, n + 1):
                        M[r][j] -= f * M[c][j]
    return [M[i][n] / (M[i][i] or 1e-12) for i in range(n)]


def fit(X, y, lam):
    n, d = len(X), len(X[0])
    mu = [sum(r[j] for r in X) / n for j in range(d)]
    sd = [math.sqrt(sum((r[j] - mu[j]) ** 2 for r in X) / n) for j in range(d)]
    mu[0], sd[0] = 0.0, 1.0
    sd = [s if s > 0 else 1.0 for s in sd]
    Z = [[(r[j] - mu[j]) / sd[j] for j in range(d)] for r in X]
    A = [[sum(z[i] * z[j] for z in Z) for j in range(d)] for i in range(d)]
    for i in range(1, d):
        A[i][i] += lam
    b = [sum(Z[k][i] * y[k] for k in range(n)) for i in range(d)]
    return _solve(A, b), mu, sd


def predict_log(model, f):
    b, mu, sd = model
    return sum(b[j] * (f[j] - mu[j]) / sd[j] for j in range(len(f)))


def training_set(keys, P, Wr, h, cutoff, F):
    """Пары (признаки, цель), у которых цель известна к моменту cutoff."""
    X, y = [], []
    for k in keys:
        tk = prev(k, -h)
        if tk > cutoff:
            break
        f = F.get(k)
        if f and tk in P:
            X.append(f); y.append(math.log(P[tk] / P[k]))
    return X, y


def walk_forward(keys, P, Wr, h, lam, lo, hi, F, min_train=36):
    """Скользящая проверка: на каждом шаге модель обучается только на прошлом."""
    rows = []
    for t in keys:
        if not (lo <= t <= hi):
            continue
        tgt = prev(t, -h)
        f = F.get(t)
        if tgt not in P or not f:
            continue
        X, y = training_set(keys, P, Wr, h, t, F)
        if len(X) < min_train:
            continue
        rows.append((t, P[t], P[tgt], predict_log(fit(X, y, lam), f)))
    return rows


def mape(rows, w):
    if not rows:
        return None
    return 100.0 * sum(abs(p * math.exp(w * lp) - a) / a for _, p, a, lp in rows) / len(rows)


def quantile(xs, q):
    s = sorted(xs)
    if not s:
        return 0.0
    i = (len(s) - 1) * q
    lo, hi = int(math.floor(i)), int(math.ceil(i))
    return s[lo] + (s[hi] - s[lo]) * (i - lo)


LAMBDAS = (10.0, 50.0, 200.0)
WEIGHTS = (0.0, 0.25, 0.5, 0.75, 1.0)
VALID = ("2012-01", "2019-12")
TEST = ("2020-01", "2099-12")


def backtest(P, Wr, h):
    keys = sorted(P)
    F = {k: features(k, P, Wr) for k in keys}
    best = None
    for lam in LAMBDAS:
        v = walk_forward(keys, P, Wr, h, lam, VALID[0], VALID[1], F)
        for w in WEIGHTS:
            s = mape(v, w)
            if s is not None and (best is None or s < best[0]):
                best = (s, lam, w)
    _, lam, w = best
    t = walk_forward(keys, P, Wr, h, lam, TEST[0], TEST[1], F)
    m, n0 = mape(t, w), mape(t, 0.0)
    res = [math.log(a / (p * math.exp(w * lp))) for _, p, a, lp in t]
    q10, q90 = quantile(res, 0.1), quantile(res, 0.9)
    covered = sum(1 for r in res if q10 <= r <= q90)
    moved = [(lp, math.log(a / p)) for _, p, a, lp in t if w * lp != 0]
    dir_acc = (100.0 * sum(1 for lp, real in moved if (lp > 0) == (real > 0)) / len(moved)) if moved else None
    return {
        "params": {"lambda": lam, "weight": w, "valid_period": list(VALID),
                   "valid_mape": round(best[0], 2)},
        "metrics": {
            "mape": round(m, 2), "mape_naive": round(n0, 2),
            "skill_pct": round(100.0 * (1 - m / n0), 1) if n0 else None,
            "n": len(t), "test_from": t[0][0] if t else None, "test_to": t[-1][0] if t else None,
            "pi80": [round(q10, 4), round(q90, 4)],
            "dir_accuracy_pct": round(dir_acc, 1) if dir_acc is not None else None,
            "points": [{"t": a, "base": round(p), "actual": round(b), "pred": round(p * math.exp(w * lp))}
                       for a, p, b, lp in t],
        },
    }


def forecast(P, Wr, h, lam, w, pi80):
    """Прогноз от последней известной точки, модель обучена на всей истории."""
    keys = sorted(P)
    F = {k: features(k, P, Wr) for k in keys}
    last = keys[-1]
    X, y = training_set(keys, P, Wr, h, last, F)
    f = F.get(last)
    if not f or len(X) < 36:
        return None
    lp = w * predict_log(fit(X, y, lam), f)
    base = P[last]
    point = base * math.exp(lp)
    return {
        "base_period": last, "target_period": prev(last, -h), "base_price": round(base),
        "forecast": round(point), "change_pct": round(100 * (math.exp(lp) - 1), 2),
        "low80": round(point * math.exp(pi80[0])), "high80": round(point * math.exp(pi80[1])),
    }
