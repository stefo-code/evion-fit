import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { Trainingstag } from "@/lib/training-plan";
import { speichereEinheit, useAktivitaet, type SatzLog } from "@/lib/activity-store";

type Satz = { gewicht: number; wdh: number };

function heuteIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TrainingNachtragen({
  plan,
  standardIndex,
  onSchliessen,
}: {
  plan: Trainingstag[];
  standardIndex: number;
  onSchliessen: () => void;
}) {
  const { aktivitaet } = useAktivitaet();
  const [index, setIndex] = useState(standardIndex);
  const [datum, setDatum] = useState(heuteIso());
  const [dauer, setDauer] = useState(60);
  const tag = plan.find((t) => t.index === index) ?? plan[0]!;

  const start = useMemo(() => {
    const r: Record<string, Satz[]> = {};
    for (const u of tag.uebungen) {
      let last: SatzLog[] = [];
      for (let i = aktivitaet.einheiten.length - 1; i >= 0 && last.length === 0; i--)
        last = aktivitaet.einheiten[i]!.saetze.filter((s) => s.uebungId === u.id);
      const min = Number(u.wdhBereich.split(/[–-]/)[0]) || 10;
      r[u.id] = Array.from({ length: Math.max(1, u.zielSaetze) }, (_, i) => {
        const l = last[i] ?? last[last.length - 1];
        return { gewicht: l?.gewicht ?? u.startGewicht, wdh: l?.wdh ?? min };
      });
    }
    return r;
  }, [tag, aktivitaet]);
  const [werte, setWerte] = useState<Record<string, Record<string, Satz[]>>>({});
  const saetze = werte[tag.index] ?? start;
  const setze = (id: string, i: number, teil: Partial<Satz>) =>
    setWerte((w) => ({
      ...w,
      [tag.index]: { ...saetze, [id]: saetze[id]!.map((s, j) => (j === i ? { ...s, ...teil } : s)) },
    }));

  function speichern() {
    const zeit = new Date(`${datum}T18:00:00`).toISOString();
    const liste: SatzLog[] = tag.uebungen.flatMap((u) =>
      (saetze[u.id] ?? [])
        .filter((s) => s.wdh > 0)
        .map((s) => ({ uebungId: u.id, name: u.name, muskel: u.muskel, gewicht: s.gewicht, wdh: s.wdh, rpe: 0, zeit })),
    );
    if (liste.length === 0) {
      toast.error("Mindestens einen Satz mit Wiederholungen eintragen");
      return;
    }
    speichereEinheit({ datum: zeit, titel: tag.titel, tagIndex: tag.index, dauerMin: Math.max(1, dauer), saetze: liste });
    toast.success(`${tag.titel} nachgetragen`);
    onSchliessen();
  }

  const feld = "w-full min-w-0 rounded-xl border border-border bg-card px-3 py-2 text-sm";
  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-foreground/40" aria-label="Schließen" onClick={onSchliessen} />
      <div className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <p className="font-display text-xl font-extrabold">Training nachtragen</p>
          <button onClick={onSchliessen} className="grid h-12 w-12 place-items-center" aria-label="Schließen">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs font-semibold text-muted-foreground">
            Template
            <select value={tag.index} onChange={(e) => setIndex(Number(e.target.value))} className={`mt-1 ${feld}`}>
              {plan.map((t) => (
                <option key={t.index} value={t.index}>{t.titel}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Datum
            <input type="date" value={datum} max={heuteIso()} onChange={(e) => setDatum(e.target.value)} className={`mt-1 ${feld}`} />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Dauer (min)
            <input type="number" inputMode="numeric" value={dauer} onChange={(e) => setDauer(Number(e.target.value))} className={`mt-1 ${feld}`} />
          </label>
        </div>
        <div className="mt-5 space-y-4">
          {tag.uebungen.map((u) => (
            <div key={u.id}>
              <p className="text-sm font-bold">{u.name}</p>
              <p className="text-xs text-muted-foreground">Ziel: {u.zielSaetze} × {u.wdhBereich}</p>
              <ul className="mt-2 space-y-2">
                {(saetze[u.id] ?? []).map((s, i) => (
                  <li key={i} className="grid grid-cols-[3.5rem_1fr_1fr] items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Satz {i + 1}</span>
                    <input type="number" inputMode="decimal" step="0.5" aria-label={`${u.name} Satz ${i + 1} Gewicht in kg`} value={s.gewicht} onChange={(e) => setze(u.id, i, { gewicht: Number(e.target.value) })} className={feld} />
                    <input type="number" inputMode="numeric" aria-label={`${u.name} Satz ${i + 1} Wiederholungen`} value={s.wdh} onChange={(e) => setze(u.id, i, { wdh: Number(e.target.value) })} className={feld} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Spalten: Gewicht (kg) · Wiederholungen. 0 Wdh. = Satz wird nicht gezählt.</p>
        <button onClick={speichern} className="mt-5 min-h-14 w-full rounded-2xl bg-primary font-display text-base font-extrabold text-primary-foreground">
          Training speichern
        </button>
      </div>
    </div>
  );
}
