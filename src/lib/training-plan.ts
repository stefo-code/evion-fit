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
  einschraenkungTags,
  type Einschraenkung,
  type Equipment,
  type LibUebung,
  type Muster,
} from "@/lib/exercise-library";

export type Fokus =
  | "ausgewogen"
  | "muskelaufbau"
  | "fettverbrennung"
  | "ausdauer"
  | "arme-straffen"
  | "bauch-weg"
  | "gesaess-beine"
  | "ruecken-schonend"
  | "rueckbildung"
  | "maximalkraft";

export const fokusOptionen: {
  id: Fokus;
  titel: string;
  beschreibung: string;
  /** Nur für dieses Geschlecht sinnvoll (z. B. Rückbildung nach Schwangerschaft). */
  nurFuer?: Geschlecht;
}[] = [
  {
    id: "ausgewogen",
    titel: "Ausgewogen",
    beschreibung: "Alle Muskelgruppen gleichmäßig – solide Basis für jedes Ziel.",
  },
  {
    id: "muskelaufbau",
    titel: "Muskelaufbau",
    beschreibung:
      "Mehrgelenkige Grundübungen plus gezielte Isolation im Bereich 6–12 Wiederholungen – maximaler Wachstumsreiz.",
  },
  {
    id: "fettverbrennung",
    titel: "Fettverbrennung / Definition",
    beschreibung:
      "Ganzkörper-Zirkel aus großen Kraftübungen und Konditionsblöcken: hoher Kalorienverbrauch bei Muskelerhalt.",
  },
  {
    id: "ausdauer",
    titel: "Ausdauer & Herz-Kreislauf",
    beschreibung:
      "Rudern, Ergometer, Intervalle und Ganzkörperkraft für Grundlagenausdauer und ein belastbares Herz-Kreislauf-System.",
  },
  {
    id: "arme-straffen",
    titel: "Arme & Schultern betonen",
    beschreibung: "Mehr Volumen für Schultern, Bizeps und Trizeps bei erhaltener Basis – Beine bleiben mit 2 Übungen pro Woche im Plan.",
  },
  {
    id: "bauch-weg",
    titel: "Rumpf & Haltung",
    beschreibung: "Kräftigt die Körpermitte und verbessert die Haltung – lokaler Fettabbau an einer Stelle ist nicht möglich.",
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
    nurFuer: "weiblich",
  },
  {
    id: "maximalkraft",
    titel: "Maximalkraft",
    beschreibung: "Schwere Grundübungen mit niedrigen Wiederholungen.",
  },
];

/** Fokus-Optionen, die zum Geschlecht passen. */
export function fokusFuerGeschlecht(geschlecht: Geschlecht | null | undefined) {
  return fokusOptionen.filter((f) => !f.nurFuer || !geschlecht || f.nurFuer === geschlecht);
}


export type PlanKontext = {
  ziel: Goal;
  geschlecht: Geschlecht | null;
  alter: number | null;
  erfahrung: "Anfänger" | "Fortgeschritten" | "Erfahren";
  equipment: Equipment[];
  tage: number;
  dauer: number;
  fokus: Fokus;
  /** Harte Einschränkungen aus dem Profil (Schulter, Rücken, Knie, Hüfte, Herz-Kreislauf). */
  einschraenkungen?: Einschraenkung[];
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
  einschraenkungen: [],
};

export { einschraenkungTags };

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

/** Hauptmuskel je Bewegungsmuster – für Wochenvolumen und 1-Compound+1-Komplementär-Logik. */
const hauptMuskelVonMuster: Partial<Record<Muster, string>> = {
  druecken: "Brust",
  ziehen: "Ruecken",
  kniebeuge: "Beine",
  huefte: "Gesaess",
  schulter: "Schultern",
};

/** Welche Bewegungsmuster für den gewählten Fokus zusätzlich betont werden (für Volumen & Reihenfolge). */
function fokusMuskelBetonung(fokus: Fokus): Muster[] {
  switch (fokus) {
    case "arme-straffen":
      return ["arme", "schulter"];
    case "gesaess-beine":
      return ["huefte", "kniebeuge"];
    case "maximalkraft":
    case "muskelaufbau":
      return ["druecken", "ziehen", "kniebeuge"];
    case "ausdauer":
      return ["kondition"];
    case "ruecken-schonend":
      return ["ziehen"];
    case "rueckbildung":
      return ["mobility", "huefte"];
    default:
      return [];
  }
}

/**
 * Wochensplit nach Trainingstagen (TEIL 4):
 * 2–3 Tage → Ganzkörper, 4 Tage → Oberkörper/Unterkörper, 5 Tage → OK/UK + Push/Pull/Beine,
 * 6 Tage → Push/Pull/Beine ×2. Der Fokus bestimmt nicht den Split, sondern Betonung & Reihenfolge
 * innerhalb der Einheiten (siehe `ordnePattern`).
 */
function sessionsFuerTage(tage: number): Session[] {
  const ganzkoerper = (n: number): Session[] =>
    Array.from({ length: n }, (_, i) => ({
      titel: `Ganzkörper ${String.fromCharCode(65 + i)}`,
      muster:
        i % 2 === 0
          ? (["kniebeuge", "druecken", "ziehen", "huefte", "schulter", "arme"] as Muster[])
          : (["huefte", "ziehen", "druecken", "kniebeuge", "schulter", "arme"] as Muster[]),
    }));

  if (tage <= 3) return ganzkoerper(Math.max(2, tage));

  if (tage === 4) {
    return [
      { titel: "Oberkörper A", muster: ["druecken", "ziehen", "schulter", "arme"] },
      { titel: "Unterkörper A", muster: ["kniebeuge", "huefte"] },
      { titel: "Oberkörper B", muster: ["ziehen", "druecken", "schulter", "arme"] },
      { titel: "Unterkörper B", muster: ["huefte", "kniebeuge"] },
    ];
  }

  if (tage === 5) {
    return [
      { titel: "Oberkörper", muster: ["druecken", "ziehen", "schulter", "arme"] },
      { titel: "Unterkörper", muster: ["kniebeuge", "huefte"] },
      { titel: "Push", muster: ["druecken", "schulter", "arme"] },
      { titel: "Pull", muster: ["ziehen", "arme"] },
      { titel: "Beine", muster: ["kniebeuge", "huefte"] },
    ];
  }

  // 6 Tage: Push/Pull/Beine im Doppellauf.
  return [
    { titel: "Push A", muster: ["druecken", "schulter", "arme"] },
    { titel: "Pull A", muster: ["ziehen", "arme"] },
    { titel: "Beine A", muster: ["kniebeuge", "huefte"] },
    { titel: "Push B", muster: ["druecken", "schulter", "arme"] },
    { titel: "Pull B", muster: ["ziehen", "arme"] },
    { titel: "Beine B", muster: ["kniebeuge", "huefte"] },
  ];
}

/**
 * Stellt die Muster einer Einheit so um, dass Grundübungs-Muster (Drücken/Ziehen/Kniebeuge/Hüfte)
 * vor Isolationsmustern stehen und Fokus-Muskeln früh in der Einheit erscheinen.
 */
