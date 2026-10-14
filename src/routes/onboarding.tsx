import { pruefeSpitzname } from "@/lib/privatsphaere";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Apple,
  ArrowRight,
  Check,
  ChevronLeft,
  Dumbbell,
  Flame,
  Heart,
  Leaf,
  Repeat,
  Scale,
  Shield,
  Timer,
  Zap,
} from "lucide-react";
import { EvionLogo } from "@/components/logo";
import { goalLabels, type Goal } from "@/lib/demo-data";
import {
  berechnePlan,
  ladeProfil,
  leeresProfil,
  speichereProfil,
  type Geschlecht,
  type OnboardingProfil,
} from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OnboardingSync } from "@/components/onboarding-sync";
import { messFelder } from "@/lib/activity-store";
import { aktuellerOnboardingSchritt, onboardingSchritte, speichereOnboardingStartwerte, studioAusstattung } from "@/lib/onboarding-flow";
import heroBild from "@/assets/onboarding-hero.png";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Onboarding – EVION" },
      {
        name: "description",
        content: "In wenigen Minuten zu deinem persönlichen Trainings- und Ernährungsplan.",
      },
      { property: "og:title", content: "Onboarding – EVION" },
      { property: "og:description", content: "Deine Reise. Deine Ziele. Wir machen den Rest." },
    ],
  }),
  component: OnboardingPage,
});

const SCHRITTE = onboardingSchritte;

