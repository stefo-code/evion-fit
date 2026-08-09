/**
 * Demo-Datenschicht (MOCK).
 *
 * Alle Werte hier stammen aus einem realistischen Demo-Profil und sind NICHT
 * mit echten Geräten verbunden. Die Struktur ist bewusst so gehalten, dass sie
 * später 1:1 durch echte Provider (Health Connect, Samsung Health, Beurer …)
 * ersetzt werden kann – siehe src/lib/health-providers.ts.
 */

export type DataQuality = "gemessen" | "geschätzt" | "berechnet";

export type Goal =
  | "fettabbau"
  | "muskelaufbau"
  | "recomposition"
  | "kraft"
  | "fitness";

export const goalLabels: Record<Goal, string> = {
  fettabbau: "Fettabbau",
  muskelaufbau: "Muskelaufbau",
  recomposition: "Body Recomposition",
  kraft: "Kraftsteigerung",
  fitness: "Allgemeine Fitness",
};

export const profile = {
  name: "Alex",
  goal: "recomposition" as Goal,
  goalText: "Fettabbau + Muskelerhalt",
  alter: 34,
  groesse: 181,
  gewicht: 82.4,
  zielGewicht: 77,
  startGewicht: 87.1,
  koerperfett: 21.4,
  muskelmasse: 61.2,
  taille: 89.3,
  startTaille: 95.5,
  trainingstage: 4,
  schritteZiel: 10000,
  kalorienZiel: 2180,
  proteinZiel: 175,
  kohlenhydrateZiel: 210,
  fettZiel: 72,
  ballaststoffeZiel: 32,
  wasserZiel: 3.0,
  schlafZiel: 7.5,
  streak: 12,
  goalScore: 87,
  goalScoreDelta: 4,
  weeklyScore: 89,
  weeklyScoreDelta: 6,
  ernaehrungsform: "Omnivor",
  allergien: ["Haselnuss"],
  trainingsort: "Fitnessstudio",
  erfahrung: "Fortgeschritten",
};

/** Gewichtung des Goal Scores je Ziel (Summe = 100). */
export const scoreWeights: Record<Goal, Record<string, number>> = {
  fettabbau: { Ernährung: 30, Training: 25, Aktivität: 20, Protein: 15, Regeneration: 10 },
  muskelaufbau: { Training: 35, Protein: 25, Kalorienziel: 20, Regeneration: 15, Aktivität: 5 },
  recomposition: { Training: 30, Protein: 25, Ernährung: 20, Regeneration: 15, Aktivität: 10 },
  kraft: { Training: 40, Protein: 20, Regeneration: 20, Kalorienziel: 15, Aktivität: 5 },
  fitness: { Aktivität: 30, Training: 25, Ernährung: 20, Regeneration: 15, Protein: 10 },
};

/** Erfüllungsgrad je Kategorie (0–100) dieser Woche. */
export const scoreComponents: Record<string, number> = {
  Training: 92,
  Protein: 91,
  Ernährung: 94,
  Kalorienziel: 94,
  Aktivität: 87,
  Regeneration: 82,
};

export function computeGoalScore(goal: Goal) {
  const weights = scoreWeights[goal];
  let total = 0;
  let sumW = 0;
  const parts = Object.entries(weights).map(([k, w]) => {
    const v = scoreComponents[k] ?? 80;
    total += (v * w) / 100;
    sumW += w;
    return { key: k, weight: w, value: v, beitrag: Math.round((v * w) / 100) };
  });
  return { score: Math.round((total / sumW) * 100), parts };
}

export const heute = {
  workoutName: "Oberkörper – Push",
  dauer: 42,
  protein: { ist: 118, ziel: profile.proteinZiel },
  kalorien: { ist: 1470, ziel: profile.kalorienZiel },
  schritte: { ist: 7420, ziel: profile.schritteZiel },
  wasser: { ist: 1.9, ziel: profile.wasserZiel },
};

export const readiness = {
  score: 82,
  status: "Bereit",
  schlaf: 89,
  regeneration: 81,
  muskelstatus: 74,
  empfehlung: "Volles Training empfohlen.",
  warum: [
    "Schlaf: 7 h 41 min – 6 % über deinem Durchschnitt",
    "Ruhepuls: 54 bpm – im normalen Bereich für dich",
    "HRV: 68 ms – nahe deinem persönlichen Mittelwert",
    "Beine: hohe Belastung vom Freitag, Oberkörper erholt",
  ],
};

