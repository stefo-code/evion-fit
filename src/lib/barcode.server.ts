/**
 * Barcode-Produktsuche über Open Food Facts (server-only).
 * Liefert Nährwerte je 100 g/ml plus – falls hinterlegt – die Portionsgröße.
 */

export type BarcodeProdukt = {
  code: string;
  name: string;
  marke: string | null;
  /** Nährwerte je 100 g bzw. 100 ml. */
  kcal: number;
  protein: number;
  kh: number;
  fett: number;
  /** Vorgeschlagene Portion in g/ml (Packungsangabe oder 100). */
  portion_g: number;
  einheit: "g" | "ml";
  bild: string | null;
};

function zahl(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Liest "330 ml" / "0,5 l" / "45g" aus der Mengenangabe. */
function portionAus(text: unknown): number {
  if (typeof text !== "string") return 0;
  const m = text.replace(",", ".").match(/([\d.]+)\s*(kg|g|l|ml|cl)/i);
  if (!m) return 0;
  const wert = Number(m[1]);
  if (!Number.isFinite(wert)) return 0;
  const einheit = m[2].toLowerCase();
  if (einheit === "kg" || einheit === "l") return Math.round(wert * 1000);
  if (einheit === "cl") return Math.round(wert * 10);
  return Math.round(wert);
}

export async function sucheBarcode(code: string): Promise<BarcodeProdukt | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=code,product_name,product_name_de,brands,nutriments,serving_quantity,quantity,image_front_small_url`,
    { headers: { "User-Agent": "EVION-Fitness-App/1.0 (lovable.app)" } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Produktdatenbank ist gerade nicht erreichbar.");

  const json = (await res.json()) as {
    status?: number;
    product?: Record<string, unknown> & { nutriments?: Record<string, unknown> };
  };
  const p = json.product;
  if (!p || json.status === 0) return null;

  const n = p.nutriments ?? {};
  const kcal =
    zahl(n["energy-kcal_100g"]) || Math.round(zahl(n["energy_100g"]) / 4.184) || 0;

  const name =
    (typeof p["product_name_de"] === "string" && p["product_name_de"]) ||
    (typeof p["product_name"] === "string" && p["product_name"]) ||
    "";
  if (!name) return null;

  const istGetraenk = typeof p["quantity"] === "string" && /\b(ml|cl|l)\b/i.test(p["quantity"]);
  const portion = zahl(p["serving_quantity"]) || portionAus(p["quantity"]) || 100;

  return {
    code,
    name,
    marke: typeof p["brands"] === "string" && p["brands"] ? String(p["brands"]).split(",")[0].trim() : null,
    kcal: Math.round(kcal),
    protein: Math.round(zahl(n["proteins_100g"])),
    kh: Math.round(zahl(n["carbohydrates_100g"])),
    fett: Math.round(zahl(n["fat_100g"])),
    portion_g: Math.min(2000, Math.max(10, portion)),
    einheit: istGetraenk ? "ml" : "g",
    bild: typeof p["image_front_small_url"] === "string" ? p["image_front_small_url"] : null,
  };
}
