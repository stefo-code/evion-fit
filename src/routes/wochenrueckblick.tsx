import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Stat } from "@/components/ui-kit";
import { einheitenSeit, useAktivitaet, veraenderung, volumen } from "@/lib/activity-store";
import { summiere, useErnaehrung, heuteKey } from "@/lib/nutrition-store";

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
  const { aktivitaet, geladen } = useAktivitaet();
  const { daten } = useErnaehrung();
  const woche = einheitenSeit(aktivitaet, 7);
  const vol = woche.reduce((s, e) => s + volumen(e.saetze), 0);
  const dGewicht = veraenderung(aktivitaet, "gewicht", 7);
  const schlaf = aktivitaet.messungen
    .filter((m) => Date.now() - new Date(m.datum).getTime() < 7 * 86400000 && m.schlafStunden)
    .map((m) => m.schlafStunden as number);
  const tage = Array.from({ length: 7 }, (_, i) => heuteKey(new Date(Date.now() - i * 86400000)));
  const proteinTage = tage
    .map((t) => summiere(daten.mahlzeiten.filter((m) => heuteKey(new Date(m.datum)) === t)).protein)
    .filter((p) => p > 0);
  const leer = geladen && woche.length === 0 && dGewicht === null && schlaf.length === 0 && proteinTage.length === 0;
  const f = (n: number, d = 0) => n.toLocaleString("de-DE", { maximumFractionDigits: d });

  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">Deine Woche</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Die letzten 7 Tage</h1>
      </header>
      {leer ? (
        <Card>
          <p className="font-display text-lg font-extrabold">Noch keine Daten in dieser Woche</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sobald du Trainings, Mahlzeiten oder Messungen einträgst, erscheint hier dein Rückblick.
          </p>
          <Link to="/training" className="mt-4 inline-flex text-sm font-bold text-primary">Zum Training</Link>
        </Card>
      ) : (
        <Card>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <Stat label="Trainings" value={String(woche.length)} />
            <Stat label="Volumen" value={f(vol)} unit="kg" />
            <Stat label="Gewicht" value={dGewicht === null ? "–" : `${dGewicht > 0 ? "+" : ""}${f(dGewicht, 1)}`} unit={dGewicht === null ? undefined : "kg"} />
            <Stat label="Protein Ø" value={proteinTage.length ? f(proteinTage.reduce((a, b) => a + b, 0) / proteinTage.length) : "–"} unit={proteinTage.length ? "g" : undefined} />
            <Stat label="Schlaf Ø" value={schlaf.length ? f(schlaf.reduce((a, b) => a + b, 0) / schlaf.length, 1) : "–"} unit={schlaf.length ? "h" : undefined} />
          </div>
        </Card>
      )}
    </div>
  );
}
