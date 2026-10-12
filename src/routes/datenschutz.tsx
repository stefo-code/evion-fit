import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Disclaimer, Section } from "@/components/ui-kit";
import { datenquellen } from "@/lib/demo-data";
import { QualityTag } from "@/components/ui-kit";
import { Shield, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { loescheKonto } from "@/lib/konto.functions";
import { loescheLokaleDaten } from "@/lib/privatsphaere";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Datenschutz – EVION" },
      {
        name: "description",
        content: "Granulare Einwilligungen, Datenexport und Löschung – Gesundheitsdaten unter deiner Kontrolle.",
      },
      { property: "og:title", content: "Datenschutz – EVION" },
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
  const { session } = useAuth();
  const loescheServer = useServerFn(loescheKonto);
  const [busy, setBusy] = useState(false);
  const loeschen = async () => {
    if (!window.confirm("Wirklich alle Daten löschen? Das kann nicht rückgängig gemacht werden.")) return;
    if (!window.confirm("Letzte Bestätigung: Alle Trainings, Messungen, Mahlzeiten und dein Konto werden endgültig gelöscht.")) return;
    setBusy(true);
    try {
      if (session) {
        await loescheServer();
        await supabase.auth.signOut();
      }
      loescheLokaleDaten();
      toast.success("Alle Daten wurden gelöscht");
      setTimeout(() => (window.location.href = "/"), 600);
    } catch (e) {
      toast.error((e as Error).message || "Löschen fehlgeschlagen");
      setBusy(false);
    }
  };
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
        Gesundheitsdaten sind besonders sensibel. EVION verarbeitet nur, was du freigibst, nutzt deine
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

      <Section titel="Wo deine Daten liegen">
        <Card>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">Ohne Sync:</span> Alle Daten liegen nur auf diesem Gerät
              im Browser-Speicher. Nichts davon wird automatisch übertragen.
            </li>
            <li>
              <span className="font-semibold text-foreground">KI-Funktionen</span> (Coach, Foto-Erkennung, KI-Plan):
              Pro Anfrage werden die dafür nötigen Daten ohne Namen an einen KI-Dienst gesendet – nur nach deiner
              Einwilligung. Der Barcode-Scan überträgt nur die Barcode-Nummer an eine offene Produktdatenbank.
            </li>
            <li>
              <span className="font-semibold text-foreground">Mit Sync:</span> Deine Daten werden verschlüsselt
              übertragen und in deinem eigenen Konto gespeichert, auf das nur du Zugriff hast (Row Level Security).
            </li>
          </ul>
        </Card>
      </Section>

      <Section titel="Alle Daten löschen">
        <Card className="border-destructive/40">
          <p className="text-sm text-muted-foreground">
            Löscht alle Daten auf diesem Gerät und – falls du angemeldet bist – alle gespeicherten Daten deines Kontos
            sowie das Konto selbst.
          </p>
          <button
            onClick={() => void loeschen()}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-destructive/50 px-4 py-2.5 text-sm font-bold text-destructive disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" /> Alle Daten löschen
          </button>
        </Card>
      </Section>

      <Disclaimer>Keine medizinische Beratung. Bei gesundheitlichen Beschwerden ärztlichen Rat einholen.</Disclaimer>
    </div>
  );
}
