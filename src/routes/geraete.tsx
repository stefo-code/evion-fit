import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, Chip, Disclaimer, QualityTag, Section } from "@/components/ui-kit";
import { datenquellen } from "@/lib/demo-data";
import {
  integrationen,
  parseBeurerCsv,
  syncIntegration,
  type Integration,
} from "@/lib/health-integrations";
import { bridgeVerfuegbar, healthConnectTypen, leseUeberBridge } from "@/lib/health-bridge";
import {
  erzeugeIngestToken,
  ladeSyncStatus,
  setzeQuelle,
  speichereMessungen,
  widerrufeToken,
  type Messung,
} from "@/lib/health-sync.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Check,
  Copy,
  FileUp,
  KeyRound,
  Link2,
  Loader2,
  PenLine,
  RefreshCw,
  Scale,
  Smartphone,
  Watch,
} from "lucide-react";

export const Route = createFileRoute("/geraete")({
  head: () => ({
    meta: [
      { title: "Geräte & Health-Sync – Vektor" },
      {
        name: "description",
        content:
          "Samsung Health, Galaxy Watch 6 und Beurer HealthManager Pro automatisch synchronisieren – mit Sync-Protokoll und klarer Quellenkennzeichnung.",
      },
      { property: "og:title", content: "Geräte & Health-Sync – Vektor" },
      { property: "og:description", content: "Automatische Health-Synchronisation mit transparenter Herkunft." },
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
  const { session, laedt: authLaedt } = useAuth();
  const angemeldet = Boolean(session);
  const qc = useQueryClient();

  const status = useServerFn(ladeSyncStatus);
  const quelleSetzen = useServerFn(setzeQuelle);
  const messungenSpeichern = useServerFn(speichereMessungen);
  const tokenErzeugen = useServerFn(erzeugeIngestToken);
  const tokenWiderrufen = useServerFn(widerrufeToken);

  const daten = useQuery({
    queryKey: ["sync-status"],
    queryFn: () => status(),
    enabled: angemeldet,
  });

  const [aktiv, setAktiv] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [neuesToken, setNeuesToken] = useState<string | null>(null);
  const datei = useRef<HTMLInputElement>(null);

  const neuLaden = () => void qc.invalidateQueries({ queryKey: ["sync-status"] });

  const quelleVon = (id: string) => daten.data?.quellen.find((q) => q.source === id);

  const verbinden = useMutation({
    mutationFn: (int: Integration) =>
      quelleSetzen({
        data: { source: int.id, connected: true, permissions: int.metriken, autoSyncMinutes: 60 },
      }),
    onSuccess: (_r, int) => {
      neuLaden();
      toast.success(`${int.name} verbunden`);
    },
    onError: (e: Error) => toast.error("Verbinden fehlgeschlagen", { description: e.message }),
  });

  const trennen = useMutation({
    mutationFn: (int: Integration) =>
      quelleSetzen({ data: { source: int.id, connected: false, permissions: [], autoSyncMinutes: 60 } }),
    onSuccess: () => neuLaden(),
  });

  const sync = async (int: Integration) => {
    setSyncing(int.id);
    try {
      let messungen: Messung[];
      let hinweis = "";
      if (int.bridge === "health-connect" && bridgeVerfuegbar()) {
        const roh = await leseUeberBridge(int.metriken.map((m) => healthConnectTypen[m] ?? m));
        messungen = roh.map((r) => ({
          metric: r.metric,
          value: r.value,
          unit: r.unit ?? "",
          measuredAt: r.measuredAt,
          quality: r.quality ?? "gemessen",
        }));
      } else {
        const demo = await syncIntegration(int);
        messungen = demo.map((d) => ({
          metric: d.metric,
          value: d.wert,
          unit: d.einheit,
          measuredAt: d.zeitpunkt,
          quality: (d.demo ? "geschätzt" : "gemessen") as Messung["quality"],
        }));
        if (int.bridge === "health-connect") {
          hinweis = "Ohne Android-Brücke werden gekennzeichnete Beispielwerte übernommen.";
        }
      }
      if (messungen.length === 0) {
        toast.info("Keine neuen Werte");
        return;
      }
      const res = await messungenSpeichern({
        data: { source: int.id, priority: int.prioritaet, messungen },
      });
      neuLaden();
      toast.success(`${int.name}: ${res.gespeichert} Werte synchronisiert`, {
        description: hinweis || undefined,
      });
    } catch (e) {
      toast.error("Synchronisierung fehlgeschlagen", { description: (e as Error).message });
    } finally {
      setSyncing(null);
    }
  };

  const csvLesen = async (file: File) => {
    const rows = parseBeurerCsv(await file.text());
    if (rows.length === 0) {
      toast.error("Keine Messwerte erkannt", { description: "Bitte den CSV-Export des HealthManager Pro nutzen." });
      return;
    }
    const messungen: Messung[] = [];
    for (const r of rows) {
      const teile = r.datum.split(".");
      const d = new Date(teile.length === 3 ? teile.reverse().join("-") : r.datum);
      if (Number.isNaN(d.getTime())) continue;
      const iso = d.toISOString();
      if (r.gewicht) messungen.push({ metric: "gewicht", value: r.gewicht, unit: "kg", measuredAt: iso, quality: "gemessen" });
      if (r.koerperfett)
        messungen.push({ metric: "koerperfett", value: r.koerperfett, unit: "%", measuredAt: iso, quality: "geschätzt" });
      if (r.muskelmasse)
        messungen.push({ metric: "muskelmasse", value: r.muskelmasse, unit: "kg", measuredAt: iso, quality: "geschätzt" });
      if (r.wasser) messungen.push({ metric: "wasser", value: r.wasser, unit: "%", measuredAt: iso, quality: "geschätzt" });
    }
    if (messungen.length === 0) {
      toast.error("Datumsspalte nicht erkannt");
      return;
    }
    await messungenSpeichern({ data: { source: "beurer-hmpro", priority: 10, messungen } });
    neuLaden();
    toast.success(`${messungen.length} Messwerte importiert`);
  };

  const ingestUrl = typeof window === "undefined" ? "" : `${window.location.origin}/api/public/health-ingest`;

  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">Geräte</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Datenquellen & Sync</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Einmal einrichten, danach synchronisiert Vektor automatisch. Jeder Wert bleibt sichtbar einer Quelle
          zugeordnet.
        </p>
      </header>

      {!angemeldet && !authLaedt && (
        <Card className="border-primary/40">
          <p className="font-display text-lg font-bold">Konto nötig</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Synchronisierte Werte gehören zu deinem Konto, damit Handy, Uhr und Waage auf denselben Datenbestand
            schreiben.
          </p>
          <Link
            to="/auth"
            search={{ weiter: "/geraete" }}
            className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground"
          >
            Anmelden oder registrieren
          </Link>
        </Card>
      )}

      <Section titel="Integrationen">
        <div className="space-y-3">
          {integrationen.map((int) => {
            const q = quelleVon(int.id);
            const Icon = icons[int.id] ?? Link2;
            const offen = aktiv === int.id;
            const bereit = int.bridge !== "health-connect" || bridgeVerfuegbar();
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
                      q?.connected ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {q?.connected ? "Verbunden" : "Nicht verbunden"}
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

                {int.bridge === "health-connect" && (
                  <p className="mt-3 rounded-xl bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                    {bereit
                      ? "Android-Brücke erkannt – Health Connect liefert echte Werte."
                      : "Automatischer Abruf läuft über die Android-Hülle (Health Connect). Im Browser: Auto-Import per Token nutzen."}
                  </p>
                )}

                {q?.last_sync_at && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Letzte Synchronisierung: {new Date(q.last_sync_at).toLocaleString("de-DE")}
                    {q.last_status === "fehler" && <span className="ml-2 text-destructive">Fehler</span>}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {!q?.connected ? (
                    <button
                      onClick={() => verbinden.mutate(int)}
                      disabled={!angemeldet}
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground disabled:opacity-50"
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
                        onClick={() => trennen.mutate(int)}
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
                        disabled={!angemeldet}
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold disabled:opacity-50"
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
                  </ol>
                )}
              </Card>
            );
          })}
        </div>
      </Section>

      {angemeldet && (
        <Section titel="Automatischer Sync einrichten">
          <Card>
            <p className="text-sm text-muted-foreground">
              Mit einem Ingest-Token schicken die Android-Brücke oder eine Automatisierung (z. B. ein Handy-Shortcut mit
              dem Beurer-Export) Daten direkt an dein Konto – ohne manuelles Hochladen.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  try {
                    const r = await tokenErzeugen({ data: { label: "Sync-Brücke" } });
                    setNeuesToken(r.token);
                    neuLaden();
                  } catch (e) {
                    toast.error("Token konnte nicht erstellt werden", { description: (e as Error).message });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground"
              >
                <KeyRound className="h-4 w-4" /> Token erzeugen
              </button>
            </div>

            {neuesToken && (
              <div className="mt-4 rounded-2xl border border-primary/40 bg-primary/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Nur jetzt sichtbar</p>
                <code className="mt-2 block break-all rounded-xl bg-background px-3 py-2 text-xs">{neuesToken}</code>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(neuesToken);
                    toast.success("Token kopiert");
                  }}
                  className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-primary"
                >
                  <Copy className="h-3.5 w-3.5" /> Kopieren
                </button>
              </div>
            )}

            <div className="mt-4 rounded-2xl bg-secondary/40 p-4">
              <p className="label-xs">Endpunkt</p>
              <code className="mt-1 block break-all text-xs">POST {ingestUrl}</code>
              <p className="mt-2 text-xs text-muted-foreground">
                Header: <code>Authorization: Bearer &lt;Token&gt;</code> · Body:{" "}
                <code>{`{"source":"beurer-hmpro","csv":"…"}`}</code> oder{" "}
                <code>{`{"source":"galaxy-watch-6","samples":[…]}`}</code>
              </p>
            </div>

            {(daten.data?.tokens.length ?? 0) > 0 && (
              <ul className="mt-4 divide-y divide-border">
                {daten.data?.tokens.map((t) => (
                  <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {t.label} · {t.token_prefix}…
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.revoked
                          ? "widerrufen"
                          : t.last_used_at
                            ? `zuletzt genutzt ${new Date(t.last_used_at).toLocaleString("de-DE")}`
                            : "noch nicht genutzt"}
                      </p>
                    </div>
                    {!t.revoked && (
                      <button
                        onClick={async () => {
                          await tokenWiderrufen({ data: { id: t.id } });
                          neuLaden();
                        }}
                        className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold"
                      >
                        Widerrufen
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Section>
      )}

      {angemeldet && (daten.data?.werte.length ?? 0) > 0 && (
        <Section titel="Synchronisierte Werte">
          <Card className="p-2">
            <ul className="divide-y divide-border">
              {daten.data?.werte.slice(0, 15).map((w) => (
                <li key={w.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold capitalize">{w.metric}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {w.source} · {new Date(w.measured_at).toLocaleString("de-DE")}
                    </p>
                  </div>
                  <span className="num shrink-0 text-sm font-bold">
                    {w.value.toLocaleString("de-DE")} {w.unit}
                    {w.quality !== "gemessen" && (
                      <span className="ml-2 text-[10px] font-bold uppercase text-muted-foreground">{w.quality}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}

      {angemeldet && (daten.data?.laeufe.length ?? 0) > 0 && (
        <Section titel="Sync-Protokoll">
          <Card className="p-2">
            <ul className="divide-y divide-border">
              {daten.data?.laeufe.map((l) => (
                <li key={l.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{l.source}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleString("de-DE")} · {l.message ?? "manuell"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-bold",
                      l.status === "ok" ? "text-primary" : "text-destructive",
                    )}
                  >
                    {l.inserted} Werte
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}

      <Section titel="Manuelle Messung">
        <Card>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const zahl = (n: string) => Number(String(fd.get(n) ?? "").replace(",", ".")) || 0;
              const iso = new Date().toISOString();
              const messungen: Messung[] = [
                { metric: "gewicht", value: zahl("gewicht"), unit: "kg", measuredAt: iso, quality: "gemessen" as const },
                { metric: "koerperfett", value: zahl("fett"), unit: "%", measuredAt: iso, quality: "geschätzt" as const },
                { metric: "muskelmasse", value: zahl("muskel"), unit: "kg", measuredAt: iso, quality: "geschätzt" as const },
              ].filter((m) => m.value > 0);
              if (messungen.length === 0) {
                toast.error("Bitte mindestens einen Wert eintragen");
                return;
              }
              if (!angemeldet) {
                toast.error("Bitte zuerst anmelden");
                return;
              }
              await messungenSpeichern({ data: { source: "manuell", priority: 5, messungen } });
              neuLaden();
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
            Liefern zwei Quellen denselben Wert, gewinnt die Quelle mit der höheren Priorität. Identische Messungen
            derselben Quelle werden beim Sync zusammengeführt statt doppelt gespeichert.
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
        Vektor liest ausschließlich Daten, die du freigibst. Synchronisierte Werte liegen verschlüsselt in deinem
        Konto und lassen sich jederzeit löschen. Keine medizinische Diagnose – bei auffälligen Werten bitte ärztlich
        abklären.
      </Disclaimer>
    </div>
  );
}
