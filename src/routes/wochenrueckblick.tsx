import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Disclaimer, Section, Stat } from "@/components/ui-kit";
import { weeklyReview } from "@/lib/demo-data";
import { ArrowRight, CheckCircle2, Target, TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/wochenrueckblick")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Wochenrückblick – EVION" },
      {
        name: "description",
        content: "Deine Woche in Zahlen mit Einordnung und konkretem Fokus für die kommende Woche.",
      },
      { property: "og:title", content: "Wochenrückblick – EVION" },
      { property: "og:description", content: "Was lief gut, was ändern wir – einmal pro Woche." },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  return (
    <div className="space-y-8">
      <header className="hero-glow surface p-6">
        <p className="label-xs">Deine Woche</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">
          Score {weeklyReview.score} <span className="text-lg text-muted-foreground">/ 100</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">KW 26 · 24.06. – 30.06.</p>
      </header>

      <Card>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Stat label="Training" value={weeklyReview.training} />
          <Stat label="Kraft" value={weeklyReview.kraft} tone="good" />
          <Stat label="Gewicht" value={weeklyReview.gewicht} tone="good" />
          <Stat label="Taille" value={weeklyReview.taille} tone="good" />
          <Stat label="Protein" value={weeklyReview.protein} />
          <Stat label="Schlaf" value={weeklyReview.schlaf} />
          <Stat label="Schritte" value={weeklyReview.schritte} />
          <Stat label="Streak" value="12 Tage" tone="good" />
        </div>
      </Card>

      <Section titel="Was lief gut?">
        <Card>
          <ul className="space-y-2 text-sm">
            {weeklyReview.gutGelaufen.map((t) => (
              <li key={t} className="flex gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {t}
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section titel="Was kann besser werden?">
        <Card>
          <ul className="space-y-2 text-sm">
            {weeklyReview.besser.map((t) => (
              <li key={t} className="flex gap-2.5">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                {t}
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section titel="Was sollte angepasst werden?">
        <Card>
          <ul className="space-y-2 text-sm">
            {weeklyReview.anpassen.map((t) => (
              <li key={t} className="flex gap-2.5">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                {t}
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section titel="Fokus für nächste Woche">
        <Card className="border-primary/40 bg-primary/10">
          <p className="flex gap-2.5 font-display text-lg font-bold">
            <Target className="mt-1 h-5 w-5 shrink-0 text-primary" />
            {weeklyReview.fokus}
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-primary-foreground"
          >
            Übernehmen
          </Link>
        </Card>
      </Section>

      <Disclaimer>
        Die Auswertung basiert auf deinen erfassten Daten der letzten Woche. Einzelne Tage werden bewusst
        nicht überbewertet.
      </Disclaimer>
    </div>
  );
}
