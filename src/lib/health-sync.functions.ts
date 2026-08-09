import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const messungSchema = z.object({
  metric: z.string().min(1).max(40),
  value: z.number().finite(),
  unit: z.string().max(16).default(""),
  measuredAt: z.string().min(4).max(40),
  quality: z.enum(["gemessen", "geschätzt", "berechnet"]).default("gemessen"),
});

export type Messung = z.infer<typeof messungSchema>;

export const ladeSyncStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [quellen, laeufe, tokens, werte] = await Promise.all([
      supabase.from("health_sources").select("*").eq("user_id", userId),
      supabase.from("sync_runs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(8),
      supabase
        .from("ingest_tokens")
        .select("id,label,token_prefix,revoked,last_used_at,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("health_samples")
        .select("*")
        .eq("user_id", userId)
        .order("measured_at", { ascending: false })
        .limit(40),
    ]);
    return {
      quellen: quellen.data ?? [],
      laeufe: laeufe.data ?? [],
      tokens: tokens.data ?? [],
      werte: werte.data ?? [],
    };
  });

export const setzeQuelle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        source: z.string().min(1).max(40),
        connected: z.boolean(),
        permissions: z.array(z.string().max(40)).max(20).default([]),
        autoSyncMinutes: z.number().int().min(15).max(1440).default(60),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("health_sources").upsert(
      {
        user_id: context.userId,
        source: data.source,
        connected: data.connected,
        permissions: data.permissions,
        auto_sync_minutes: data.autoSyncMinutes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,source" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const speichereMessungen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        source: z.string().min(1).max(40),
        priority: z.number().int().min(1).max(100).default(50),
        messungen: z.array(messungSchema).min(1).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const rows = data.messungen.map((m) => ({
      user_id: context.userId,
      source: data.source,
      metric: m.metric,
      value: m.value,
      unit: m.unit,
      measured_at: new Date(m.measuredAt).toISOString(),
      quality: m.quality,
      priority: data.priority,
    }));
    const { error, count } = await context.supabase
      .from("health_samples")
      .upsert(rows, { onConflict: "user_id,source,metric,measured_at", count: "exact" });
    const status = error ? "fehler" : "ok";
    await context.supabase.from("sync_runs").insert({
      user_id: context.userId,
      source: data.source,
      status,
      received: rows.length,
      inserted: error ? 0 : (count ?? rows.length),
      message: error?.message ?? null,
    });
    await context.supabase
      .from("health_sources")
      .upsert(
        {
          user_id: context.userId,
          source: data.source,
          connected: true,
          last_sync_at: new Date().toISOString(),
          last_status: status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,source" },
      );
    if (error) throw new Error(error.message);
    return { gespeichert: rows.length };
  });

export const erzeugeIngestToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ label: z.string().min(1).max(60) }).parse(input))
  .handler(async ({ data, context }) => {
    const { erzeugeToken } = await import("./ingest-token.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const token = erzeugeToken();
    const { error } = await supabaseAdmin.from("ingest_tokens").insert({
      user_id: context.userId,
      token_hash: token.hash,
      token_prefix: token.prefix,
      label: data.label,
    });
    if (error) throw new Error(error.message);
    return { token: token.raw };
  });

export const widerrufeToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ingest_tokens")
      .update({ revoked: true })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
