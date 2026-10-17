import { describe, expect, it } from "vitest";
import { rezepte } from "@/lib/recipes";
import {
  naehrwertTabelle,
  rezeptDefinitionen,
  rezepteDatenbank,
  zielBaender,
  type ZielBand,
  type ZielEignung,
} from "@/lib/recipes-data";

const neueIds = new Set(rezepteDatenbank.map((r) => r.id));
const tierischNichtVegan = new Set(["milch", "ei", "honig", "fleisch", "fisch", "meeresfruechte"]);

describe("Rezeptdatenbank", () => {
  it("enthält die 18 Klassiker plus mindestens 120 ausformulierte Rezepte", () => {
    expect(rezepteDatenbank.length).toBeGreaterThanOrEqual(120);
    expect(rezepte.length).toBe(rezepteDatenbank.length + 18);
  });

  it("deckt die geforderten Ernährungsformen ausreichend ab", () => {
    expect(rezepteDatenbank.filter((r) => r.vegan).length).toBeGreaterThanOrEqual(20);
    expect(rezepteDatenbank.filter((r) => r.vegetarisch && !r.vegan).length).toBeGreaterThanOrEqual(
      20,
    );
    expect(rezepteDatenbank.filter((r) => r.pescetarisch).length).toBeGreaterThanOrEqual(20);
    expect(
      rezepteDatenbank.filter((r) => !r.vegetarisch && !r.pescetarisch).length,
    ).toBeGreaterThanOrEqual(20);
  });

  it("deckt alle Küchen und jeden Mahlzeitentyp mehrfach ab", () => {
    for (const k of [
      "mediterran",
      "asiatisch",
      "mexikanisch",
      "orientalisch",
      "indisch",
      "schweizerisch-deutsch",
    ]) {
      expect(rezepteDatenbank.filter((r) => r.kueche === k).length, k).toBeGreaterThanOrEqual(10);
    }
    for (const t of ["Frühstück", "Mittag", "Abend", "Snack", "Pre-Workout", "Post-Workout"]) {
      expect(rezepteDatenbank.filter((r) => r.mahlzeit === t).length, t).toBeGreaterThanOrEqual(10);
    }
  });

  it("deckt alle Zubereitungszeit-Stufen ab (≤10/≤20/≤40 Minuten)", () => {
    expect(rezepte.some((r) => r.zeit <= 10)).toBe(true);
    expect(rezepte.some((r) => r.zeit > 10 && r.zeit <= 20)).toBe(true);
    expect(rezepte.some((r) => r.zeit > 20 && r.zeit <= 40)).toBe(true);
  });

  it("hat Meal-Prep- und günstige Rezepte", () => {
    expect(rezepteDatenbank.filter((r) => r.mealPrep).length).toBeGreaterThanOrEqual(10);
    expect(rezepteDatenbank.filter((r) => r.budget).length).toBeGreaterThanOrEqual(10);
  });

  it("hat eindeutige IDs", () => {
    const ids = new Set(rezepte.map((r) => r.id));
    expect(ids.size).toBe(rezepte.length);
  });
});

