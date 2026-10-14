/**
 * Rezept-Rohdaten: generiert mind. 120 plausible Rezepte über alle
 * Mahlzeiten, Küchen und Ernährungsformen hinweg. Bewusst generativ statt
 * 120 Literale, damit Verteilung und Makro-Plausibilität testbar bleiben.
 */

export type MahlzeitTyp = "Frühstück" | "Mittag" | "Abend" | "Snack" | "Pre-Workout" | "Post-Workout";
export type Kueche = "mediterran" | "asiatisch" | "mexikanisch" | "orientalisch" | "indisch" | "schweizerisch-deutsch";
export type Allergen = "laktose" | "gluten" | "nuesse" | "soja" | "ei" | "fisch" | "meeresfruechte";
export type ZielEignung = "fettabbau" | "recomp" | "muskelaufbau";
export type Ernaehrungstyp = "omnivor" | "vegetarisch" | "vegan" | "pescetarisch";

export type Zutat = {
  text: string;
  key: string;
  basis?: boolean;
};

export type Rezept = {
  id: string;
  name: string;
  zeit: number;
  portionen: number;
  kcal: number;
  protein: number;
  kh: number;
  fett: number;
  tags: string[];
  vegetarisch: boolean;
  vegan: boolean;
  pescetarisch: boolean;
  mahlzeit: MahlzeitTyp;
  kueche: Kueche;
  allergene: Allergen[];
  mealPrep: boolean;
  budget: boolean;
  zielEignung: ZielEignung[];
  zutaten: Zutat[];
  schritte: string[];
};

const z = (text: string, key: string, basis = false): Zutat => ({ text, key, basis });

// --- Bausteine -------------------------------------------------------------

const kuechen: Kueche[] = ["mediterran", "asiatisch", "mexikanisch", "orientalisch", "indisch", "schweizerisch-deutsch"];
const mahlzeiten: MahlzeitTyp[] = ["Frühstück", "Mittag", "Abend", "Snack", "Pre-Workout", "Post-Workout"];

type Protein = {
  name: string;
  key: string;
  typ: Ernaehrungstyp;
  allergene: Allergen[];
};

const proteineOmnivor: Protein[] = [
  { name: "Hähnchenbrust", key: "hähnchen", typ: "omnivor", allergene: [] },
  { name: "Putenbrust", key: "pute", typ: "omnivor", allergene: [] },
  { name: "Rinderhüfte", key: "rindfleisch", typ: "omnivor", allergene: [] },
  { name: "Schweinefilet", key: "schweinefleisch", typ: "omnivor", allergene: [] },
  { name: "Hackfleisch (Rind)", key: "hackfleisch", typ: "omnivor", allergene: [] },
];
const proteinePescetarisch: Protein[] = [
  { name: "Lachsfilet", key: "lachs", typ: "pescetarisch", allergene: ["fisch"] },
  { name: "Thunfisch", key: "thunfisch", typ: "pescetarisch", allergene: ["fisch"] },
  { name: "Garnelen", key: "garnelen", typ: "pescetarisch", allergene: ["meeresfruechte"] },
  { name: "Kabeljaufilet", key: "kabeljau", typ: "pescetarisch", allergene: ["fisch"] },
  { name: "Forelle", key: "forelle", typ: "pescetarisch", allergene: ["fisch"] },
];
const proteineVegetarisch: Protein[] = [
  { name: "Eier", key: "eier", typ: "vegetarisch", allergene: ["ei"] },
  { name: "Hüttenkäse", key: "hüttenkäse", typ: "vegetarisch", allergene: ["laktose"] },
  { name: "Skyr", key: "skyr", typ: "vegetarisch", allergene: ["laktose"] },
  { name: "Magerquark", key: "quark", typ: "vegetarisch", allergene: ["laktose"] },
  { name: "Feta", key: "feta", typ: "vegetarisch", allergene: ["laktose"] },
];
const proteineVegan: Protein[] = [
  { name: "Tofu", key: "tofu", typ: "vegan", allergene: ["soja"] },
  { name: "Tempeh", key: "tempeh", typ: "vegan", allergene: ["soja"] },
  { name: "Rote Linsen", key: "linsen", typ: "vegan", allergene: [] },
  { name: "Kichererbsen", key: "kichererbsen", typ: "vegan", allergene: [] },
  { name: "Edamame", key: "edamame", typ: "vegan", allergene: ["soja"] },
];

type Vorlage = {
  kueche: Kueche;
  muster: string;
  beilage: string;
  beilageKey: string;
  gluten: boolean;
  schritte: (protein: string) => string[];
};

