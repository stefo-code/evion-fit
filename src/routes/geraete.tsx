import { createFileRoute } from "@tanstack/react-router";
import { Card, Disclaimer, Section } from "@/components/ui-kit";
import { datenquellen, geraete } from "@/lib/demo-data";
import { QualityTag } from "@/components/ui-kit";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/geraete")({
  head: () => ({
    meta: [
      { title: "Geräte & Health-Daten – Vektor" },
      {
        name: "description",
        content: "Health-Integrationen verwalten: Samsung Health, Galaxy Watch, Beurer-Waage und mehr.",
      },
      { property: "og:title", content: "Geräte & Health-Daten – Vektor" },
      { property: "og:description", content: "Saubere Schnittstellen statt vorgetäuschter Verbindungen." },
    ],
  }),
  component: GeraetePage,
});

function GeraetePage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">Geräte</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Datenquellen</h1>
      </header>

      <Disclaimer>
        Wichtig: In dieser Version besteht <strong>keine</strong> aktive Verbindung zu Samsung Health,
        Health Connect, Beurer oder Apple Health. Alle angezeigten Werte sind gekennzeichnete Demo-Daten.
        Die Schnittstelle ist so aufgebaut, dass echte Anbieter später ergänzt werden können, ohne die App
        umzubauen.
      </Disclaimer>

      <Section titel="Integrationen">
        <div className="space-y-3">
          {geraete.map((g) => (
            <Card key={g.name}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display font-bold">{g.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{g.typ}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                    g.status === "Geplant"
                      ? "bg-secondary text-muted-foreground"
                      : "bg-info/15 text-info",
                  )}
                >
                  {g.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{g.hinweis}</p>
              <p className="mt-2 text-xs text-muted-foreground">Daten: {g.daten.join(" · ")}</p>
              <button
                onClick={() =>
                  toast("Verbindung noch nicht verfügbar", {
                    description: "Diese Integration ist vorbereitet, aber nicht angebunden.",
                  })
                }
                className="mt-3 rounded-xl border border-border px-4 py-2 text-sm font-bold"
              >
                Verbindung einrichten
              </button>
            </Card>
          ))}
        </div>
      </Section>

      <Section titel="Manuelle Eingabe (Beurer & Co.)">
        <Card>
          <p className="text-sm text-muted-foreground">
            Solange keine offizielle Schnittstelle nutzbar ist, kannst du Waagenwerte manuell erfassen.
            Die Felder entsprechen exakt dem späteren Import.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Messung gespeichert (Demo)");
            }}
            className="mt-4 grid gap-3 sm:grid-cols-3"
          >
            {[
              { l: "Gewicht (kg)", d: "82,4" },
              { l: "Körperfett (%)", d: "21,4" },
              { l: "Muskelmasse (kg)", d: "61,2" },
            ].map((f) => (
              <label key={f.l} className="block">
                <span className="label-xs">{f.l}</span>
                <input
                  defaultValue={f.d}
                  className="mt-1 w-full rounded-xl border border-input bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
            ))}
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground sm:col-span-3"
            >
              Messung speichern
            </button>
          </form>
        </Card>
      </Section>

      <Section titel="Dopplungen & Priorität">
        <Card>
          <p className="text-sm text-muted-foreground">
            Liefern zwei Quellen denselben Wert, gewinnt die Quelle mit der höheren Priorität. Pro Metrik
            und Tag wird nur ein Datensatz verwendet.
          </p>
          <ol className="mt-3 space-y-1.5 text-sm">
            {["Manuelle Eingabe", "Beurer (Körperdaten)", "Galaxy Watch 6", "Samsung Health", "Schätzung der App"].map(
              (q, i) => (
                <li key={q} className="flex items-center gap-3 rounded-xl bg-secondary/40 px-3 py-2">
                  <span className="num text-muted-foreground">{i + 1}</span>
                  <span className="truncate">{q}</span>
                </li>
              ),
            )}
          </ol>
        </Card>
      </Section>

      <Section titel="Woher stammen meine Werte?">
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
    </div>
  );
}
