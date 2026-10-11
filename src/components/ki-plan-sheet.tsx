import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Chip } from "@/components/ui-kit";
import { uebungsBibliothek, type LibUebung } from "@/lib/exercise-library";
import { effektivesProfil, type OnboardingProfil } from "@/lib/onboarding-store";
import { kiPlanErstellen } from "@/lib/ki-plan.functions";
type KiPlanTemplate = { titel: string; uebungen: { id: string; saetze: number; wdhVon: number; wdhBis: number; begruendung: string }[] };

const EQUIPMENT = ["Körpergewicht", "Kurzhantel", "Langhantel", "Maschine", "Kabel", "Band"];

export function KiPlanSheet({
  profil,
  eigene,
  onUebernehmen,
  onSchliessen,
}: {
  profil: OnboardingProfil;
  eigene: LibUebung[];
  onUebernehmen: (t: KiPlanTemplate[]) => void;
  onSchliessen: () => void;
}) {
  const eff = effektivesProfil(profil);
  const [ziel, setZiel] = useState(String(eff.ziel ?? ""));
  const [tage, setTage] = useState(Number(eff.trainingstage) || 3);
  const [dauer, setDauer] = useState(Number(eff.dauer) || 45);
  const [fokus, setFokus] = useState("");
  const [einschraenkungen, setEinschraenkungen] = useState(profil.einschraenkungen.join(", "));
  const [nichtMag, setNichtMag] = useState("");
  const [equipment, setEquipment] = useState<string[]>(EQUIPMENT);
  const [freitext, setFreitext] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [plan, setPlan] = useState<KiPlanTemplate[] | null>(null);
  const erstelle = useServerFn(kiPlanErstellen);

  const alle = [...uebungsBibliothek, ...eigene.filter((e) => !uebungsBibliothek.some((u) => u.id === e.id))];
  const nameVon = (id: string) => alle.find((u) => u.id === id)?.name ?? id;

  async function los() {
    setLaedt(true);
    setFehler(null);
    try {
      const profilText = [
        `Geschlecht: ${profil.geschlecht ?? "unbekannt"}, Alter: ${eff.alter ?? "—"}, Größe: ${eff.groesse ?? "—"} cm`,
        `Erfahrung: ${eff.erfahrung}`,
        `Trainingsorte: ${profil.orte.join(", ") || "—"}`,
        `Gesundheit: ${[...profil.einschraenkungen, profil.gesundheitNotiz].filter(Boolean).join("; ") || "—"}`,
      ].join("\n");
      const r = await erstelle({
        data: {
          profil: profilText,
          formular: { ziel, tage, dauer, fokus, einschraenkungen, nichtMag, equipment, freitext },
          uebungen: alle.map((u) => ({ id: u.id, name: u.name, muskel: u.muskel, equipment: u.equipment })),
        },
      });
      setPlan(r.templates);
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Der Plan konnte nicht erstellt werden.");
    } finally {
      setLaedt(false);
    }
  }

  const feld = "w-full min-w-0 rounded-xl border border-border bg-card px-3 py-2 text-sm";
  const label = "block text-xs font-semibold text-muted-foreground";

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-foreground/40" aria-label="Schließen" onClick={onSchliessen} />
      <div className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <p className="font-display text-xl font-extrabold">{plan ? "Dein KI-Plan" : "Plan mit KI erstellen"}</p>
          <button onClick={onSchliessen} className="grid h-12 w-12 place-items-center" aria-label="Schließen">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!plan && (
          <div className="mt-2 space-y-3">
            <label className={label}>Ziel<input className={feld} value={ziel} onChange={(e) => setZiel(e.target.value)} placeholder="z. B. Muskelaufbau" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className={label}>Trainingstage pro Woche
                <select className={feld} value={tage} onChange={(e) => setTage(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className={label}>Dauer pro Einheit
                <select className={feld} value={dauer} onChange={(e) => setDauer(Number(e.target.value))}>
                  {[30, 45, 60, 75, 90].map((n) => <option key={n} value={n}>{n} min</option>)}
                </select>
              </label>
            </div>
            <label className={label}>Fokus<input className={feld} value={fokus} onChange={(e) => setFokus(e.target.value)} placeholder="z. B. Oberkörper" /></label>
            <label className={label}>Einschränkungen<input className={feld} value={einschraenkungen} onChange={(e) => setEinschraenkungen(e.target.value)} placeholder="z. B. Schulter, unterer Rücken" /></label>
            <label className={label}>Übungen, die ich nicht mag<input className={feld} value={nichtMag} onChange={(e) => setNichtMag(e.target.value)} placeholder="z. B. Kniebeugen, Dips" /></label>
            <div>
              <p className={label}>Verfügbares Equipment</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {EQUIPMENT.map((e) => (
                  <Chip key={e} active={equipment.includes(e)} onClick={() => setEquipment((a) => (a.includes(e) ? a.filter((x) => x !== e) : [...a, e]))}>{e}</Chip>
                ))}
              </div>
            </div>
            <label className={label}>Sonstiges<textarea className={feld} rows={3} value={freitext} onChange={(e) => setFreitext(e.target.value)} placeholder="Weitere Wünsche" /></label>
            {fehler && <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{fehler}</p>}
            <button onClick={los} disabled={laedt} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60">
              {laedt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {laedt ? "Plan wird erstellt …" : "Plan erstellen"}
            </button>
          </div>
        )}

        {plan && (
          <div className="mt-2 space-y-4">
            {plan.map((t, i) => (
              <div key={i} className="rounded-2xl border border-border p-4">
                <p className="font-display text-base font-extrabold">{t.titel}</p>
                <ul className="mt-2 space-y-2">
                  {t.uebungen.map((u) => (
                    <li key={u.id} className="text-sm">
                      <p className="font-semibold">{nameVon(u.id)} <span className="num font-normal text-muted-foreground">· {u.saetze} × {u.wdhVon}–{u.wdhBis}</span></p>
                      {u.begruendung && <p className="text-xs text-muted-foreground">{u.begruendung}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {fehler && <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{fehler}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setPlan(null); void los(); }} disabled={laedt} className="min-h-12 rounded-xl border border-border text-sm font-bold disabled:opacity-60">
                {laedt ? "Erstelle …" : "Neu erstellen"}
              </button>
              <button
                onClick={() => { onUebernehmen(plan); toast.success(`${plan.length} Templates übernommen`); onSchliessen(); }}
                className="min-h-12 rounded-xl bg-primary text-sm font-bold text-primary-foreground"
              >
                Übernehmen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
