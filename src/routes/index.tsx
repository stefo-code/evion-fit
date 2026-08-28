import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronRight, Info } from "lucide-react";
import { Bar, Card, Disclaimer, InfoSheet, Ring, Section } from "@/components/ui-kit";
import { computeGoalScore, goalLabels, profile } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { Nudge } from "@/components/nudge";
import { effektivesProfil, useOnboardingProfil } from "@/lib/onboarding-store";
import {
  einheitenSeit,
  erfolgsStatus,
  ersterWert,
  letzterWert,
  readinessAusMessungen,
  rekorde,
  useAktivitaet,
  verlauf,
  volumen as satzVolumen,
} from "@/lib/activity-store";
import { readiness } from "@/lib/demo-data";
import {
  aktiveTrainingstage,
  erzeugePlan,
  mappeEquipment,
  usePlanEinstellungen,
  wendeAnpassungenAn,
  wendeTauschAn,
  type PlanKontext,
} from "@/lib/training-plan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Status-Dashboard – EVION" },
      {
        name: "description",
        content:
          "Goal Score, Veränderungen der letzten 7 Tage, Momentum, Körperstatus und der nächste Meilenstein auf einen Blick.",
      },
      { property: "og:title", content: "Status-Dashboard – EVION" },
      {
        property: "og:description",
        content: "Wie entwickle ich mich? Ein ruhiges Statusbild aus Training, Körperwerten und Erholung.",
      },
      { property: "og:image", content: "https://evion-fit.lovable.app/og-evion-cockpit.jpg" },
      { name: "twitter:image", content: "https://evion-fit.lovable.app/og-evion-cockpit.jpg" },
      { property: "og:url", content: "https://evion-fit.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://evion-fit.lovable.app/" }],
  }),
  component: Cockpit,
});

const wochentage = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

