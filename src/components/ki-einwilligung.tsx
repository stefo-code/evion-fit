import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { beantworteKi, KI_ANFRAGE_EVENT } from "@/lib/privatsphaere";

export const KI_TEXT =
  "Für diese Funktion werden deine Trainings- und Ernährungsdaten ohne Namen an einen KI-Dienst gesendet.";

/** Einmaliger Zustimmungsdialog – einmal in der App eingebunden. */
export function KiEinwilligungDialog() {
  const [offen, setOffen] = useState(false);
  useEffect(() => {
    const f = () => setOffen(true);
    window.addEventListener(KI_ANFRAGE_EVENT, f);
    return () => window.removeEventListener(KI_ANFRAGE_EVENT, f);
  }, []);
  if (!offen) return null;
  const antwort = (ok: boolean) => {
    setOffen(false);
    beantworteKi(ok);
  };
  return (
    <div className="fixed inset-0 z-[60] grid place-items-end bg-foreground/30 sm:place-items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-xl sm:rounded-3xl">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/12 text-primary">
          <Sparkles className="h-5 w-5" />
        </span>
        <h2 className="mt-3 font-display text-xl font-extrabold">KI-Funktionen nutzen?</h2>
        <p className="mt-2 text-sm text-muted-foreground">{KI_TEXT}</p>
        <p className="mt-2 text-xs text-muted-foreground">Die Einwilligung kannst du in den Einstellungen jederzeit widerrufen.</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={() => antwort(false)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold">
            Ablehnen
          </button>
          <button onClick={() => antwort(true)} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground">
            Zustimmen
          </button>
        </div>
      </div>
    </div>
  );
}

/** Hinweis, wenn KI-Funktionen mangels Einwilligung gesperrt sind. */
export function KiGesperrt() {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">
      <Lock className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        KI-Funktionen sind deaktiviert, weil keine Einwilligung zur Übertragung an den KI-Dienst vorliegt.{" "}
        <Link to="/einstellungen" className="font-bold text-primary">
          In den Einstellungen aktivieren
        </Link>
      </span>
    </p>
  );
}
