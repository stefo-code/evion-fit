import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, Chip, Disclaimer, Section, Why } from "@/components/ui-kit";
import { supplementPlan, goalLabels } from "@/lib/demo-data";
import {
  empfehlungen,
  stufenFarbe,
  type Kategorie,
  type Stufe,
} from "@/lib/supplements-data";
import { useOnboardingProfil } from "@/lib/onboarding-store";
import { Check, ChevronDown, Circle, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/supplements")({
  head: () => ({
    meta: [
      { title: "Supplement-Kompass – EVION" },
      {
        name: "description",
        content:
          "Evidenzbasierte Supplement-Empfehlungen, personalisiert nach Ziel, Alter, Geschlecht, Trainingsfrequenz und Ernährungsform.",
      },
      { property: "og:title", content: "Supplement-Kompass – EVION" },
      { property: "og:description", content: "Was wirkt, was ist verzichtbar – ohne Heilsversprechen." },
    ],
  }),
  component: SupplementsPage,
});

const kategorien: (Kategorie | "Alle")[] = [
  "Alle",
  "Basis",
  "Leistung",
  "Regeneration",
  "Gesundheit",
  "Umstritten",
];

function SupplementsPage() {
  const { profil } = useOnboardingProfil();
  const [offen, setOffen] = useState<string | null>(null);
  const [kategorie, setKategorie] = useState<Kategorie | "Alle">("Alle");
  const [nurRelevant, setNurRelevant] = useState(true);

  const ctx = {
    ziel: profil.abgeschlossen ? profil.ziel : "recomposition",
    geschlecht: profil.geschlecht,
    alter: profil.alter,
    trainingstage: profil.tage || 4,
    ernaehrungsform: profil.ernaehrungsform || "Omnivor",
    schlafProblem: false,
  } as const;

  const alle = useMemo(() => empfehlungen(ctx), [
    ctx.ziel,
    ctx.geschlecht,
    ctx.alter,
    ctx.trainingstage,
    ctx.ernaehrungsform,
  ]);

  const liste = alle
    .filter((e) => kategorie === "Alle" || e.supp.kategorie === kategorie)
    .filter((e) => !nurRelevant || e.stufe === "Priorität" || e.stufe === "Sinnvoll");

  const top = alle.filter((e) => e.stufe === "Priorität").slice(0, 4);

  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">Supplements</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Supplement-Kompass</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {supplementDatenbankGroesse} Präparate nach Studienlage eingeordnet und auf dein Profil
          zugeschnitten – Supplements sind ein Zusatz, keine Voraussetzung.
        </p>
      </header>

      <Section titel="Dein Profil-Abgleich">
        <Card>
          <div className="flex flex-wrap gap-2 text-xs">
            <Merkmal text={`Ziel: ${goalLabels[ctx.ziel]}`} />
            {ctx.geschlecht && <Merkmal text={`Geschlecht: ${ctx.geschlecht}`} />}
            {ctx.alter && <Merkmal text={`${ctx.alter} Jahre`} />}
            <Merkmal text={`${ctx.trainingstage} Trainingstage/Woche`} />
            <Merkmal text={ctx.ernaehrungsform} />
          </div>
          <ul className="mt-4 space-y-2">
            {top.map((e) => (
              <li key={e.supp.id} className="flex items-start gap-2 text-sm">
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <strong className="font-semibold">{e.supp.name}</strong> – {e.supp.dosierung}
                </span>
              </li>
            ))}
          </ul>
          <Why
            punkte={[
              "Priorisiert wird nach Studienlage (ISSN/IOC/DGE) mal Relevanz für dein Ziel.",
              "Alter, Geschlecht, Trainingsfrequenz und Ernährungsform verschieben die Reihenfolge.",
              "Präparate ohne belegten Nutzen erscheinen bewusst als „Verzichtbar“ statt zu verschwinden.",
            ]}
          />
        </Card>
      </Section>

      <Section titel="Tägliche Basics">
        <Card className="p-2">
          <ul className="divide-y divide-border">
            {supplementPlan.map((s) => (
              <li key={s.name} className="flex items-center gap-3 px-3 py-3 text-sm">
                {s.erledigt ? (
                  <Check className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className={cn("truncate", s.erledigt && "text-muted-foreground line-through")}>
                  {s.name}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {kategorien.map((k) => (
            <Chip key={k} active={kategorie === k} onClick={() => setKategorie(k)}>
              {k}
            </Chip>
          ))}
        </div>
        <Chip active={nurRelevant} onClick={() => setNurRelevant(!nurRelevant)}>
          Nur für mich relevant
        </Chip>
      </div>

      <div className="space-y-3">
        {liste.map(({ supp: s, stufe, gruende }) => {
          const open = offen === s.id;
          return (
            <Card key={s.id} className="p-0">
              <button
                onClick={() => setOffen(open ? null : s.id)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-5 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-bold">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.kategorie} · Evidenz: {s.evidenz}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                      stufenFarbe[stufe as Stufe],
                    )}
                  >
                    {stufe}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
                </span>
              </button>
              {open && (
                <div className="border-t border-border p-5 text-sm">
                  <p className="text-muted-foreground">{s.wirkung}</p>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Feld label="Dosierung" value={s.dosierung} />
                    <Feld label="Timing" value={s.timing} />
                    <Feld label="Einnahmedauer" value={s.dauer} />
                    <Feld label="Preis-Leistung" value={s.preis} />
                  </dl>
                  {gruende.length > 0 && (
                    <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                      {gruende.map((g) => (
                        <li key={g}>• {g}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-4 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
                    {s.hinweis}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">Quelle: {s.quelle}</p>
                </div>
              )}
            </Card>
          );
        })}
        {liste.length === 0 && (
          <Card className="text-sm text-muted-foreground">
            In dieser Kategorie ist für dein Profil aktuell nichts klar empfehlenswert.
          </Card>
        )}
      </div>

      <Disclaimer>
        Keine medizinischen Versprechen: Nahrungsergänzungsmittel ersetzen weder eine ausgewogene
        Ernährung noch ärztliche Beratung. Bei Vorerkrankungen, Schwangerschaft, Stillzeit oder
        Medikamenteneinnahme bitte vorab ärztlich abklären. Angaben zu Dosierungen sind
        Orientierungswerte aus der Studienlage, keine individuelle Therapieempfehlung.
      </Disclaimer>
    </div>
  );
}

function Merkmal({ text }: { text: string }) {
  return <span className="rounded-full bg-secondary px-3 py-1 font-semibold">{text}</span>;
}

function Feld({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-xs">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

const supplementDatenbankGroesse = 21;
