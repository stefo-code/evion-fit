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
  const wert = Number(m[1] ?? "");
  if (!Number.isFinite(wert)) return 0;
  const einheit = (m[2] ?? "").toLowerCase();
  if (einheit === "kg" || einheit === "l") return Math.round(wert * 1000);
  if (einheit === "cl") return Math.round(wert * 10);
  return Math.round(wert);
}

type Nutriments = Record<string, unknown>;

/**
 * Holt einen Nährwert je 100 g/ml. Reihenfolge: _100g → Basiswert/_value →
 * _serving (auf 100 hochgerechnet). So funktionieren auch Einträge, die nur
 * Portionsangaben oder nur kJ hinterlegt haben.
 */
function proHundert(n: Nutriments, basis: string, portion: number): number {
  const direkt = zahl(n[`${basis}_100g`]) || zahl(n[basis]) || zahl(n[`${basis}_value`]);
  if (direkt) return direkt;
  const proPortion = zahl(n[`${basis}_serving`]);
  if (proPortion && portion > 0) return (proPortion * 100) / portion;
  return 0;
}

function kcalAus(n: Nutriments, portion: number): number {
  const kcal = proHundert(n, "energy-kcal", portion);
  if (kcal) return kcal;
  const kj = proHundert(n, "energy-kj", portion);
  if (kj) return kj / 4.184;
  const energie = proHundert(n, "energy", portion);
  if (!energie) return 0;
  const einheit = String(n["energy_unit"] ?? "kJ").toLowerCase();
  return einheit.includes("cal") ? energie : energie / 4.184;
}

async function hole(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "EVION-Fitness-App/1.0 (lovable.app)" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Produktdatenbank ist gerade nicht erreichbar.");
  const json = (await res.json()) as {
    status?: number;
    product?: Record<string, unknown> & { nutriments?: Nutriments };
  };
  if (!json.product || json.status === 0) return null;
  return json.product;
}

export async function sucheBarcode(code: string): Promise<BarcodeProdukt | null> {
  const id = encodeURIComponent(code);
  // Zuerst der gefilterte Aufruf, danach – falls Nährwerte fehlen – der volle Datensatz.
  let p = await hole(
    `https://world.openfoodfacts.org/api/v2/product/${id}.json?fields=code,product_name,product_name_de,generic_name,generic_name_de,brands,nutriments,serving_quantity,quantity,image_front_small_url`,
  );
  const leer = (prod: Record<string, unknown> | null) =>
    !prod || !prod["nutriments"] || Object.keys(prod["nutriments"] as Nutriments).length === 0;
  if (leer(p)) {
    const voll = await hole(`https://world.openfoodfacts.org/api/v2/product/${id}.json`);
    if (voll) p = voll;
  }
  if (!p) return null;

  const n = (p.nutriments ?? {}) as Nutriments;

  const name =
    (typeof p["product_name_de"] === "string" && p["product_name_de"]) ||
    (typeof p["product_name"] === "string" && p["product_name"]) ||
    (typeof p["generic_name_de"] === "string" && p["generic_name_de"]) ||
    (typeof p["generic_name"] === "string" && p["generic_name"]) ||
    "";
  if (!name) return null;

  const istGetraenk = typeof p["quantity"] === "string" && /\b(ml|cl|l)\b/i.test(p["quantity"]);
  const rohPortion = zahl(p["serving_quantity"]) || portionAus(p["serving_size"]);
  const portion = rohPortion || portionAus(p["quantity"]) || 100;
  // Portionsbezug für die Hochrechnung: nur echte Portionsangaben nutzen.
  const bezug = rohPortion || 0;

  return {
    code,
    name,
    marke: typeof p["brands"] === "string" && p["brands"] ? (String(p["brands"]).split(",")[0] ?? "").trim() : null,
    kcal: Math.round(kcalAus(n, bezug)),
    protein: Math.round(proHundert(n, "proteins", bezug)),
    kh: Math.round(proHundert(n, "carbohydrates", bezug)),
    fett: Math.round(proHundert(n, "fat", bezug)),
    portion_g: Math.min(2000, Math.max(10, portion)),
    einheit: istGetraenk ? "ml" : "g",
    bild: typeof p["image_front_small_url"] === "string" ? p["image_front_small_url"] : null,
  };
}