export type DayState = "gruen" | "gelb" | "offen";
export const woche: { tag: string; state: DayState }[] = [
  { tag: "Mo", state: "gruen" },
  { tag: "Di", state: "gruen" },
  { tag: "Mi", state: "gruen" },
  { tag: "Do", state: "gelb" },
  { tag: "Fr", state: "gruen" },
  { tag: "Sa", state: "offen" },
  { tag: "So", state: "offen" },
];

export const wochenKennzahlen = [
  { label: "Training", value: "3 / 4", pct: 75 },
  { label: "Protein", value: "91 %", pct: 91 },
  { label: "Kalorien", value: "94 %", pct: 94 },
  { label: "Schritte", value: "87 %", pct: 87 },
  { label: "Schlaf", value: "82 %", pct: 82 },
];

export type MuscleKey =
  | "brust"
  | "schultern"
  | "bizeps"
  | "bauch"
  | "quadrizeps"
  | "ruecken"
  | "trizeps"
  | "gesaess"
  | "beinbeuger"
  | "waden";

export type MuscleStatus = "bereit" | "regeneriert" | "belastet" | "wenig";

export const muskelStatus: Record<
  MuscleKey,
  {
    name: string;
    status: MuscleStatus;
    saetze: number;
    ziel: number;
    zuletzt: string;
    bereitschaft: number;
    seite: "vorne" | "hinten";
  }
> = {
  brust: { name: "Brust", status: "regeneriert", saetze: 8, ziel: 12, zuletzt: "Dienstag", bereitschaft: 72, seite: "vorne" },
  schultern: { name: "Schultern", status: "bereit", saetze: 6, ziel: 10, zuletzt: "Montag", bereitschaft: 88, seite: "vorne" },
  bizeps: { name: "Bizeps", status: "bereit", saetze: 5, ziel: 10, zuletzt: "Montag", bereitschaft: 90, seite: "vorne" },
  bauch: { name: "Bauch", status: "wenig", saetze: 2, ziel: 8, zuletzt: "letzte Woche", bereitschaft: 95, seite: "vorne" },
  quadrizeps: { name: "Quadrizeps", status: "belastet", saetze: 13, ziel: 14, zuletzt: "Freitag", bereitschaft: 46, seite: "vorne" },
  ruecken: { name: "Rücken", status: "bereit", saetze: 9, ziel: 14, zuletzt: "Mittwoch", bereitschaft: 84, seite: "hinten" },
  trizeps: { name: "Trizeps", status: "regeneriert", saetze: 7, ziel: 10, zuletzt: "Dienstag", bereitschaft: 70, seite: "hinten" },
  gesaess: { name: "Gesäß", status: "belastet", saetze: 11, ziel: 12, zuletzt: "Freitag", bereitschaft: 52, seite: "hinten" },
  beinbeuger: { name: "Beinbeuger", status: "regeneriert", saetze: 6, ziel: 10, zuletzt: "Freitag", bereitschaft: 64, seite: "hinten" },
  waden: { name: "Waden", status: "wenig", saetze: 3, ziel: 8, zuletzt: "Freitag", bereitschaft: 86, seite: "hinten" },
};

export const muscleStatusLabel: Record<MuscleStatus, string> = {
  bereit: "Bereit",
  regeneriert: "Regeneriert sich",
  belastet: "Hohe kürzliche Belastung",
  wenig: "Wenig Trainingsreiz",
};

export type JourneyState = "done" | "current" | "open" | "locked";
export const journey: {
  titel: string;
  state: JourneyState;
  detail: string;
}[] = [
  { titel: "Erstes Training", state: "done", detail: "12.02. abgeschlossen" },
  { titel: "−5 kg", state: "done", detail: "erreicht am 04.06." },
  { titel: "50 Trainings", state: "done", detail: "erreicht am 21.06." },
  { titel: "100 kg Bankdrücken", state: "current", detail: "aktuell 95 kg × 3" },
  { titel: "15 % Körperfett", state: "open", detail: "geschätzt aktuell 21,4 %" },
  { titel: "100 Trainings", state: "locked", detail: "94 / 100" },
];

export const naechsterMeilenstein = {
  titel: "100 Trainings",
  ist: 94,
  ziel: 100,
  rest: "Nur noch 6 Trainings",
};

