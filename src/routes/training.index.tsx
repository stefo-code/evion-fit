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
  wendeAnpassungenAn,
  wendeTauschAn,
  wochentage,
  type Fokus,
  type PlanKontext,
} from "@/lib/training-plan";
import {
  alternativenFuer,
  bildFuer,
  uebungsBibliothek,
  type Equipment,
  type LibUebung,
  type Muster,
} from "@/lib/exercise-library";
import { ChevronRight, History, Plus, Repeat, Trash2, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  einheitenSeit,
  rekorde as ermittleRekorde,
  streak as serie,
  useAktivitaet,
  volumen as satzVolumen,
} from "@/lib/activity-store";


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

function TrainingPage() {
  const { profil } = useOnboardingProfil();
  const {
    einstellungen,
    speichere,
    tausche,
    entferneUebung,
    fuegeUebungHinzu,
    erstelleEigene,
    loescheEigene,
  } = usePlanEinstellungen();
  const { aktivitaet } = useAktivitaet();
  const rekorde = ermittleRekorde(aktivitaet);
  const [zeit, setZeit] = useState(45);
  const [tagIndex, setTagIndex] = useState(0);
  const [tauschFuer, setTauschFuer] = useState<string | null>(null);
  const [pickerOffen, setPickerOffen] = useState(false);

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
    () => wendeAnpassungenAn(wendeTauschAn(erzeugePlan(kontext), einstellungen.tausch), einstellungen),
    [kontext, einstellungen],
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
                  speichere({ fokus: f.id as Fokus, tausch: {}, entfernt: {}, zusatz: {} });
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
            search={{ tag: tagIndex }}
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
                <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-display font-bold">{u.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.muskel} · {u.zielSaetze} Sätze · {u.wdhBereich} Wdh.
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setTauschFuer(tauschFuer === u.id ? null : u.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold sm:flex-none sm:py-1.5"
                    >
                      <Repeat className="h-3.5 w-3.5" /> Tauschen
                    </button>
                    <button
                      onClick={() => {
                        entferneUebung(tag.index, u.id);
                        toast(`${u.name} entfernt`);
                      }}
                      aria-label={`${u.name} aus dem Tag entfernen`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground sm:flex-none sm:py-1.5"
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
          {rekorde.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              Noch keine Rekorde – nach deinem ersten protokollierten Training erscheinen sie hier.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {rekorde.slice(0, 8).map((r) => (
                <li
                  key={r.uebungId}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3"
                >
                  <Trophy className="h-4 w-4 shrink-0 text-accent" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(r.datum).toLocaleDateString("de-DE")} · geschätztes 1RM ≈ {r.e1rm} kg
                    </p>
                  </div>
                  <span className="num shrink-0 text-sm font-bold">
                    {r.gewicht} kg × {r.wdh}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Disclaimer>
          Das 1RM wird aus Gewicht und Wiederholungen berechnet (Schätzformel) und ist kein tatsächlich
          getesteter Maximalwert.
        </Disclaimer>
      </Section>

      <Section titel="Historie">
        <Card className="flex items-center gap-3 text-sm text-muted-foreground">
          <History className="h-4 w-4 shrink-0" />
          {aktivitaet.einheiten.length} abgeschlossene Trainings · {einheitenSeit(aktivitaet, 7).length} in
          den letzten 7 Tagen · Serie {serie(aktivitaet)} ·{" "}
          {aktivitaet.einheiten.length > 0
            ? `Ø ${Math.round(
                aktivitaet.einheiten.reduce((s, e) => s + e.dauerMin, 0) / aktivitaet.einheiten.length,
              )} Minuten · Ø ${Math.round(
                aktivitaet.einheiten.reduce((s, e) => s + satzVolumen(e.saetze), 0) /
                  aktivitaet.einheiten.length,
              ).toLocaleString("de-DE")} kg Volumen`
            : "noch keine Historie"}
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

const musterLabels: { id: Muster; label: string }[] = [
  { id: "druecken", label: "Drücken" },
  { id: "ziehen", label: "Ziehen" },
  { id: "kniebeuge", label: "Kniebeuge" },
  { id: "huefte", label: "Hüfte / Gesäß" },
  { id: "schulter", label: "Schulter" },
  { id: "arme", label: "Arme" },
  { id: "core", label: "Rumpf" },
  { id: "mobility", label: "Mobility" },
];

const equipmentOptionen: Equipment[] = [
  "körpergewicht",
  "kurzhantel",
  "langhantel",
  "maschine",
  "kabel",
  "band",
];

/** Auswahl aus der Bibliothek oder Anlegen einer eigenen Übung. */
function UebungHinzufuegen({
  geschlecht,
  eigene,
  bereitsImTag,
  onWaehlen,
  onEigeneErstellen,
  onEigeneLoeschen,
  onSchliessen,
}: {
  geschlecht: string | null;
  eigene: LibUebung[];
  bereitsImTag: string[];
  onWaehlen: (id: string, name: string) => void;
  onEigeneErstellen: (u: LibUebung) => void;
  onEigeneLoeschen: (id: string) => void;
  onSchliessen: () => void;
}) {
  const [suche, setSuche] = useState("");
  const [eigenModus, setEigenModus] = useState(false);
  const [name, setName] = useState("");
  const [muskel, setMuskel] = useState("");
  const [muster, setMuster] = useState<Muster>("druecken");
  const [equipment, setEquipment] = useState<Equipment[]>(["körpergewicht"]);
  const [saetze, setSaetze] = useState(3);
  const [wdh, setWdh] = useState("8–12");

  const treffer = useMemo(() => {
    const q = suche.trim().toLowerCase();
    const alle = [...eigene, ...uebungsBibliothek];
    return alle
      .filter((u) => !bereitsImTag.includes(u.id))
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.muskel.toLowerCase().includes(q))
      .slice(0, 40);
  }, [suche, eigene, bereitsImTag]);

  function speichereEigene() {
    if (!name.trim()) {
      toast.error("Bitte einen Namen für die Übung angeben.");
      return;
    }
    onEigeneErstellen({
      id: `eigen-${Date.now()}`,
      name: name.trim(),
      muskel: muskel.trim() || "Ganzkörper",
      muster,
      equipment: equipment.length ? equipment : ["körpergewicht"],
      grund: false,
      zielSaetze: saetze,
      wdhBereich: wdh.trim() || "8–12",
      startGewicht: 0,
      hinweis: "Selbst angelegte Übung.",
      rueckenschonend: true,
      rueckbildung: false,
      einsteiger: true,
    });
  }

  return (
    <Card className="mt-3">
      <div className="flex items-center justify-between">
        <p className="label-xs">{eigenModus ? "Eigene Übung erstellen" : "Übung auswählen"}</p>
        <button onClick={onSchliessen} aria-label="Auswahl schließen">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {!eigenModus ? (
        <>
          <input
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Übung oder Muskelgruppe suchen …"
            className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <ul className="mt-3 max-h-80 space-y-1.5 overflow-y-auto">
            {treffer.map((a) => (
              <li key={a.id}>
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                  <button
                    onClick={() => onWaehlen(a.id, a.name)}
                    className="col-span-2 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-secondary/60"
                  >
                    <img
                      src={bildFuer(a, geschlecht)}
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
                      </span>
                    </span>
                  </button>
                  {a.id.startsWith("eigen-") && (
                    <button
                      onClick={() => onEigeneLoeschen(a.id)}
                      aria-label={`${a.name} dauerhaft löschen`}
                      className="p-2 text-muted-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
            {treffer.length === 0 && (
              <li className="px-2 py-4 text-sm text-muted-foreground">
                Keine passende Übung gefunden – lege sie einfach selbst an.
              </li>
            )}
          </ul>
          <button
            onClick={() => setEigenModus(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold"
          >
            <Plus className="h-4 w-4" /> Eigene Übung erstellen
          </button>
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="block text-sm">
            <span className="label-xs">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Rudern am Seilzug einarmig"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <label className="block text-sm">
            <span className="label-xs">Muskelgruppe</span>
            <input
              value={muskel}
              onChange={(e) => setMuskel(e.target.value)}
              placeholder="z. B. Rücken"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <div>
            <span className="label-xs">Bewegungsmuster</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {musterLabels.map((m) => (
                <Chip key={m.id} active={muster === m.id} onClick={() => setMuster(m.id)}>
                  {m.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <span className="label-xs">Equipment</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {equipmentOptionen.map((e) => (
                <Chip
                  key={e}
                  active={equipment.includes(e)}
                  onClick={() =>
                    setEquipment((alt) =>
                      alt.includes(e) ? alt.filter((x) => x !== e) : [...alt, e],
                    )
                  }
                >
                  {e}
                </Chip>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="label-xs">Sätze</span>
              <input
                type="number"
                min={1}
                max={10}
                value={saetze}
                onChange={(e) => setSaetze(Number(e.target.value) || 3)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
              />
            </label>
            <label className="block text-sm">
              <span className="label-xs">Wiederholungen</span>
              <input
                value={wdh}
                onChange={(e) => setWdh(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={speichereEigene}
              className="flex-1 rounded-xl bg-primary px-4 py-3 font-display text-sm font-extrabold uppercase tracking-wide text-primary-foreground"
            >
              Übung speichern
            </button>
            <button
              onClick={() => setEigenModus(false)}
              className="rounded-xl border border-border px-4 py-3 text-sm font-bold"
            >
              Zurück
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
