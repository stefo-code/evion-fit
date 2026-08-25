import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  Dumbbell,
  Heart,
  Salad,
  Settings,
  Shield,
  Sparkles,
  Target,
  User,
  Scale,
} from "lucide-react";
import { Card, Disclaimer, Section } from "@/components/ui-kit";
import { goalLabels } from "@/lib/demo-data";
import { berechnePlan, useOnboardingProfil, herkunftLabels } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Dein Profil – EVION" },
      {
        name: "description",
        content: "Persönliche Daten, Ziele, Training, Ernährung, Gesundheit, Körperwerte und Datenschutz verwalten.",
      },
      { property: "og:title", content: "Dein Profil – EVION" },
      { property: "og:description", content: "Alle Onboarding-Angaben jederzeit anpassbar." },
    ],
  }),
  component: ProfilPage,
});

function ProfilPage() {
  const { profil, aktualisiere, geladen } = useOnboardingProfil();
  const [offen, setOffen] = useState<string | null>("Persönliche Daten");
  const [planFrage, setPlanFrage] = useState<string | null>(null);
  const plan = berechnePlan(profil);

  const name = profil.name || "Dein Profil";

  return (
    <div className="space-y-8">
      <header className="surface flex items-center gap-4 p-5">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/12 font-display text-xl font-extrabold text-primary">
          {(profil.name || "E").slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="label-xs">Dein Profil</p>
          <h1 className="truncate font-display text-2xl font-extrabold">{name}</h1>
          <p className="truncate text-sm text-muted-foreground">
            Ziel: {goalLabels[profil.ziel]} · {profil.tage}× / Woche
          </p>
        </div>
      </header>

      {planFrage && (
        <div className="surface border-primary/40 bg-primary/8 p-5">
          <p className="text-sm font-semibold">{planFrage}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => {
                toast.success("Plan wird angepasst");
                setPlanFrage(null);
              }}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground"
            >
              Ja, anpassen
            </button>
            <button
              onClick={() => setPlanFrage(null)}
              className="rounded-xl border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Nein
            </button>
          </div>
        </div>
      )}

      <Section titel="Deine Angaben">
        <div className="space-y-3">
          <Bereich
            titel="Persönliche Daten"
            icon={User}
            zusammenfassung={`${profil.alter ?? "–"} Jahre · ${profil.groesse ?? "–"} cm · ${profil.gewicht ?? "–"} kg`}
            offen={offen === "Persönliche Daten"}
            onToggle={() => setOffen(offen === "Persönliche Daten" ? null : "Persönliche Daten")}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <Zahl label="Alter" wert={profil.alter} einheit="Jahre" onChange={(n) => aktualisiere({ alter: n })} />
              <Zahl label="Größe" wert={profil.groesse} einheit="cm" onChange={(n) => aktualisiere({ groesse: n })} />
              <Zahl label="Gewicht" wert={profil.gewicht} einheit="kg" onChange={(n) => aktualisiere({ gewicht: n })} />
            </div>
            <Hinweis>Nur für deine persönlichen Empfehlungen. Jederzeit änderbar und löschbar.</Hinweis>
          </Bereich>

          <Bereich
            titel="Ziele & Strategie"
            icon={Target}
            zusammenfassung={`${goalLabels[profil.ziel]}${profil.zielGewicht ? ` · Ziel ${profil.zielGewicht} kg` : ""}`}
            offen={offen === "Ziele"}
            onToggle={() => setOffen(offen === "Ziele" ? null : "Ziele")}
          >
            <div className="flex flex-wrap gap-2">
              {(Object.keys(goalLabels) as (keyof typeof goalLabels)[]).map((g) => (
                <Pille key={g} aktiv={profil.ziel === g} onClick={() => aktualisiere({ ziel: g })}>
                  {goalLabels[g]}
                </Pille>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Zahl
                label="Zielgewicht"
                wert={profil.zielGewicht}
                einheit="kg"
                onChange={(n) => aktualisiere({ zielGewicht: n })}
              />
              <Info label="Kalorienziel" wert={`${plan.kalorien.toLocaleString("de-DE")} kcal`} />
            </div>
          </Bereich>

          <Bereich
            titel="Training & Equipment"
            icon={Dumbbell}
            zusammenfassung={`${profil.tage}× / Woche · ${profil.dauer} Min. · ${profil.erfahrung}`}
            offen={offen === "Training"}
            onToggle={() => setOffen(offen === "Training" ? null : "Training")}
          >
            <p className="label-xs">Trainingstage pro Woche</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[2, 3, 4, 5, 6].map((t) => (
                <Pille
                  key={t}
                  aktiv={profil.tage === t}
                  onClick={() => {
                    if (t !== profil.tage)
                      setPlanFrage(`Möchtest du deinen Trainingsplan auf ${t} Einheiten pro Woche optimieren?`);
                    aktualisiere({ tage: t });
                  }}
                >
                  {t}×
                </Pille>
              ))}
            </div>
            <p className="label-xs mt-4">Dauer</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[20, 30, 45, 60, 75].map((d) => (
                <Pille key={d} aktiv={profil.dauer === d} onClick={() => aktualisiere({ dauer: d })}>
                  {d === 75 ? "60+ Min." : `${d} Min.`}
                </Pille>
              ))}
            </div>
            <Info label="Equipment" wert={profil.equipment.join(", ") || "Noch nicht angegeben"} className="mt-4" />
          </Bereich>

          <Bereich
            titel="Ernährung & Allergien"
            icon={Salad}
            zusammenfassung={`${profil.ernaehrungsform}${profil.allergien.length ? ` · ${profil.allergien.join(", ")}` : ""}`}
            offen={offen === "Ernährung"}
            onToggle={() => setOffen(offen === "Ernährung" ? null : "Ernährung")}
          >
            <div className="flex flex-wrap gap-2">
              {["Omnivor", "Vegetarisch", "Vegan", "Pescetarisch", "Andere"].map((f) => (
                <Pille key={f} aktiv={profil.ernaehrungsform === f} onClick={() => aktualisiere({ ernaehrungsform: f })}>
                  {f}
                </Pille>
              ))}
            </div>
            <Info label="Allergien" wert={profil.allergien.join(", ") || "Keine angegeben"} className="mt-4" />
            <Info label="Lieblingsgerichte" wert={profil.lieblingsgerichte || "–"} className="mt-3" />
          </Bereich>

          <Bereich
            titel="Gesundheit & Einschränkungen"
            icon={Heart}
            zusammenfassung={profil.einschraenkungen.join(", ") || "Keine Angaben"}
            offen={offen === "Gesundheit"}
            onToggle={() => setOffen(offen === "Gesundheit" ? null : "Gesundheit")}
          >
            <Info label="Einschränkungen" wert={profil.einschraenkungen.join(", ") || "Keine angegeben"} />
            <Info label="Notiz" wert={profil.gesundheitNotiz || "–"} className="mt-3" />
            <Hinweis>
              Besonders sensible Daten – nur lokal auf deinem Gerät gespeichert, optional und jederzeit
              löschbar. EVION stellt keine Diagnosen.
            </Hinweis>
          </Bereich>
        </div>
      </Section>

      <Section titel="Verwaltung">
        <div className="space-y-3">
          <LinkZeile to="/fortschritt" icon={Scale} titel="Körperwerte erfassen" sub="Gewicht, Körperfett, Wasser, Muskeln, Umfänge" />
          <LinkZeile to="/einstellungen" icon={Bell} titel="Benachrichtigungen" sub="Erinnerungen und Intensität" />
          <LinkZeile to="/datenschutz" icon={Shield} titel="Datenschutz & Daten" sub="Export, Löschung, Freigaben" />
          <LinkZeile to="/einstellungen" icon={Settings} titel="EVION Einstellungen" sub="Profil, Ziel, Vorgaben" />
          <LinkZeile to="/supplements" icon={Sparkles} titel="Supplement-Kompass" sub="Evidenzorientierte Übersicht" />
        </div>
      </Section>

      <Section titel="Wie EVION dich kennt">
        <Card className="space-y-3 text-sm">
          {(
            [
              ["angegeben", "Ziel, Trainingstage, Ernährungsform aus deinem Onboarding"],
              ["beobachtet", "Ø 3,4 Trainings/Woche · Ø 39 Min. Dauer · Ø 148 g Protein"],
              ["gelernt", "Du bevorzugst 40-Minuten-Workouts und tauschst Überkopfdrücken oft aus"],
              ["prognostiziert", `Zielzeitraum ca. ${plan.zeitraum} (Schätzung)`],
            ] as const
          ).map(([k, text]) => (
            <div key={k} className="flex gap-3">
              <span className="mt-0.5 h-fit shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {herkunftLabels[k]}
              </span>
              <span className="text-muted-foreground">{text}</span>
            </div>
          ))}
        </Card>
      </Section>

      <Section titel="Onboarding">
        <Card className="flex items-center gap-3 text-sm">
          Fitnessprofil neu erstellen
          <Link
            to="/onboarding"
            className="ml-auto shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-bold"
          >
            Starten
          </Link>
        </Card>
      </Section>

      {!geladen && <span className="sr-only">Profil wird geladen</span>}

      <Disclaimer>
        EVION ersetzt keine medizinische Beratung. Prognosen sind Schätzungen auf Basis deiner Angaben.
      </Disclaimer>
    </div>
  );
}

function Bereich({
  titel,
  icon: Icon,
  zusammenfassung,
  offen,
  onToggle,
  children,
}: {
  titel: string;
  icon: typeof User;
  zusammenfassung: string;
  offen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="surface overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{titel}</span>
          <span className="block truncate text-xs text-muted-foreground">{zusammenfassung}</span>
        </span>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", offen && "rotate-180")} />
      </button>
      {offen && <div className="border-t border-border p-4">{children}</div>}
    </div>
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
        "rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors",
        aktiv ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Zahl({
  label,
  wert,
  einheit,
  onChange,
}: {
  label: string;
  wert: number | null;
  einheit: string;
  onChange: (n: number | null) => void;
}) {
  return (
    <label className="block rounded-xl border border-border bg-card p-3">
      <span className="label-xs">{label}</span>
      <span className="mt-1 flex items-baseline gap-1.5">
        <input
          inputMode="decimal"
          value={wert ?? ""}
          onChange={(e) => {
            const n = Number(e.target.value.replace(",", "."));
            onChange(e.target.value === "" || Number.isNaN(n) ? null : n);
          }}
          className="num w-full min-w-0 bg-transparent text-xl font-bold outline-none"
        />
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">{einheit}</span>
      </span>
    </label>
  );
}

function Info({ label, wert, className }: { label: string; wert: string; className?: string }) {
  return (
    <div className={className}>
      <p className="label-xs">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{wert}</p>
    </div>
  );
}

function Hinweis({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 flex gap-2 rounded-xl bg-primary/8 p-3 text-xs leading-relaxed text-muted-foreground">
      <Shield className="h-4 w-4 shrink-0 text-primary" />
      {children}
    </p>
  );
}

function LinkZeile({
  to,
  icon: Icon,
  titel,
  sub,
}: {
  to: string;
  icon: typeof User;
  titel: string;
  sub: string;
}) {
  return (
    <Link to={to} className="surface flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold">{titel}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
    </Link>
  );
}
