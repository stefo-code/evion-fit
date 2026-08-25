/**
 * Echter Aktivitätsspeicher (lokal, ohne Konto).
 *
 * Hier landen tatsächlich protokollierte Trainingseinheiten, Sätze, manuell
 * erfasste Körperwerte (Gewicht, Körperfett, Wasser, Muskeln, Umfänge,
 * Erholung) und daraus abgeleitete Rekorde und Erfolge. Alle Auswertungen der
 * App (Fortschritt, Erfolge, Cockpit, Coach) lesen aus diesem Speicher.
 */

import { useCallback, useEffect, useState } from "react";

export type SatzLog = {
  uebungId: string;
  name: string;
  muskel: string;
  gewicht: number;
  wdh: number;
  rpe: number;
  zeit: string;
};

export type TrainingsEinheit = {
  id: string;
  datum: string; // ISO
  titel: string;
  tagIndex: number;
  dauerMin: number;
  saetze: SatzLog[];
};

/** Eine manuell erfasste Messung. Alle Felder außer Datum sind optional. */
export type KoerperMessung = {
  datum: string; // ISO
  gewicht?: number | null;
  koerperfett?: number | null;
  wasser?: number | null;
  muskeln?: number | null;
  taille?: number | null;
  huefte?: number | null;
  brust?: number | null;
  arm?: number | null;
  oberschenkel?: number | null;
  ruhepuls?: number | null;
  hrv?: number | null;
  schlafStunden?: number | null;
  schlafQualitaet?: number | null; // 1–5
  schritte?: number | null;
  energie?: number | null; // 1–5
  muskelkater?: number | null; // 1–5
  stress?: number | null; // 1–5
};

export type MessFeld = Exclude<keyof KoerperMessung, "datum">;

export type FeldDef = {
  key: MessFeld;
  label: string;
  einheit: string;
  min: number;
  max: number;
  gruppe: "koerper" | "umfang" | "erholung" | "subjektiv";
  schritt?: number;
  hinweis?: string;
};

export const messFelder: FeldDef[] = [
  { key: "gewicht", label: "Gewicht", einheit: "kg", min: 30, max: 250, gruppe: "koerper" },
  { key: "koerperfett", label: "Körperfett", einheit: "%", min: 3, max: 60, gruppe: "koerper" },
  { key: "wasser", label: "Wasser", einheit: "%", min: 30, max: 75, gruppe: "koerper" },
  { key: "muskeln", label: "Muskeln", einheit: "%", min: 20, max: 60, gruppe: "koerper" },
  { key: "taille", label: "Taille", einheit: "cm", min: 40, max: 200, gruppe: "umfang" },
  { key: "huefte", label: "Hüfte", einheit: "cm", min: 50, max: 200, gruppe: "umfang" },
  { key: "brust", label: "Brust", einheit: "cm", min: 50, max: 200, gruppe: "umfang" },
  { key: "arm", label: "Arm", einheit: "cm", min: 15, max: 70, gruppe: "umfang" },
  { key: "oberschenkel", label: "Oberschenkel", einheit: "cm", min: 30, max: 110, gruppe: "umfang" },
  { key: "ruhepuls", label: "Ruhepuls", einheit: "bpm", min: 30, max: 120, gruppe: "erholung" },
  { key: "hrv", label: "HRV", einheit: "ms", min: 10, max: 250, gruppe: "erholung" },
  { key: "schlafStunden", label: "Schlaf", einheit: "h", min: 2, max: 14, gruppe: "erholung" },
  { key: "schritte", label: "Schritte", einheit: "/Tag", min: 0, max: 60000, gruppe: "erholung" },
  { key: "schlafQualitaet", label: "Schlafqualität", einheit: "1–5", min: 1, max: 5, gruppe: "subjektiv" },
  { key: "energie", label: "Energie", einheit: "1–5", min: 1, max: 5, gruppe: "subjektiv" },
  { key: "muskelkater", label: "Muskelkater", einheit: "1–5", min: 1, max: 5, gruppe: "subjektiv" },
  { key: "stress", label: "Stress", einheit: "1–5", min: 1, max: 5, gruppe: "subjektiv" },
];

