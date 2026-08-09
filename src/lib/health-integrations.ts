/**
 * Integrations-Schicht für Health-Dienste.
 *
 * Realität: Samsung Health, Galaxy Watch 6 und Beurer HealthManager Pro bieten
 * keine öffentliche Web-API, die eine Web-App direkt abfragen könnte. Diese
 * Schicht bildet deshalb den kompletten Ablauf (Kopplung, Berechtigungen,
 * Synchronisierung, Konfliktauflösung) sauber ab und kennzeichnet jede Quelle.
 *
 * - `bridge: "health-connect"` → funktioniert produktiv nur in einer nativen
 *   Android-Hülle (Capacitor-Plugin), Web fällt auf Demo-Sync zurück.
 * - `bridge: "datei-import"` → funktioniert bereits vollständig im Web
 *   (CSV-Export aus dem Beurer HealthManager Pro).
 * - `bridge: "manuell"` → manuelle Eingabe.
 */

import type { HealthMetric, HealthSample } from "./health-providers";

export type Bridge = "health-connect" | "datei-import" | "manuell";

export type Integration = {
  id: string;
  name: string;
  typ: string;
  bridge: Bridge;
  metriken: HealthMetric[];
  /** Priorität bei doppelten Werten (kleiner = wichtiger) */
  prioritaet: number;
  beschreibung: string;
  schritte: string[];
  verfuegbarImWeb: boolean;
};

export const integrationen: Integration[] = [
  {
    id: "samsung-health",
    name: "Samsung Health",
    typ: "App · Android",
    bridge: "health-connect",
    metriken: ["schritte", "workouts", "schlaf", "herzfrequenz"],
    prioritaet: 40,
    beschreibung:
      "Schritte, Workouts, Schlaf und Herzfrequenz. Die Daten werden über Android Health Connect gelesen – Samsung stellt keine offene Web-Schnittstelle bereit.",
    schritte: [
      "Samsung Health öffnen → Einstellungen → Health Connect aktivieren",
      "In Health Connect die EVION-App zulassen",
      "Datenarten freigeben: Schritte, Training, Schlaf, Herzfrequenz",
      "Zurück in EVION: Synchronisierung starten",
    ],
    verfuegbarImWeb: false,
  },
  {
    id: "galaxy-watch-6",
    name: "Galaxy Watch 6",
    typ: "Wearable",
    bridge: "health-connect",
    metriken: ["ruhepuls", "hrv", "schlaf", "schritte"],
    prioritaet: 30,
    beschreibung:
      "Ruhepuls, HRV, Schlafphasen und Energy Score. Die Uhr schreibt ihre Werte in Samsung Health, von dort liest EVION über Health Connect.",
    schritte: [
      "Galaxy Watch 6 mit Samsung Health koppeln (Galaxy Wearable App)",
      "Kontinuierliche HRV- und Schlafmessung in der Uhr aktivieren",
      "Health Connect Freigabe für EVION erteilen",
      "Synchronisierung starten – EVION nutzt Ruhepuls & HRV für die Readiness",
    ],
    verfuegbarImWeb: false,
  },
  {
    id: "beurer-hmpro",
    name: "Beurer HealthManager Pro",
    typ: "Körperwaage & Blutdruck",
    bridge: "datei-import",
    metriken: ["gewicht", "koerperfett", "muskelmasse"],
    prioritaet: 10,
    beschreibung:
      "Gewicht, Körperfett und Muskelmasse aus der BIA-Waage. Beurer bietet keine offene API – der CSV-Export aus dem HealthManager Pro wird hier vollständig eingelesen.",
    schritte: [
      "HealthManager Pro öffnen → Menü → Daten exportieren",
      "Format CSV wählen, Zeitraum festlegen",
      "Datei hier hochladen – EVION erkennt Spalten automatisch",
      "Werte prüfen und übernehmen",
    ],
    verfuegbarImWeb: true,
  },
  {
    id: "manuell",
    name: "Manuelle Eingabe",
    typ: "Immer verfügbar",
    bridge: "manuell",
    metriken: ["gewicht", "koerperfett", "muskelmasse"],
    prioritaet: 5,
    beschreibung: "Werte selbst eintragen – hat immer Vorrang vor automatischen Quellen.",
    schritte: ["Werte eintragen", "Speichern"],
    verfuegbarImWeb: true,
  },
];