function ordnePattern(muster: Muster[], fokus: Fokus): Muster[] {
  const betont = new Set(fokusMuskelBetonung(fokus));
  const grundMuster: Muster[] = ["kniebeuge", "druecken", "ziehen", "huefte"];
  const prio = (m: Muster) => (betont.has(m) ? 0 : grundMuster.includes(m) ? 1 : 2);
  return [...muster].sort((a, b) => prio(a) - prio(b));
}

function bewerte(u: LibUebung, k: PlanKontext): number {
  let s = 10;

  // Harte Filter
  if (k.fokus === "rueckbildung" && !u.rueckbildung) return -1;
  if (k.fokus === "ruecken-schonend" && !u.rueckenschonend) return -1;
  if (k.equipment.length > 0 && !u.equipment.some((e) => k.equipment.includes(e))) {
    if (!u.equipment.includes("körpergewicht")) return -1;
  }
  // Harte Einschränkungen: Übungen, die bei einer gemeldeten Einschränkung zu meiden sind, fallen
  // vollständig raus – unabhängig von sonstiger Eignung.
  const einschraenkungen = k.einschraenkungen ?? [];
  if (einschraenkungen.length > 0 && u.meidetBei?.some((m) => einschraenkungen.includes(m))) return -1;
  if (einschraenkungen.length > 0 && u.bevorzugtBei?.some((m) => einschraenkungen.includes(m))) s += 6;

  // Erfahrung & Alter
  const alter = k.alter ?? 35;
  if (k.erfahrung === "Anfänger" && !u.einsteiger) s -= 6;
  if (alter >= 50 && !u.rueckenschonend) s -= 4;
  if (alter >= 50 && u.rueckenschonend) s += 2;
  if (alter >= 55 && u.einsteiger) s += 1;
  if (k.erfahrung === "Erfahren" && u.grund) s += 1;

  // Ziel
  if (k.ziel === "kraft" || k.fokus === "maximalkraft") {
    s += u.grund ? 4 : -3;
    if (u.equipment.includes("langhantel")) s += 2;
  }
  if (k.ziel === "muskelaufbau" || k.ziel === "recomposition") s += u.grund ? 2 : 1;
  if (k.ziel === "fettabbau") s += u.muster === "core" || u.equipment.includes("maschine") ? 1 : 0;
  if (k.ziel === "fitness") {
    s += u.einsteiger ? 3 : -2;
    if (u.equipment.includes("langhantel") && u.grund && !u.rueckenschonend) s -= 4;
    // Für allgemeine Fitness sind gelenkfreundliche Varianten sinnvoller als Wettkampfübungen.
    if (u.id === "bank-lh" || u.id === "kreuzheben" || u.id === "kniebeuge-lh") s -= 4;
  }

  // Fokus (keine Geschlechts-Gewichtung – siehe TEIL 4)
  switch (k.fokus) {
    case "muskelaufbau":
      // Hypertrophie: mehrgelenkige Übungen mit hoher Spannung, ergänzt um Isolation.
      if (u.grund) s += 4;
      if (u.equipment.includes("kurzhantel") || u.equipment.includes("kabel")) s += 1;
      if (u.muster === "kondition") s -= 8;
      break;
    case "fettverbrennung":
      // Muskelerhalt über große Übungen + hoher Energieverbrauch über Kondition.
      if (u.grund) s += 4;
      if (u.muster === "kondition") s += 4;
      if (u.muskel === "Ganzkörper") s += 2;
      break;
    case "ausdauer":
      if (u.muster === "kondition") s += 8;
      if (u.grund) s += 2;
      if (u.equipment.includes("maschine")) s += 1;
      break;
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

export type PlanUebung = LibUebung & {
  begruendung: string;
  /** Aus den Template-Vorgaben: Gewichtssteigerung in kg. */
  steigerungKg?: number;
  /** Aus den Template-Vorgaben: Satzpause in Sekunden. */
  pauseSek?: number;
};

/** Feste Vorgabe je Template und Übung (überschreibt die Bibliothekswerte). */
export type Vorgabe = {
  saetze: number;
  wdhVon: number;
  wdhBis: number;
  grunduebung: boolean;
  steigerungKg: number;
  hinweis?: string;
};

function begruendung(u: LibUebung, k: PlanKontext): string {
  const teile: string[] = [];
  if (k.fokus !== "ausgewogen") {
    const f = fokusOptionen.find((x) => x.id === k.fokus)!;
    teile.push(`passt zum Fokus „${f.titel}“`);
  }
  if (u.grund) teile.push("Grundübung mit hohem Reiz");
  if (k.erfahrung === "Anfänger" && u.einsteiger) teile.push("technisch leicht zu lernen");
  if ((k.alter ?? 35) >= 50 && u.rueckenschonend) teile.push("gelenk- und rückenfreundlich");
  const einschraenkungen = k.einschraenkungen ?? [];
  if (einschraenkungen.length > 0 && u.bevorzugtBei?.some((m) => einschraenkungen.includes(m)))
    teile.push("schonende Alternative bei deiner Einschränkung");
  if (teile.length === 0) teile.push("deckt das geplante Bewegungsmuster effektiv ab");
  return teile.join(" · ");
}

const musterLabels: Record<Muster, string> = {
  druecken: "Drücken",
  ziehen: "Ziehen",
  kniebeuge: "Kniebeuge",
  huefte: "Hüfte / Gesäß",
  schulter: "Schulter",
  arme: "Arme",
  core: "Rumpf",
  mobility: "Mobility",
  kondition: "Ausdauer",
};

/** Sinnvolle Begründung auch für manuell ergänzte und selbst angelegte Übungen. */
function begruendungFuerManuell(u: LibUebung, k?: PlanKontext): string {
  const basis = k ? begruendung(u, k) : `trainiert ${u.muskel} · ${musterLabels[u.muster]}`;
  if (u.id.startsWith("eigen-")) {
    return [basis, `${u.zielSaetze} Sätze à ${u.wdhBereich}`].join(" · ");
  }
  return basis;
}

/** Wählt die beste verfügbare Übung für ein Muster; `bevorzugeMuskel` steuert z. B. Trizeps/Bizeps am Push/Pull-Tag. */
function waehle(
  muster: Muster,
  k: PlanKontext,
  benutzt: Set<string>,
  bevorzugeMuskel?: string,
): LibUebung | null {
  const kandidaten = uebungsBibliothek
    .filter((u) => u.muster === muster && !benutzt.has(u.id))
    .map((u) => ({
      u,
      s: bewerte(u, k) + (bevorzugeMuskel && u.muskel === bevorzugeMuskel ? 5 : 0),
    }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s);
  return kandidaten[0]?.u ?? null;
}

/** Zweite, ergänzende Übung zum selben Muster (Komplementär zur Compound-Übung): bevorzugt gedehnte
 * Endposition / stabile Variante statt eines weiteren freien Grundhebens. */
function waehleKomplementaer(
  muster: Muster,
  k: PlanKontext,
  benutzt: Set<string>,
  bevorzugeMuskel?: string,
): LibUebung | null {
  const kandidaten = uebungsBibliothek
    .filter((u) => u.muster === muster && !benutzt.has(u.id))
    .map((u) => {
      let s = bewerte(u, k);
      if (bevorzugeMuskel && u.muskel === bevorzugeMuskel) s += 5;
      // Komplementär: Isolation/Maschine/geführte und gedehnte Varianten bevorzugen.
      if (!u.grund) s += 3;
      if (u.equipment.includes("maschine") || u.equipment.includes("kabel")) s += 2;
      if (/dehnung|gestreckt/i.test(u.hinweis)) s += 3;
      return { u, s };
    })
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s);
  return kandidaten[0]?.u ?? null;
}

/** Zielsätze je Satztyp (Compound/Isolation) und Ziel (TEIL 4: Wiederholungsbereiche nach Ziel). */
function wdhBereichFuer(k: PlanKontext, compound: boolean): string {
  switch (k.ziel) {
    case "kraft":
      return compound ? "3–6" : "6–10";
    case "fitness":
      return "8–15";
    case "muskelaufbau":
    case "recomposition":
    case "fettabbau":
    default:
      return compound ? "6–10" : "10–15";
  }
}

/** Satzanzahl pro Einheit nach Dauer (TEIL 4: 60≈16–20, 45≈12–15, 30≈8–10 Arbeitssätze gesamt). */
function satzBudgetFuerDauer(dauer: number): { min: number; max: number; uebungen: number } {
  if (dauer <= 30) return { min: 8, max: 10, uebungen: 4 };
  if (dauer <= 45) return { min: 12, max: 15, uebungen: 5 };
  return { min: 16, max: 20, uebungen: 7 };
}

export type Trainingstag = {
  index: number;
  titel: string;
  uebungen: PlanUebung[];
};

/** Erzeugt den Wochenplan aus dem Kontext (TEIL 4). */
export function erzeugePlan(kontext: PlanKontext): Trainingstag[] {
  // Rückbildung ist nur nach einer Schwangerschaft sinnvoll.
  const k: PlanKontext =
    kontext.fokus === "rueckbildung" && kontext.geschlecht === "maennlich"
      ? { ...kontext, fokus: "ausgewogen" }
      : kontext;

  const tage = Math.max(2, Math.min(6, k.tage || 3));
  const sessions = sessionsFuerTage(tage);
  const budget = satzBudgetFuerDauer(k.dauer);

  // Oberkörper-lastiger Fokus (Arme/Schultern betonen): Beine insgesamt auf max. 2 Übungen/Woche begrenzen.
  const beinLimitProWoche = k.fokus === "arme-straffen" ? 2 : Infinity;
  let beinUebungenGenutzt = 0;

  return sessions.map((s, i) => {
    const benutzt = new Set<string>();
    const musterListe = ordnePattern(s.muster, k.fokus);
    const titelLower = s.titel.toLowerCase();
    // Arme folgen dem Tag: Push → Trizeps, Pull/Ziehen-lastig → Bizeps.
    const armMuskelFuerTag = titelLower.includes("pull")
      ? "Bizeps"
      : titelLower.includes("push")
        ? "Trizeps"
        : undefined;

    const uebungen: PlanUebung[] = [];
    const push = (u: LibUebung) => {
      benutzt.add(u.id);
      uebungen.push({ ...u, begruendung: begruendung(u, k) });
    };

    // Durchlauf 1: je Hauptmuster eine Compound-Übung (Grundübungen zuerst, Fokus-Muskeln früh).
    for (const m of musterListe) {
      if (uebungen.length >= budget.uebungen) break;
      if ((m === "kniebeuge" || m === "huefte") && beinUebungenGenutzt >= beinLimitProWoche) continue;
      const bevorzugt = m === "arme" ? armMuskelFuerTag : undefined;
      const u = waehle(m, k, benutzt, bevorzugt);
      if (!u) continue;
      push(u);
      if (m === "kniebeuge" || m === "huefte") beinUebungenGenutzt++;
    }

    // Durchlauf 2: je Hauptmuskel (Drücken/Ziehen/Kniebeuge/Hüfte/Schulter) eine komplementäre Übung.
    for (const m of musterListe) {
      if (uebungen.length >= budget.uebungen) break;
      if (!hauptMuskelVonMuster[m]) continue;
      if ((m === "kniebeuge" || m === "huefte") && beinUebungenGenutzt >= beinLimitProWoche) continue;
      const u = waehleKomplementaer(m, k, benutzt);
      if (!u) continue;
      push(u);
      if (m === "kniebeuge" || m === "huefte") beinUebungenGenutzt++;
    }

    // Satzbudget: Zielsätze je Übung setzen (Compound mehr Sätze als Isolation) und an das Dauer-Budget anpassen.
    const mitSaetzen = uebungen.map((u) => ({
      ...u,
      zielSaetze: u.grund ? (k.ziel === "kraft" ? 5 : 4) : 3,
      wdhBereich: wdhBereichFuer(k, u.grund),
    }));
    let summe = mitSaetzen.reduce((a, u) => a + u.zielSaetze, 0);
    let idx = 0;
    // Auffüllen, falls unter dem Minimum (z. B. wenig Übungen gefunden).
    while (summe < budget.min && mitSaetzen.length > 0) {
      mitSaetzen[idx % mitSaetzen.length]!.zielSaetze += 1;
      summe += 1;
      idx++;
    }
    // Kürzen, falls über dem Maximum: zuerst bei Isolationsübungen am Ende reduzieren.
    idx = mitSaetzen.length - 1;
    while (summe > budget.max && mitSaetzen.some((u) => u.zielSaetze > 2)) {
      const n = mitSaetzen.length;
      const u = mitSaetzen[((idx % n) + n) % n]!;
      if (u.zielSaetze > 2) {
        u.zielSaetze -= 1;
        summe -= 1;
      }
      idx--;
    }

    return { index: i, titel: s.titel, uebungen: mitSaetzen };
  });
}

/** Wendet gespeicherte Übungstausche an. */
export function wendeTauschAn(
  tage: Trainingstag[],
  tausch: Record<string, string>,
  kontext?: PlanKontext,
): Trainingstag[] {
  return tage.map((t) => ({
    ...t,
    uebungen: t.uebungen.map((u) => {
      const neu = tausch[u.id] ? uebungById.get(tausch[u.id]!) : undefined;
      return neu ? { ...neu, begruendung: begruendungFuerManuell(neu, kontext) } : u;
    }),
  }));
}

/** Entfernt gelöschte und ergänzt hinzugefügte Übungen je Trainingstag. */
export function wendeAnpassungenAn(
  tage: Trainingstag[],
  e: PlanEinstellungen,
  kontext?: PlanKontext,
): Trainingstag[] {
  const alle = new Map<string, LibUebung>(uebungById);
  for (const u of e.eigene ?? []) alle.set(u.id, u);

  return tage.map((t) => {
    const key = String(t.index);
    const entfernt = new Set(e.entfernt?.[key] ?? []);
    const behalten = t.uebungen.filter((u) => !entfernt.has(u.id));
    const zusatz = (e.zusatz?.[key] ?? [])
      .map((id) => alle.get(id))
      .filter((u): u is LibUebung => Boolean(u))
      .filter((u) => !behalten.some((b) => b.id === u.id))
      .map((u) => ({ ...u, begruendung: begruendungFuerManuell(u, kontext) }));
    const liste = [...behalten, ...zusatz];
    // Gespeicherte Reihenfolge anwenden (IDs, die nicht mehr existieren, werden ignoriert).
    const reihenfolge = e.reihenfolge?.[key] ?? [];
    if (reihenfolge.length > 0) {
      const pos = new Map(reihenfolge.map((id, i) => [id, i]));
      liste.sort(
        (a, b) => (pos.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (pos.get(b.id) ?? Number.MAX_SAFE_INTEGER),
      );
    }
    return { ...t, uebungen: liste };
  });
}

// ---------------------------------------------------------------------------
// Lokale Speicherung von Fokus und Übungstausch
// ---------------------------------------------------------------------------

export type PlanEinstellungen = {
  fokus: Fokus;
  tausch: Record<string, string>;
  /** Entfernte Übungs-IDs je Trainingstag-Index. */
  entfernt: Record<string, string[]>;
  /** Zusätzlich gewählte Übungs-IDs je Trainingstag-Index. */
  zusatz: Record<string, string[]>;
  /** Gespeicherte Reihenfolge der Übungs-IDs je Trainingstag-Index. */
  reihenfolge: Record<string, string[]>;
  /** Selbst angelegte Übungen. */
  eigene: LibUebung[];
  /** Selbst gewählte Wochentage (0 = Montag … 6 = Sonntag). null = Vorschlag. */
  trainingstage: number[] | null;
  /** Selbst erstellte Trainings-Templates (Index ≥ 100). */
  vorlagen: { index: number; titel: string }[];
  /** Umbenannte Template-Titel je Template-Index. */
  titel: Record<string, string>;
  /** Zuordnung Wochentag (0 = Mo) → Template-Index. */
  zuordnung: Record<string, number>;
  /** Satzpause in Sekunden. */
  pauseSek: number;
  /** Feste Wochentage statt Rotation für das nächste Training. */
  festeTage?: boolean;
  /** Vorgaben je Template-Index und Übungs-ID. */
  vorgaben?: Record<string, Record<string, Vorgabe>>;
  /** Rotation als Liste von Template-Indizes. */
  rotation?: number[];
  /** Manuell als nächstes festgelegtes Template (gilt bis zur nächsten Einheit dieses Templates). */
  naechster?: { index: number; seit: number } | null;
  /** Templates ohne Booster-Erinnerung. */
  ohneBooster?: number[];
  /** Persönlicher 4er-Plan wurde einmalig angelegt. */
  persoenlichV1?: boolean;
  /** Persönlicher Plan auf Push/Pull-Rotation (Okt. 2026) umgestellt. */
  persoenlichV2?: boolean;
  /** Robuste Umstellung (erkennt alte persönliche Templates auch ohne Flag). */
  persoenlichV3?: boolean;
  /** Pause Grundübungen in Sekunden (Standard 150). */
  pauseGrundSek?: number;
  /** Pause Isolationsübungen in Sekunden (Standard 75). */
  pauseIsoSek?: number;
  /** Bearbeitetes Aufwärmen je Template-Index (Liste von Texten). */
  aufwaermen?: Record<string, string[]>;
  /** Gelöschte generierte Templates (Template-Indizes < 100). */
  geloescht?: number[] | undefined;
};

const KEY = "evion.trainingsplan.v1";
const leer: PlanEinstellungen = {
  fokus: "ausgewogen",
  tausch: {},
  entfernt: {},
  zusatz: {},
  reihenfolge: {},
  eigene: [],
  trainingstage: null,
  vorlagen: [],
  titel: {},
  zuordnung: {},
  pauseSek: 60,
};

/** Alle Trainings-Templates: Vorschläge plus eigene, inkl. aller Anpassungen. */
export function baueVorlagen(kontext: PlanKontext, e: PlanEinstellungen): Trainingstag[] {
  const geloescht = new Set(e.geloescht ?? []);
  const generiert = erzeugePlan(kontext).filter((t) => !geloescht.has(t.index));
  const eigene: Trainingstag[] = (e.vorlagen ?? []).map((v) => ({ index: v.index, titel: v.titel, uebungen: [] }));
  return wendeAnpassungenAn(
    wendeTauschAn([...generiert, ...eigene], e.tausch, kontext),
    e,
    kontext,
  ).map((t) => {
    const v = e.vorgaben?.[String(t.index)];
    return {
      ...t,
      titel: e.titel?.[String(t.index)] || t.titel,
      uebungen: !v
        ? t.uebungen
        : t.uebungen.map((u) => {
            const g = v[u.id];
            if (!g) return u;
            return {
              ...u,
              zielSaetze: g.saetze,
              wdhBereich: g.wdhVon === g.wdhBis ? String(g.wdhVon) : `${g.wdhVon}–${g.wdhBis}`,
              grund: g.grunduebung,
              hinweis: g.hinweis || u.hinweis,
              steigerungKg: g.steigerungKg,
              pauseSek: g.grunduebung ? 150 : 75,
            };
          }),
    };
  });
}

type EinheitRef = { id: string; tagIndex: number };
const erstelltUm = (x: EinheitRef) => Number(x.id.slice(2)) || 0;

/** Manuell festgelegtes nächstes Template, solange es seitdem nicht absolviert wurde. */
export function festgelegtesTraining(plan: Trainingstag[], e: PlanEinstellungen, einheiten: EinheitRef[]) {
  const n = e.naechster;
  if (!n) return undefined;
  if (einheiten.some((x) => x.tagIndex === n.index && erstelltUm(x) > n.seit)) return undefined;
  return plan.find((t) => t.index === n.index);
}

/** Template nach dem zuletzt abgeschlossenen gemäß Rotation. */
export function naechstesAusRotation(plan: Trainingstag[], e: PlanEinstellungen, einheiten: EinheitRef[]) {
  const rot = (e.rotation ?? []).filter((i) => plan.some((t) => t.index === i));
  if (rot.length === 0) return undefined;
  let pos = -1;
  for (let i = einheiten.length - 1; i >= 0; i--) {
    const p = rot.indexOf(einheiten[i]!.tagIndex);
    if (p >= 0) { pos = p; break; }
  }
  const idx = rot[(pos + 1) % rot.length]!;
  return plan.find((t) => t.index === idx);
}

// ---------------------------------------------------------------------------
// Persönlicher 4er-Plan (einmalig angelegt)
// ---------------------------------------------------------------------------

function eigeneP(
  id: string, name: string, muskel: string, muster: Muster, equipment: Equipment[], startGewicht: number, hinweis: string,
): LibUebung {
  return {
    id, name, muskel, muster, equipment, grund: false, zielSaetze: 3, wdhBereich: "8–12", startGewicht, hinweis,
    rueckenschonend: true, rueckbildung: false, einsteiger: true, bildMuster: true,
  };
}

const PERSOENLICH_EIGENE: LibUebung[] = [
  eigeneP("eigen-p-schraegbank-kh", "Schrägbankdrücken Kurzhantel 30°", "Brust", "druecken", ["kurzhantel"], 20, "Bank auf 30°, Schulterblätter zusammen, kontrolliert absenken."),
  eigeneP("eigen-p-rudern-brust", "Brustgestütztes Rudern (KH)", "Rücken", "ziehen", ["kurzhantel"], 20, "Brust auf der Schrägbank, Ellbogen eng nach hinten ziehen."),
  eigeneP("eigen-p-latzug-eng", "Latzug eng, neutraler Griff", "Rücken", "ziehen", ["kabel", "maschine"], 45, "Griff zur oberen Brust ziehen, Ellbogen nah am Körper."),
  eigeneP("eigen-p-seitheben-ma", "Seitheben-Maschine", "Schultern", "schulter", ["maschine"], 20, "Ellbogen führen, oben kurz halten, langsam ablassen."),
  eigeneP("eigen-p-bayesian", "Bayesian Curls (Kabel)", "Bizeps", "arme", ["kabel"], 10, "Kabel hinter dem Körper, Oberarm leicht nach hinten – Dehnung nutzen."),
  eigeneP("eigen-p-overhead-trizeps", "Overhead-Trizepsstrecken (Kabel, Seil)", "Trizeps", "arme", ["kabel"], 15, "Ellbogen zeigen nach vorn, volle Dehnung über Kopf."),
  eigeneP("eigen-p-schraeg-presse", "Schrägbank-Brustpresse (Maschine)", "Brust", "druecken", ["maschine"], 35, "Griffe auf Höhe der oberen Brust, Schultern unten halten."),
  eigeneP("eigen-p-pullover", "Lat-Pullover (Kabel)", "Rücken", "ziehen", ["kabel"], 20, "Arme fast gestreckt, Stange im Bogen zu den Oberschenkeln führen."),
  eigeneP("eigen-p-reverse-flys", "Reverse Flys", "Schultern", "schulter", ["maschine", "kabel"], 15, "Hintere Schulter arbeitet, Schulterblätter nicht hochziehen."),
  eigeneP("eigen-p-waden-beinpresse", "Wadendrücken an der Beinpresse", "Waden", "kniebeuge", ["maschine"], 60, "Nur Fussballen auf der Platte, unten 2 s Dehnung halten, oben 1 s anspannen."),
];

type Zeile = [id: string, saetze: number, von: number, bis: number, grund: boolean, hinweis?: string];

const WADEN_HINWEIS = "Unten 2 s Dehnung halten, oben 1 s anspannen.";
const PERSOENLICH_TEMPLATES: { titel: string; booster: boolean; aufwaermen: string[]; uebungen: Zeile[] }[] = [
  {
    titel: "Push A",
    booster: true,
    aufwaermen: ["Face Pulls 2 × 15 leicht – am Ende die Hände nach aussen drehen", "Aufwärmsätze Schrägbankdrücken: 2 Sätze mit ca. 50 % und 75 % des Arbeitsgewichts"],
    uebungen: [
      ["eigen-p-schraegbank-kh", 3, 6, 8, true],
      ["brustpresse", 3, 8, 10, true],
      ["fliegende", 2, 12, 15, false],
      ["eigen-p-seitheben-ma", 4, 12, 15, false],
      ["eigen-p-overhead-trizeps", 3, 10, 12, false],
      ["beinpresse", 3, 10, 12, true],
      ["eigen-p-waden-beinpresse", 3, 10, 15, false, WADEN_HINWEIS],
    ],
  },
  {
    titel: "Pull A",
    booster: true,
    aufwaermen: ["Face Pulls 2 × 15 leicht – am Ende die Hände nach aussen drehen", "Aufwärmsätze Rumänisches Kreuzheben: 2 Sätze mit ca. 50 % und 75 % des Arbeitsgewichts"],
    uebungen: [
      ["rdl-kh", 3, 8, 10, true, "Zuerst, solange der Rücken frisch ist. Rücken neutral, Bewegung aus der Hüfte."],
      ["eigen-p-latzug-eng", 3, 8, 10, true],
      ["eigen-p-rudern-brust", 3, 8, 10, true],
      ["eigen-p-pullover", 2, 12, 15, false],
      ["eigen-p-reverse-flys", 3, 12, 15, false],
      ["eigen-p-bayesian", 3, 10, 12, false],
    ],
  },
  {
    titel: "Push B",
    booster: true,
    aufwaermen: ["Face Pulls 2 × 15 leicht – am Ende die Hände nach aussen drehen", "Aufwärmsätze Schrägbank-Brustpresse: 2 Sätze mit ca. 50 % und 75 % des Arbeitsgewichts"],
    uebungen: [
      ["eigen-p-schraeg-presse", 3, 8, 10, true],
      ["bank-kh", 3, 8, 10, true, "Neutraler Griff – Handflächen zeigen zueinander."],
      ["butterfly", 2, 12, 15, false],
      ["seitheben", 4, 12, 20, false],
      ["trizeps-kabel", 3, 12, 15, false, "Mit Seil – unten die Enden auseinanderziehen."],
      ["eigen-p-overhead-trizeps", 2, 10, 12, false],
    ],
  },
  {
    titel: "Pull B",
    booster: false,
    aufwaermen: ["Aufwärmsätze Kabelrudern: 2 Sätze mit ca. 50 % und 75 % des Arbeitsgewichts (Face Pulls folgen im Training)"],
    uebungen: [
      ["rudern-kabel", 3, 8, 10, true],
      ["latzug", 3, 8, 10, true, "Breiter Griff, vor dem Kopf ziehen, nie in den Nacken."],
      ["seitheben-kabel", 3, 12, 15, false],
      ["facepull", 3, 15, 15, false],
      ["eigen-p-bayesian", 3, 10, 12, false],
      ["hammer", 2, 10, 12, false],
      ["wadenheben", 3, 10, 15, false, WADEN_HINWEIS],
    ],
  },
];

/** Schreibt die Push/Pull-Templates in die angegebenen Indizes (gleiche Reihenfolge wie PERSOENLICH_TEMPLATES). */
function schreibePersoenlicheTemplates(alt: PlanEinstellungen, indizes: number[]): PlanEinstellungen {
  const vorlagen = [...(alt.vorlagen ?? [])];
  const zusatz = { ...alt.zusatz };
  const vorgaben = { ...(alt.vorgaben ?? {}) };
  const titel = { ...(alt.titel ?? {}) };
  const tausch = { ...(alt.tausch ?? {}) };
  const entfernt = { ...(alt.entfernt ?? {}) };
  const reihenfolge = { ...(alt.reihenfolge ?? {}) };
  const aufwaermen = { ...(alt.aufwaermen ?? {}) };
  const ohneBooster = (alt.ohneBooster ?? []).filter((i) => !indizes.includes(i));
  PERSOENLICH_TEMPLATES.forEach((t, i) => {
    const index = indizes[i]!;
    const k = String(index);
    const pos = vorlagen.findIndex((v) => v.index === index);
    if (pos >= 0) vorlagen[pos] = { ...vorlagen[pos]!, titel: t.titel };
    else vorlagen.push({ index, titel: t.titel });
    delete titel[k];
    delete tausch[k];
    delete entfernt[k];
    delete reihenfolge[k];
    zusatz[k] = t.uebungen.map((z) => z[0]);
    vorgaben[k] = Object.fromEntries(
      t.uebungen.map(([id, saetze, wdhVon, wdhBis, grunduebung, hinweis]) => [
        id,
        { saetze, wdhVon, wdhBis, grunduebung, steigerungKg: steigerungFuer(id), ...(hinweis ? { hinweis } : {}) },
      ]),
    );
    aufwaermen[k] = t.aufwaermen;
    if (!t.booster) ohneBooster.push(index);
  });
  const vorhanden = new Set((alt.eigene ?? []).map((u) => u.id));
  return {
    ...alt,
    vorlagen,
    zusatz,
    vorgaben,
    titel,
    tausch,
    entfernt,
    reihenfolge,
    aufwaermen,
    ohneBooster,
    rotation: indizes,
    naechster: { index: indizes[0]!, seit: Date.now() },
    eigene: [...(alt.eigene ?? []), ...PERSOENLICH_EIGENE.filter((u) => !vorhanden.has(u.id))],
    persoenlichV1: true,
    persoenlichV2: true,
    persoenlichV3: true,
  };
}

/** Stellt einen früher übernommenen 4er-Plan (Oberkörper A / Push / Pull / Oberkörper B) auf Push/Pull um.
 *  Erkennt die alten Templates über Titel oder über die persönlichen Übungen (eigen-p-…), auch ohne Flag. */
export function migrierePersoenlichenPlan(alt: PlanEinstellungen): PlanEinstellungen {
  if (alt.persoenlichV3) return alt;
  const vorlagen = alt.vorlagen ?? [];
  const schonNeu = vorlagen.some(
    (v) => v.titel === "Push A" && (alt.zusatz?.[String(v.index)] ?? []).includes("eigen-p-waden-beinpresse"),
  );
  if (schonNeu) return { ...alt, persoenlichV1: true, persoenlichV2: true, persoenlichV3: true };
  const alteTitel = ["oberkörper a", "push", "pull", "oberkörper b"];
  const hatEigenP = (index: number) => (alt.zusatz?.[String(index)] ?? []).some((id) => id.startsWith("eigen-p-"));
  // Titel allein reichen nur, wenn der persönliche Plan nachweislich übernommen wurde (Flag oder eigen-p-Übungen),
  // damit selbst angelegte Templates wie „Push“ anderer Nutzer nie überschrieben werden.
  const persoenlichErkannt = !!alt.persoenlichV1 || vorlagen.some((v) => v.index >= 100 && hatEigenP(v.index));
  const istPersoenlich = (index: number, titel: string) =>
    index >= 100 && (hatEigenP(index) || (persoenlichErkannt && alteTitel.includes(titel.trim().toLowerCase())));
  const kandidaten = vorlagen.filter((v) => istPersoenlich(v.index, v.titel)).map((v) => v.index);
  if (kandidaten.length === 0) return alt;
  // Reihenfolge: zuerst nach alten Titeln, sonst nach Rotation, sonst nach Index.
  const nachTitel = alteTitel
    .map((t) => vorlagen.find((v) => v.titel.trim().toLowerCase() === t && v.index >= 100)?.index)
    .filter((x): x is number => x !== undefined);
  const rot = (alt.rotation ?? []).filter((i) => kandidaten.includes(i));
  const geordnet = [...new Set([...(nachTitel.length === 4 ? nachTitel : []), ...rot, ...kandidaten.sort((x, y) => x - y)])];
  let indizes = geordnet.slice(0, 4);
  if (indizes.length < 4) {
    let naechsterFrei = Math.max(99, ...vorlagen.map((v) => v.index)) + 1;
    while (indizes.length < 4) indizes = [...indizes, naechsterFrei++];
  }
  return { ...schreibePersoenlicheTemplates(alt, indizes), persoenlichV3: true };
}

/** Das nächste Training – identisch für Home und Training. */
export function naechstesTraining(
  plan: Trainingstag[],
  e: PlanEinstellungen,
  einheiten: EinheitRef[],
  tage: number[],
  heute: Date = new Date(),
): Trainingstag | undefined {
  if (plan.length === 0) return undefined;
  const fest = festgelegtesTraining(plan, e, einheiten);
  if (fest) return fest;
  if (e.festeTage) {
    const t = vorlageFuerTag(plan, e, tage, (heute.getDay() + 6) % 7);
    if (t) return t;
  }
  const rot = naechstesAusRotation(plan, e, einheiten);
  if (rot) return rot;
  const letzte = einheiten[einheiten.length - 1];
  const i = letzte ? plan.findIndex((t) => t.index === letzte.tagIndex) : -1;
  return plan[(i + 1) % plan.length] ?? plan[0];
}

/** Normalisiert Übungsnamen für den Dedupe-Vergleich (Groß-/Kleinschreibung, Leerzeichen). */
function normalisierterName(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Nächste freie ID für eine von der KI neu definierte Übung. */
function naechsteEigeneKiId(belegt: Set<string>): string {
  let i = 1;
  while (belegt.has(`eigen-ki-${i}`)) i++;
  return `eigen-ki-${i}`;
}

/** Ordnet einen Freitext-Muskel grob einem Bewegungsmuster zu (für Bild & Alternativen). */
function musterAusMuskel(muskel: string, grund: boolean): Muster {
  const m = muskel.toLowerCase();
  if (m.includes("brust")) return "druecken";
  if (m.includes("rücken") || m.includes("ruecken") || m.includes("lat")) return "ziehen";
  if (m.includes("gesäß") || m.includes("gesaess") || m.includes("hüfte") || m.includes("huefte")) return "huefte";
  if (m.includes("bein") || m.includes("quad") || m.includes("oberschenkel")) return "kniebeuge";
  if (m.includes("schulter")) return "schulter";
  if (m.includes("bizeps") || m.includes("trizeps") || m.includes("arm")) return "arme";
  if (m.includes("bauch") || m.includes("core") || m.includes("rumpf") || m.includes("beckenboden")) return "core";
  if (m.includes("ausdauer") || m.includes("herz") || m.includes("kondition")) return "kondition";
  if (m.includes("mobil")) return "mobility";
  return grund ? "druecken" : "core";
}

function steigerungFuerAusstattung(equipment: Equipment[]): number {
  const nurKh = equipment.includes("kurzhantel") && !equipment.some((x) => x === "kabel" || x === "maschine");
  return nurKh ? 2 : 2.5;
}

/** Von der KI neu definierte Übung (wird beim Übernehmen zu einer eigenen Übung). */
export type KiNeueUebungEingabe = { name: string; muskel: string; equipment: string[]; grund: boolean; wdh: string; technik: string };
export type KiUebungEingabe = { id: string; saetze: number; wdhVon: number; wdhBis: number; neu?: KiNeueUebungEingabe | undefined };
export type KiTemplateEingabe = { titel: string; uebungen: KiUebungEingabe[] };

/** Baut aus einem KI-Vorschlag für eine neue Übung einen eigenen Bibliothekseintrag (Platzhalterbild). */
function eigeneAusKiVorschlag(id: string, neu: KiNeueUebungEingabe, wdhVon: number, wdhBis: number): LibUebung {
  const equipment = mappeEquipment(neu.equipment);
  return {
    id,
    name: neu.name.slice(0, 120) || "Neue Übung",
    muskel: neu.muskel.slice(0, 80) || "Ganzkörper",
    muster: musterAusMuskel(neu.muskel, neu.grund),
    equipment: equipment.length > 0 ? equipment : ["körpergewicht"],
    grund: neu.grund,
    zielSaetze: 3,
    wdhBereich: neu.wdh || `${wdhVon}–${wdhBis}`,
    startGewicht: 0,
    hinweis: neu.technik.slice(0, 300),
    rueckenschonend: true,
    rueckbildung: false,
    einsteiger: !neu.grund,
    bildMuster: true,
  };
}

function steigerungFuer(id: string): number {
  if (id === "beinpresse" || id === "rdl-kh" || id === "kreuzheben") return 5;
  const u = uebungById.get(id) ?? PERSOENLICH_EIGENE.find((x) => x.id === id);
  if (!u) return 2.5;
  const nurKh = u.equipment.includes("kurzhantel") && !u.equipment.some((x) => x === "kabel" || x === "maschine");
  return nurKh ? 2 : 2.5;
}

/** Legt den persönlichen Plan als 4 Templates mit Rotation an (einmalig). */
export function legePersoenlichenPlanAn(alt: PlanEinstellungen): PlanEinstellungen {
  if (alt.persoenlichV1) return migrierePersoenlichenPlan(alt);
  const start = Math.max(99, ...(alt.vorlagen ?? []).map((v) => v.index)) + 1;
  return schreibePersoenlicheTemplates(alt, PERSOENLICH_TEMPLATES.map((_, i) => start + i));
}

/** Template, das einem Wochentag zugeordnet ist (Standard: Vorschläge der Reihe nach). */
export function vorlageFuerTag(
  vorlagen: Trainingstag[],
  e: Pick<PlanEinstellungen, "zuordnung">,
  tage: number[],
  wochentag: number,
): Trainingstag | undefined {
  if (!tage.includes(wochentag)) return undefined;
  const z = e.zuordnung?.[String(wochentag)];
  const gewaehlt = vorlagen.find((v) => v.index === z);
  if (gewaehlt) return gewaehlt;
  const vorschlaege = vorlagen.filter((v) => v.index < 100);
  const liste = vorschlaege.length > 0 ? vorschlaege : vorlagen;
  return liste[tage.indexOf(wochentag) % Math.max(liste.length, 1)];
}

/** Sinnvoll über die Woche verteilte Standardtage für n Einheiten. */
const verteilung: Record<number, number[]> = {
  1: [2],
  2: [1, 4],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

export function standardTrainingstage(anzahl: number): number[] {
  return verteilung[Math.max(1, Math.min(7, anzahl || 4))]!;
}

/** Gewählte Tage oder – falls nichts gewählt – der Vorschlag aus der Tage-Anzahl. */
export function aktiveTrainingstage(
  e: Pick<PlanEinstellungen, "trainingstage">,
  anzahl: number,
): number[] {
  const gewaehlt = (e.trainingstage ?? []).filter((d) => d >= 0 && d <= 6);
  return gewaehlt.length > 0 ? [...new Set(gewaehlt)].sort((a, b) => a - b) : standardTrainingstage(anzahl);
}


export function ladePlanEinstellungen(): PlanEinstellungen {
  if (typeof window === "undefined") return leer;
  try {
    const roh = window.localStorage.getItem(KEY);
    if (!roh) return leer;
    const geladen: PlanEinstellungen = { ...leer, ...(JSON.parse(roh) as Partial<PlanEinstellungen>) };
    const migriert = migrierePersoenlichenPlan(geladen);
    if (migriert !== geladen) window.localStorage.setItem(KEY, JSON.stringify(migriert));
    return migriert;
  } catch {
    return leer;
  }
}

export function usePlanEinstellungen() {
  const [state, setState] = useState<PlanEinstellungen>(leer);

  useEffect(() => {
    // Persönlicher Plan wird nicht mehr automatisch angelegt; vorhandene Daten bleiben unverändert.
    setState(ladePlanEinstellungen());
  }, []);

  const aktualisiere = useCallback((fn: (alt: PlanEinstellungen) => PlanEinstellungen) => {
    setState((alt) => {
      const neu = fn(alt);
      try {
        window.localStorage.setItem(KEY, JSON.stringify(neu));
      } catch {
        /* Speicher nicht verfügbar – Auswahl bleibt für die Sitzung aktiv. */
      }
      return neu;
    });
  }, []);

  const speichere = useCallback(
    (teil: Partial<PlanEinstellungen>) => aktualisiere((alt) => ({ ...alt, ...teil })),
    [aktualisiere],
  );

  const tausche = useCallback(
    (vonId: string, zuId: string) =>
      aktualisiere((alt) => {
        const tausch = { ...alt.tausch };
        if (vonId === zuId) delete tausch[vonId];
        else tausch[vonId] = zuId;
        return { ...alt, tausch };
      }),
    [aktualisiere],
  );

  const entferneUebung = useCallback(
    (tagIndex: number, id: string) =>
      aktualisiere((alt) => {
        const key = String(tagIndex);
        const zusatz = { ...alt.zusatz };
        if ((zusatz[key] ?? []).includes(id)) {
          zusatz[key] = zusatz[key]!.filter((x) => x !== id);
          return { ...alt, zusatz };
        }
        const entfernt = { ...alt.entfernt };
        entfernt[key] = [...new Set([...(entfernt[key] ?? []), id])];
        return { ...alt, entfernt };
      }),
    [aktualisiere],
  );

  const fuegeUebungHinzu = useCallback(
    (tagIndex: number, id: string) =>
      aktualisiere((alt) => {
        const key = String(tagIndex);
        const entfernt = { ...alt.entfernt, [key]: (alt.entfernt[key] ?? []).filter((x) => x !== id) };
        const zusatz = { ...alt.zusatz, [key]: [...new Set([...(alt.zusatz[key] ?? []), id])] };
        return { ...alt, entfernt, zusatz };
      }),
    [aktualisiere],
  );

  /**
   * Verschiebt eine Übung um einen Schritt nach oben (-1) oder unten (+1).
   * `aktuelleIds` ist die aktuell sichtbare Reihenfolge des Tages.
   */
  const verschiebeUebung = useCallback(
    (tagIndex: number, id: string, richtung: -1 | 1, aktuelleIds: string[]) =>
      aktualisiere((alt) => {
        const key = String(tagIndex);
        const reihenfolge = [...aktuelleIds];
        const von = reihenfolge.indexOf(id);
        const zu = von + richtung;
        if (von < 0 || zu < 0 || zu >= reihenfolge.length) return alt;
        [reihenfolge[von], reihenfolge[zu]] = [reihenfolge[zu]!, reihenfolge[von]!];
        return { ...alt, reihenfolge: { ...alt.reihenfolge, [key]: reihenfolge } };
      }),
    [aktualisiere],
  );

  const erstelleEigene = useCallback(
    (u: LibUebung) => aktualisiere((alt) => ({ ...alt, eigene: [...(alt.eigene ?? []), u] })),
    [aktualisiere],
  );

  const loescheEigene = useCallback(
    (id: string) =>
      aktualisiere((alt) => ({
        ...alt,
        eigene: (alt.eigene ?? []).filter((x) => x.id !== id),
        zusatz: Object.fromEntries(
          Object.entries(alt.zusatz).map(([k, v]) => [k, v.filter((x) => x !== id)]),
        ),
      })),
    [aktualisiere],
  );

  /** Wochentag an-/abwählen (0 = Montag). Mindestens ein Tag bleibt aktiv. */
  const schalteTrainingstag = useCallback(
    (tag: number, aktuelleTage: number[]) =>
      aktualisiere((alt) => {
        const basis = new Set(alt.trainingstage ?? aktuelleTage);
        if (basis.has(tag)) {
          if (basis.size <= 1) return alt;
          basis.delete(tag);
        } else basis.add(tag);
        return { ...alt, trainingstage: [...basis].sort((a, b) => a - b) };
      }),
    [aktualisiere],
  );

  const setzeTrainingstage = useCallback(
    (tage: number[] | null) => aktualisiere((alt) => ({ ...alt, trainingstage: tage })),
    [aktualisiere],
  );

  const erstelleVorlage = useCallback((titel: string) => {
    let neuIndex = 100;
    aktualisiere((alt) => {
      neuIndex = Math.max(99, ...(alt.vorlagen ?? []).map((v) => v.index)) + 1;
      return { ...alt, vorlagen: [...(alt.vorlagen ?? []), { index: neuIndex, titel }] };
    });
    return neuIndex;
  }, [aktualisiere]);

  /** Übernimmt KI-Templates als eigene Vorlagen mit Vorgaben. Gibt den ersten Index zurück. */
  const uebernehmeKiPlan = useCallback(
    (templates: KiTemplateEingabe[]) => {
      let erster = 100;
      aktualisiere((alt) => {
        const start = Math.max(99, ...(alt.vorlagen ?? []).map((v) => v.index)) + 1;
        erster = start;
        const vorlagen = [...(alt.vorlagen ?? [])];
        const zusatz = { ...alt.zusatz };
        const vorgaben = { ...(alt.vorgaben ?? {}) };
        const eigene = [...(alt.eigene ?? [])];
        const idNachName = new Map<string, string>();
        for (const u of uebungsBibliothek) idNachName.set(normalisierterName(u.name), u.id);
        for (const u of eigene) idNachName.set(normalisierterName(u.name), u.id);
        const belegteIds = new Set<string>([...uebungById.keys(), ...eigene.map((u) => u.id)]);

        templates.forEach((t, i) => {
          const index = start + i;
          vorlagen.push({ index, titel: t.titel });
          const ids: string[] = [];
          const vg: Record<string, Vorgabe> = {};
          for (const u of t.uebungen) {
            let lib: LibUebung | undefined;
            let id = u.id;

            if (u.neu) {
              const key = normalisierterName(u.neu.name);
              const vorhandeneId = idNachName.get(key);
              if (vorhandeneId) {
                id = vorhandeneId;
                lib = uebungById.get(id) ?? eigene.find((x) => x.id === id);
              } else {
                id = naechsteEigeneKiId(belegteIds);
                belegteIds.add(id);
                lib = eigeneAusKiVorschlag(id, u.neu, u.wdhVon, u.wdhBis);
                eigene.push(lib);
                idNachName.set(key, id);
              }
            } else {
              lib = uebungById.get(id) ?? eigene.find((x) => x.id === id);
            }
            if (!lib || ids.includes(id)) continue;

            ids.push(id);
            vg[id] = {
              saetze: u.saetze,
              wdhVon: u.wdhVon,
              wdhBis: u.wdhBis,
              grunduebung: lib.grund,
              steigerungKg: steigerungFuerAusstattung(lib.equipment),
            };
          }
          zusatz[String(index)] = ids;
          vorgaben[String(index)] = vg;
        });
        return { ...alt, vorlagen, zusatz, vorgaben, eigene };
      });
      return erster;
    },
    [aktualisiere],
  );

  const benenneVorlage = useCallback(
    (index: number, titel: string) =>
      aktualisiere((alt) => ({ ...alt, titel: { ...alt.titel, [String(index)]: titel } })),
    [aktualisiere],
  );

  /** Löscht ein Template (eigenes oder generiertes). Generierte werden in `geloescht` vermerkt. */
  const loescheVorlage = useCallback(
    (index: number) =>
      aktualisiere((alt) => {
        const basis: PlanEinstellungen = {
          ...alt,
          vorlagen: (alt.vorlagen ?? []).filter((v) => v.index !== index),
          geloescht: index < 100 ? [...new Set([...(alt.geloescht ?? []), index])] : alt.geloescht,
          zuordnung: Object.fromEntries(Object.entries(alt.zuordnung ?? {}).filter(([, v]) => v !== index)),
          rotation: (alt.rotation ?? []).filter((i) => i !== index),
        };
        if (alt.naechster?.index === index) basis.naechster = null;
        return basis;
      }),
    [aktualisiere],
  );

  /** Stellt ein zuvor gelöschtes generiertes Template wieder her (für „Rückgängig“). */
  const stelleVorlageWiederher = useCallback(
    (index: number) =>
      aktualisiere((alt) => ({
        ...alt,
        geloescht: (alt.geloescht ?? []).filter((i) => i !== index),
      })),
    [aktualisiere],
  );

  const ordneZu = useCallback(
    (wochentag: number, index: number) =>
      aktualisiere((alt) => ({ ...alt, zuordnung: { ...alt.zuordnung, [String(wochentag)]: index } })),
    [aktualisiere],
  );

  const uebernehmeRecompVorlage = useCallback(
    () => aktualisiere((alt) => legePersoenlichenPlanAn(alt)),
    [aktualisiere],
  );

  return {
    einstellungen: state,
    uebernehmeRecompVorlage,
    speichere,
    tausche,
    entferneUebung,
    fuegeUebungHinzu,
    verschiebeUebung,
    erstelleEigene,
    loescheEigene,
    schalteTrainingstag,
    setzeTrainingstage,
    erstelleVorlage,
    uebernehmeKiPlan,
    benenneVorlage,
    loescheVorlage,
    stelleVorlageWiederher,
    ordneZu,
  };
}


export const wochentage = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export const wochentageKurz = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
