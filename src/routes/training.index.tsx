import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Chip, Disclaimer, Section, Why } from "@/components/ui-kit";
import { workoutHeute, zeitModi, muskelStatus, type MuscleKey } from "@/lib/demo-data";
import { ChevronRight, Dumbbell, History, Repeat, Trophy } from "lucide-react";

export const Route = createFileRoute("/training/")({
  head: () => ({
    meta: [
      { title: "Training – Vektor" },
      {
        name: "description",
        content: "Personalisierter Trainingsplan, Zeit-Effizienz-Modus, Übungshistorie und Rekorde.",
      },
      { property: "og:title", content: "Training – Vektor" },
      { property: "og:description", content: "Dein Plan für heute – angepasst an Zeit und Erholung." },
    ],
  }),
  component: TrainingPage,
});

const plan = [
  { tag: "Montag", name: "Unterkörper – Kniebeuge-Fokus", dauer: 55, status: "erledigt" },
  { tag: "Dienstag", name: "Oberkörper – Push", dauer: 48, status: "erledigt" },
  { tag: "Mittwoch", name: "Oberkörper – Pull", dauer: 50, status: "erledigt" },
  { tag: "Donnerstag", name: "Ruhetag / Spaziergang", dauer: 0, status: "ruhetag" },
  { tag: "Freitag", name: "Unterkörper – Hip Hinge", dauer: 52, status: "erledigt" },
  { tag: "Samstag", name: "Oberkörper – Push", dauer: 42, status: "heute" },
  { tag: "Sonntag", name: "Ruhetag", dauer: 0, status: "ruhetag" },
];

const rekorde = [
  { uebung: "Bankdrücken", wert: "95 kg × 3", e1rm: "≈ 101 kg", datum: "vor 4 Tagen" },
  { uebung: "Kniebeuge", wert: "137,5 kg × 4", e1rm: "≈ 152 kg", datum: "vor 8 Tagen" },
  { uebung: "Kreuzheben", wert: "170 kg × 3", e1rm: "≈ 181 kg", datum: "vor 12 Tagen" },
  { uebung: "Klimmzüge", wert: "+20 kg × 6", e1rm: "—", datum: "vor 6 Tagen" },
];

export default function TrainingPage() {
  const [zeit, setZeit] = useState(60);
  const modus = zeitModi.find((m) => m.minuten === zeit)!;
  const anzahl =
    zeit >= 60 ? workoutHeute.uebungen.length : zeit >= 45 ? 4 : zeit >= 30 ? 3 : 2;

  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">Training</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">{workoutHeute.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fokus: {workoutHeute.fokus.join(" · ")} · geplant {modus.saetze} harte Sätze
        </p>
      </header>

      <Section titel="Wie viel Zeit hast du heute?">
        <Card>
          <div className="flex flex-wrap gap-2">
            {zeitModi.map((m) => (
              <Chip key={m.minuten} active={zeit === m.minuten} onClick={() => setZeit(m.minuten)}>
                {m.titel}
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{modus.beschreibung}</p>
          <Why
            punkte={[
              "Grundübungen mit dem größten Reiz bleiben immer enthalten.",
              "Isolationsübungen werden zuerst gekürzt, nicht zufällige Übungen.",
              "Bei knapper Zeit werden antagonistische Supersätze gebildet, um Pausen zu nutzen.",
              `Aktuell: ${anzahl} Übungen, ${modus.saetze} produktive Sätze.`,
            ]}
          />
          <Link
            to="/training/workout"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-display text-base font-extrabold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-[1.01]"
          >
            Training starten <ChevronRight className="h-5 w-5" />
          </Link>
        </Card>
      </Section>

      <Section titel="Übungen heute">
        <div className="space-y-3">
          {workoutHeute.uebungen.slice(0, anzahl).map((u) => (
            <Card key={u.id} className="p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display font-bold">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.muskel} · {u.zielSaetze} Sätze · {u.wdhBereich} Wdh.
                  </p>
                </div>
                <span className="num shrink-0 rounded-xl bg-secondary px-3 py-1.5 text-sm font-bold">
                  {u.vorschlag.gewicht} kg
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{u.hinweis}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                <Repeat className="mr-1 inline h-3 w-3" />
                Alternativen: {u.alternativen.join(", ")}
              </p>
            </Card>
          ))}
          {anzahl < workoutHeute.uebungen.length && (
            <p className="text-xs text-muted-foreground">
              {workoutHeute.uebungen.length - anzahl} Isolationsübung(en) wurden aufgrund deiner
              Zeitvorgabe entfernt.
            </p>
          )}
        </div>
      </Section>

      <Section titel="Trainingswoche">
        <Card className="p-2">
          <ul className="divide-y divide-border">
            {plan.map((p) => (
              <li key={p.tag} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.tag}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.name}</p>
                </div>
                <span
                  className={
                    "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider " +
                    (p.status === "erledigt"
                      ? "bg-success/15 text-success"
                      : p.status === "heute"
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground")
                  }
                >
                  {p.status === "erledigt" ? "Erledigt" : p.status === "heute" ? "Heute" : "Ruhetag"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section titel="Wochenvolumen je Muskelgruppe">
        <Card>
          <ul className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(muskelStatus) as MuscleKey[]).map((k) => {
              const m = muskelStatus[k];
              return (
                <li key={k} className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2 text-sm">
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
          <ul className="divide-y divide-border">
            {rekorde.map((r) => (
              <li key={r.uebung} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
                <Trophy className="h-4 w-4 shrink-0 text-accent" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{r.uebung}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.datum} · geschätztes 1RM {r.e1rm}
                  </p>
                </div>
                <span className="num shrink-0 text-sm font-bold">{r.wert}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Disclaimer>
          Das 1RM wird aus Gewicht und Wiederholungen berechnet (Schätzformel) und ist kein tatsächlich
          getesteter Maximalwert.
        </Disclaimer>
      </Section>

      <Section titel="Historie">
        <Card className="flex items-center gap-3 text-sm text-muted-foreground">
          <History className="h-4 w-4 shrink-0" />
          94 abgeschlossene Trainings · Ø 3,8 Einheiten/Woche · Ø 47 Minuten
          <Dumbbell className="ml-auto hidden h-4 w-4 shrink-0 sm:block" />
        </Card>
      </Section>
    </div>
  );
}
