import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Card, Section } from "@/components/ui-kit";
import { Loader2, LogIn, UserPlus } from "lucide-react";

const suchSchema = z.object({ weiter: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: suchSchema,
  head: () => ({
    meta: [
      { title: "Anmelden – Vektor" },
      {
        name: "description",
        content: "Melde dich an, um deine Health-Daten von Samsung Health, Galaxy Watch und Beurer zu synchronisieren.",
      },
      { property: "og:title", content: "Anmelden – Vektor" },
      { property: "og:description", content: "Konto für die automatische Health-Synchronisation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session, laedt } = useAuth();
  const navigate = useNavigate();
  const { weiter } = useSearch({ from: "/auth" });
  const [modus, setModus] = useState<"login" | "registrieren">("login");
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [busy, setBusy] = useState(false);
  const ziel = weiter && weiter.startsWith("/") ? weiter : "/geraete";

  useEffect(() => {
    if (session) void navigate({ to: ziel });
  }, [session, navigate, ziel]);

  const absenden = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (modus === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: passwort });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: passwort,
          options: { emailRedirectTo: `${window.location.origin}${ziel}` },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Fast geschafft", { description: "Bitte bestätige die E-Mail in deinem Postfach." });
        }
      }
    } catch (err) {
      toast.error("Anmeldung fehlgeschlagen", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error("Google-Anmeldung fehlgeschlagen");
  };

  if (laedt) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header>
        <p className="label-xs">Konto</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">
          {modus === "login" ? "Anmelden" : "Konto erstellen"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dein Konto verbindet Handy, Uhr und Waage – synchronisierte Werte stehen dann auf jedem Gerät bereit.
        </p>
      </header>

      <Section titel="Zugang">
        <Card>
          <form onSubmit={absenden} className="space-y-3">
            <label className="block">
              <span className="label-xs">E-Mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="label-xs">Passwort</span>
              <input
                type="password"
                required
                minLength={8}
                value={passwort}
                onChange={(e) => setPasswort(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : modus === "login" ? (
                <LogIn className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {modus === "login" ? "Anmelden" : "Registrieren"}
            </button>
          </form>

          <button
            onClick={() => void google()}
            className="mt-3 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-bold"
          >
            Mit Google fortfahren
          </button>

          <button
            onClick={() => setModus(modus === "login" ? "registrieren" : "login")}
            className="mt-3 w-full text-center text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
          >
            {modus === "login" ? "Noch kein Konto? Jetzt registrieren" : "Schon registriert? Zur Anmeldung"}
          </button>
        </Card>
      </Section>
    </div>
  );
}
