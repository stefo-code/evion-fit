import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { parseBeurerCsv } from "@/lib/health-integrations";

const bodySchema = z.object({
  source: z.string().min(1).max(40),
  priority: z.number().int().min(1).max(100).optional(),
  samples: z
    .array(
      z.object({
        metric: z.string().min(1).max(40),
        value: z.number().finite(),
        unit: z.string().max(16).optional(),
        measuredAt: z.string().min(4).max(40),
        quality: z.enum(["gemessen", "geschätzt", "berechnet"]).optional(),
      }),
    )
    .max(1000)
    .optional(),
  /** Alternative: Roh-CSV aus dem Beurer HealthManager Pro (Auto-Import ohne Upload). */
  csv: z.string().max(2_000_000).optional(),
});

const csvMetriken = [
  ["gewicht", "kg"],
  ["koerperfett", "%"],
  ["muskelmasse", "kg"],
  ["wasser", "%"],
] as const;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });
}

export const Route = createFileRoute("/api/public/health-ingest")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "authorization, content-type",
            "access-control-allow-methods": "POST, OPTIONS",
          },
        }),
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const raw = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
        if (!raw.startsWith("vk_")) return json({ error: "Kein gültiges Ingest-Token" }, 401);

        const { hashToken } = await import("@/lib/ingest-token.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: tokenRow } = await supabaseAdmin
          .from("ingest_tokens")
          .select("id,user_id,revoked")
          .eq("token_hash", hashToken(raw))
          .maybeSingle();
        if (!tokenRow || tokenRow.revoked) return json({ error: "Token unbekannt oder widerrufen" }, 401);

        let parsed;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return json({ error: "Ungültige Daten" }, 400);
        }

        const messungen: { metric: string; value: number; unit: string; measuredAt: string; quality: string }[] = [];

        for (const s of parsed.samples ?? []) {
          const d = new Date(s.measuredAt);
          if (Number.isNaN(d.getTime())) continue;
          messungen.push({
            metric: s.metric,
            value: s.value,
            unit: s.unit ?? "",
            measuredAt: d.toISOString(),
            quality: s.quality ?? "gemessen",
          });
        }

        if (parsed.csv) {
          for (const zeile of parseBeurerCsv(parsed.csv)) {
            const d = new Date(zeile.datum.split(".").length === 3 ? zeile.datum.split(".").reverse().join("-") : zeile.datum);
            if (Number.isNaN(d.getTime())) continue;
            for (const [metric, unit] of csvMetriken) {
              const wert = zeile[metric];
              if (typeof wert === "number") {
                messungen.push({
                  metric,
                  value: wert,
                  unit,
                  measuredAt: d.toISOString(),
                  quality: metric === "gewicht" ? "gemessen" : "geschätzt",
                });
              }
            }
          }
        }

        if (messungen.length === 0) return json({ error: "Keine verwertbaren Messwerte" }, 422);

        const rows = messungen.map((m) => ({
          user_id: tokenRow.user_id,
          source: parsed.source,
          metric: m.metric,
          value: m.value,
          unit: m.unit,
          measured_at: m.measuredAt,
          quality: m.quality,
          priority: parsed.priority ?? 50,
        }));

        const { error, count } = await supabaseAdmin
          .from("health_samples")
          .upsert(rows, { onConflict: "user_id,source,metric,measured_at", count: "exact" });

        await supabaseAdmin.from("sync_runs").insert({
          user_id: tokenRow.user_id,
          source: parsed.source,
          status: error ? "fehler" : "ok",
          received: rows.length,
          inserted: error ? 0 : (count ?? rows.length),
          message: error?.message ?? "Automatischer Sync",
        });

        await supabaseAdmin.from("health_sources").upsert(
          {
            user_id: tokenRow.user_id,
            source: parsed.source,
            connected: true,
            last_sync_at: new Date().toISOString(),
            last_status: error ? "fehler" : "ok",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,source" },
        );

        await supabaseAdmin
          .from("ingest_tokens")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", tokenRow.id);

        if (error) return json({ error: "Speichern fehlgeschlagen" }, 500);
        return json({ ok: true, verarbeitet: rows.length });
      },
    },
  },
});
