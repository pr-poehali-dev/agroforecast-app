import { useState } from "react";
import { MAP_REGIONS, getRiskColor } from "@/pages/data";

interface VolgaMapProps {
  selectedRegion: string | null;
  onSelect: (id: string) => void;
}

// SVG viewBox: 0 0 1000 600 — схематичная карта России
// Координаты регионов заданы в data.ts (поле x, y)

function riskLabel(risk: number) {
  if (risk >= 65) return "Высокий";
  if (risk >= 40) return "Средний";
  return "Низкий";
}

export default function VolgaMap({ selectedRegion, onSelect }: VolgaMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const activeId = hovered || selectedRegion;
  const activeRegion = MAP_REGIONS.find(r => r.id === activeId);

  return (
    <div className="relative w-full" style={{ minHeight: 420 }}>
      <svg
        viewBox="0 0 1000 600"
        className="w-full h-full"
        style={{ minHeight: 380, background: "linear-gradient(135deg, #f0f9f4 0%, #e8f5e9 100%)", borderRadius: 12 }}
      >
        <defs>
          <radialGradient id="vmap-bg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#1B5E20" stopOpacity="0" />
          </radialGradient>
          <filter id="vmap-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
          </filter>
        </defs>

        <rect width="1000" height="600" fill="url(#vmap-bg)" />

        {/* Сетка */}
        {[100,200,300,400,500,600,700,800,900].map(x => (
          <line key={`vx${x}`} x1={x} y1="0" x2={x} y2="600" stroke="#2E7D32" strokeOpacity="0.06" strokeWidth="0.5" />
        ))}
        {[100,200,300,400,500].map(y => (
          <line key={`vy${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="#2E7D32" strokeOpacity="0.06" strokeWidth="0.5" />
        ))}

        {/* Контуры федеральных округов (условные) */}
        <text x="500" y="30" textAnchor="middle" fill="#2E7D32" fillOpacity="0.25" fontSize="11" fontFamily="Golos Text, sans-serif" letterSpacing="4">РОССИЙСКАЯ ФЕДЕРАЦИЯ · АГРОМОНИТОРИНГ</text>

        {/* Маркеры регионов */}
        {MAP_REGIONS.map(r => {
          const color = getRiskColor(r.risk);
          const isSelected = selectedRegion === r.id;
          const isHovered = hovered === r.id;
          const isActive = isSelected || isHovered;
          const radius = isActive ? 14 : 10;
          const shortName = r.name.length > 9 ? r.name.slice(0, 9) + "." : r.name;

          return (
            <g
              key={r.id}
              onClick={() => onSelect(r.id)}
              onMouseEnter={() => setHovered(r.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Пульсирующий ореол */}
              <circle
                cx={r.x} cy={r.y}
                r={radius + 8}
                fill={color}
                fillOpacity={isActive ? 0.15 : 0.07}
                stroke={color}
                strokeOpacity={isActive ? 0.3 : 0.15}
                strokeWidth="1"
              />
              {/* Основной маркер */}
              <circle
                cx={r.x} cy={r.y}
                r={radius}
                fill={isActive ? color : color + "cc"}
                stroke="white"
                strokeWidth={isActive ? 2.5 : 1.5}
                filter={isActive ? "url(#vmap-shadow)" : undefined}
              />
              {/* Центральная точка */}
              <circle cx={r.x} cy={r.y} r={3} fill="white" fillOpacity="0.9" />
              {/* Название региона */}
              <text
                x={r.x} y={r.y + radius + 12}
                textAnchor="middle"
                fill="#1a1a1a"
                fillOpacity={isActive ? 0.9 : 0.6}
                fontSize={isActive ? "9.5" : "8.5"}
                fontFamily="Golos Text, sans-serif"
                fontWeight={isActive ? "600" : "400"}
              >
                {shortName}
              </text>
              {/* Процент риска */}
              <text
                x={r.x} y={r.y + 4}
                textAnchor="middle"
                fill="white"
                fontSize="7"
                fontFamily="IBM Plex Mono, monospace"
                fontWeight="700"
              >
                {r.risk}%
              </text>
            </g>
          );
        })}

        {/* Легенда */}
        <g transform="translate(20, 545)">
          {[
            { color: "#ef4444", label: "Высокий риск (≥65%)" },
            { color: "#f59e0b", label: "Средний риск (40–65%)" },
            { color: "#10b981", label: "Низкий риск (<40%)" },
          ].map((l, i) => (
            <g key={i} transform={`translate(${i * 200}, 0)`}>
              <circle cx="6" cy="6" r="5" fill={l.color} />
              <text x="15" y="10" fill="#555" fontSize="9" fontFamily="Golos Text, sans-serif">{l.label}</text>
            </g>
          ))}
        </g>
      </svg>

      {/* Всплывающая карточка региона */}
      {activeRegion && (
        <div
          className="absolute bg-white rounded-xl shadow-lg border border-border p-4 text-xs z-10 pointer-events-none"
          style={{
            left: Math.min(activeRegion.x / 1000 * 100 + 5, 65) + "%",
            top: Math.max(activeRegion.y / 600 * 100 - 30, 2) + "%",
            minWidth: 200,
          }}
        >
          <div className="font-heading font-bold text-sm text-foreground mb-2">
            {activeRegion.name} {activeRegion.id !== "tatarstan" && activeRegion.id !== "bashkortostan" ? "обл." : ""}
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Индекс риска</span>
              <span className="font-mono font-bold" style={{ color: getRiskColor(activeRegion.risk) }}>
                {activeRegion.risk}% · {riskLabel(activeRegion.risk)}
              </span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${activeRegion.risk}%`, backgroundColor: getRiskColor(activeRegion.risk) }} />
            </div>
            <div className="flex justify-between"><span className="text-muted-foreground">NDVI</span><span className="font-mono">{activeRegion.ndvi.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Осадки</span><span className="font-mono">{activeRegion.rain} мм</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Температура</span><span className="font-mono">+{activeRegion.temp}°C</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Площадь пашни</span><span className="font-mono">{activeRegion.area} тыс. га</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Пшеница</span><span className="font-mono">{activeRegion.wheat_pct}%</span></div>
          </div>
          <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground">
            Нажмите для подробной информации
          </div>
        </div>
      )}
    </div>
  );
}