export function feldDef(key: MessFeld): FeldDef {
  return messFelder.find((f) => f.key === key)!;
}

export type Aktivitaet = {
  version: 2;
  einheiten: TrainingsEinheit[];
  messungen: KoerperMessung[];
  erfolge: Record<string, string>; // id -> ISO-Datum des Freischaltens
};

const KEY = "evion.aktivitaet.v1";
const EVENT = "evion:aktivitaet";

export const leereAktivitaet: Aktivitaet = { version: 2, einheiten: [], messungen: [], erfolge: {} };

type AltEintrag = { datum: string; gewicht: number; taille?: number | null };

export function ladeAktivitaet(): Aktivitaet {
  if (typeof window === "undefined") return leereAktivitaet;
  try {
    const roh = window.localStorage.getItem(KEY);
    if (!roh) return leereAktivitaet;
    const daten = JSON.parse(roh) as Partial<Aktivitaet> & { gewichte?: AltEintrag[] };
    // Migration: frühere Struktur kannte nur `gewichte`.
    const migriert: KoerperMessung[] = (daten.gewichte ?? []).map((g) => ({
      datum: g.datum,
      gewicht: g.gewicht,
      taille: g.taille ?? null,
    }));
    const messungen = [...(daten.messungen ?? []), ...migriert].sort((a, b) =>
      a.datum.localeCompare(b.datum),
    );
    return { ...leereAktivitaet, ...daten, version: 2, messungen, gewichte: undefined } as Aktivitaet;
  } catch {
    return leereAktivitaet;
  }
}

function schreibe(a: Aktivitaet) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    /* Speicher nicht verfügbar – Daten bleiben für die Sitzung erhalten. */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

// ---------------------------------------------------------------------------
// Berechnungen: Training
// ---------------------------------------------------------------------------

/** Geschätztes 1RM nach Epley. */
export function e1rm(gewicht: number, wdh: number): number {
  if (gewicht <= 0 || wdh <= 0) return 0;
  return Math.round(gewicht * (1 + wdh / 30) * 10) / 10;
}

export function volumen(saetze: SatzLog[]): number {
  return Math.round(saetze.reduce((s, x) => s + x.gewicht * x.wdh, 0));
}

export type Rekord = { uebungId: string; name: string; gewicht: number; wdh: number; e1rm: number; datum: string };

export function rekorde(a: Aktivitaet): Rekord[] {
  const map = new Map<string, Rekord>();
  for (const e of a.einheiten) {
    for (const s of e.saetze) {
      const wert = e1rm(s.gewicht, s.wdh);
      const alt = map.get(s.uebungId);
      if (!alt || wert > alt.e1rm) {
        map.set(s.uebungId, {
          uebungId: s.uebungId,
          name: s.name,
          gewicht: s.gewicht,
          wdh: s.wdh,
          e1rm: wert,
          datum: e.datum,
        });
      }
    }
  }
  return [...map.values()].sort((x, y) => y.e1rm - x.e1rm);
}

/** Bestes e1RM einer Übung vor einem Zeitpunkt (für Rekord-Erkennung im Workout). */
export function bestesE1rm(a: Aktivitaet, uebungId: string): number {
  return rekorde(a).find((r) => r.uebungId === uebungId)?.e1rm ?? 0;
}

/** Letzter protokollierter Satz einer Übung (für den Startvorschlag). */
export function letzterSatz(a: Aktivitaet, uebungId: string): SatzLog | null {
  for (let i = a.einheiten.length - 1; i >= 0; i--) {
    const treffer = [...a.einheiten[i]!.saetze].reverse().find((s) => s.uebungId === uebungId);
    if (treffer) return treffer;
  }
  return null;
}

function tagKey(iso: string) {
  return iso.slice(0, 10);
}

