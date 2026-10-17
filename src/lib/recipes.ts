/**
 * Rezeptdatenbank und Vorschlagslogik.
 *
 * Rezepte werden nach offenen Kalorien/Protein der verbleibenden Mahlzeiten,
 * Tageszeit, Training, Allergien/Abneigungen, Lieblingsgerichten und
 * Abwechslung (zuletzt gekocht/angesehen) bewertet. Siehe TEIL 6 im Spec.
 */

import {
  rezepteDatenbank,
  zielEignungAusMakros,
  type Allergen,
  type Kueche,
  type MahlzeitTyp,
  type Rezept,
  type ZielEignung,
  type Zutat,
} from "@/lib/recipes-data";

export type { Allergen, Kueche, MahlzeitTyp, Rezept, ZielEignung, Zutat };

const z = (text: string, key: string, basis = false): Zutat => ({ text, key, basis });

/** Handgeschriebene „Klassiker“ – werden unten um die neuen Felder ergänzt. */
type AltRezept = Omit<Rezept, "mahlzeit" | "kueche" | "allergene" | "pescetarisch" | "mealPrep" | "budget" | "zielEignung">;

const alteRezepteRoh: AltRezept[] = [
  {
    id: "haehnchen-reis-brokkoli",
    name: "Hähnchen mit Reis & Brokkoli",
    zeit: 20,
    portionen: 1,
    kcal: 610,
    protein: 52,
    kh: 68,
    fett: 12,
    tags: ["High Protein", "Meal Prep"],
    vegetarisch: false,
    vegan: false,
    zutaten: [
      z("180 g Hähnchenbrust", "hähnchen"),
      z("70 g Reis (roh)", "reis"),
      z("200 g Brokkoli", "brokkoli"),
      z("1 TL Olivenöl", "öl", true),
      z("Salz, Pfeffer, Paprikapulver", "gewürze", true),
    ],
    schritte: [
      "Reis nach Packung in Salzwasser garen.",
      "Hähnchen würzen und in der Pfanne 4–5 Minuten je Seite scharf anbraten.",
      "Brokkoli 5 Minuten dämpfen, damit er bissfest bleibt.",
      "Alles anrichten, Hähnchen 2 Minuten ruhen lassen und aufschneiden.",
    ],
  },
  {
    id: "skyr-bowl",
    name: "Skyr-Bowl mit Beeren & Nüssen",
    zeit: 5,
    portionen: 1,
    kcal: 380,
    protein: 34,
    kh: 34,
    fett: 12,
    tags: ["Schnell", "Frühstück"],
    vegetarisch: true,
    vegan: false,
    zutaten: [
      z("250 g Skyr", "skyr"),
      z("120 g Beeren", "beeren"),
      z("20 g Nüsse", "nüsse"),
      z("1 TL Honig", "honig", true),
    ],
    schritte: ["Skyr in eine Schale geben.", "Beeren und Nüsse darüber verteilen.", "Nach Geschmack süßen."],
  },
  {
    id: "eier-tomaten-pfanne",
    name: "Rührei mit Tomaten & Vollkornbrot",
    zeit: 12,
    portionen: 1,
    kcal: 470,
    protein: 30,
    kh: 36,
    fett: 22,
    tags: ["Frühstück", "Schnell"],
    vegetarisch: true,
    vegan: false,
    zutaten: [
      z("3 Eier", "eier"),
      z("150 g Tomaten", "tomaten"),
      z("2 Scheiben Vollkornbrot", "brot"),
      z("1 TL Butter", "butter", true),
    ],
    schritte: [
      "Tomaten würfeln und kurz andünsten.",
      "Verquirlte Eier zugeben und bei mittlerer Hitze stocken lassen.",
      "Mit Brot servieren.",
    ],
  },
  {
    id: "lachs-kartoffeln",
    name: "Ofenlachs mit Kartoffeln & Spinat",
    zeit: 30,
    portionen: 1,
    kcal: 640,
    protein: 44,
    kh: 48,
    fett: 27,
    tags: ["Omega-3", "Ofen"],
    vegetarisch: false,
    vegan: false,
    zutaten: [
      z("180 g Lachsfilet", "lachs"),
      z("300 g Kartoffeln", "kartoffeln"),
      z("150 g Spinat", "spinat"),
      z("1 EL Olivenöl", "öl", true),
      z("Zitrone", "zitrone", true),
    ],
    schritte: [
      "Kartoffeln vierteln und 25 Minuten bei 200 °C backen.",
      "Lachs die letzten 12 Minuten mitbacken.",
      "Spinat kurz in der Pfanne zusammenfallen lassen.",
    ],
  },
  {
    id: "linsen-curry",
    name: "Rote-Linsen-Curry mit Reis",
    zeit: 25,
    portionen: 2,
    kcal: 540,
    protein: 26,
    kh: 78,
    fett: 13,
    tags: ["Vegan", "Meal Prep"],
    vegetarisch: true,
    vegan: true,
    zutaten: [
      z("150 g rote Linsen", "linsen"),
      z("200 ml Kokosmilch", "kokosmilch"),
      z("1 Zwiebel", "zwiebel"),
      z("100 g Reis (roh)", "reis"),
      z("Currypulver, Salz", "gewürze", true),
    ],
    schritte: [
      "Zwiebel andünsten, Currypulver kurz mitrösten.",
      "Linsen und Kokosmilch zugeben, 15 Minuten köcheln.",
      "Reis separat garen und servieren.",
    ],
  },
  {
    id: "quark-haferflocken",
    name: "Protein-Porridge mit Quark",
    zeit: 8,
    portionen: 1,
    kcal: 520,
    protein: 40,
    kh: 58,
    fett: 12,
    tags: ["Frühstück", "High Protein"],
    vegetarisch: true,
    vegan: false,
    zutaten: [
      z("70 g Haferflocken", "haferflocken"),
      z("250 g Magerquark", "quark"),
      z("1 Banane", "banane"),
      z("Zimt", "gewürze", true),
    ],
    schritte: [
      "Haferflocken mit Wasser oder Milch aufkochen.",
      "Quark einrühren, sobald der Brei etwas abgekühlt ist.",
      "Mit Banane und Zimt toppen.",
    ],
  },
  {
    id: "thunfisch-nudeln",
    name: "Thunfisch-Nudeln mit Tomatensauce",
    zeit: 18,
    portionen: 1,
    kcal: 660,
    protein: 45,
    kh: 84,
    fett: 14,
    tags: ["Günstig", "Schnell"],
    vegetarisch: false,
    vegan: false,
    zutaten: [
      z("100 g Vollkornnudeln", "nudeln"),
      z("1 Dose Thunfisch", "thunfisch"),
      z("200 g passierte Tomaten", "tomaten"),
      z("1 Knoblauchzehe", "knoblauch", true),
    ],
    schritte: ["Nudeln kochen.", "Knoblauch anbraten, Tomaten zugeben, 8 Minuten einkochen.", "Thunfisch unterheben und mit den Nudeln mischen."],
  },
  {
    id: "tofu-gemuese-wok",
    name: "Tofu-Gemüse-Wok mit Reis",
    zeit: 20,
    portionen: 1,
    kcal: 560,
    protein: 33,
    kh: 62,
    fett: 18,
    tags: ["Vegan", "High Protein"],
    vegetarisch: true,
    vegan: true,
    zutaten: [
      z("200 g Tofu (fest)", "tofu"),
      z("250 g Wokgemüse", "gemüse"),
      z("70 g Reis (roh)", "reis"),
      z("2 EL Sojasauce", "sojasauce", true),
    ],
    schritte: ["Tofu würfeln und knusprig anbraten.", "Gemüse zugeben und 5 Minuten scharf braten.", "Mit Sojasauce ablöschen, mit Reis servieren."],
  },
  {
    id: "huettenkaese-brot",
    name: "Hüttenkäse-Brot mit Ei",
    zeit: 6,
    portionen: 1,
    kcal: 400,
    protein: 32,
    kh: 32,
    fett: 15,
    tags: ["Snack", "Schnell"],
    vegetarisch: true,
    vegan: false,
    zutaten: [
      z("2 Scheiben Vollkornbrot", "brot"),
      z("150 g Hüttenkäse", "hüttenkäse"),
      z("2 gekochte Eier", "eier"),
      z("Schnittlauch", "kräuter", true),
    ],
    schritte: ["Brot mit Hüttenkäse bestreichen.", "Eier in Scheiben auflegen und würzen."],
  },
  {
    id: "rindfleisch-bowl",
    name: "Rindfleisch-Bowl mit Süßkartoffel",
    zeit: 28,
    portionen: 1,
    kcal: 700,
    protein: 50,
    kh: 60,
    fett: 24,
    tags: ["Eisen", "Muskelaufbau"],
    vegetarisch: false,
    vegan: false,
    zutaten: [
      z("180 g Rinderhüfte", "rindfleisch"),
      z("300 g Süßkartoffel", "süßkartoffel"),
      z("150 g Paprika", "paprika"),
      z("1 EL Olivenöl", "öl", true),
    ],
    schritte: [
      "Süßkartoffel würfeln und 25 Minuten bei 200 °C backen.",
      "Fleisch scharf anbraten, danach ruhen lassen.",
      "Paprika kurz anbraten und alles in einer Schüssel anrichten.",
    ],
  },
  {
    id: "garnelen-zoodles",
    name: "Garnelen mit Zucchini-Nudeln",
    zeit: 15,
    portionen: 1,
    kcal: 340,
    protein: 38,
    kh: 14,
    fett: 14,
    tags: ["Low Carb", "Schnell"],
    vegetarisch: false,
    vegan: false,
    zutaten: [
      z("200 g Garnelen", "garnelen"),
      z("300 g Zucchini", "zucchini"),
      z("1 Knoblauchzehe", "knoblauch", true),
      z("1 EL Olivenöl", "öl", true),
    ],
    schritte: ["Zucchini in Streifen schneiden.", "Garnelen mit Knoblauch 3 Minuten braten.", "Zucchini zugeben und 2 Minuten mitbraten."],
  },
  {
    id: "kichererbsen-salat",
    name: "Kichererbsen-Salat mit Feta",
    zeit: 10,
    portionen: 1,
    kcal: 480,
    protein: 24,
    kh: 46,
    fett: 21,
    tags: ["Vegetarisch", "Kalt"],
    vegetarisch: true,
    vegan: false,
    zutaten: [
      z("1 Dose Kichererbsen", "kichererbsen"),
      z("60 g Feta", "feta"),
      z("150 g Gurke", "gurke"),
      z("150 g Tomaten", "tomaten"),
      z("Olivenöl, Zitrone", "öl", true),
    ],
    schritte: ["Kichererbsen abspülen.", "Gemüse würfeln, alles mischen.", "Feta zerbröseln und darüber geben."],
  },
  {
    id: "putenwrap",
    name: "Puten-Wrap mit Skyr-Dip",
    zeit: 12,
    portionen: 1,
    kcal: 520,
    protein: 45,
    kh: 48,
    fett: 15,
    tags: ["To Go", "High Protein"],
    vegetarisch: false,
    vegan: false,
    zutaten: [
      z("150 g Putenbrust", "pute"),
      z("2 Weizen-Wraps", "wrap"),
      z("100 g Skyr", "skyr"),
      z("Salat, Tomaten", "salat"),
    ],
    schritte: ["Pute in Streifen braten.", "Skyr würzen und auf den Wraps verteilen.", "Füllen und rollen."],
  },
  {
    id: "omelett-gemuese",
    name: "Gemüse-Omelett",
    zeit: 12,
    portionen: 1,
    kcal: 390,
    protein: 28,
    kh: 12,
    fett: 26,
    tags: ["Low Carb", "Vegetarisch"],
    vegetarisch: true,
    vegan: false,
    zutaten: [
      z("4 Eier", "eier"),
      z("200 g Gemüse nach Wahl", "gemüse"),
      z("30 g geriebener Käse", "käse"),
      z("Salz, Pfeffer", "gewürze", true),
    ],
    schritte: ["Gemüse anbraten.", "Eier darüber gießen und stocken lassen.", "Käse aufstreuen und zusammenklappen."],
  },
  {
    id: "haehnchen-salat",
    name: "Großer Hähnchensalat",
    zeit: 15,
    portionen: 1,
    kcal: 430,
    protein: 46,
    kh: 18,
    fett: 18,
    tags: ["Low Carb", "Sättigend"],
    vegetarisch: false,
    vegan: false,
    zutaten: [
      z("180 g Hähnchenbrust", "hähnchen"),
      z("200 g Blattsalat", "salat"),
      z("150 g Gurke & Tomaten", "gurke"),
      z("Joghurt-Dressing", "joghurt"),
    ],
    schritte: ["Hähnchen braten und in Streifen schneiden.", "Salat waschen und anrichten.", "Dressing darüber geben."],
  },
  {
    id: "proteinshake-banane",
    name: "Protein-Shake mit Banane",
    zeit: 3,
    portionen: 1,
    kcal: 320,
    protein: 34,
    kh: 36,
    fett: 5,
    tags: ["Nach dem Training", "Schnell"],
    vegetarisch: true,
    vegan: false,
    zutaten: [z("30 g Proteinpulver", "proteinpulver"), z("1 Banane", "banane"), z("300 ml Milch", "milch")],
    schritte: ["Alles in den Mixer geben.", "30 Sekunden mixen."],
  },
  {
    id: "chili-sin-carne",
    name: "Chili sin Carne",
    zeit: 30,
    portionen: 2,
    kcal: 500,
    protein: 28,
    kh: 62,
    fett: 12,
    tags: ["Vegan", "Meal Prep"],
    vegetarisch: true,
    vegan: true,
    zutaten: [
      z("1 Dose Kidneybohnen", "bohnen"),
      z("1 Dose Mais", "mais"),
      z("400 g passierte Tomaten", "tomaten"),
      z("150 g Sojaschnetzel", "soja"),
      z("Chili, Kreuzkümmel", "gewürze", true),
    ],
    schritte: ["Sojaschnetzel einweichen und anbraten.", "Tomaten, Bohnen und Mais zugeben.", "20 Minuten köcheln und kräftig würzen."],
  },
  {
    id: "lachs-quinoa",
    name: "Lachs-Quinoa-Bowl",
    zeit: 25,
    portionen: 1,
    kcal: 620,
    protein: 42,
    kh: 52,
    fett: 25,
    tags: ["Omega-3", "Bowl"],
    vegetarisch: false,
    vegan: false,
    zutaten: [z("160 g Lachsfilet", "lachs"), z("70 g Quinoa", "quinoa"), z("150 g Avocado", "avocado"), z("100 g Gurke", "gurke")],
    schritte: ["Quinoa garen.", "Lachs 10 Minuten bei 190 °C backen.", "Alles in einer Schüssel anrichten."],
  },
];

