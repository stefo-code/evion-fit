import { useRef, useState } from "react";
import { toast } from "sonner";
import { Cloud, Download, Loader2, ShieldCheck, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, Section } from "@/components/ui-kit";
import {
  ladeBackupHerunter,
  leseBackup,
  letztesBackup,
  letzterSync,
  merkeSync,
  sammleDaten,
  stelleWiederHer,
  vorschau,
  type Backup,
} from "@/lib/privatsphaere";
import type { Json } from "@/integrations/supabase/types";

const datum = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("de-DE") : "noch nie");
const btn = "inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold disabled:opacity-60";
const btnPrim = "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground disabled:opacity-60";
const feld = "w-full rounded-xl border border-input bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary";

/** Synchronisiert lokale Daten mit dem eigenen Konto (zusammenführen, dann hochladen). */
export async function synchronisiere(userId: string) {
  const { data, error } = await supabase.from("user_backups").select("daten").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (data?.daten) stelleWiederHer(data.daten as unknown as Backup, "zusammenfuehren");
  const neu: Backup = { app: "EVION", version: 1, erstellt: new Date().toISOString(), daten: sammleDaten() };
  const { error: e2 } = await supabase
    .from("user_backups")
    .upsert({ user_id: userId, daten: neu as unknown as Json, updated_at: neu.erstellt });
  if (e2) throw e2;
  merkeSync();
}

export function SyncBackup() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [absichern, setAbsichern] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [backup, setBackup] = useState<Backup | null>(null);
  const datei = useRef<HTMLInputElement>(null);
  const anonym = !!user?.is_anonymous;

  const lauf = async (f: () => Promise<void>) => {
    setBusy(true);
    try {
      await f();
    } catch (e) {
      toast.error((e as Error).message || "Das hat nicht geklappt.");
    } finally {
      setBusy(false);
    }
  };

  const aktivieren = () =>
    lauf(async () => {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      if (data.user) await synchronisiere(data.user.id);
      toast.success("Sync ist aktiv");
    });

  const jetzt = () =>
    lauf(async () => {
      if (!user) return;
      await synchronisiere(user.id);
      toast.success("Synchronisiert");
      setTimeout(() => window.location.reload(), 600);
    });

  const mitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    void lauf(async () => {
      const { error } = await supabase.auth.updateUser({ email, password: pw });
      if (error) throw error;
      toast.success("Fast geschafft", { description: "Bitte bestätige die E-Mail in deinem Postfach." });
      setAbsichern(false);
    });
  };

  const mitGoogle = () =>
    lauf(async () => {
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/profil` },
      });
      if (error) throw error;
    });

  const abmelden = () =>
    lauf(async () => {
      if (anonym && !window.confirm("Ohne E-Mail oder Google gehen deine Sync-Daten beim Abmelden verloren. Trotzdem abmelden?")) return;
      await supabase.auth.signOut();
    });

  const dateiGewaehlt = async (f: File) => {
    try {
      setBackup(leseBackup(await f.text()));
    } catch (e) {
      toast.error((e as Error).message || "Datei konnte nicht gelesen werden.");
    }
  };

  const wiederherstellen = (modus: "zusammenfuehren" | "ersetzen") => {
    if (!backup) return;
    const frage =
      modus === "ersetzen"
        ? "Alle lokalen Daten werden durch das Backup ersetzt. Fortfahren?"
        : "Das Backup wird mit deinen lokalen Daten zusammengeführt. Fortfahren?";
    if (!window.confirm(frage)) return;
    stelleWiederHer(backup, modus);
    toast.success("Backup wiederhergestellt");
    setTimeout(() => window.location.reload(), 600);
  };

  const v = backup ? vorschau(backup) : null;

  return (
    <Section titel="Sync & Backup">
      <div className="space-y-3">
        <Card>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Cloud className="h-4 w-4 text-primary" /> Sync zwischen Geräten
          </p>
          {!user ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Optional. Ohne Sync bleiben deine Daten nur auf diesem Gerät. Für den Sync ist keine E-Mail nötig.
              </p>
              <button onClick={() => void aktivieren()} disabled={busy} className={`mt-3 w-full ${btnPrim}`}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />} Sync aktivieren
              </button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                {anonym ? "Aktiv mit anonymem Konto." : `Aktiv · ${user.email ?? "Konto"}`} · Letzter Sync: {datum(letzterSync())}
              </p>
              {anonym && (
                <p className="mt-2 rounded-xl bg-primary/8 p-3 text-xs leading-relaxed text-muted-foreground">
                  Ohne E-Mail oder Passkey gehen Sync-Daten verloren, wenn du dich abmeldest oder das Gerät wechselst.
                </p>
              )}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button onClick={() => void jetzt()} disabled={busy} className={btnPrim}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />} Jetzt synchronisieren
                </button>
                {anonym ? (
                  <button onClick={() => setAbsichern((a) => !a)} className={btn}>
                    <ShieldCheck className="h-4 w-4" /> Konto absichern
                  </button>
                ) : (
                  <button onClick={() => void abmelden()} className={btn}>Abmelden</button>
                )}
              </div>
              {anonym && absichern && (
                <div className="mt-3 space-y-2">
                  <form onSubmit={mitEmail} className="space-y-2">
                    <input type="email" required placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} className={feld} />
                    <input type="password" required minLength={8} placeholder="Passwort (mind. 8 Zeichen)" value={pw} onChange={(e) => setPw(e.target.value)} className={feld} />
                    <button type="submit" disabled={busy} className={`w-full ${btnPrim}`}>Mit E-Mail absichern</button>
                  </form>
                  <button onClick={() => void mitGoogle()} disabled={busy} className={`w-full ${btn}`}>Mit Google verknüpfen</button>
                  <button onClick={() => void abmelden()} className="w-full text-center text-xs font-semibold text-muted-foreground">Abmelden</button>
                </div>
              )}
            </>
          )}
        </Card>

        <Card>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Download className="h-4 w-4 text-primary" /> Backup ohne Konto
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Letztes Backup: {datum(letztesBackup())}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button onClick={() => { ladeBackupHerunter(); toast.success("Backup gespeichert"); }} className={btn}>
              <Download className="h-4 w-4" /> Backup herunterladen
            </button>
            <button onClick={() => datei.current?.click()} className={btn}>
              <Upload className="h-4 w-4" /> Backup wiederherstellen
            </button>
          </div>
          <input
            ref={datei}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void dateiGewaehlt(f);
              e.target.value = "";
            }}
          />
          {v && (
            <div className="mt-4 rounded-xl border border-border p-3 text-sm">
              <p className="font-semibold">Inhalt des Backups</p>
              <p className="mt-1 text-muted-foreground">
                {v.trainings} Trainings · {v.messungen} Messungen · {v.mahlzeiten} Mahlzeiten
                {v.von && ` · ${datum(v.von)} – ${datum(v.bis)}`}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => wiederherstellen("zusammenfuehren")} className={btnPrim}>Zusammenführen</button>
                <button onClick={() => wiederherstellen("ersetzen")} className={btn}>Ersetzen</button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Section>
  );
}