const vorlagen: Vorlage[] = [
  {
    kueche: "mediterran",
    muster: "{p} mit Couscous & Ofengemüse",
    beilage: "Couscous",
    beilageKey: "couscous",
    gluten: true,
    schritte: (p) => [`${p} würzen und anbraten.`, "Gemüse im Ofen rösten.", "Couscous quellen lassen und alles anrichten."],
  },
  {
    kueche: "mediterran",
    muster: "{p}-Salat mit Oliven & Feta",
    beilage: "Blattsalat",
    beilageKey: "salat",
    gluten: false,
    schritte: (p) => [`${p} zubereiten.`, "Salat, Oliven und Feta mischen.", "Mit Olivenöl und Zitrone anmachen."],
  },
  {
    kueche: "asiatisch",
    muster: "{p}-Wok mit Reis & Gemüse",
    beilage: "Reis",
    beilageKey: "reis",
    gluten: false,
    schritte: (p) => [`${p} scharf anbraten.`, "Gemüse im Wok zugeben.", "Mit Sojasauce ablöschen, mit Reis servieren."],
  },
  {
    kueche: "asiatisch",
    muster: "{p} Pad Thai mit Reisnudeln",
    beilage: "Reisnudeln",
    beilageKey: "reisnudeln",
    gluten: false,
    schritte: (p) => ["Reisnudeln einweichen.", `${p} anbraten und Gemüse zugeben.`, "Nudeln unterheben und würzen."],
  },
  {
    kueche: "mexikanisch",
    muster: "{p}-Burrito-Bowl mit Bohnen",
    beilage: "Reis",
    beilageKey: "reis",
    gluten: false,
    schritte: (p) => [`${p} würzen und braten.`, "Bohnen, Mais und Reis vorbereiten.", "In einer Bowl anrichten."],
  },
  {
    kueche: "mexikanisch",
    muster: "{p}-Tacos mit Salsa",
    beilage: "Mais-Tortillas",
    beilageKey: "tortilla",
    gluten: false,
    schritte: (p) => [`${p} würzen und braten.`, "Salsa aus Tomaten und Zwiebeln zubereiten.", "Tortillas füllen."],
  },
  {
    kueche: "orientalisch",
    muster: "{p} mit Hummus & Fladenbrot",
    beilage: "Fladenbrot",
    beilageKey: "fladenbrot",
    gluten: true,
    schritte: (p) => [`${p} mit orientalischen Gewürzen braten.`, "Hummus vorbereiten.", "Mit Fladenbrot servieren."],
  },
  {
    kueche: "orientalisch",
    muster: "{p}-Spiesse mit Bulgur",
    beilage: "Bulgur",
    beilageKey: "bulgur",
    gluten: true,
    schritte: (p) => [`${p} marinieren und grillen.`, "Bulgur garen.", "Mit Joghurtsauce anrichten."],
  },
  {
    kueche: "indisch",
    muster: "{p}-Curry mit Basmatireis",
    beilage: "Basmatireis",
    beilageKey: "reis",
    gluten: false,
    schritte: (p) => ["Zwiebeln und Gewürze anrösten.", `${p} zugeben und mit Kokosmilch köcheln.`, "Mit Reis servieren."],
  },
  {
    kueche: "indisch",
    muster: "{p} Masala mit Naan",
    beilage: "Naan",
    beilageKey: "naan",
    gluten: true,
    schritte: (p) => ["Currypaste anbraten.", `${p} zugeben und schmoren.`, "Mit Naan servieren."],
  },
  {
    kueche: "schweizerisch-deutsch",
    muster: "{p}geschnetzeltes mit Rösti",
    beilage: "Rösti",
    beilageKey: "kartoffeln",
    gluten: false,
    schritte: (p) => [`${p} in Streifen schneiden und anbraten.`, "Sauce einkochen.", "Mit Rösti servieren."],
  },
  {
    kueche: "schweizerisch-deutsch",
    muster: "{p}-Eintopf mit Kartoffeln",
    beilage: "Kartoffeln",
    beilageKey: "kartoffeln",
    gluten: false,
    schritte: (p) => [`${p} anbraten.`, "Kartoffeln und Gemüse zugeben.", "20 Minuten köcheln lassen."],
  },
];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Band = { ziel: ZielEignung; min: number; max: number; minProtein: number };
const baender: Band[] = [
  { ziel: "fettabbau", min: 300, max: 550, minProtein: 30 },
  { ziel: "recomp", min: 450, max: 700, minProtein: 35 },
  { ziel: "muskelaufbau", min: 600, max: 900, minProtein: 40 },
];