const allergenWoerter: [RegExp, Allergen][] = [
  [/milch|käse|quark|skyr|feta|joghurt|butter|hüttenkäse/i, "laktose"],
  [/brot|wrap|nudeln|couscous|fladenbrot|naan|bulgur|hafer/i, "gluten"],
  [/nüsse|mandel|cashew|erdnuss/i, "nuesse"],
  [/soja|tofu|edamame|sojasauce/i, "soja"],
  [/\bei\b|eier/i, "ei"],
  [/lachs|thunfisch|kabeljau|forelle/i, "fisch"],
  [/garnelen|meeresfrüchte/i, "meeresfruechte"],
];

function mahlzeitAusTags(tags: string[], name: string): MahlzeitTyp {
  const t = tags.join(" ").toLowerCase();
  if (t.includes("frühstück")) return "Frühstück";
  if (t.includes("nach dem training")) return "Post-Workout";
  if (t.includes("snack") || t.includes("to go")) return "Snack";
  if (/wrap|salat|bowl/i.test(name) && !t.includes("meal prep")) return "Mittag";
  return "Abend";
}

const alteRezepte: Rezept[] = alteRezepteRoh.map((r) => {
  const allergene = new Set<Allergen>();
  for (const zt of r.zutaten) {
    for (const [regex, a] of allergenWoerter) if (regex.test(zt.text)) allergene.add(a);
  }
  const pescetarisch = !r.vegetarisch && /lachs|thunfisch|garnelen|kabeljau|forelle/i.test(r.zutaten.map((z2) => z2.text).join(" "));
  return {
    ...r,
    mahlzeit: mahlzeitAusTags(r.tags, r.name),
    kueche: /curry|wok|quinoa/i.test(r.name) ? "asiatisch" : /chili/i.test(r.name) ? "mexikanisch" : "mediterran",
    allergene: [...allergene],
    pescetarisch,
    mealPrep: r.tags.includes("Meal Prep"),
    budget: r.tags.includes("Günstig"),
    zielEignung: zielEignungAusMakros(r.kcal, r.protein),
  } satisfies Rezept;
});

