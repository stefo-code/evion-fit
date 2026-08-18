/**
 * Personalisierte Trainingsplan-Generierung.
 *
 * Der Plan entsteht aus Ziel, Geschlecht, Alter, Erfahrung, Equipment,
 * Trainingstagen und einem optionalen Fokus (z. B. „Arme straffen“,
 * „rückenschonend“, „Rückbildung“). Manuelle Übungstausche des Nutzers
 * werden lokal gespeichert und überschreiben den Vorschlag.
 */

import { useCallback, useEffect, useState } from "react";
import type { Goal } from "@/lib/demo-data";
import type { Geschlecht } from "@/lib/onboarding-store";
import {
  uebungById,
  uebungsBibliothek,
  type Equipment,
  type LibUebung,
  type Muster,
} from "@/lib/exercise-library";

export type Fokus =
  | "ausgewogen"
  | "arme-straffen"
  | "bauch-weg"
  | "gesaess-beine"
  | "ruecken-schonend"
  | "rueckbildung"
  | "maximalkraft";

export const fokusOptionen: { id: Fokus; titel: string; beschreibung: string }[] = [
  {
    id: "ausgewogen",
    titel: "Ausgewogen",
    beschreibung: "Alle Muskelgruppen gleichmäßig – solide Basis für jedes Ziel.",
  },
  {
    id: "arme-straffen",
    titel: "Arme straffen",
    beschreibung: "Mehr Volumen für Schultern, Bizeps und Trizeps bei erhaltener Basis.",
  },
  {
    id: "bauch-weg",
    titel: "Bauch weg",
    beschreibung: "Rumpfkraft plus kalorienintensive Ganzkörperübungen (Fettabbau entsteht über die Ernährung).",
  },
  {
    id: "gesaess-beine",
    titel: "Gesäß & Beine",
    beschreibung: "Schwerpunkt Hüftstreckung und Beinarbeit – formt Gesäß und Oberschenkel.",
  },
  {
    id: "ruecken-schonend",
    titel: "Rückenschonend",
    beschreibung: "Ohne axiale Belastung der Wirbelsäule – geführte und abgestützte Übungen.",
  },
  {
    id: "rueckbildung",
    titel: "Rückbildung",
    beschreibung: "Sanfter Wiedereinstieg nach der Schwangerschaft: Beckenboden, Tiefenmuskulatur, Haltung.",
  },
  {
    id: "maximalkraft",
    titel: "Maximalkraft",
    beschreibung: "Schwere Grundübungen mit niedrigen Wiederholungen.",
  },
];

export type PlanKontext = {
  ziel: Goal;
  geschlecht: Geschlecht | null;
  alter: number | null;
  erfahrung: "Anfänger" | "Fortgeschritten" | "Erfahren";
  equipment: Equipment[];
  tage: number;
  dauer: number;
  fokus: Fokus;
};

export const standardKontext: PlanKontext = {
  ziel: "recomposition",
  geschlecht: null,
  alter: null,
  erfahrung: "Fortgeschritten",
  equipment: [],
  tage: 4,
  dauer: 45,
  fokus: "ausgewogen",
};

/** Übersetzt Onboarding-Equipment-Labels in Bibliotheks-Kategorien. */
export function mappeEquipment(labels: string[]): Equipment[] {
  const out = new Set<Equipment>();
  for (const l of labels.map((x) => x.toLowerCase())) {
    if (l.includes("kurzhantel")) out.add("kurzhantel");
    if (l.includes("langhantel") || l.includes("hantelbank")) out.add("langhantel");
    if (l.includes("maschine") || l.includes("studio") || l.includes("gym")) {
      out.add("maschine");
      out.add("kabel");
    }
    if (l.includes("kabel")) out.add("kabel");
    if (l.includes("band")) out.add("band");
    if (l.includes("körpergewicht") || l.includes("keine")) out.add("körpergewicht");
  }
  return [...out];
}

type Session = { titel: string; muster: Muster[] };

