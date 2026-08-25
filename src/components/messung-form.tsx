import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  feldDef,
  messFelder,
  useAktivitaet,
  type KoerperMessung,
  type MessFeld,
} from "@/lib/activity-store";

const gruppen: { key: "koerper" | "umfang" | "erholung" | "subjektiv"; titel: string; hinweis: string }[] = [
  { key: "koerper", titel: "Körperwerte", hinweis: "Von der Waage ablesen – alles außer Gewicht ist optional." },
  { key: "umfang", titel: "Umfänge (optional)", hinweis: "Mit dem Maßband, morgens und unbekleidet gemessen." },
  { key: "erholung", titel: "Erholung & Alltag (optional)", hinweis: "Z. B. aus Uhr oder Health-App abgelesen." },
  { key: "subjektiv", titel: "Wie fühlst du dich? (optional)", hinweis: "1 = sehr schlecht, 5 = sehr gut bzw. sehr stark." },
];

type Werte = Partial<Record<MessFeld, string>>;

/**
 * Zentrales Eingabeformular für manuell erfasste Körperwerte.
 * `kompakt` zeigt zunächst nur die Körperwerte, alles Weitere ist aufklappbar.
 */
export function MessungForm({
  kompakt = true,
  onGespeichert,
  className,
}: {
  kompakt?: boolean;
  onGespeichert?: () => void;
  className?: string;
}) {
  const { messungSpeichern } = useAktivitaet();
  const [werte, setWerte] = useState<Werte>({});
  const [offen, setOffen] = useState<Record<string, boolean>>({ koerper: true });
  const [datum, setDatum] = useState(() => new Date().toISOString().slice(0, 10));

  const sichtbar = useMemo(() => gruppen.filter((g) => !kompakt || true), [kompakt]);

  function setzen(key: MessFeld, v: string) {
    setWerte((alt) => ({ ...alt, [key]: v }));
  }

  function speichern() {
    const eintrag: KoerperMessung = { datum: new Date(`${datum}T12:00:00`).toISOString() };
    let anzahl = 0;
    for (const feld of messFelder) {
      const roh = werte[feld.key];
      if (!roh || roh.trim() === "") continue;
      const zahl = Number(roh.replace(",", "."));
      if (!Number.isFinite(zahl)) {
        toast.error(`${feld.label}: bitte eine Zahl eingeben.`);
        return;
      }
      if (zahl < feld.min || zahl > feld.max) {
        toast.error(`${feld.label}: Wert zwischen ${feld.min} und ${feld.max} ${feld.einheit} erwartet.`);
        return;
      }
      (eintrag as Record<string, unknown>)[feld.key] = Math.round(zahl * 10) / 10;
      anzahl++;
    }
    if (anzahl === 0) {
      toast.error("Trage mindestens einen Wert ein.");
      return;
    }
    const neu = messungSpeichern(eintrag);
    setWerte({});
    toast.success(`Messung gespeichert (${anzahl} ${anzahl === 1 ? "Wert" : "Werte"})`);
    for (const e of neu) toast.success(`Erfolg freigeschaltet: ${e.titel}`);
    onGespeichert?.();
  }

  return (
    <div className={cn("space-y-4", className)}>
      <label className="block text-sm">
        <span className="label-xs">Datum</span>
        <input
          type="date"
          value={datum}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDatum(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5"
        />
      </label>

      {sichtbar.map((g) => {
        const felder = messFelder.filter((f) => f.gruppe === g.key);
        const auf = offen[g.key] ?? false;
        return (
          <div key={g.key} className="rounded-2xl border border-border">
            <button
              type="button"
              onClick={() => setOffen((o) => ({ ...o, [g.key]: !auf }))}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span className="text-sm font-bold">{g.titel}</span>
              <ChevronDown
                className={cn("ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform", auf && "rotate-180")}
              />
            </button>
            {auf && (
              <div className="border-t border-border p-4">
                <p className="mb-3 text-xs text-muted-foreground">{g.hinweis}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {felder.map((f) => (
                    <label key={f.key} className="text-sm">
                      <span className="label-xs truncate">
                        {f.label} ({f.einheit})
                      </span>
                      <input
                        inputMode="decimal"
                        value={werte[f.key] ?? ""}
                        onChange={(e) => setzen(f.key, e.target.value)}
                        placeholder="—"
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={speichern}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-primary-foreground"
      >
        <Scale className="h-4 w-4" /> Messung speichern
      </button>
      <p className="text-xs text-muted-foreground">
        Alle Werte bleiben lokal auf deinem Gerät. Körperfett-, Wasser- und Muskelanteile von Waagen sind
        Schätzwerte – EVION stellt keine Diagnosen.
      </p>
    </div>
  );
}

/** Kurzanzeige der letzten Werte, z. B. im Cockpit. */
export function MessWertZeile({ felder }: { felder: MessFeld[] }) {
  const { aktivitaet } = useAktivitaet();
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {felder.map((k) => {
        const def = feldDef(k);
        const letzte = [...aktivitaet.messungen].reverse().find((m) => typeof m[k] === "number");
        const wert = letzte ? (letzte[k] as number) : null;
        return (
          <div key={k} className="min-w-0">
            <p className="label-xs truncate">{def.label}</p>
            <p className="num mt-1 text-2xl font-bold leading-none">
              {wert === null ? "—" : wert.toLocaleString("de-DE")}
              <span className="ml-1 text-sm font-semibold text-muted-foreground">{def.einheit}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