/** Gesamte Rezeptdatenbank: handgeschriebene Klassiker + ausformulierte Rezepte aus recipes-data.ts. */
export const rezepte: Rezept[] = [...alteRezepte, ...rezepteDatenbank];

export type RezeptTreffer = {
  rezept: Rezept;
  vorhanden: string[];
  fehlt: string[];
  abdeckung: number;
  score: number;
  passung: string;
  portionsfaktor: number;
  kcalAngepasst: number;
  proteinAngepasst: number;
};

function normalisiere(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-zäöüß ]/g, " ")
    .trim();
}

function passt(zutat: Zutat, vorrat: string[]): boolean {
  const k = normalisiere(zutat.key);
  return vorrat.some((v) => {
    const n = normalisiere(v);
    return n.length > 2 && (k.includes(n) || n.includes(k));
  });
}

// ---------------------------------------------------------------------------
// Verlauf: zuletzt angesehene/gekochte Rezepte (eigener, additiver Speicher)
// ---------------------------------------------------------------------------

export type VerlaufEintrag = { id: string; zeit: number; typ: "angesehen" | "gekocht" };
type Verlauf = { version: 1; eintraege: VerlaufEintrag[] };

const VERLAUF_KEY = "evion.rezepte.verlauf.v1";
const leererVerlauf: Verlauf = { version: 1, eintraege: [] };

