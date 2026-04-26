import React from "react";
import Icon from "@/components/ui/icon";
import { Listing, SOURCE_LABELS, fmt, timeAgo } from "./BoardTypes";

interface BoardListingCardProps {
  listing: Listing;
  isExpanded: boolean;
  onToggleExpand: (id: number) => void;
}

export const BoardListingCard: React.FC<BoardListingCardProps> = ({
  listing: l, isExpanded, onToggleExpand,
}) => {
  const isSell = l.type === "sell";
  const src = SOURCE_LABELS[l.source] ?? { label: l.source, color: "bg-gray-100 text-gray-600" };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        {/* Left: type badge + crop */}
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ${
            isSell ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
          }`}>
            {isSell ? "ПРОДАЖА" : "ПОКУПКА"}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-bold text-sm text-foreground">{l.crop}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Icon name="MapPin" size={11} />
                {l.region}
              </span>
            </div>
            {l.quality && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{l.quality}</p>
            )}
            {l.description && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{l.description}</p>
            )}
          </div>
        </div>

        {/* Right: price */}
        <div className="text-right shrink-0">
          <p className={`text-xl font-heading font-black ${isSell ? "text-emerald-600" : "text-blue-600"}`}>
            {fmt(l.price_per_ton)} ₽/т
          </p>
          {l.volume_tons && (
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {fmt(l.volume_tons)} т
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${src.color}`}>
          {src.label}
        </span>
        <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
          <Icon name="Clock" size={10} />
          {timeAgo(l.created_at)}
        </span>

        {l.source_url && l.source !== "user" && (
          <a href={l.source_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/70 transition-colors border border-primary/20 rounded-lg px-2 py-0.5">
            <Icon name="ExternalLink" size={11} />
            Оригинал объявления
          </a>
        )}

        {l.contact && (
          <button
            onClick={() => onToggleExpand(l.id)}
            className="ml-auto flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Icon name={isExpanded ? "EyeOff" : "Phone"} size={12} />
            {isExpanded ? "Скрыть" : "Показать контакт"}
          </button>
        )}
      </div>

      {/* Contact reveal */}
      {isExpanded && l.contact && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-primary/5 border border-primary/15 rounded-xl text-sm text-foreground">
          <Icon name="Phone" size={14} className="text-primary shrink-0" />
          <span className="font-medium">{l.contact}</span>
        </div>
      )}
    </div>
  );
};
