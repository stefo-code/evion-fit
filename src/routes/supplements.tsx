import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Chip, Disclaimer, Section } from "@/components/ui-kit";
import { supplementPlan, supplements } from "@/lib/demo-data";
import { Check, ChevronDown, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/supplements")({
  head: () => ({
    meta: [
      { title: "Supplement-Kompass – EVION" },
      {
        name: "description",
        content: "Evidenzorientierte Einordnung gängiger Supplements inklusive Dosierung und Timing.",
      },
      { property: "og:title", content: "Supplement-Kompass – EVION" },
      { property: "og:description", content: "Was wirkt, was ist verzichtbar – ohne Heilsversprechen." },
    ],
  }),
  component: SupplementsPage,
});

function SupplementsPage() {
  const [offen, setOffen] = useState<string | null>("Creatin Monohydrat");
  const [filter, setFilter] = useState<"alle" | "sinnvoll">("alle");
  const liste = filter === "alle" ? supplements : supplements.filter((s) => s.empfohlen);

  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">Supplements</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Supplement-Kompass</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Einordnung nach Studienlage – Supplements sind ein Zusatz, keine Voraussetzung.
        </p>
      </header>

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
        <Card className="border-warning/30 text-sm">
          Training in 45 Minuten geplant. Da du heute spät trainierst, könnte Koffein deinen Schlaf
          beeinflussen.
        </Card>
      </Section>

      <div className="flex gap-2">
        <Chip active={filter === "alle"} onClick={() => setFilter("alle")}>
          Alle
        </Chip>
        <Chip active={filter === "sinnvoll"} onClick={() => setFilter("sinnvoll")}>
          Für mein Ziel relevant
        </Chip>
      </div>

      <div className="space-y-3">
        {liste.map((s) => {
          const open = offen === s.name;
          return (
            <Card key={s.name} className="p-0">
              <button
                onClick={() => setOffen(open ? null : s.name)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-5 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-bold">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">Evidenz: {s.evidenz}</p>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                      s.empfohlen ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {s.empfohlen ? "Relevant" : "Optional"}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
                </span>
              </button>
              {open && (
                <dl className="grid gap-3 border-t border-border p-5 text-sm sm:grid-cols-2">
                  <Feld label="Relevanz für dein Ziel" value={s.relevanz} />
                  <Feld label="Typische Dosierung" value={s.dosierung} />
                  <Feld label="Timing" value={s.timing} />
                  <Feld label="Preis-Leistung" value={s.preis} />
                  <div className="sm:col-span-2">
                    <dt className="label-xs">Hinweis</dt>
                    <dd className="mt-1 text-muted-foreground">{s.hinweis}</dd>
                  </div>
                </dl>
              )}
            </Card>
          );
        })}
      </div>

      <Disclaimer>
        Keine medizinischen Versprechen: Nahrungsergänzungsmittel ersetzen weder eine ausgewogene
        Ernährung noch ärztliche Beratung. Bei Vorerkrankungen, Schwangerschaft oder Medikamenteneinnahme
        bitte vorab ärztlich abklären.
      </Disclaimer>
    </div>
  );
}

function Feld({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-xs">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
