/**
 * Gemeinsame Dauer- und Aufwärm-Berechnung für Home, Training und Workout.
 *
 * Wird von mehreren Seiten genutzt, damit die angezeigte Trainingsdauer und
 * das vorgeschlagene Aufwärmen überall identisch sind.
 */
import type { PlanEinstellungen, Trainingstag } from "@/lib/training-plan";

const STANDARD_PAUSE_GRUND = 150;
const STANDARD_PAUSE_ISO = 75;
/** Angenommene Dauer eines einzelnen Arbeitssatzes inkl. Ein-/Ausstieg. */
const SATZDAUER_SEK = 40;
/** Pauschale für Aufwärmen in Minuten, sofern kein individuelles Aufwärmen hinterlegt ist. */
const AUFWAERMEN_MIN = 6;

/** Pause nach einem Satz: 150 s für Grundübungen, 75 s für Isolationsübungen (in Einstellungen änderbar). */
export function pauseFuer(
  u: { typ?: string; id: string } & Record<string, unknown>,
  e: PlanEinstellungen,
): number {
  const pauseGrund = e.pauseGrundSek ?? STANDARD_PAUSE_GRUND;
  const pauseIso = e.pauseIsoSek ?? STANDARD_PAUSE_ISO;
  const istGrund =
    typeof u["grund"] === "boolean"
      ? (u["grund"] as boolean)
      : u.typ === "grund"
        ? true
        : u.typ === "isolation"
          ? false
          : true;
  return istGrund ? pauseGrund : pauseIso;
}

/** Art der Einheit anhand des Titels/der Übungen bestimmen. */
function artDesTages(t: Trainingstag): "oberkoerper" | "unterkoerper" | "ganzkoerper" {
  const titel = t.titel.toLowerCase();
  const unterMuster = new Set(["kniebeuge", "huefte"]);
  const oberMuster = new Set(["druecken", "ziehen", "schulter", "arme"]);
  const anteilUnten = t.uebungen.filter((u) => unterMuster.has(u.muster)).length;
  const anteilOben = t.uebungen.filter((u) => oberMuster.has(u.muster)).length;

  if (titel.includes("unterkörper") || titel.includes("bein") || titel.includes("gesäß")) return "unterkoerper";
  if (titel.includes("oberkörper") || titel.includes("push") || titel.includes("pull")) return "oberkoerper";
  if (anteilUnten > 0 && anteilOben === 0) return "unterkoerper";
  if (anteilOben > 0 && anteilUnten === 0) return "oberkoerper";
  return "ganzkoerper";
}

/** Standard-Aufwärmprogramm passend zum Trainingstyp, inkl. Einschränkungen. */
export function standardAufwaermen(
  t: Trainingstag,
  e: PlanEinstellungen,
  einschraenkungen: string[],
): string[] {
  const override = e.aufwaermen?.[String(t.index)];
  if (override && override.length > 0) return override;

  const art = artDesTages(t);
  const basis: string[] =
    art === "oberkoerper"
      ? ["5 min Rudergerät locker", "Face Pulls", "Band Pull-Aparts"]
      : art === "unterkoerper"
        ? ["5 min Ergometer locker", "Glute Bridge", "Leichte Goblet Squats"]
        : ["5 min Rudergerät oder Ergometer locker", "Glute Bridge", "Band Pull-Aparts"];

  const schulterEinschraenkung = einschraenkungen.some((x) => x.toLowerCase().includes("schulter"));
  return schulterEinschraenkung ? [...basis, "Y-Raises"] : basis;
}

/** Dauer in Minuten: Sätze × (Satzdauer + Pause) je Übung, plus Aufwärmen. */
export function berechneDauerMin(template: Trainingstag, einstellungen: PlanEinstellungen): number {
  const arbeitSek = template.uebungen.reduce((summe, u) => {
    const pause = pauseFuer(u, einstellungen);
    return summe + u.zielSaetze * (SATZDAUER_SEK + pause);
  }, 0);
  return Math.round(arbeitSek / 60 + AUFWAERMEN_MIN);
}
