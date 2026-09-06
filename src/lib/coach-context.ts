/**
 * Baut aus allen lokal gespeicherten Daten einen kompakten, lesbaren
 * Datenauszug für den KI-Coach. Bewusst als Text (kein JSON-Dump), damit das
 * Modell die Werte sauber interpretieren und zitieren kann.
 */

import {
  einheitenSeit,
  koerperKennzahlen,
  letzterWert,
  messFelder,
  mittel,
  readinessAusMessungen,
  recompSignal,
  rekorde,
  streak,
  tageSeitMessung,
  veraenderung,
  volumen,
  muskelBelastung,
  erfolgsStatus,
  type Aktivitaet,
} from "@/lib/activity-store";
import { summiere, type Ernaehrung } from "@/lib/nutrition-store";
import {
  berechnePlan,
  effektivesProfil,
  type OnboardingProfil,
} from "@/lib/onboarding-store";
import { aktiveTrainingstage, wochentage, type PlanEinstellungen } from "@/lib/training-plan";

const n = (v: number | null | undefined, digits = 1) =>
  v === null || v === undefined ? "—" : v.toLocaleString("de-DE", { maximumFractionDigits: digits });

const delta = (v: number | null, einheit: string) =>
  v === null ? "—" : `${v > 0 ? "+" : ""}${n(v)} ${einheit}`;

const tagKey = (d: Date) => d.toISOString().slice(0, 10);

export type CoachDaten = {
  aktivitaet: Aktivitaet;
  ernaehrung: Ernaehrung;
  profil: OnboardingProfil;
  plan: PlanEinstellungen;
};

