/**
 * Brücke zu Android Health Connect.
 *
 * In der Android-Hülle (Capacitor) injiziert das Plugin `window.VektorHealth`.
 * Im normalen Browser existiert dieses Objekt nicht – die App erkennt das und
 * bietet stattdessen den Auto-Import per Ingest-Token bzw. Datei-Import an.
 */

export type BridgeMessung = {
  metric: string;
  value: number;
  unit?: string;
  measuredAt: string;
  quality?: "gemessen" | "geschätzt" | "berechnet";
};

export type VektorHealthBridge = {
  readonly version: string;
  requestPermissions(metriken: string[]): Promise<boolean>;
  read(metriken: string[], seit: string): Promise<BridgeMessung[]>;
};

declare global {
  interface Window {
    VektorHealth?: VektorHealthBridge;
  }
}

export function bridge(): VektorHealthBridge | null {
  if (typeof window === "undefined") return null;
  return window.VektorHealth ?? null;
}

export function bridgeVerfuegbar() {
  return bridge() !== null;
}

/** Liest die letzten `tage` über Health Connect. Wirft, wenn keine Brücke da ist. */
export async function leseUeberBridge(metriken: string[], tage = 14): Promise<BridgeMessung[]> {
  const b = bridge();
  if (!b) throw new Error("Health-Connect-Brücke nicht verfügbar");
  const erlaubt = await b.requestPermissions(metriken);
  if (!erlaubt) throw new Error("Berechtigungen in Health Connect nicht erteilt");
  const seit = new Date(Date.now() - tage * 86_400_000).toISOString();
  return b.read(metriken, seit);
}

/** Health-Connect-Datentypen je Vektor-Metrik – identisch in Plugin und App. */
export const healthConnectTypen: Record<string, string> = {
  gewicht: "Weight",
  koerperfett: "BodyFat",
  muskelmasse: "LeanBodyMass",
  wasser: "Hydration",
  schritte: "Steps",
  herzfrequenz: "HeartRate",
  ruhepuls: "RestingHeartRate",
  hrv: "HeartRateVariabilityRmssd",
  schlaf: "SleepSession",
  workouts: "ExerciseSession",
  kalorien: "TotalCaloriesBurned",
};
