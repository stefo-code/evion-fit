/**
 * KI-Trainingsplan über das Lovable AI Gateway (server-only).
 * Gibt strukturierte Templates zurück. Bevorzugt wird aus der übergebenen
 * Bibliothek gewählt; nur wenn nichts Passendes dabei ist, darf die KI eine
 * vollständig neue Übung definieren (die beim Übernehmen als „eigene Übung“
 * gespeichert wird).
 */

export type KiPlanNeueUebung = {
  name: string;
  muskel: string;
  equipment: string[];
  /** Grundübung (mehrgelenkig) statt Isolationsübung. */
  grund: boolean;
  /** Vorgeschlagene Standard-Wiederholungsspanne, z. B. „8–12“. */
  wdh: string;
  technik: string;
};

export type KiPlanUebung = {
  id: string;
  saetze: number;
  wdhVon: number;
  wdhBis: number;
  begruendung: string;
  /** Nur gesetzt, wenn die KI keine passende Bibliotheks-Übung gefunden hat. */
  neu?: KiPlanNeueUebung;
};
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
Erstelle einen Wochenplan als Trainings-Templates auf Deutsch – nach denselben evidenzbasierten Regeln wie der
hauseigene Plan-Generator:

SPLIT NACH TRAININGSTAGEN:
- 1–3 Tage/Woche: Ganzkörper an jedem Tag (Kniebeuge-, Hüft-, Druck-, Zug- und Rumpfmuster in jeder Einheit).
- 4 Tage/Woche: Oberkörper/Unterkörper-Split (z. B. Drücken, Kniebeuge, Ziehen, Hüfte).
- 5–7 Tage/Woche: Push/Pull/Beine-Split mit Rotation, ergänzt um Oberkörper- und Schwachstellen-Einheiten.
Genau so viele Templates wie Trainingstage pro Woche (max. 7), sinnvoll verteilt.

VOLUMEN NACH ERFAHRUNG:
- Anfänger: weniger Übungen und Sätze pro Muskelgruppe, Fokus auf Technik und einsteigerfreundliche Übungen.
- Fortgeschritten/Erfahren: mehr Volumen, auch anspruchsvollere Grundübungen.

SÄTZE NACH VERFÜGBARER DAUER (inkl. Aufwärmen):
- ≤20 min: ca. 3 Übungen · ≤30 min: ca. 4 · ≤45 min: ca. 5 · >45 min: 6 oder mehr.
- Bei knappem Zeitbudget (≤30 min) zuerst Grundübungen, Isolation nur wenn Zeit bleibt.

WIEDERHOLUNGSSPANNEN NACH ZIEL:
- Maximalkraft/Kraft: niedrige Wiederholungen (ca. 3–6), schwere Grundübungen, 1–6 Sätze.
- Muskelaufbau: ca. 6–12 Wiederholungen, mehrgelenkige Übungen plus gezielte Isolation.
- Fettverbrennung/Definition/Ausdauer: höhere Wiederholungen (ca. 12–20) bzw. Konditionsblöcke, hoher Energieverbrauch.
- Allgemeine Fitness: moderate, gelenkfreundliche Spannen, Wettkampfübungen (schwere Langhantel-Grundübungen) eher meiden.

HARTE EINSCHRÄNKUNGSREGELN (nicht verhandelbar):
- Schulter-Einschränkung: keine schulterbelastenden Überkopf-/Nacken-Varianten.
- Rücken-Einschränkung: keine axial stark belastenden Übungen (z. B. schweres Kreuzheben, Langhantelrudern, Langhantel-Kniebeuge).
- Knie-/Hüft-Einschränkung: keine tiefen, einbeinig instabilen oder stark gelenkbelastenden Varianten.
- Herz-Kreislauf-Einschränkung: keine maximalen Kraftspitzen oder hochintensiven Intervalle ohne Abstufung.
- Vom Nutzer explizit abgelehnte Übungen und nicht verfügbares Equipment niemals einplanen.

KEIN GESCHLECHTSEFFEKT: Wähle Übungen ausschließlich nach Ziel, Erfahrung, Alter, Einschränkungen, Equipment und
Zeitbudget. Das Geschlecht darf die Übungsauswahl, Sätze oder Wiederholungen NICHT beeinflussen.

ALTER AB 50: Bevorzuge gelenk- und rückenschonende, gut geführte Varianten; meide Übungen mit hoher
Wirbelsäulenkompression oder Verletzungsrisiko, auch ohne explizit genannte Einschränkung.

