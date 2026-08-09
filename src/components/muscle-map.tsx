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

/** Halbkörper-Formen (rechte Seite, Mittelachse x = 100) – werden gespiegelt gerendert. */
const vorne: Shape[] = [
  {
    key: "schultern",
    d: "M133 92 c13 3 21 13 23 27 c0 4 -3 6 -7 7 c-7 2 -14 0 -19 -4 c-3 -10 -2 -21 3 -30 z",
  },
  {
    key: "brust",
    d: "M101 96 c13 -4 25 -3 34 4 c4 11 3 22 -2 30 c-11 6 -22 5 -32 -1 z",
  },
  {
    key: "bauch",
    d: "M101 136 c8 2 15 1 20 -2 c1 20 0 40 -3 58 c-6 4 -12 5 -17 3 z",
  },
  {
    key: "bizeps",
    d: "M150 124 c8 12 12 27 11 43 c0 4 -3 6 -7 6 c-4 0 -6 -2 -7 -6 c-2 -15 -4 -29 -6 -41 z",
  },
  {
    key: "quadrizeps",
    d: "M103 210 c10 3 19 2 26 -3 c0 24 -2 47 -6 69 c-2 12 -6 21 -11 27 c-6 -8 -9 -19 -10 -33 z",
  },
];

const hinten: Shape[] = [
  {
    key: "schultern",
    d: "M133 92 c13 3 21 13 23 27 c0 4 -3 6 -7 7 c-7 2 -14 0 -19 -4 c-3 -10 -2 -21 3 -30 z",
  },
  {
    key: "ruecken",
    d: "M101 94 c14 -4 27 -1 36 9 c5 15 4 33 -2 47 c-11 6 -23 7 -34 3 z",
  },
  {
    key: "trizeps",
    d: "M150 122 c9 13 12 28 11 44 c0 4 -3 6 -7 6 c-4 0 -6 -2 -7 -6 c-2 -16 -4 -30 -6 -42 z",
  },
  {
    key: "gesaess",
    d: "M101 172 c12 -2 23 3 28 13 c2 12 -2 22 -11 27 c-6 3 -12 3 -17 -1 z",
  },
  {
    key: "beinbeuger",
    d: "M103 216 c10 3 19 2 25 -3 c0 21 -2 41 -5 60 c-2 12 -6 20 -11 25 c-6 -6 -9 -16 -9 -28 z",
  },
  {
    key: "waden",
    d: "M107 302 c6 3 12 3 17 0 c2 17 0 33 -6 46 c-4 5 -8 4 -11 -1 c-2 -14 -2 -30 0 -45 z",
  },
];

const silhouette = [
  // Rumpf
  "M100 86 c17 0 31 5 41 14 c9 8 14 19 16 31 l3 26 c1 6 -3 9 -8 8 l-4 -23 c-2 22 -4 39 -7 52 l-5 27 c-2 13 -3 27 -2 41 l3 65 c0 7 -3 10 -9 10 -6 0 -9 -3 -10 -10 l-9 -70 c-2 -14 -4 -29 -5 -45 z",
  // Arm
  "M146 116 c11 11 16 27 16 46 l-2 40 c0 5 -3 8 -7 8 -4 0 -7 -3 -7 -8 l-4 -38 c-1 -17 -1 -33 4 -48 z",
  // Bein
  "M102 206 c11 3 21 2 28 -3 l-3 82 c-1 16 -4 31 -8 45 l-4 45 c-1 6 -4 9 -9 9 -5 0 -8 -3 -8 -9 l-1 -47 c-1 -14 -2 -28 -2 -44 z",
];

export function MuscleMap() {
  const [seite, setSeite] = useState<"vorne" | "hinten">("vorne");
  const [sel, setSel] = useState<MuscleKey>("brust");
  const shapes = seite === "vorne" ? vorne : hinten;
  const m = muskelStatus[sel];
  const rest = Math.max(0, m.ziel - m.saetze);

  const halbe = (fill: string, opacity: number) => (
    <>
      {silhouette.map((d, i) => (
        <path key={i} d={d} fill={fill} opacity={opacity} />
      ))}
    </>
  );

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

        <svg viewBox="0 0 200 420" className="h-80 w-auto">
          <defs>
            <linearGradient id="skin" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--muted)" />
              <stop offset="45%" stopColor="var(--secondary)" />
              <stop offset="100%" stopColor="var(--muted)" />
            </linearGradient>
            <radialGradient id="plastik" cx="35%" cy="28%" r="80%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
              <stop offset="55%" stopColor="#fff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
            </radialGradient>
            <filter id="weich" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0f2a1c" floodOpacity="0.16" />
            </filter>
          </defs>

          {/* Körper-Silhouette mit weicher Plastizität */}
          <g filter="url(#weich)">
            <ellipse cx="100" cy="46" rx="21" ry="24" fill="url(#skin)" />
            <path d="M88 66 h24 v14 c-8 6 -16 6 -24 0 z" fill="url(#skin)" />
            <g>{halbe("url(#skin)", 1)}</g>
            <g transform="translate(200,0) scale(-1,1)">{halbe("url(#skin)", 1)}</g>
          </g>

          {/* Muskelgruppen */}
          {[false, true].map((mirror) => (
            <g key={String(mirror)} transform={mirror ? "translate(200,0) scale(-1,1)" : undefined}>
              {shapes.map((s) => {
                const st = muskelStatus[s.key];
                const aktiv = sel === s.key;
                return (
                  <g
                    key={s.key + seite}
                    className="cursor-pointer transition-opacity hover:opacity-100"
                    opacity={aktiv ? 1 : 0.82}
                    onClick={() => setSel(s.key)}
                  >
                    <path
                      d={s.d}
                      fill={farbe[st.status]}
                      stroke={aktiv ? "var(--foreground)" : "color-mix(in oklab, #000 18%, transparent)"}
                      strokeWidth={aktiv ? 1.6 : 0.8}
                      strokeLinejoin="round"
                    />
                    <path d={s.d} fill="url(#plastik)" style={{ pointerEvents: "none" }} />
                  </g>
                );
              })}
            </g>
          ))}

          {/* Mittelachse für Tiefe */}
          <line x1="100" y1="92" x2="100" y2="300" stroke="#000" strokeOpacity="0.07" strokeWidth="1.5" />
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
            style={{ background: `color-mix(in oklab, ${farbe[m.status]} 18%, transparent)`, color: farbe[m.status] }}
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