/** Zusammenhängende Trainingsserie: Einheiten in Folge (Pausen bis 3 Tage zählen nicht als Abbruch). */
export function streak(a: Aktivitaet): number {
  const tage = [...new Set(a.einheiten.map((e) => tagKey(e.datum)))].sort().reverse();
  if (tage.length === 0) return 0;
  const heute = new Date();
  const ersterAbstand = Math.floor((heute.getTime() - new Date(tage[0]!).getTime()) / 86400000);
  if (ersterAbstand > 3) return 0;
  let serie = 1;
  for (let i = 1; i < tage.length; i++) {
    const diff = Math.round(
      (new Date(tage[i - 1]!).getTime() - new Date(tage[i]!).getTime()) / 86400000,
    );
    if (diff <= 3) serie++;
    else break;
  }
  return serie;
}

export function einheitenSeit(a: Aktivitaet, tage: number): TrainingsEinheit[] {
  const grenze = Date.now() - tage * 86400000;
  return a.einheiten.filter((e) => new Date(e.datum).getTime() >= grenze);
}

export function gesamtVolumen(a: Aktivitaet): number {
  return a.einheiten.reduce((s, e) => s + volumen(e.saetze), 0);
}

/** Volumen je Kalenderwoche (aufsteigend, maximal `wochen` Einträge). */
export function volumenProWoche(a: Aktivitaet, wochen = 8) {
  const map = new Map<string, number>();
  for (const e of a.einheiten) {
    const d = new Date(e.datum);
    const montag = new Date(d);
    montag.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = montag.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + volumen(e.saetze));
  }
  return [...map.entries()]
    .sort(([x], [y]) => x.localeCompare(y))
    .slice(-wochen)
    .map(([key, v]) => ({
      woche: new Date(key).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      volumen: v,
    }));
}

/** e1RM-Verlauf einer Übung (bester Satz je Trainingstag). */
export function e1rmVerlauf(a: Aktivitaet, uebungId: string) {
  return a.einheiten
    .filter((e) => e.saetze.some((s) => s.uebungId === uebungId))
    .map((e) => ({
      datum: new Date(e.datum).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      e1rm: Math.max(...e.saetze.filter((s) => s.uebungId === uebungId).map((s) => e1rm(s.gewicht, s.wdh))),
    }));
}

