import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Löscht alle Server-Daten des angemeldeten Kontos und das Konto selbst. */
export const loescheKonto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    for (const t of ["health_samples", "health_sources", "sync_runs", "ingest_tokens", "user_backups"] as const) {
      await supabase.from(t).delete().eq("user_id", userId);
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const t of ["health_samples", "health_sources", "sync_runs", "ingest_tokens", "user_backups"] as const) {
      await supabaseAdmin.from(t).delete().eq("user_id", userId);
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error("Das Konto konnte nicht gelöscht werden.");
    return { ok: true };
  });
