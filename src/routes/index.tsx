import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronRight,
  Flame,
  Footprints,
  Beef,
  Dumbbell,
  Lock,
  Star,
  Check,
  Trophy,
  Sparkles,
  Timer,
} from "lucide-react";
import { Bar, Card, Chip, Disclaimer, QualityTag, Ring, Section, Stat, Why } from "@/components/ui-kit";
import { MuscleMap } from "@/components/muscle-map";
import {
  coachInsight,
  computeGoalScore,
  erfolg,
  gewichtsVerlauf,
  goalLabels,
  heute,
  journey,
  naechsterMeilenstein,
  profile,
  readiness,
  scoreWeights,
  woche,
  wochenKennzahlen,
  zeitModi,
} from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fitness-Cockpit – EVION" },
      {
        name: "description",
        content:
          "Goal Score, Tagesfokus, Wochenfortschritt, Körperstatus und KI-Empfehlungen auf einen Blick.",
      },
      { property: "og:title", content: "Fitness-Cockpit – EVION" },
      {
        property: "og:description",
        content: "Was soll ich heute tun? Mache ich Fortschritte? Bin ich bereit? Alles auf einem Screen.",
      },
      { property: "og:image", content: "https://evolve-fit.lovable.app/og-evion-cockpit.jpg" },
      { name: "twitter:image", content: "https://evolve-fit.lovable.app/og-evion-cockpit.jpg" },
      { property: "og:url", content: "https://evolve-fit.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://evolve-fit.lovable.app/" }],

  }),
  component: Cockpit,
});

