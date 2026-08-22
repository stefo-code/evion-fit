/**
 * Echter Ernährungsspeicher (lokal, ohne Konto).
 *
 * Hier landen tatsächlich protokollierte Mahlzeiten, Wasseraufnahme und der
 * Vorrat („Was habe ich zu Hause?“). Die Ernährungsseite liest ausschließlich
 * aus diesem Speicher – keine Demo-Daten mehr.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

export type Mahlzeit = {
  id: string;
  datum: string; // ISO
  name: string;
  kcal: number;
  protein: number;
  kh: number;
  fett: number;
  quelle: "manuell" | "foto" | "rezept" | "datenbank";
};

export type Ernaehrung = {
  version: 1;
  mahlzeiten: Mahlzeit[];
  /** Wasser in ml je Tag (Schlüssel: YYYY-MM-DD). */
  wasser: Record<string, number>;
  /** Vorrat zu Hause (freie Texteingabe). */
  vorrat: string[];
};

const KEY = "evion.ernaehrung.v1";
const EVENT = "evion:ernaehrung";

export const leereErnaehrung: Ernaehrung = { version: 1, mahlzeiten: [], wasser: {}, vorrat: [] };

export function heuteKey(d: Date = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function ladeErnaehrung(): Ernaehrung {
  if (typeof window === "undefined") return leereErnaehrung;
  try {
    const roh = window.localStorage.getItem(KEY);
    if (!roh) return leereErnaehrung;
    return { ...leereErnaehrung, ...(JSON.parse(roh) as Partial<Ernaehrung>) };
  } catch {
    return leereErnaehrung;
  }
}

function schreibe(e: Ernaehrung) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(e));
  } catch {
    /* Speicher nicht verfügbar – Daten bleiben für die Sitzung erhalten. */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

export type Tageswerte = { kcal: number; protein: number; kh: number; fett: number };

export function summiere(mahlzeiten: Mahlzeit[]): Tageswerte {
  return mahlzeiten.reduce<Tageswerte>(
    (s, m) => ({
      kcal: s.kcal + m.kcal,
      protein: s.protein + m.protein,
      kh: s.kh + m.kh,
      fett: s.fett + m.fett,
    }),
    { kcal: 0, protein: 0, kh: 0, fett: 0 },
  );
}

export function useErnaehrung() {
  const [daten, setDaten] = useState<Ernaehrung>(leereErnaehrung);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    setDaten(ladeErnaehrung());
    setGeladen(true);
    const sync = () => setDaten(ladeErnaehrung());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const aktualisiere = useCallback((fn: (alt: Ernaehrung) => Ernaehrung) => {
    setDaten((alt) => {
      const neu = fn(alt);
      schreibe(neu);
      return neu;
    });
  }, []);

  const mahlzeitHinzufuegen = useCallback(
    (m: Omit<Mahlzeit, "id" | "datum"> & { datum?: string }) =>
      aktualisiere((alt) => ({
        ...alt,
        mahlzeiten: [
          ...alt.mahlzeiten,
          { ...m, id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, datum: m.datum ?? new Date().toISOString() },
        ],
      })),
    [aktualisiere],
  );

  const mahlzeitEntfernen = useCallback(
    (id: string) =>
      aktualisiere((alt) => ({ ...alt, mahlzeiten: alt.mahlzeiten.filter((m) => m.id !== id) })),
    [aktualisiere],
  );

  const wasserHinzufuegen = useCallback(
    (ml: number) =>
      aktualisiere((alt) => {
        const k = heuteKey();
        return { ...alt, wasser: { ...alt.wasser, [k]: Math.max(0, (alt.wasser[k] ?? 0) + ml) } };
      }),
    [aktualisiere],
  );

  const vorratHinzufuegen = useCallback(
    (zutat: string) =>
      aktualisiere((alt) => {
        const wert = zutat.trim();
        if (!wert) return alt;
        if (alt.vorrat.some((v) => v.toLowerCase() === wert.toLowerCase())) return alt;
        return { ...alt, vorrat: [...alt.vorrat, wert] };
      }),
    [aktualisiere],
  );

  const vorratEntfernen = useCallback(
    (zutat: string) =>
      aktualisiere((alt) => ({ ...alt, vorrat: alt.vorrat.filter((v) => v !== zutat) })),
    [aktualisiere],
  );

  const heutigeMahlzeiten = useMemo(
    () => daten.mahlzeiten.filter((m) => m.datum.slice(0, 10) === heuteKey()),
    [daten.mahlzeiten],
  );

  return {
    daten,
    geladen,
    heutigeMahlzeiten,
    heuteSumme: summiere(heutigeMahlzeiten),
    wasserHeute: daten.wasser[heuteKey()] ?? 0,
    mahlzeitHinzufuegen,
    mahlzeitEntfernen,
    wasserHinzufuegen,
    vorratHinzufuegen,
    vorratEntfernen,
  };
}