describe("Ernährungsformen aus den Zutaten", () => {
  it("kein veganes Rezept enthält Milchprodukte, Ei oder Honig (laut Nährwerttabelle)", () => {
    for (const d of rezeptDefinitionen) {
      const r = rezepteDatenbank.find((x) => x.id === d.id)!;
      if (!r.vegan) continue;
      for (const k of d.zutaten) {
        const herkunft = (naehrwertTabelle[k] as { t?: string }).t;
        expect(herkunft && tierischNichtVegan.has(herkunft), `${r.name}: ${k}`).toBeFalsy();
      }
    }
  });

  it("kein veganes Rezept nennt Milch, Ei, Honig & Co. in der Zutatenliste (alle Rezepte)", () => {
    const verboten =
      /(^|[^a-zäöüß])(milch|honig|butter|quark|magerquark|skyr|joghurt|ei|eier|eiklar|whey|feta|paneer|halloumi|parmesan|mozzarella|gruyère|ricotta|rahm|kochrahm)([^a-zäöüß]|$)|hüttenkäse/i;
    for (const r of rezepte.filter((x) => x.vegan)) {
      for (const zt of r.zutaten)
        expect(verboten.test(zt.text), `${r.name}: ${zt.text}`).toBe(false);
    }
  });

  it("kein vegetarisches Rezept enthält Fleisch oder Fisch", () => {
    for (const d of rezeptDefinitionen) {
      const r = rezepteDatenbank.find((x) => x.id === d.id)!;
      if (!r.vegetarisch) continue;
      for (const k of d.zutaten) {
        const herkunft = (naehrwertTabelle[k] as { t?: string }).t;
        expect(
          ["fleisch", "fisch", "meeresfruechte"].includes(herkunft ?? ""),
          `${r.name}: ${k}`,
        ).toBe(false);
      }
    }
  });

  it("pescetarische Rezepte enthalten Fisch/Meeresfrüchte, aber kein Fleisch", () => {
    for (const d of rezeptDefinitionen) {
      const r = rezepteDatenbank.find((x) => x.id === d.id)!;
      if (!r.pescetarisch) continue;
      const herkunft = d.zutaten.map((k) => (naehrwertTabelle[k] as { t?: string }).t);
      expect(herkunft.includes("fleisch"), r.name).toBe(false);
      expect(
        herkunft.some((h) => h === "fisch" || h === "meeresfruechte"),
        r.name,
      ).toBe(true);
    }
  });
});

describe("Allergene aus den Zutaten", () => {
  it("entsprechen exakt der Vereinigung der Zutaten-Allergene", () => {
    for (const d of rezeptDefinitionen) {
      const r = rezepteDatenbank.find((x) => x.id === d.id)!;
      const erwartet = new Set(
        d.zutaten.flatMap((k) => (naehrwertTabelle[k] as { a?: string[] }).a ?? []),
      );
      expect(new Set(r.allergene), r.name).toEqual(erwartet);
    }
  });

  it("Stichproben: typische Zutaten führen zum passenden Allergen (alle Rezepte)", () => {
    const regeln: [RegExp, string][] = [
      [/tofu|soja|edamame|tempeh|miso/i, "soja"],
      [
        /haferflocken|vollkornbrot|ruchbrot|knäckebrot|nudeln|hörnli|spaghetti|lasagne|couscous|bulgur|fladenbrot|weizentortilla|seitan|wrap/i,
        "gluten",
      ],
      [/lachs|thunfisch|kabeljau|forelle|zander/i, "fisch"],
      [/garnelen/i, "meeresfruechte"],
      [/\beier?\b|eiklar/i, "ei"],
      [
        /skyr|quark|joghurt(?!.*soja)|milch(?<!kokosmilch)|feta|käse|paneer|halloumi|parmesan|mozzarella|gruyère|butter|rahm|whey/i,
        "laktose",
      ],
      [/mandel|walnüsse|cashew|erdnuss|nüsse/i, "nuesse"],
    ];
    for (const r of rezepte) {
      for (const zt of r.zutaten) {
        if (/sojajoghurt|sojadrink|kokosmilch/i.test(zt.text) && !/skyr|quark/i.test(zt.text))
          continue;
        for (const [re, a] of regeln) {
          if (re.test(zt.text)) expect(r.allergene, `${r.name}: ${zt.text} → ${a}`).toContain(a);
        }
      }
    }
  });
});