/** Belastung je Muskelgruppe in den letzten `tage` Tagen (Sätze). */
export function muskelBelastung(a: Aktivitaet, tage = 7): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of einheitenSeit(a, tage)) {
    for (const s of e.saetze) out[s.muskel] = (out[s.muskel] ?? 0) + 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Berechnungen: Körperwerte
// ---------------------------------------------------------------------------

function zahl(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Letzter erfasster Wert eines Feldes (inkl. Datum). */
export function letzterWert(a: Aktivitaet, feld: MessFeld): { wert: number; datum: string } | null {
  for (let i = a.messungen.length - 1; i >= 0; i--) {
    const w = zahl(a.messungen[i]![feld]);
    if (w !== null) return { wert: w, datum: a.messungen[i]!.datum };
  }
  return null;
}

export function ersterWert(a: Aktivitaet, feld: MessFeld): { wert: number; datum: string } | null {
  for (const m of a.messungen) {
    const w = zahl(m[feld]);
    if (w !== null) return { wert: w, datum: m.datum };
  }
  return null;
}

export function letzteMessung(a: Aktivitaet): KoerperMessung | null {
  return a.messungen[a.messungen.length - 1] ?? null;
}

/** Tage seit der letzten Messung (null = noch nie gemessen). */
export function tageSeitMessung(a: Aktivitaet): number | null {
  const m = letzteMessung(a);
  if (!m) return null;
  return Math.floor((Date.now() - new Date(m.datum).getTime()) / 86400000);
}

/** Verlauf eines Feldes inkl. geglättetem 7-Tage-Mittel. */
export function verlauf(a: Aktivitaet, feld: MessFeld, tage = 90) {
  const grenze = Date.now() - tage * 86400000;
  const punkte = a.messungen
    .filter((m) => new Date(m.datum).getTime() >= grenze && zahl(m[feld]) !== null)
    .map((m) => ({ zeit: new Date(m.datum).getTime(), wert: zahl(m[feld])! }));

  return punkte.map((p, idx) => {
    const fenster = punkte.filter((q) => q.zeit <= p.zeit && q.zeit >= p.zeit - 6 * 86400000);
    const trend = fenster.reduce((s, q) => s + q.wert, 0) / (fenster.length || 1);
    return {
      datum: new Date(p.zeit).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      wert: p.wert,
      trend: Math.round(trend * 10) / 10,
      index: idx,
    };
  });
}

/** Veränderung eines Feldes über die letzten `tage` Tage. */
export function veraenderung(a: Aktivitaet, feld: MessFeld, tage: number): number | null {
  const grenze = Date.now() - tage * 86400000;
  const relevant = a.messungen.filter((m) => zahl(m[feld]) !== null);
  const spaeter = relevant.filter((m) => new Date(m.datum).getTime() >= grenze);
  const letzter = relevant[relevant.length - 1];
  const start = spaeter[0] ?? relevant[0];
  if (!letzter || !start || letzter === start) return null;
  return Math.round((zahl(letzter[feld])! - zahl(start[feld])!) * 10) / 10;
}

export type Koerperkennzahlen = {
  gewicht: number | null;
  koerperfett: number | null;
  wasser: number | null;
  muskeln: number | null;
  fettmasse: number | null;
  magermasse: number | null;
  bmi: number | null;
  datum: string | null;
};

/** Abgeleitete Kennzahlen aus der jüngsten Messung. */
export function koerperKennzahlen(a: Aktivitaet, groesseCm?: number | null): Koerperkennzahlen {
  const g = letzterWert(a, "gewicht");
  const kf = letzterWert(a, "koerperfett");
  const wa = letzterWert(a, "wasser");
  const mu = letzterWert(a, "muskeln");
  const gewicht = g?.wert ?? null;
  const fettmasse = gewicht !== null && kf ? Math.round(gewicht * (kf.wert / 100) * 10) / 10 : null;
  const magermasse = gewicht !== null && fettmasse !== null ? Math.round((gewicht - fettmasse) * 10) / 10 : null;
  const bmi =
    gewicht !== null && groesseCm
      ? Math.round((gewicht / Math.pow(groesseCm / 100, 2)) * 10) / 10
      : null;
  return {
    gewicht,
    koerperfett: kf?.wert ?? null,
    wasser: wa?.wert ?? null,
    muskeln: mu?.wert ?? null,
    fettmasse,
    magermasse,
    bmi,
    datum: g?.datum ?? letzteMessung(a)?.datum ?? null,
  };
}

/** Fett- und Magermasse-Verlauf (nur Tage mit Gewicht UND Körperfett). */
export function kompositionsVerlauf(a: Aktivitaet, tage = 180) {
  const grenze = Date.now() - tage * 86400000;
  return a.messungen
    .filter(
      (m) =>
        new Date(m.datum).getTime() >= grenze && zahl(m.gewicht) !== null && zahl(m.koerperfett) !== null,
    )
    .map((m) => {
      const fett = Math.round(zahl(m.gewicht)! * (zahl(m.koerperfett)! / 100) * 10) / 10;
      return {
        datum: new Date(m.datum).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
        fettmasse: fett,
        magermasse: Math.round((zahl(m.gewicht)! - fett) * 10) / 10,
      };
    });
}

/** Erkennt Body Recomposition: Fettmasse runter bei gehaltener/gestiegener Magermasse. */
export function recompSignal(a: Aktivitaet): { fett: number; mager: number; positiv: boolean } | null {
  const punkte = kompositionsVerlauf(a, 3650);
  if (punkte.length < 2) return null;
  const start = punkte[0]!;
  const ende = punkte[punkte.length - 1]!;
  const fett = Math.round((ende.fettmasse - start.fettmasse) * 10) / 10;
  const mager = Math.round((ende.magermasse - start.magermasse) * 10) / 10;
  return { fett, mager, positiv: fett < -0.3 && mager >= -0.3 };
}

/**
 * Readiness aus manuell erfassten Erholungswerten (0–100).
 * Bewusst einfach und transparent – keine medizinische Bewertung.
 */
export function readinessAusMessungen(
  a: Aktivitaet,
): { score: number; gruende: string[]; basis: KoerperMessung } | null {
  const grenze = Date.now() - 2 * 86400000;
  const m = [...a.messungen].reverse().find((x) => new Date(x.datum).getTime() >= grenze);
  if (!m) return null;

  const relevant = [m.schlafStunden, m.schlafQualitaet, m.energie, m.muskelkater, m.stress, m.ruhepuls, m.hrv];
  if (relevant.every((v) => zahl(v) === null)) return null;

  let score = 70;
  const gruende: string[] = [];

  const schlaf = zahl(m.schlafStunden);
  if (schlaf !== null) {
    const d = Math.round((schlaf - 7.5) * 8);
    score += Math.max(-20, Math.min(12, d));
    gruende.push(`Schlaf ${schlaf.toLocaleString("de-DE")} h`);
  }
  const sq = zahl(m.schlafQualitaet);
  if (sq !== null) {
    score += (sq - 3) * 5;
    gruende.push(`Schlafqualität ${sq}/5`);
  }
  const energie = zahl(m.energie);
  if (energie !== null) {
    score += (energie - 3) * 6;
    gruende.push(`Energie ${energie}/5`);
  }
  const kater = zahl(m.muskelkater);
  if (kater !== null) {
    score -= (kater - 2) * 6;
    gruende.push(`Muskelkater ${kater}/5`);
  }
  const stress = zahl(m.stress);
  if (stress !== null) {
    score -= (stress - 2) * 5;
    gruende.push(`Stress ${stress}/5`);
  }

  // Ruhepuls und HRV relativ zum eigenen Mittel der letzten 30 Tage
  const puls = zahl(m.ruhepuls);
  const pulsSchnitt = mittel(a, "ruhepuls", 30);
  if (puls !== null && pulsSchnitt !== null) {
    score -= Math.max(-8, Math.min(12, Math.round((puls - pulsSchnitt) * 1.5)));
    gruende.push(`Ruhepuls ${puls} bpm (Ø ${Math.round(pulsSchnitt)})`);
  }
  const hrv = zahl(m.hrv);
  const hrvSchnitt = mittel(a, "hrv", 30);
  if (hrv !== null && hrvSchnitt !== null && hrvSchnitt > 0) {
    score += Math.max(-10, Math.min(10, Math.round(((hrv - hrvSchnitt) / hrvSchnitt) * 25)));
    gruende.push(`HRV ${hrv} ms (Ø ${Math.round(hrvSchnitt)})`);
  }

  return { score: Math.max(5, Math.min(100, Math.round(score))), gruende, basis: m };
}

/** Mittelwert eines Feldes über die letzten `tage` Tage. */
export function mittel(a: Aktivitaet, feld: MessFeld, tage: number): number | null {
  const grenze = Date.now() - tage * 86400000;
  const werte = a.messungen
    .filter((m) => new Date(m.datum).getTime() >= grenze)
    .map((m) => zahl(m[feld]))
    .filter((v): v is number => v !== null);
  if (werte.length === 0) return null;
  return werte.reduce((s, v) => s + v, 0) / werte.length;
}

/** Anzahl Wochen in Folge mit mindestens einer Messung. */
export function messSerieWochen(a: Aktivitaet): number {
  const wochen = new Set(
    a.messungen.map((m) => {
      const d = new Date(m.datum);
      const montag = new Date(d);
      montag.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return montag.toISOString().slice(0, 10);
    }),
  );
  if (wochen.size === 0) return 0;
  const jetzt = new Date();
  const montagJetzt = new Date(jetzt);
  montagJetzt.setDate(jetzt.getDate() - ((jetzt.getDay() + 6) % 7));

  let serie = 0;
  for (let i = 0; i < 200; i++) {
    const w = new Date(montagJetzt);
    w.setDate(montagJetzt.getDate() - i * 7);
    if (wochen.has(w.toISOString().slice(0, 10))) serie++;
    else if (i > 0) break;
  }
  return serie;
}

// ---------------------------------------------------------------------------
// Erfolge
// ---------------------------------------------------------------------------

export type ErfolgDef = {
  id: string;
  titel: string;
  beschreibung: string;
  ziel: number;
  wert: (a: Aktivitaet) => number;
};

export const erfolgsDefinitionen: ErfolgDef[] = [
  {
    id: "erste-einheit",
    titel: "Erster Durchgang",
    beschreibung: "Erste Trainingseinheit vollständig protokolliert.",
    ziel: 1,
    wert: (a) => a.einheiten.length,
  },
  {
    id: "fuenf-einheiten",
    titel: "Routine startet",
    beschreibung: "5 Trainingseinheiten abgeschlossen.",
    ziel: 5,
    wert: (a) => a.einheiten.length,
  },
  {
    id: "zwanzig-einheiten",
    titel: "Gewohnheit",
    beschreibung: "20 Trainingseinheiten abgeschlossen.",
    ziel: 20,
    wert: (a) => a.einheiten.length,
  },
  {
    id: "hundert-saetze",
    titel: "100 Sätze",
    beschreibung: "100 protokollierte Arbeitssätze.",
    ziel: 100,
    wert: (a) => a.einheiten.reduce((s, e) => s + e.saetze.length, 0),
  },
  {
    id: "volumen-50t",
    titel: "50 Tonnen bewegt",
    beschreibung: "50.000 kg Gesamtvolumen erreicht.",
    ziel: 50000,
    wert: (a) => gesamtVolumen(a),
  },
  {
    id: "streak-3",
    titel: "Dranbleiber",
    beschreibung: "3 Trainingseinheiten ohne längere Pause.",
    ziel: 3,
    wert: (a) => streak(a),
  },
  {
    id: "streak-8",
    titel: "Unaufhaltsam",
    beschreibung: "8 Einheiten in Serie ohne längere Pause.",
    ziel: 8,
    wert: (a) => streak(a),
  },
  {
    id: "erster-rekord",
    titel: "Erster Rekord",
    beschreibung: "Eine Übung mit persönlicher Bestleistung abgeschlossen.",
    ziel: 1,
    wert: (a) => rekorde(a).length,
  },
  {
    id: "erste-messung",
    titel: "Startpunkt gesetzt",
    beschreibung: "Erste Körpermessung eingetragen.",
    ziel: 1,
    wert: (a) => a.messungen.length,
  },
  {
    id: "messung-7",
    titel: "Verlässliche Daten",
    beschreibung: "7 Körpermessungen erfasst.",
    ziel: 7,
    wert: (a) => a.messungen.length,
  },
  {
    id: "messung-30",
    titel: "Datensammler",
    beschreibung: "30 Körpermessungen erfasst.",
    ziel: 30,
    wert: (a) => a.messungen.length,
  },
  {
    id: "mess-serie-4",
    titel: "Vier Wochen dran",
    beschreibung: "4 Wochen in Folge mindestens einmal gemessen.",
    ziel: 4,
    wert: (a) => messSerieWochen(a),
  },
  {
    id: "kfa-minus-1",
    titel: "Erstes Prozent",
    beschreibung: "Körperfettanteil um 1 Prozentpunkt gesenkt.",
    ziel: 1,
    wert: (a) => {
      const start = ersterWert(a, "koerperfett");
      const jetzt = letzterWert(a, "koerperfett");
      if (!start || !jetzt) return 0;
      return Math.max(0, Math.round((start.wert - jetzt.wert) * 10) / 10);
    },
  },
  {
    id: "recomp",
    titel: "Body Recomposition",
    beschreibung: "Fettmasse gesenkt und Magermasse gehalten.",
    ziel: 1,
    wert: (a) => (recompSignal(a)?.positiv ? 1 : 0),
  },
  {
    id: "erholung-7",
    titel: "Erholung im Blick",
    beschreibung: "7-mal Schlaf-, Puls- oder Befindenswerte eingetragen.",
    ziel: 7,
    wert: (a) =>
      a.messungen.filter(
        (m) =>
          zahl(m.schlafStunden) !== null ||
          zahl(m.ruhepuls) !== null ||
          zahl(m.hrv) !== null ||
          zahl(m.energie) !== null,
      ).length,
  },
];

export type ErfolgStatus = ErfolgDef & { aktuell: number; erreicht: boolean; datum?: string | undefined };

export function erfolgsStatus(a: Aktivitaet): ErfolgStatus[] {
  return erfolgsDefinitionen.map((d) => {
    const aktuell = d.wert(a);
    return { ...d, aktuell, erreicht: aktuell >= d.ziel, datum: a.erfolge[d.id] };
  });
}

/** Schaltet neu erreichte Erfolge frei und gibt sie zurück. */
function pruefeErfolge(a: Aktivitaet): { aktivitaet: Aktivitaet; neu: ErfolgStatus[] } {
  const neu: ErfolgStatus[] = [];
  const erfolge = { ...a.erfolge };
  for (const s of erfolgsStatus(a)) {
    if (s.erreicht && !erfolge[s.id]) {
      erfolge[s.id] = new Date().toISOString();
      neu.push(s);
    }
  }
  return { aktivitaet: { ...a, erfolge }, neu };
}

// ---------------------------------------------------------------------------
// Schreiboperationen
// ---------------------------------------------------------------------------

export type SessionErgebnis = {
  einheit: TrainingsEinheit;
  volumen: number;
  rekorde: Rekord[];
  neueErfolge: ErfolgStatus[];
};

export function speichereEinheit(einheit: Omit<TrainingsEinheit, "id">): SessionErgebnis {
  const alt = ladeAktivitaet();
  const vorher = new Map(rekorde(alt).map((r) => [r.uebungId, r.e1rm]));
  const neueEinheit: TrainingsEinheit = { ...einheit, id: `s-${Date.now()}` };
  const mitEinheit: Aktivitaet = { ...alt, einheiten: [...alt.einheiten, neueEinheit] };
  const { aktivitaet, neu } = pruefeErfolge(mitEinheit);
  schreibe(aktivitaet);

  const neueRekorde = rekorde(aktivitaet).filter(
    (r) =>
      neueEinheit.saetze.some((s) => s.uebungId === r.uebungId) && r.e1rm > (vorher.get(r.uebungId) ?? 0),
  );

  return {
    einheit: neueEinheit,
    volumen: volumen(neueEinheit.saetze),
    rekorde: neueRekorde,
    neueErfolge: neu,
  };
}

/**
 * Speichert eine Messung. Pro Tag existiert genau ein Eintrag – ein zweiter
 * Eintrag am selben Tag ergänzt bzw. überschreibt die angegebenen Felder.
 */
export function speichereMessung(messung: KoerperMessung): ErfolgStatus[] {
  const alt = ladeAktivitaet();
  const tag = messung.datum.slice(0, 10);
  const vorhanden = alt.messungen.find((m) => m.datum.slice(0, 10) === tag);
  const zusammengefuehrt: KoerperMessung = { ...(vorhanden ?? {}), ...messung, datum: messung.datum };
  const messungen = [...alt.messungen.filter((m) => m.datum.slice(0, 10) !== tag), zusammengefuehrt].sort(
    (x, y) => x.datum.localeCompare(y.datum),
  );
  const { aktivitaet, neu } = pruefeErfolge({ ...alt, messungen });
  schreibe(aktivitaet);
  return neu;
}

export function loescheMessung(datum: string) {
  const alt = ladeAktivitaet();
  const tag = datum.slice(0, 10);
  schreibe({ ...alt, messungen: alt.messungen.filter((m) => m.datum.slice(0, 10) !== tag) });
}

export function loescheAktivitaet() {
  schreibe(leereAktivitaet);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAktivitaet() {
  const [aktivitaet, setAktivitaet] = useState<Aktivitaet>(leereAktivitaet);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    setAktivitaet(ladeAktivitaet());
    setGeladen(true);
    const sync = () => setAktivitaet(ladeAktivitaet());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const messungSpeichern = useCallback((m: KoerperMessung) => speichereMessung(m), []);
  const messungLoeschen = useCallback((datum: string) => loescheMessung(datum), []);

  return {
    aktivitaet,
    geladen,
    messungSpeichern,
    messungLoeschen,
    hatDaten: aktivitaet.einheiten.length > 0 || aktivitaet.messungen.length > 0,
  };
}
