import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Apple,
  ArrowRight,
  Check,
  ChevronLeft,
  Dumbbell,
  Flame,
  Heart,
  Leaf,
  Lock,
  Mail,
  Repeat,
  Scale,
  Shield,
  Timer,
  Watch,
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
import heroBild from "@/assets/onboarding-hero.png";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
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

const SCHRITTE = [
  "konto",
  "ueberdich",
  "ziel",
  "training",
  "equipment",
  "ernaehrung",
  "gesundheit",
  "geraete",
] as const;

function OnboardingPage() {
  const navigate = useNavigate();
  const [p, setP] = useState<OnboardingProfil>(leeresProfil);
  const [phase, setPhase] = useState<"welcome" | "schritte" | "analyse" | "plan">("welcome");
  const [i, setI] = useState(0);

  useEffect(() => {
    const gespeichert = ladeProfil();
    setP(gespeichert);
    if (!gespeichert.abgeschlossen && gespeichert.schritt > 0) {
      setPhase("schritte");
      setI(Math.min(gespeichert.schritt, SCHRITTE.length - 1));
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
    if (i < SCHRITTE.length - 1) {
      const n = i + 1;
      setI(n);
      set({ schritt: n });
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
    setI(i - 1);
    window.scrollTo({ top: 0 });
  }

  if (phase === "welcome") return <Welcome onStart={() => setPhase("schritte")} />;
  if (phase === "analyse") return <Analyse onFertig={() => setPhase("plan")} />;
  if (phase === "plan")
    return (
      <PlanScreen
        p={p}
        onStart={() => {
          set({ abgeschlossen: true, schritt: SCHRITTE.length });
          navigate({ to: "/" });
        }}
      />
    );

  const aktuell = SCHRITTE[i]!;
  const optional = aktuell === "gesundheit" || aktuell === "geraete" || aktuell === "equipment";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-10 pt-6">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
        <button
          onClick={zurueck}
          aria-label="Zurück"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
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
        {aktuell === "konto" && <KontoSchritt p={p} set={set} />}
        {aktuell === "ueberdich" && <UeberDich p={p} set={set} />}
        {aktuell === "ziel" && <ZielSchritt p={p} set={set} />}
        {aktuell === "training" && <TrainingSchritt p={p} set={set} />}
        {aktuell === "equipment" && <EquipmentSchritt p={p} set={set} />}
        {aktuell === "ernaehrung" && <ErnaehrungSchritt p={p} set={set} />}
        {aktuell === "gesundheit" && <GesundheitSchritt p={p} set={set} />}
        {aktuell === "geraete" && <GeraeteSchritt p={p} set={set} />}
      </div>

      <div className="mt-10 space-y-3">
        <PrimaryButton onClick={weiter}>
          {i === SCHRITTE.length - 1 ? "Plan erstellen" : "Weiter"}
        </PrimaryButton>
        {optional && (
          <button
            onClick={weiter}
            className="w-full py-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Überspringen
          </button>
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
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl bg-primary px-5 py-4 font-display text-base font-extrabold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform active:scale-[0.99]",
        className,
      )}
    >
      {children}
    </button>
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-all",
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
        <span className="block truncate font-semibold">{titel}</span>
        {sub && <span className="block truncate text-xs text-muted-foreground">{sub}</span>}
      </span>
      {aktiv && <Check className="ml-auto h-5 w-5 shrink-0 text-primary" />}
    </button>
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors",
        aktiv
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
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
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 pb-8 pt-10">
      <EvionLogo className="h-8" />
      <p className="mt-2 text-sm font-semibold text-primary">Evolve. Every day.</p>

      <div className="relative mt-8 flex-1">
        <h1 className="font-display text-4xl font-extrabold leading-[1.1]">
          Deine Reise.
          <br />
          Deine Ziele.
          <br />
          Wir machen den Rest.
        </h1>
        <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
          Personalisiertes Training, smarte Ernährung und echter Fortschritt – alles in einer App.
        </p>

        <div className="pointer-events-none absolute -right-6 bottom-0 w-[62%] max-w-[280px]">
          <div className="absolute inset-x-2 bottom-6 top-10 rounded-full bg-primary/10 blur-2xl" />
          <img
            src={heroBild}
            alt="Sportliche Frau und sportlicher Mann"
            width={912}
            height={1104}
            className="relative w-full object-contain"
          />
        </div>

        <div className="relative mt-8 w-[58%] min-w-[190px] space-y-3">
          <MiniKarte icon={Scale} wert="−4,2 kg" text="Gewicht in 8 Wochen" />
          <MiniKarte icon={Flame} wert="91 %" text="Kalorienziel erreicht" />
          <MiniKarte icon={Dumbbell} wert="14" text="Trainings diesen Monat" />
        </div>
      </div>

      <div className="mt-10 space-y-4">
        <PrimaryButton onClick={onStart}>LOS GEHT&apos;S</PrimaryButton>
        <p className="text-center text-sm text-muted-foreground">
          Bereits ein Konto?{" "}
          <button onClick={() => navigate({ to: "/auth" })} className="font-bold text-primary">
            Anmelden
          </button>
        </p>
      </div>
    </div>
  );
}

function MiniKarte({
  icon: Icon,
  wert,
  text,
}: {
  icon: typeof Scale;
  wert: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/90 p-3 shadow-sm backdrop-blur">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0">
        <span className="num block text-base font-extrabold leading-none">{wert}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{text}</span>
      </span>
    </div>
  );
}

type SchrittProps = { p: OnboardingProfil; set: (t: Partial<OnboardingProfil>) => void };

function KontoSchritt({ p, set }: SchrittProps) {
  return (
    <>
      <Titel titel="Dein EVION Konto" sub="Damit dein Plan und dein Fortschritt erhalten bleiben." />
      <div className="space-y-3">
        <AuswahlKarte
          titel="Mit Google fortfahren"
          icon={Zap}
          aktiv={p.kontoMethode === "google"}
          onClick={() => set({ kontoMethode: "google" })}
        />
        <AuswahlKarte
          titel="Mit Apple fortfahren"
          icon={Lock}
          aktiv={p.kontoMethode === "apple"}
          onClick={() => set({ kontoMethode: "apple" })}
        />
        <AuswahlKarte
          titel="Mit E-Mail fortfahren"
          icon={Mail}
          aktiv={p.kontoMethode === "email"}
          onClick={() => set({ kontoMethode: "email" })}
        />
      </div>
      {p.kontoMethode === "email" && (
        <div className="space-y-4">
          <TextFeld label="Vorname" value={p.name} onChange={(v) => set({ name: v })} platzhalter="Alex" />
          <TextFeld
            label="E-Mail"
            value={p.email}
            onChange={(v) => set({ email: v })}
            platzhalter="alex@example.com"
          />
        </div>
      )}
      <PrivacyCard>
        Deine Gesundheitsdaten gehören dir. EVION verwendet sie ausschließlich für deine persönlichen
        Fitness- und Gesundheitsempfehlungen.
      </PrivacyCard>
    </>
  );
}

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
      {!p.name && (
        <TextFeld label="Wie dürfen wir dich nennen?" value={p.name} onChange={(v) => set({ name: v })} platzhalter="Alex" />
      )}
      <Feldgruppe label="Geschlecht">
        <div className="grid grid-cols-3 gap-2.5">
          {geschlechter.map((g) => (
            <button
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
            </button>
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
              onClick={() => set({ orte: toggle(p.orte, o) })}
            />
          ))}
        </div>
      </Feldgruppe>
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
      <Titel titel="Was steht dir zur Verfügung?" sub="Mehrfachauswahl – du kannst das jederzeit ändern." />
      <div className="flex flex-wrap gap-2">
        {optionen.map((o) => (
          <Pille key={o} aktiv={p.equipment.includes(o)} onClick={() => set({ equipment: toggle(p.equipment, o) })}>
            {o}
          </Pille>
        ))}
      </div>
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

const geraeteKarten = [
  { key: "samsung-health", titel: "Samsung Health", sub: "Schlaf, Schritte, Aktivität, Workouts", icon: Activity },
  { key: "galaxy-watch-6", titel: "Galaxy Watch 6", sub: "Daten werden über Samsung Health synchronisiert.", icon: Watch },
  { key: "health-connect", titel: "Health Connect", sub: "Herzfrequenz, HRV (sofern verfügbar), Schlaf", icon: Heart },
  { key: "beurer", titel: "Beurer HealthManager Pro", sub: "Gewicht, Körperfett, Muskelmasse", icon: Scale },
];

function GeraeteSchritt({ p, set }: SchrittProps) {
  return (
    <>
      <Titel titel="Verbinde deine Daten" sub="Weniger eingeben. Mehr verstehen." />
      <div className="space-y-3">
        {geraeteKarten.map((g) => (
          <button
            key={g.key}
            onClick={() => set({ geraete: toggle(p.geraete, g.key) })}
            className={cn(
              "flex w-full items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-all",
              p.geraete.includes(g.key) ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
              <g.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{g.titel}</span>
              <span className="block text-xs text-muted-foreground">{g.sub}</span>
            </span>
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {p.geraete.includes(g.key) ? "Vorgemerkt" : "Nicht verbunden"}
            </span>
          </button>
        ))}
      </div>
      <PrivacyCard>
        Die echte Verbindung erfolgt später über Health Connect in der Android-Hülle. Bis dahin zeigt EVION
        klar gekennzeichnete Demo-Werte – jede Datenquelle bleibt einzeln widerrufbar.
      </PrivacyCard>
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
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="label-xs">{k.label}</p>
            <p className="num mt-1 text-xl font-extrabold leading-tight">{k.wert}</p>
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

      <div className="mt-auto pt-8">
        <PrimaryButton onClick={onStart}>
          <span className="inline-flex items-center justify-center gap-2">
            MEINEN PLAN STARTEN <ArrowRight className="h-5 w-5" />
          </span>
        </PrimaryButton>
      </div>
    </div>
  );
}