function wochenVorlage(k: PlanKontext): Session[] {
  const tage = Math.max(2, Math.min(6, k.tage || 3));

  if (k.fokus === "rueckbildung") {
    const s: Session[] = [
      { titel: "Beckenboden & Rumpf", muster: ["mobility", "core", "huefte"] },
      { titel: "Ganzkörper sanft", muster: ["mobility", "kniebeuge", "ziehen", "core"] },
      { titel: "Kraft & Haltung", muster: ["huefte", "ziehen", "schulter", "mobility"] },
      { titel: "Aufbau Ganzkörper", muster: ["kniebeuge", "druecken", "ziehen", "core"] },
    ];
    return s.slice(0, Math.min(tage, 4));
  }

  const ganzkoerper = (n: number): Session[] =>
    Array.from({ length: n }, (_, i) => ({
      titel: `Ganzkörper ${String.fromCharCode(65 + i)}`,
      muster:
        i % 2 === 0
          ? (["kniebeuge", "druecken", "ziehen", "core"] as Muster[])
          : (["huefte", "ziehen", "schulter", "core"] as Muster[]),
    }));

  if (tage <= 3) return ganzkoerper(tage);

  if (tage === 4) {
    return [
      { titel: "Oberkörper – Drücken", muster: ["druecken", "schulter", "arme"] },
      { titel: "Unterkörper – Kniebeuge", muster: ["kniebeuge", "huefte", "core"] },
      { titel: "Oberkörper – Ziehen", muster: ["ziehen", "ziehen", "arme"] },
      { titel: "Unterkörper – Hüfte", muster: ["huefte", "kniebeuge", "core"] },
    ];
  }

  return [
    { titel: "Push", muster: ["druecken", "schulter", "arme"] },
    { titel: "Pull", muster: ["ziehen", "ziehen", "arme"] },
    { titel: "Beine", muster: ["kniebeuge", "huefte", "core"] },
    { titel: "Oberkörper", muster: ["druecken", "ziehen", "schulter"] },
    { titel: "Unterkörper & Rumpf", muster: ["huefte", "kniebeuge", "core"] },
    { titel: "Schwachstellen", muster: ["arme", "schulter", "core"] },
  ].slice(0, tage);
}

/** Zusätzliche Muster, die der gewählte Fokus in jede Einheit einstreut. */
function fokusMuster(fokus: Fokus): Muster[] {
  switch (fokus) {
    case "arme-straffen":
      return ["arme", "schulter"];
    case "bauch-weg":
      return ["core"];
    case "gesaess-beine":
      return ["huefte"];
    case "ruecken-schonend":
      return ["core"];
    case "rueckbildung":
      return ["mobility"];
    default:
      return [];
  }
}

function bewerte(u: LibUebung, k: PlanKontext): number {
  let s = 10;

  // Harte Filter
  if (k.fokus === "rueckbildung" && !u.rueckbildung) return -1;
  if (k.fokus === "ruecken-schonend" && !u.rueckenschonend) return -1;
  if (k.equipment.length > 0 && !u.equipment.some((e) => k.equipment.includes(e))) {
    if (!u.equipment.includes("körpergewicht")) return -1;
  }

  // Erfahrung & Alter
  const alter = k.alter ?? 35;
  if (k.erfahrung === "Anfänger" && !u.einsteiger) s -= 6;
  if (alter >= 55 && !u.rueckenschonend) s -= 4;
  if (alter >= 55 && u.einsteiger) s += 1;
  if (k.erfahrung === "Erfahren" && u.grund) s += 1;

  // Ziel
  if (k.ziel === "kraft" || k.fokus === "maximalkraft") {
    s += u.grund ? 4 : -3;
    if (u.equipment.includes("langhantel")) s += 2;
  }
  if (k.ziel === "muskelaufbau") s += u.grund ? 2 : 1;
  if (k.ziel === "fettabbau") s += u.muster === "core" || u.equipment.includes("maschine") ? 1 : 0;
  if (k.ziel === "fitness") {
    s += u.einsteiger ? 3 : -2;
    if (u.equipment.includes("langhantel") && u.grund && !u.rueckenschonend) s -= 4;
    // Für allgemeine Fitness sind gelenkfreundliche Varianten sinnvoller als Wettkampfübungen.
    if (u.id === "bank-lh" || u.id === "kreuzheben" || u.id === "kniebeuge-lh") s -= 4;
  }

  // Geschlechtsspezifische Präferenzen (statistische Schwerpunkte, jederzeit änderbar)
  if (k.geschlecht === "weiblich") {
    if (u.muster === "huefte" || u.muskel === "Gesäß") s += 2;
    if (u.id === "bank-lh") s -= 3;
    if (u.muster === "mobility") s += 1;
  }
  if (k.geschlecht === "maennlich" && (u.muster === "druecken" || u.muskel === "Rücken")) s += 1;

  // Fokus
  switch (k.fokus) {
    case "arme-straffen":
      if (u.muster === "arme" || u.muster === "schulter") s += 5;
      break;
    case "bauch-weg":
      if (u.muster === "core") s += 5;
      if (u.grund) s += 2; // hoher Energieverbrauch
      break;
    case "gesaess-beine":
      if (u.muskel === "Gesäß" || u.muster === "huefte" || u.muster === "kniebeuge") s += 5;
      break;
    case "ruecken-schonend":
      if (u.rueckenschonend) s += 3;
      break;
    case "rueckbildung":
      if (u.muster === "mobility" || u.muskel === "Beckenboden") s += 6;
      if (u.muster === "core" && u.rueckbildung) s += 2;
      break;
    case "maximalkraft":
      break;
    default:
      break;
  }

  // Zeitbudget: bei wenig Zeit zählen Grundübungen mehr
  if (k.dauer <= 30) s += u.grund ? 3 : -2;

  return s;
}