function Cockpit() {
  const { score, parts } = computeGoalScore(profile.goal);
  const [zeit, setZeit] = useState<number | null>(null);
  const gewichtDelta = profile.startGewicht - profile.gewicht;
  const zielFortschritt = Math.round(
    (gewichtDelta / (profile.startGewicht - profile.zielGewicht)) * 100,
  );

  return (
    <div className="space-y-8">
      {/* HERO */}
      <header className="hero-glow surface relative overflow-hidden p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="label-xs">Guten Morgen, {profile.name}</p>
            <h1 className="mt-1 truncate font-display text-2xl font-extrabold">
              Ziel: {goalLabels[profile.goal]}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                Auf Kurs
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                +{profile.goalScoreDelta} Punkte ggü. letzter Woche
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                <Flame className="h-3.5 w-3.5" /> {profile.streak} Tage Streak
              </span>
            </div>
          </div>
          <Ring value={score} label={String(score)} sub="Goal Score" />
        </div>
        <ScoreErklaerung parts={parts} score={score} />
      </header>

      {/* ERFOLG */}
      <div className="surface flex items-center gap-4 border-primary/40 bg-primary/10 p-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Trophy className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="label-xs text-primary">{erfolg.titel}</p>
          <p className="num truncate text-xl font-extrabold">{erfolg.wert}</p>
          <p className="truncate text-sm text-muted-foreground">{erfolg.sub}</p>
        </div>
      </div>

      {/* HEUTE */}
      <Section titel="Heute">
        <Card>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <TagesZiel icon={Dumbbell} label="Training" value={heute.workoutName} sub={`${heute.dauer} Minuten`} />
            <TagesZiel
              icon={Beef}
              label="Protein"
              value={`${heute.protein.ist} / ${heute.protein.ziel} g`}
              pct={(heute.protein.ist / heute.protein.ziel) * 100}
            />
            <TagesZiel
              icon={Flame}
              label="Kalorien"
              value={`${heute.kalorien.ist.toLocaleString("de-DE")} / ${heute.kalorien.ziel.toLocaleString("de-DE")}`}
              pct={(heute.kalorien.ist / heute.kalorien.ziel) * 100}
            />
            <TagesZiel
              icon={Footprints}
              label="Schritte"
              value={`${heute.schritte.ist.toLocaleString("de-DE")} / ${heute.schritte.ziel.toLocaleString("de-DE")}`}
              pct={(heute.schritte.ist / heute.schritte.ziel) * 100}
            />
          </div>

          <Link
            to="/training/workout"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-display text-base font-extrabold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-[1.01]"
          >
            Training starten <ChevronRight className="h-5 w-5" />
          </Link>

          <div className="mt-4 rounded-2xl border border-border bg-secondary/40 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Timer className="h-4 w-4 text-primary" /> Heute nur wenig Zeit?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {zeitModi.map((m) => (
                <Chip key={m.minuten} active={zeit === m.minuten} onClick={() => setZeit(m.minuten)}>
                  {m.titel}
                </Chip>
              ))}
            </div>
            {zeit !== null && (
              <p className="mt-3 text-sm text-muted-foreground">
                {zeitModi.find((m) => m.minuten === zeit)?.beschreibung}. Grundübungen bleiben erhalten,
                Isolationsarbeit wird zuerst gekürzt.
              </p>
            )}
          </div>
        </Card>
      </Section>

      {/* FORTSCHRITT */}
      <Section
        titel="Dein Fortschritt"
        aktion={
          <Link to="/fortschritt" className="text-xs font-bold uppercase tracking-wider text-primary">
            Alle Daten
          </Link>
        }
      >
        <Card>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Stat label="Gewicht" value={`−${gewichtDelta.toFixed(1)}`} unit="kg" delta="seit Start" tone="good" />
            <Stat label="Körperfett" value="−3,2" unit="%" delta="geschätzt" tone="good" />
            <Stat label="Muskelmasse" value="+1,8" unit="kg" delta="geschätzt" tone="good" />
            <Stat label="Taille" value="−6,2" unit="cm" delta="gemessen" tone="good" />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">{zielFortschritt} % des Ziels erreicht</span>
              <span className="text-muted-foreground">
                {profile.gewicht} kg → {profile.zielGewicht} kg
              </span>
            </div>
            <Bar className="mt-2 h-3" value={zielFortschritt} />
          </div>

          <div className="mt-5 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={gewichtsVerlauf} margin={{ left: -18, right: 4, top: 6 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="woche" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v} kg`, "Gewicht"]}
                />
                <Area type="monotone" dataKey="gewicht" stroke="var(--primary)" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-3 rounded-xl bg-secondary/50 p-4 text-sm leading-relaxed">
            Dein Gewicht und dein Taillenumfang sinken, während deine Kraft in den letzten acht Wochen
            gestiegen ist. Dein aktueller Plan scheint gut zu funktionieren.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <QualityTag quality="gemessen" /> Gewicht, Taille
            <span className="mx-1 text-border">|</span>
            <QualityTag quality="geschätzt" /> Körperfett, Muskelmasse (BIA)
          </div>
          <Disclaimer>
            Körperfett- und Muskelmassewerte aus Bioimpedanz-Waagen sind Schätzwerte und können vom
            tatsächlichen Wert abweichen. Aussagekräftig ist vor allem der Trend.
          </Disclaimer>
        </Card>
      </Section>

      {/* DIESE WOCHE */}
      <Section
        titel="Diese Woche"
        aktion={
          <Link to="/wochenrueckblick" className="text-xs font-bold uppercase tracking-wider text-primary">
            Wochenreview
          </Link>
        }
      >
        <Card>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <p className="num text-2xl font-extrabold">4 / 5 Tage auf Kurs</p>
              <div className="mt-3 flex gap-2">
                {woche.map((d) => (
                  <div key={d.tag} className="flex flex-col items-center gap-1.5">
                    <span className="label-xs">{d.tag}</span>
                    <span
                      className={cn(
                        "h-7 w-7 rounded-full border-2",
                        d.state === "gruen" && "border-transparent bg-success",
                        d.state === "gelb" && "border-transparent bg-warning",
                        d.state === "offen" && "border-border bg-transparent",
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="label-xs">Wochen-Score</p>
              <p className="num text-4xl font-extrabold text-primary">{profile.weeklyScore}</p>
              <p className="text-xs font-semibold text-success">+{profile.weeklyScoreDelta} ggü. Vorwoche</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {wochenKennzahlen.map((k) => (
              <div key={k.label} className="grid grid-cols-[6rem_minmax(0,1fr)_3.5rem] items-center gap-3">
                <span className="truncate text-sm font-semibold">{k.label}</span>
                <Bar value={k.pct} tone={k.pct >= 90 ? "primary" : k.pct >= 80 ? "info" : "warning"} />
                <span className="num text-right text-sm text-muted-foreground">{k.value}</span>
              </div>
            ))}
          </div>
          <Why
            titel="Wie wird gewichtet?"
            punkte={Object.entries(scoreWeights[profile.goal]).map(
              ([k, v]) => `${k}: ${v} % Anteil am Score (Ziel: ${goalLabels[profile.goal]})`,
            )}
          />
        </Card>
      </Section>

      {/* KÖRPERSTATUS */}
      <Section titel="Körperstatus">
        <Card>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5">
            <Ring value={readiness.score} tone="info" sub="Bereit" size={112} />
            <div className="min-w-0 space-y-3">
              {[
                { l: "Schlaf", v: readiness.schlaf },
                { l: "Regeneration", v: readiness.regeneration },
                { l: "Muskelstatus", v: readiness.muskelstatus },
              ].map((r) => (
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
          <p className="mt-4 rounded-xl bg-secondary/50 p-4 text-sm font-semibold">{readiness.empfehlung}</p>
          <Why punkte={readiness.warum} />
          <Disclaimer>
            Der Körperstatus ist eine Schätzung auf Basis deiner Daten und keine medizinische Messung.
          </Disclaimer>
        </Card>
      </Section>

      {/* MUSKELSTATUS */}
      <Section titel="Muskelstatus">
        <Card>
          <MuscleMap />
        </Card>
      </Section>

      {/* JOURNEY */}
      <Section titel="Deine Journey">
        <Card>
          <ol className="relative space-y-1 pl-2">
            {journey.map((j, i) => (
              <li key={j.titel} className="relative flex gap-4 pb-5 last:pb-0">
                {i < journey.length - 1 && (
                  <span className="absolute left-[15px] top-8 h-full w-0.5 rounded bg-border" />
                )}
                <span
                  className={cn(
                    "z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2",
                    j.state === "done" && "border-transparent bg-success text-background",
                    j.state === "current" && "border-primary bg-primary/20 text-primary",
                    j.state === "open" && "border-border bg-card text-muted-foreground",
                    j.state === "locked" && "border-border bg-card text-muted-foreground",
                  )}
                >
                  {j.state === "done" && <Check className="h-4 w-4" />}
                  {j.state === "current" && <Star className="h-4 w-4" />}
                  {j.state === "open" && <span className="h-2 w-2 rounded-full bg-muted-foreground" />}
                  {j.state === "locked" && <Lock className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0 pt-1">
                  <p
                    className={cn(
                      "truncate font-display font-bold",
                      j.state === "current" && "text-primary",
                      (j.state === "locked" || j.state === "open") && "text-muted-foreground",
                    )}
                  >
                    {j.titel}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{j.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <p className="label-xs text-primary">Nächster Meilenstein</p>
            <p className="mt-1 font-display text-lg font-extrabold">{naechsterMeilenstein.titel}</p>
            <Bar
              className="mt-2"
              value={(naechsterMeilenstein.ist / naechsterMeilenstein.ziel) * 100}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {naechsterMeilenstein.ist} / {naechsterMeilenstein.ziel} · {naechsterMeilenstein.rest}
            </p>
          </div>
        </Card>
      </Section>

      {/* COACH */}
      <Section titel="KI-Coach">
        <Card className="border-info/30">
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-info/20 text-info">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm leading-relaxed">{coachInsight.text}</p>
              <Why punkte={coachInsight.warum} />
              <Link
                to="/ernaehrung"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-bold transition-colors hover:border-primary/60"
              >
                {coachInsight.aktion} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Card>
      </Section>

      <Disclaimer>
        EVION ersetzt keine medizinische Beratung. Empfehlungen basieren auf deinen erfassten Daten und
        allgemeinen Trainings- und Ernährungsprinzipien. Bei Beschwerden, Verletzungen oder Erkrankungen
        wende dich bitte an medizinisches Fachpersonal.
      </Disclaimer>
    </div>
  );
}

function TagesZiel({
  icon: Icon,
  label,
  value,
  sub,
  pct,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  sub?: string;
  pct?: number;
}) {
  return (
    <div className="min-w-0">
      <p className="label-xs flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </p>
      <p className="num mt-1.5 truncate text-base font-bold">{value}</p>
      {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      {pct !== undefined && <Bar className="mt-2" value={pct} tone={pct >= 90 ? "primary" : "info"} />}
    </div>
  );
}

function ScoreErklaerung({
  parts,
  score,
}: {
  parts: { key: string; weight: number; value: number; beitrag: number }[];
  score: number;
}) {
  return (
    <Why
      titel="Wie wird mein Score berechnet?"
      punkte={[
        `Gewichtung passend zu deinem Ziel „${goalLabels[profile.goal]}“.`,
        ...parts.map((p) => `${p.key}: ${p.value} % erfüllt × ${p.weight} % Gewicht`),
        `Ergebnis: ${score} von 100. Supplements fließen bewusst nicht relevant in den Score ein.`,
      ]}
    />
  );
}
