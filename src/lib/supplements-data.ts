/**
 * Supplement-Kompass: evidenzbasierte Datenbank + personalisierte Priorisierung.
 *
 * Grundlage der Einordnung sind die Position Stands der International Society
 * of Sports Nutrition (ISSN) zu Protein, Creatin, Beta-Alanin und Koffein,
 * das IOC Consensus Statement zu Nahrungsergänzungsmitteln im Sport (2018),
 * die Referenzwerte der DGE (Vitamin D, Omega-3, Magnesium, Eisen, B12) sowie
 * Meta-Analysen zu HMB, Ashwagandha, Kollagen und Nitrat/Citrullin.
 * Keine Heilsversprechen – Supplements ergänzen, sie ersetzen nichts.
 */

import type { Goal } from "@/lib/demo-data";
import type { Geschlecht } from "@/lib/onboarding-store";

export type Evidenz = "Sehr hoch" | "Hoch" | "Mittel" | "Niedrig" | "Unzureichend";

export const evidenzRang: Record<Evidenz, number> = {
  "Sehr hoch": 5,
  Hoch: 4,
  Mittel: 2.5,
  Niedrig: 1,
  Unzureichend: 0,
};

export type Kategorie = "Basis" | "Leistung" | "Regeneration" | "Gesundheit" | "Umstritten";

export type Supplement = {
  id: string;
  name: string;
  kategorie: Kategorie;
  evidenz: Evidenz;
  wirkung: string;
  dosierung: string;
  timing: string;
  dauer: string;
  preis: string;
  hinweis: string;
  quelle: string;
  /** Relevanz je Ziel: 0 = irrelevant, 3 = sehr hoch. */
  ziel: Record<Goal, number>;
  /** Zusatzpunkte für personenspezifische Parameter. */
  regeln?: {
    abAlter?: number;
    geschlecht?: Geschlecht;
    vegan?: boolean;
    abTrainingstagen?: number;
    intensivIntervall?: boolean; // Nutzen v. a. bei kurzen, harten Belastungen (60–240 s)
    schlafProblem?: boolean;
  };
  bonusText?: string;
};

