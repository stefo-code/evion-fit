/**
 * Foto-Erkennung für Mahlzeiten über das Lovable AI Gateway (server-only).
 * Liefert bewusst Schätzwerte mit Unsicherheitsbereich – keine exakten Nährwerte.
 */

export type ErkanntesLebensmittel = {
  name: string;
  menge_g: number;
  kcal: number;
  protein_g: number;
  kh_g: number;
  fett_g: number;
  sicherheit: "hoch" | "mittel" | "niedrig";
};

export type FotoAnalyse = {
  gericht: string;
  items: ErkanntesLebensmittel[];
  hinweis: string;
  unsicherheitProzent: number;
};

const SYSTEM = `Du bist ein Ernährungs-Analyse-Modul einer deutschen Fitness-App.
Analysiere das Foto einer Mahlzeit und schätze die enthaltenen Lebensmittel mit Portionsgrößen.
Antworte AUSSCHLIESSLICH mit JSON in genau diesem Format (keine Erklärung, kein Markdown):
{"gericht":"kurzer Name","items":[{"name":"...","menge_g":0,"kcal":0,"protein_g":0,"kh_g":0,"fett_g":0,"sicherheit":"hoch|mittel|niedrig"}],"hinweis":"ein Satz zu Unsicherheiten","unsicherheitProzent":20}
Regeln: Deutsche Bezeichnungen. Realistische Haushaltsportionen. Nährwerte beziehen sich auf die geschätzte Menge, nicht auf 100 g.
Ist kein Essen erkennbar: {"gericht":"Kein Essen erkannt","items":[],"hinweis":"...","unsicherheitProzent":0}.`;

export async function analysiereMahlzeitenFoto(dataUrl: string): Promise<FotoAnalyse> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("KI-Dienst ist nicht konfiguriert.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "Analysiere diese Mahlzeit." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  if (res.status === 429) throw new Error("Zu viele Anfragen – bitte kurz warten.");
  if (!res.ok) throw new Error("Die Foto-Analyse ist gerade nicht verfügbar.");

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = json.choices?.[0]?.message?.content ?? "";
  const roh = text.replace(/```json|```/g, "").trim();
  const start = roh.indexOf("{");
  const ende = roh.lastIndexOf("}");
  if (start === -1 || ende === -1) throw new Error("Antwort konnte nicht gelesen werden.");

  const parsed = JSON.parse(roh.slice(start, ende + 1)) as Partial<FotoAnalyse>;
  return {
    gericht: parsed.gericht ?? "Mahlzeit",
    items: (parsed.items ?? []).map((i) => ({
      name: String(i.name ?? "Zutat"),
      menge_g: Math.max(0, Math.round(Number(i.menge_g) || 0)),
      kcal: Math.max(0, Math.round(Number(i.kcal) || 0)),
      protein_g: Math.max(0, Math.round(Number(i.protein_g) || 0)),
      kh_g: Math.max(0, Math.round(Number(i.kh_g) || 0)),
      fett_g: Math.max(0, Math.round(Number(i.fett_g) || 0)),
      sicherheit: i.sicherheit === "hoch" || i.sicherheit === "niedrig" ? i.sicherheit : "mittel",
    })),
    hinweis: parsed.hinweis ?? "Alle Werte sind Schätzungen.",
    unsicherheitProzent: Math.min(60, Math.max(5, Math.round(Number(parsed.unsicherheitProzent) || 20))),
  };
}