export function ladeVerlauf(): Verlauf {
  if (typeof window === "undefined") return leererVerlauf;
  try {
    const roh = window.localStorage.getItem(VERLAUF_KEY);
    if (!roh) return leererVerlauf;
    return { ...leererVerlauf, ...(JSON.parse(roh) as Partial<Verlauf>) };
  } catch {
    return leererVerlauf;
  }
}

function schreibeVerlauf(v: Verlauf) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VERLAUF_KEY, JSON.stringify({ ...v, eintraege: v.eintraege.slice(-200) }));
  } catch {
    /* Speicher nicht verfügbar – nur für diese Sitzung relevant. */
  }
}

export function vermerkeAngesehen(id: string) {
  const v = ladeVerlauf();
  schreibeVerlauf({ ...v, eintraege: [...v.eintraege, { id, zeit: Date.now(), typ: "angesehen" }] });
}

export function vermerkeGekocht(id: string) {
  const v = ladeVerlauf();
  schreibeVerlauf({ ...v, eintraege: [...v.eintraege, { id, zeit: Date.now(), typ: "gekocht" }] });
}

/** Abwertung 0 (kein Abzug) bis 1 (maximaler Abzug) je nach letztem Kontakt. */
function abwertung(id: string, verlauf: Verlauf, jetzt: number): number {
  const letzte = verlauf.eintraege.filter((e) => e.id === id).sort((a, b) => b.zeit - a.zeit)[0];
  if (!letzte) return 0;
  const tageSeit = (jetzt - letzte.zeit) / 86_400_000;
  const basis = letzte.typ === "gekocht" ? 1 : 0.6;
  if (tageSeit >= 7) return 0;
  return basis * (1 - tageSeit / 7);
}

