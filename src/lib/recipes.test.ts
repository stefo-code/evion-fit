import { describe, expect, it } from "vitest";
import { rezepte } from "@/lib/recipes";

describe("Rezeptdatenbank", () => {
  it("enthält mindestens 120 Rezepte", () => {
    expect(rezepte.length).toBeGreaterThanOrEqual(120);
  });

  it("deckt die geforderten Ernährungsformen ausreichend ab", () => {
    expect(rezepte.filter((r) => r.vegetarisch).length).toBeGreaterThanOrEqual(25);
    expect(rezepte.filter((r) => r.vegan).length).toBeGreaterThanOrEqual(15);
    expect(rezepte.filter((r) => r.pescetarisch).length).toBeGreaterThanOrEqual(15);
  });

  it("deckt alle geforderten Küchen ab", () => {
    const kuechen = new Set(rezepte.map((r) => r.kueche));
    for (const k of ["mediterran", "asiatisch", "mexikanisch", "orientalisch", "indisch", "schweizerisch-deutsch"]) {
      expect(kuechen.has(k as never)).toBe(true);
    }
  });

  it("deckt alle Mahlzeitentypen ab", () => {
    const typen = new Set(rezepte.map((r) => r.mahlzeit));
    for (const t of ["Frühstück", "Mittag", "Abend", "Snack", "Pre-Workout", "Post-Workout"]) {
      expect(typen.has(t as never)).toBe(true);
    }
  });

  it("deckt alle Zubereitungszeit-Stufen ab (≤10/≤20/≤40 Minuten)", () => {
    expect(rezepte.some((r) => r.zeit <= 10)).toBe(true);
    expect(rezepte.some((r) => r.zeit <= 20)).toBe(true);
    expect(rezepte.some((r) => r.zeit <= 40)).toBe(true);
  });

  it("hat Meal-Prep- und günstige Rezepte", () => {
    expect(rezepte.filter((r) => r.mealPrep).length).toBeGreaterThan(0);
    expect(rezepte.filter((r) => r.budget).length).toBeGreaterThan(0);
  });

  it("hat plausible Makros (kcal ≈ 4×Protein + 4×KH + 9×Fett, ±10 %)", () => {
    for (const r of rezepte) {
      const berechnet = 4 * r.protein + 4 * r.kh + 9 * r.fett;
      const abweichung = Math.abs(berechnet - r.kcal) / r.kcal;
      expect(abweichung, `${r.name}: ${r.kcal} kcal vs. berechnet ${berechnet}`).toBeLessThanOrEqual(0.1);
    }
  });

  it("erfüllt die Zielvorgaben je zielEignung (kcal & Mindestprotein)", () => {
    for (const r of rezepte) {
      if (r.zielEignung.includes("fettabbau")) {
        expect(r.kcal).toBeGreaterThanOrEqual(290);
        expect(r.kcal).toBeLessThanOrEqual(570);
        expect(r.protein).toBeGreaterThanOrEqual(28);
      }
      if (r.zielEignung.includes("muskelaufbau")) {
        expect(r.kcal).toBeGreaterThanOrEqual(590);
        expect(r.protein).toBeGreaterThanOrEqual(38);
      }
    }
  });

  it("hat eindeutige IDs", () => {
    const ids = new Set(rezepte.map((r) => r.id));
    expect(ids.size).toBe(rezepte.length);
  });
});
