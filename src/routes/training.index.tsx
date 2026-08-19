import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, Chip, Disclaimer, Section, Why } from "@/components/ui-kit";
import { zeitModi, muskelStatus, goalLabels, type MuscleKey } from "@/lib/demo-data";
import { useOnboardingProfil } from "@/lib/onboarding-store";
import {
  erzeugePlan,
  fokusOptionen,
  mappeEquipment,
  usePlanEinstellungen,
  wendeTauschAn,
  wochentage,
  type Fokus,
  type PlanKontext,
} from "@/lib/training-plan";
import { alternativenFuer, bildFuer } from "@/lib/exercise-library";
import { ChevronRight, History, Repeat, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/training/")({
  head: () => ({
    meta: [
      { title: "Training – EVION" },
      {
        name: "description",
        content:
          "Trainingsplan mit Übungsbildern, individuellem Fokus, Übungstausch und Zeit-Effizienz-Modus.",
      },
      { property: "og:title", content: "Training – EVION" },
      { property: "og:description", content: "Dein Plan – angepasst an Ziel, Alter, Geschlecht und Zeit." },
    ],
  }),
  component: TrainingPage,
});

const rekorde = [
  { uebung: "Bankdrücken", wert: "95 kg × 3", e1rm: "≈ 101 kg", datum: "vor 4 Tagen" },
  { uebung: "Kniebeuge", wert: "137,5 kg × 4", e1rm: "≈ 152 kg", datum: "vor 8 Tagen" },
  { uebung: "Kreuzheben", wert: "170 kg × 3", e1rm: "≈ 181 kg", datum: "vor 12 Tagen" },
  { uebung: "Klimmzüge", wert: "+20 kg × 6", e1rm: "—", datum: "vor 6 Tagen" },
];

