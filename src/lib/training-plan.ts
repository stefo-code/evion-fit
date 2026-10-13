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

/**
 * Fokus-spezifische Wochenvorlagen.
 *
 * Jede Vorlage ist eine Liste von Einheiten mit Bewegungsmustern in der
 * Reihenfolge ihrer Priorität. Die Muster des Fokus stehen bewusst vorne,
 * damit sie bei knappem Zeitbudget nicht herausfallen.
 */
const fokusVorlagen: Record<Exclude<Fokus, "ausgewogen" | "maximalkraft">, Session[]> = {
  muskelaufbau: [
    { titel: "Oberkörper – Drücken", muster: ["druecken", "druecken", "schulter", "arme", "core"] },
    { titel: "Unterkörper – Kniebeuge", muster: ["kniebeuge", "kniebeuge", "huefte", "core"] },
    { titel: "Oberkörper – Ziehen", muster: ["ziehen", "ziehen", "schulter", "arme", "core"] },
    { titel: "Unterkörper – Hüfte", muster: ["huefte", "huefte", "kniebeuge", "core"] },
    { titel: "Oberkörper gemischt", muster: ["druecken", "ziehen", "schulter", "arme", "arme"] },
    { titel: "Schwachstellen & Rumpf", muster: ["huefte", "arme", "schulter", "core", "kniebeuge"] },
  ],
  fettverbrennung: [
    { titel: "Ganzkörper-Zirkel A", muster: ["kniebeuge", "druecken", "ziehen", "kondition", "core"] },
    { titel: "Ganzkörper-Zirkel B", muster: ["huefte", "ziehen", "schulter", "kondition", "core"] },
    { titel: "Kraft & Intervalle", muster: ["kniebeuge", "kondition", "druecken", "kondition", "core"] },
    { titel: "Ganzkörper-Zirkel C", muster: ["huefte", "druecken", "ziehen", "kondition", "core"] },
    { titel: "Metabolik & Rumpf", muster: ["kondition", "kniebeuge", "core", "kondition", "arme"] },
    { titel: "Oberkörper & Kondition", muster: ["ziehen", "druecken", "schulter", "kondition", "core"] },
  ],
  ausdauer: [
    { titel: "Grundlagenausdauer", muster: ["kondition", "kondition", "core", "huefte"] },
    { titel: "Intervalle & Kraft", muster: ["kondition", "kniebeuge", "ziehen", "kondition"] },
    { titel: "Herz-Kreislauf lang", muster: ["kondition", "kondition", "core", "mobility"] },
    { titel: "Kraftausdauer Ganzkörper", muster: ["kniebeuge", "druecken", "ziehen", "kondition", "core"] },
    { titel: "Intervalle intensiv", muster: ["kondition", "kondition", "kondition", "core"] },
    { titel: "Locker & Mobilität", muster: ["kondition", "mobility", "core", "huefte"] },
  ],
  "arme-straffen": [

    { titel: "Arme & Drücken", muster: ["arme", "schulter", "arme", "druecken", "core"] },
    { titel: "Arme & Ziehen", muster: ["arme", "ziehen", "arme", "schulter", "core"] },
    { titel: "Schultern & Arme", muster: ["schulter", "arme", "arme", "schulter", "core"] },
    { titel: "Arme & Oberkörper", muster: ["arme", "arme", "druecken", "ziehen", "schulter"] },
    { titel: "Beine & Rumpf (Ausgleich)", muster: ["kniebeuge", "huefte", "core", "arme", "schulter"] },
    { titel: "Arme intensiv", muster: ["arme", "arme", "schulter", "arme", "core"] },
  ],
  "bauch-weg": [
    { titel: "Rumpf & Ganzkörper A", muster: ["core", "core", "kniebeuge", "druecken", "core"] },
    { titel: "Rumpf & Ganzkörper B", muster: ["core", "core", "huefte", "ziehen", "core"] },
    { titel: "Bauch intensiv", muster: ["core", "core", "core", "kniebeuge", "ziehen"] },
    { titel: "Rumpf & Oberkörper", muster: ["core", "core", "druecken", "ziehen", "schulter"] },
    { titel: "Rumpf & Unterkörper", muster: ["core", "core", "huefte", "kniebeuge", "core"] },
    { titel: "Bauch & Stoffwechsel", muster: ["core", "core", "kniebeuge", "huefte", "core"] },
  ],
  "gesaess-beine": [
    { titel: "Gesäß – Hüftstreckung", muster: ["huefte", "huefte", "huefte", "kniebeuge", "core"] },
    { titel: "Beine – Kniebeuge", muster: ["kniebeuge", "kniebeuge", "huefte", "kniebeuge", "core"] },
    { titel: "Gesäß & Rumpf", muster: ["huefte", "huefte", "kniebeuge", "core", "core"] },
    { titel: "Beine & Gesäß gemischt", muster: ["kniebeuge", "huefte", "kniebeuge", "huefte", "core"] },
    { titel: "Oberkörper (Ausgleich)", muster: ["ziehen", "druecken", "schulter", "huefte", "core"] },
    { titel: "Gesäß-Feinschliff", muster: ["huefte", "huefte", "kniebeuge", "core", "huefte"] },
  ],
  "ruecken-schonend": [
    { titel: "Oberkörper geführt", muster: ["druecken", "ziehen", "schulter", "arme", "core"] },
    { titel: "Beine geführt", muster: ["kniebeuge", "huefte", "kniebeuge", "core", "mobility"] },
    { titel: "Rücken & Haltung", muster: ["ziehen", "ziehen", "core", "mobility", "arme"] },
    { titel: "Ganzkörper schonend", muster: ["huefte", "druecken", "ziehen", "kniebeuge", "core"] },
    { titel: "Rumpf & Mobilität", muster: ["core", "mobility", "ziehen", "huefte", "core"] },
    { titel: "Oberkörper & Arme", muster: ["druecken", "ziehen", "arme", "schulter", "core"] },
  ],
  rueckbildung: [
    { titel: "Beckenboden & Rumpf", muster: ["mobility", "core", "huefte", "mobility"] },
    { titel: "Ganzkörper sanft", muster: ["mobility", "kniebeuge", "ziehen", "core"] },
    { titel: "Kraft & Haltung", muster: ["huefte", "ziehen", "schulter", "mobility"] },
    { titel: "Aufbau Ganzkörper", muster: ["kniebeuge", "druecken", "ziehen", "core"] },
  ],
};