export const coachInsight = {
  text: "Du erreichst dein Proteinziel im Durchschnitt um 32 g nicht. Ein proteinreicheres Frühstück würde den größten Teil der Lücke schließen.",
  warum: [
    "Ø Protein letzte 14 Tage: 143 g (Ziel 175 g)",
    "Frühstück liefert im Schnitt nur 18 g Protein",
    "Abends wird die Lücke selten vollständig geschlossen",
  ],
  aktion: "Frühstücks-Vorschläge ansehen",
};

export const erfolg = {
  titel: "Neuer Rekord",
  wert: "95 kg Bankdrücken",
  sub: "1 Wiederholung mehr als beim letzten Mal",
};

export const gewichtsVerlauf = [
  { woche: "KW 8", gewicht: 87.1, taille: 95.5, kf: 24.6 },
  { woche: "KW 10", gewicht: 86.2, taille: 94.6, kf: 24.1 },
  { woche: "KW 12", gewicht: 85.5, taille: 93.8, kf: 23.7 },
  { woche: "KW 14", gewicht: 85.0, taille: 93.0, kf: 23.2 },
  { woche: "KW 16", gewicht: 84.3, taille: 92.1, kf: 22.8 },
  { woche: "KW 18", gewicht: 84.0, taille: 91.4, kf: 22.5 },
  { woche: "KW 20", gewicht: 83.4, taille: 90.6, kf: 22.1 },
  { woche: "KW 22", gewicht: 83.1, taille: 90.0, kf: 21.8 },
  { woche: "KW 24", gewicht: 82.7, taille: 89.6, kf: 21.6 },
  { woche: "KW 26", gewicht: 82.4, taille: 89.3, kf: 21.4 },
];

export const kraftVerlauf = [
  { woche: "KW 8", bank: 82.5, kniebeuge: 110, kreuzheben: 140, volumen: 41200 },
  { woche: "KW 12", bank: 85, kniebeuge: 117.5, kreuzheben: 147.5, volumen: 43800 },
  { woche: "KW 16", bank: 87.5, kniebeuge: 122.5, kreuzheben: 155, volumen: 45100 },
  { woche: "KW 20", bank: 90, kniebeuge: 130, kreuzheben: 160, volumen: 47600 },
  { woche: "KW 24", bank: 92.5, kniebeuge: 135, kreuzheben: 165, volumen: 48900 },
  { woche: "KW 26", bank: 95, kniebeuge: 137.5, kreuzheben: 170, volumen: 50400 },
];

export const ernaehrungsVerlauf = [
  { tag: "Mo", kalorien: 2140, protein: 168 },
  { tag: "Di", kalorien: 2260, protein: 172 },
  { tag: "Mi", kalorien: 2050, protein: 151 },
  { tag: "Do", kalorien: 2410, protein: 149 },
  { tag: "Fr", kalorien: 2090, protein: 181 },
  { tag: "Sa", kalorien: 1980, protein: 157 },
  { tag: "So", kalorien: 1470, protein: 118 },
];

export const schlafVerlauf = [
  { tag: "Mo", stunden: 7.1, schritte: 9120 },
  { tag: "Di", stunden: 7.6, schritte: 11020 },
  { tag: "Mi", stunden: 6.4, schritte: 8340 },
  { tag: "Do", stunden: 6.9, schritte: 7810 },
  { tag: "Fr", stunden: 7.9, schritte: 12240 },
  { tag: "Sa", stunden: 8.1, schritte: 10450 },
  { tag: "So", stunden: 7.7, schritte: 7420 },
];

export type LoggedSet = { gewicht: number; wdh: number; rpe: number };
export type Uebung = {
  id: string;
  name: string;
  muskel: string;
  zielSaetze: number;
  wdhBereich: string;
  letzte: LoggedSet[];
  vorschlag: LoggedSet;
  hinweis: string;
  alternativen: string[];
};

