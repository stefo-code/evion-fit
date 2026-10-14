import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Chip, Section } from "@/components/ui-kit";
import { goalLabels, type Goal } from "@/lib/demo-data";
import { berechnePlan, useOnboardingProfil } from "@/lib/onboarding-store";
import { Bell, Download, Timer, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { usePlanEinstellungen } from "@/lib/training-plan";
import { ladeBackupHerunter, loescheLokaleDaten, useKiStatus } from "@/lib/privatsphaere";

export const Route = createFileRoute("/einstellungen")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Einstellungen – EVION" },
      { name: "description", content: "Profil, Ziel, Trainingsvorgaben und Erinnerungen anpassen." },
      { property: "og:title", content: "Einstellungen – EVION" },
      { property: "og:description", content: "Dein Profil und deine Vorgaben – jederzeit änderbar." },
    ],
  }),
  component: EinstellungenPage,
});

function EinstellungenPage() {
  const { profil, aktualisiere } = useOnboardingProfil();
  const ziel = profil.ziel;
  const setZiel = (g: Goal) => aktualisiere({ ziel: g });
  const plan = berechnePlan(profil);
  const s = (v: number | null, e: string) => (v == null ? "–" : `${v} ${e}`);
  const [erinnerung, setErinnerung] = useState("Mittel");
  const { einstellungen, speichere } = usePlanEinstellungen();
  const ki = useKiStatus();

  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">Einstellungen</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Profil & Vorgaben</h1>
      </header>

      <Section titel="Profil">
        <Card>
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-secondary">
              <User className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold">{profil.name || "–"}</p>
              <p className="truncate text-sm text-muted-foreground">
                {s(profil.alter, "Jahre")} · {s(profil.groesse, "cm")} · {s(profil.gewicht, "kg")} · {profil.erfahrung}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 text-sm">
            <Feld label="Trainingsort" value={[...profil.orte].join(", ") || "–"} />
            <Feld label="Trainingstage" value={`${profil.tage} pro Woche`} />
            <Feld label="Ernährungsform" value={profil.ernaehrungsform || "–"} />
            <Feld label="Unverträglichkeiten" value={profil.allergien.join(", ") || "–"} />
            <Feld label="Kalorienziel" value={`${plan.kalorien.toLocaleString("de-DE")} kcal`} />
            <Feld label="Proteinziel" value={`${plan.protein} g`} />
          </dl>
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

      <Section titel="Ziel">
        <Card>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(goalLabels) as Goal[]).map((g) => (
              <Chip key={g} active={g === ziel} onClick={() => setZiel(g)}>
                {goalLabels[g]}
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Bei einer Zieländerung passen sich Score-Gewichtung, Trainingsvorgaben, Kalorien und Journey
            automatisch an.
          </p>
        </Card>
      </Section>

      <Section titel="Satzpausen">
        <Card>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Timer className="h-4 w-4 text-primary" /> Pause Grundübungen
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[90, 120, 150, 180, 210].map((s) => (
              <Chip
                key={s}
                active={(einstellungen.pauseGrundSek ?? 150) === s}
                onClick={() => {
                  speichere({ pauseGrundSek: s });
                  toast.success(`Pause Grundübungen: ${s} Sekunden`);
                }}
              >
                {s} s
              </Chip>
            ))}
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm font-semibold">
            <Timer className="h-4 w-4 text-primary" /> Pause Isolation
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[30, 45, 60, 75, 90, 120].map((s) => (
              <Chip
                key={s}
                active={(einstellungen.pauseIsoSek ?? 75) === s}
                onClick={() => {
                  speichere({ pauseIsoSek: s });
                  toast.success(`Pause Isolation: ${s} Sekunden`);
                }}
              >
                {s} s
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Nach Ablauf vibriert das Handy (wo vom Browser unterstützt).
          </p>
        </Card>
      </Section>

      <Section titel="KI-Funktionen">
        <Card className="flex items-center gap-3 text-sm">
          KI-Einwilligung: {ki === "ja" ? "erteilt" : "nicht erteilt"}
          <Link to="/datenschutz" className="ml-auto shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-bold">
            Verwalten
          </Link>
        </Card>
      </Section>

      <Section titel="Erinnerungen">
        <Card>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="h-4 w-4 text-primary" /> Erinnerungsintensität
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Aus", "Niedrig", "Mittel", "Hoch"].map((s) => (
              <Chip key={s} active={s === erinnerung} onClick={() => setErinnerung(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </Card>
      </Section>

      <Section titel="Deine Daten">
        <div className="space-y-3">
          <Card className="flex items-center gap-3 text-sm">
            <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
            Alle Daten als Export herunterladen
            <button
              onClick={() => ladeBackupHerunter()}
              className="ml-auto shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-bold"
            >
              Exportieren
            </button>
          </Card>
          <Card className="flex items-center gap-3 border-destructive/40 text-sm">
            <Trash2 className="h-4 w-4 shrink-0 text-destructive" />
            Alle Daten auf diesem Gerät löschen
            <button
              onClick={() => {
                if (window.confirm("Wirklich alle Daten auf diesem Gerät löschen?")) {
                  loescheLokaleDaten();
                  window.location.href = "/onboarding";
                }
              }}
              className="ml-auto shrink-0 rounded-lg border border-destructive/50 px-3 py-1.5 text-xs font-bold text-destructive"
            >
              Löschen
            </button>
          </Card>
        </div>
      </Section>

    </div>
  );
}

function Feld({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-xs">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}
