import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card, Chip, Disclaimer, QualityTag, Section } from "@/components/ui-kit";
import { datenquellen } from "@/lib/demo-data";
import {
  integrationen,
  ladeVerbindungen,
  parseBeurerCsv,
  speichereVerbindungen,
  syncIntegration,
  type CsvMessung,
  type Integration,
  type Verbindung,
} from "@/lib/health-integrations";
import type { HealthSample } from "@/lib/health-providers";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Check, FileUp, Link2, Loader2, RefreshCw, Smartphone, Watch, Scale, PenLine } from "lucide-react";

export const Route = createFileRoute("/geraete")({
  head: () => ({
    meta: [
      { title: "Geräte & Health-Daten – Vektor" },
      {
        name: "description",
        content:
          "Samsung Health, Galaxy Watch 6 und Beurer HealthManager Pro verbinden, Werte synchronisieren und Quellen nachvollziehen.",
      },
      { property: "og:title", content: "Geräte & Health-Daten – Vektor" },
      { property: "og:description", content: "Transparente Health-Integrationen mit klarer Quellenkennzeichnung." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/geraete" }],
  }),
  component: GeraetePage,
});

const icons: Record<string, typeof Smartphone> = {
  "samsung-health": Smartphone,
  "galaxy-watch-6": Watch,
  "beurer-hmpro": Scale,
  manuell: PenLine,
};

function GeraetePage() {
  const [verbindungen, setVerbindungen] = useState<Record<string, Verbindung>>({});
  const [aktiv, setAktiv] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [samples, setSamples] = useState<HealthSample[]>([]);
  const [csv, setCsv] = useState<CsvMessung[]>([]);
  const datei = useRef<HTMLInputElement>(null);

  useEffect(() => setVerbindungen(ladeVerbindungen()), []);

  const update = (id: string, patch: Partial<Verbindung>) => {
    setVerbindungen((v) => {
      const next = {
        ...v,
        [id]: { id, verbunden: false, letzterSync: null, freigaben: [], ...v[id], ...patch },
      };
      speichereVerbindungen(next);
      return next;
    });
  };

  const verbinden = (int: Integration) => {
    update(int.id, { verbunden: true, freigaben: int.metriken });
    toast.success(`${int.name} verbunden`, {
      description: int.verfuegbarImWeb
        ? "Datenimport ist aktiv."
        : "Health-Connect-Bridge vorbereitet – im Web werden gekennzeichnete Demo-Werte synchronisiert.",
    });
  };

  const sync = async (int: Integration) => {
    setSyncing(int.id);
    try {
      const neu = await syncIntegration(int);
      setSamples((s) => [...neu, ...s.filter((x) => x.quelle !== int.name)]);
      update(int.id, { letzterSync: new Date().toISOString() });
      toast.success(`${int.name}: ${neu.length} Werte synchronisiert`);
    } finally {
      setSyncing(null);
    }
  };

  const csvLesen = async (file: File) => {
    const text = await file.text();
    const rows = parseBeurerCsv(text);
    if (rows.length === 0) {
      toast.error("Keine Messwerte erkannt", { description: "Bitte den CSV-Export des HealthManager Pro nutzen." });
      return;
    }
    setCsv(rows);
    update("beurer-hmpro", { verbunden: true, letzterSync: new Date().toISOString() });
    toast.success(`${rows.length} Messungen eingelesen`);
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">Geräte</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Datenquellen</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verbinde deine Health-Dienste. Jeder Wert bleibt sichtbar einer Quelle zugeordnet.
        </p>
      </header>

      <Section titel="Integrationen">
        <div className="space-y-3">
          {integrationen.map((int) => {
            const v = verbindungen[int.id];
            const Icon = icons[int.id] ?? Link2;
            const offen = aktiv === int.id;
            return (
              <Card key={int.id}>
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary">
                    <Icon className="h-5 w-5 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display font-bold">{int.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{int.typ}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                      v?.verbunden ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {v?.verbunden ? "Verbunden" : "Nicht verbunden"}
                  </span>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">{int.beschreibung}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {int.metriken.map((m) => (
                    <span key={m} className="rounded-lg bg-secondary/60 px-2 py-1 text-[11px] font-semibold">
                      {m}
                    </span>
                  ))}
                </div>

                {v?.letzterSync && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Letzte Synchronisierung: {new Date(v.letzterSync).toLocaleString("de-DE")}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {!v?.verbunden ? (
                    <button
                      onClick={() => verbinden(int)}
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground"
                    >
                      Verbinden
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => void sync(int)}
                        disabled={syncing === int.id}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
                      >
                        {syncing === int.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Jetzt synchronisieren
                      </button>
                      <button
                        onClick={() => update(int.id, { verbunden: false, letzterSync: null })}
                        className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
                      >
                        Trennen
                      </button>
                    </>
                  )}
                  <Chip onClick={() => setAktiv(offen ? null : int.id)}>
                    {offen ? "Anleitung ausblenden" : "Einrichtung anzeigen"}
                  </Chip>
                  {int.id === "beurer-hmpro" && (
                    <>
                      <button
                        onClick={() => datei.current?.click()}
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold"
                      >
                        <FileUp className="h-4 w-4" /> CSV-Export importieren
                      </button>
                      <input
                        ref={datei}
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void csvLesen(f);
                          e.target.value = "";
                        }}
                      />
                    </>
                  )}
                </div>

                {offen && (
                  <ol className="mt-4 space-y-2 rounded-2xl bg-secondary/40 p-4 text-sm">
                    {int.schritte.map((s, i) => (
                      <li key={s} className="flex gap-3">
                        <span className="num shrink-0 font-bold text-primary">{i + 1}</span>
                        <span className="min-w-0">{s}</span>
                      </li>
                    ))}
                    {!int.verfuegbarImWeb && (
                      <li className="pt-2 text-xs text-muted-foreground">
                        Hinweis: Health Connect ist eine Android-Schnittstelle. Im Browser synchronisiert Vektor
                        gekennzeichnete Demo-Werte; in der Android-App laufen exakt dieselben Schritte gegen echte Daten.
                      </li>
                    )}
                  </ol>
                )}
              </Card>
            );
          })}
        </div>
      </Section>

      {samples.length > 0 && (
        <Section titel="Zuletzt synchronisierte Werte">
          <Card className="p-2">
            <ul className="divide-y divide-border">
              {samples.map((s) => (
                <li key={`${s.quelle}-${s.metric}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold capitalize">{s.metric}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.quelle}</p>
                  </div>
                  <span className="num shrink-0 text-sm font-bold">
                    {s.wert.toLocaleString("de-DE")} {s.einheit}
                    {s.demo && <span className="ml-2 text-[10px] font-bold uppercase text-muted-foreground">Demo</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}

      {csv.length > 0 && (
        <Section titel="Importierte Beurer-Messungen">
          <Card className="p-2">
            <ul className="divide-y divide-border">
              {csv.slice(0, 12).map((m, i) => (
                <li key={`${m.datum}-${i}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
                  <p className="truncate text-sm font-semibold">{m.datum}</p>
                  <p className="num shrink-0 text-sm">
                    {m.gewicht ? `${m.gewicht} kg` : "–"}
                    {m.koerperfett ? ` · ${m.koerperfett} %` : ""}
                    {m.muskelmasse ? ` · ${m.muskelmasse} kg Muskel` : ""}
                  </p>
                </li>
              ))}
            </ul>
            <p className="px-3 pb-3 pt-1 text-xs text-muted-foreground">
              Körperfett und Muskelmasse aus BIA-Waagen sind Schätzwerte – aussagekräftig ist der Trend.
            </p>
          </Card>
        </Section>
      )}

      <Section titel="Manuelle Messung">
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const g = String(fd.get("gewicht") ?? "");
              setCsv((c) => [
                {
                  datum: new Date().toLocaleDateString("de-DE"),
                  gewicht: Number(g.replace(",", ".")) || undefined,
                  koerperfett: Number(String(fd.get("fett") ?? "").replace(",", ".")) || undefined,
                  muskelmasse: Number(String(fd.get("muskel") ?? "").replace(",", ".")) || undefined,
                },
                ...c,
              ]);
              update("manuell", { verbunden: true, letzterSync: new Date().toISOString() });
              toast.success("Messung gespeichert");
            }}
            className="grid gap-3 sm:grid-cols-3"
          >
            {[
              { n: "gewicht", l: "Gewicht (kg)", d: "82,4" },
              { n: "fett", l: "Körperfett (%)", d: "21,4" },
              { n: "muskel", l: "Muskelmasse (kg)", d: "61,2" },
            ].map((f) => (
              <label key={f.n} className="block">
                <span className="label-xs">{f.l}</span>
                <input
                  name={f.n}
                  defaultValue={f.d}
                  inputMode="decimal"
                  className="mt-1 w-full rounded-xl border border-input bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
            ))}
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground sm:col-span-3"
            >
              <Check className="h-4 w-4" /> Messung speichern
            </button>
          </form>
        </Card>
      </Section>

      <Section titel="Dopplungen & Priorität">
        <Card>
          <p className="text-sm text-muted-foreground">
            Liefern zwei Quellen denselben Wert, gewinnt die Quelle mit der höheren Priorität. Pro Metrik und Tag
            wird nur ein Datensatz verwendet.
          </p>
          <ol className="mt-3 space-y-1.5 text-sm">
            {[...integrationen]
              .sort((a, b) => a.prioritaet - b.prioritaet)
              .map((q, i) => (
                <li key={q.id} className="flex items-center gap-3 rounded-xl bg-secondary/40 px-3 py-2">
                  <span className="num text-muted-foreground">{i + 1}</span>
                  <span className="truncate">{q.name}</span>
                </li>
              ))}
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

      <Disclaimer>
        Vektor liest ausschließlich Daten, die du freigibst, und speichert sie in dieser Demo lokal auf deinem
        Gerät. Keine medizinische Diagnose – bei auffälligen Werten bitte ärztlich abklären.
      </Disclaimer>
    </div>
  );
}
