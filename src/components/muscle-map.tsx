import { useState } from "react";
import { muskelStatus, muscleStatusLabel, type MuscleKey, type MuscleStatus } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { Bar, Chip } from "@/components/ui-kit";

const farbe: Record<MuscleStatus, string> = {
  bereit: "var(--success)",
  regeneriert: "var(--warning)",
  belastet: "var(--destructive)",
  wenig: "var(--muted-foreground)",
};

type Shape = { key: MuscleKey; d: string };

const vorne: Shape[] = [
  { key: "schultern", d: "M40 62 q-14 2 -17 18 q10 6 19 3 z M100 62 q14 2 17 18 q-10 6 -19 3 z" },
  { key: "brust", d: "M46 62 q24 -8 48 0 l-3 26 q-21 8 -42 0 z" },
  { key: "bauch", d: "M56 92 q14 5 28 0 l-3 40 q-11 4 -22 0 z" },
  { key: "bizeps", d: "M28 84 q-8 18 -6 34 l12 3 q4 -20 8 -33 z M112 84 q8 18 6 34 l-12 3 q-4 -20 -8 -33 z" },
  { key: "quadrizeps", d: "M53 136 q11 4 22 0 l-2 62 q-11 4 -21 0 z M65 136 q0 0 0 0 z M78 136 q10 4 20 0 l0 62 q-11 4 -21 0 z" },
];

const hinten: Shape[] = [
  { key: "schultern", d: "M40 62 q-14 2 -17 18 q10 6 19 3 z M100 62 q14 2 17 18 q-10 6 -19 3 z" },
  { key: "ruecken", d: "M45 62 q25 -8 50 0 l-5 42 q-20 7 -40 0 z" },
  { key: "trizeps", d: "M27 84 q-9 18 -7 34 l12 3 q4 -20 9 -33 z M113 84 q9 18 7 34 l-12 3 q-4 -20 -9 -33 z" },
  { key: "gesaess", d: "M52 108 q18 8 36 0 l2 28 q-20 8 -40 0 z" },
  { key: "beinbeuger", d: "M53 140 q11 4 21 0 l-2 46 q-10 4 -19 0 z M79 140 q10 4 21 0 l-2 46 q-10 4 -19 0 z" },
  { key: "waden", d: "M56 192 q9 3 17 0 l-2 32 q-8 3 -14 0 z M81 192 q9 3 17 0 l-2 32 q-8 3 -14 0 z" },
];

export function MuscleMap() {
  const [seite, setSeite] = useState<"vorne" | "hinten">("vorne");
  const [sel, setSel] = useState<MuscleKey>("brust");
  const shapes = seite === "vorne" ? vorne : hinten;
  const m = muskelStatus[sel];
  const rest = Math.max(0, m.ziel - m.saetze);

  return (
    <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2">
          <Chip active={seite === "vorne"} onClick={() => setSeite("vorne")}>
            Vorne
          </Chip>
          <Chip active={seite === "hinten"} onClick={() => setSeite("hinten")}>
            Hinten
          </Chip>
        </div>
        <svg viewBox="0 0 140 240" className="h-72 w-auto">
          {/* Silhouette */}
          <g fill="var(--muted)" opacity="0.55">
            <circle cx="70" cy="30" r="16" />
            <path d="M44 54 q26 -10 52 0 l8 26 q-6 8 -12 6 l-4 -14 l-4 62 q-20 7 -40 0 l-4 -62 l-4 14 q-6 2 -12 -6 z" />
            <path d="M30 82 q-10 22 -8 44 l14 4 q4 -26 12 -42 z" />
            <path d="M110 82 q10 22 8 44 l-14 4 q-4 -26 -12 -42 z" />
            <path d="M50 132 q20 8 40 0 l-4 96 q-12 4 -16 0 l-2 -60 l-2 60 q-4 4 -16 0 z" />
          </g>
          {shapes.map((s) => {
            const st = muskelStatus[s.key];
            const aktiv = sel === s.key;
            return (
              <path
                key={s.key + seite}
                d={s.d}
                fill={farbe[st.status]}
                opacity={aktiv ? 1 : 0.72}
                stroke={aktiv ? "var(--foreground)" : "transparent"}
                strokeWidth={1.4}
                className="cursor-pointer transition-opacity hover:opacity-100"
                onClick={() => setSel(s.key)}
              />
            );
          })}
        </svg>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {(Object.keys(muscleStatusLabel) as MuscleStatus[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: farbe[k] }} />
              {muscleStatusLabel[k]}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-secondary/40 p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <h3 className="truncate font-display text-lg font-bold">{m.name}</h3>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: `color-mix(in oklab, ${farbe[m.status]} 22%, transparent)`, color: farbe[m.status] }}
          >
            {muscleStatusLabel[m.status]}
          </span>
        </div>
        <p className="num mt-3 text-3xl font-bold">
          {m.saetze} <span className="text-base text-muted-foreground">/ {m.ziel} harte Sätze</span>
        </p>
        <Bar className="mt-2" value={(m.saetze / m.ziel) * 100} />
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="label-xs">Zuletzt trainiert</dt>
            <dd className="mt-0.5 font-semibold">{m.zuletzt}</dd>
          </div>
          <div>
            <dt className="label-xs">Geschätzte Bereitschaft</dt>
            <dd className="mt-0.5 font-semibold">{m.bereitschaft} %</dd>
          </div>
        </dl>
        <p className={cn("mt-4 text-sm", rest > 0 ? "text-foreground" : "text-muted-foreground")}>
          {rest > 0
            ? `Noch ${rest} produktive Sätze diese Woche empfohlen.`
            : "Wochenvolumen erreicht – zusätzliche Sätze bringen voraussichtlich wenig."}
        </p>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Die Bereitschaft ist eine Schätzung aus Trainingsvolumen, Zeitabstand und Erholungswerten –
          keine biologische Messung der Regeneration.
        </p>
      </div>
    </div>
  );
}
