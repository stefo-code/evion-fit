/**
 * Generierte, realistische Übungsfotos je Übung und Geschlecht.
 * Wird von scripts/exercise-images beim Bild-Update neu geschrieben.
 */

export type BildPaar = { m: string; w: string };

export const uebungsBilder: Record<string, BildPaar> = {};
