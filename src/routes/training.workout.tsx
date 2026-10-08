import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, Disclaimer } from "@/components/ui-kit";
import { bildFuer } from "@/lib/exercise-library";
import { useOnboardingProfil } from "@/lib/onboarding-store";
import {
  baueVorlagen,
  mappeEquipment,
  aktiveTrainingstage,
  usePlanEinstellungen,
  type PlanKontext,
} from "@/lib/training-plan";
import {
  bestesE1rm,
  e1rm,
  ladeAktivitaet,
  letzterSatz,
  speichereEinheit,
  useAktivitaet,
  volumen as summeVolumen,
  type SatzLog,
  type SessionErgebnis,
} from "@/lib/activity-store";
import { toast } from "sonner";
import { Check, ChevronLeft, Minus, Plus, Timer, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type Suche = { tag: number; dauer?: number };

export const Route = createFileRoute("/training/workout")({
  validateSearch: (s: Record<string, unknown>): Suche => {
    const d = Number(s["dauer"]);
    return {
      tag: Number(s["tag"] ?? 0) || 0,
      ...(Number.isFinite(d) && d > 0 ? { dauer: d } : {}),
    };
  },
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

type Log = Record<string, SatzLog[]>;

const ENTWURF_KEY = "evion.workout.entwurf.v1";

type WorkoutEntwurf = {
  tagIndex: number;
  start: number;
  idx: number;
  log: Log;
  pauseEnde?: number | null;
};

function ladeEntwurf(tagIndex: number): WorkoutEntwurf | null {
  try {
    const raw = localStorage.getItem(ENTWURF_KEY);
    if (!raw) return null;
    const e = JSON.parse(raw) as WorkoutEntwurf;
    if (e.tagIndex !== tagIndex || typeof e.start !== "number" || !e.log) return null;
    return e;
  } catch {
    return null;
  }
}

function bereich(wdhBereich: string): [number, number] {
  const [min, max] = wdhBereich.split(/[–-]/).map((x) => Number(x.trim()));
  return [Number.isFinite(min) ? min! : 8, Number.isFinite(max) ? max! : (min ?? 10)];
}

function WorkoutPage() {
  const { tag: tagParam, dauer: dauerParam } = Route.useSearch();
  const navigate = useNavigate();
  const { profil } = useOnboardingProfil();
  const { einstellungen } = usePlanEinstellungen();
  const { aktivitaet } = useAktivitaet();

  const kontext: PlanKontext = useMemo(
    () => ({
      ziel: profil.abgeschlossen ? profil.ziel : "recomposition",
      geschlecht: profil.geschlecht,
      alter: profil.alter,
      erfahrung: profil.erfahrung,
      equipment: mappeEquipment([...(profil.equipment ?? []), ...(profil.orte ?? [])]),
      tage: aktiveTrainingstage(einstellungen, profil.tage || 4).length,
      dauer: dauerParam || profil.dauer || 45,
      fokus: einstellungen.fokus,
    }),
    [profil, einstellungen, dauerParam],
  );

  const plan = useMemo(() => baueVorlagen(kontext, einstellungen), [kontext, einstellungen]);

  const tag = plan.find((t) => t.index === tagParam) ?? plan[0]!;
  const tagIndex = tag.index;
  const uebungen = tag.uebungen;

  const [entwurf] = useState(() => ladeEntwurf(tagParam));
  const [start] = useState(() => entwurf?.start ?? Date.now());
  const [idx, setIdx] = useState(entwurf?.idx ?? 0);
  const [log, setLog] = useState<Log>(entwurf?.log ?? {});
  const [ergebnis, setErgebnis] = useState<SessionErgebnis | null>(null);
  const [pauseEnde, setPauseEnde] = useState<number | null>(entwurf?.pauseEnde ?? null);
  const [jetzt, setJetzt] = useState(() => Date.now());

  // Countdown über Endzeitpunkt – läuft auch nach Display-Standby korrekt weiter.
  useEffect(() => {
    if (pauseEnde === null) return;
    const t = window.setInterval(() => setJetzt(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [pauseEnde]);

  useEffect(() => {
    if (pauseEnde !== null && jetzt >= pauseEnde) {
      setPauseEnde(null);
      try {
        navigator.vibrate?.([500, 200, 500, 200, 500]);
      } catch {
        /* Vibration nicht verfügbar */
      }
      toast.success("Pause vorbei – nächster Satz");
    }
  }, [jetzt, pauseEnde]);

  const pause = pauseEnde !== null ? Math.max(0, Math.ceil((pauseEnde - jetzt) / 1000)) : null;

  // Entwurf persistent sichern, damit Display-Standby / Tab-Wechsel keine Daten verliert.
  useEffect(() => {
    if (ergebnis) return;
    try {
      localStorage.setItem(
        ENTWURF_KEY,
        JSON.stringify({ tagIndex, start, idx, log, pauseEnde } satisfies WorkoutEntwurf),
      );
    } catch {
      /* Speicher voll o.ä. – Training läuft trotzdem weiter */
    }
  }, [tagIndex, start, idx, log, ergebnis, pauseEnde]);

  const sicherIdx = Math.min(idx, Math.max(uebungen.length - 1, 0));
  const u = uebungen[sicherIdx];

  const done = u ? (log[u.id] ?? []) : [];

  const vorschlag = useMemo(() => {
    if (!u) return { gewicht: 0, wdh: 8, rpe: 8 };
    const [min, max] = bereich(u.wdhBereich);
    if (done.length > 0) {
      const l = done[done.length - 1]!;
      if (l.wdh >= max && l.rpe <= 8) return { gewicht: +(l.gewicht + 2.5).toFixed(1), wdh: min, rpe: 8 };
      if (l.rpe >= 9.5) return { gewicht: l.gewicht, wdh: Math.max(min, l.wdh - 1), rpe: 9 };
      return { gewicht: l.gewicht, wdh: l.wdh, rpe: l.rpe };
    }
    const historie = letzterSatz(aktivitaet, u.id);
    if (historie) {
      const steigern = historie.wdh >= max && historie.rpe <= 8;
      return {
        gewicht: steigern ? +(historie.gewicht + 2.5).toFixed(1) : historie.gewicht,
        wdh: steigern ? min : historie.wdh,
        rpe: 8,
      };
    }
    return { gewicht: u.startGewicht, wdh: min, rpe: 7.5 };
  }, [done, u, aktivitaet]);

  const [gewicht, setGewicht] = useState(vorschlag.gewicht);
  const [wdh, setWdh] = useState(vorschlag.wdh);
  const [rpe, setRpe] = useState(vorschlag.rpe);
  const key = `${u?.id ?? "-"}-${done.length}`;
  const [synced, setSynced] = useState(key);
  if (synced !== key) {
    setSynced(key);
    setGewicht(vorschlag.gewicht);
    setWdh(vorschlag.wdh);
    setRpe(vorschlag.rpe);
  }

  const gesamtSaetze = uebungen.reduce((s, e) => s + e.zielSaetze, 0);
  const alleSaetze = Object.values(log).flat();
  const geloggt = alleSaetze.length;

  function satzAbschliessen() {
    if (!u) return;
    const neu: SatzLog = {
      uebungId: u.id,
      name: u.name,
      muskel: u.muskel,
      gewicht,
      wdh,
      rpe,
      zeit: new Date().toISOString(),
    };
    setLog((l) => ({ ...l, [u.id]: [...(l[u.id] ?? []), neu] }));
    setJetzt(Date.now());
    setPauseEnde(Date.now() + (einstellungen.pauseSek || 60) * 1000);

    const bisher = bestesE1rm(ladeAktivitaet(), u.id);
    const jetzt = e1rm(gewicht, wdh);
    const besteInSession = Math.max(
      0,
      ...(log[u.id] ?? []).map((s) => e1rm(s.gewicht, s.wdh)),
    );
    if (jetzt > Math.max(bisher, besteInSession)) {
      toast.success(`Persönliche Bestleistung: ${gewicht} kg × ${wdh} (≈ ${jetzt} kg e1RM)`);
    } else {
      toast("Satz gespeichert", { description: `${gewicht} kg × ${wdh} Wdh. · RPE ${rpe}` });
    }

    // Automatisch zur nächsten Übung wechseln, wenn die Zielsätze erreicht sind.
    if ((log[u.id]?.length ?? 0) + 1 >= u.zielSaetze && sicherIdx < uebungen.length - 1) {
      setIdx(sicherIdx + 1);
    }
  }

  function trainingBeenden() {
    if (geloggt === 0) {
      toast.error("Noch kein Satz protokolliert.");
      return;
    }
    const dauerMin = Math.max(1, Math.round((Date.now() - start) / 60000));
    const res = speichereEinheit({
      datum: new Date().toISOString(),
      titel: tag.titel,
      tagIndex,
      dauerMin,
      saetze: uebungen.flatMap((e) => log[e.id] ?? []),
    });
    setErgebnis(res);
    try {
      localStorage.removeItem(ENTWURF_KEY);
    } catch {
      /* ignorieren */
    }
    for (const erf of res.neueErfolge) toast.success(`Erfolg freigeschaltet: ${erf.titel}`);
    toast.success("Training gespeichert", {
      description: `${res.einheit.saetze.length} Sätze · ${res.volumen.toLocaleString("de-DE")} kg Volumen`,
    });
  }

  const fertigQuote = gesamtSaetze > 0 ? Math.min(100, (geloggt / gesamtSaetze) * 100) : 0;

  if (ergebnis) {
    return (
      <div className="space-y-6">
        <header>
          <p className="label-xs">Abgeschlossen</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold">{ergebnis.einheit.titel}</h1>
        </header>
        <Card className="border-primary/40 bg-primary/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <Wert label="Sätze" wert={String(ergebnis.einheit.saetze.length)} />
            <Wert label="Volumen" wert={`${ergebnis.volumen.toLocaleString("de-DE")} kg`} />
            <Wert label="Dauer" wert={`${ergebnis.einheit.dauerMin} min`} />
          </div>
        </Card>

        {ergebnis.rekorde.length > 0 && (
          <Card>
            <p className="flex items-center gap-2 font-display text-lg font-extrabold">
              <Trophy className="h-5 w-5 text-primary" /> Neue Bestleistungen
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {ergebnis.rekorde.map((r) => (
                <li key={r.uebungId} className="flex justify-between gap-3">
                  <span className="truncate">{r.name}</span>
                  <span className="num shrink-0 font-bold">
                    {r.gewicht} kg × {r.wdh} · ≈ {r.e1rm} kg
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {ergebnis.neueErfolge.length > 0 && (
          <Card>
            <p className="font-display text-lg font-extrabold">Freigeschaltete Erfolge</p>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {ergebnis.neueErfolge.map((e) => (
                <li key={e.id}>
                  <span className="font-semibold text-foreground">{e.titel}</span> – {e.beschreibung}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            to="/fortschritt"
            className="flex items-center justify-center rounded-2xl bg-primary px-5 py-3 font-display font-extrabold uppercase tracking-wide text-primary-foreground"
          >
            Fortschritt ansehen
          </Link>
          <Link
            to="/erfolge"
            className="flex items-center justify-center rounded-2xl border border-border px-5 py-3 font-display font-extrabold uppercase tracking-wide"
          >
            Erfolge
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center rounded-2xl border border-border px-5 py-3 font-display font-extrabold uppercase tracking-wide"
          >
            Zum Cockpit
          </Link>
        </div>
      </div>
    );
  }

  if (!u) {
    return (
      <Card>
        <p className="text-sm">Für diesen Tag sind keine Übungen geplant.</p>
        <Link to="/training" className="mt-4 inline-flex text-sm font-bold text-primary">
          Zum Trainingsplan
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <button
          onClick={() => navigate({ to: "/training" })}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border"
          aria-label="Zurück zum Training"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="label-xs">Laufendes Training</p>
          <h1 className="truncate font-display text-xl font-extrabold">{tag.titel}</h1>
        </div>
      </header>

      <div className="surface p-4">
        <span className="font-semibold">
          {geloggt} / {gesamtSaetze} Sätze
        </span>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${fertigQuote}%` }} />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {uebungen.map((e, i) => (
          <button
            key={e.id}
            onClick={() => setIdx(i)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold",
              i === sicherIdx
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {e.name}
            {(log[e.id]?.length ?? 0) > 0 && ` · ${log[e.id]!.length}`}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <img
          src={bildFuer(u, profil.geschlecht)}
          alt={`Ausführung der Übung ${u.name}`}
          loading="lazy"
          width={768}
          height={512}
          className="h-44 w-full bg-secondary object-cover"
        />
        <div className="p-5">
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
              {vorschlag.gewicht} kg · {vorschlag.wdh} Wiederholungen · RPE {vorschlag.rpe}
            </p>
          </div>

          {done.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm">
              {done.map((s, i) => (
                <li key={i} className="flex justify-between rounded-lg bg-secondary/40 px-3 py-2">
                  <span>Satz {i + 1}</span>
                  <span className="num font-semibold">
                    {s.gewicht} kg × {s.wdh} · RPE {s.rpe}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-xs text-muted-foreground">{u.hinweis}</p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Bisheriges Volumen</span>
          <span className="num font-bold">{summeVolumen(alleSaetze).toLocaleString("de-DE")} kg</span>
        </div>
        <button
          onClick={trainingBeenden}
          disabled={geloggt === 0}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-4 font-display text-base font-extrabold uppercase tracking-wide text-background disabled:opacity-40"
        >
          <Trophy className="h-5 w-5" /> Training abschließen & speichern
        </button>
      </Card>

      <Disclaimer>
        Steigerungsvorschläge sind Empfehlungen und lassen sich jederzeit überschreiben. Trainiere im
        Rahmen deiner technischen Fähigkeiten und breche bei Schmerzen ab.
      </Disclaimer>
    </div>
  );
}

function Wert({ label, wert }: { label: string; wert: string }) {
  return (
    <div>
      <p className="label-xs">{label}</p>
      <p className="num mt-1 font-display text-xl font-extrabold">{wert}</p>
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