function TrainingPage() {
  const { profil } = useOnboardingProfil();
  const { einstellungen, speichere, tausche } = usePlanEinstellungen();
  const [zeit, setZeit] = useState(45);
  const [tagIndex, setTagIndex] = useState(0);
  const [tauschFuer, setTauschFuer] = useState<string | null>(null);

  const modus = zeitModi.find((m) => m.minuten === zeit) ?? zeitModi[2]!;

  const kontext: PlanKontext = useMemo(
    () => ({
      ziel: profil.abgeschlossen ? profil.ziel : "recomposition",
      geschlecht: profil.geschlecht,
      alter: profil.alter,
      erfahrung: profil.erfahrung,
      equipment: mappeEquipment([...(profil.equipment ?? []), ...(profil.orte ?? [])]),
      tage: profil.tage || 4,
      dauer: zeit,
      fokus: einstellungen.fokus,
    }),
    [profil, zeit, einstellungen.fokus],
  );

  const plan = useMemo(
    () => wendeTauschAn(erzeugePlan(kontext), einstellungen.tausch),
    [kontext, einstellungen.tausch],
  );

  const tag = plan[Math.min(tagIndex, plan.length - 1)] ?? plan[0]!;
  const fokusInfo = fokusOptionen.find((f) => f.id === einstellungen.fokus)!;

  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">Training</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">{tag.titel}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ziel: {goalLabels[kontext.ziel]} · Fokus: {fokusInfo.titel} · {tag.uebungen.length} Übungen ·{" "}
          {modus.saetze} produktive Sätze
        </p>
      </header>

      <Section titel="Trainingsfokus wählen">
        <Card>
          <div className="flex flex-wrap gap-2">
            {fokusOptionen.map((f) => (
              <Chip
                key={f.id}
                active={f.id === einstellungen.fokus}
                onClick={() => {
                  speichere({ fokus: f.id as Fokus });
                  toast.success(`Plan neu berechnet: ${f.titel}`);
                }}
              >
                {f.titel}
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{fokusInfo.beschreibung}</p>
          <Why
            punkte={[
              `Ziel „${goalLabels[kontext.ziel]}“ steuert Wiederholungsbereiche und Übungsauswahl.`,
              `Alter ${kontext.alter ?? "—"} und Erfahrung „${kontext.erfahrung}“ bestimmen, wie technisch anspruchsvoll die Übungen sein dürfen.`,
              kontext.geschlecht
                ? `Angaben zu Geschlecht (${kontext.geschlecht}) fließen als Schwerpunkt ein – jede Übung bleibt frei austauschbar.`
                : "Ohne Geschlechtsangabe wird ein neutraler Schwerpunkt gewählt.",
              "Rückenschonend und Rückbildung schließen Übungen mit hoher Wirbelsäulen- bzw. Beckenbodenbelastung komplett aus.",
            ]}
          />
        </Card>
      </Section>

      <Section titel="Wie viel Zeit hast du heute?">
        <Card>
          <div className="flex flex-wrap gap-2">
            {zeitModi.map((m) => (
              <Chip key={m.minuten} active={zeit === m.minuten} onClick={() => setZeit(m.minuten)}>
                {m.titel}
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{modus.beschreibung}</p>
          <Link
            to="/training/workout"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-display text-base font-extrabold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-[1.01]"
          >
            Training starten <ChevronRight className="h-5 w-5" />
          </Link>
        </Card>
      </Section>

      <Section titel="Trainingswoche">
        <Card className="p-2">
          <ul className="divide-y divide-border">
            {plan.map((t, i) => (
              <li key={t.index}>
                <button
                  onClick={() => setTagIndex(i)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{wochentage[i]}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.titel} · {t.uebungen.map((u) => u.name).join(", ")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                      i === tagIndex ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {i === tagIndex ? "Ausgewählt" : "Anzeigen"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section titel={`Übungen – ${tag.titel}`}>
        <div className="space-y-3">
          {tag.uebungen.map((u) => (
            <Card key={u.id} className="overflow-hidden p-0">
              <img
                src={bildFuer(u, profil.geschlecht)}
                alt={`Ausführung der Übung ${u.name}`}
                loading="lazy"
                width={768}
                height={512}
                className="h-40 w-full bg-secondary object-cover"
              />
              <div className="p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display font-bold">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.muskel} · {u.zielSaetze} Sätze · {u.wdhBereich} Wdh.
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setTauschFuer(tauschFuer === u.id ? null : u.id)}
                      className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-bold"
                    >
                      <Repeat className="h-3.5 w-3.5" /> Tauschen
                    </button>
                    <button
                      onClick={() => {
                        entferneUebung(tag.index, u.id);
                        toast(`${u.name} entfernt`);
                      }}
                      aria-label={`${u.name} aus dem Tag entfernen`}
                      className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Entfernen
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{u.hinweis}</p>
                <p className="mt-1 text-xs text-primary">Warum: {u.begruendung}</p>

                {tauschFuer === u.id && (
                  <div className="mt-4 rounded-2xl border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="label-xs">Alternative wählen</p>
                      <button onClick={() => setTauschFuer(null)} aria-label="Auswahl schließen">
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {alternativenFuer(originalId(u.id, einstellungen.tausch)).map((a) => (
                        <li key={a.id}>
                          <button
                            onClick={() => {
                              tausche(originalId(u.id, einstellungen.tausch), a.id);
                              setTauschFuer(null);
                              toast.success(`${a.name} übernommen`);
                            }}
                            className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-secondary/60"
                          >
                            <img
                              src={bildFuer(a, profil.geschlecht)}
                              alt=""
                              loading="lazy"
                              width={768}
                              height={512}
                              className="h-10 w-16 shrink-0 rounded-lg object-cover"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold">{a.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {a.muskel} · {a.equipment.join(", ")}
                                {a.rueckenschonend ? " · rückenschonend" : ""}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <button
          onClick={() => setPickerOffen((o) => !o)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-5 py-4 font-display text-sm font-extrabold uppercase tracking-wide text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" /> Übung hinzufügen
        </button>

        {pickerOffen && (
          <UebungHinzufuegen
            geschlecht={profil.geschlecht}
            eigene={einstellungen.eigene ?? []}
            bereitsImTag={tag.uebungen.map((u) => u.id)}
            onWaehlen={(id, name) => {
              fuegeUebungHinzu(tag.index, id);
              setPickerOffen(false);
              toast.success(`${name} hinzugefügt`);
            }}
            onEigeneErstellen={(u) => {
              erstelleEigene(u);
              fuegeUebungHinzu(tag.index, u.id);
              setPickerOffen(false);
              toast.success(`${u.name} erstellt und hinzugefügt`);
            }}
            onEigeneLoeschen={(id) => loescheEigene(id)}
            onSchliessen={() => setPickerOffen(false)}
          />
        )}

        {(Object.keys(einstellungen.tausch).length > 0 ||
          Object.values(einstellungen.entfernt ?? {}).some((v) => v.length > 0) ||
          Object.values(einstellungen.zusatz ?? {}).some((v) => v.length > 0)) && (
          <button
            onClick={() => {
              speichere({ tausch: {}, entfernt: {}, zusatz: {} });
              toast("Plan auf den Vorschlag zurückgesetzt");
            }}
            className="text-xs font-bold uppercase tracking-wider text-primary"
          >
            Alle Anpassungen zurücksetzen
          </button>
        )}
      </Section>


      <Section titel="Wochenvolumen je Muskelgruppe">
        <Card>
          <ul className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(muskelStatus) as MuscleKey[]).map((k) => {
              const m = muskelStatus[k];
              return (
                <li
                  key={k}
                  className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2 text-sm"
                >
                  <span className="truncate">{m.name}</span>
                  <span className="num shrink-0 text-muted-foreground">
                    {m.saetze} / {m.ziel}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </Section>

      <Section titel="Persönliche Rekorde">
        <Card className="p-2">
          <ul className="divide-y divide-border">
            {rekorde.map((r) => (
              <li key={r.uebung} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
                <Trophy className="h-4 w-4 shrink-0 text-accent" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{r.uebung}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.datum} · geschätztes 1RM {r.e1rm}
                  </p>
                </div>
                <span className="num shrink-0 text-sm font-bold">{r.wert}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Disclaimer>
          Das 1RM wird aus Gewicht und Wiederholungen berechnet (Schätzformel) und ist kein tatsächlich
          getesteter Maximalwert.
        </Disclaimer>
      </Section>

      <Section titel="Historie">
        <Card className="flex items-center gap-3 text-sm text-muted-foreground">
          <History className="h-4 w-4 shrink-0" />
          94 abgeschlossene Trainings · Ø 3,8 Einheiten/Woche · Ø 47 Minuten
        </Card>
      </Section>

      <Disclaimer>
        Die Planvorschläge sind allgemeine Trainingsempfehlungen und ersetzen keine physiotherapeutische
        oder ärztliche Beratung. Nach Schwangerschaft, Operationen oder bei Beschwerden bitte vorab
        fachlich abklären lassen.
      </Disclaimer>
    </div>
  );
}

/** Findet die ursprüngliche Plan-ID zurück, wenn bereits getauscht wurde. */
function originalId(aktuelleId: string, tausch: Record<string, string>) {
  const eintrag = Object.entries(tausch).find(([, zu]) => zu === aktuelleId);
  return eintrag ? eintrag[0] : aktuelleId;
}
