import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Disclaimer, Section, Stat } from "@/components/ui-kit";
import {
  erfolgsStatus,
  gesamtVolumen,
  rekorde,
  streak,
  useAktivitaet,
} from "@/lib/activity-store";
import { Lock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/erfolge")({
  head: () => ({
    meta: [
      { title: "Erfolge & Rekorde – EVION" },
      {
        name: "description",
        content: "Freigeschaltete Meilensteine, persönliche Bestleistungen und deine Trainingsserie.",
      },
      { property: "og:title", content: "Erfolge & Rekorde – EVION" },
      { property: "og:description", content: "Jede protokollierte Einheit zählt – hier siehst du das Ergebnis." },
    ],
  }),
  component: ErfolgePage,
});

function ErfolgePage() {
  const { aktivitaet, geladen } = useAktivitaet();
  const status = erfolgsStatus(aktivitaet);
  const prs = rekorde(aktivitaet);
  const einheiten = aktivitaet.einheiten.length;

  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">Erfolge</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Deine Meilensteine</h1>
      </header>

      <Card>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Stat label="Einheiten" value={String(einheiten)} />
          <Stat label="Serie" value={String(streak(aktivitaet))} unit="Einheiten" tone="good" />
          <Stat
            label="Gesamtvolumen"
            value={gesamtVolumen(aktivitaet).toLocaleString("de-DE")}
            unit="kg"
          />
          <Stat label="Rekorde" value={String(prs.length)} tone="good" />
        </div>
      </Card>

      {geladen && einheiten === 0 && (
        <Card className="border-primary/40 bg-primary/10">
          <p className="font-display text-lg font-extrabold">Noch keine Daten</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Schließe dein erstes Training ab – Erfolge, Rekorde und Auswertungen entstehen automatisch aus
            deinen protokollierten Sätzen.
          </p>
          <Link
            to="/training/workout"
            search={{ tag: 0 }}
            className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-primary-foreground"
          >
            Training starten
          </Link>
        </Card>
      )}

      <Section titel="Abzeichen">
        <div className="grid gap-3 sm:grid-cols-2">
          {status.map((e) => (
            <Card
              key={e.id}
              className={cn("flex gap-4", e.erreicht ? "border-primary/40 bg-primary/10" : undefined)}
            >
              <span
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                  e.erreicht ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                )}
              >
                {e.erreicht ? <Trophy className="h-5 w-5" /> : <Lock className="h-4.5 w-4.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold">{e.titel}</p>
                <p className="text-xs text-muted-foreground">{e.beschreibung}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, (e.aktuell / e.ziel) * 100)}%` }}
                  />
                </div>
                <p className="num mt-1 text-[11px] text-muted-foreground">
                  {Math.min(e.aktuell, e.ziel).toLocaleString("de-DE")} / {e.ziel.toLocaleString("de-DE")}
                  {e.datum && ` · erreicht am ${new Date(e.datum).toLocaleDateString("de-DE")}`}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {prs.length > 0 && (
        <Section titel="Persönliche Bestleistungen">
          <Card className="p-2">
            <ul className="divide-y divide-border">
              {prs.map((r) => (
                <li key={r.uebungId} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.datum).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  <p className="num shrink-0 text-right text-sm font-bold">
                    {r.gewicht} kg × {r.wdh}
                    <span className="block text-xs font-normal text-muted-foreground">≈ {r.e1rm} kg e1RM</span>
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}

      <Disclaimer>
        e1RM-Werte sind rechnerische Schätzungen (Epley-Formel) aus deinen protokollierten Sätzen und kein
        getesteter Maximalversuch.
      </Disclaimer>
    </div>
  );
}