function OnboardingPage() {
  const navigate = useNavigate();
  const [p, setP] = useState<OnboardingProfil>(leeresProfil);
  const [phase, setPhase] = useState<"welcome" | "schritte" | "analyse" | "plan">("welcome");
  const [i, setI] = useState(0);
  const [geladen, setGeladen] = useState(false);
  const [fehler, setFehler] = useState("");

  useEffect(() => {
    const gespeichert = ladeProfil();
    setP(gespeichert);
    setGeladen(true);
    if (!gespeichert.abgeschlossen && gespeichert.schritt > 0) {
      setPhase("schritte");
      setI(aktuellerOnboardingSchritt(gespeichert));
    }
  }, []);

  function set(teil: Partial<OnboardingProfil>) {
    setP((alt) => {
      const neu = { ...alt, ...teil };
      speichereProfil(neu);
      return neu;
    });
  }

  function weiter() {
    setFehler("");
    if (SCHRITTE[i] === "ueberdich") {
      const nameFehler = pruefeSpitzname(p.name);
      if (nameFehler) { setFehler(nameFehler); return; }
      if (p.gewicht !== null && (!Number.isFinite(p.gewicht) || p.gewicht < 30 || p.gewicht > 250)) {
        setFehler("Bitte ein Gewicht zwischen 30 und 250 kg eingeben oder das Feld leer lassen."); return;
      }
      const datum = speichereOnboardingStartwerte(p);
      if (datum) set({ startMessungDatum: datum });
    }
    if (SCHRITTE[i] === "messung") {
      for (const feld of messFelder.filter((f) => f.key === "koerperfett" || f.gruppe === "umfang")) {
        const wert = p.startwerte?.[feld.key as keyof NonNullable<OnboardingProfil["startwerte"]>];
        if (typeof wert === "number" && (!Number.isFinite(wert) || wert < feld.min || wert > feld.max)) {
          setFehler(`${feld.label}: bitte einen Wert zwischen ${feld.min} und ${feld.max} ${feld.einheit} eingeben.`); return;
        }
      }
      const datum = speichereOnboardingStartwerte(p, true);
      if (datum) set({ startMessungDatum: datum });
    }
    if (i < SCHRITTE.length - 1) {
      const n = i + 1;
      setI(n);
      set({ schritt: n, schrittVersion: 2 });
      window.scrollTo({ top: 0 });
    } else {
      setPhase("analyse");
    }
  }

  function zurueck() {
    if (i === 0) {
      setPhase("welcome");
      return;
    }
    setFehler("");
    setI(i - 1);
    set({ schritt: i - 1, schrittVersion: 2 });
    window.scrollTo({ top: 0 });
  }

  if (!geladen) return <div role="status" aria-label="Profil wird geladen" className="mx-auto max-w-xl animate-pulse space-y-6 px-5 pt-10"><div className="h-8 w-32 rounded bg-muted" /><div className="h-48 rounded bg-muted" /></div>;
  if (phase === "welcome") return <Welcome onStart={() => { set({ schritt: 0, schrittVersion: 2 }); setPhase("schritte"); }} />;
  if (phase === "analyse") return <Analyse onFertig={() => setPhase("plan")} />;
  if (phase === "plan")
    return (
      <PlanScreen
        p={p}
        onStart={() => {
          // synchron persistieren, damit der Erststart-Check sofort greift
          speichereProfil({ ...ladeProfil(), abgeschlossen: true, schritt: SCHRITTE.length, schrittVersion: 2 });
          navigate({ to: "/" });
        }}

      />
    );

  const aktuell = SCHRITTE[i] ?? "ueberdich";
  const optional = aktuell === "gesundheit";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-10 pt-6">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
        <Button variant="ghost"
          onClick={zurueck}
          aria-label="Zurück"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-center text-xs font-semibold text-muted-foreground">
            Schritt {i + 1} von {SCHRITTE.length}
          </p>
          <div className="mt-2 flex gap-1.5">
            {SCHRITTE.map((s, idx) => (
              <span
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  idx <= i ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex-1 space-y-6">
        {aktuell === "ueberdich" && <UeberDich p={p} set={set} />}
        {aktuell === "ziel" && <ZielSchritt p={p} set={set} />}
        {aktuell === "training" && <TrainingSchritt p={p} set={set} />}
        {aktuell === "ernaehrung" && <ErnaehrungSchritt p={p} set={set} />}
        {aktuell === "gesundheit" && <GesundheitSchritt p={p} set={set} />}
        {aktuell === "messung" && <MessungSchritt p={p} set={set} />}
      </div>

      <div className="mt-10 space-y-3">
        {fehler && <p role="alert" className="text-sm text-destructive">{fehler}</p>}
        <PrimaryButton onClick={weiter}>
          {i === SCHRITTE.length - 1 ? "Plan erstellen" : "Weiter"}
        </PrimaryButton>
        {optional && (
          <Button variant="ghost"
            onClick={weiter}
            className="w-full py-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Überspringen
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Bausteine */

function PrimaryButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Button variant="ghost"
      onClick={onClick}
      className={cn(
        "h-auto min-h-12 w-full whitespace-normal rounded-2xl bg-primary px-5 py-4 hover:bg-primary/90 font-display text-base font-extrabold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform active:scale-[0.99]",
        className,
      )}
    >
      {children}
    </Button>
  );
}

function Titel({ titel, sub }: { titel: string; sub?: string }) {
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold leading-tight">{titel}</h1>
      {sub && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Feldgruppe({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label-xs">{label}</p>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function AuswahlKarte({
  titel,
  sub,
  icon: Icon,
  aktiv,
  onClick,
}: {
  titel: string;
  sub?: string;
  icon?: typeof Heart;
  aktiv?: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="ghost"
      type="button"
      onClick={onClick}
      className={cn(
        "h-auto min-h-12 w-full justify-start whitespace-normal rounded-2xl border bg-card p-4 text-left transition-all",
        aktiv
          ? "border-primary bg-primary/5 shadow-[var(--shadow-glow)]"
          : "border-border hover:border-primary/40",
      )}
    >
      {Icon && (
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
            aktiv ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block whitespace-normal break-words font-semibold">{titel}</span>
        {sub && <span className="block whitespace-normal break-words text-xs text-muted-foreground">{sub}</span>}
      </span>
      {aktiv && <Check className="ml-auto h-5 w-5 shrink-0 text-primary" />}
    </Button>
  );
}

function Pille({
  children,
  aktiv,
  onClick,
}: {
  children: React.ReactNode;
  aktiv?: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="ghost"
      type="button"
      onClick={onClick}
      className={cn(
        "h-auto min-h-12 max-w-full whitespace-normal rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors",
        aktiv
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Button>
  );
}

function ZahlFeld({
  label,
  einheit,
  value,
  onChange,
  platzhalter,
}: {
  label: string;
  einheit: string;
  value: number | null;
  onChange: (n: number | null) => void;
  platzhalter?: string;
}) {
  return (
    <label className="block rounded-2xl border border-border bg-card p-4">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="mt-1 flex items-baseline gap-2">
        <input
          inputMode="decimal"
          value={value ?? ""}
          placeholder={platzhalter}
          onChange={(e) => {
            const n = Number(e.target.value.replace(",", "."));
            onChange(e.target.value === "" || Number.isNaN(n) ? null : n);
          }}
          className="num w-full min-w-0 bg-transparent text-2xl font-bold outline-none"
        />
        <span className="shrink-0 text-sm font-semibold text-muted-foreground">{einheit}</span>
      </span>
    </label>
  );
}

function SpitznameFeld({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const fehler = pruefeSpitzname(value);
  return (
    <Feldgruppe label="Spitzname">
      <input
        value={value}
        maxLength={20}
        placeholder="z. B. Alex"
        onChange={(e) => onChange(e.target.value.slice(0, 20))}
        className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm outline-none focus:border-primary"
      />
      <span className={"mt-1 block text-xs " + (fehler ? "text-destructive" : "text-muted-foreground")}>
        {fehler ?? "Kein echter Name nötig"}
      </span>
    </Feldgruppe>
  );
}

function TextFeld({
  label,
  value,
  onChange,
  platzhalter,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  platzhalter?: string;
}) {
  return (
    <Feldgruppe label={label}>
      <input
        value={value}
        placeholder={platzhalter}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm outline-none focus:border-primary"
      />
    </Feldgruppe>
  );
}

function PrivacyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-primary/8 p-4 text-xs leading-relaxed text-muted-foreground">
      <Shield className="h-4 w-4 shrink-0 text-primary" />
      <span>{children}</span>
    </div>
  );
}

function toggle(liste: string[], wert: string) {
  return liste.includes(wert) ? liste.filter((x) => x !== wert) : [...liste, wert];
}

/* ------------------------------------------------------------------ Screens */

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 pb-8 pt-8">
      <EvionLogo className="h-8" />
      <h1 className="mt-8 font-display text-3xl font-extrabold leading-tight">Dein Training. Deine Ernährung. Dein Fortschritt.</h1>
      <img src={heroBild} alt="Sportliche Frau und sportlicher Mann" width={912} height={1104} className="mx-auto mt-6 h-64 w-full object-contain sm:h-80" />
      <div className="mt-auto pt-6">
        <PrimaryButton onClick={onStart}>Los geht’s <ArrowRight /></PrimaryButton>
        <p className="mt-4 text-center text-sm text-muted-foreground">Kein Konto nötig. Sync ist am Ende optional.</p>
      </div>
    </div>
  );
}

type SchrittProps = { p: OnboardingProfil; set: (t: Partial<OnboardingProfil>) => void };

function UeberDich({ p, set }: SchrittProps) {
  const geschlechter: { key: Geschlecht; label: string }[] = [
    { key: "weiblich", label: "Weiblich" },
    { key: "maennlich", label: "Männlich" },
    { key: "divers", label: "Divers" },
  ];
  return (
    <>
      <Titel
        titel="Erzähl uns etwas über dich"
        sub="Diese Angaben helfen uns, deinen Plan optimal auf dich abzustimmen."
      />
      <SpitznameFeld value={p.name} onChange={(v) => set({ name: v })} />
      <Feldgruppe label="Geschlecht">
        <div className="grid grid-cols-3 gap-2.5">
          {geschlechter.map((g) => (
            <Button variant="ghost"
              key={g.key}
              onClick={() => set({ geschlecht: g.key })}
              className={cn(
                "rounded-2xl border bg-card px-2 py-4 text-sm font-semibold transition-all",
                p.geschlecht === g.key
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              {g.label}
            </Button>
          ))}
        </div>
      </Feldgruppe>
      <div className="grid grid-cols-2 gap-3">
        <ZahlFeld label="Alter" einheit="Jahre" value={p.alter} onChange={(n) => set({ alter: n })} platzhalter="28" />
        <ZahlFeld
          label="Größe"
          einheit="cm"
          value={p.groesse}
          onChange={(n) => set({ groesse: n })}
          platzhalter="178"
        />
      </div>
      <ZahlFeld
        label="Aktuelles Gewicht"
        einheit="kg"
        value={p.gewicht}
        onChange={(n) => set({ gewicht: n })}
        platzhalter="78,5"
      />
      <PrivacyCard>
        Deine Daten sind privat und können jederzeit geändert oder gelöscht werden. Geschlecht nutzen wir
        nur dort, wo es für eine Berechnung tatsächlich relevant ist – nie für stereotype Pläne.
      </PrivacyCard>
    </>
  );
}

const zielKarten: { key: Goal; sub: string; icon: typeof Leaf }[] = [
  { key: "fettabbau", sub: "Körperfett reduzieren", icon: Leaf },
  { key: "muskelaufbau", sub: "Muskeln aufbauen", icon: Dumbbell },
  { key: "recomposition", sub: "Fett reduzieren & Muskeln aufbauen", icon: Repeat },
  { key: "kraft", sub: "Stärker werden", icon: Zap },
  { key: "fitness", sub: "Gesundheit & Wohlbefinden", icon: Heart },
];

function ZielSchritt({ p, set }: SchrittProps) {
  return (
    <>
      <Titel titel="Was möchtest du erreichen?" sub="Wähle dein Hauptziel – Details fragen wir gleich passend dazu." />
      <div className="space-y-3">
        {zielKarten.map((z) => (
          <AuswahlKarte
            key={z.key}
            titel={goalLabels[z.key]}
            sub={z.sub}
            icon={z.icon}
            aktiv={p.ziel === z.key}
            onClick={() => set({ ziel: z.key })}
          />
        ))}
      </div>

      {(p.ziel === "fettabbau" || p.ziel === "muskelaufbau") && (
        <>
          <ZahlFeld
            label={p.ziel === "fettabbau" ? "Wunschgewicht" : "Zielgewicht (optional)"}
            einheit="kg"
            value={p.zielGewicht}
            onChange={(n) => set({ zielGewicht: n })}
            platzhalter="73"
          />
          <Feldgruppe label="Gewünschtes Tempo (optional)">
            <div className="flex flex-wrap gap-2">
              {(["sanft", "moderat", "ambitioniert"] as const).map((t) => (
                <Pille key={t} aktiv={p.tempo === t} onClick={() => set({ tempo: t })}>
                  {t === "sanft" ? "Sanft" : t === "moderat" ? "Moderat" : "Ambitioniert"}
                </Pille>
              ))}
            </div>
          </Feldgruppe>
          <p className="text-xs text-muted-foreground">
            EVION empfiehlt maximal etwa 0,5–0,75 % Körpergewicht pro Woche – gesund und nachhaltig.
          </p>
        </>
      )}

      {p.ziel === "recomposition" && (
        <>
          <Feldgruppe label="Gewichtsstrategie">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["fettabbau", "Leicht reduzieren"],
                  ["ausgewogen", "Gewicht halten"],
                  ["muskelaufbau", "Leicht erhöhen"],
                ] as const
              ).map(([k, l]) => (
                <Pille key={k} aktiv={p.recompFokus === k} onClick={() => set({ recompFokus: k })}>
                  {l}
                </Pille>
              ))}
            </div>
          </Feldgruppe>
          <ZahlFeld
            label="Zielgewicht (optional)"
            einheit="kg"
            value={p.zielGewicht}
            onChange={(n) => set({ zielGewicht: n })}
            platzhalter="77"
          />
        </>
      )}
    </>
  );
}

function TrainingSchritt({ p, set }: SchrittProps) {
  return (
    <>
      <Titel titel="Wie möchtest du trainieren?" />
      <Feldgruppe label="Trainingserfahrung">
        <div className="flex flex-wrap gap-2">
          {(["Anfänger", "Fortgeschritten", "Erfahren"] as const).map((e) => (
            <Pille key={e} aktiv={p.erfahrung === e} onClick={() => set({ erfahrung: e })}>
              {e}
            </Pille>
          ))}
        </div>
      </Feldgruppe>
      <Feldgruppe label="Trainingsort (mehrere möglich)">
        <div className="grid gap-2.5 sm:grid-cols-3">
          {["Fitnessstudio", "Zuhause", "Outdoor"].map((o) => (
            <AuswahlKarte
              key={o}
              titel={o}
              aktiv={p.orte.includes(o)}
              onClick={() => {
                const orte = toggle(p.orte, o);
                const equipment = orte.includes("Fitnessstudio")
                  ? [...new Set([...p.equipment, ...studioAusstattung])]
                  : p.equipment.filter((e) => e !== "Voll ausgestattetes Fitnessstudio");
                set({ orte, equipment });
              }}
            />
          ))}
        </div>
      </Feldgruppe>
      <EquipmentSchritt p={p} set={set} />
      <Feldgruppe label="Wie oft möchtest du trainieren?">
        <div className="flex flex-wrap gap-2">
          {[2, 3, 4, 5, 6].map((t) => (
            <Pille key={t} aktiv={p.tage === t} onClick={() => set({ tage: t })}>
              {t}× / Woche
            </Pille>
          ))}
        </div>
      </Feldgruppe>
      <Feldgruppe label="Wie viel Zeit möchtest du investieren?">
        <div className="flex flex-wrap gap-2">
          {[20, 30, 45, 60, 75].map((d) => (
            <Pille key={d} aktiv={p.dauer === d} onClick={() => set({ dauer: d })}>
              {d === 75 ? "60+ Min." : `${d} Min.`}
            </Pille>
          ))}
        </div>
      </Feldgruppe>
      <div className="flex gap-3 rounded-2xl bg-secondary/60 p-4 text-xs leading-relaxed text-muted-foreground">
        <Timer className="h-4 w-4 shrink-0 text-primary" />
        EVION optimiert deinen Trainingsplan auf die Zeit, die dir tatsächlich zur Verfügung steht.
      </div>
    </>
  );
}

function EquipmentSchritt({ p, set }: SchrittProps) {
  const nurZuhause = p.orte.length > 0 && !p.orte.includes("Fitnessstudio");
  const optionen = nurZuhause
    ? ["Kurzhanteln", "Kettlebells", "Widerstandsbänder", "Klimmzugstange", "Cardio-Geräte", "Nur Körpergewicht"]
    : [
        "Voll ausgestattetes Fitnessstudio",
        "Kurzhanteln",
        "Langhantel",
        "Kabelzug",
        "Maschinen",
        "Kettlebells",
        "Widerstandsbänder",
        "Klimmzugstange",
        "Cardio-Geräte",
        "Nur Körpergewicht",
      ];
  return (
    <>
      <Feldgruppe label="Verfügbare Ausstattung">
      <div className="flex flex-wrap gap-2">
        {optionen.map((o) => (
          <Pille key={o} aktiv={p.equipment.includes(o)} onClick={() => set({ equipment: toggle(p.equipment, o) })}>
            {o}
          </Pille>
        ))}
      </div>
      </Feldgruppe>
      <TextFeld
        label="Magst du bestimmte Übungen oder Trainingsarten? (optional)"
        value={p.mag}
        onChange={(v) => set({ mag: v })}
        platzhalter="Kniebeugen, Rudern, Radfahren"
      />
      <TextFeld
        label="Möchtest du etwas lieber vermeiden? (optional)"
        value={p.vermeiden}
        onChange={(v) => set({ vermeiden: v })}
        platzhalter="Burpees, Überkopfdrücken"
      />
      <p className="text-xs text-muted-foreground">
        EVION lernt deine Vorlieben später zusätzlich aus deinem tatsächlichen Training.
      </p>
    </>
  );
}

function ErnaehrungSchritt({ p, set }: SchrittProps) {
  return (
    <>
      <Titel titel="Wie ernährst du dich?" />
      <div className="space-y-3">
        {["Omnivor", "Vegetarisch", "Vegan", "Pescetarisch", "Andere"].map((f) => (
          <AuswahlKarte
            key={f}
            titel={f === "Omnivor" ? "Allesesser / Omnivor" : f}
            icon={Apple}
            aktiv={p.ernaehrungsform === f}
            onClick={() => set({ ernaehrungsform: f })}
          />
        ))}
      </div>
      <Feldgruppe label="Allergien & Unverträglichkeiten (medizinisch relevant)">
        <div className="flex flex-wrap gap-2">
          {["Laktose", "Gluten", "Nüsse", "Soja", "Eier", "Meeresfrüchte", "Keine"].map((a) => (
            <Pille key={a} aktiv={p.allergien.includes(a)} onClick={() => set({ allergien: toggle(p.allergien, a) })}>
              {a}
            </Pille>
          ))}
        </div>
      </Feldgruppe>
      <TextFeld
        label="Lebensmittel, die du vermeiden möchtest (Vorliebe, optional)"
        value={p.vermiedeneLebensmittel}
        onChange={(v) => set({ vermiedeneLebensmittel: v })}
        platzhalter="Rosenkohl, Innereien"
      />
      <TextFeld
        label="Lieblingsgerichte (optional)"
        value={p.lieblingsgerichte}
        onChange={(v) => set({ lieblingsgerichte: v })}
        platzhalter="Bowls, Curry, Bolognese"
      />
      <Feldgruppe label="Mahlzeiten pro Tag (optional)">
        <div className="flex flex-wrap gap-2">
          {[2, 3, 4, 5].map((m) => (
            <Pille key={m} aktiv={p.mahlzeiten === m} onClick={() => set({ mahlzeiten: m })}>
              {m}
            </Pille>
          ))}
        </div>
      </Feldgruppe>
      <p className="text-xs text-muted-foreground">
        Damit kann EVION Mahlzeiten und Rezepte vorschlagen, die zu deinem Ziel und deinem Alltag passen.
      </p>
    </>
  );
}

function GesundheitSchritt({ p, set }: SchrittProps) {
  return (
    <>
      <Titel
        titel="Gibt es etwas, das EVION berücksichtigen sollte?"
        sub="Diese Angaben sind optional und helfen uns, Training und Empfehlungen besser auf dich abzustimmen."
      />
      <div className="space-y-2.5">
        {["Keine Einschränkungen", "Knie", "Rücken", "Schulter", "Hüfte", "Herz-/Kreislauf", "Andere Einschränkung"].map(
          (e) => (
            <AuswahlKarte
              key={e}
              titel={e}
              aktiv={p.einschraenkungen.includes(e)}
              onClick={() =>
                set({
                  einschraenkungen:
                    e === "Keine Einschränkungen"
                      ? p.einschraenkungen.includes(e)
                        ? []
                        : [e]
                      : toggle(
                          p.einschraenkungen.filter((x) => x !== "Keine Einschränkungen"),
                          e,
                        ),
                })
              }
            />
          ),
        )}
      </div>
      <TextFeld
        label="Weitere Informationen hinzufügen (optional)"
        value={p.gesundheitNotiz}
        onChange={(v) => set({ gesundheitNotiz: v })}
        platzhalter="z. B. Schulter links empfindlich"
      />
      <PrivacyCard>
        Diese Angaben sind optional und privat. EVION stellt keine Diagnosen und ersetzt keine ärztliche
        Beratung – wir passen lediglich Übungsauswahl und Belastung vorsichtig an.
      </PrivacyCard>
    </>
  );
}

function MessungSchritt({ p, set }: SchrittProps) {
  const felder = messFelder.filter((f) => f.key === "koerperfett" || f.gruppe === "umfang");
  return (
    <>
      <Titel titel="Deine Startwerte" sub="Körperfett und Umfänge sind optional. Dein Gewicht ist bereits übernommen." />
      <div className="border-y border-border py-4">
        <p className="label-xs">Startgewicht</p>
        <p className="num mt-1 text-2xl font-bold">{p.gewicht?.toLocaleString("de-DE") ?? "—"} <span className="text-sm text-muted-foreground">kg</span></p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {felder.map((f) => {
          const key = f.key as keyof NonNullable<OnboardingProfil["startwerte"]>;
          return <ZahlFeld key={key} label={f.label} einheit={f.einheit} value={p.startwerte?.[key] ?? null} onChange={(n) => set({ startwerte: { ...p.startwerte, [key]: n } })} />;
        })}
      </div>
      <PrivacyCard>Die zusätzlichen Angaben werden mit deiner Startmessung gespeichert. Körperfettwerte von Waagen sind Schätzwerte.</PrivacyCard>
    </>
  );
}

const analyseSchritte = [
  "Körperdaten berücksichtigt",
  "Ziel analysiert",
  "Training optimiert",
  "Kalorien & Protein berechnet",
  "Wochenziele erstellt",
  "Regenerationsstrategie vorbereitet",
];

function Analyse({ onFertig }: { onFertig: () => void }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= analyseSchritte.length) {
      const t = setTimeout(onFertig, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((x) => x + 1), 620);
    return () => clearTimeout(t);
  }, [n, onFertig]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <EvionLogo className="h-7" />
      <h1 className="mt-6 font-display text-2xl font-extrabold leading-tight">
        EVION erstellt deinen persönlichen Plan
      </h1>
      <ul className="mt-8 space-y-3">
        {analyseSchritte.map((s, idx) => {
          const fertig = idx < n;
          return (
            <li
              key={s}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-4 transition-all duration-500",
                fertig ? "border-primary/40 bg-primary/5 opacity-100" : "border-border bg-card opacity-40",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full",
                  fertig ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                <Check className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold">{s}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PlanScreen({ p, onStart }: { p: OnboardingProfil; onStart: () => void }) {
  const plan = useMemo(() => berechnePlan(p), [p]);
  const kacheln = [
    { label: "Ziel", wert: plan.zielDelta ? `${plan.zielDelta > 0 ? "+" : "−"}${Math.abs(plan.zielDelta)} kg` : goalLabels[p.ziel] },
    { label: "Training", wert: `${plan.tage}× / Woche` },
    { label: "Dauer", wert: `${plan.dauer === 75 ? "60+" : plan.dauer} Min.` },
    { label: "Kalorien", wert: `${plan.kalorien.toLocaleString("de-DE")} kcal` },
    { label: "Protein", wert: `${plan.protein} g` },
    { label: "Schritte", wert: plan.schritte.toLocaleString("de-DE") },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 pb-10 pt-10">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
        <Check className="h-3.5 w-3.5" /> Fertig
      </span>
      <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight">
        Dein EVION Plan ist bereit.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ziel: {goalLabels[p.ziel]}
        {p.name ? ` · für ${p.name}` : ""}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {kacheln.map((k) => (
          <div key={k.label} className={cn("min-w-0 rounded-2xl border border-border bg-card p-4", k.label === "Ziel" && "col-span-2")}>
            <p className="label-xs">{k.label}</p>
            <p className="num mt-1 break-words text-lg font-extrabold leading-tight">{k.wert}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-secondary/50 p-4">
        <p className="label-xs">Geschätzter Zielzeitraum</p>
        <p className="num mt-1 text-xl font-extrabold">{plan.zeitraum}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Schätzung auf Basis deiner Angaben – keine Garantie und keine medizinische Aussage.
        </p>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Wir starten mit diesem Plan und passen ihn anhand deiner tatsächlichen Fortschritte kontinuierlich
        an.
      </p>

      <OnboardingSync />
      <div className="mt-auto pt-8">
        <PrimaryButton onClick={onStart}>
          <span className="inline-flex items-center justify-center gap-2">
            Meinen Plan starten <ArrowRight className="h-5 w-5" />
          </span>
        </PrimaryButton>
      </div>
    </div>
  );
}
