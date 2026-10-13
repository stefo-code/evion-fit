/**
 * KI-Trainingsplan über das Lovable AI Gateway (server-only).
 * Gibt ausschließlich strukturierte Templates zurück; unbekannte IDs werden verworfen.
 */

export type KiPlanUebung = { id: string; saetze: number; wdhVon: number; wdhBis: number; begruendung: string };
export type KiPlanTemplate = { titel: string; uebungen: KiPlanUebung[] };

export type KiPlanAnfrage = {
  profil: string;
  formular: {
    ziel: string;
    tage: number;
    dauer: number;
    fokus: string;
    einschraenkungen: string;
    nichtMag: string;
    equipment: string[];
    freitext: string;
  };
  uebungen: { id: string; name: string; muskel: string; equipment: string[] }[];
};

const SYSTEM = `Du bist ein erfahrener Trainingsplaner (Trainingswissenschaft, Physiotherapie).
Erstelle einen Wochenplan als Trainings-Templates auf Deutsch.
Regeln:
- Genau so viele Templates wie Trainingstage pro Woche (max. 7), sinnvoll verteilt (z. B. Ganzkörper, Ober/Unter, Push/Pull/Beine).
- Nutze NUR Übungs-IDs aus der übergebenen Liste. Erfinde keine IDs.
- Übungsanzahl passend zur Dauer (ca. 1 Übung je 8–10 Minuten), Grundübungen zuerst.
- Berücksichtige Einschränkungen (meide belastende Übungen), abgelehnte Übungen und verfügbares Equipment strikt.
- Sätze 1–6, Wiederholungsspanne realistisch (z. B. 6–10, 8–12, 12–15).
- Begründung je Übung: ein kurzer, konkreter Satz (max. 20 Wörter).`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["templates"],
  properties: {
    templates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["titel", "uebungen"],
        properties: {
          titel: { type: "string" },
          uebungen: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "saetze", "wdhVon", "wdhBis", "begruendung"],
              properties: {
                id: { type: "string" },
                saetze: { type: "integer" },
                wdhVon: { type: "integer" },
                wdhBis: { type: "integer" },
                begruendung: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};

export async function erstelleKiPlan(a: KiPlanAnfrage): Promise<KiPlanTemplate[]> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Die KI ist gerade nicht konfiguriert.");

  const f = a.formular;
  const nutzer = [
    `PROFIL:\n${a.profil}`,
    `\nWÜNSCHE:`,
    `Ziel: ${f.ziel || "—"}`,
    `Trainingstage pro Woche: ${f.tage}`,
    `Dauer pro Einheit: ${f.dauer} min`,
    `Fokus: ${f.fokus || "—"}`,
    `Einschränkungen: ${f.einschraenkungen || "keine"}`,
    `Mag diese Übungen nicht: ${f.nichtMag || "—"}`,
    `Verfügbares Equipment: ${f.equipment.join(", ") || "—"}`,
    `Sonstiges: ${f.freitext || "—"}`,
    `\nERLAUBTE ÜBUNGEN (id | Name | Muskel | Equipment):`,
    ...a.uebungen.map((u) => `${u.id} | ${u.name} | ${u.muskel} | ${u.equipment.join("/")}`),
  ].join("\n");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions: SYSTEM,
      input: [{ role: "user", content: nutzer }],
      reasoning: { effort: "low" },
      store: false,
      stream: true,
      text: { format: { type: "json_schema", name: "trainingsplan", strict: true, schema: SCHEMA } },
    }),
  });

  if (res.status === 429) throw new Error("Gerade sind zu viele Anfragen unterwegs – bitte kurz warten.");
  if (res.status === 402) throw new Error("Die KI ist gerade nicht verfügbar, bitte später erneut versuchen.");
  if (res.status === 403) throw new Error("Die KI-Nutzung ist für diesen Arbeitsbereich gerade gesperrt.");
  if (!res.ok || !res.body) throw new Error("Die KI ist gerade nicht erreichbar.");

  // SSE einlesen und Textausgabe sammeln
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let puffer = "";
  let text = "";
  let fehler: string | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    puffer += dec.decode(value, { stream: true });
    let i: number;
    while ((i = puffer.indexOf("\n")) >= 0) {
      const zeile = puffer.slice(0, i).trim();
      puffer = puffer.slice(i + 1);
      if (!zeile.startsWith("data:")) continue;
      const roh = zeile.slice(5).trim();
      if (!roh || roh === "[DONE]") continue;
      try {
        const ev = JSON.parse(roh) as { type?: string; delta?: string; response?: { error?: { message?: string } } };
        if (ev.type === "response.output_text.delta" && ev.delta) text += ev.delta;
        if (ev.type === "response.failed" || ev.type === "error") fehler = ev.response?.error?.message ?? "Die KI konnte keinen Plan erstellen.";
        if (ev.type === "response.refusal.delta") fehler = "Die KI hat die Anfrage abgelehnt.";
      } catch {
        /* unvollständige Zeile ignorieren */
      }
    }
  }
  if (fehler) throw new Error(fehler);

  let json: { templates?: KiPlanTemplate[] };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Die KI hat keinen gültigen Plan geliefert – bitte neu erstellen.");
  }

  const erlaubt = new Set(a.uebungen.map((u) => u.id));
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number(v) || lo)));
  const templates = (json.templates ?? [])
    .slice(0, 7)
    .map((t) => {
      const gesehen = new Set<string>();
      const uebungen = (t.uebungen ?? [])
        .filter((u) => erlaubt.has(u.id) && !gesehen.has(u.id) && gesehen.add(u.id))
        .map((u) => {
          const von = clamp(u.wdhVon, 1, 50);
          return {
            id: u.id,
            saetze: clamp(u.saetze, 1, 8),
            wdhVon: von,
            wdhBis: Math.max(von, clamp(u.wdhBis, 1, 60)),
            begruendung: String(u.begruendung ?? "").slice(0, 300),
          };
        });
      return { titel: String(t.titel ?? "KI-Training").slice(0, 60) || "KI-Training", uebungen };
    })
    .filter((t) => t.uebungen.length > 0);

  if (templates.length === 0) throw new Error("Die KI hat keine passenden Übungen gefunden – bitte Angaben anpassen.");
  return templates;
}