export const supplementDatenbank: Supplement[] = [
  {
    id: "creatin",
    name: "Creatin Monohydrat",
    kategorie: "Leistung",
    evidenz: "Sehr hoch",
    wirkung:
      "Erhöht die Phosphokreatin-Speicher: mehr Wiederholungen bei schweren Sätzen, im Mittel +1–2 kg fettfreie Masse und deutlich bessere Kraftzuwächse über 8–12 Wochen.",
    dosierung: "3–5 g täglich (0,1 g/kg). Ladephase optional: 20 g/Tag über 5 Tage.",
    timing: "Unabhängig von der Tageszeit – entscheidend ist die tägliche Einnahme.",
    dauer: "Dauerhaft, auch in Trainingspausen.",
    preis: "Sehr gut – ca. 3–6 € pro Monat.",
    hinweis:
      "Bestuntersuchtes Supplement im Sport. Anfangs 0,5–1 kg Wassereinlagerung in der Muskulatur ist normal. Bei Nierenerkrankung vorab ärztlich abklären.",
    quelle: "ISSN Position Stand Creatine (2017), Kreider et al.",
    ziel: { muskelaufbau: 3, kraft: 3, recomposition: 3, fettabbau: 2, fitness: 2 },
    regeln: { abAlter: 50 },
    bonusText: "Ab ca. 50 Jahren zusätzlich relevant gegen altersbedingten Muskelabbau (Sarkopenie).",
  },
  {
    id: "whey",
    name: "Whey Protein (Konzentrat/Isolat)",
    kategorie: "Basis",
    evidenz: "Sehr hoch",
    wirkung:
      "Schnell verfügbares Protein mit hohem Leucin-Anteil. Schließt die Lücke zum Tagesziel von 1,6–2,2 g Protein/kg – der stärkste Ernährungs-Hebel für Muskelaufbau und Muskelerhalt in der Diät.",
    dosierung: "20–40 g pro Portion, so viel wie zum Erreichen des Proteinziels nötig.",
    timing: "Flexibel; sinnvoll nach dem Training oder als Zwischenmahlzeit.",
    dauer: "Solange das Proteinziel über Lebensmittel schwer erreichbar ist.",
    preis: "Gut – ca. 0,6–1,2 € pro 30-g-Portion.",
    hinweis:
      "Ein Lebensmittel, kein Wundermittel. Bei Laktoseintoleranz Isolat oder Hydrolysat wählen.",
    quelle: "ISSN Position Stand Protein & Exercise (2017), Morton et al. Meta-Analyse (2018)",
    ziel: { muskelaufbau: 3, kraft: 2, recomposition: 3, fettabbau: 3, fitness: 1 },
  },
  {
    id: "mehrkomponenten",
    name: "Mehrkomponenten-Eiweiß",
    kategorie: "Basis",
    evidenz: "Hoch",
    wirkung:
      "Mischung aus Whey, Casein und Milcheiweiß: schnelle plus langsame Aminosäure-Freisetzung, gut als Mahlzeitenersatz oder abends.",
    dosierung: "30–40 g pro Portion.",
    timing: "Zwischen Mahlzeiten oder am Abend.",
    dauer: "Dauerhaft möglich.",
    preis: "Gut.",
    hinweis: "Kein Vorteil gegenüber Whey, wenn die Tagesproteinmenge ohnehin stimmt.",
    quelle: "Reidy & Rasmussen (2016), Journal of Nutrition",
    ziel: { muskelaufbau: 2, kraft: 1, recomposition: 2, fettabbau: 2, fitness: 1 },
  },
  {
    id: "veganprotein",
    name: "Veganes Protein (Erbse + Reis)",
    kategorie: "Basis",
    evidenz: "Hoch",
    wirkung:
      "Kombiniert liefert es ein vollständiges Aminosäureprofil und ist Whey beim Muskelaufbau gleichwertig, wenn die Menge etwas höher liegt.",
    dosierung: "30–45 g pro Portion (ca. 20 % mehr als Whey).",
    timing: "Flexibel.",
    dauer: "Dauerhaft.",
    preis: "Mittel bis gut.",
    hinweis: "Auf Leucin-Gehalt (≥ 2,5 g pro Portion) achten.",
    quelle: "Babault et al. (2015); Messina et al. (2018)",
    ziel: { muskelaufbau: 2, kraft: 1, recomposition: 2, fettabbau: 2, fitness: 1 },
    regeln: { vegan: true },
    bonusText: "Passt zu deiner pflanzlichen Ernährungsform.",
  },
  {
    id: "vitd3",
    name: "Vitamin D3 (+ K2)",
    kategorie: "Gesundheit",
    evidenz: "Hoch",
    wirkung:
      "In Mitteleuropa ist die Versorgung von Oktober bis März regelmäßig unzureichend. Ausreichende Spiegel unterstützen Knochen, Immunsystem und Muskelfunktion.",
    dosierung: "1.000–2.000 IE täglich; höhere Dosen nur nach Blutwert.",
    timing: "Zu einer fetthaltigen Mahlzeit.",
    dauer: "Vor allem Oktober bis März.",
    preis: "Sehr günstig.",
    hinweis:
      "Idealerweise 25-OH-Vitamin-D im Blut bestimmen lassen. Keine Dauer-Hochdosierung ohne ärztliche Kontrolle.",
    quelle: "DGE-Referenzwerte; Robert Koch-Institut zur Vitamin-D-Versorgung",
    ziel: { muskelaufbau: 2, kraft: 2, recomposition: 2, fettabbau: 2, fitness: 3 },
    regeln: { abAlter: 50 },
    bonusText: "Mit steigendem Alter sinkt die körpereigene Bildung in der Haut deutlich.",
  },
  {
    id: "omega3",
    name: "Omega-3 (EPA/DHA)",
    kategorie: "Gesundheit",
    evidenz: "Hoch",
    wirkung:
      "Unterstützt Herz-Kreislauf-Gesundheit und wirkt entzündungsmodulierend; Hinweise auf leicht verbesserte Regeneration und Muskelproteinsynthese bei älteren Erwachsenen.",
    dosierung: "1–2 g EPA + DHA täglich (Fisch- oder Algenöl).",
    timing: "Zu einer Mahlzeit.",
    dauer: "Dauerhaft, besonders bei wenig Fischverzehr.",
    preis: "Mittel.",
    hinweis:
      "Auf Reinheit und EPA/DHA-Gehalt achten (nicht Gesamt-Öl). Bei Blutverdünnern ärztlich abklären.",
    quelle: "DGE; Smith et al. (2015) zu Muskelproteinsynthese",
    ziel: { muskelaufbau: 2, kraft: 1, recomposition: 2, fettabbau: 2, fitness: 3 },
    regeln: { abAlter: 45 },
    bonusText: "Ab dem mittleren Alter besonders relevant für Herz-Kreislauf und Muskelerhalt.",
  },
  {
    id: "koffein",
    name: "Koffein",
    kategorie: "Leistung",
    evidenz: "Sehr hoch",
    wirkung:
      "Senkt das wahrgenommene Anstrengungsempfinden, verbessert Kraftausdauer, Wiederholungszahlen und Ausdauerleistung um im Mittel 2–7 %.",
    dosierung: "3–6 mg pro kg Körpergewicht (bei 70 kg: 210–420 mg).",
    timing: "30–60 Minuten vor der Belastung.",
    dauer: "Gezielt vor harten Einheiten; gelegentliche Pausen sinnvoll.",
    preis: "Sehr günstig.",
    hinweis:
      "Halbwertszeit ca. 5 Stunden – am späten Nachmittag/Abend kann der Schlaf leiden. Nicht bei Herzrhythmusstörungen oder in der Schwangerschaft ohne ärztliche Rücksprache.",
    quelle: "ISSN Position Stand Caffeine (2021), Guest et al.",
    ziel: { muskelaufbau: 2, kraft: 3, recomposition: 2, fettabbau: 2, fitness: 1 },
    regeln: { abTrainingstagen: 4 },
    bonusText: "Bei hoher Trainingsfrequenz hilfreich, um Leistung an müden Tagen zu halten.",
  },
  {
    id: "betaalanin",
    name: "Beta-Alanin",
    kategorie: "Leistung",
    evidenz: "Hoch",
    wirkung:
      "Erhöht das muskuläre Carnosin und puffert Säure ab. Nutzen vor allem bei intensiven Belastungen von 60 Sekunden bis 4 Minuten (hohe Wiederholungszahlen, Intervalle, Sätze bis nahe Muskelversagen).",
    dosierung: "3,2–6,4 g täglich, aufgeteilt auf 2 Portionen.",
    timing: "Tageszeit unwichtig – die Sättigung über 4+ Wochen zählt.",
    dauer: "Mindestens 4 Wochen, danach dauerhaft.",
    preis: "Günstig.",
    hinweis:
      "Häufiges Kribbeln auf der Haut (Parästhesie) ist harmlos und lässt sich durch Aufteilen der Dosis vermeiden. Wenig Nutzen bei reinen Schwerkraft-Sätzen unter 30 Sekunden.",
    quelle: "ISSN Position Stand Beta-Alanine (2015), Trexler et al.",
    ziel: { muskelaufbau: 2, kraft: 1, recomposition: 2, fettabbau: 1, fitness: 1 },
    regeln: { intensivIntervall: true },
    bonusText: "Passt zu volumen- und intervallbetontem Training.",
  },
  {
    id: "citrullin",
    name: "L-Citrullin (Malat)",
    kategorie: "Leistung",
    evidenz: "Mittel",
    wirkung:
      "Steigert Arginin- und NO-Verfügbarkeit stärker als L-Arginin selbst; Hinweise auf mehr Wiederholungen und weniger Muskelkater.",
    dosierung: "6–8 g Citrullin-Malat.",
    timing: "45–60 Minuten vor dem Training.",
    dauer: "Vor harten Einheiten.",
    preis: "Mittel.",
    hinweis: "Studienlage uneinheitlich – nette Ergänzung, kein Fundament.",
    quelle: "Gonzalez & Trexler (2020), JSCR Review",
    ziel: { muskelaufbau: 2, kraft: 1, recomposition: 1, fettabbau: 1, fitness: 0 },
  },
  {
    id: "arginin",
    name: "L-Arginin",
    kategorie: "Umstritten",
    evidenz: "Niedrig",
    wirkung:
      "Als NO-Vorstufe beworben, wird jedoch stark in der Leber abgebaut („First-Pass-Effekt“). Leistungseffekte sind in Studien meist nicht nachweisbar.",
    dosierung: "3–6 g (falls überhaupt).",
    timing: "Vor dem Training.",
    dauer: "—",
    preis: "Ungünstig im Verhältnis zum Nutzen.",
    hinweis: "Wenn NO-Pfad gewünscht: L-Citrullin ist die wirksamere Vorstufe.",
    quelle: "Bescós et al. (2012); Viribay et al. (2020)",
    ziel: { muskelaufbau: 0, kraft: 0, recomposition: 0, fettabbau: 0, fitness: 0 },
  },
  {
    id: "bcaa",
    name: "BCAA",
    kategorie: "Umstritten",
    evidenz: "Niedrig",
    wirkung:
      "Nur 3 der 9 essenziellen Aminosäuren – für die Muskelproteinsynthese fehlen die übrigen. Bei ausreichender Gesamtproteinzufuhr ohne messbaren Zusatznutzen.",
    dosierung: "—",
    timing: "—",
    dauer: "—",
    preis: "Schlecht – Geld ist in Whey oder EAA besser angelegt.",
    hinweis:
      "Sinnvolle Alternative nur in Sonderfällen (z. B. nüchternes Training): dann EAA statt BCAA.",
    quelle: "Wolfe (2017), JISSN; Jackman et al. (2017)",
    ziel: { muskelaufbau: 0, kraft: 0, recomposition: 0, fettabbau: 0, fitness: 0 },
  },
  {
    id: "eaa",
    name: "EAA (essenzielle Aminosäuren)",
    kategorie: "Leistung",
    evidenz: "Mittel",
    wirkung:
      "Vollständiges Profil essenzieller Aminosäuren; sinnvoll bei nüchternem Training oder sehr geringer Proteinzufuhr.",
    dosierung: "10–15 g.",
    timing: "Vor oder während des Trainings.",
    dauer: "Situativ.",
    preis: "Mittel bis ungünstig.",
    hinweis: "Bei normalem Proteinbudget bringt eine Proteinmahlzeit dasselbe – günstiger.",
    quelle: "Jackman et al. (2017), Frontiers in Physiology",
    ziel: { muskelaufbau: 1, kraft: 1, recomposition: 1, fettabbau: 1, fitness: 0 },
  },
  {
    id: "carnitin",
    name: "L-Carnitin",
    kategorie: "Umstritten",
    evidenz: "Niedrig",
    wirkung:
      "Als „Fatburner“ vermarktet. Die Aufnahme in den Muskel gelingt nur mit sehr hohen Kohlenhydratmengen über Monate; ein relevanter Fettabbau-Effekt ist nicht belegt. Schwache Hinweise auf leicht verbesserte Regeneration.",
    dosierung: "2 g täglich (falls überhaupt).",
    timing: "Zu einer kohlenhydrathaltigen Mahlzeit.",
    dauer: "—",
    preis: "Ungünstig für den beworbenen Zweck.",
    hinweis: "Für Fettabbau zählen Kaloriendefizit, Protein und Alltagsaktivität – nicht Carnitin.",
    quelle: "Wall et al. (2011); Pooyandjoo et al. (2016) Meta-Analyse",
    ziel: { muskelaufbau: 0, kraft: 0, recomposition: 0, fettabbau: 1, fitness: 0 },
  },
  {
    id: "magnesium",
    name: "Magnesium",
    kategorie: "Regeneration",
    evidenz: "Mittel",
    wirkung:
      "Beteiligt an Muskelkontraktion und Energiestoffwechsel. Ein Ausgleich eines Defizits verbessert Muskelfunktion und Schlafqualität; ohne Mangel kein Zusatznutzen.",
    dosierung: "200–400 mg (Citrat oder Glycinat).",
    timing: "Abends, gut verträglich zum Essen.",
    dauer: "Bei erhöhtem Bedarf (viel Schwitzen, Diätphasen).",
    preis: "Günstig.",
    hinweis: "Hohe Dosen können abführend wirken – langsam einschleichen.",
    quelle: "DGE-Referenzwerte; Zhang et al. (2017)",
    ziel: { muskelaufbau: 1, kraft: 1, recomposition: 1, fettabbau: 2, fitness: 2 },
    regeln: { abTrainingstagen: 5 },
    bonusText: "Bei hoher Trainingsfrequenz steigt der Bedarf über Schweißverluste.",
  },
  {
    id: "eisen",
    name: "Eisen (nur bei nachgewiesenem Mangel)",
    kategorie: "Gesundheit",
    evidenz: "Hoch",
    wirkung:
      "Eisenmangel senkt Sauerstofftransport, Ausdauer und Energielevel. Bei Frauen im gebärfähigen Alter und Sporttreibenden mit pflanzlicher Ernährung ist er häufig.",
    dosierung: "Nur nach Blutbild (Ferritin) und ärztlicher Empfehlung.",
    timing: "Nüchtern mit Vitamin C, nicht mit Kaffee oder Milch.",
    dauer: "Bis zur Normalisierung der Werte.",
    preis: "Günstig.",
    hinweis:
      "Ohne Mangel nicht supplementieren – Eisenüberladung ist schädlich. Immer ärztlich abklären.",
    quelle: "DGE; Sim et al. (2019), European Journal of Applied Physiology",
    ziel: { muskelaufbau: 1, kraft: 1, recomposition: 1, fettabbau: 1, fitness: 2 },
    regeln: { geschlecht: "weiblich" },
    bonusText: "Für Frauen im gebärfähigen Alter besonders relevant (Menstruationsverluste).",
  },
  {
    id: "b12",
    name: "Vitamin B12",
    kategorie: "Gesundheit",
    evidenz: "Sehr hoch",
    wirkung:
      "Bei rein pflanzlicher Ernährung nicht verzichtbar: notwendig für Blutbildung und Nervensystem.",
    dosierung: "250 µg täglich oder 1.000 µg 2× pro Woche.",
    timing: "Beliebig.",
    dauer: "Dauerhaft bei veganer Ernährung.",
    preis: "Sehr günstig.",
    hinweis: "Kein sportlicher Leistungseffekt – reine Versorgungssicherheit.",
    quelle: "DGE-Position zu veganer Ernährung (2016)",
    ziel: { muskelaufbau: 1, kraft: 1, recomposition: 1, fettabbau: 1, fitness: 2 },
    regeln: { vegan: true },
    bonusText: "Bei pflanzlicher Ernährung Pflichtprogramm.",
  },
  {
    id: "hmb",
    name: "HMB",
    kategorie: "Regeneration",
    evidenz: "Mittel",
    wirkung:
      "Wirkt muskelabbauhemmend. Relevant vor allem bei Untrainierten, älteren Erwachsenen oder in starken Kaloriendefiziten; bei trainierten Personen kaum Effekte.",
    dosierung: "3 g täglich, aufgeteilt.",
    timing: "Zu Mahlzeiten.",
    dauer: "Über Diät- oder Aufbauphasen.",
    preis: "Mittel bis ungünstig.",
    hinweis: "Bei ausreichender Proteinzufuhr meist überflüssig; Creatin hat den besseren Nachweis.",
    quelle: "ISSN Position Stand HMB (2013); Rowlands & Thomson (2009)",
    ziel: { muskelaufbau: 1, kraft: 1, recomposition: 1, fettabbau: 2, fitness: 1 },
    regeln: { abAlter: 60 },
    bonusText: "Im höheren Alter sinnvoller Baustein gegen Muskelabbau.",
  },
  {
    id: "kollagen",
    name: "Kollagenpeptide + Vitamin C",
    kategorie: "Regeneration",
    evidenz: "Mittel",
    wirkung:
      "Hinweise auf verbesserte Sehnen-, Band- und Gelenkbelastbarkeit sowie weniger Gelenkbeschwerden bei Sporttreibenden.",
    dosierung: "10–15 g mit 50 mg Vitamin C.",
    timing: "30–60 Minuten vor der Belastung.",
    dauer: "Mindestens 12 Wochen.",
    preis: "Mittel.",
    hinweis: "Kein vollwertiger Proteinersatz (unvollständiges Aminosäureprofil).",
    quelle: "Shaw et al. (2017), AJCN; Clark et al. (2008)",
    ziel: { muskelaufbau: 1, kraft: 1, recomposition: 1, fettabbau: 1, fitness: 2 },
    regeln: { abAlter: 45 },
    bonusText: "Mit zunehmendem Alter wird die Sehnen- und Gelenkgesundheit wichtiger.",
  },
  {
    id: "ashwagandha",
    name: "Ashwagandha (KSM-66)",
    kategorie: "Regeneration",
    evidenz: "Mittel",
    wirkung:
      "Meta-Analysen zeigen reduziertes Stressempfinden und niedrigere Cortisolwerte; teils bessere Schlafqualität.",
    dosierung: "300–600 mg Extrakt täglich.",
    timing: "Abends oder zweigeteilt.",
    dauer: "8–12 Wochen, dann Pause.",
    preis: "Mittel.",
    hinweis:
      "Nicht in Schwangerschaft/Stillzeit, nicht bei Schilddrüsen- oder Autoimmunerkrankungen ohne ärztliche Rücksprache.",
    quelle: "Salve et al. (2019); Della Pepa et al. Meta-Analyse (2021)",
    ziel: { muskelaufbau: 1, kraft: 1, recomposition: 1, fettabbau: 1, fitness: 1 },
    regeln: { schlafProblem: true },
    bonusText: "Kann bei hoher Stressbelastung und unruhigem Schlaf unterstützen.",
  },
  {
    id: "elektrolyte",
    name: "Elektrolyte (Natrium, Kalium)",
    kategorie: "Leistung",
    evidenz: "Hoch",
    wirkung:
      "Gleicht Schweißverluste aus – stabilisiert Blutdruck, Pump und Leistungsfähigkeit bei langen oder heißen Einheiten und in Diätphasen.",
    dosierung: "300–800 mg Natrium pro Trainingsstunde.",
    timing: "Vor und während der Belastung.",
    dauer: "Situativ.",
    preis: "Sehr günstig (Salz + Wasser).",
    hinweis: "Bei Bluthochdruck Natriumzufuhr ärztlich abstimmen.",
    quelle: "ACSM Position Stand Exercise and Fluid Replacement",
    ziel: { muskelaufbau: 1, kraft: 1, recomposition: 1, fettabbau: 2, fitness: 1 },
  },
  {
    id: "gruentee",
    name: "Grüntee-Extrakt (EGCG)",
    kategorie: "Umstritten",
    evidenz: "Niedrig",
    wirkung:
      "Erhöht den Energieverbrauch minimal (ca. 60–100 kcal/Tag in Studien) – klinisch kaum relevant für den Fettabbau.",
    dosierung: "300–500 mg EGCG.",
    timing: "Morgens.",
    dauer: "—",
    preis: "Ungünstig.",
    hinweis:
      "Hochdosierte Extrakte können in Einzelfällen die Leber belasten (EFSA-Warnung ab 800 mg EGCG/Tag).",
    quelle: "EFSA (2018); Jurgens et al. Cochrane Review (2012)",
    ziel: { muskelaufbau: 0, kraft: 0, recomposition: 0, fettabbau: 1, fitness: 0 },
  },
];