// ---------------------------------------------------------------------------
// Vorschlagslogik
// ---------------------------------------------------------------------------

export type RezeptKontext = {
  vorrat: string[];
  /** Offene kcal/Protein für den gesamten restlichen Tag. */
  offenKcal: number;
  offenProtein: number;
  /** Anzahl noch ausstehender Mahlzeiten heute (mind. 1). */
  verbleibendeMahlzeiten: number;
  ernaehrungsform: string;
  allergien?: string[];
  /** Freitext der Abneigungen, z. B. „Pilze, Rosenkohl“. */
  abneigungen?: string;
  /** Freitext der Lieblingsgerichte – Treffer werden bevorzugt. */
  lieblingsgerichte?: string;
  favoritenIds?: string[];
  /** Hat heute bereits trainiert und Training liegt kurz zurück. */
  kuerzlichTrainiert?: boolean;
  jetzt?: Date;
  mahlzeitFilter?: MahlzeitTyp | null;
  kuecheFilter?: Kueche | null;
  zeitFilter?: number | null;
};

/** Leitet aus der Uhrzeit (und optional „gerade trainiert“) den Mahlzeitentyp ab. */
export function mahlzeitentypFuerZeit(datum: Date, kuerzlichTrainiert: boolean): MahlzeitTyp {
  if (kuerzlichTrainiert) return "Post-Workout";
  const stunde = datum.getHours();
  if (stunde >= 5 && stunde < 10) return "Frühstück";
  if (stunde >= 10 && stunde < 14) return "Mittag";
  if (stunde >= 14 && stunde < 17) return "Snack";
  if (stunde >= 17 && stunde < 22) return "Abend";
  return "Snack";
}