function Cockpit() {
  const { profil } = useOnboardingProfil();
  const eff = effektivesProfil(profil);
  const { score, parts } = computeGoalScore(eff.ziel);
  const { aktivitaet } = useAktivitaet();
  const { einstellungen } = usePlanEinstellungen();
  const gewaehlteTage = useMemo(
    () => aktiveTrainingstage(einstellungen, profil.tage || 4),
    [einstellungen, profil.tage],
  );

  const kontext: PlanKontext = useMemo(
    () => ({
      ziel: profil.abgeschlossen ? profil.ziel : "recomposition",
      geschlecht: profil.geschlecht,
      alter: profil.alter,
      erfahrung: profil.erfahrung,
      equipment: mappeEquipment([...(profil.equipment ?? []), ...(profil.orte ?? [])]),
      tage: gewaehlteTage.length,
      dauer: profil.dauer || 45,
      fokus: einstellungen.fokus,
    }),
    [profil, einstellungen.fokus, gewaehlteTage],
  );
  const plan = useMemo(
    () => wendeAnpassungenAn(wendeTauschAn(erzeugePlan(kontext), einstellungen.tausch), einstellungen),
    [kontext, einstellungen],
  );
  const naechsterTagIndex = plan.length > 0 ? aktivitaet.einheiten.length % plan.length : 0;
  const naechsterTag = plan[naechsterTagIndex];

  const einheitenGesamt = aktivitaet.einheiten.length;
  const onboardingModus = einheitenGesamt < 1;

  // --- Sektion 2: Was sich verändert hat -----------------------------------
  const gewichtsKurve = verlauf(aktivitaet, "gewicht", 365);
  const gewichtStart = ersterWert(aktivitaet, "gewicht")?.wert ?? null;
  const gewichtJetzt = letzterWert(aktivitaet, "gewicht")?.wert ?? null;
  const gewichtDelta =
    gewichtStart !== null && gewichtJetzt !== null ? +(gewichtJetzt - gewichtStart).toFixed(1) : null;
  const fettStart = ersterWert(aktivitaet, "koerperfett")?.wert ?? null;
  const fettJetzt = letzterWert(aktivitaet, "koerperfett")?.wert ?? null;
  const fettDelta = fettStart !== null && fettJetzt !== null ? +(fettJetzt - fettStart).toFixed(1) : null;

  const volumen7 = einheitenSeit(aktivitaet, 7).reduce((s, e) => s + satzVolumen(e.saetze), 0);
  const volumen14 = einheitenSeit(aktivitaet, 14).reduce((s, e) => s + satzVolumen(e.saetze), 0);
  const volumenDelta = volumen7 - (volumen14 - volumen7);
  const anzahlRekorde = rekorde(aktivitaet).length;

  // --- Sektion 3: Momentum -------------------------------------------------
  const heuteIdx = (new Date().getDay() + 6) % 7;
  const trainingsTage = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - heuteIdx);
    const erledigt = new Set<number>();
    for (const e of aktivitaet.einheiten) {
      const d = new Date(e.datum);
      const diff = Math.floor((d.getTime() - start.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) erledigt.add(diff);
    }
    return wochentage.map((tag, i) => {
      if (erledigt.has(i)) return { tag, state: "erledigt" as const };
      if (i >= heuteIdx && gewaehlteTage.includes(i)) return { tag, state: "geplant" as const };
      return { tag, state: "leer" as const };
    });
  }, [aktivitaet.einheiten, heuteIdx, gewaehlteTage]);
  const einheitenWoche = trainingsTage.filter((t) => t.state === "erledigt").length;

  // --- Sektion 4: Körperstatus --------------------------------------------
  const eigeneReadiness = readinessAusMessungen(aktivitaet);
  const bereitschaft = eigeneReadiness?.score ?? readiness.score;
  const koerperWerte = [
    { l: "Schlaf", v: readiness.schlaf },
    { l: "Regeneration", v: readiness.regeneration },
    { l: "Muskelstatus", v: readiness.muskelstatus },
  ];

  // --- Sektion 5: Nächster Meilenstein -------------------------------------
  const meilenstein = erfolgsStatus(aktivitaet).find((e) => !e.erreicht) ?? null;

  // --- Sektion 6: Coach ----------------------------------------------------
  const coachText = onboardingModus
    ? "Deine Auswertung entsteht, sobald die erste Einheit protokolliert ist."
    : volumenDelta > 0
      ? `Dein Trainingsvolumen liegt in den letzten 7 Tagen um ${Math.round(volumenDelta).toLocaleString("de-DE")} kg über der Vorwoche.`
      : gewichtDelta !== null && Math.abs(gewichtDelta) < 0.3
        ? "Dein Gewicht ist seit Start weitgehend stabil – bei steigendem Volumen ein typisches Recomposition-Muster."
        : `In den letzten 7 Tagen wurden ${einheitenWoche} Einheiten protokolliert.`;

  const [scoreInfo, setScoreInfo] = useState(false);
  const [koerperInfo, setKoerperInfo] = useState(false);

  return (
    <div className="space-y-8">
      {/* 1 — HEADER */}
      <header className="hero-glow surface relative overflow-hidden p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="label-xs truncate whitespace-nowrap">Hallo, {eff.name}</p>
              <h1 className="mt-1 truncate whitespace-nowrap font-display text-lg font-extrabold leading-tight sm:text-xl md:text-2xl">
                Ziel: {goalLabels[eff.ziel]}
              </h1>
            </div>
            <Link
              to="/profil"
              aria-label="Dein Profil"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/12 font-display text-sm font-extrabold text-primary"
            >
              {eff.name.slice(0, 1).toUpperCase()}
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Ring value={score} label={String(score)} sub="Goal Score" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-success">
                +{profile.goalScoreDelta} ggü. Vorwoche
              </p>
              <span className="inline-flex rounded-full bg-primary/12 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                Auf Kurs
              </span>
              <button
                onClick={() => setScoreInfo(true)}
                aria-label="Wie wird mein Score berechnet?"
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
              >
                <Info className="h-4 w-4" /> Wie wird mein Score berechnet?
              </button>
            </div>
          </div>
        </div>
        <InfoSheet
          titel="Wie wird mein Score berechnet?"
          open={scoreInfo}
          onClose={() => setScoreInfo(false)}
          punkte={[
            `Gewichtung passend zu deinem Ziel „${goalLabels[eff.ziel]}“.`,
            ...parts.map((p) => `${p.key}: ${p.value} % erfüllt × ${p.weight} % Gewicht`),
            `Ergebnis: ${score} von 100. Supplements fließen bewusst nicht in den Score ein.`,
          ]}
        />
      </header>

      {/* Adaptive Rückfrage – dismissbar, maximal eine */}
      <Nudge
        frage={{
          id: "dauer-40",
          text: "Deine Trainings dauern durchschnittlich 38 Minuten statt der geplanten 60 Minuten.",
          hinweis: "Soll EVION zukünftige Workouts auf etwa 40 Minuten auslegen?",
          antworten: ["Ja, anpassen", "Nein"],
        }}
      />

      {/* Heute — schmale, zurückgenommene Zeile direkt unter dem Header */}
      <div className="border-y border-border py-3 text-sm">
        {naechsterTag && gewaehlteTage.includes(heuteIdx) ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-muted-foreground">
              Heute geplant: {naechsterTag.titel}, {profil.dauer || 45} Min
            </span>
            <Link
              to="/training/workout"
              search={{ tag: naechsterTagIndex }}
              className="font-semibold text-primary"
            >
              Starten
            </Link>
            <Link to="/training" className="font-semibold text-muted-foreground underline">
              Weniger Zeit?
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-muted-foreground">Heute kein Training geplant</span>
            <Link to="/training" className="font-semibold text-primary">
              Trotzdem trainieren
            </Link>
          </div>
        )}
      </div>

      {/* 2 — WAS SICH VERÄNDERT HAT */}
      <Section titel="Was sich verändert hat">
        <Link to="/fortschritt" className="block">
          <Card className="transition-colors hover:border-primary/40">
            {gewichtsKurve.length > 1 ? (
              <Sparkline werte={gewichtsKurve.map((p) => p.wert)} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Noch keine Trendkurve — ab der zweiten Messung sichtbar.
              </p>
            )}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <Delta label="Gewicht" wert={gewichtDelta} einheit="kg" gutWennNegativ />
              <Delta label="Körperfett" wert={fettDelta} einheit="%" gutWennNegativ />
              <Delta
                label="Volumen"
                wert={onboardingModus ? null : Math.round(volumenDelta)}
                einheit="kg"
              />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Rekorde: <span className="num font-semibold text-foreground">{anzahlRekorde}</span>
            </p>
          </Card>
        </Link>
      </Section>

      {/* 3 — DEIN MOMENTUM */}
      <Section titel="Dein Momentum">
        <Link to="/wochenrueckblick" className="block">
          <Card className="transition-colors hover:border-primary/40">
            <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  {trainingsTage.map((t) => (
                    <div key={t.tag} className="flex flex-col items-center gap-1.5">
                      <span className="label-xs">{t.tag}</span>
                      <span
                        className={cn(
                          "h-6 w-6 rounded-full border-2",
                          t.state === "erledigt" && "border-transparent bg-primary",
                          t.state === "geplant" && "border-primary/50 bg-transparent",
                          t.state === "leer" && "border-border bg-transparent",
                        )}
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {onboardingModus
                    ? "Noch keine Einheiten in den letzten 7 Tagen erfasst."
                    : `${einheitenWoche} ${einheitenWoche === 1 ? "Einheit" : "Einheiten"} in den letzten 7 Tagen`}
                </p>
              </div>
              <div className="flex items-baseline justify-between gap-3 sm:text-right">
                <p className="label-xs">Wochen-Score</p>
                <p className="num text-2xl font-extrabold">{profile.weeklyScore}</p>
                <p className="text-xs font-semibold text-success">+{profile.weeklyScoreDelta}</p>
              </div>
            </div>
          </Card>
        </Link>
      </Section>

      {/* 4 — KÖRPERSTATUS */}
      <Section titel="Körperstatus">
        <Card>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5">
            <Ring value={bereitschaft} tone="info" sub="Bereit" size={112} />
            <div className="min-w-0 space-y-3">
              {koerperWerte.map((r) => (
                <div key={r.l}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{r.l}</span>
                    <span className="num text-muted-foreground">{r.v}</span>
                  </div>
                  <Bar className="mt-1.5" value={r.v} tone="info" />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setKoerperInfo(true)}
            aria-label="Wie entsteht der Körperstatus?"
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
          >
            <Info className="h-4 w-4" /> Wie entsteht der Körperstatus?
          </button>
          <InfoSheet
            titel="Wie entsteht der Körperstatus?"
            open={koerperInfo}
            onClose={() => setKoerperInfo(false)}
            punkte={eigeneReadiness ? eigeneReadiness.gruende : readiness.warum}
          />
        </Card>
      </Section>

      {/* 5 — NÄCHSTER MEILENSTEIN */}
      {meilenstein && (
        <Section titel="Nächster Meilenstein">
          <Link to="/erfolge" className="block">
            <Card className="transition-colors hover:border-primary/40">
              <p className="font-display text-base font-extrabold">{meilenstein.titel}</p>
              <Bar className="mt-3" value={(meilenstein.aktuell / meilenstein.ziel) * 100} />
              <p className="mt-2 text-sm text-muted-foreground">
                {onboardingModus
                  ? meilenstein.beschreibung
                  : `noch ${Math.max(0, meilenstein.ziel - meilenstein.aktuell).toLocaleString("de-DE")} bis zum Ziel · ${meilenstein.beschreibung}`}
              </p>
            </Card>
          </Link>
        </Section>
      )}

      {/* 6 — COACH */}
      <Section titel="Coach">
        <Card>
          <p className="text-sm leading-relaxed">{coachText}</p>
          <Link
            to="/coach"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            Zum Coach <ChevronRight className="h-4 w-4" />
          </Link>
        </Card>
      </Section>

      {/* Onboarding: erster Schritt */}
      {onboardingModus && (
        <Card className="border-primary/40 bg-primary/8">
          <p className="label-xs text-primary">Erster Schritt</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Mit der ersten protokollierten Einheit entstehen Trends, Momentum und Meilensteine automatisch.
          </p>
          <Link
            to="/training/workout"
            search={{ tag: naechsterTagIndex }}
            className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-primary-foreground"
          >
            Erstes Training
          </Link>
        </Card>
      )}

      <Disclaimer>
        EVION ersetzt keine medizinische Beratung. Auswertungen basieren auf deinen erfassten Daten und
        allgemeinen Trainings- und Ernährungsprinzipien.
      </Disclaimer>
    </div>
  );
}

function Delta({
  label,
  wert,
  einheit,
  gutWennNegativ,
}: {
  label: string;
  wert: number | null;
  einheit: string;
  gutWennNegativ?: boolean;
}) {
  const positivGut = wert === null ? false : gutWennNegativ ? wert < 0 : wert > 0;
  return (
    <div className="min-w-0">
      <p className="label-xs truncate">{label}</p>
      <p className={cn("num mt-1 text-lg font-bold", positivGut ? "text-success" : "text-foreground")}>
        {wert === null ? "—" : `${wert > 0 ? "+" : wert < 0 ? "−" : ""}${Math.abs(wert).toLocaleString("de-DE")}`}
        {wert !== null && <span className="ml-1 text-xs font-semibold text-muted-foreground">{einheit}</span>}
      </p>
      <p className="text-[11px] text-muted-foreground">seit Start</p>
    </div>
  );
}

function Sparkline({ werte }: { werte: number[] }) {
  const min = Math.min(...werte);
  const max = Math.max(...werte);
  const spanne = max - min || 1;
  const punkte = werte
    .map((w, i) => `${(i / (werte.length - 1)) * 100},${28 - ((w - min) / spanne) * 24}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-14 w-full" aria-hidden>
      <polyline
        points={punkte}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
