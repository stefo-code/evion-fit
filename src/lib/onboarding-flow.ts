import { ladeAktivitaet, speichereMessung, type KoerperMessung } from "@/lib/activity-store";
import type { OnboardingProfil } from "@/lib/onboarding-store";

export const onboardingSchritte = ["ueberdich", "ziel", "training", "ernaehrung", "gesundheit", "messung"] as const;
export const studioAusstattung = ["Voll ausgestattetes Fitnessstudio", "Kurzhanteln", "Langhantel", "Kabelzug", "Maschinen", "Kettlebells", "Widerstandsbänder", "Klimmzugstange", "Cardio-Geräte"];

/** Alte achtteilige Entwürfe behalten ihren inhaltlichen Fortschritt. */
export function aktuellerOnboardingSchritt(p: OnboardingProfil): number {
  const schritt = p.schrittVersion === 2 ? p.schritt : [0, 0, 1, 2, 2, 3, 4, 5][p.schritt] ?? 0;
  return Math.max(0, Math.min(schritt, onboardingSchritte.length - 1));
}

/** Nur die eigene Startmessung aktualisieren, bestehende Messhistorie erhalten. */
export function speichereOnboardingStartwerte(p: OnboardingProfil, mitExtras = false): string | undefined {
  const a = ladeAktivitaet();
  const hatGewicht = a.messungen.some((m) => typeof m.gewicht === "number");
  const datum = p.startMessungDatum ?? new Date().toISOString();
  const messung: KoerperMessung = { datum };
  if (p.gewicht !== null && (p.startMessungDatum || !hatGewicht)) messung.gewicht = p.gewicht;
  if (mitExtras) {
    for (const [key, wert] of Object.entries(p.startwerte ?? {})) {
      if (typeof wert === "number") Object.assign(messung, { [key]: wert });
    }
  }
  if (Object.keys(messung).length === 1) return p.startMessungDatum;
  speichereMessung(messung);
  return p.startMessungDatum ?? (!hatGewicht ? datum : undefined);
}