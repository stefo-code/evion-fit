import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Disclaimer, Section } from "@/components/ui-kit";
import { datenquellen } from "@/lib/demo-data";
import { QualityTag } from "@/components/ui-kit";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutz – Vektor" },
      {
        name: "description",
        content: "Granulare Einwilligungen, Datenexport und Löschung – Gesundheitsdaten unter deiner Kontrolle.",
      },
      { property: "og:title", content: "Datenschutz – Vektor" },
      { property: "og:description", content: "Welche Daten wofür genutzt werden – transparent und widerrufbar." },
    ],
  }),
  component: DatenschutzPage,
});

const einwilligungen = [
  {
    key: "training",
    titel: "Trainingsdaten",
    zweck: "Trainingsplanung, Progression und Wochenanalyse",
    pflicht: true,
  },
  { key: "ernaehrung", titel: "Ernährungsdaten", zweck: "Kalorien- und Makroziele, Mahlzeitenvorschläge", pflicht: false },
  { key: "koerper", titel: "Körperdaten", zweck: "Fortschritt, Body Recomposition, adaptive Kalorien", pflicht: false },
  { key: "schlaf", titel: "Schlaf- und Erholungsdaten", zweck: "Körperstatus und Autoregulation", pflicht: false },
  { key: "coach", titel: "Nutzung durch den KI-Coach", zweck: "Personalisierte Empfehlungen im Chat", pflicht: false },
  { key: "foto", titel: "Fotos von Mahlzeiten", zweck: "Schätzung von Lebensmitteln und Portionen", pflicht: false },
];

function DatenschutzPage() {
  const [aktiv, setAktiv] = useState<Record<string, boolean>>({
    training: true,
    ernaehrung: true,
    koerper: true,
    schlaf: true,
    coach: true,
    foto: false,
  });

  return (
    <div className="space-y-8">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Shield className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="label-xs">Datenschutz</p>
          <h1 className="truncate font-display text-2xl font-extrabold">Deine Gesundheitsdaten</h1>
        </div>
      </header>

      <Disclaimer>
        Gesundheitsdaten sind besonders sensibel. Vektor verarbeitet nur, was du freigibst, nutzt deine
        Gesundheitsdaten niemals für Werbung und trennt sie strikt von möglichen sozialen Funktionen. Du
        kannst jede Einwilligung jederzeit widerrufen.
      </Disclaimer>

      <Section titel="Einwilligungen">
        <Card className="p-2">
          <ul className="divide-y divide-border">
            {einwilligungen.map((e) => (
              <li key={e.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{e.titel}</p>
                  <p className="text-xs text-muted-foreground">{e.zweck}</p>
                </div>
                <button
                  disabled={e.pflicht}
                  onClick={() => setAktiv((a) => ({ ...a, [e.key]: !a[e.key] }))}
                  className={
                    "h-7 w-12 shrink-0 rounded-full transition-colors " +
                    (aktiv[e.key] ? "bg-primary" : "bg-secondary") +
                    (e.pflicht ? " opacity-50" : "")
                  }
                  aria-label={`${e.titel} umschalten`}
                >
                  <span
                    className={
                      "block h-5 w-5 rounded-full bg-background transition-transform " +
                      (aktiv[e.key] ? "translate-x-6" : "translate-x-1")
                    }
                  />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section titel="Welche Daten werden genutzt – und wofür?">
        <Card className="p-2">
          <ul className="divide-y divide-border">
            {datenquellen.map((d) => (
              <li key={d.feld} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{d.feld}</p>
                  <p className="truncate text-xs text-muted-foreground">{d.quelle}</p>
                </div>
                <QualityTag quality={d.qualitaet} />
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section titel="Deine Rechte">
        <Card>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "Auskunft über alle gespeicherten Daten",
              "Export aller Daten in einem maschinenlesbaren Format",
              "Berichtigung falscher Werte",
              "Widerruf jeder Einwilligung mit sofortiger Wirkung",
              "Vollständige Löschung des Kontos und aller Gesundheitsdaten",
              "Verschlüsselte Übertragung und Speicherung",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {t}
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Disclaimer>
        Prototyp-Hinweis: In dieser Demo werden keine personenbezogenen Daten an einen Server übertragen.
        Alle Werte stammen aus einem Demo-Profil.
      </Disclaimer>
    </div>
  );
}