function wochenVorlage(k: PlanKontext): Session[] {
  const tage = Math.max(2, Math.min(6, k.tage || 3));

  const vorlage = fokusVorlagen[k.fokus as keyof typeof fokusVorlagen];
  if (vorlage) {
    return Array.from({ length: Math.min(tage, 6) }, (_, i) => vorlage[i % vorlage.length]!).map(
      (s, i) => ({ ...s, titel: i < vorlage.length ? s.titel : `${s.titel} II` }),
    );
  }

  /** Echtes Ganzkörpertraining: jede Einheit deckt Beine, Hüfte, Drücken, Ziehen und Rumpf ab. */
  const ganzkoerper = (n: number): Session[] =>
    Array.from({ length: n }, (_, i) => ({
      titel: `Ganzkörper ${String.fromCharCode(65 + i)}`,
      muster:
        i % 2 === 0
          ? (["kniebeuge", "druecken", "ziehen", "huefte", "core"] as Muster[])
          : (["huefte", "ziehen", "druecken", "kniebeuge", "core"] as Muster[]),
    }));

  if (tage <= 3) return ganzkoerper(tage);

  if (tage === 4) {
    return [
      { titel: "Oberkörper – Drücken", muster: ["druecken", "schulter", "arme", "core"] },
      { titel: "Unterkörper – Kniebeuge", muster: ["kniebeuge", "huefte", "core"] },
      { titel: "Oberkörper – Ziehen", muster: ["ziehen", "ziehen", "arme", "core"] },
      { titel: "Unterkörper – Hüfte", muster: ["huefte", "kniebeuge", "core"] },
    ];
  }

  const split: Session[] = [
    { titel: "Push", muster: ["druecken", "schulter", "arme"] },
    { titel: "Pull", muster: ["ziehen", "ziehen", "arme"] },
    { titel: "Beine", muster: ["kniebeuge", "huefte", "core"] },
    { titel: "Oberkörper", muster: ["druecken", "ziehen", "schulter"] },
    { titel: "Unterkörper & Rumpf", muster: ["huefte", "kniebeuge", "core"] },
    { titel: "Schwachstellen", muster: ["arme", "schulter", "core"] },
  ];
  return split.slice(0, tage);
}

