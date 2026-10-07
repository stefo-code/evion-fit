import { cn } from "@/lib/utils";
import type { DataQuality } from "@/lib/demo-data";
import { Info, X } from "lucide-react";
import { useState, type ReactNode } from "react";

export function Section({
  titel,
  aktion,
  children,
  className,
}: {
  titel?: string;
  aktion?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      {(titel || aktion) && (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          {titel && <h2 className="label-xs truncate">{titel}</h2>}
          {aktion}
        </div>
      )}
      {children}
    </section>
  );
}

export function Card({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article";
}) {
  return <As className={cn("surface p-5", className)}>{children}</As>;
}

export function Ring({
  value,
  size = 132,
  stroke = 11,
  label,
  sub,
  tone = "primary",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
  tone?: "primary" | "info" | "accent" | "warning";
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const toneVar = {
    primary: "var(--primary)",
    info: "var(--info)",
    accent: "var(--accent)",
    warning: "var(--warning)",
  }[tone];

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={toneVar}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-3xl font-bold leading-none">{label ?? Math.round(pct)}</span>
        {sub && <span className="label-xs mt-1">{sub}</span>}
      </div>
    </div>
  );
}

export function Bar({
  value,
  tone = "primary",
  className,
}: {
  value: number;
  tone?: "primary" | "info" | "accent" | "warning" | "muted";
  className?: string;
}) {
  const bg = {
    primary: "var(--primary)",
    info: "var(--info)",
    accent: "var(--accent)",
    warning: "var(--warning)",
    muted: "var(--muted-foreground)",
  }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(2, Math.min(100, value))}%`,
          background: bg,
          transition: "width 900ms cubic-bezier(.22,1,.36,1)",
        }}
      />
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  delta,
  tone = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  tone?: "default" | "good" | "warn";
}) {
  return (
    <div className="min-w-0">
      <p className="label-xs truncate">{label}</p>
      <p className="num mt-1 text-2xl font-bold leading-none">
        {value}
        {unit && <span className="ml-1 text-sm font-semibold text-muted-foreground">{unit}</span>}
      </p>
      {delta && (
        <p
          className={cn(
            "mt-1 text-xs font-semibold",
            tone === "good" && "text-success",
            tone === "warn" && "text-warning",
            tone === "default" && "text-muted-foreground",
          )}
        >
          {delta}
        </p>
      )}
    </div>
  );
}

export function QualityTag({ quality }: { quality: DataQuality }) {
  const map: Record<DataQuality, string> = {
    gemessen: "border-success/40 text-success",
    geschätzt: "border-warning/40 text-warning",
    berechnet: "border-info/40 text-info",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        map[quality],
      )}
    >
      {quality}
    </span>
  );
}

export function InfoSheet({
  titel,
  punkte,
  open,
  onClose,
}: {
  titel: string;
  punkte: string[];
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Schließen" onClick={onClose} className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
      <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 pb-8 animate-in slide-in-from-bottom">
        <div className="flex items-center gap-3">
          <p className="font-display text-base font-extrabold">{titel}</p>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {punkte.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


export function Chip({
  children,
  active,
  onClick,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Disclaimer({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-border bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}
