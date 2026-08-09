import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, Chip, Disclaimer } from "@/components/ui-kit";
import { goalLabels, type Goal } from "@/lib/demo-data";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding – Vektor" },
      {
        name: "description",
        content: "In wenigen Schritten zu deinem persönlichen Trainings- und Ernährungsplan.",
      },
      { property: "og:title", content: "Onboarding – Vektor" },
      { property: "og:description", content: "Nur die Angaben, die wirklich genutzt werden." },
    ],
  }),
  component: OnboardingPage,
});

type Step = {
  titel: string;
  hint?: string;
  felder: { label: string; typ: "text" | "chips"; optionen?: string[]; platzhalter?: string; multi?: boolean }[];
};

const steps: Step[] = [
  {
    titel: "Was ist dein Hauptziel?",
    hint: "Dein Ziel bestimmt, wie Score, Plan und Kalorien gewichtet werden.",
    felder: [{ label: "Ziel", typ: "chips", optionen: Object.values(goalLabels) }],
  },
  {
    titel: "Ein paar Eckdaten",
    hint: "Diese Angaben werden für Kalorien- und Volumenempfehlungen benötigt.",
    felder: [
      { label: "Alter", typ: "text", platzhalter: "34" },
      { label: "Körpergröße (cm)", typ: "text", platzhalter: "181" },
      { label: "Aktuelles Gewicht (kg)", typ: "text", platzhalter: "82,4" },
      { label: "Körperfett (%) – optional", typ: "text", platzhalter: "21,4" },
      {
        label: "Biologisches Geschlecht (für Energiebedarf)",
        typ: "chips",
        optionen: ["männlich", "weiblich", "keine Angabe"],
      },
    ],
  },
  {
    titel: "Dein Zielwert",
    felder: [
      { label: "Zielgewicht (kg)", typ: "text", platzhalter: "77" },
      { label: "Körperfett-Ziel (%) – optional", typ: "text", platzhalter: "15" },
    ],
  },
  {
    titel: "Wie trainierst du?",
    felder: [
      { label: "Erfahrung", typ: "chips", optionen: ["Einsteiger", "Fortgeschritten", "Erfahren"] },
      { label: "Trainingsort", typ: "chips", optionen: ["Fitnessstudio", "Zuhause", "Outdoor"], multi: true },
      {
        label: "Equipment",
        typ: "chips",
        optionen: ["Langhantel", "Kurzhanteln", "Maschinen", "Kabelzug", "Bänder", "Nur Körpergewicht"],
        multi: true,
      },
    ],
  },
  {
    titel: "Wie viel Zeit hast du?",
    felder: [
      { label: "Trainingstage pro Woche", typ: "chips", optionen: ["2", "3", "4", "5", "6"] },
      { label: "Bevorzugte Dauer", typ: "chips", optionen: ["20 Min.", "30 Min.", "45 Min.", "60+ Min."] },
    ],
  },
  {
    titel: "Übungen",
    hint: "So vermeiden wir Übungen, die du nicht magst oder nicht ausführen kannst.",
    felder: [
      {
        label: "Lieblingsübungen",
        typ: "chips",
        optionen: ["Bankdrücken", "Kniebeuge", "Kreuzheben", "Klimmzüge", "Rudern", "Dips"],
        multi: true,
      },
      {
        label: "Übungen vermeiden",
        typ: "chips",
        optionen: ["Beinpresse", "Burpees", "Überkopfdrücken", "Ausfallschritte"],
        multi: true,
      },
      { label: "Verletzungen / Einschränkungen – optional", typ: "text", platzhalter: "z. B. Schulter links" },
    ],
  },
  {
    titel: "Ernährung",
    felder: [
      { label: "Ernährungsform", typ: "chips", optionen: ["Omnivor", "Vegetarisch", "Vegan", "Pescetarisch"] },
      {
        label: "Allergien / Unverträglichkeiten",
        typ: "chips",
        optionen: ["Laktose", "Gluten", "Nüsse", "Soja", "Keine"],
        multi: true,
      },
      { label: "Lieblingsgerichte – optional", typ: "text", platzhalter: "Bolognese, Curry, Bowls" },
    ],
  },
  {
    titel: "Alltag & Schlaf",
    felder: [
      {
        label: "Aktivitätsniveau",
        typ: "chips",
        optionen: ["Sitzend", "Leicht aktiv", "Aktiv", "Sehr aktiv"],
      },
      { label: "Schlaf pro Nacht", typ: "chips", optionen: ["< 6 h", "6–7 h", "7–8 h", "> 8 h"] },
      { label: "Aktuelle Supplements – optional", typ: "text", platzhalter: "Creatin, Vitamin D" },
    ],
  },
  {
    titel: "Erinnerungen & Datenquellen",
    hint: "Du kannst jede Freigabe später jederzeit widerrufen.",
    felder: [
      { label: "Erinnerungsintensität", typ: "chips", optionen: ["Aus", "Niedrig", "Mittel", "Hoch"] },
      {
        label: "Geräte & Apps",
        typ: "chips",
        optionen: ["Samsung Health", "Galaxy Watch 6", "Beurer Waage", "Später verbinden"],
        multi: true,
      },
    ],
  },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [ziel, setZiel] = useState<Goal>("recomposition");
  const [auswahl, setAuswahl] = useState<Record<string, string[]>>({});
  const step = steps[i]!;

  function toggle(feld: string, opt: string, multi?: boolean) {
    setAuswahl((a) => {
      const cur = a[feld] ?? [];
      if (!multi) return { ...a, [feld]: [opt] };
      return { ...a, [feld]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
    });
    if (feld === "Ziel") {
      const g = (Object.keys(goalLabels) as Goal[]).find((k) => goalLabels[k] === opt);
      if (g) setZiel(g);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-8">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <button
          onClick={() => (i === 0 ? navigate({ to: "/" }) : setI(i - 1))}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border"
          aria-label="Zurück"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Bar value={((i + 1) / steps.length) * 100} />
        <span className="num shrink-0 text-sm text-muted-foreground">
          {i + 1}/{steps.length}
        </span>
      </div>

      <div className="mt-8 flex-1">
        <h1 className="font-display text-3xl font-extrabold">{step.titel}</h1>
        {step.hint && <p className="mt-2 text-sm text-muted-foreground">{step.hint}</p>}

        <div className="mt-6 space-y-6">
          {step.felder.map((f) => (
            <div key={f.label}>
              <p className="label-xs">{f.label}</p>
              {f.typ === "text" ? (
                <input
                  placeholder={f.platzhalter}
                  className="mt-2 w-full rounded-xl border border-input bg-secondary/40 px-4 py-3 text-sm outline-none focus:border-primary"
                />
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {f.optionen?.map((o) => (
                    <Chip
                      key={o}
                      active={(auswahl[f.label] ?? []).includes(o)}
                      onClick={() => toggle(f.label, o, f.multi)}
                    >
                      {o}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {i === 0 && (
          <Disclaimer>
            Biologische Angaben nutzen wir ausschließlich dort, wo sie für Berechnungen sinnvoll sind –
            etwa beim geschätzten Energiebedarf. Dein Trainingsplan richtet sich nach Ziel, Level,
            Leistung, Vorlieben, Equipment, Zeit und Erholung.
          </Disclaimer>
        )}
      </div>

      <button
        onClick={() => (i === steps.length - 1 ? navigate({ to: "/" }) : setI(i + 1))}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-display text-base font-extrabold uppercase tracking-wide text-primary-foreground"
      >
        {i === steps.length - 1 ? `Plan für ${goalLabels[ziel]} erstellen` : "Weiter"}
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
