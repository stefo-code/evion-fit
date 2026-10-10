import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SuppCheckliste, nachDrei } from "@/components/supp-checkliste";
import { KOFFEIN_IDS, useSuppLog } from "@/lib/supplement-log";
import { supplementDatenbank } from "@/lib/supplements-data";
import { useMemo, useState } from "react";
import { Card, Chip, Disclaimer, Section } from "@/components/ui-kit";
import { TrainingNachtragen } from "@/components/training-nachtragen";
import { MuscleMap } from "@/components/muscle-map";
import { zeitModi, muskelStatus, goalLabels, type MuscleKey } from "@/lib/demo-data";
import { useOnboardingProfil } from "@/lib/onboarding-store";
import {
  aktiveTrainingstage,
  baueVorlagen,
  festgelegtesTraining,
  naechstesAusRotation,
  fokusFuerGeschlecht,
  fokusOptionen,
  mappeEquipment,
  standardTrainingstage,
  usePlanEinstellungen,
  vorlageFuerTag,
  wochentage,
  wochentageKurz,
  type Fokus,
  type PlanKontext,
} from "@/lib/training-plan";


import {
  alternativenFuer,
  bildFuer,
  uebungsBibliothek,
  type Equipment,
  type LibUebung,
  type Muster,
} from "@/lib/exercise-library";
import { ChevronDown, ChevronRight, ChevronUp, History, Plus, Repeat, Trash2, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  einheitenSeit,
  readinessAusMessungen,
  rekorde as ermittleRekorde,

  streak as serie,
  useAktivitaet,
  volumen as satzVolumen,
} from "@/lib/activity-store";


export const Route = createFileRoute("/training/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Training – EVION" },
      {
        name: "description",
        content:
          "Trainingsplan mit Übungsbildern, individuellem Fokus, Übungstausch und Zeit-Effizienz-Modus.",
      },
      { property: "og:title", content: "Training – EVION" },
      { property: "og:description", content: "Dein Plan – angepasst an Ziel, Alter, Geschlecht und Zeit." },
    ],
  }),
  component: TrainingPage,
});

