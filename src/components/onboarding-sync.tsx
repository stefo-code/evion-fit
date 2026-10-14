import { useState } from "react";
import { Cloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { synchronisiere } from "@/components/sync-backup";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function OnboardingSync() {
  const { user, laedt } = useAuth();
  const [busy, setBusy] = useState(false);
  const [fertig, setFertig] = useState(false);
  const [fehler, setFehler] = useState("");

  async function aktivieren() {
    setBusy(true);
    setFehler("");
    try {
      let konto = user;
      if (!konto) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        konto = data.user;
      }
      if (!konto) throw new Error("Kein Konto verfügbar");
      await synchronisiere(konto.id);
      setFertig(true);
    } catch {
      setFehler("Sync ist gerade nicht verfügbar. Du kannst ohne Sync starten und ihn später im Profil aktivieren.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 border-t border-border pt-5" aria-label="Optionaler Sync">
      <h2 className="text-sm font-semibold">Sync & Backup · optional</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Ohne Sync bleiben deine Daten auf diesem Gerät. Die App ist auch ohne Konto vollständig nutzbar.</p>
      {fertig ? <p role="status" className="mt-3 text-sm font-semibold text-primary">Deine Daten sind synchronisiert.</p> : (
        <Button variant="outline" disabled={busy || laedt} onClick={() => void aktivieren()} className="mt-3 h-auto min-h-12 w-full whitespace-normal py-3">
          {busy ? <Loader2 className="animate-spin" /> : <Cloud />}
          {user ? "Jetzt synchronisieren" : "Sync aktivieren (ohne E-Mail)"}
        </Button>
      )}
      {(!user || user.is_anonymous) && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Ohne abgesichertes Konto kann der Zugriff auf dein Backup beim Abmelden oder Gerätewechsel verloren gehen. Im Profil kannst du dein Konto später absichern.</p>}
      {fehler && <p role="alert" className="mt-2 text-sm text-muted-foreground">{fehler}</p>}
    </section>
  );
}