export type PlanUebung = LibUebung & { begruendung: string };

function begruendung(u: LibUebung, k: PlanKontext): string {
  const teile: string[] = [];
  if (k.fokus !== "ausgewogen") {
    const f = fokusOptionen.find((x) => x.id === k.fokus)!;
    teile.push(`passt zum Fokus „${f.titel}“`);
  }
  if (u.grund) teile.push("Grundübung mit hohem Reiz");
  if (k.erfahrung === "Anfänger" && u.einsteiger) teile.push("technisch leicht zu lernen");
  if ((k.alter ?? 35) >= 55 && u.rueckenschonend) teile.push("gelenk- und rückenfreundlich");
  if (k.geschlecht === "weiblich" && (u.muskel === "Gesäß" || u.muster === "huefte"))
    teile.push("starker Gesäß-Reiz");
  if (teile.length === 0) teile.push("deckt das geplante Bewegungsmuster ab");
  return teile.join(" · ");
}

function waehle(muster: Muster, k: PlanKontext, benutzt: Set<string>): LibUebung | null {
  const kandidaten = uebungsBibliothek
    .filter((u) => u.muster === muster && !benutzt.has(u.id))
    .map((u) => ({ u, s: bewerte(u, k) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s);
  return kandidaten[0]?.u ?? null;
}

export type Trainingstag = {
  index: number;
  titel: string;
  uebungen: PlanUebung[];
};

/** Erzeugt den Wochenplan aus dem Kontext. */
export function erzeugePlan(k: PlanKontext): Trainingstag[] {
  const vorlage = wochenVorlage(k);
  const extra = fokusMuster(k.fokus);

  return vorlage.map((s, i) => {
    const benutzt = new Set<string>();
    const musterListe = [...s.muster, ...extra];
    const maxUebungen = k.dauer <= 20 ? 2 : k.dauer <= 30 ? 3 : k.dauer <= 45 ? 4 : 5;
    const uebungen: PlanUebung[] = [];

    for (const m of musterListe) {
      if (uebungen.length >= maxUebungen) break;
      const u = waehle(m, k, benutzt);
      if (!u) continue;
      benutzt.add(u.id);
      uebungen.push({ ...u, begruendung: begruendung(u, k) });
    }

    return { index: i, titel: s.titel, uebungen };
  });
}

/** Wendet gespeicherte Übungstausche an. */
export function wendeTauschAn(tage: Trainingstag[], tausch: Record<string, string>): Trainingstag[] {
  return tage.map((t) => ({
    ...t,
    uebungen: t.uebungen.map((u) => {
      const neu = tausch[u.id] ? uebungById.get(tausch[u.id]!) : undefined;
      return neu ? { ...neu, begruendung: "Von dir manuell ausgewählt" } : u;
    }),
  }));
}

// ---------------------------------------------------------------------------
// Lokale Speicherung von Fokus und Übungstausch
// ---------------------------------------------------------------------------

export type PlanEinstellungen = { fokus: Fokus; tausch: Record<string, string> };

const KEY = "evion.trainingsplan.v1";
const leer: PlanEinstellungen = { fokus: "ausgewogen", tausch: {} };

export function ladePlanEinstellungen(): PlanEinstellungen {
  if (typeof window === "undefined") return leer;
  try {
    const roh = window.localStorage.getItem(KEY);
    return roh ? { ...leer, ...(JSON.parse(roh) as Partial<PlanEinstellungen>) } : leer;
  } catch {
    return leer;
  }
}

export function usePlanEinstellungen() {
  const [state, setState] = useState<PlanEinstellungen>(leer);

  useEffect(() => {
    setState(ladePlanEinstellungen());
  }, []);

  const speichere = useCallback((teil: Partial<PlanEinstellungen>) => {
    setState((alt) => {
      const neu = { ...alt, ...teil };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(neu));
      } catch {
        /* Speicher nicht verfügbar – Auswahl bleibt für die Sitzung aktiv. */
      }
      return neu;
    });
  }, []);

  const tausche = useCallback(
    (vonId: string, zuId: string) =>
      setState((alt) => {
        const tausch = { ...alt.tausch };
        if (vonId === zuId) delete tausch[vonId];
        else tausch[vonId] = zuId;
        const neu = { ...alt, tausch };
        try {
          window.localStorage.setItem(KEY, JSON.stringify(neu));
        } catch {
          /* ignorieren */
        }
        return neu;
      }),
    [],
  );

  return { einstellungen: state, speichere, tausche };
}

export const wochentage = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
