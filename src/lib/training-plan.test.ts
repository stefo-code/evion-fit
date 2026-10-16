import { describe, expect, it } from "vitest";
import { erzeugePlan, standardKontext, migrierePersoenlichenPlan, legePersoenlichenPlanAn, type PlanKontext, type PlanEinstellungen } from "@/lib/training-plan";
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

describe("persönlicher Plan – Push/Pull-Umstellung", () => {
  const basis = {
    fokus: "ausgewogen", tausch: {}, entfernt: {}, zusatz: { "100": ["brustpresse"] }, reihenfolge: {}, eigene: [],
    trainingstage: null, titel: {}, zuordnung: {}, pauseSek: 60,
    vorlagen: [
      { index: 100, titel: "Oberkörper A" }, { index: 101, titel: "Push" },
      { index: 102, titel: "Pull" }, { index: 103, titel: "Oberkörper B" },
    ],
    rotation: [100, 101, 102, 103], ohneBooster: [103], persoenlichV1: true,
  } as unknown as PlanEinstellungen;

  it("stellt einen bestehenden 4er-Plan auf Push A / Pull A / Push B / Pull B um", () => {
    const m = migrierePersoenlichenPlan(basis);
    expect(m.persoenlichV2).toBe(true);
    expect(m.vorlagen.map((v) => v.titel)).toEqual(["Push A", "Pull A", "Push B", "Pull B"]);
    expect(m.rotation).toEqual([100, 101, 102, 103]);
    expect(m.naechster?.index).toBe(100);
    expect(m.zusatz["100"]).toContain("eigen-p-waden-beinpresse");
    expect(m.zusatz["101"]![0]).toBe("rdl-kh");
    expect(m.zusatz["103"]).toContain("wadenheben");
    expect(m.ohneBooster).toEqual([103]);
    expect(m.aufwaermen?.["103"]?.some((t) => t.includes("Face Pulls"))).toBe(true);
    expect(m.aufwaermen?.["100"]?.[0]).toContain("Face Pulls");
  });

  it("lässt Nutzer ohne persönlichen Plan unverändert", () => {
    const ohne = { ...basis, persoenlichV1: false } as PlanEinstellungen;
    expect(migrierePersoenlichenPlan(ohne)).toBe(ohne);
  });

  it("legt den Plan für neue Nutzer direkt als Push/Pull an", () => {
    const neu = legePersoenlichenPlanAn({ ...basis, vorlagen: [], rotation: [], persoenlichV1: false } as PlanEinstellungen);
    expect(neu.vorlagen.map((v) => v.titel)).toEqual(["Push A", "Pull A", "Push B", "Pull B"]);
    expect(neu.persoenlichV2).toBe(true);
  });
});

describe("persönlicher Plan – robuste Erkennung", () => {
  it("erkennt alte Templates auch ohne Flag (über Titel) und setzt Push A als nächstes", () => {
    const alt = {
      fokus: "ausgewogen", tausch: {}, entfernt: {}, reihenfolge: {}, eigene: [], trainingstage: null, titel: {}, zuordnung: {}, pauseSek: 60,
      zusatz: { "120": ["eigen-p-schraegbank-kh"], "121": ["bank-kh"], "122": ["latzug"], "123": ["facepull"] },
      vorlagen: [
        { index: 120, titel: "Oberkörper A" }, { index: 121, titel: "Push" },
        { index: 122, titel: "Pull" }, { index: 123, titel: "Oberkörper B" },
      ],
      rotation: [120, 121, 122, 123],
    } as unknown as PlanEinstellungen;
    const m = migrierePersoenlichenPlan(alt);
    expect(m.vorlagen.map((v) => v.titel)).toEqual(["Push A", "Pull A", "Push B", "Pull B"]);
    expect(m.naechster?.index).toBe(120);
    expect(migrierePersoenlichenPlan(m)).toBe(m);
  });
});

describe("erzeugePlan – ausgewogene Einheiten", () => {
  const studio = { equipment: ["langhantel", "kurzhantel", "kabel", "maschine", "körpergewicht"] } as Partial<PlanKontext>;
  it("Oberkörper-Tage (4×60) enthalten vertikales + horizontales Ziehen, Bizeps und Trizeps", () => {
    const plan = erzeugePlan(kontext({ ...studio, tage: 4, dauer: 60 }));
    for (const t of plan.filter((x) => x.titel.startsWith("Oberkörper"))) {
      const n = t.uebungen.map((u) => u.name).join(" | ");
      expect(/latzug|klimmzug/i.test(n)).toBe(true);
      expect(/rudern/i.test(n)).toBe(true);
      expect(t.uebungen.some((u) => u.muskel === "Bizeps")).toBe(true);
      expect(t.uebungen.some((u) => u.muskel === "Trizeps")).toBe(true);
    }
  });
  it("Oberkörper A und B nutzen unterschiedliche Übungen", () => {
    const plan = erzeugePlan(kontext({ ...studio, tage: 4, dauer: 60 }));
    const a = plan.find((t) => t.titel === "Oberkörper A")!.uebungen.map((u) => u.id);
    const b = plan.find((t) => t.titel === "Oberkörper B")!.uebungen.map((u) => u.id);
    expect(a.filter((id) => b.includes(id)).length).toBeLessThanOrEqual(2);
  });
  it("Waden stehen nie an erster Stelle", () => {
    for (const tage of [2, 3, 4, 5, 6]) {
      for (const t of erzeugePlan(kontext({ tage, dauer: 45, equipment: ["kurzhantel", "körpergewicht"] as PlanKontext["equipment"] }))) {
        expect(t.uebungen[0]?.muskel).not.toBe("Waden");
      }
    }
  });
});
