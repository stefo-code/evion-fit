/**
 * Echter Aktivitätsspeicher (lokal, ohne Konto).
 *
 * Hier landen tatsächlich protokollierte Trainingseinheiten, Sätze, Körper-
 * gewichte und daraus abgeleitete Rekorde und Erfolge. Alle Auswertungen der
 * App (Fortschritt, Erfolge, Cockpit) lesen aus diesem Speicher – nicht mehr
 * aus den Demo-Daten.
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

export type GewichtsEintrag = {
  datum: string; // ISO
  gewicht: number;
  taille?: number | null;
};

export type Aktivitaet = {
  version: 1;
  einheiten: TrainingsEinheit[];
  gewichte: GewichtsEintrag[];
  erfolge: Record<string, string>; // id -> ISO-Datum des Freischaltens
};

const KEY = "evion.aktivitaet.v1";
const EVENT = "evion:aktivitaet";

export const leereAktivitaet: Aktivitaet = { version: 1, einheiten: [], gewichte: [], erfolge: {} };

export function ladeAktivitaet(): Aktivitaet {
  if (typeof window === "undefined") return leereAktivitaet;
  try {
    const roh = window.localStorage.getItem(KEY);
    if (!roh) return leereAktivitaet;
    return { ...leereAktivitaet, ...(JSON.parse(roh) as Partial<Aktivitaet>) };
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
// Berechnungen
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

/** Zusammenhängende Trainingswochen-Serie: Tage mit Training in Folge (Ruhetage zählen bis 2 Tage nicht als Abbruch). */
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
    id: "gewicht-7",
    titel: "Verlässliche Daten",
    beschreibung: "7 Körpergewichts-Messungen erfasst.",
    ziel: 7,
    wert: (a) => a.gewichte.length,
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

export function speichereEinheit(
  einheit: Omit<TrainingsEinheit, "id">,
): SessionErgebnis {
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

export function speichereGewicht(gewicht: number, taille?: number | null) {
  const alt = ladeAktivitaet();
  const heute = new Date().toISOString().slice(0, 10);
  const ohneHeute = alt.gewichte.filter((g) => g.datum.slice(0, 10) !== heute);
  const gewichte = [...ohneHeute, { datum: new Date().toISOString(), gewicht, taille: taille ?? null }].sort(
    (x, y) => x.datum.localeCompare(y.datum),
  );
  const { aktivitaet, neu } = pruefeErfolge({ ...alt, gewichte });
  schreibe(aktivitaet);
  return neu;
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

  const gewichtLoggen = useCallback((kg: number, taille?: number | null) => speichereGewicht(kg, taille), []);

  return { aktivitaet, geladen, gewichtLoggen, hatDaten: aktivitaet.einheiten.length > 0 };
}
