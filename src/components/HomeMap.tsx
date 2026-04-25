import { useState } from "react";
import { MAP_REGIONS, getRiskColor } from "@/pages/data";

interface HomeMapProps {
  selectedRegion: string | null;
  onSelect: (id: string) => void;
  aiRisks?: Record<string, { total_risk_pct: number; total_risk_level: string; yield_cha: number; price_rub_t: number; price_change_pct: number; drought_risk_pct: number; frost_risk_pct: number; pest_risk_pct: number }>;
}

export default function HomeMap({ selectedRegion, onSelect, aiRisks = {} }: HomeMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full" style={{ minHeight: 300 }}>
      <svg
        viewBox="0 0 1000 600"
        className="w-full h-full"
        style={{ minHeight: 300, background: "linear-gradient(135deg, #f0f9f4 0%, #e8f5e9 100%)", borderRadius: 12 }}
      >
        <defs>
          <radialGradient id="hmap-bg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#2E7D32" stopOpacity="0" />
          </radialGradient>
          <filter id="hmap-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>

        <rect width="1000" height="600" fill="url(#hmap-bg)" />

        {/* Лёгкая сетка */}
        {[200,400,600,800].map(x => (
          <line key={`hx${x}`} x1={x} y1="0" x2={x} y2="600" stroke="#2E7D32" strokeOpacity="0.05" strokeWidth="0.5" />
        ))}
        {[150,300,450].map(y => (
          <line key={`hy${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="#2E7D32" strokeOpacity="0.05" strokeWidth="0.5" />
        ))}

        <text x="500" y="25" textAnchor="middle" fill="#2E7D32" fillOpacity="0.2" fontSize="10" fontFamily="IBM Plex Mono, monospace" letterSpacing="3">РОССИЯ · АГРОМОНИТОРИНГ</text>

        {MAP_REGIONS.map(r => {
          const ai = aiRisks[r.id];
          const riskValue = ai ? Math.round(ai.total_risk_pct) : r.risk;
          const color = getRiskColor(riskValue);
          const isSelected = selectedRegion === r.id;
          const isHovered = hovered === r.id;
          const isActive = isSelected || isHovered;
          const radius = 3 + (r.area / 50) * 5;
          const shortName = r.name.length > 8 ? r.name.slice(0, 8) : r.name;

          return (
            <g
              key={r.id}
              onClick={() => onSelect(r.id)}
              onMouseEnter={() => setHovered(r.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Ореол */}
              <circle
                cx={r.x} cy={r.y}
                r={radius + 6}
                fill={color}
                fillOpacity={isActive ? 0.15 : 0.07}
                stroke={color}
                strokeOpacity={isActive ? 0.25 : 0.12}
                strokeWidth="1"
              />
              {/* Маркер */}
              <circle
                cx={r.x} cy={r.y}
                r={radius}
                fill={isActive ? color : color + "bb"}
                stroke="white"
                strokeWidth={isActive ? 2 : 1.5}
                filter={isActive ? "url(#hmap-shadow)" : undefined}
              />
              <circle cx={r.x} cy={r.y} r={1.5} fill="white" fillOpacity="0.85" />
              {/* Подпись */}
              <text
                x={r.x} y={r.y + radius + 10}
                textAnchor="middle"
                fill="#1a1a1a"
                fillOpacity={isActive ? 0.85 : 0.5}
                fontSize={isActive ? "8.5" : "7.5"}
                fontFamily="Golos Text, sans-serif"
                fontWeight={isActive ? "600" : "400"}
              >
                {shortName}
              </text>
              {/* AI-риск если есть */}
              {ai && (
                <text
                  x={r.x} y={r.y + radius + 19}
                  textAnchor="middle"
                  fill={color}
                  fontSize="7"
                  fontFamily="IBM Plex Mono, monospace"
                  fontWeight="700"
                >
                  {Math.round(ai.total_risk_pct)}%
                </text>
              )}
            </g>
          );
        })}

        <text x="500" y="590" textAnchor="middle" fill="#2E7D32" fillOpacity="0.2" fontSize="8" fontFamily="IBM Plex Mono, monospace" letterSpacing="2">SENTINEL-2 · РОСГИДРОМЕТ · НТБ</text>
      </svg>
    </div>
  );
}