function macros(band: Band, rnd: () => number) {
  const kcalZiel = Math.round(band.min + rnd() * (band.max - band.min));
  const proteinFraktion = 0.26 + rnd() * 0.1; // 26–36 % der kcal aus Protein
  const fettFraktion = 0.22 + rnd() * 0.1; // 22–32 % der kcal aus Fett
  let protein = Math.round((kcalZiel * proteinFraktion) / 4);
  if (protein < band.minProtein) protein = band.minProtein;
  const fett = Math.max(6, Math.round((kcalZiel * fettFraktion) / 9));
  let kh = Math.round((kcalZiel - protein * 4 - fett * 9) / 4);
  if (kh < 8) kh = 8;
  const kcal = protein * 4 + kh * 4 + fett * 9;
  return { kcal, protein, kh, fett };
}

const mahlzeitZeitfenster: Record<MahlzeitTyp, number[]> = {
  "Frühstück": [6, 8, 10],
  "Mittag": [15, 20, 25, 35],
  "Abend": [15, 20, 30, 40],
  "Snack": [5, 8, 10],
  "Pre-Workout": [8, 10, 15],
  "Post-Workout": [5, 10, 15],
};

function erzeugeRezepte(): Rezept[] {
  const out: Rezept[] = [];
  const rnd = mulberry32(20240501);

  // Verteilungsplan: 20 vegan, 22 vegetarisch (nicht-vegan), 20 pescetarisch, 60 omnivor = 122 Rezepte.
  const plan: Ernaehrungstyp[] = [
    ...Array(20).fill("vegan"),
    ...Array(22).fill("vegetarisch"),
    ...Array(20).fill("pescetarisch"),
    ...Array(60).fill("omnivor"),
  ] as Ernaehrungstyp[];

  let i = 0;
  for (const typ of plan) {
    const proteinListe =
      typ === "vegan" ? proteineVegan : typ === "vegetarisch" ? proteineVegetarisch : typ === "pescetarisch" ? proteinePescetarisch : proteineOmnivor;
    const protein = proteinListe[i % proteinListe.length]!;
    const vorlage = vorlagen[i % vorlagen.length]!;
    const mahlzeit = mahlzeiten[i % mahlzeiten.length]!;
    const band = baender[i % baender.length]!;
    const m = macros(band, rnd);
    const zeitOptionen = mahlzeitZeitfenster[mahlzeit]!;
    const zeit = zeitOptionen[i % zeitOptionen.length]!;
    const mealPrep = i % 4 === 0;
    const budget = i % 3 === 0;
    const portionen = mealPrep ? 2 + (i % 3) : 1;

    const allergene = new Set<Allergen>(protein.allergene);
    if (vorlage.gluten) allergene.add("gluten");
    if (/nuss|nüsse|erdnuss/i.test(vorlage.muster)) allergene.add("nuesse");
    if (typ === "vegetarisch" && /feta|hüttenkäse|quark|skyr/i.test(protein.key)) allergene.add("laktose");

    const name = vorlage.muster.replace("{p}", protein.name);
    const id = `${protein.key}-${vorlage.beilageKey}-${vorlage.kueche}-${i}`.replace(/[^a-z0-9-]/g, "");

    const zutaten: Zutat[] = [
      z(`${150 + (i % 4) * 20} g ${protein.name}`, protein.key),
      z(`${60 + (i % 3) * 20} g ${vorlage.beilage}`, vorlage.beilageKey),
      z("150 g Gemüse nach Wahl", "gemüse"),
      z("Gewürze nach Geschmack", "gewürze", true),
    ];

    out.push({
      id,
      name,
      zeit,
      portionen,
      kcal: m.kcal,
      protein: m.protein,
      kh: m.kh,
      fett: m.fett,
      tags: [vorlage.kueche, mahlzeit, ...(mealPrep ? ["Meal Prep"] : []), ...(budget ? ["Günstig"] : [])],
      vegetarisch: typ === "vegan" || typ === "vegetarisch",
      vegan: typ === "vegan",
      pescetarisch: typ === "pescetarisch",
      mahlzeit,
      kueche: vorlage.kueche,
      allergene: [...allergene],
      mealPrep,
      budget,
      zielEignung: [band.ziel],
      zutaten,
      schritte: vorlage.schritte(protein.name),
    });
    i++;
  }
  return out;
}

export const rezepteGeneriert: Rezept[] = erzeugeRezepte();
