import Icon from "@/components/ui/icon";
import { SingleForecast, riskColor, riskLabel, confBadge } from "./AiModelTypes";

interface AiModelSingleTabProps {
  single: SingleForecast;
}

export default function AiModelSingleTab({ single }: AiModelSingleTabProps) {
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Yield */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <Icon name="Wheat" size={15} />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">Урожайность</div>
            <div className="text-[10px] text-muted-foreground">LSTM + ансамбль</div>
          </div>
        </div>
        <div className="text-3xl font-bold font-mono text-primary mb-1">
          {single.yield_forecast.yield_cha} <span className="text-base font-normal text-muted-foreground">ц/га</span>
        </div>
        <div className="text-xs text-muted-foreground mb-4">
          Диапазон: {single.yield_forecast.yield_low} – {single.yield_forecast.yield_high} ц/га
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Уверенность</span>
            <span className={`font-mono font-bold px-1.5 rounded border ${confBadge(single.yield_forecast.confidence_pct)}`}>
              {single.yield_forecast.confidence_pct}%
            </span>
          </div>
          <div className="h-2 bg-border rounded-full">
            <div className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${single.yield_forecast.confidence_pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>LSTM сигнал</span>
            <span className="font-mono">{single.yield_forecast.lstm_signal}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Дисконт рисков</span>
            <span className="font-mono text-destructive">−{single.yield_forecast.risk_discount_pct}%</span>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
            <Icon name="DollarSign" size={15} />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">Цена</div>
            <div className="text-[10px] text-muted-foreground">ARIMA + Prophet + NLP</div>
          </div>
        </div>
        <div className={`text-3xl font-bold font-mono mb-1 ${single.price_forecast.trend === "up" ? "text-primary" : "text-destructive"}`}>
          {single.price_forecast.price_rub_t.toLocaleString()} <span className="text-base font-normal text-muted-foreground">₽/т</span>
        </div>
        <div className="text-xs text-muted-foreground mb-4">
          {single.price_forecast.price_low.toLocaleString()} – {single.price_forecast.price_high.toLocaleString()} ₽/т
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Изменение</span>
            <span className={`font-mono font-bold ${single.price_forecast.change_pct > 0 ? "text-primary" : "text-destructive"}`}>
              {single.price_forecast.change_pct > 0 ? "+" : ""}{single.price_forecast.change_pct}%
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Уверенность</span>
            <span className={`font-mono font-bold px-1.5 rounded border ${confBadge(single.price_forecast.confidence_pct)}`}>
              {single.price_forecast.confidence_pct}%
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Декомпозиция</div>
            {[
              { label: "ARIMA тренд", value: single.price_forecast.components.arima_rub.toLocaleString() + " ₽" },
              { label: "Сезонность", value: (single.price_forecast.components.seasonal_rub > 0 ? "+" : "") + single.price_forecast.components.seasonal_rub.toLocaleString() + " ₽" },
              { label: "NLP сигнал", value: (single.price_forecast.components.news_signal_pct > 0 ? "+" : "") + single.price_forecast.components.news_signal_pct + "%" },
              { label: "Урожай-эффект", value: single.price_forecast.components.yield_effect_rub.toLocaleString() + " ₽" },
            ].map((r, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-mono text-foreground">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${riskColor(single.risk_assessment.total_risk_level)}20`, color: riskColor(single.risk_assessment.total_risk_level) }}>
            <Icon name="ShieldAlert" size={15} />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">Риски</div>
            <div className="text-[10px] text-muted-foreground">Вероятностная модель</div>
          </div>
        </div>
        <div className="text-3xl font-bold font-mono mb-1"
          style={{ color: riskColor(single.risk_assessment.total_risk_level) }}>
          {single.risk_assessment.total_risk_pct}% <span className="text-sm font-normal text-muted-foreground">{riskLabel(single.risk_assessment.total_risk_level)}</span>
        </div>
        <div className="h-2 bg-border rounded-full mb-4">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${single.risk_assessment.total_risk_pct}%`, backgroundColor: riskColor(single.risk_assessment.total_risk_level) }} />
        </div>
        <div className="space-y-2">
          {[
            { label: "Засуха", value: single.risk_assessment.drought_risk_pct, icon: "Sun" },
            { label: "Заморозки", value: single.risk_assessment.frost_risk_pct, icon: "Snowflake" },
            { label: "Вредители", value: single.risk_assessment.pest_risk_pct, icon: "Bug" },
          ].map((r, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground flex items-center gap-1"><Icon name={r.icon as string} size={10} />{r.label}</span>
                <span className="font-mono font-bold" style={{ color: riskColor(r.value > 65 ? "high" : r.value > 35 ? "medium" : "low") }}>{r.value}%</span>
              </div>
              <div className="h-1.5 bg-border rounded-full">
                <div className="h-full rounded-full transition-all" style={{ width: `${r.value}%`, backgroundColor: riskColor(r.value > 65 ? "high" : r.value > 35 ? "medium" : "low") }} />
              </div>
            </div>
          ))}
        </div>
        {single.risk_assessment.recommendations.length > 0 && (
          <div className="mt-4 space-y-2">
            {single.risk_assessment.recommendations.map((rec, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-secondary/50 border border-border text-xs text-foreground">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono uppercase mr-1.5 ${rec.priority === "high" ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent"}`}>{rec.priority === "high" ? "срочно" : "рекомендовано"}</span>
                {rec.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overall confidence */}
      <div className="lg:col-span-3 glass-card rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Icon name="Cpu" size={16} className="text-primary" />
            <span className="text-sm font-semibold">Общая уверенность модели</span>
            <span className={`px-3 py-1 text-sm font-bold font-mono rounded-lg border ${confBadge(single.model_confidence_overall)}`}>
              {single.model_confidence_overall}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            Сгенерировано: {single.generated_at} · горизонт {single.horizon_months} мес
          </div>
        </div>
      </div>
    </div>
  );
}