// ---------------------------------------------------------------------------
// Personalisierung
// ---------------------------------------------------------------------------

export type SuppKontext = {
  ziel: Goal;
  geschlecht: Geschlecht | null;
  alter: number | null;
  trainingstage: number;
  ernaehrungsform: string;
  schlafProblem?: boolean;
};

export type Stufe = "Priorität" | "Sinnvoll" | "Optional" | "Verzichtbar";

export type Empfehlung = {
  supp: Supplement;
  score: number;
  stufe: Stufe;
  gruende: string[];
};

export function empfehlungen(ctx: SuppKontext): Empfehlung[] {
  const vegan = /vegan|pflanz/i.test(ctx.ernaehrungsform);
  const alter = ctx.alter ?? 35;

  const liste = supplementDatenbank.map<Empfehlung>((s) => {
    const gruende: string[] = [];
    let score = evidenzRang[s.evidenz] * 2 + s.ziel[ctx.ziel] * 3;

    if (s.ziel[ctx.ziel] >= 2) gruende.push(`Hohe Relevanz für dein Ziel`);
    if (evidenzRang[s.evidenz] >= 4) gruende.push("Sehr belastbare Studienlage");
    if (evidenzRang[s.evidenz] <= 1) gruende.push("Nutzen wissenschaftlich nicht belegt");

    const r = s.regeln;
    if (r) {
      if (r.abAlter && alter >= r.abAlter) {
        score += 3;
        if (s.bonusText) gruende.push(s.bonusText);
      }
      if (r.geschlecht && ctx.geschlecht === r.geschlecht) {
        score += 3;
        if (s.bonusText) gruende.push(s.bonusText);
      }
      if (r.vegan) {
        if (vegan) {
          score += 4;
          if (s.bonusText) gruende.push(s.bonusText);
        } else {
          score -= 4;
        }
      }
      if (r.abTrainingstagen && ctx.trainingstage >= r.abTrainingstagen) {
        score += 2;
        if (s.bonusText) gruende.push(s.bonusText);
      }
      if (r.intensivIntervall && ctx.trainingstage >= 3 && ctx.ziel !== "kraft") {
        score += 2;
        if (s.bonusText) gruende.push(s.bonusText);
      }
      if (r.schlafProblem && ctx.schlafProblem) {
        score += 2;
        if (s.bonusText) gruende.push(s.bonusText);
      }
    }

    // Whey vs. veganes Protein sauber trennen
    if (vegan && (s.id === "whey" || s.id === "mehrkomponenten")) {
      score -= 6;
      gruende.push("Passt nicht zu deiner Ernährungsform");
    }

    const stufe: Stufe =
      score >= 16 ? "Priorität" : score >= 11 ? "Sinnvoll" : score >= 6 ? "Optional" : "Verzichtbar";

    return { supp: s, score, stufe, gruende: [...new Set(gruende)] };
  });

  return liste.sort((a, b) => b.score - a.score);
}

