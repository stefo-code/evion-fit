import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Progressive Profiling: seltene, kontextbezogene Rückfragen.
 * Beantwortete/abgelehnte Fragen werden lokal gemerkt und nicht erneut gestellt.
 */
export type NudgeFrage = {
  id: string;
  text: string;
  hinweis?: string;
  antworten: string[];
};

const KEY = "evion.nudges.v1";

function erledigte(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function Nudge({
  frage,
  onAntwort,
  className,
}: {
  frage: NudgeFrage;
  onAntwort?: (antwort: string) => void;
  className?: string;
}) {
  const [sichtbar, setSichtbar] = useState(false);

  useEffect(() => {
    setSichtbar(!erledigte().includes(frage.id));
  }, [frage.id]);

  function schliessen(antwort?: string) {
    const neu = [...new Set([...erledigte(), frage.id])];
    window.localStorage.setItem(KEY, JSON.stringify(neu));
    setSichtbar(false);
    if (antwort) onAntwort?.(antwort);
  }

  if (!sichtbar) return null;

  return (
    <div className={cn("surface border-primary/30 bg-primary/6 p-5", className)}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{frage.text}</p>
          {frage.hinweis && <p className="mt-1 text-xs text-muted-foreground">{frage.hinweis}</p>}
        </div>
        <button
          onClick={() => schliessen()}
          aria-label="Frage ausblenden"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {frage.antworten.map((a) => (
          <button
            key={a}
            onClick={() => schliessen(a)}
            className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}