export function baueCoachKontext({ aktivitaet, ernaehrung, profil, plan }: CoachDaten): string {
  const eff = effektivesProfil(profil);
  const ziele = berechnePlan(profil);
  const k = koerperKennzahlen(aktivitaet, eff.groesse);
  const bereit = readinessAusMessungen(aktivitaet);
  const recomp = recompSignal(aktivitaet);
  const zeilen: string[] = [];

  zeilen.push(`Datum heute: ${new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}`);

  // Profil
  zeilen.push(
    "\n## Profil",
    `Name: ${eff.name}`,
    `Geschlecht: ${profil.geschlecht ?? "unbekannt"} | Alter: ${eff.alter ?? "—"} | Größe: ${eff.groesse ?? "—"} cm`,
    `Ziel: ${eff.ziel} | Zielgewicht: ${eff.zielGewicht ?? "—"} kg | Tempo: ${profil.tempo} | Recomp-Fokus: ${profil.recompFokus}`,
    `Erfahrung: ${eff.erfahrung} | geplante Einheiten/Woche: ${eff.trainingstage} à ${eff.dauer} min`,
    `Trainingstage: ${aktiveTrainingstage(plan, eff.trainingstage).map((d) => wochentage[d]).join(", ")}`,
    `Trainingsorte: ${profil.orte.join(", ") || "—"} | Equipment: ${profil.equipment.join(", ") || "—"}`,
    `Ernährungsform: ${eff.ernaehrungsform} | Mahlzeiten/Tag: ${profil.mahlzeiten}`,
    `Allergien: ${profil.allergien.join(", ") || "keine angegeben"} | vermeidet: ${profil.vermiedeneLebensmittel || "—"}`,
    `Mag: ${profil.mag || "—"} | mag nicht: ${profil.vermeiden || "—"} | Lieblingsgerichte: ${profil.lieblingsgerichte || "—"}`,
    `Einschränkungen/Gesundheit: ${[...profil.einschraenkungen, profil.gesundheitNotiz].filter(Boolean).join("; ") || "keine angegeben"}`,
    `Berechnete Tagesziele: ${ziele.kalorien} kcal, ${ziele.protein} g Protein, ${ziele.kohlenhydrate} g KH, ${ziele.fett} g Fett, ${ziele.schritte} Schritte`,
  );

  // Körper
  zeilen.push(
    "\n## Körperwerte (zuletzt erfasst)",
    k.datum ? `Letzte Messung: ${new Date(k.datum).toLocaleDateString("de-DE")} (vor ${tageSeitMessung(aktivitaet) ?? "?"} Tagen)` : "Noch keine Messung erfasst.",
    `Gewicht: ${n(k.gewicht)} kg | Körperfett: ${n(k.koerperfett)} % | Wasser: ${n(k.wasser)} % | Muskeln: ${n(k.muskeln)} %`,
    `Fettmasse: ${n(k.fettmasse)} kg | Magermasse: ${n(k.magermasse)} kg | BMI: ${n(k.bmi)}`,
    `Veränderung Gewicht: 7 T ${delta(veraenderung(aktivitaet, "gewicht", 7), "kg")}, 30 T ${delta(veraenderung(aktivitaet, "gewicht", 30), "kg")}, 90 T ${delta(veraenderung(aktivitaet, "gewicht", 90), "kg")}`,
    `Veränderung Körperfett: 30 T ${delta(veraenderung(aktivitaet, "koerperfett", 30), "%")} | Taille 30 T ${delta(veraenderung(aktivitaet, "taille", 30), "cm")}`,
    recomp
      ? `Recomposition-Signal: Fettmasse ${delta(recomp.fett, "kg")}, Magermasse ${delta(recomp.mager, "kg")} (${recomp.positiv ? "positiv" : "nicht positiv"})`
      : "Recomposition-Signal: zu wenig Daten",
  );

  const umfaenge = messFelder
    .filter((f) => f.gruppe === "umfang")
    .map((f) => {
      const w = letzterWert(aktivitaet, f.key);
      return w ? `${f.label} ${n(w.wert)} ${f.einheit}` : null;
    })
    .filter(Boolean);
  if (umfaenge.length) zeilen.push(`Umfänge: ${umfaenge.join(" | ")}`);

  // Erholung
  zeilen.push(
    "\n## Erholung & Alltag (Durchschnitt 7 Tage)",
    `Schlaf: ${n(mittel(aktivitaet, "schlafStunden", 7))} h | Schlafqualität: ${n(mittel(aktivitaet, "schlafQualitaet", 7))}/5 | Energie: ${n(mittel(aktivitaet, "energie", 7))}/5`,
    `Stress: ${n(mittel(aktivitaet, "stress", 7))}/5 | Muskelkater: ${n(mittel(aktivitaet, "muskelkater", 7))}/5`,
    `Ruhepuls: ${n(mittel(aktivitaet, "ruhepuls", 7))} bpm | HRV: ${n(mittel(aktivitaet, "hrv", 7))} ms | Schritte: ${n(mittel(aktivitaet, "schritte", 7), 0)}/Tag`,
    bereit ? `Bereitschaft heute: ${bereit.score}/100 (${bereit.gruende.join(", ")})` : "Bereitschaft: keine aktuellen Erholungswerte",
  );

  // Training
  const e7 = einheitenSeit(aktivitaet, 7);
  const e30 = einheitenSeit(aktivitaet, 30);
  const vol = (list: typeof e7) => list.reduce((s, e) => s + volumen(e.saetze), 0);
  zeilen.push(
    "\n## Training",
    `Einheiten: ${e7.length} in 7 Tagen, ${e30.length} in 30 Tagen, ${aktivitaet.einheiten.length} insgesamt | Streak: ${streak(aktivitaet)} Wochen`,
    `Volumen: ${n(vol(e7), 0)} kg in 7 Tagen, ${n(vol(e30), 0)} kg in 30 Tagen`,
  );
  const letzte = aktivitaet.einheiten.slice(-5).reverse();
  if (letzte.length) {
    zeilen.push("Letzte Einheiten:");
    for (const e of letzte) {
      const top = e.saetze
        .slice(0, 12)
        .map((s) => `${s.name} ${s.gewicht}kg×${s.wdh}${s.rpe ? ` @RPE${s.rpe}` : ""}`)
        .join("; ");
      zeilen.push(`- ${new Date(e.datum).toLocaleDateString("de-DE")} ${e.titel} (${e.dauerMin} min, ${e.saetze.length} Sätze): ${top || "keine Sätze"}`);
    }
  }
  const belastung = muskelBelastung(aktivitaet, 7);
  const bl = Object.entries(belastung)
    .sort((a, b) => b[1] - a[1])
    .map(([m, s]) => `${m}: ${s} Sätze`);
  if (bl.length) zeilen.push(`Sätze je Muskelgruppe (7 Tage): ${bl.join(", ")}`);
  const pr = rekorde(aktivitaet).slice(0, 8);
  if (pr.length)
    zeilen.push(
      `Persönliche Bestwerte (e1RM): ${pr.map((r) => `${r.name} ${n(r.e1rm, 0)} kg (${r.gewicht}×${r.wdh})`).join(", ")}`,
    );

  // Ernährung
  const heute = tagKey(new Date());
  const heuteM = ernaehrung.mahlzeiten.filter((m) => m.datum.slice(0, 10) === heute);
  const hs = summiere(heuteM);
  const tage7 = [...Array(7)].map((_, i) => tagKey(new Date(Date.now() - i * 86400000)));
  const werte7 = tage7.map((t) => summiere(ernaehrung.mahlzeiten.filter((m) => m.datum.slice(0, 10) === t)));
  const mitDaten = werte7.filter((w) => w.kcal > 0);
  const schnitt = (f: keyof typeof hs) =>
    mitDaten.length ? Math.round(mitDaten.reduce((s, w) => s + w[f], 0) / mitDaten.length) : null;
  zeilen.push(
    "\n## Ernährung",
    `Heute protokolliert: ${hs.kcal} kcal, ${hs.protein} g Protein, ${hs.kh} g KH, ${hs.fett} g Fett (${heuteM.length} Mahlzeiten)`,
    `Wasser heute: ${ernaehrung.wasser[heute] ?? 0} ml`,
    mitDaten.length
      ? `Schnitt der protokollierten Tage (7 T, ${mitDaten.length} Tage): ${schnitt("kcal")} kcal, ${schnitt("protein")} g Protein, ${schnitt("kh")} g KH, ${schnitt("fett")} g Fett`
      : "In den letzten 7 Tagen wurde keine Mahlzeit protokolliert.",
  );
  if (heuteM.length)
    zeilen.push(`Mahlzeiten heute: ${heuteM.map((m) => `${m.name} (${m.kcal} kcal, ${m.protein} g P)`).join("; ")}`);
  if (ernaehrung.vorrat.length) zeilen.push(`Vorrat zu Hause: ${ernaehrung.vorrat.join(", ")}`);

  // Erfolge
  const erf = erfolgsStatus(aktivitaet);
  const offen = erf.filter((e) => !e.erreicht).slice(0, 4);
  zeilen.push(
    "\n## Erfolge",
    `Erreicht: ${erf.filter((e) => e.erreicht).length} von ${erf.length}`,
    offen.length ? `Nächste Meilensteine: ${offen.map((e) => `${e.titel} (${n(e.aktuell, 0)}/${e.ziel})`).join(", ")}` : "Alle Meilensteine erreicht.",
  );

  return zeilen.join("\n");
}