export const stufenFarbe: Record<Stufe, string> = {
  Priorität: "bg-primary/15 text-primary",
  Sinnvoll: "bg-success/15 text-success",
  Optional: "bg-secondary text-muted-foreground",
  Verzichtbar: "bg-destructive/10 text-destructive",
};

// ---------------------------------------------------------------------------
// Tagesplan: was wann einnehmen
// ---------------------------------------------------------------------------

export type Slot = {
  id: string;
  zeit: string;
  titel: string;
  hinweis: string;
};

export const tagesSlots: Slot[] = [
  { id: "morgens", zeit: "Morgens", titel: "Nach dem Aufstehen", hinweis: "Zum Frühstück – möglichst zur gleichen Zeit, das erhöht die Regelmäßigkeit." },
  { id: "vor", zeit: "30–60 Min. vorher", titel: "Vor dem Training", hinweis: "Leistungsrelevante Mittel wirken nur bei ausreichendem Vorlauf." },
  { id: "waehrend", zeit: "Während", titel: "Im Training", hinweis: "Nur bei langen oder sehr schweißintensiven Einheiten nötig." },
  { id: "nach", zeit: "0–2 Std. danach", titel: "Nach dem Training", hinweis: "Protein und Kreatin gemeinsam mit einer Mahlzeit oder einem Shake." },
  { id: "mahlzeit", zeit: "Zur Hauptmahlzeit", titel: "Zum Essen", hinweis: "Fettlösliche Vitamine und Mineralstoffe brauchen eine Mahlzeit." },
  { id: "abends", zeit: "Abends", titel: "Vor dem Schlafen", hinweis: "Beruhigende und regenerationsfördernde Mittel." },
];

