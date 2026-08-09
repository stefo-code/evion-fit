import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, Disclaimer, Why } from "@/components/ui-kit";
import { workoutHeute, type LoggedSet } from "@/lib/demo-data";
import { toast } from "sonner";
import { Check, ChevronLeft, Minus, Plus, Timer, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/training/workout")({
  head: () => ({
    meta: [
      { title: "Workout – Sätze loggen | EVION" },
      {
        name: "description",
        content: "Schnelles Satz-Logging mit vorausgefüllten Werten und automatischem Steigerungsvorschlag.",
      },
      { property: "og:title", content: "Workout – Sätze loggen | EVION" },
      { property: "og:description", content: "Ein Tap pro Satz – die App schlägt das nächste Gewicht vor." },
    ],
  }),
  component: WorkoutPage,
});

type Log = Record<string, LoggedSet[]>;

function WorkoutPage() {
  const uebungen = workoutHeute.uebungen;
  const [idx, setIdx] = useState(0);
  const [log, setLog] = useState<Log>({});
  const u = uebungen[idx]!;
  const done = log[u.id] ?? [];

  const vorschlag = useMemo<LoggedSet>(() => {
    if (done.length === 0) return u.vorschlag;
    const letzter = done[done.length - 1]!;
    const [min = 6, max = 10] = u.wdhBereich.split("–").map(Number);
    if (letzter.wdh >= max && letzter.rpe <= 8) {
      return { gewicht: letzter.gewicht + 2.5, wdh: min, rpe: 8 };
    }
    if (letzter.rpe >= 9.5) return { gewicht: letzter.gewicht, wdh: Math.max(min, letzter.wdh - 1), rpe: 9 };
    return { gewicht: letzter.gewicht, wdh: letzter.wdh, rpe: letzter.rpe };
  }, [done, u]);

  const [gewicht, setGewicht] = useState(vorschlag.gewicht);
  const [wdh, setWdh] = useState(vorschlag.wdh);
  const [rpe, setRpe] = useState(vorschlag.rpe);
  const [synced, setSynced] = useState(`${u.id}-0`);
  const key = `${u.id}-${done.length}`;
  if (synced !== key) {
    setSynced(key);
    setGewicht(vorschlag.gewicht);
    setWdh(vorschlag.wdh);
    setRpe(vorschlag.rpe);
  }

  const gesamtSaetze = uebungen.reduce((s, e) => s + e.zielSaetze, 0);
  const geloggt = Object.values(log).reduce((s, e) => s + e.length, 0);
  const [pause, setPause] = useState<number | null>(null);

  function satzAbschliessen() {
    const neu = { gewicht, wdh, rpe };
    setLog((l) => ({ ...l, [u.id]: [...(l[u.id] ?? []), neu] }));
    setPause(120);
    if (u.id === "bank" && gewicht >= 82.5 && wdh >= 7) {
      toast.success("Neuer Rekord: 82,5 kg × " + wdh + " Wiederholungen");
    } else {
      toast("Satz gespeichert", { description: `${gewicht} kg × ${wdh} Wdh. · RPE ${rpe}` });
    }
  }

  const fertig = geloggt >= gesamtSaetze;

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <Link
          to="/training"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border"
          aria-label="Zurück zum Training"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="label-xs">Laufendes Training</p>
          <h1 className="truncate font-display text-xl font-extrabold">{workoutHeute.name}</h1>
        </div>
      </header>

      <div className="surface p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">
            {geloggt} / {gesamtSaetze} Sätze
          </span>
          {pause !== null && (
            <span className="inline-flex items-center gap-1.5 text-primary">
              <Timer className="h-4 w-4" /> Satzpause {Math.floor(pause / 60)}:
              {String(pause % 60).padStart(2, "0")}
            </span>
          )}
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${(geloggt / gesamtSaetze) * 100}%` }} />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {uebungen.map((e, i) => (
          <button
            key={e.id}
            onClick={() => setIdx(i)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold",
              i === idx ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
            )}
          >
            {e.name}
          </button>
        ))}
      </div>

      <Card>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-2xl font-extrabold">{u.name}</h2>
            <p className="text-sm text-muted-foreground">
              Zielbereich {u.wdhBereich} Wdh. · Satz {done.length + 1} von {u.zielSaetze}
            </p>
          </div>
          <span className="num shrink-0 rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold">
            {u.muskel}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stepper label="Gewicht" unit="kg" value={gewicht} step={2.5} onChange={setGewicht} />
          <Stepper label="Wdh." value={wdh} step={1} onChange={setWdh} />
          <Stepper label="RPE" value={rpe} step={0.5} onChange={setRpe} />
        </div>

        <button
          onClick={satzAbschliessen}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-display text-base font-extrabold uppercase tracking-wide text-primary-foreground transition-transform active:scale-[0.99]"
        >
          <Check className="h-5 w-5" /> Satz abschließen
        </button>

        <div className="mt-5 rounded-2xl border border-border bg-secondary/40 p-4">
          <p className="label-xs">Nächster Satz – Vorschlag</p>
          <p className="num mt-1 text-lg font-bold">
            {vorschlag.gewicht} kg · {vorschlag.wdh}
            {u.wdhBereich.includes("–") ? `–${u.wdhBereich.split("–")[1]}` : ""} Wiederholungen
          </p>
          <Why
            punkte={[
              `Letzte Einheit: ${u.letzte.map((s) => `${s.gewicht} × ${s.wdh}`).join(" | ")}`,
              `Zielbereich: ${u.wdhBereich} Wiederholungen`,
              u.hinweis,
              "Bei sinkender Leistung oder hoher RPE wird nicht automatisch gesteigert.",
            ]}
          />
        </div>

        {done.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {done.map((s, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">Satz {i + 1}</span>
                <span className="num font-semibold">
                  {s.gewicht} kg × {s.wdh} · RPE {s.rpe}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <p className="label-xs">Letzte Einheit</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {u.letzte.map((s, i) => (
            <li key={i} className="num">
              Satz {i + 1}: {s.gewicht} kg × {s.wdh} Wdh. · RPE {s.rpe}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Alternativen bei belegtem Gerät: {u.alternativen.join(", ")}
        </p>
      </Card>

      {fertig && (
        <Card className="border-primary/40 bg-primary/10">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-display text-lg font-extrabold">Training abgeschlossen</p>
              <p className="text-sm text-muted-foreground">
                {geloggt} Sätze protokolliert · Volumen und Muskelstatus wurden aktualisiert.
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="mt-4 flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3 font-display font-extrabold uppercase tracking-wide text-primary-foreground"
          >
            Zum Cockpit
          </Link>
        </Card>
      )}

      <Disclaimer>
        Steigerungsvorschläge sind Empfehlungen und lassen sich jederzeit überschreiben. Trainiere im
        Rahmen deiner technischen Fähigkeiten und breche bei Schmerzen ab.
      </Disclaimer>
    </div>
  );
}

function Stepper({
  label,
  unit,
  value,
  step,
  onChange,
}: {
  label: string;
  unit?: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-3 text-center">
      <p className="label-xs">{label}</p>
      <p className="num mt-1 text-2xl font-extrabold leading-none">
        {value.toLocaleString("de-DE")}
        {unit && <span className="ml-0.5 text-xs text-muted-foreground">{unit}</span>}
      </p>
      <div className="mt-2 flex justify-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, +(value - step).toFixed(2)))}
          className="grid h-8 w-8 place-items-center rounded-lg bg-secondary"
          aria-label={`${label} verringern`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={() => onChange(+(value + step).toFixed(2))}
          className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"
          aria-label={`${label} erhöhen`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