export const kuechenListe: Kueche[] = ["mediterran", "asiatisch", "mexikanisch", "orientalisch", "indisch", "schweizerisch-deutsch"];
export const mahlzeitListe: MahlzeitTyp[] = ["Frühstück", "Mittag", "Abend", "Snack", "Pre-Workout", "Post-Workout"];

/** Bewertet alle Rezepte gegen Vorrat, offene Makros, Zeitpunkt und Vorlieben. */
export function rezeptVorschlaege(ctx: RezeptKontext): RezeptTreffer[] {
  const vegan = /vegan/i.test(ctx.ernaehrungsform);
  const vegetarisch = vegan || /vegetar/i.test(ctx.ernaehrungsform);
  const pescetarisch = /pescetar/i.test(ctx.ernaehrungsform);
  const allergien = (ctx.allergien ?? []).map(normalisiere).filter((a) => a.length > 2);
  const abneigungen = (ctx.abneigungen ?? "")
    .split(/[,;]/)
    .map(normalisiere)
    .filter((a) => a.length > 2);
  const lieblinge = (ctx.lieblingsgerichte ?? "")
    .split(/[,;]/)
    .map(normalisiere)
    .filter((a) => a.length > 2);
  const favoriten = new Set(ctx.favoritenIds ?? []);

  const jetzt = ctx.jetzt ?? new Date();
  const mahlzeitAuto = ctx.mahlzeitFilter ?? mahlzeitentypFuerZeit(jetzt, !!ctx.kuerzlichTrainiert);
  const verlauf = ladeVerlauf();
  const jetztMs = jetzt.getTime();

  const verbleibend = Math.max(1, ctx.verbleibendeMahlzeiten);
  const zielKcalProMahlzeit = ctx.offenKcal > 0 ? ctx.offenKcal / verbleibend : 450;
  const zielProteinProMahlzeit = ctx.offenProtein > 0 ? ctx.offenProtein / verbleibend : 30;

  return rezepte
    .filter((r) => (vegan ? r.vegan : vegetarisch ? r.vegetarisch : pescetarisch ? r.vegetarisch || r.pescetarisch : true))
    .filter((r) => !r.allergene.some((a) => allergien.includes(a)))
    .filter((r) => !abneigungen.some((a) => normalisiere(r.name).includes(a) || r.zutaten.some((zt) => normalisiere(zt.text).includes(a))))
    .filter((r) => (ctx.kuecheFilter ? r.kueche === ctx.kuecheFilter : true))
    .filter((r) => (ctx.mahlzeitFilter ? r.mahlzeit === ctx.mahlzeitFilter : true))
    .filter((r) => (ctx.zeitFilter ? r.zeit <= ctx.zeitFilter : true))
    .map<RezeptTreffer>((r) => {
      const relevant = r.zutaten.filter((zt) => !zt.basis);
      const vorhanden = relevant.filter((zt) => passt(zt, ctx.vorrat));
      const fehlt = relevant.filter((zt) => !passt(zt, ctx.vorrat));
      const abdeckung = relevant.length ? vorhanden.length / relevant.length : 0;

      // Portionsfaktor, damit das Rezept möglichst genau das Mahlzeitenziel trifft.
      const portionsfaktor = Math.max(0.5, Math.min(2.5, Math.round((zielKcalProMahlzeit / r.kcal) * 20) / 20));
      const kcalAngepasst = Math.round(r.kcal * portionsfaktor);
      const proteinAngepasst = Math.round(r.protein * portionsfaktor);

      const kcalDiff = Math.abs(kcalAngepasst - zielKcalProMahlzeit);
      const proteinBonus = zielProteinProMahlzeit > 0 ? Math.min(1, proteinAngepasst / zielProteinProMahlzeit) : 0.5;
      const mahlzeitBonus = r.mahlzeit === mahlzeitAuto ? 18 : 0;
      const favoritBonus = favoriten.has(r.id) || lieblinge.some((l) => normalisiere(r.name).includes(l)) ? 14 : 0;
      const abwertungAbzug = abwertung(r.id, verlauf, jetztMs) * 20;

      const score =
        abdeckung * 40 + proteinBonus * 22 + Math.max(0, 16 - kcalDiff / 25) + mahlzeitBonus + favoritBonus - abwertungAbzug + (r.zeit <= 15 ? 4 : 0);

      const passung =
        abdeckung === 1
          ? "Alles da – sofort kochbar"
          : abdeckung >= 0.5
            ? `${vorhanden.length} von ${relevant.length} Zutaten vorhanden`
            : `Einkauf nötig (${fehlt.length} Zutaten)`;

      return {
        rezept: r,
        vorhanden: vorhanden.map((x) => x.text),
        fehlt: fehlt.map((x) => x.text),
        abdeckung,
        score,
        passung,
        portionsfaktor,
        kcalAngepasst,
        proteinAngepasst,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/** Häufige Vorratszutaten als Schnellauswahl. */
export const vorratVorschlaege = [
  "Hähnchen",
  "Pute",
  "Rindfleisch",
  "Lachs",
  "Thunfisch",
  "Garnelen",
  "Tofu",
  "Eier",
  "Skyr",
  "Quark",
  "Hüttenkäse",
  "Feta",
  "Käse",
  "Milch",
  "Proteinpulver",
  "Reis",
  "Nudeln",
  "Kartoffeln",
  "Süßkartoffel",
  "Haferflocken",
  "Quinoa",
  "Brot",
  "Wrap",
  "Linsen",
  "Kichererbsen",
  "Bohnen",
  "Mais",
  "Brokkoli",
  "Spinat",
  "Tomaten",
  "Gurke",
  "Paprika",
  "Zucchini",
  "Zwiebel",
  "Salat",
  "Avocado",
  "Banane",
  "Beeren",
  "Nüsse",
  "Kokosmilch",
];

/** Kleine Nährwert-Datenbank für die manuelle Schnellerfassung (je 100 g). */
export const lebensmittel = [
  { name: "Hähnchenbrust", kcal: 165, protein: 31, kh: 0, fett: 3.6 },
  { name: "Putenbrust", kcal: 135, protein: 29, kh: 0, fett: 1.5 },
  { name: "Rinderhüfte", kcal: 190, protein: 27, kh: 0, fett: 9 },
  { name: "Lachs", kcal: 208, protein: 20, kh: 0, fett: 13 },
  { name: "Thunfisch (Dose, Wasser)", kcal: 108, protein: 24, kh: 0, fett: 1 },
  { name: "Ei (ganz)", kcal: 143, protein: 13, kh: 1, fett: 10 },
  { name: "Magerquark", kcal: 67, protein: 12, kh: 4, fett: 0.3 },
  { name: "Skyr", kcal: 63, protein: 11, kh: 4, fett: 0.2 },
  { name: "Hüttenkäse", kcal: 98, protein: 12, kh: 3, fett: 4 },
  { name: "Proteinpulver (Whey)", kcal: 380, protein: 78, kh: 6, fett: 5 },
  { name: "Reis (gekocht)", kcal: 130, protein: 2.7, kh: 28, fett: 0.3 },
  { name: "Nudeln (gekocht)", kcal: 158, protein: 6, kh: 31, fett: 0.9 },
  { name: "Kartoffeln (gekocht)", kcal: 87, protein: 2, kh: 20, fett: 0.1 },
  { name: "Haferflocken", kcal: 372, protein: 13, kh: 59, fett: 7 },
  { name: "Vollkornbrot", kcal: 230, protein: 8, kh: 40, fett: 3 },
  { name: "Tofu (fest)", kcal: 145, protein: 16, kh: 3, fett: 8 },
  { name: "Linsen (gekocht)", kcal: 116, protein: 9, kh: 20, fett: 0.4 },
  { name: "Kichererbsen (gekocht)", kcal: 164, protein: 9, kh: 27, fett: 2.6 },
  { name: "Banane", kcal: 89, protein: 1.1, kh: 23, fett: 0.3 },
  { name: "Apfel", kcal: 52, protein: 0.3, kh: 14, fett: 0.2 },
  { name: "Beeren (gemischt)", kcal: 45, protein: 1, kh: 8, fett: 0.4 },
  { name: "Brokkoli", kcal: 34, protein: 2.8, kh: 7, fett: 0.4 },
  { name: "Avocado", kcal: 160, protein: 2, kh: 9, fett: 15 },
  { name: "Nüsse (gemischt)", kcal: 607, protein: 20, kh: 14, fett: 54 },
  { name: "Olivenöl", kcal: 884, protein: 0, kh: 0, fett: 100 },
  { name: "Milch 1,5 %", kcal: 47, protein: 3.4, kh: 4.8, fett: 1.5 },
  { name: "Käse (Gouda)", kcal: 356, protein: 25, kh: 0, fett: 28 },
  { name: "Pizza (Margherita)", kcal: 250, protein: 11, kh: 30, fett: 9 },
  { name: "Döner", kcal: 215, protein: 15, kh: 17, fett: 10 },
  { name: "Pommes", kcal: 290, protein: 3.5, kh: 38, fett: 14 },
];