describe("Nährwerte", () => {
  it("hat plausible Makros (kcal ≈ 4×Protein + 4×KH + 9×Fett, ±10 %)", () => {
    for (const r of rezepte) {
      const berechnet = 4 * r.protein + 4 * r.kh + 9 * r.fett;
      const abweichung = Math.abs(berechnet - r.kcal) / r.kcal;
      expect(
        abweichung,
        `${r.name}: ${r.kcal} kcal vs. berechnet ${berechnet}`,
      ).toBeLessThanOrEqual(0.1);
    }
  });

  it("Nährwerttabelle ist in sich stimmig (kcal ≈ Makros, Ballaststoffe toleriert)", () => {
    for (const [key, l] of Object.entries(naehrwertTabelle)) {
      if (l.kcal === 0) continue;
      const berechnet = 4 * l.p + 4 * l.kh + 9 * l.f;
      // Ballaststoffe liefern ~2 kcal/g und stecken nicht in den KH – daher ±20 % bzw. ±8 kcal bei Gemüse.
      const diff = Math.abs(berechnet - l.kcal);
      expect(diff <= 8 || diff / l.kcal <= 0.2, `${key}: ${l.kcal} vs ${berechnet}`).toBe(true);
      expect(l.p + l.kh + l.f, key).toBeLessThanOrEqual(100.5);
    }
  });

  it("nennt bei jeder Zutat mit Nährwertbeitrag eine konkrete Menge", () => {
    for (const r of rezepteDatenbank) {
      for (const zt of r.zutaten) {
        if (zt.key === "gewürze") continue;
        expect(/\d|½|⅓|ein paar|etwas/.test(zt.text) || zt.basis, `${r.name}: ${zt.text}`).toBe(
          true,
        );
      }
    }
  });
});

describe("Zielbänder", () => {
  const band = Object.fromEntries(zielBaender.map((b) => [b.ziel, b])) as Record<
    ZielEignung,
    ZielBand
  >;

  it("Bänder entsprechen der Vorgabe (Fettabbau 300–550, Recomp 450–700, Muskelaufbau 600–900 kcal)", () => {
    expect([band.fettabbau.min, band.fettabbau.max]).toEqual([300, 550]);
    expect([band.recomp.min, band.recomp.max]).toEqual([450, 700]);
    expect([band.muskelaufbau.min, band.muskelaufbau.max]).toEqual([600, 900]);
  });

  it("jede Zieleignung liegt im Kalorienband des Ziels (alle Rezepte)", () => {
    for (const r of rezepte) {
      for (const z of r.zielEignung) {
        expect(r.kcal, `${r.name} (${z})`).toBeGreaterThanOrEqual(band[z].min);
        expect(r.kcal, `${r.name} (${z})`).toBeLessThanOrEqual(band[z].max);
      }
    }
  });

  it("jedes neue Rezept passt zu mindestens einem Ziel und erreicht dessen Mindestprotein", () => {
    for (const r of rezepte.filter((x) => neueIds.has(x.id))) {
      expect(r.zielEignung.length, r.name).toBeGreaterThan(0);
      for (const z of r.zielEignung)
        expect(r.protein, `${r.name} (${z})`).toBeGreaterThanOrEqual(band[z].minProtein);
    }
  });

  it("jedes Ziel hat genügend Rezepte zur Auswahl", () => {
    for (const z of ["fettabbau", "recomp", "muskelaufbau"] as const) {
      expect(rezepte.filter((r) => r.zielEignung.includes(z)).length, z).toBeGreaterThanOrEqual(30);
    }
  });
});

describe("Darstellung", () => {
  it("Zutaten- und Schritttexte sind je Rezept eindeutig (React-Keys)", () => {
    for (const r of rezepte) {
      expect(new Set(r.zutaten.map((z) => z.text)).size, r.name).toBe(r.zutaten.length);
      expect(new Set(r.schritte).size, r.name).toBe(r.schritte.length);
    }
  });

  it("neue Rezepte sind ausformuliert (mind. 3 Zutaten, 3 Schritte, keine Platzhalter)", () => {
    for (const r of rezepteDatenbank) {
      expect(r.zutaten.length, r.name).toBeGreaterThanOrEqual(3);
      expect(r.schritte.length, r.name).toBeGreaterThanOrEqual(3);
      for (const t of [...r.zutaten.map((z) => z.text), ...r.schritte]) {
        expect(/nach wahl|nach geschmack|\{p\}/i.test(t), `${r.name}: ${t}`).toBe(false);
      }
    }
  });
});
