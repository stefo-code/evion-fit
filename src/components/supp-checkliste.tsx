import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Moon } from "lucide-react";
import { Card, Section } from "@/components/ui-kit";
import { slotVon, supplementDatenbank, tagesSlots } from "@/lib/supplements-data";
import { KOFFEIN_IDS, useSuppLog } from "@/lib/supplement-log";
import { useOnboardingProfil } from "@/lib/onboarding-store";
import { aktiveTrainingstage, usePlanEinstellungen } from "@/lib/training-plan";
import { useAktivitaet } from "@/lib/activity-store";
import { cn } from "@/lib/utils";

/** Trainingstag, wenn heute ein Training geplant oder bereits geloggt ist. */
export function useIstTrainingstag(): boolean {
  const { profil } = useOnboardingProfil();
  const { einstellungen } = usePlanEinstellungen();
  const { aktivitaet } = useAktivitaet();
  const wt = (new Date().getDay() + 6) % 7;
  const geplant = aktiveTrainingstage(einstellungen, profil.tage || 4).includes(wt);
  const heute = new Date().toDateString();
  const geloggt = aktivitaet.einheiten.some((e) => new Date(e.datum).toDateString() === heute);
  return geplant || geloggt;
}

export function nachDrei(): boolean {
  return new Date().getHours() >= 15;
}

const kurzeDosis = (d: string) => d.split(/[.;(]/)[0]!.trim();

export function SuppCheckliste({ titel = "Heute einnehmen", zeigeLeer = false }: { titel?: string; zeigeLeer?: boolean }) {
  const { besitz, genommen, setzeGenommen } = useSuppLog();
  const trainingstag = useIstTrainingstag();
  const [spaet, setSpaet] = useState(false);
  useEffect(() => setSpaet(nachDrei()), []);

  const trainingSlots = new Set(["vor", "waehrend"]);
  const eintraege = supplementDatenbank
    .filter((s) => besitz.includes(s.id))
    .map((s) => ({ s, slot: slotVon[s.id] ?? "mahlzeit" }))
    .filter((e) => trainingstag || !trainingSlots.has(e.slot))
    .sort((a, b) => tagesSlots.findIndex((x) => x.id === a.slot) - tagesSlots.findIndex((x) => x.id === b.slot));

  if (besitz.length === 0 && !zeigeLeer) return null;

  return (
    <Section titel={titel}>
      <Card className="p-2">
        <p className="px-3 pb-1 pt-2 text-xs text-muted-foreground">{trainingstag ? "Trainingstag" : "Ruhetag"}</p>
        {eintraege.length === 0 ? (
          <p className="px-3 py-3 text-sm text-muted-foreground">
            {besitz.length === 0 ? (
              <>
                Markiere im{" "}
                <Link to="/supplements" className="font-semibold text-primary underline">
                  Supplement-Bereich
                </Link>{" "}
                deine Präparate mit „Habe ich“.
              </>
            ) : (
              "Heute steht nichts an."
            )}
          </p>
        ) : (
          <ul className="space-y-1">
            {eintraege.map(({ s, slot }) => {
              const ok = genommen(s.id);
              const koffein = KOFFEIN_IDS.includes(s.id);
              return (
                <li key={s.id}>
                  <button
                    onClick={() => setzeGenommen(s.id, !ok)}
                    aria-pressed={ok}
                    className={cn(
                      "grid min-h-16 w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl px-3 py-3 text-left",
                      ok ? "bg-primary/10" : "hover:bg-secondary/60",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-full border-2",
                        ok ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {ok && <Check className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block font-semibold", ok && "text-primary")}>{s.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {kurzeDosis(s.dosierung)} · {tagesSlots.find((t) => t.id === slot)?.titel}
                      </span>
                      {koffein && spaet && !ok && (
                        <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-accent-foreground">
                          <Moon className="h-3.5 w-3.5" /> Besser weglassen – stört den Schlaf
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </Section>
  );
}