ÜBUNGSAUSWAHL:
- Bevorzuge IMMER eine passende Übungs-ID aus der übergebenen Bibliotheksliste. Verwende nur echte IDs aus dieser Liste.
- Nur wenn für ein wichtiges Bewegungsmuster/Ziel keine passende Bibliotheks-Übung existiert (z. B. besonderes
  Equipment, besondere Einschränkung), darfst du stattdessen eine vollständig neue Übung definieren: setze dafür
  "id" auf einen leeren String und fülle "neu" mit Name, Hauptmuskel, Equipment, ob Grund- oder Isolationsübung,
  einer sinnvollen Standard-Wiederholungsspanne und einem kurzen Technikhinweis. Nutze das nur sparsam.
- Sätze 1–6, Wiederholungsspanne realistisch (passend zum Ziel, s. o.).
- Begründung je Übung: ein kurzer, konkreter Satz (max. 20 Wörter), der auf die obigen Regeln Bezug nimmt
  (z. B. Ziel, Erfahrung, Einschränkung, Zeitbudget).`;

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
              required: ["id", "saetze", "wdhVon", "wdhBis", "begruendung", "neu"],
              properties: {
                id: { type: "string" },
                saetze: { type: "integer" },
                wdhVon: { type: "integer" },
                wdhBis: { type: "integer" },
                begruendung: { type: "string" },
                neu: {
                  type: ["object", "null"],
                  additionalProperties: false,
                  required: ["name", "muskel", "equipment", "grund", "wdh", "technik"],
                  properties: {
                    name: { type: "string" },
                    muskel: { type: "string" },
                    equipment: { type: "array", items: { type: "string" } },
                    grund: { type: "boolean" },
                    wdh: { type: "string" },
                    technik: { type: "string" },
                  },
                },
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
      reasoning: { effort: "medium" },
      store: false,
      stream: true,
      text: { format: { type: "json_schema", name: "trainingsplan", strict: true, schema: SCHEMA } },
    }),
  });

  if (res.status === 429) throw new Error("Gerade sind zu viele Anfragen unterwegs – bitte kurz warten.");
  if (res.status === 402) throw new Error("Die KI ist gerade nicht verfügbar, bitte später erneut versuchen.");
  if (res.status === 403) throw new Error("Die KI ist gerade nicht verfügbar, bitte später erneut versuchen.");
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
  const normName = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");

  const templates = (json.templates ?? [])
    .slice(0, 7)
    .map((t) => {
      const gesehen = new Set<string>();
      const uebungen = (t.uebungen ?? [])
        .map((u) => {
          const neuRoh = u.neu as Partial<KiPlanNeueUebung> | null | undefined;
          const istNeu = neuRoh && String(neuRoh.name ?? "").trim().length > 0;
          if (!istNeu && !erlaubt.has(u.id)) return null;

          const von = clamp(u.wdhVon, 1, 50);
          const basis: KiPlanUebung = {
            id: istNeu ? "" : u.id,
            saetze: clamp(u.saetze, 1, 8),
            wdhVon: von,
            wdhBis: Math.max(von, clamp(u.wdhBis, 1, 60)),
            begruendung: String(u.begruendung ?? "").slice(0, 300),
          };
          if (istNeu && neuRoh) {
            basis.neu = {
              name: String(neuRoh.name ?? "").slice(0, 120),
              muskel: String(neuRoh.muskel ?? "Ganzkörper").slice(0, 80) || "Ganzkörper",
              equipment: (Array.isArray(neuRoh.equipment) ? neuRoh.equipment : []).slice(0, 8).map((x) => String(x).slice(0, 40)),
              grund: Boolean(neuRoh.grund),
              wdh: String(neuRoh.wdh ?? `${basis.wdhVon}–${basis.wdhBis}`).slice(0, 20),
              technik: String(neuRoh.technik ?? "").slice(0, 300),
            };
          }

          const schluessel = istNeu && basis.neu ? `n:${normName(basis.neu.name)}` : `i:${basis.id}`;
          if (gesehen.has(schluessel)) return null;
          gesehen.add(schluessel);
          return basis;
        })
        .filter((u): u is KiPlanUebung => Boolean(u));
      return { titel: String(t.titel ?? "KI-Training").slice(0, 60) || "KI-Training", uebungen };
    })
    .filter((t) => t.uebungen.length > 0);

  if (templates.length === 0) throw new Error("Die KI hat keine passenden Übungen gefunden – bitte Angaben anpassen.");
  return templates;
}
