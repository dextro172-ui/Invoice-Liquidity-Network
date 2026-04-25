import React from "react";

interface MetricCardProps {
  id: string;
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  id,
  icon,
  label,
  value,
  sub,
  accent = false,
}) => {
  return (
    <div
      id={id}
      className={`flex flex-col gap-3 rounded-[20px] border p-5 transition-shadow hover:shadow-lg ${
        accent
          ? "border-primary/30 bg-primary-container/10"
          : "border-outline-variant/15 bg-surface-container-lowest"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-xl ${
            accent ? "text-primary" : "text-on-surface-variant"
          }`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          {label}
        </span>
      </div>
      <p className={`font-headline text-2xl font-bold ${accent ? "text-primary" : "text-on-surface"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-on-surface-variant">{sub}</p>}
    </div>
  );
};

export default MetricCard;
