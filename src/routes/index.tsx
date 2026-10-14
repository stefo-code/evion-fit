import { SuppCheckliste } from "@/components/supp-checkliste";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Info, MessageSquare, Trophy, X } from "lucide-react";
import { Bar, Card, Disclaimer, Ring, Section } from "@/components/ui-kit";
import { computeGoalScore, goalLabels } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
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
import { BackupHinweis } from "@/components/backup-hinweis";
import {
  aktiveTrainingstage,
  baueVorlagen,
  mappeEquipment,
  usePlanEinstellungen,
  vorlageFuerTag,
  type PlanKontext,
} from "@/lib/training-plan";
import { berechneDauerMin } from "@/lib/training-dauer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const navigate = useNavigate();
  const { profil, geladen } = useOnboardingProfil();
  useEffect(() => {
    if (geladen && !profil.abgeschlossen) void navigate({ to: "/onboarding" });
  }, [geladen, profil.abgeschlossen, navigate]);
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
  const plan = useMemo(() => baueVorlagen(kontext, einstellungen), [kontext, einstellungen]);
  const naechsterTag =
    vorlageFuerTag(plan, einstellungen, gewaehlteTage, (new Date().getDay() + 6) % 7) ?? plan[0];
  const naechsterTagIndex = naechsterTag?.index ?? 0;
  const naechsterDauerMin = naechsterTag ? berechneDauerMin(naechsterTag, einstellungen) : profil.dauer || 45;

  const einheitenGesamt = aktivitaet.einheiten.length;
  const leer = einheitenGesamt < 1;

  // --- Kennzahlen -----------------------------------------------------------
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

  const eigeneReadiness = readinessAusMessungen(aktivitaet);
  const bereitschaft = eigeneReadiness?.score ?? 0;
  const wochenScore = Math.min(100, Math.round((einheitenWoche / Math.max(1, gewaehlteTage.length)) * 100));

  const meilenstein = erfolgsStatus(aktivitaet).find((e) => !e.erreicht) ?? null;

  const coachText = leer
    ? null
    : volumenDelta > 0
      ? `Trainingsvolumen liegt ${Math.round(volumenDelta).toLocaleString("de-DE")} kg über der Vorwoche.`
      : gewichtDelta !== null && Math.abs(gewichtDelta) < 0.3
        ? "Gewicht seit Start weitgehend stabil – bei steigendem Volumen ein Recomposition-Muster."
        : `In den letzten 7 Tagen wurden ${einheitenWoche} Einheiten protokolliert.`;

  const [infoOpen, setInfoOpen] = useState(false);

  const dim = leer ? "opacity-60" : "";

  if (!geladen || !profil.abgeschlossen) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-72 animate-pulse rounded-3xl bg-secondary" />
        <div className="h-10 animate-pulse rounded-xl bg-secondary" />
        <div className="h-40 animate-pulse rounded-3xl bg-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-28">
      {/* ZONE 1 — COCKPIT */}
      <Card className="hero-glow relative overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <p className="label-xs">Hallo{eff.name ? `, ${eff.name}` : ""}</p>
            <h1 className="mt-1 font-display text-xl font-extrabold leading-tight break-words sm:text-2xl">
              Ziel: {goalLabels[eff.ziel]}
            </h1>
          </div>
          <Link
            to="/profil"
            aria-label="Dein Profil"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/12 font-display text-sm font-extrabold text-primary"
          >
            {(eff.name || "E").slice(0, 1).toUpperCase()}
          </Link>
        </div>

        {/* b) Kennzahlenzeile */}
        <div className="mt-5 flex items-center gap-4">
          <Link to="/erfolge" aria-label="Goal Score – zu den Erfolgen" className={cn("shrink-0", dim)}>
            <Ring value={leer ? 0 : score} label={leer ? "—" : String(score)} sub="Goal Score" size={118} />
          </Link>
          <div className="min-w-0 flex-1 space-y-3">
            <Link to="/fortschritt" className={cn("flex items-center gap-3", dim)}>
              <Ring
                value={eigeneReadiness ? bereitschaft : 0}
                label={eigeneReadiness ? String(bereitschaft) : "—"}
                size={54}
                stroke={6}
                tone="info"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">Bereitschaft</p>
                <p className="text-[11px] leading-snug text-muted-foreground">Schlaf · Regeneration · Muskeln</p>
              </div>
            </Link>
            <Link to="/wochenrueckblick" className={cn("flex items-center gap-3", dim)}>
              <Ring
                value={leer ? 0 : wochenScore}
                label={leer ? "—" : String(wochenScore)}
                size={54}
                stroke={6}
                tone="info"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">
                  Wochen-Score
                </p>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {leer ? "— Einheiten / 7 Tage" : `${einheitenWoche} Einheiten / 7 Tage`}
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* c) Wochentagsreihe */}
        <div className="mt-5 border-t border-border pt-4">
          <div className="flex justify-between gap-1">
            {trainingsTage.map((t) => (
              <div key={t.tag} className="flex flex-col items-center gap-1.5">
                <span className="label-xs">{t.tag}</span>
                <span
                  className={cn(
                    "h-5 w-5 rounded-full border-2",
                    t.state === "erledigt" && "border-transparent bg-primary",
                    t.state === "geplant" && "border-primary/50 bg-transparent",
                    t.state === "leer" && "border-border bg-transparent",
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {/* d) Kennzahlenraster */}
        <Link to="/fortschritt" className="mt-4 block border-t border-border pt-4">
          {!leer && gewichtsKurve.length > 1 && (
            <Sparkline werte={gewichtsKurve.map((p) => p.wert)} />
          )}
          <div className={cn("grid grid-cols-2 gap-x-4 gap-y-4", !leer && gewichtsKurve.length > 1 && "mt-3")}>
            <Delta label="Gewicht" wert={leer ? null : gewichtDelta} einheit="kg" gutWennNegativ />
            <Delta label="Körperfett" wert={leer ? null : fettDelta} einheit="%" gutWennNegativ />
            <Delta label="Volumen" wert={leer ? null : Math.round(volumenDelta)} einheit="kg" ohneSuffix />
            <Delta label="Rekorde" wert={leer ? null : anzahlRekorde} einheit="" ohneVorzeichen ohneSuffix />
          </div>
        </Link>

        {/* Insight-Zeile */}
        {!leer && coachText && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-start gap-2.5">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground line-clamp-2">
                {coachText}{" "}
                <Link to="/coach" className="font-semibold text-primary">
                  Mehr im Coach
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* e) ein einziges ⓘ */}
        <button
          onClick={() => setInfoOpen(true)}
          aria-label="Wie werden diese Werte berechnet?"
          className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
        >
          <Info className="h-4 w-4" /> Wie werden diese Werte berechnet?
        </button>
      </Card>

      <TabSheet
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        tabs={[
          {
            titel: "Goal Score",
            punkte: [
              `Gewichtung passend zu deinem Ziel „${goalLabels[eff.ziel]}“.`,
              ...parts.map((p) => `${p.key}: ${p.value} % erfüllt × ${p.weight} % Gewicht`),
              `Ergebnis: ${score} von 100. Supplements fließen bewusst nicht in den Score ein.`,
            ],
          },
          {
            titel: "Bereitschaft",
            punkte: eigeneReadiness ? eigeneReadiness.gruende : ["Noch keine Messungen zu Schlaf und Erholung."],
          },
          {
            titel: "Wochen-Score",
            punkte: [
              "Basis sind protokollierte Einheiten der letzten 7 Tage.",
              "Trainingsvolumen und Regelmäßigkeit bestimmen die Höhe.",
              "Das Delta vergleicht mit der Vorwoche.",
            ],
          },
        ]}
      />

      {/* ZONE 2 — HEUTE */}
      {naechsterTag && gewaehlteTage.includes(heuteIdx) && (
        <div className="border-y border-border py-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-muted-foreground break-words">
              Heute geplant: {naechsterTag.titel}, {naechsterDauerMin} Min
            </span>
            <Link to="/training/workout" search={{ tag: naechsterTagIndex }} className="font-semibold text-primary">
              Starten
            </Link>
          </div>
        </div>
      )}

      {/* Leerzustand-Zeile */}
      {leer && (
        <p className="text-sm text-muted-foreground">
          Mit der ersten protokollierten Einheit füllt sich dein Cockpit.{" "}
          <Link
            to="/training/workout"
            search={{ tag: naechsterTagIndex }}
            className="font-semibold text-primary"
          >
            Erstes Training
          </Link>
        </p>
      )}

      <SuppCheckliste />

      {/* ZONE 3 — HINWEISE */}
      <Section titel="Hinweise">
        <Card className="p-0">
          <div className="divide-y divide-border">
            {meilenstein && (
              <HinweisZeile
                icon={<Trophy className="h-4 w-4" />}
                titel={meilenstein.titel}
                unterzeile={
                  leer
                    ? meilenstein.beschreibung
                    : `noch ${Math.max(0, meilenstein.ziel - meilenstein.aktuell).toLocaleString("de-DE")} bis zum Ziel`
                }
                fortschritt={(meilenstein.aktuell / meilenstein.ziel) * 100}
                onClick={() => navigate({ to: "/erfolge" })}
              />
            )}
            <div className="px-5 py-4">
              <BackupHinweis />
            </div>
          </div>
        </Card>
      </Section>

      {/* ZONE 4 */}
      <Disclaimer>
        EVION ersetzt keine medizinische Beratung. Auswertungen basieren auf deinen erfassten Daten und
        allgemeinen Trainings- und Ernährungsprinzipien.
      </Disclaimer>
    </div>
  );
}

function HinweisZeile({
  icon,
  titel,
  unterzeile,
  fortschritt,
  onClick,
  onDismiss,
}: {
  icon: React.ReactNode;
  titel: string;
  unterzeile: string;
  fortschritt?: number;
  onClick: () => void;
  onDismiss?: () => void;
}) {
  const startX = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);

  return (
    <button
      type="button"
      onClick={onClick}
      onTouchStart={(e) => {
        if (!onDismiss) return;
        startX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchMove={(e) => {
        const x = e.touches[0]?.clientX;
        if (startX.current === null || x === undefined) return;
        setOffset(Math.min(0, x - startX.current));
      }}
      onTouchEnd={() => {
        if (offset < -80) onDismiss?.();
        startX.current = null;
        setOffset(0);
      }}
      style={{ transform: offset ? `translateX(${offset}px)` : undefined }}
      className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-secondary/40"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug">{titel}</span>
        {fortschritt !== undefined && <Bar className="mt-2 h-1" value={fortschritt} />}
        <span className="mt-1 block text-xs text-muted-foreground">{unterzeile}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function TabSheet({
  open,
  onClose,
  tabs,
}: {
  open: boolean;
  onClose: () => void;
  tabs: { titel: string; punkte: string[] }[];
}) {
  const [aktiv, setAktiv] = useState(0);
  if (!open) return null;
  const tab = tabs[aktiv] ?? tabs[0];
  if (!tab) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Schließen" onClick={onClose} className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
      <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 pb-8">
        <div className="flex items-center gap-3">
          <p className="font-display text-base font-extrabold">Wie wird das berechnet?</p>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((t, i) => (
            <button
              key={t.titel}
              onClick={() => setAktiv(i)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors",
                i === aktiv
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {t.titel}
            </button>
          ))}
        </div>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {tab.punkte.map((p) => (
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

function Delta({
  label,
  wert,
  einheit,
  gutWennNegativ,
  ohneVorzeichen,
  ohneSuffix,
}: {
  label: string;
  wert: number | null;
  einheit: string;
  gutWennNegativ?: boolean;
  ohneVorzeichen?: boolean;
  ohneSuffix?: boolean;
}) {
  const positivGut = wert === null ? false : gutWennNegativ ? wert < 0 : wert > 0;
  return (
    <div className="min-w-0">
      <p className="label-xs truncate">{label}</p>
      <p className={cn("num mt-1 text-lg font-bold", positivGut ? "text-success" : "text-foreground")}>
        {wert === null
          ? "—"
          : `${!ohneVorzeichen && wert > 0 ? "+" : !ohneVorzeichen && wert < 0 ? "−" : ""}${Math.abs(wert).toLocaleString("de-DE")}`}
        {wert !== null && einheit && (
          <span className="ml-1 text-xs font-semibold text-muted-foreground">{einheit}</span>
        )}
      </p>
      {!ohneSuffix && <p className="text-[11px] text-muted-foreground">seit Start</p>}
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
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-12 w-full" aria-hidden>
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