export const workoutHeute: { name: string; fokus: string[]; uebungen: Uebung[] } = {
  name: "Oberkörper – Push",
  fokus: ["Brust", "Schultern", "Trizeps"],
  uebungen: [
    {
      id: "bank",
      name: "Bankdrücken",
      muskel: "Brust",
      zielSaetze: 4,
      wdhBereich: "6–8",
      letzte: [
        { gewicht: 80, wdh: 8, rpe: 8 },
        { gewicht: 80, wdh: 8, rpe: 8 },
        { gewicht: 80, wdh: 8, rpe: 8.5 },
      ],
      vorschlag: { gewicht: 82.5, wdh: 7, rpe: 8 },
      hinweis:
        "Alle 3 Sätze am oberen Ende des Zielbereichs bei RPE 8 – eine Steigerung auf 82,5 kg ist realistisch.",
      alternativen: ["Kurzhantel-Bankdrücken", "Maschinen-Brustpresse", "Schrägbankdrücken"],
    },
    {
      id: "schulter",
      name: "Schulterdrücken (KH)",
      muskel: "Schultern",
      zielSaetze: 3,
      wdhBereich: "8–10",
      letzte: [
        { gewicht: 26, wdh: 10, rpe: 8 },
        { gewicht: 26, wdh: 9, rpe: 8.5 },
        { gewicht: 26, wdh: 8, rpe: 9 },
      ],
      vorschlag: { gewicht: 26, wdh: 10, rpe: 8 },
      hinweis: "Letzter Satz fiel auf 8 Wdh. – Gewicht halten und Wiederholungen aufbauen.",
      alternativen: ["Schulterdrücken Maschine", "Arnold Press", "Landmine Press"],
    },
    {
      id: "seitheben",
      name: "Seitheben",
      muskel: "Schultern",
      zielSaetze: 3,
      wdhBereich: "12–15",
      letzte: [
        { gewicht: 12, wdh: 14, rpe: 8 },
        { gewicht: 12, wdh: 13, rpe: 8.5 },
        { gewicht: 12, wdh: 12, rpe: 9 },
      ],
      vorschlag: { gewicht: 12, wdh: 15, rpe: 8 },
      hinweis: "Zielbereich noch nicht ausgereizt – erst 15 Wdh. erreichen, dann steigern.",
      alternativen: ["Seitheben Kabel", "Seitheben Maschine"],
    },
    {
      id: "dips",
      name: "Dips",
      muskel: "Trizeps",
      zielSaetze: 3,
      wdhBereich: "8–12",
      letzte: [
        { gewicht: 10, wdh: 10, rpe: 8 },
        { gewicht: 10, wdh: 9, rpe: 8.5 },
        { gewicht: 10, wdh: 8, rpe: 9 },
      ],
      vorschlag: { gewicht: 10, wdh: 10, rpe: 8 },
      hinweis: "Zusatzgewicht halten, Wiederholungen zurückholen.",
      alternativen: ["Trizepsdrücken am Kabel", "Enges Bankdrücken"],
    },
    {
      id: "fliegende",
      name: "Kabelzug Fliegende",
      muskel: "Brust",
      zielSaetze: 2,
      wdhBereich: "12–15",
      letzte: [
        { gewicht: 17.5, wdh: 14, rpe: 8 },
        { gewicht: 17.5, wdh: 12, rpe: 9 },
      ],
      vorschlag: { gewicht: 17.5, wdh: 14, rpe: 8 },
      hinweis: "Isolationsübung – bei Zeitmangel als Erstes kürzbar.",
      alternativen: ["Pec Deck", "Kurzhantel Fliegende"],
    },
  ],
};

export const zeitModi = [
  {
    minuten: 20,
    titel: "20 Minuten",
    beschreibung: "2 Grundübungen als Supersatz, 8 produktive Sätze",
    saetze: 8,
  },
  { minuten: 30, titel: "30 Minuten", beschreibung: "Grundübungen + 1 Isolation, 11 Sätze", saetze: 11 },
  { minuten: 45, titel: "45 Minuten", beschreibung: "Vollständiger Plan ohne Zusatzarbeit, 13 Sätze", saetze: 13 },
  { minuten: 60, titel: "Volles Training", beschreibung: "Kompletter Plan inkl. Isolation, 15 Sätze", saetze: 15 },
];

export const mahlzeiten = [
  { name: "Frühstück", zeit: "07:20", kcal: 420, protein: 24, kh: 48, fett: 14 },
  { name: "Mittagessen", zeit: "12:40", kcal: 680, protein: 52, kh: 66, fett: 20 },
  { name: "Snack", zeit: "16:10", kcal: 370, protein: 42, kh: 28, fett: 9 },
];

export const rezeptVorschlaege = [
  {
    name: "High-Protein Bolognese",
    kcal: 640,
    protein: 62,
    kh: 61,
    fett: 17,
    zeit: 25,
    tags: ["Omnivor", "Meal Prep"],
  },
  {
    name: "Skyr-Bowl mit Beeren",
    kcal: 380,
    protein: 41,
    kh: 34,
    fett: 8,
    zeit: 5,
    tags: ["Vegetarisch", "Schnell"],
  },
  {
    name: "Ofen-Lachs mit Kartoffeln",
    kcal: 710,
    protein: 55,
    kh: 58,
    fett: 26,
    zeit: 35,
    tags: ["Omnivor", "Omega-3"],
  },
];

