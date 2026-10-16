import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Disclaimer } from "@/components/ui-kit";
import { bildFuer, type LibUebung } from "@/lib/exercise-library";
import { useOnboardingProfil } from "@/lib/onboarding-store";
import { baueVorlagen, mappeEquipment, aktiveTrainingstage, usePlanEinstellungen, type PlanKontext, type PlanUebung, type PlanEinstellungen, type Trainingstag, einschraenkungTags } from "@/lib/training-plan";
import { pauseFuer, standardAufwaermen } from "@/lib/training-dauer";
import {
  speichereEinheit,
  useAktivitaet,
  volumen as summeVolumen,
  type Aktivitaet,
  type SatzLog,
  type SessionErgebnis,
} from "@/lib/activity-store";
import { toast } from "sonner";
import { SHAKE_IDS, useSuppLog } from "@/lib/supplement-log";
import { Check, ChevronDown, ChevronLeft, List, Minus, Plus, TrendingUp, Trophy, X } from "lucide-react";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Workout – geführter Modus | EVION" },
      { name: "description", content: "Geführtes Training Satz für Satz mit Pausen-Timer und Steigerungshinweisen." },
      { property: "og:title", content: "Workout – geführter Modus | EVION" },
      { property: "og:description", content: "Aufwärmen, Übung für Übung, Core-Abschluss – mit automatischer Pause." },
    ],
  }),
  component: WorkoutPage,
});

type Log = Record<string, SatzLog[]>;
type Zeile = { gewicht: number | null; wdh: number; rpe: number | null; fertig: boolean; zeit?: string };
type Zeilen = Record<string, Zeile[]>;

const ENTWURF_KEY = "evion.workout.entwurf.v1";

type WorkoutEntwurf = {
  tagIndex: number;
  start: number;
  idx: number;
  log: Log;
  pauseEnde?: number | null;
  pauseDauer?: number;
  zeilen?: Zeilen;
  checks?: Record<string, number>;
};

type CheckItem = { id: string; name: string; saetze: number; ziel: string };

/** Aufwärm-Checkliste passend zum Trainingstyp (Ober-/Unterkörper/Ganzkörper) und Einschränkungen. */
function baueAufwaermenItems(tag: Trainingstag, einstellungen: PlanEinstellungen, einschraenkungen: string[]): CheckItem[] {
  return standardAufwaermen(tag, einstellungen, einschraenkungen).map((text, i) => ({
    id: `wu-${i}`,
    name: text,
    saetze: 1,
    ziel: "Erledigt",
  }));
}
const CORE: CheckItem[] = [
  { id: "core-plank", name: "Plank", saetze: 3, ziel: "45 s" },
  { id: "core-side", name: "Side-Plank", saetze: 3, ziel: "30 s pro Seite" },
  { id: "core-birddog", name: "Bird-Dog", saetze: 3, ziel: "10 Wdh." },
];
const CHECK_PAUSE = 40;

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

function steigerung(u: LibUebung & { steigerungKg?: number }): number {
  if (u.steigerungKg) return u.steigerungKg;
  if (u.muster === "kniebeuge" || u.muster === "huefte") return 5;
  if (u.equipment.includes("kurzhantel") && !u.equipment.some((e) => e === "langhantel" || e === "maschine" || e === "kabel"))
    return 2;
  return 2.5;
}

/** Sätze der letzten Einheit, in der die Übung vorkam. */
function letzteSaetze(a: Aktivitaet, id: string): SatzLog[] {
  for (let i = a.einheiten.length - 1; i >= 0; i--) {
    const s = a.einheiten[i]!.saetze.filter((x) => x.uebungId === id);
    if (s.length > 0) return s;
  }
  return [];
}