export type Verbindung = {
  id: string;
  verbunden: boolean;
  letzterSync: string | null;
  freigaben: HealthMetric[];
};

const KEY = "evion.integrationen.v1";

export function ladeVerbindungen(): Record<string, Verbindung> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Record<string, Verbindung>;
  } catch {
    return {};
  }
}

export function speichereVerbindungen(v: Record<string, Verbindung>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(v));
}

/** Simulierter Sync für Bridges, die im Web nicht erreichbar sind – klar als Demo markiert. */
export async function syncIntegration(int: Integration): Promise<HealthSample[]> {
  await new Promise((r) => setTimeout(r, 900));
  const jetzt = new Date().toISOString();
  const werte: Partial<Record<HealthMetric, [number, string]>> = {
    schritte: [7420, "Schritte"],
    schlaf: [7.1, "h"],
    herzfrequenz: [128, "bpm Ø Training"],
    ruhepuls: [54, "bpm"],
    hrv: [68, "ms"],
    workouts: [3, "diese Woche"],
    gewicht: [82.4, "kg"],
    koerperfett: [21.4, "%"],
    muskelmasse: [61.2, "kg"],
  };
  return int.metriken.map((m) => ({
    metric: m,
    wert: werte[m]?.[0] ?? 0,
    einheit: werte[m]?.[1] ?? "",
    zeitpunkt: jetzt,
    quelle: int.name,
    geraet: int.name,
    demo: !int.verfuegbarImWeb,
  }));
}

export type CsvMessung = {
  datum: string;
  gewicht?: number | undefined;
  koerperfett?: number | undefined;
  muskelmasse?: number | undefined;
  wasser?: number | undefined;
};

/** Liest CSV-Exporte des Beurer HealthManager (Pro). Erkennt ; oder , als Trenner. */
export function parseBeurerCsv(text: string): CsvMessung[] {
  const zeilen = text.split(/\r?\n/).filter((z) => z.trim().length > 0);
  if (zeilen.length < 2) return [];
  const trenner = (zeilen[0]!.match(/;/g)?.length ?? 0) >= (zeilen[0]!.match(/,/g)?.length ?? 0) ? ";" : ",";
  const kopf = zeilen[0]!.split(trenner).map((h) => h.trim().toLowerCase());

  const finde = (...kandidaten: string[]) =>
    kopf.findIndex((h) => kandidaten.some((k) => h.includes(k)));

  const iDatum = finde("datum", "date", "zeit");
  const iGewicht = finde("gewicht", "weight", "kg");
  const iFett = finde("fett", "fat");
  const iMuskel = finde("muskel", "muscle");
  const iWasser = finde("wasser", "water");

  const zahl = (s?: string) => {
    if (!s) return undefined;
    const n = Number(s.replace(/[^0-9,.-]/g, "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  return zeilen
    .slice(1)
    .map((z) => {
      const s = z.split(trenner).map((c) => c.trim().replace(/^"|"$/g, ""));
      const m: CsvMessung = {
        datum: (iDatum >= 0 ? s[iDatum] : "") || "unbekannt",
        gewicht: zahl(iGewicht >= 0 ? s[iGewicht] : undefined),
        koerperfett: zahl(iFett >= 0 ? s[iFett] : undefined),
        muskelmasse: zahl(iMuskel >= 0 ? s[iMuskel] : undefined),
        wasser: zahl(iWasser >= 0 ? s[iWasser] : undefined),
      };
      return m;
    })
    .filter((m) => m.gewicht || m.koerperfett || m.muskelmasse);
}