/** Ordnet jedem Präparat den sinnvollsten Einnahmezeitpunkt zu. */
const slotVon: Record<string, string> = {
  creatin: "nach",
  whey: "nach",
  mehrkomponenten: "abends",
  veganprotein: "nach",
  eaa: "vor",
  bcaa: "vor",
  koffein: "vor",
  citrullin: "vor",
  betaalanin: "vor",
  arginin: "vor",
  gruentee: "morgens",
  carnitin: "mahlzeit",
  elektrolyte: "waehrend",
  vitd3: "mahlzeit",
  omega3: "mahlzeit",
  b12: "morgens",
  eisen: "morgens",
  magnesium: "abends",
  ashwagandha: "abends",
  kollagen: "vor",
  hmb: "mahlzeit",
};

export type TagesplanEintrag = { supp: Supplement; stufe: Stufe; slot: string };

export type TagesplanSlot = Slot & { eintraege: TagesplanEintrag[] };

/**
 * Baut einen konkreten Einnahmeplan aus den Empfehlungen: nur Präparate der
 * Stufen „Priorität“ und „Sinnvoll“, sortiert nach Relevanz, je Zeitfenster.
 */
export function tagesplan(ctx: SuppKontext, trainingstag = true): TagesplanSlot[] {
  const relevant = empfehlungen(ctx).filter(
    (e) => e.stufe === "Priorität" || e.stufe === "Sinnvoll",
  );

  const eintraege: TagesplanEintrag[] = relevant.map((e) => ({
    supp: e.supp,
    stufe: e.stufe,
    slot: slotVon[e.supp.id] ?? "mahlzeit",
  }));

  const trainingSlots = new Set(["vor", "waehrend", "nach"]);

  return tagesSlots
    .map((s) => ({
      ...s,
      eintraege: eintraege.filter(
        (e) => e.slot === s.id && (trainingstag || !trainingSlots.has(e.slot) || e.supp.id === "creatin"),
      ),
    }))
    .map((s) =>
      !trainingstag && s.id === "nach"
        ? { ...s, zeit: "Zu einer Mahlzeit", titel: "Kreatin am trainingsfreien Tag" }
        : s,
    )
    .filter((s) => s.eintraege.length > 0);
}
