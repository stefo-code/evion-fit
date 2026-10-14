import { describe, expect, it } from "vitest";
import { erzeugePlan, standardKontext, type PlanKontext } from "@/lib/training-plan";
import { uebungById, type Einschraenkung } from "@/lib/exercise-library";

const SPLIT_TITEL: Record<number, string[]> = {
  2: ["Ganzkörper A", "Ganzkörper B"],
  3: ["Ganzkörper A", "Ganzkörper B", "Ganzkörper C"],
  4: ["Oberkörper A", "Unterkörper A", "Oberkörper B", "Unterkörper B"],
  5: ["Oberkörper", "Unterkörper", "Push", "Pull", "Beine"],
  6: ["Push A", "Pull A", "Beine A", "Push B", "Pull B", "Beine B"],
};

const SATZ_BUDGET: Record<number, [number, number]> = {
  30: [8, 10],
  45: [12, 15],
  60: [16, 20],
};

function kontext(overrides: Partial<PlanKontext>): PlanKontext {
  return { ...standardKontext, ...overrides };
}

describe("erzeugePlan – Splits, Satzbudget & Sicherheit", () => {
  for (const tage of [2, 3, 4, 5, 6]) {
    for (const dauer of [30, 45, 60]) {
      it(`tage=${tage} dauer=${dauer}: korrekter Split, Satzbudget, kein Rumpf im Haupttemplate`, () => {
        const plan = erzeugePlan(kontext({ tage, dauer }));
        expect(plan.map((t) => t.titel)).toEqual(SPLIT_TITEL[tage]);

        const [min, max] = SATZ_BUDGET[dauer]!;
        for (const tag of plan) {
          expect(tag.uebungen.some((u) => u.muster === "core")).toBe(false);
          const summe = tag.uebungen.reduce((a, u) => a + u.zielSaetze, 0);
          expect(summe).toBeGreaterThanOrEqual(min);
          expect(summe).toBeLessThanOrEqual(max);
        }
      });
    }
  }
});

describe("erzeugePlan – harte Einschränkungsfilter", () => {
  const einschraenkungen: Einschraenkung[] = ["schulter", "ruecken", "knie", "huefte"];

  for (const tage of [2, 3, 4, 5, 6]) {
    for (const dauer of [30, 45, 60]) {
      it(`tage=${tage} dauer=${dauer}: keine meidetBei-Verletzung`, () => {
        const plan = erzeugePlan(kontext({ tage, dauer, einschraenkungen }));
        for (const tag of plan) {
          for (const u of tag.uebungen) {
            const lib = uebungById.get(u.id);
            const meidet = lib?.meidetBei ?? [];
            expect(meidet.some((e) => einschraenkungen.includes(e))).toBe(false);
          }
        }
      });
    }
  }
});

describe("erzeugePlan – kein Geschlechts-Einfluss", () => {
  for (const tage of [2, 3, 4, 5, 6]) {
    for (const dauer of [30, 45, 60]) {
      it(`tage=${tage} dauer=${dauer}: Männer und Frauen erhalten denselben Plan`, () => {
        const planM = erzeugePlan(kontext({ tage, dauer, geschlecht: "maennlich" }));
        const planW = erzeugePlan(kontext({ tage, dauer, geschlecht: "weiblich" }));
        expect(planM.map((t) => t.uebungen.map((u) => u.id))).toEqual(
          planW.map((t) => t.uebungen.map((u) => u.id)),
        );
      });
    }
  }
});

describe("erzeugePlan – Arme folgen dem Tag", () => {
  it("Push-Tag bevorzugt Trizeps, Pull-Tag bevorzugt Bizeps (6-Tage-Split)", () => {
    const plan = erzeugePlan(kontext({ tage: 6, dauer: 60 }));
    const push = plan.find((t) => t.titel === "Push A")!;
    const pull = plan.find((t) => t.titel === "Pull A")!;
    const armeAufPush = push.uebungen.filter((u) => u.muster === "arme");
    const armeAufPull = pull.uebungen.filter((u) => u.muster === "arme");
    if (armeAufPush.length > 0) expect(armeAufPush.some((u) => u.muskel === "Trizeps")).toBe(true);
    if (armeAufPull.length > 0) expect(armeAufPull.some((u) => u.muskel === "Bizeps")).toBe(true);
  });
});

describe("erzeugePlan – Oberkörper-Fokus begrenzt Beinübungen", () => {
  it("arme-straffen: höchstens 2 Bein-Übungen pro Woche", () => {
    const plan = erzeugePlan(kontext({ tage: 6, dauer: 60, fokus: "arme-straffen" }));
    const beinUebungen = plan.flatMap((t) =>
      t.uebungen.filter((u) => u.muster === "kniebeuge" || u.muster === "huefte"),
    );
    expect(beinUebungen.length).toBeLessThanOrEqual(2);
  });
});
