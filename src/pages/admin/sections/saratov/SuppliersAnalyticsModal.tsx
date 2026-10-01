import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";
import { Analytics } from "./shared";

// ── Модалка аналитики ────────────────────────────────────────────────────────
export default function AnalyticsModal({ region, onClose, onPick }: {
  region: string; onClose: () => void;
  onPick: (f: { district?: string; activity?: string; ownership?: string }) => void;
}) {
  const [data, setData] = useState<Analytics | null>(null);
  useEffect(() => { adminApi.getSupplierAnalytics(region).then(setData).catch(() => {}); }, [region]);
  const max = (arr: { count: number }[]) => Math.max(1, ...arr.map(x => x.count));

  const Bar = ({ label, count, total, onClick }: { label: string; count: number; total: number; onClick: () => void }) => (
    <button onClick={onClick} className="w-full text-left group">
      <div className="flex items-center justify-between text-[11px] mb-0.5">
        <span className="truncate group-hover:text-primary">{label}</span>
        <span className="text-muted-foreground shrink-0 ml-2">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full hero-gradient rounded-full" style={{ width: `${(count / total) * 100}%` }} />
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <Icon name="BarChart3" size={18} className="text-primary" />
            <h3 className="font-heading font-bold text-base">Аналитика · {region}</h3>
            {data && <span className="text-xs text-muted-foreground">{data.total} предприятий</span>}
          </div>
          <button onClick={onClose}><Icon name="X" size={18} className="text-muted-foreground" /></button>
        </div>
        {!data ? (
          <div className="flex justify-center py-16"><Icon name="Loader" size={24} className="animate-spin text-primary" /></div>
        ) : (
          <div className="p-5 grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <h4 className="text-xs font-heading font-bold flex items-center gap-1.5"><Icon name="MapPin" size={13} className="text-primary" />По районам</h4>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {data.by_district.map(d => (
                  <Bar key={d.district} label={d.district} count={d.count} total={max(data.by_district)}
                    onClick={() => onPick({ district: d.district.startsWith("—") ? "" : d.district })} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-heading font-bold flex items-center gap-1.5"><Icon name="Wheat" size={13} className="text-primary" />По видам деятельности</h4>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {data.by_activity.map(a => (
                  <Bar key={a.activity} label={a.activity} count={a.count} total={max(data.by_activity)}
                    onClick={() => onPick({ activity: a.activity })} />
                ))}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <h4 className="text-xs font-heading font-bold flex items-center gap-1.5"><Icon name="Building2" size={13} className="text-primary" />По форме собственности</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {data.by_ownership.map(o => (
                  <Bar key={o.ownership} label={o.ownership} count={o.count} total={max(data.by_ownership)}
                    onClick={() => onPick({ ownership: o.ownership.startsWith("—") ? "" : o.ownership })} />
                ))}
              </div>
            </div>
            <p className="md:col-span-2 text-[11px] text-muted-foreground flex items-center gap-1">
              <Icon name="MousePointerClick" size={12} />Нажмите на любую строку, чтобы отфильтровать базу
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
