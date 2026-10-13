/**
 * Onboarding- und Profilspeicher (lokal, ohne Konto).
 *
 * Die Angaben aus dem Onboarding werden hier zentral gehalten und persistiert.
 * Bewusst getrennt nach Personalisierungs-Herkunft, damit EVION später
 * zwischen ANGEGEBEN, BEOBACHTET, GELERNT und PROGNOSTIZIERT unterscheiden kann.
 */

import { useCallback, useEffect, useState } from "react";
import type { Goal } from "@/lib/demo-data";

export type Herkunft = "angegeben" | "beobachtet" | "gelernt" | "prognostiziert";

export const herkunftLabels: Record<Herkunft, string> = {
  angegeben: "Angegeben",
  beobachtet: "Beobachtet",
  gelernt: "Gelernt",
  prognostiziert: "Prognose",
};

export type Geschlecht = "weiblich" | "maennlich" | "divers";

export type OnboardingProfil = {
  version: 1;
  abgeschlossen: boolean;
  schritt: number;
  name: string;
  kontoMethode: "google" | "apple" | "email" | null;
  email: string;
  geschlecht: Geschlecht | null;
  alter: number | null;
  groesse: number | null;
  gewicht: number | null;
  ziel: Goal;
  zielGewicht: number | null;
  tempo: "sanft" | "moderat" | "ambitioniert";
  recompFokus: "muskelaufbau" | "ausgewogen" | "fettabbau";
  erfahrung: "Anfänger" | "Fortgeschritten" | "Erfahren";
  orte: string[];
  tage: number;
  dauer: number;
  equipment: string[];
  mag: string;
  vermeiden: string;
  ernaehrungsform: string;
  allergien: string[];
  vermiedeneLebensmittel: string;
  lieblingsgerichte: string;
  mahlzeiten: number;
  einschraenkungen: string[];
  gesundheitNotiz: string;
  geraete: string[];
};

export const leeresProfil: OnboardingProfil = {
  version: 1,
  abgeschlossen: false,
  schritt: 0,
  name: "",
  kontoMethode: null,
  email: "",
  geschlecht: null,
  alter: null,
  groesse: null,
  gewicht: null,
  ziel: "recomposition",
  zielGewicht: null,
  tempo: "moderat",
  recompFokus: "ausgewogen",
  erfahrung: "Fortgeschritten",
  orte: [],
  tage: 4,
  dauer: 45,
  equipment: [],
  mag: "",
  vermeiden: "",
  ernaehrungsform: "Omnivor",
  allergien: [],
  vermiedeneLebensmittel: "",
  lieblingsgerichte: "",
  mahlzeiten: 3,
  einschraenkungen: [],
  gesundheitNotiz: "",
  geraete: [],
};

const KEY = "evion.onboarding.v1";

export function ladeProfil(): OnboardingProfil {
  if (typeof window === "undefined") return leeresProfil;
  try {
    const roh = window.localStorage.getItem(KEY);
    if (!roh) return leeresProfil;
    return { ...leeresProfil, ...(JSON.parse(roh) as Partial<OnboardingProfil>) };
  } catch {
    return leeresProfil;
  }
}

export function speichereProfil(p: OnboardingProfil) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent("evion:profil"));
}

/** Reaktiver Zugriff auf das Profil (hydration-sicher). */
export function useOnboardingProfil() {
  const [profil, setProfil] = useState<OnboardingProfil>(leeresProfil);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    setProfil(ladeProfil());
    setGeladen(true);
    const sync = () => setProfil(ladeProfil());
    window.addEventListener("evion:profil", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("evion:profil", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const aktualisiere = useCallback((teil: Partial<OnboardingProfil>) => {
    setProfil((alt) => {
      const neu = { ...alt, ...teil };
      speichereProfil(neu);
      return neu;
    });
  }, []);

  return { profil, aktualisiere, geladen };
}

/** Anzeigeprofil: nur echte Onboarding-Angaben; fehlende Werte = null. */
export function effektivesProfil(p: OnboardingProfil) {
  return {
    name: p.name.trim(),
    ziel: p.ziel,
    alter: p.alter,
    groesse: p.groesse,
    gewicht: p.gewicht,
    zielGewicht: p.zielGewicht,
    trainingstage: p.tage,
    dauer: p.dauer,
    ernaehrungsform: p.ernaehrungsform,
    erfahrung: p.erfahrung,
  };
}

export type EvionPlan = {
  zielDelta: number;
  kalorien: number;
  protein: number;
  kohlenhydrate: number;
  fett: number;
  schritte: number;
  tage: number;
  dauer: number;
  zeitraum: string;
};

/** Grobe, transparente Planberechnung (Mifflin-St Jeor + Zielkorrektur). */
export function berechnePlan(p: OnboardingProfil): EvionPlan {
  // Neutrale Rechengrößen, nur falls Angaben fehlen (werden nicht als Profilwerte angezeigt).
  const gewicht = p.gewicht ?? 75;
  const groesse = p.groesse ?? 172;
  const alter = p.alter ?? 35;
  const basis =
    10 * gewicht +
    6.25 * groesse -
    5 * alter +
    (p.geschlecht === "weiblich" ? -161 : p.geschlecht === "maennlich" ? 5 : -78);

  const aktivitaet = 1.35 + Math.min(p.tage, 6) * 0.03;
  let kalorien = basis * aktivitaet;

  const zielDelta = (p.zielGewicht ?? gewicht) - gewicht;
  const tempoFaktor = p.tempo === "sanft" ? 0.08 : p.tempo === "ambitioniert" ? 0.18 : 0.13;

  if (p.ziel === "fettabbau") kalorien *= 1 - tempoFaktor;
  else if (p.ziel === "muskelaufbau") kalorien *= 1.1;
  else if (p.ziel === "recomposition")
    kalorien *= p.recompFokus === "fettabbau" ? 0.94 : p.recompFokus === "muskelaufbau" ? 1.04 : 0.98;

  const proteinProKg = p.ziel === "fitness" ? 1.6 : 2.0;
  const protein = Math.round(gewicht * proteinProKg);
  const fett = Math.round((kalorien * 0.28) / 9);
  const kohlenhydrate = Math.max(80, Math.round((kalorien - protein * 4 - fett * 9) / 4));

  const wochen = Math.abs(zielDelta) > 0 ? Math.abs(zielDelta) / (tempoFaktor * 4) : 12;
  const von = Math.max(4, Math.round(wochen));
  const bis = von + Math.max(2, Math.round(von * 0.3));

  return {
    zielDelta: Math.round(zielDelta * 10) / 10,
    kalorien: Math.round(kalorien / 10) * 10,
    protein,
    kohlenhydrate,
    fett,
    schritte: p.ziel === "fettabbau" ? 10000 : 8000,
    tage: p.tage,
    dauer: p.dauer,
    zeitraum: `${von}–${bis} Wochen`,
  };
}
