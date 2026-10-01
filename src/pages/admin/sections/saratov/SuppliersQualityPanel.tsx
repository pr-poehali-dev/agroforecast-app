import Icon from "@/components/ui/icon";
import { QualityReport } from "./shared";

// ── Анализ качества данных ───────────────────────────────────────────────────
export default function SuppliersQualityPanel({ quality, qualityLoading, setShowQuality }: {
  quality: QualityReport | null;
  qualityLoading: boolean;
  setShowQuality: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-heading font-bold text-sm flex items-center gap-2">
            <Icon name="ClipboardCheck" size={15} className="text-primary" />
            Качество данных
            {quality && <span className="text-xs font-normal text-muted-foreground">· {quality.total} хозяйств в выборке</span>}
          </h4>
          <button onClick={() => setShowQuality(false)} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={16} />
          </button>
        </div>
        {qualityLoading ? (
          <div className="flex justify-center py-6"><Icon name="Loader" size={20} className="animate-spin text-primary" /></div>
        ) : !quality ? (
          <p className="text-xs text-muted-foreground">Не удалось загрузить анализ.</p>
        ) : quality.total === 0 ? (
          <p className="text-xs text-muted-foreground">В выборке нет хозяйств.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: "Без ИНН", val: quality.no_inn, icon: "Hash" },
                { label: "Без телефона", val: quality.no_phone, icon: "Phone" },
                { label: "Без эл. почты", val: quality.no_email, icon: "Mail" },
                { label: "Совсем без контактов", val: quality.no_contacts, icon: "UserX" },
                { label: "Без контактного лица", val: quality.no_person, icon: "User" },
                { label: "Без культур / продукции", val: quality.no_crops, icon: "Wheat" },
                { label: "Без района", val: quality.no_district, icon: "MapPin" },
                { label: "Без ИИ-досье", val: quality.no_analysis, icon: "Sparkles" },
              ].map(m => {
                const pct = quality.total ? Math.round((m.val / quality.total) * 100) : 0;
                const bad = pct >= 50;
                return (
                  <div key={m.label} className="rounded-lg border border-border p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon name={m.icon} size={12} className="text-primary" />{m.label}
                      </span>
                      <span className={`text-xs font-bold ${bad ? "text-rose-600" : m.val ? "text-amber-600" : "text-emerald-600"}`}>
                        {m.val} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full ${bad ? "bg-rose-500" : m.val ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${quality.duplicates ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
              <Icon name={quality.duplicates ? "CopyMinus" : "CheckCircle2"} size={14} className="shrink-0" />
              {quality.duplicates
                ? <span>Найдено дублей в выборке: <b>{quality.duplicates}</b>. Нажмите «Убрать дубли», чтобы очистить.</span>
                : <span>Дублей в выборке нет.</span>}
            </div>

            <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
              <Icon name="Lightbulb" size={12} className="text-amber-500 mt-0.5 shrink-0" />
              Показатели рассчитаны по текущим фильтрам. Заполнить пробелы поможет кнопка «ИИ-обогащение» (подтягивает контакты и досье из ЕГРЮЛ).
            </p>
          </>
        )}
      </div>
  );
}