export const fotoErkennung = {
  items: [
    { name: "Hähnchenbrust", menge: "geschätzt 180–210 g", kcal: "300–350 kcal", protein: "56–65 g" },
    { name: "Reis (gekocht)", menge: "geschätzt 200–250 g", kcal: "260–325 kcal", protein: "5–7 g" },
    { name: "Gemüsemix", menge: "geschätzt 130–180 g", kcal: "60–90 kcal", protein: "3–5 g" },
  ],
  summe: "650–790 kcal",
  proteinSumme: "64–77 g",
};

export const supplements = [
  {
    name: "Creatin Monohydrat",
    evidenz: "Sehr hoch",
    relevanz: "Hoch für Kraft & Muskelaufbau",
    dosierung: "3–5 g täglich",
    timing: "Geringe Bedeutung – Hauptsache täglich",
    preis: "Sehr gutes Preis-Leistungs-Verhältnis",
    hinweis:
      "Gut untersuchtes Supplement. Bei Nierenerkrankungen oder Medikamenteneinnahme vorab ärztlich abklären.",
    empfohlen: true,
  },
  {
    name: "Whey Protein",
    evidenz: "Hoch",
    relevanz: "Hoch, wenn Proteinziel sonst schwer erreichbar ist",
    dosierung: "20–40 g pro Portion nach Bedarf",
    timing: "Flexibel über den Tag",
    preis: "Gut, abhängig vom Anbieter",
    hinweis: "Ein Lebensmittel-Ersatz, kein Muss. Bei Laktoseintoleranz Isolat erwägen.",
    empfohlen: true,
  },
  {
    name: "Koffein",
    evidenz: "Hoch",
    relevanz: "Mittel bis hoch für Leistung",
    dosierung: "3–6 mg pro kg Körpergewicht",
    timing: "Ca. 30–60 min vor Belastung",
    preis: "Sehr günstig",
    hinweis:
      "Kann den Schlaf beeinträchtigen, besonders bei Einnahme am späten Nachmittag oder Abend.",
    empfohlen: true,
  },
  {
    name: "Citrullin Malat",
    evidenz: "Mittel",
    relevanz: "Gering bis mittel",
    dosierung: "6–8 g",
    timing: "Ca. 60 min vor dem Training",
    preis: "Mittel",
    hinweis: "Effekte sind in Studien uneinheitlich.",
    empfohlen: false,
  },
  {
    name: "BCAA",
    evidenz: "Niedrig bei ausreichender Proteinzufuhr",
    relevanz: "Gering",
    dosierung: "—",
    timing: "—",
    preis: "Ungünstig im Verhältnis zum Nutzen",
    hinweis: "Bei ausreichender Gesamtproteinzufuhr meist nicht erforderlich.",
    empfohlen: false,
  },
  {
    name: "L-Carnitin",
    evidenz: "Niedrig für Fettabbau",
    relevanz: "Gering",
    dosierung: "2 g",
    timing: "—",
    preis: "Ungünstig",
    hinweis: "Für Fettabbau kein belastbarer Zusatznutzen nachgewiesen.",
    empfohlen: false,
  },
];

export const supplementPlan = [
  { name: "Creatin 5 g", erledigt: true },
  { name: "Vitamin D3 (Winter) 2000 IE", erledigt: true },
  { name: "Whey – noch 42 g Protein offen", erledigt: false },
];

export const weeklyReview = {
  score: 89,
  training: "4 / 4",
  kraft: "+1,8 %",
  gewicht: "−0,3 kg",
  taille: "−0,4 cm",
  protein: "92 %",
  schlaf: "7 h 21 min",
  schritte: "9.482 / Tag",
  gutGelaufen: [
    "Alle 4 geplanten Trainings absolviert – erstmals seit 5 Wochen.",
    "Kraftwerte bei Bankdrücken und Rudern leicht gestiegen.",
    "Kalorienziel an 6 von 7 Tagen im Zielkorridor.",
  ],
  besser: [
    "Protein an 3 Tagen unter 150 g – vor allem morgens.",
    "Schritte an Bürotagen unter 8.000.",
  ],
  anpassen: [
    "Kalorien bleiben unverändert – der Trend passt zum Ziel.",
    "Frühstück auf ca. 40 g Protein umstellen.",
    "Ein zusätzlicher Spaziergang von 20 Minuten an Bürotagen.",
  ],
  fokus: "Protein am Morgen und konstante Schritte an Bürotagen.",
};

