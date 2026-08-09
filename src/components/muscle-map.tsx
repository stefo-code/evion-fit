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
  { key: "schultern", d: "M134 92 C146 96 152 108 152 122 C146 128 136 128 130 122 C128 110 129 100 134 92 Z" },
  { key: "brust", d: "M101 94 C114 92 126 95 133 102 C136 112 134 124 129 130 C118 134 108 133 101 130 Z" },
  { key: "bauch", d: "M101 138 C110 140 117 138 121 134 C120 152 118 170 114 186 C109 189 104 189 101 187 Z" },
  { key: "bizeps", d: "M140 120 C148 130 152 146 152 162 C152 168 147 170 144 166 C140 150 137 134 135 122 Z" },
  { key: "quadrizeps", d: "M104 218 C114 222 122 220 126 216 C126 246 123 274 119 296 C117 304 112 306 109 300 C105 276 103 246 104 218 Z" },
];

const hinten: Shape[] = [
  { key: "schultern", d: "M134 92 C146 96 152 108 152 122 C146 128 136 128 130 122 C128 110 129 100 134 92 Z" },
  { key: "ruecken", d: "M101 92 C116 92 128 98 134 110 C137 126 134 146 128 158 C118 164 108 164 101 160 Z" },
  { key: "trizeps", d: "M140 118 C148 128 152 144 152 160 C152 166 147 168 144 164 C140 148 137 132 135 120 Z" },
  { key: "gesaess", d: "M101 176 C114 174 124 180 127 192 C128 204 123 212 114 214 C108 215 104 213 101 210 Z" },
  { key: "beinbeuger", d: "M104 222 C114 226 121 224 125 220 C124 248 121 272 117 292 C115 300 110 301 108 295 C105 272 103 248 104 222 Z" },
  { key: "waden", d: "M107 312 C114 315 119 314 122 311 C122 332 119 352 114 366 C111 371 108 369 107 364 C105 348 105 330 107 312 Z" },
];

const silhouette = [
  // Rumpf
  "M100 78 C120 78 136 84 141 100 C145 118 143 140 136 158 C128 176 122 192 124 210 C118 214 108 216 100 214 Z",
  // Arm
  "M138 94 C152 100 158 116 158 138 C158 165 163 200 165 232 C165 240 160 243 156 240 C150 214 146 190 142 168 C137 145 132 118 133 100 Z",
  // Bein
  "M104 210 C116 214 124 212 128 214 C130 250 126 280 124 302 C122 330 120 360 119 392 C119 398 114 400 110 398 C108 366 106 336 105 306 C104 274 102 240 104 210 Z",
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
            <ellipse cx="100" cy="40" rx="19" ry="22" fill="url(#skin)" />
            <path d="M90 56 h20 v18 c-7 6 -13 6 -20 0 z" fill="url(#skin)" />

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
