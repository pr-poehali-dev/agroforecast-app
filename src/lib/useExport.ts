import { FORECAST_DATA, PROFITABILITY_DATA, RISK_DATA, MAP_REGIONS, SUPPLY_DATA, EXPORT_DATA } from "@/pages/data";

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map(row => row.map(escape).join(",")).join("\n");
}

function downloadBlob(content: string, filename: string, mime: string) {
  const bom = mime.includes("csv") ? "\uFEFF" : "";
  const blob = new Blob([bom + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Экспорт прогнозов цен (XLSX = CSV с расширением xlsx) ───────────────────

export function exportForecastsXlsx() {
  const headers = ["Культура", "Цена текущая (₽/т)", "Прогноз (₽/т)", "Изменение (%)", "Уверенность (%)", "Тренд", "Урожайность текущая (ц/га)", "Прогноз урожайности (ц/га)"];
  const rows = FORECAST_DATA.map(f => [
    f.crop, f.currentPrice, f.forecastPrice,
    f.change, f.confidence, f.trend === "up" ? "Рост" : "Снижение",
    f.yield, f.yieldForecast,
  ]);
  downloadBlob(toCsv(headers, rows), `agro_forecast_${today()}.csv`, "text/csv;charset=utf-8");
}

// ─── Экспорт рентабельности ───────────────────────────────────────────────────

export function exportProfitabilityCsv() {
  const headers = ["Культура", "Выручка/га (₽)", "Затраты/га (₽)", "Прибыль/га (₽)", "Маржа (%)", "ROI (%)"];
  const rows = PROFITABILITY_DATA.map(p => [
    p.crop, p.revenue, p.cost, p.revenue - p.cost, p.margin, p.roi,
  ]);
  downloadBlob(toCsv(headers, rows), `agro_profitability_${today()}.csv`, "text/csv;charset=utf-8");
}

// ─── Выгрузка для 1С (JSON) ───────────────────────────────────────────────────

export function exportFor1C() {
  const data = {
    meta: {
      version: "1.0",
      generated: new Date().toISOString(),
      source: "AgroForecast Pro — Поволжье",
      period: "Апрель 2026",
    },
    crops: FORECAST_DATA.map(f => ({
      name: f.crop,
      price_current_rub_t: f.currentPrice,
      price_forecast_rub_t: f.forecastPrice,
      price_change_pct: f.change,
      yield_current_cha: f.yield,
      yield_forecast_cha: f.yieldForecast,
    })),
    profitability: PROFITABILITY_DATA.map(p => ({
      name: p.crop,
      revenue_per_ha: p.revenue,
      cost_per_ha: p.cost,
      profit_per_ha: p.revenue - p.cost,
      margin_pct: p.margin,
      roi_pct: p.roi,
    })),
    regions: MAP_REGIONS.map(r => ({
      id: r.id,
      name: r.name,
      risk_index: r.risk,
      ndvi: r.ndvi,
      rain_mm: r.rain,
      temp_c: r.temp,
      area_kha: r.area,
    })),
    supply_demand: SUPPLY_DATA.map(s => ({
      month: s.month,
      supply_kt: s.supply,
      demand_kt: s.demand,
      balance_kt: s.supply - s.demand,
    })),
  };
  downloadBlob(JSON.stringify(data, null, 2), `agro_1c_export_${today()}.json`, "application/json");
}

// ─── PDF — аналитический отчёт через print ────────────────────────────────────

export function exportAnalyticsPdf() {
  const date = new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });

  const riskRows = RISK_DATA.map(r => `
    <tr>
      <td>${r.region}</td>
      <td>${r.type}</td>
      <td>${r.crop}</td>
      <td style="color:${r.color};font-weight:700">${r.risk}%</td>
      <td style="color:${r.color}">${r.level === "critical" ? "Критический" : r.level === "high" ? "Высокий" : r.level === "medium" ? "Средний" : "Низкий"}</td>
    </tr>`).join("");

  const forecastRows = FORECAST_DATA.map(f => `
    <tr>
      <td>${f.crop}</td>
      <td>${f.currentPrice.toLocaleString("ru")} ₽</td>
      <td style="font-weight:700">${f.forecastPrice.toLocaleString("ru")} ₽</td>
      <td style="color:${f.trend === "up" ? "#10b981" : "#ef4444"};font-weight:700">${f.change > 0 ? "+" : ""}${f.change}%</td>
      <td>${f.confidence}%</td>
      <td>${f.yield} → ${f.yieldForecast} ц/га</td>
    </tr>`).join("");

  const profRows = PROFITABILITY_DATA.map(p => `
    <tr>
      <td>${p.crop}</td>
      <td>${p.revenue.toLocaleString("ru")} ₽</td>
      <td>${p.cost.toLocaleString("ru")} ₽</td>
      <td style="font-weight:700">${(p.revenue - p.cost).toLocaleString("ru")} ₽</td>
      <td style="color:${p.margin > 35 ? "#10b981" : p.margin > 25 ? "#f59e0b" : "#ef4444"};font-weight:700">${p.margin}%</td>
      <td style="font-weight:700">${p.roi}%</td>
    </tr>`).join("");

  const exportRows = EXPORT_DATA.map(e => `
    <tr>
      <td>${e.direction}</td>
      <td>${e.volume.toLocaleString("ru")} тыс. т</td>
      <td>${e.share}%</td>
      <td style="color:${e.trend === "up" ? "#10b981" : e.trend === "down" ? "#ef4444" : "#94a3b8"}">${e.trend === "up" ? "↑ Рост" : e.trend === "down" ? "↓ Снижение" : "→ Стабильно"}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<title>AgroForecast Pro — Аналитический отчёт</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; color: #1a1a1a; font-size: 12px; background: #fff; }
  .page { padding: 24mm 20mm; max-width: 210mm; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #10b981; }
  .logo { font-size: 20px; font-weight: 800; color: #10b981; }
  .logo span { color: #1a1a1a; }
  .meta { text-align: right; color: #666; font-size: 10px; }
  h2 { font-size: 14px; font-weight: 700; color: #10b981; margin: 20px 0 10px; padding-left: 10px; border-left: 3px solid #10b981; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
  th { background: #f0fdf4; color: #166534; font-weight: 700; padding: 8px 10px; text-align: left; border-bottom: 2px solid #10b981; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #fafafa; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
  .badge-green { background: #d1fae5; color: #065f46; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #999; font-size: 10px; display: flex; justify-content: space-between; }
  .summary-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
  .summary-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; }
  .summary-card .val { font-size: 18px; font-weight: 800; color: #10b981; }
  .summary-card .lbl { font-size: 10px; color: #666; margin-top: 2px; }
  @media print { @page { margin: 0; } .page { padding: 15mm; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="logo">Agro<span>Forecast</span> Pro</div>
      <div style="color:#666;font-size:10px;margin-top:4px">Поволжье · Аналитический отчёт</div>
    </div>
    <div class="meta">
      <div style="font-weight:700;font-size:14px">${date}</div>
      <div>Данные: НТБ, Росгидромет, Минсельхоз РФ</div>
      <div>Горизонт прогноза: +3 месяца</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card"><div class="val">8</div><div class="lbl">Регионов под мониторингом</div></div>
    <div class="summary-card"><div class="val">87%</div><div class="lbl">Точность прогнозов AI</div></div>
    <div class="summary-card"><div class="val">13 650 ₽/т</div><div class="lbl">Пшеница сейчас (НТБ)</div></div>
    <div class="summary-card"><div class="val">85.9 млн т</div><div class="lbl">Прогноз урожая РФ (СовЭкон)</div></div>
  </div>

  <h2>Прогнозы цен и урожайности (апрель 2026)</h2>
  <table>
    <thead><tr><th>Культура</th><th>Цена сейчас</th><th>Прогноз +3 мес</th><th>Изменение</th><th>Уверенность</th><th>Урожайность</th></tr></thead>
    <tbody>${forecastRows}</tbody>
  </table>

  <h2>Рентабельность производства (₽/га)</h2>
  <table>
    <thead><tr><th>Культура</th><th>Выручка/га</th><th>Затраты/га</th><th>Прибыль/га</th><th>Маржа</th><th>ROI</th></tr></thead>
    <tbody>${profRows}</tbody>
  </table>

  <h2>Риски по регионам</h2>
  <table>
    <thead><tr><th>Регион</th><th>Тип риска</th><th>Культура</th><th>Индекс риска</th><th>Уровень</th></tr></thead>
    <tbody>${riskRows}</tbody>
  </table>

  <h2>Экспортные потоки зерна (сезон 2025/26)</h2>
  <table>
    <thead><tr><th>Направление</th><th>Объём</th><th>Доля</th><th>Тренд</th></tr></thead>
    <tbody>${exportRows}</tbody>
  </table>

  <div class="footer">
    <span>AgroForecast Pro · Поволжье · ${date}</span>
    <span>Источники: НТБ, СовЭкон, Росгидромет, Минсельхоз РФ, CBOT · Данные апрель 2026</span>
  </div>
</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

// ─── Коммерческое предложение (PDF через print) ───────────────────────────────

export function exportCommercialPdf() {
  const date = new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  const bestCrop = [...PROFITABILITY_DATA].sort((a, b) => b.roi - a.roi)[0];

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<title>Коммерческое предложение AgroForecast Pro</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Arial',sans-serif; color:#1a1a1a; background:#fff; }
  .page { padding:24mm 20mm; max-width:210mm; margin:0 auto; }
  .header { background:linear-gradient(135deg,#065f46,#10b981); color:#fff; padding:28px 32px; border-radius:12px; margin-bottom:28px; }
  .header h1 { font-size:22px; font-weight:800; margin-bottom:4px; }
  .header p { opacity:0.85; font-size:12px; }
  h2 { font-size:14px; font-weight:700; color:#065f46; margin:20px 0 10px; }
  p { font-size:12px; line-height:1.7; color:#374151; margin-bottom:10px; }
  .highlight { background:#f0fdf4; border-left:4px solid #10b981; padding:12px 16px; border-radius:0 8px 8px 0; margin:16px 0; }
  .highlight strong { color:#065f46; }
  table { width:100%; border-collapse:collapse; font-size:11px; margin:12px 0; }
  th { background:#065f46; color:#fff; padding:8px 12px; text-align:left; }
  td { padding:7px 12px; border-bottom:1px solid #e5e7eb; }
  tr:nth-child(even) td { background:#f9fafb; }
  .footer { margin-top:28px; padding-top:14px; border-top:2px solid #10b981; color:#666; font-size:10px; text-align:center; }
  .cta { background:#10b981; color:#fff; padding:14px 24px; border-radius:8px; text-align:center; margin:20px 0; font-weight:700; font-size:14px; }
  @media print { @page { margin:0; } .page { padding:15mm; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>AgroForecast Pro — Поволжье</h1>
    <p>Аналитическая платформа для принятия решений в АПК · ${date}</p>
  </div>

  <h2>О платформе</h2>
  <p>AgroForecast Pro — единственная в Поволжье платформа, объединяющая спутниковый мониторинг посевов (Sentinel-2), прогнозирование цен на основе ARIMA+LSTM и рисков на основе вероятностных моделей. Данные обновляются ежедневно.</p>

  <div class="highlight">
    <strong>Топ-культура апреля 2026:</strong> ${bestCrop.crop} — ROI ${bestCrop.roi}%, маржа ${bestCrop.margin}%, текущая цена закупки ${FORECAST_DATA.find(f => f.crop === bestCrop.crop)?.currentPrice.toLocaleString("ru") ?? "—"} ₽/т.
  </div>

  <h2>Ключевые возможности</h2>
  <table>
    <thead><tr><th>Модуль</th><th>Что даёт</th><th>Точность</th></tr></thead>
    <tbody>
      <tr><td>Прогноз цен (ARIMA+LSTM)</td><td>Прогноз на 3–12 мес для 12 культур</td><td>MAPE < 10%</td></tr>
      <tr><td>NDVI-мониторинг (Sentinel-2)</td><td>Состояние посевов, аномалии, урожай</td><td>MAPE < 13%</td></tr>
      <tr><td>AI-модель рисков</td><td>Засуха, заморозки, вредители по 8 регионам</td><td>87.2%</td></tr>
      <tr><td>Планировщик посевов</td><td>Оптимальная структура под цели хозяйства</td><td>—</td></tr>
      <tr><td>Калькулятор рентабельности</td><td>ROI, маржа, лучший срок продаж</td><td>—</td></tr>
    </tbody>
  </table>

  <h2>Прогнозы цен на ближайшие 3 месяца</h2>
  <table>
    <thead><tr><th>Культура</th><th>Цена сейчас</th><th>Прогноз</th><th>Изменение</th></tr></thead>
    <tbody>
      ${FORECAST_DATA.map(f => `<tr><td>${f.crop}</td><td>${f.currentPrice.toLocaleString("ru")} ₽/т</td><td><strong>${f.forecastPrice.toLocaleString("ru")} ₽/т</strong></td><td style="color:${f.trend === "up" ? "#10b981" : "#ef4444"}">${f.change > 0 ? "+" : ""}${f.change}%</td></tr>`).join("")}
    </tbody>
  </table>

  <h2>Тарифы</h2>
  <table>
    <thead><tr><th>Тариф</th><th>Стоимость</th><th>Основные возможности</th></tr></thead>
    <tbody>
      <tr><td>Базовый</td><td>Бесплатно</td><td>3 культуры, базовая карта, новости</td></tr>
      <tr><td><strong>Профессионал ⭐</strong></td><td><strong>1 490 ₽/мес</strong></td><td>12 культур, AI-прогнозы, NDVI, экспорт</td></tr>
      <tr><td>Корпоративный</td><td>8 900 ₽/мес</td><td>API, интеграция 1С/SAP, B2G отчёты</td></tr>
    </tbody>
  </table>

  <div class="cta">Начать бесплатно: agroforecast.poehali.dev</div>

  <div class="footer">
    Данные: НТБ · СовЭкон · Росгидромет · Минсельхоз РФ · CBOT · Sentinel-2 (ESA) · апрель 2026<br/>
    AgroForecast Pro — платформа для агробизнеса Поволжья
  </div>
</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
