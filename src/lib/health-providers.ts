/**
 * Abstraktion für Health-Datenquellen.
 *
 * WICHTIG: Aktuell existiert KEINE echte Verbindung zu Samsung Health,
 * Health Connect, Beurer oder Apple Health. Der `DemoHealthProvider` liefert
 * gekennzeichnete Demo-Daten. Um später eine echte Quelle anzubinden, wird ein
 * weiterer Provider implementiert, der dieses Interface erfüllt – der Rest der
 * App muss dafür nicht angepasst werden.
 *
 * Offene Punkte für echte Integrationen:
 * - Android Health Connect: benötigt native App-Schale (z. B. Capacitor) + Consent-Flow.
 * - Samsung Health: Daten laufen über Health Connect, keine eigene Web-API.
 * - Beurer HealthManager Pro: keine uns bekannte offiziell nutzbare öffentliche API;
 *   bis dahin manuelle Eingabe oder Import über Health Connect.
 */

export type HealthMetric =
  | "schritte"
  | "schlaf"
  | "herzfrequenz"
  | "ruhepuls"
  | "hrv"
  | "gewicht"
  | "koerperfett"
  | "muskelmasse"
  | "workouts";

export type HealthSample = {
  metric: HealthMetric;
  wert: number;
  einheit: string;
  zeitpunkt: string;
  quelle: string;
  geraet?: string;
  /** true = Demo-Daten, keine echte Geräteverbindung */
  demo: boolean;
};

export interface HealthProvider {
  id: string;
  name: string;
  verfuegbar(): boolean;
  unterstuetzteMetriken(): HealthMetric[];
  lese(metric: HealthMetric): Promise<HealthSample[]>;
}

export const DemoHealthProvider: HealthProvider = {
  id: "demo",
  name: "Demo-Datenquelle",
  verfuegbar: () => true,
  unterstuetzteMetriken: () => [
    "schritte",
    "schlaf",
    "ruhepuls",
    "hrv",
    "gewicht",
    "koerperfett",
    "muskelmasse",
  ],
  async lese(metric) {
    return [
      {
        metric,
        wert: 0,
        einheit: "",
        zeitpunkt: new Date().toISOString(),
        quelle: "Demo",
        demo: true,
      },
    ];
  },
};

/** Dedupliziert Samples: pro Metrik & Tag gewinnt die höherwertige Quelle. */
export function dedupe(samples: HealthSample[], prioritaet: string[]): HealthSample[] {
  const map = new Map<string, HealthSample>();
  for (const s of samples) {
    const key = `${s.metric}-${s.zeitpunkt.slice(0, 10)}`;
    const vorhanden = map.get(key);
    if (!vorhanden) {
      map.set(key, s);
      continue;
    }
    const a = prioritaet.indexOf(s.quelle);
    const b = prioritaet.indexOf(vorhanden.quelle);
    if (a !== -1 && (b === -1 || a < b)) map.set(key, s);
  }
  return [...map.values()];
}

export const registrierteProvider: HealthProvider[] = [DemoHealthProvider];