function TrainingPage() {
  const { profil } = useOnboardingProfil();
  const {
    einstellungen,
    speichere,
    tausche,
    entferneUebung,
    fuegeUebungHinzu,
    verschiebeUebung,
    erstelleEigene,
    loescheEigene,
    schalteTrainingstag,
    setzeTrainingstage,
    erstelleVorlage,
    benenneVorlage,
    loescheVorlage,
    ordneZu,
  } = usePlanEinstellungen();
  const { aktivitaet } = useAktivitaet();
  const rekorde = ermittleRekorde(aktivitaet);
  const [zeit, setZeit] = useState(45);
  const [tagIndex, setTagIndex] = useState(0);
  const [tauschFuer, setTauschFuer] = useState<string | null>(null);
  const [pickerOffen, setPickerOffen] = useState(false);
  const [segment, setSegment] = useState<"heute" | "plaene" | "analyse">("heute");
  const [auswahl, setAuswahl] = useState<number | null>(null);
  const [booster, setBooster] = useState<string | null>(null);
  const supp = useSuppLog();
  const navigate = useNavigate();

  const modus = zeitModi.find((m) => m.minuten === zeit) ?? zeitModi[2]!;

  const gewaehlteTage = useMemo(
    () => aktiveTrainingstage(einstellungen, profil.tage || 4),
    [einstellungen, profil.tage],
  );
  const eigeneAuswahl = (einstellungen.trainingstage ?? []).length > 0;

  const kontext: PlanKontext = useMemo(
    () => ({
      ziel: profil.abgeschlossen ? profil.ziel : "recomposition",
      geschlecht: profil.geschlecht,
      alter: profil.alter,
      erfahrung: profil.erfahrung,
      equipment: mappeEquipment([...(profil.equipment ?? []), ...(profil.orte ?? [])]),
      tage: gewaehlteTage.length,
      dauer: zeit,
      fokus: einstellungen.fokus,
    }),
    [profil, zeit, einstellungen.fokus, gewaehlteTage],
  );


  const plan = useMemo(() => baueVorlagen(kontext, einstellungen), [kontext, einstellungen]);
  const [neuerName, setNeuerName] = useState("");
  const [nachtragen, setNachtragen] = useState(false);
  const rotation = (einstellungen.rotation ?? []).filter((i) => plan.some((t) => t.index === i));
  const setzeNaechster = (i: number) => {
    speichere({ naechster: { index: i, seit: Date.now() } });
    setAuswahl(null);
    toast.success(`${plan.find((t) => t.index === i)?.titel} ist als nächstes festgelegt`);
  };
  const verschiebeRotation = (pos: number, r: -1 | 1) => {
    const neu = [...rotation];
    const ziel = pos + r;
    if (ziel < 0 || ziel >= neu.length) return;
    [neu[pos], neu[ziel]] = [neu[ziel]!, neu[pos]!];
    speichere({ rotation: neu });
  };


  const tag = plan.find((t) => t.index === tagIndex) ?? plan[0]!;
  const verfuegbareFokus = useMemo(
    () => fokusFuerGeschlecht(profil.geschlecht),
    [profil.geschlecht],
  );
  const aktiverFokus = verfuegbareFokus.some((f) => f.id === einstellungen.fokus)
    ? einstellungen.fokus
    : "ausgewogen";
  const fokusInfo = fokusOptionen.find((f) => f.id === aktiverFokus)!;

  const naechstes = useMemo(() => {
    const gewaehlt = plan.find((t) => t.index === auswahl);
    if (gewaehlt) return gewaehlt;
    const fest = festgelegtesTraining(plan, einstellungen, aktivitaet.einheiten);
    if (fest) return fest;
    if (einstellungen.festeTage) {
      const wt = (new Date().getDay() + 6) % 7;
      const fest = vorlageFuerTag(plan, einstellungen, gewaehlteTage, wt);
      if (fest) return fest;
    }
    const rot = naechstesAusRotation(plan, einstellungen, aktivitaet.einheiten);
    if (rot) return rot;
    const letzte = aktivitaet.einheiten[aktivitaet.einheiten.length - 1];
    const i = letzte ? plan.findIndex((t) => t.index === letzte.tagIndex) : -1;
    return plan[(i + 1) % Math.max(plan.length, 1)] ?? plan[0]!;
  }, [plan, auswahl, einstellungen, gewaehlteTage, aktivitaet]);
  const starteWorkout = () => {
    setBooster(null);
    navigate({ to: "/training/workout", search: { tag: naechstes.index, dauer: zeit } });
  };
  const geschaetzteMin = Math.round(
    12 + naechstes.uebungen.reduce((s, u) => s + (u.zielSaetze * ((u.grund ? 150 : 75) + 45)) / 60, 0),
  );


  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">Training</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Training</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ziel: {goalLabels[kontext.ziel]} · Fokus: {fokusInfo.titel}
        </p>
      </header>
      <div role="tablist" aria-label="Trainingsbereiche" className="grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1">
        {([["heute", "Heute"], ["plaene", "Pläne"], ["analyse", "Analyse"]] as const).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={segment === id}
            onClick={() => setSegment(id)}
            className={cn(
              "min-h-12 rounded-md text-sm font-semibold",
              segment === id ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {segment === "heute" && (
        <>
          <AutoregulationsHinweis />
          <Card className="border-primary/40">
            <p className="label-xs">Nächstes Training</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold">{naechstes.titel}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {naechstes.uebungen.length} Übungen · ca. {geschaetzteMin} min · inkl. Aufwärmen und Core
            </p>
            <ul className="mt-4 divide-y divide-border">
              {naechstes.uebungen.map((u) => (
                <li key={u.id} className="flex justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 truncate font-semibold">{u.name}</span>
                  <span className="num shrink-0 text-muted-foreground">
                    {u.zielSaetze} × {u.wdhBereich}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                const booster = supp.besitz.find((id) => KOFFEIN_IDS.includes(id) && !supp.genommen(id));
                if (booster && !(einstellungen.ohneBooster ?? []).includes(naechstes.index)) setBooster(booster);
                else starteWorkout();
              }}
              className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-display text-base font-extrabold text-primary-foreground"
            >
              Training starten <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => setNachtragen(true)}
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border text-sm font-bold"
            >
              <History className="h-4 w-4" /> Training nachtragen
            </button>
          </Card>
          {nachtragen && (
            <TrainingNachtragen plan={plan} standardIndex={naechstes.index} onSchliessen={() => setNachtragen(false)} />
          )}
          <SuppCheckliste />
          {booster && (
            <div className="fixed inset-0 z-50">
              <button className="absolute inset-0 bg-foreground/40" aria-label="Schließen" onClick={() => setBooster(null)} />
              <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border bg-card p-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                <p className="label-xs">Booster-Erinnerung</p>
                <p className="mt-1 font-display text-xl font-extrabold">
                  {supplementDatenbank.find((x) => x.id === booster)?.name} vor dem Training?
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {nachDrei() ? "Besser weglassen – stört den Schlaf." : "Wirkt nach etwa 30–60 Minuten."}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button onClick={() => { supp.setzeGenommen(booster, true); starteWorkout(); }} className="min-h-12 rounded-xl bg-primary font-bold text-primary-foreground">
                    Genommen
                  </button>
                  <button onClick={starteWorkout} className="min-h-12 rounded-xl border border-border font-bold">
                    Ohne starten
                  </button>
                </div>
              </div>
            </div>
          )}

          <Section titel="Anderes Training wählen">
            <div className="flex flex-wrap gap-2">
              {plan.map((t) => (
                <Chip key={t.index} active={t.index === naechstes.index} onClick={() => setAuswahl(t.index)}>
                  {t.titel}
                </Chip>
              ))}
            </div>
          </Section>
          <Section titel="Wie viel Zeit hast du?">
            <Card>
              <div className="flex flex-wrap gap-2">
                {zeitModi.map((m) => (
                  <Chip key={m.minuten} active={zeit === m.minuten} onClick={() => setZeit(m.minuten)}>
                    {m.titel}
                  </Chip>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{modus.beschreibung}</p>
            </Card>
          </Section>
        </>
      )}
      {segment === "plaene" && (
        <>
      <Section titel="Trainingsfokus wählen">
        <Card>
          <div className="flex flex-wrap gap-2">
            {verfuegbareFokus.map((f) => (
              <Chip
                key={f.id}
                active={f.id === aktiverFokus}

                onClick={() => {
                  speichere({ fokus: f.id as Fokus, tausch: {}, entfernt: {}, zusatz: {} });
                  toast.success(`Plan neu berechnet: ${f.titel}`);
                }}
              >
                {f.titel}
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{fokusInfo.beschreibung}</p>
        </Card>
      </Section>
      <Section titel="Trainingswoche">
        <Card className="p-4">
          <p className="label-xs">Trainingstage wählen</p>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {wochentageKurz.map((kurz, d) => {
              const aktiv = gewaehlteTage.includes(d);
              return (
                <button
                  key={kurz}
                  type="button"
                  aria-pressed={aktiv}
                  aria-label={`${wochentage[d]} als Trainingstag ${aktiv ? "abwählen" : "auswählen"}`}
                  onClick={() => {
                    schalteTrainingstag(d, gewaehlteTage);
                    setTagIndex(0);
                  }}
                  className={cn(
                    "rounded-xl border py-2 text-xs font-bold transition-colors",
                    aktiv
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {kurz}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {gewaehlteTage.length} Einheiten pro Woche ·{" "}
              {gewaehlteTage.map((d) => wochentageKurz[d]).join(", ")}
            </p>
            {eigeneAuswahl && (
              <button
                type="button"
                onClick={() => {
                  setzeTrainingstage(null);
                  setTagIndex(0);
                  toast("Vorschlag wiederhergestellt");
                }}
                className="text-xs font-semibold text-muted-foreground underline"
              >
                Vorschlag ({standardTrainingstage(profil.tage || 4).length} Tage)
              </button>
            )}
          </div>
          <label className="mt-4 flex min-h-12 items-center justify-between gap-3 border-t border-border pt-3 text-sm">
            <span>
              <span className="block font-semibold">Feste Wochentage nutzen</span>
              <span className="block text-xs text-muted-foreground">
                Aus: „Heute“ schlägt das Template nach dem zuletzt absolvierten vor.
              </span>
            </span>
            <input
              type="checkbox"
              checked={!!einstellungen.festeTage}
              onChange={(e) => speichere({ festeTage: e.target.checked })}
              className="h-5 w-5 accent-primary"
            />
          </label>
        </Card>

        <Card className="mt-3 p-2">
          <p className="label-xs px-3 pt-2">Template je Trainingstag</p>
          <ul className="divide-y divide-border">
            {gewaehlteTage.map((d) => {
              const zugeordnet = vorlageFuerTag(plan, einstellungen, gewaehlteTage, d);
              return (
                <li key={d} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3 px-3 py-3">
                  <span className="text-sm font-semibold">{wochentage[d]}</span>
                  <select
                    value={zugeordnet?.index ?? ""}
                    onChange={(e) => ordneZu(d, Number(e.target.value))}
                    aria-label={`Template für ${wochentage[d]}`}
                    className="w-full min-w-0 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  >
                    {plan.map((t) => (
                      <option key={t.index} value={t.index}>
                        {t.titel} ({t.uebungen.length} Übungen)
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
        </Card>
      </Section>
      <Section titel="Trainings-Rotation">
        <Card className="p-2">
          {rotation.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              Keine Rotation – „Heute“ folgt der Reihenfolge der Templates.
            </p>
          ) : (
            <ol className="divide-y divide-border">
              {rotation.map((i, pos) => {
                const t = plan.find((p) => p.index === i)!;
                return (
                  <li key={i} className="flex items-center gap-2 px-3 py-2">
                    <span className="num w-5 text-xs text-muted-foreground">{pos + 1}.</span>
                    <span className="min-w-0 flex-1 text-sm font-semibold">
                      <span className="block truncate">{t.titel}</span>
                      {t.index === naechstes.index && <span className="text-xs text-primary">nächstes Training</span>}
                    </span>
                    {t.index !== naechstes.index && (
                      <button onClick={() => setzeNaechster(i)} className="min-h-10 px-1 text-xs font-semibold text-primary underline">
                        Als nächstes festlegen
                      </button>
                    )}
                    <button onClick={() => verschiebeRotation(pos, -1)} disabled={pos === 0} aria-label={`${t.titel} in der Rotation nach oben`} className="grid h-9 w-9 place-items-center rounded-full border border-border disabled:opacity-30">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => verschiebeRotation(pos, 1)} disabled={pos === rotation.length - 1} aria-label={`${t.titel} in der Rotation nach unten`} className="grid h-9 w-9 place-items-center rounded-full border border-border disabled:opacity-30">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button onClick={() => speichere({ rotation: rotation.filter((x) => x !== i) })} aria-label={`${t.titel} aus der Rotation entfernen`} className="grid h-9 w-9 place-items-center text-muted-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
          {plan.some((t) => !rotation.includes(t.index)) && (
            <select
              value=""
              onChange={(e) => e.target.value && speichere({ rotation: [...rotation, Number(e.target.value)] })}
              aria-label="Template zur Rotation hinzufügen"
              className="m-2 w-[calc(100%-1rem)] rounded-xl border border-border bg-card px-3 py-2 text-sm"
            >
              <option value="">+ Template zur Rotation hinzufügen</option>
              {plan.filter((t) => !rotation.includes(t.index)).map((t) => (
                <option key={t.index} value={t.index}>{t.titel}</option>
              ))}
            </select>
          )}
        </Card>
      </Section>
      <Section titel="Trainings-Templates">
        <Card>
          <div className="flex flex-wrap gap-2">
            {plan.map((t) => (
              <Chip key={t.index} active={t.index === tag.index} onClick={() => setTagIndex(t.index)}>
                {t.titel}
              </Chip>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              value={neuerName}
              onChange={(e) => setNeuerName(e.target.value)}
              placeholder="Name für neues Template"
              aria-label="Name für neues Template"
              className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                const titel = neuerName.trim() || `Eigenes Training ${(einstellungen.vorlagen?.length ?? 0) + 1}`;
                const idx = erstelleVorlage(titel);
                setTagIndex(idx);
                setNeuerName("");
                toast.success(`Template „${titel}“ erstellt – füge jetzt Übungen hinzu`);
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Neu
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
            <button
              className="text-muted-foreground underline"
              onClick={() => {
                const n = window.prompt("Neuer Name für das Template", tag.titel)?.trim();
                if (n) benenneVorlage(tag.index, n);
              }}
            >
              „{tag.titel}“ umbenennen
            </button>
            {tag.index !== naechstes.index && (
              <button className="text-primary underline" onClick={() => setzeNaechster(tag.index)}>
                Als nächstes festlegen
              </button>
            )}
            {tag.index >= 100 && (
              <button
                className="text-destructive underline"
                onClick={() => {
                  loescheVorlage(tag.index);
                  setTagIndex(plan[0]?.index ?? 0);
                  toast(`Template „${tag.titel}“ gelöscht`);
                }}
              >
                Template löschen
              </button>
            )}
          </div>
        </Card>
      </Section>
      <Section titel={`Übungen – ${tag.titel}`}>
        <div className="space-y-3">
          {tag.uebungen.map((u, uIdx) => (
            <Card key={u.id} className="relative overflow-hidden p-0">
              <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
                <button
                  onClick={() => verschiebeUebung(tag.index, u.id, -1, tag.uebungen.map((x) => x.id))}
                  disabled={uIdx === 0}
                  aria-label={`${u.name} nach oben verschieben`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/90 shadow-sm backdrop-blur disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => verschiebeUebung(tag.index, u.id, 1, tag.uebungen.map((x) => x.id))}
                  disabled={uIdx === tag.uebungen.length - 1}
                  aria-label={`${u.name} nach unten verschieben`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/90 shadow-sm backdrop-blur disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <img
                src={bildFuer(u, profil.geschlecht)}
                alt={`Ausführung der Übung ${u.name}`}
                loading="lazy"
                width={768}
                height={512}
                className="h-40 w-full bg-secondary object-cover"
              />
              <div className="p-4">
                <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-display font-bold">{u.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.muskel} · {u.zielSaetze} Sätze · {u.wdhBereich} Wdh.
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setTauschFuer(tauschFuer === u.id ? null : u.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold sm:flex-none sm:py-1.5"
                    >
                      <Repeat className="h-3.5 w-3.5" /> Tauschen
                    </button>
                    <button
                      onClick={() => {
                        entferneUebung(tag.index, u.id);
                        toast(`${u.name} entfernt`);
                      }}
                      aria-label={`${u.name} aus dem Tag entfernen`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground sm:flex-none sm:py-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Entfernen
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">{u.hinweis}</p>

                {tauschFuer === u.id && (
                  <div className="mt-4 rounded-2xl border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="label-xs">Alternative wählen</p>
                      <button onClick={() => setTauschFuer(null)} aria-label="Auswahl schließen">
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {alternativenFuer(originalId(u.id, einstellungen.tausch)).map((a) => (
                        <li key={a.id}>
                          <button
                            onClick={() => {
                              tausche(originalId(u.id, einstellungen.tausch), a.id);
                              setTauschFuer(null);
                              toast.success(`${a.name} übernommen`);
                            }}
                            className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-secondary/60"
                          >
                            <img
                              src={bildFuer(a, profil.geschlecht)}
                              alt=""
                              loading="lazy"
                              width={768}
                              height={512}
                              className="h-10 w-16 shrink-0 rounded-lg object-cover"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold">{a.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {a.muskel} · {a.equipment.join(", ")}
                                {a.rueckenschonend ? " · rückenschonend" : ""}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <button
          onClick={() => setPickerOffen((o) => !o)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-5 py-4 font-display text-sm font-extrabold uppercase tracking-wide text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" /> Übung hinzufügen
        </button>

        {pickerOffen && (
          <UebungHinzufuegen
            geschlecht={profil.geschlecht}
            eigene={einstellungen.eigene ?? []}
            bereitsImTag={tag.uebungen.map((u) => u.id)}
            onWaehlen={(id, name) => {
              fuegeUebungHinzu(tag.index, id);
              setPickerOffen(false);
              toast.success(`${name} hinzugefügt`);
            }}
            onEigeneErstellen={(u) => {
              erstelleEigene(u);
              fuegeUebungHinzu(tag.index, u.id);
              setPickerOffen(false);
              toast.success(`${u.name} erstellt und hinzugefügt`);
            }}
            onEigeneLoeschen={(id) => loescheEigene(id)}
            onSchliessen={() => setPickerOffen(false)}
          />
        )}

        {(Object.keys(einstellungen.tausch).length > 0 ||
          Object.values(einstellungen.entfernt ?? {}).some((v) => v.length > 0) ||
          Object.values(einstellungen.zusatz ?? {}).some((v) => v.length > 0) ||
          Object.values(einstellungen.reihenfolge ?? {}).some((v) => v.length > 0)) && (
          <button
            onClick={() => {
              speichere({ tausch: {}, entfernt: {}, zusatz: {}, reihenfolge: {} });
              toast("Plan auf den Vorschlag zurückgesetzt");
            }}
            className="text-xs font-bold uppercase tracking-wider text-primary"
          >
            Alle Anpassungen zurücksetzen
          </button>
        )}
      </Section>
        </>
      )}
      {segment === "analyse" && (
        <>
      <Section titel="Muskelstatus">
        <Card>
          <MuscleMap />
        </Card>
      </Section>
      <Section titel="Wochenvolumen je Muskelgruppe">
        <Card>
          <ul className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(muskelStatus) as MuscleKey[]).map((k) => {
              const m = muskelStatus[k];
              return (
                <li
                  key={k}
                  className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2 text-sm"
                >
                  <span className="truncate">{m.name}</span>
                  <span className="num shrink-0 text-muted-foreground">
                    {m.saetze} / {m.ziel}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </Section>

      <Section titel="Persönliche Rekorde">
        <Card className="p-2">
          {rekorde.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              Noch keine Rekorde – nach deinem ersten protokollierten Training erscheinen sie hier.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {rekorde.slice(0, 8).map((r) => (
                <li
                  key={r.uebungId}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3"
                >
                  <Trophy className="h-4 w-4 shrink-0 text-accent" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(r.datum).toLocaleDateString("de-DE")} · geschätztes 1RM ≈ {r.e1rm} kg
                    </p>
                  </div>
                  <span className="num shrink-0 text-sm font-bold">
                    {r.gewicht} kg × {r.wdh}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Disclaimer>
          Das 1RM wird aus Gewicht und Wiederholungen berechnet (Schätzformel) und ist kein tatsächlich
          getesteter Maximalwert.
        </Disclaimer>
      </Section>

      <Section titel="Historie">
        <Card className="flex items-center gap-3 text-sm text-muted-foreground">
          <History className="h-4 w-4 shrink-0" />
          {aktivitaet.einheiten.length} abgeschlossene Trainings · {einheitenSeit(aktivitaet, 7).length} in
          den letzten 7 Tagen · Serie {serie(aktivitaet)} ·{" "}
          {aktivitaet.einheiten.length > 0
            ? `Ø ${Math.round(
                aktivitaet.einheiten.reduce((s, e) => s + e.dauerMin, 0) / aktivitaet.einheiten.length,
              )} Minuten · Ø ${Math.round(
                aktivitaet.einheiten.reduce((s, e) => s + satzVolumen(e.saetze), 0) /
                  aktivitaet.einheiten.length,
              ).toLocaleString("de-DE")} kg Volumen`
            : "noch keine Historie"}
        </Card>
      </Section>
        </>
      )}
      <Disclaimer>
        Die Planvorschläge sind allgemeine Trainingsempfehlungen und ersetzen keine physiotherapeutische
        oder ärztliche Beratung. Nach Schwangerschaft, Operationen oder bei Beschwerden bitte vorab
        fachlich abklären lassen.
      </Disclaimer>
    </div>
  );
}

/** Findet die ursprüngliche Plan-ID zurück, wenn bereits getauscht wurde. */
function originalId(aktuelleId: string, tausch: Record<string, string>) {
  const eintrag = Object.entries(tausch).find(([, zu]) => zu === aktuelleId);
  return eintrag ? eintrag[0] : aktuelleId;
}

const musterLabels: { id: Muster; label: string }[] = [
  { id: "druecken", label: "Drücken" },
  { id: "ziehen", label: "Ziehen" },
  { id: "kniebeuge", label: "Kniebeuge" },
  { id: "huefte", label: "Hüfte / Gesäß" },
  { id: "schulter", label: "Schulter" },
  { id: "arme", label: "Arme" },
  { id: "core", label: "Rumpf" },
  { id: "mobility", label: "Mobility" },
  { id: "kondition", label: "Ausdauer" },

];

const equipmentOptionen: Equipment[] = [
  "körpergewicht",
  "kurzhantel",
  "langhantel",
  "maschine",
  "kabel",
  "band",
];

/** Auswahl aus der Bibliothek oder Anlegen einer eigenen Übung. */
function UebungHinzufuegen({
  geschlecht,
  eigene,
  bereitsImTag,
  onWaehlen,
  onEigeneErstellen,
  onEigeneLoeschen,
  onSchliessen,
}: {
  geschlecht: string | null;
  eigene: LibUebung[];
  bereitsImTag: string[];
  onWaehlen: (id: string, name: string) => void;
  onEigeneErstellen: (u: LibUebung) => void;
  onEigeneLoeschen: (id: string) => void;
  onSchliessen: () => void;
}) {
  const [suche, setSuche] = useState("");
  const [eigenModus, setEigenModus] = useState(false);
  const [name, setName] = useState("");
  const [muskel, setMuskel] = useState("");
  const [muster, setMuster] = useState<Muster>("druecken");
  const [equipment, setEquipment] = useState<Equipment[]>(["körpergewicht"]);
  const [saetze, setSaetze] = useState(3);
  const [wdh, setWdh] = useState("8–12");

  const treffer = useMemo(() => {
    const q = suche.trim().toLowerCase();
    const alle = [...eigene, ...uebungsBibliothek];
    return alle
      .filter((u) => !bereitsImTag.includes(u.id))
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.muskel.toLowerCase().includes(q))
      .slice(0, 40);
  }, [suche, eigene, bereitsImTag]);

  function speichereEigene() {
    if (!name.trim()) {
      toast.error("Bitte einen Namen für die Übung angeben.");
      return;
    }
    onEigeneErstellen({
      id: `eigen-${Date.now()}`,
      name: name.trim(),
      muskel: muskel.trim() || "Ganzkörper",
      muster,
      equipment: equipment.length ? equipment : ["körpergewicht"],
      grund: false,
      zielSaetze: saetze,
      wdhBereich: wdh.trim() || "8–12",
      startGewicht: 0,
      hinweis: "Selbst angelegte Übung.",
      rueckenschonend: true,
      rueckbildung: false,
      einsteiger: true,
    });
  }

  return (
    <Card className="mt-3">
      <div className="flex items-center justify-between">
        <p className="label-xs">{eigenModus ? "Eigene Übung erstellen" : "Übung auswählen"}</p>
        <button onClick={onSchliessen} aria-label="Auswahl schließen">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {!eigenModus ? (
        <>
          <input
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Übung oder Muskelgruppe suchen …"
            className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <ul className="mt-3 max-h-80 space-y-1.5 overflow-y-auto">
            {treffer.map((a) => (
              <li key={a.id}>
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                  <button
                    onClick={() => onWaehlen(a.id, a.name)}
                    className="col-span-2 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-secondary/60"
                  >
                    <img
                      src={bildFuer(a, geschlecht)}
                      alt=""
                      loading="lazy"
                      width={768}
                      height={512}
                      className="h-10 w-16 shrink-0 rounded-lg object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{a.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {a.muskel} · {a.equipment.join(", ")}
                      </span>
                    </span>
                  </button>
                  {a.id.startsWith("eigen-") && (
                    <button
                      onClick={() => onEigeneLoeschen(a.id)}
                      aria-label={`${a.name} dauerhaft löschen`}
                      className="p-2 text-muted-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
            {treffer.length === 0 && (
              <li className="px-2 py-4 text-sm text-muted-foreground">
                Keine passende Übung gefunden – lege sie einfach selbst an.
              </li>
            )}
          </ul>
          <button
            onClick={() => setEigenModus(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold"
          >
            <Plus className="h-4 w-4" /> Eigene Übung erstellen
          </button>
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="block text-sm">
            <span className="label-xs">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Rudern am Seilzug einarmig"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <label className="block text-sm">
            <span className="label-xs">Muskelgruppe</span>
            <input
              value={muskel}
              onChange={(e) => setMuskel(e.target.value)}
              placeholder="z. B. Rücken"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <div>
            <span className="label-xs">Bewegungsmuster</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {musterLabels.map((m) => (
                <Chip key={m.id} active={muster === m.id} onClick={() => setMuster(m.id)}>
                  {m.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <span className="label-xs">Equipment</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {equipmentOptionen.map((e) => (
                <Chip
                  key={e}
                  active={equipment.includes(e)}
                  onClick={() =>
                    setEquipment((alt) =>
                      alt.includes(e) ? alt.filter((x) => x !== e) : [...alt, e],
                    )
                  }
                >
                  {e}
                </Chip>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="label-xs">Sätze</span>
              <input
                type="number"
                min={1}
                max={10}
                value={saetze}
                onChange={(e) => setSaetze(Number(e.target.value) || 3)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
              />
            </label>
            <label className="block text-sm">
              <span className="label-xs">Wiederholungen</span>
              <input
                value={wdh}
                onChange={(e) => setWdh(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={speichereEigene}
              className="flex-1 rounded-xl bg-primary px-4 py-3 font-display text-sm font-extrabold uppercase tracking-wide text-primary-foreground"
            >
              Übung speichern
            </button>
            <button
              onClick={() => setEigenModus(false)}
              className="rounded-xl border border-border px-4 py-3 text-sm font-bold"
            >
              Zurück
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

/** Zeigt eine Belastungsempfehlung aus den zuletzt erfassten Erholungswerten. */
function AutoregulationsHinweis() {
  const { aktivitaet } = useAktivitaet();
  const r = readinessAusMessungen(aktivitaet);
  if (!r) return null;
  const stark = r.score >= 75;
  const mittel = r.score >= 55;
  return (
    <Card className={stark ? "border-success/40" : mittel ? "border-info/30" : "border-warning/50"}>
      <p className="text-sm leading-relaxed">
        <span className="font-bold">Bereitschaft {r.score}/100 · </span>
        {stark
          ? "Gute Voraussetzungen: heute darfst du an den Grundübungen steigern."
          : mittel
            ? "Training wie geplant – letzte Sätze mit 1–2 Wiederholungen Reserve."
            : "Reduziere Last und Volumen um rund 30 % oder mache heute eine lockere Einheit."}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Basis: {r.gruende.join(" · ")}</p>
    </Card>
  );
}