function startZeilen(u: LibUebung, a: Aktivitaet): { zeilen: Zeile[]; erhoehen: boolean } {
  const [min, max] = bereich(u.wdhBereich);
  const last = letzteSaetze(a, u.id);
  const erhoehen = last.length > 0 && last.every((s) => s.wdh >= max);
  const zeilen: Zeile[] = Array.from({ length: Math.max(u.zielSaetze, 1) }, (_, i) => {
    const l = last[i] ?? last[last.length - 1];
    if (!l) return { gewicht: u.startGewicht > 0 ? null : 0, wdh: min, rpe: null, fertig: false };
    return erhoehen
      ? { gewicht: +(l.gewicht + steigerung(u)).toFixed(1), wdh: min, rpe: null, fertig: false }
      : { gewicht: l.gewicht, wdh: l.wdh, rpe: null, fertig: false };
  });
  return { zeilen, erhoehen };
}

function piep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.3, 0.6].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.25);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {
    /* kein Audio */
  }
}

type Schritt =
  | { typ: "check"; id: "aufwaermen" | "core"; titel: string; items: CheckItem[] }
  | { typ: "uebung"; u: PlanUebung };

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
      einschraenkungen: einschraenkungTags(profil.einschraenkungen),
    }),
    [profil, einstellungen, dauerParam],
  );
  const plan = useMemo(() => baueVorlagen(kontext, einstellungen), [kontext, einstellungen]);
  const tag = plan.find((t) => t.index === tagParam) ?? plan[0]!;
  const tagIndex = tag.index;
  const uebungen = tag.uebungen;
  // Core-Übungen nicht zusätzlich im Hauptteil, wenn ein Core-Abschluss folgt.
  const hauptUebungen = useMemo(() => uebungen.filter((u) => u.muster !== "core"), [uebungen]);
  const aufwaermenItems = useMemo(
    () => baueAufwaermenItems(tag, einstellungen, profil.einschraenkungen ?? []),
    [tag, einstellungen, profil.einschraenkungen],
  );

  const schritte: Schritt[] = useMemo(
    () => [
      { typ: "check", id: "aufwaermen", titel: "Aufwärmen", items: aufwaermenItems },
      ...hauptUebungen.map((u) => ({ typ: "uebung" as const, u })),
      { typ: "check", id: "core", titel: "Core-Abschluss", items: CORE },
    ],
    [hauptUebungen, aufwaermenItems],
  );

  const [entwurf] = useState(() => ladeEntwurf(tagParam));
  const [start] = useState(() => entwurf?.start ?? Date.now());
  const [idx, setIdx] = useState(entwurf?.idx ?? 0);
  const [zeilen, setZeilen] = useState<Zeilen>(() => {
    if (entwurf?.zeilen) return entwurf.zeilen;
    // Alte Entwürfe: geloggte Sätze als erledigte Zeilen übernehmen.
    const z: Zeilen = {};
    for (const [id, saetze] of Object.entries(entwurf?.log ?? {}))
      z[id] = saetze.map((s) => ({ gewicht: s.gewicht, wdh: s.wdh, rpe: s.rpe, fertig: true, zeit: s.zeit }));
    return z;
  });
  const [checks, setChecks] = useState<Record<string, number>>(entwurf?.checks ?? {});
  const [ergebnis, setErgebnis] = useState<SessionErgebnis | null>(null);
  const [pauseEnde, setPauseEnde] = useState<number | null>(entwurf?.pauseEnde ?? null);
  const [pauseDauer, setPauseDauer] = useState(entwurf?.pauseDauer ?? 60);
  const [jetzt, setJetzt] = useState(() => Date.now());
  const [uebersicht, setUebersicht] = useState(false);
  const [technik, setTechnik] = useState(false);
  const [rpeOffen, setRpeOffen] = useState(false);
  const erhoehenRef = useRef<Record<string, boolean>>({});

  const sicherIdx = Math.min(idx, schritte.length - 1);
  const schritt = schritte[sicherIdx]!;

  // Zeilen der aktuellen Übung mit letzten Werten vorbelegen.
  useEffect(() => {
    if (schritt.typ !== "uebung") return;
    const u = schritt.u;
    if (zeilen[u.id]) {
      if (erhoehenRef.current[u.id] === undefined) erhoehenRef.current[u.id] = startZeilen(u, aktivitaet).erhoehen;
      return;
    }
    const { zeilen: z, erhoehen } = startZeilen(u, aktivitaet);
    erhoehenRef.current[u.id] = erhoehen;
    setZeilen((alt) => ({ ...alt, [u.id]: z }));
  }, [schritt, zeilen, aktivitaet]);

  useEffect(() => {
    setTechnik(false);
    setRpeOffen(false);
  }, [sicherIdx]);

  useEffect(() => {
    if (pauseEnde === null) return;
    const t = window.setInterval(() => setJetzt(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [pauseEnde]);

  useEffect(() => {
    if (pauseEnde !== null && jetzt >= pauseEnde) {
      setPauseEnde(null);
      piep();
      try {
        navigator.vibrate?.([500, 200, 500, 200, 500]);
      } catch {
        /* Vibration nicht verfügbar */
      }
    }
  }, [jetzt, pauseEnde]);

  const pause = pauseEnde !== null ? Math.max(0, Math.ceil((pauseEnde - jetzt) / 1000)) : null;

  const log: Log = useMemo(() => {
    const l: Log = {};
    for (const u of uebungen) {
      const f = (zeilen[u.id] ?? []).filter((z) => z.fertig && z.gewicht !== null);
      if (f.length)
        l[u.id] = f.map((z) => ({
          uebungId: u.id,
          name: u.name,
          muskel: u.muskel,
          gewicht: z.gewicht as number,
          wdh: z.wdh,
          rpe: z.rpe ?? 0,
          zeit: z.zeit ?? new Date().toISOString(),
        }));
    }
    return l;
  }, [zeilen, uebungen]);

  useEffect(() => {
    if (ergebnis) return;
    try {
      localStorage.setItem(
        ENTWURF_KEY,
        JSON.stringify({ tagIndex, start, idx, log, pauseEnde, pauseDauer, zeilen, checks } satisfies WorkoutEntwurf),
      );
    } catch {
      /* ignorieren */
    }
  }, [tagIndex, start, idx, log, ergebnis, pauseEnde, pauseDauer, zeilen, checks]);

  function starte(sek: number) {
    setPauseDauer(sek);
    setJetzt(Date.now());
    setPauseEnde(Date.now() + sek * 1000);
  }

  const alleSaetze = Object.values(log).flat();

  function schrittFertig(s: Schritt): boolean {
    if (s.typ === "check") return s.items.every((i) => (checks[i.id] ?? 0) >= i.saetze);
    const z = zeilen[s.u.id];
    return !!z && z.length > 0 && z.every((x) => x.fertig);
  }

  const fertigeSchritte = schritte.filter(schrittFertig).length;
  const quote = (fertigeSchritte / schritte.length) * 100;

  function trainingBeenden() {
    const dauerMin = Math.max(1, Math.round((Date.now() - start) / 60000));
    const res = speichereEinheit({
      datum: new Date().toISOString(),
      titel: tag.titel,
      tagIndex,
      dauerMin,
      saetze: uebungen.flatMap((e) => log[e.id] ?? []),
    });
    setErgebnis(res);
    setPauseEnde(null);
    try {
      localStorage.removeItem(ENTWURF_KEY);
    } catch {
      /* ignorieren */
    }
    for (const erf of res.neueErfolge) toast.success(`Erfolg freigeschaltet: ${erf.titel}`);
  }

  if (ergebnis) {
    return (
      <div className="space-y-6">
        <header>
          <p className="label-xs">Abgeschlossen</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold">{ergebnis.einheit.titel}</h1>
        </header>
        <Card className="border-primary/40 bg-primary/10">
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            <Wert label="Minuten" wert={String(ergebnis.einheit.dauerMin)} />
            <Wert label="Sätze" wert={String(ergebnis.einheit.saetze.length)} />
            <Wert label="Volumen" wert={`${ergebnis.volumen.toLocaleString("de-DE")} kg`} />
            <Wert label="Rekorde" wert={String(ergebnis.rekorde.length)} />
          </div>
        </Card>
        <ShakeKarte />
        {ergebnis.rekorde.length > 0 && (
          <Card>
            <p className="flex items-center gap-2 font-display text-lg font-extrabold">
              <Trophy className="h-5 w-5 text-primary" /> Neue Rekorde
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Link to="/fortschritt" className="flex min-h-12 items-center justify-center rounded-2xl bg-primary px-5 py-3 font-display font-extrabold text-primary-foreground">
            Fortschritt ansehen
          </Link>
          <Link to="/" className="flex min-h-12 items-center justify-center rounded-2xl border border-border px-5 py-3 font-display font-extrabold">
            Zum Cockpit
          </Link>
        </div>
      </div>
    );
  }

  const letzter = sicherIdx === schritte.length - 1;
  const aktuellFertig = schrittFertig(schritt);

  // Hinweis auf den nächsten Satz im Pausen-Overlay
  let naechsterHinweis = "";
  if (schritt.typ === "uebung") {
    const z = zeilen[schritt.u.id] ?? [];
    const n = z.findIndex((x) => !x.fertig);
    if (n >= 0) naechsterHinweis = `Satz ${n + 1} · ${schritt.u.name} · ${z[n]!.gewicht} kg × ${z[n]!.wdh}`;
    else {
      const nx = schritte[sicherIdx + 1];
      naechsterHinweis = nx ? `Als Nächstes: ${nx.typ === "uebung" ? nx.u.name : nx.titel}` : "";
    }
  } else {
    const it = schritt.items.find((i) => (checks[i.id] ?? 0) < i.saetze);
    naechsterHinweis = it ? `${it.name} · Satz ${(checks[it.id] ?? 0) + 1}` : "";
  }

  return (
    <div className="space-y-5 pb-24">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <button
          onClick={() => navigate({ to: "/training" })}
          className="grid h-12 w-12 place-items-center rounded-xl border border-border"
          aria-label="Zurück zum Training"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="label-xs">
            Schritt {sicherIdx + 1} von {schritte.length}
          </p>
          <p className="truncate font-display text-lg font-extrabold">{tag.titel}</p>
        </div>
        <button
          onClick={() => setUebersicht(true)}
          className="flex min-h-12 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold"
        >
          <List className="h-4 w-4" /> Übersicht
        </button>
      </header>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted" aria-label="Trainingsfortschritt">
        <div className="h-full bg-primary transition-[width]" style={{ width: `${quote}%` }} />
      </div>

      {schritt.typ === "check" ? (
        <CheckSchritt
          titel={schritt.titel}
          items={schritt.items}
          checks={checks}
          onCheck={(id, n) => {
            const alt = checks[id] ?? 0;
            setChecks((c) => ({ ...c, [id]: n }));
            if (n > alt && id !== "wu-0") starte(CHECK_PAUSE);
          }}
        />
      ) : (
        <UebungSchritt
          u={schritt.u}
          geschlecht={profil.geschlecht}
          zeilen={zeilen[schritt.u.id] ?? []}
          erhoehen={!!erhoehenRef.current[schritt.u.id]}
          technik={technik}
          setTechnik={setTechnik}
          rpeOffen={rpeOffen}
          setRpeOffen={setRpeOffen}
          onChange={(z) => setZeilen((alt) => ({ ...alt, [schritt.u.id]: z }))}
          onSatzFertig={() => starte(pauseFuer(schritt.u, einstellungen))}
        />
      )}

      <p className="text-sm text-muted-foreground">
        Bisher {alleSaetze.length} Sätze · {summeVolumen(alleSaetze).toLocaleString("de-DE")} kg Volumen
      </p>

      <Disclaimer>
        Steigerungsvorschläge sind Empfehlungen und lassen sich jederzeit überschreiben. Bei Schmerzen abbrechen.
      </Disclaimer>

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-60">
        <div className="mx-auto grid max-w-3xl grid-cols-[auto_minmax(0,1fr)] gap-3">
          <button
            onClick={() => setIdx(Math.max(0, sicherIdx - 1))}
            disabled={sicherIdx === 0}
            aria-label="Vorheriger Schritt"
            className="grid h-12 w-12 place-items-center rounded-xl border border-border text-xl font-bold disabled:opacity-30"
          >
            ‹
          </button>
          {letzter ? (
            <button
              onClick={trainingBeenden}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary font-display font-extrabold text-primary-foreground"
            >
              <Trophy className="h-5 w-5" /> Training beenden
            </button>
          ) : (
            <button
              onClick={() => setIdx(sicherIdx + 1)}
              className={cn(
                "min-h-12 rounded-xl font-display font-extrabold",
                aktuellFertig ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground",
              )}
            >
              {aktuellFertig ? "Nächste Übung" : "Überspringen"}
            </button>
          )}
        </div>
      </div>

      {uebersicht && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-foreground/40" aria-label="Übersicht schließen" onClick={() => setUebersicht(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-extrabold">Übersicht</p>
              <button onClick={() => setUebersicht(false)} className="grid h-12 w-12 place-items-center" aria-label="Schließen">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="mt-2 space-y-1">
              {schritte.map((s, i) => {
                const f = schrittFertig(s);
                return (
                  <li key={i}>
                    <button
                      onClick={() => {
                        setIdx(i);
                        setUebersicht(false);
                      }}
                      className={cn(
                        "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm",
                        i === sicherIdx ? "bg-primary/10 font-bold text-primary" : "hover:bg-secondary",
                      )}
                    >
                      <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full border", f ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                        {f ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs">{i + 1}</span>}
                      </span>
                      <span className="min-w-0 truncate">{s.typ === "uebung" ? s.u.name : s.titel}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {pause !== null && (
        <PauseOverlay
          rest={pause}
          dauer={pauseDauer}
          hinweis={naechsterHinweis}
          onPlus={() => {
            setPauseDauer((d) => d + 30);
            setPauseEnde((e) => (e ?? Date.now()) + 30000);
          }}
          onWeiter={() => setPauseEnde(null)}
        />
      )}
    </div>
  );
}

function PauseOverlay({ rest, dauer, hinweis, onPlus, onWeiter }: { rest: number; dauer: number; hinweis: string; onPlus: () => void; onWeiter: () => void }) {
  const r = 110;
  const umfang = 2 * Math.PI * r;
  const anteil = Math.min(1, rest / Math.max(1, dauer));
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-background px-6" role="dialog" aria-label="Satzpause">
      <p className="label-xs">Pause</p>
      <div className="relative h-64 w-64">
        <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90">
          <circle cx="120" cy="120" r={r} fill="none" stroke="var(--muted)" strokeWidth="12" />
          <circle
            cx="120"
            cy="120"
            r={r}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={umfang}
            strokeDashoffset={umfang * (1 - anteil)}
            style={{ transition: "stroke-dashoffset 0.25s linear" }}
          />
        </svg>
        <span className="num absolute inset-0 grid place-items-center font-display text-6xl font-extrabold">
          {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, "0")}
        </span>
      </div>
      {hinweis && <p className="text-center text-sm text-muted-foreground">Nächster Satz: {hinweis}</p>}
      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
        <button onClick={onPlus} className="min-h-14 rounded-2xl border border-border font-display text-lg font-extrabold">
          +30 s
        </button>
        <button onClick={onWeiter} className="min-h-14 rounded-2xl bg-primary font-display text-lg font-extrabold text-primary-foreground">
          Weiter
        </button>
      </div>
    </div>
  );
}

function CheckSchritt({ titel, items, checks, onCheck }: { titel: string; items: CheckItem[]; checks: Record<string, number>; onCheck: (id: string, n: number) => void }) {
  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold">{titel}</h1>
      {items.map((it) => {
        const n = checks[it.id] ?? 0;
        return (
          <Card key={it.id} className="p-4">
            <p className="font-display text-lg font-bold">{it.name}</p>
            <p className="text-sm text-muted-foreground">
              {it.saetze > 1 ? `${it.saetze} × ` : ""}
              {it.ziel}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from({ length: it.saetze }, (_, i) => {
                const fertig = i < n;
                return (
                  <button
                    key={i}
                    onClick={() => onCheck(it.id, fertig ? i : i + 1)}
                    aria-pressed={fertig}
                    className={cn(
                      "flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-xl border px-4 text-sm font-bold",
                      fertig ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {fertig && <Check className="h-4 w-4" />}
                    {it.saetze > 1 ? `Satz ${i + 1}` : "Erledigt"}
                  </button>
                );
              })}
            </div>
          </Card>
        );
      })}
    </section>
  );
}

function UebungSchritt({
  u,
  geschlecht,
  zeilen,
  erhoehen,
  technik,
  setTechnik,
  rpeOffen,
  setRpeOffen,
  onChange,
  onSatzFertig,
}: {
  u: PlanUebung;
  geschlecht: string | null;
  zeilen: Zeile[];
  erhoehen: boolean;
  technik: boolean;
  setTechnik: (v: boolean) => void;
  rpeOffen: boolean;
  setRpeOffen: (v: boolean) => void;
  onChange: (z: Zeile[]) => void;
  onSatzFertig: () => void;
}) {
  const aktuell = zeilen.findIndex((z) => !z.fertig);
  const setze = (i: number, teil: Partial<Zeile>) => onChange(zeilen.map((z, j) => (j === i ? { ...z, ...teil } : z)));
  const schrittG = u.steigerungKg ?? (u.equipment.includes("kurzhantel") ? 2 : 2.5);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold leading-tight">{u.name}</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Ziel: {u.zielSaetze} × {u.wdhBereich} Wdh. · {u.muskel}
        </p>
      </div>

      <button
        onClick={() => setTechnik(!technik)}
        aria-expanded={technik}
        className="flex min-h-12 w-full items-center justify-between rounded-xl border border-border px-4 text-sm font-semibold"
      >
        Technik ansehen <ChevronDown className={cn("h-4 w-4 transition-transform", technik && "rotate-180")} />
      </button>
      {technik && (
        <Card className="overflow-hidden p-0">
          <img src={bildFuer(u, geschlecht)} alt={`Ausführung der Übung ${u.name}`} width={768} height={512} className="h-48 w-full bg-secondary object-cover" />
          <p className="p-4 text-sm text-muted-foreground">{u.hinweis}</p>
        </Card>
      )}

      {erhoehen && (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm">
          <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            <span className="font-bold text-primary">Gewicht erhöhen</span> – letzte Einheit lagen alle Sätze am oberen Ende. Der
            Vorschlag ist bereits um {steigerung(u).toLocaleString("de-DE")} kg erhöht.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {zeilen.map((z, i) =>
          z.fertig ? (
            <li key={i} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/10 px-4">
              <span className="flex items-center gap-2 font-semibold text-primary">
                <Check className="h-4 w-4" /> Satz {i + 1}
              </span>
              <span className="num font-bold">
                {z.gewicht !== null ? z.gewicht.toLocaleString("de-DE") : "–"} kg × {z.wdh}
                {z.rpe ? ` · RPE ${z.rpe}` : ""}
              </span>
              <button onClick={() => setze(i, { fertig: false })} className="min-h-12 px-2 text-sm font-semibold text-muted-foreground underline">
                Ändern
              </button>
            </li>
          ) : i === aktuell ? (
            <li key={i} className="rounded-2xl border-2 border-primary bg-card p-4">
              <p className="label-xs">Satz {i + 1}</p>
              <div className="mt-3 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                <Stepper label="Gewicht" unit="kg" value={z.gewicht} step={schrittG} onChange={(v) => setze(i, { gewicht: v })} />
                <Stepper label="Wdh." value={z.wdh} step={1} onChange={(v) => setze(i, { wdh: v })} />
              </div>
              {z.gewicht === null && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Wähle ein Gewicht für die Ziel-Wdh. mit 1–2 Wdh. Reserve
                </p>
              )}
              <button
                onClick={() => setRpeOffen(!rpeOffen)}
                aria-expanded={rpeOffen}
                className="mt-2 flex min-h-12 items-center gap-1 text-sm font-semibold text-muted-foreground"
              >
                RPE (optional){z.rpe ? `: ${z.rpe}` : ""} <ChevronDown className={cn("h-4 w-4", rpeOffen && "rotate-180")} />
              </button>
              {rpeOffen && (
                <div className="flex flex-wrap gap-2">
                  {[6, 7, 8, 9, 10].map((r) => (
                    <button
                      key={r}
                      onClick={() => setze(i, { rpe: z.rpe === r ? null : r })}
                      className={cn("min-h-12 min-w-12 rounded-xl border text-sm font-bold", z.rpe === r ? "border-primary bg-primary text-primary-foreground" : "border-border")}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  setze(i, { fertig: true, zeit: new Date().toISOString() });
                  onSatzFertig();
                }}
                disabled={z.gewicht === null}
                className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display text-lg font-extrabold text-primary-foreground active:scale-[0.99] disabled:opacity-40"
              >
                <Check className="h-5 w-5" /> Satz {i + 1} fertig
              </button>
            </li>
          ) : (
            <li key={i} className="flex min-h-14 items-center justify-between rounded-2xl border border-border px-4 text-muted-foreground">
              <span>Satz {i + 1}</span>
              <span className="num">
                {z.gewicht !== null ? z.gewicht.toLocaleString("de-DE") : "–"} kg × {z.wdh}
              </span>
            </li>
          ),
        )}
      </ul>
      <button
        onClick={() => {
          const l = zeilen[zeilen.length - 1];
          onChange([...zeilen, { gewicht: l ? l.gewicht : (u.startGewicht > 0 ? null : 0), wdh: l?.wdh ?? bereich(u.wdhBereich)[0], rpe: null, fertig: false }]);
        }}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm font-bold text-muted-foreground"
      >
        <Plus className="h-4 w-4" /> Satz hinzufügen
      </button>
    </section>
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
  value: number | null;
  step: number;
  onChange: (v: number) => void;
}) {
  const [text, setText] = useState(value === null ? "" : value.toLocaleString("de-DE"));

  useEffect(() => {
    setText(value === null ? "" : value.toLocaleString("de-DE"));
  }, [value]);

  function uebernehmen(raw: string) {
    const normal = raw.replace(",", ".").trim();
    const n = Number(normal);
    if (normal !== "" && Number.isFinite(n)) onChange(Math.max(0, n));
  }

  return (
    <div className="rounded-2xl bg-secondary/50 p-2">
      <p className="label-xs text-center">{label}</p>
      <div className="mt-1 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, +((value ?? 0) - step).toFixed(2)))}
          className="grid h-11 w-11 place-items-center rounded-xl bg-card"
          aria-label={`${label} verringern`}
        >
          <Minus className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 items-baseline justify-center gap-0.5 overflow-hidden">
          <input
            type="text"
            inputMode="decimal"
            value={text}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => {
              const v = e.target.value;
              if (/^[0-9]*[.,]?[0-9]*$/.test(v)) setText(v);
            }}
            onBlur={(e) => uebernehmen(e.target.value)}
            placeholder="–"
            aria-label={label}
            className="num w-full min-w-0 bg-transparent text-center font-display font-extrabold leading-none outline-none"
            style={{ fontSize: "clamp(1.25rem, 6vw, 1.75rem)" }}
          />
          {unit && <span className="shrink-0 text-xs text-muted-foreground">{unit}</span>}
        </div>
        <button
          type="button"
          onClick={() => onChange(+((value ?? 0) + step).toFixed(2))}
          className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"
          aria-label={`${label} erhöhen`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function ShakeKarte() {
  const { besitz, genommen, setzeGenommen } = useSuppLog();
  const id = besitz.find((x) => SHAKE_IDS.includes(x)) ?? "whey";
  const [erledigt, setErledigt] = useState(false);
  if (genommen(id) && !erledigt) return null;
  return (
    <Card>
      <p className="font-display text-lg font-extrabold">Jetzt den Eiweiss-Shake</p>
      <p className="mt-1 text-sm text-muted-foreground">0–2 Stunden nach dem Training, 20–40 g Protein.</p>
      {erledigt ? (
        <p className="mt-3 flex items-center gap-2 font-semibold text-primary">
          <Check className="h-4 w-4" /> Abgehakt
        </p>
      ) : (
        <button
          onClick={() => {
            setzeGenommen(id, true);
            setErledigt(true);
          }}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground"
        >
          <Check className="h-4 w-4" /> Shake genommen
        </button>
      )}
    </Card>
  );
}