export const adaptiveKalorien = {
  zielRate: -0.4,
  istRate: -0.1,
  beobachtung: "3 Wochen",
  vorschlag: "Kalorienziel um 120 kcal senken oder Schritte um 1.500/Tag erhöhen",
  hinweis:
    "Der Energieverbrauch lässt sich nicht exakt bestimmen. Die Empfehlung basiert auf deinem Gewichtstrend und deiner protokollierten Aufnahme über mehrere Wochen.",
};

export const geraete = [
  {
    name: "Samsung Health",
    typ: "App",
    status: "Vorbereitet",
    daten: ["Schritte", "Workouts", "Schlaf", "Herzfrequenz"],
    hinweis: "Anbindung über Android Health Connect vorgesehen. Aktuell Demo-Daten.",
  },
  {
    name: "Galaxy Watch 6",
    typ: "Wearable",
    status: "Vorbereitet",
    daten: ["Ruhepuls", "HRV", "Schlafphasen", "Energy Score"],
    hinweis: "Daten laufen über Samsung Health / Health Connect. Aktuell Demo-Daten.",
  },
  {
    name: "Beurer Smart Scale",
    typ: "Körperwaage",
    status: "Manuelle Eingabe aktiv",
    daten: ["Gewicht", "Körperfett (geschätzt)", "Muskelmasse (geschätzt)"],
    hinweis:
      "Für den HealthManager Pro liegt uns keine offiziell nutzbare Schnittstelle vor. Werte können manuell erfasst oder später über Health Connect importiert werden.",
  },
  { name: "Apple Health", typ: "App", status: "Geplant", daten: ["Schritte", "Schlaf", "Workouts"], hinweis: "Noch nicht angebunden." },
  { name: "Garmin", typ: "Wearable", status: "Geplant", daten: ["HRV", "Workouts"], hinweis: "Noch nicht angebunden." },
  { name: "Oura / WHOOP", typ: "Wearable", status: "Geplant", daten: ["Schlaf", "Erholung"], hinweis: "Noch nicht angebunden." },
];

export const datenquellen = [
  { feld: "Gewicht", quelle: "Manuelle Eingabe (Beurer-Waage abgelesen)", qualitaet: "gemessen" as DataQuality },
  { feld: "Körperfett", quelle: "BIA-Waage – Schätzwert", qualitaet: "geschätzt" as DataQuality },
  { feld: "Muskelmasse", quelle: "BIA-Waage – Schätzwert", qualitaet: "geschätzt" as DataQuality },
  { feld: "Taille", quelle: "Maßband, manuell", qualitaet: "gemessen" as DataQuality },
  { feld: "Schlaf", quelle: "Demo-Daten (später Samsung Health / Galaxy Watch 6)", qualitaet: "gemessen" as DataQuality },
  { feld: "Schritte", quelle: "Demo-Daten (später Health Connect)", qualitaet: "gemessen" as DataQuality },
  { feld: "Readiness", quelle: "App-Modell aus Schlaf, HRV, Belastung", qualitaet: "berechnet" as DataQuality },
  { feld: "1RM", quelle: "Formel aus Gewicht und Wiederholungen", qualitaet: "berechnet" as DataQuality },
  { feld: "Kalorienbedarf", quelle: "Modell + Verlaufsabgleich", qualitaet: "berechnet" as DataQuality },
];

export const coachVorschlaege = [
  "Wie sieht mein Training morgen aus?",
  "Wie schließe ich heute meine Proteinlücke?",
  "Mache ich Fortschritte beim Fettabbau?",
  "Soll ich heute trainieren oder pausieren?",
  "Lohnt sich Creatin für mein Ziel?",
];

export const coachAntworten: Record<string, string> = {
  default:
    "Kurz zusammengefasst: Dein Trend passt zu deinem Ziel. Gewicht −4,7 kg, Taille −6,2 cm, Kraft +8 % in 8 Wochen. Heute stehen noch **710 kcal** und **57 g Protein** offen – eine proteinreiche Hauptmahlzeit schließt beides gut ab.\n\nHinweis: Ich bin kein Arzt und stelle keine Diagnosen.",
};