/** Zusätzliche Muster, die ohne Fokus-Vorlage eingestreut werden. */
function fokusMuster(fokus: Fokus): Muster[] {
  return fokus in fokusVorlagen ? [] : ["core"];
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
  if ((k.alter ?? 35) >= 55 && u.rueckenschonend) teile.push("gelenk- und rückenfreundlich");
  if (k.geschlecht === "weiblich" && (u.muskel === "Gesäß" || u.muster === "huefte"))
    teile.push("starker Gesäß-Reiz");
  if (teile.length === 0) teile.push("deckt das geplante Bewegungsmuster ab");
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
export function erzeugePlan(kontext: PlanKontext): Trainingstag[] {
  // Rückbildung ist nur nach einer Schwangerschaft sinnvoll.
  const k: PlanKontext =
    kontext.fokus === "rueckbildung" && kontext.geschlecht === "maennlich"
      ? { ...kontext, fokus: "ausgewogen" }
      : kontext;
  const vorlage = wochenVorlage(k);
  const extra = fokusMuster(k.fokus);


  return vorlage.map((s, i) => {
    const benutzt = new Set<string>();
    // Fokus-Muster direkt nach der ersten Grundübung einfügen, damit sie nicht
    // durch das Zeitbudget herausfallen.
    const musterListe = [s.muster[0]!, ...extra, ...s.muster.slice(1)];
    const maxUebungen = k.dauer <= 20 ? 3 : k.dauer <= 30 ? 4 : k.dauer <= 45 ? 5 : 6;

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
  const eigene: Trainingstag[] = (e.vorlagen ?? []).map((v) => ({ index: v.index, titel: v.titel, uebungen: [] }));
  return wendeAnpassungenAn(
    wendeTauschAn([...erzeugePlan(kontext), ...eigene], e.tausch, kontext),
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
];

type Zeile = [id: string, saetze: number, von: number, bis: number, grund: boolean, hinweis?: string];

const PERSOENLICH_TEMPLATES: { titel: string; booster: boolean; uebungen: Zeile[] }[] = [
  {
    titel: "Oberkörper A",
    booster: true,
    uebungen: [
      ["eigen-p-schraegbank-kh", 3, 6, 8, true],
      ["eigen-p-rudern-brust", 3, 6, 8, true],
      ["eigen-p-latzug-eng", 3, 8, 10, true],
      ["brustpresse", 2, 8, 10, true],
      ["eigen-p-seitheben-ma", 3, 12, 15, false],
      ["eigen-p-bayesian", 2, 10, 12, false],
      ["eigen-p-overhead-trizeps", 2, 10, 12, false],
      ["beinpresse", 3, 10, 12, true],
    ],
  },
  {
    titel: "Push",
    booster: true,
    uebungen: [
      ["bank-kh", 3, 8, 10, true, "Neutraler Griff – Handflächen zeigen zueinander."],
      ["eigen-p-schraeg-presse", 3, 8, 12, true],
      ["fliegende", 2, 12, 15, false],
      ["seitheben", 4, 12, 20, false],
      ["eigen-p-overhead-trizeps", 3, 10, 12, false],
      ["trizeps-kabel", 2, 12, 15, false, "Mit Seil – unten die Enden auseinanderziehen."],
    ],
  },
  {
    titel: "Pull",
    booster: true,
    uebungen: [
      ["latzug", 3, 8, 10, true, "Breiter Griff, Brust heben, Ellbogen nach unten-hinten."],
      ["rudern-kabel", 3, 8, 10, true],
      ["eigen-p-pullover", 2, 12, 15, false],
      ["eigen-p-reverse-flys", 3, 12, 15, false],
      ["eigen-p-bayesian", 3, 10, 12, false],
      ["hammer", 2, 10, 12, false],
      ["rdl-kh", 3, 8, 10, true],
    ],
  },
  {
    titel: "Oberkörper B",
    booster: false,
    uebungen: [
      ["brustpresse", 3, 8, 10, true],
      ["eigen-p-latzug-eng", 3, 8, 10, true],
      ["eigen-p-seitheben-ma", 4, 12, 15, false],
      ["facepull", 3, 15, 15, false],
      ["eigen-p-bayesian", 3, 10, 12, false],
      ["trizeps-kabel", 3, 12, 15, false, "Mit Seil – unten die Enden auseinanderziehen."],
    ],
  },
];

function steigerungFuer(id: string): number {
  if (id === "beinpresse" || id === "rdl-kh" || id === "kreuzheben") return 5;
  const u = uebungById.get(id) ?? PERSOENLICH_EIGENE.find((x) => x.id === id);
  if (!u) return 2.5;
  const nurKh = u.equipment.includes("kurzhantel") && !u.equipment.some((x) => x === "kabel" || x === "maschine");
  return nurKh ? 2 : 2.5;
}

/** Legt den persönlichen Plan als 4 Templates mit Rotation an (einmalig). */
export function legePersoenlichenPlanAn(alt: PlanEinstellungen): PlanEinstellungen {
  if (alt.persoenlichV1) return alt;
  const start = Math.max(99, ...(alt.vorlagen ?? []).map((v) => v.index)) + 1;
  const vorlagen = [...(alt.vorlagen ?? [])];
  const zusatz = { ...alt.zusatz };
  const vorgaben = { ...(alt.vorgaben ?? {}) };
  const rotation: number[] = [];
  const ohneBooster = [...(alt.ohneBooster ?? [])];
  PERSOENLICH_TEMPLATES.forEach((t, i) => {
    const index = start + i;
    vorlagen.push({ index, titel: t.titel });
    zusatz[String(index)] = t.uebungen.map((z) => z[0]);
    vorgaben[String(index)] = Object.fromEntries(
      t.uebungen.map(([id, saetze, wdhVon, wdhBis, grunduebung, hinweis]) => [
        id,
        { saetze, wdhVon, wdhBis, grunduebung, steigerungKg: steigerungFuer(id), ...(hinweis ? { hinweis } : {}) },
      ]),
    );
    rotation.push(index);
    if (!t.booster) ohneBooster.push(index);
  });
  const vorhanden = new Set((alt.eigene ?? []).map((u) => u.id));
  return {
    ...alt,
    vorlagen,
    zusatz,
    vorgaben,
    rotation,
    ohneBooster,
    naechster: null,
    eigene: [...(alt.eigene ?? []), ...PERSOENLICH_EIGENE.filter((u) => !vorhanden.has(u.id))],
    persoenlichV1: true,
  };
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
    return roh ? { ...leer, ...(JSON.parse(roh) as Partial<PlanEinstellungen>) } : leer;
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
    (templates: { titel: string; uebungen: { id: string; saetze: number; wdhVon: number; wdhBis: number }[] }[]) => {
      let erster = 100;
      aktualisiere((alt) => {
        const start = Math.max(99, ...(alt.vorlagen ?? []).map((v) => v.index)) + 1;
        erster = start;
        const vorlagen = [...(alt.vorlagen ?? [])];
        const zusatz = { ...alt.zusatz };
        const vorgaben = { ...(alt.vorgaben ?? {}) };
        templates.forEach((t, i) => {
          const index = start + i;
          vorlagen.push({ index, titel: t.titel });
          zusatz[String(index)] = t.uebungen.map((u) => u.id);
          vorgaben[String(index)] = Object.fromEntries(
            t.uebungen.map((u) => {
              const lib = uebungById.get(u.id) ?? (alt.eigene ?? []).find((x) => x.id === u.id);
              return [u.id, { saetze: u.saetze, wdhVon: u.wdhVon, wdhBis: u.wdhBis, grunduebung: lib?.grund ?? false, steigerungKg: steigerungFuer(u.id) }];
            }),
          );
        });
        return { ...alt, vorlagen, zusatz, vorgaben };
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

  const loescheVorlage = useCallback(
    (index: number) =>
      aktualisiere((alt) => ({
        ...alt,
        vorlagen: (alt.vorlagen ?? []).filter((v) => v.index !== index),
        zuordnung: Object.fromEntries(Object.entries(alt.zuordnung ?? {}).filter(([, v]) => v !== index)),
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
    ordneZu,
  };
}


export const wochentage = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export const wochentageKurz = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
