import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Chip, Disclaimer, Section } from "@/components/ui-kit";
import { profile, goalLabels, type Goal } from "@/lib/demo-data";
import { Bell, Download, Trash2, User, Watch } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/einstellungen")({
  head: () => ({
    meta: [
      { title: "Einstellungen – Vektor" },
      { name: "description", content: "Profil, Ziel, Trainingsvorgaben und Erinnerungen anpassen." },
      { property: "og:title", content: "Einstellungen – Vektor" },
      { property: "og:description", content: "Dein Profil und deine Vorgaben – jederzeit änderbar." },
    ],
  }),
  component: EinstellungenPage,
});

function EinstellungenPage() {
  const [ziel, setZiel] = useState<Goal>(profile.goal);
  const [erinnerung, setErinnerung] = useState("Mittel");

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
              <p className="truncate font-display text-lg font-bold">{profile.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {profile.alter} Jahre · {profile.groesse} cm · {profile.gewicht} kg · {profile.erfahrung}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 text-sm">
            <Feld label="Trainingsort" value={profile.trainingsort} />
            <Feld label="Trainingstage" value={`${profile.trainingstage} pro Woche`} />
            <Feld label="Ernährungsform" value={profile.ernaehrungsform} />
            <Feld label="Unverträglichkeiten" value={profile.allergien.join(", ")} />
            <Feld label="Kalorienziel" value={`${profile.kalorienZiel} kcal`} />
            <Feld label="Proteinziel" value={`${profile.proteinZiel} g`} />
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

      <Section titel="Verbundene Quellen">
        <Card className="flex items-center gap-3 text-sm">
          <Watch className="h-4 w-4 shrink-0 text-muted-foreground" />
          Health-Integrationen verwalten
          <Link to="/geraete" className="ml-auto shrink-0 text-xs font-bold uppercase tracking-wider text-primary">
            Öffnen
          </Link>
        </Card>
      </Section>

      <Section titel="Deine Daten">
        <div className="space-y-3">
          <Card className="flex items-center gap-3 text-sm">
            <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
            Alle Daten als Export herunterladen
            <button
              onClick={() => toast.success("Export wird vorbereitet (Demo)")}
              className="ml-auto shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-bold"
            >
              Exportieren
            </button>
          </Card>
          <Card className="flex items-center gap-3 border-destructive/40 text-sm">
            <Trash2 className="h-4 w-4 shrink-0 text-destructive" />
            Konto und alle Gesundheitsdaten löschen
            <button
              onClick={() => toast("Löschung angefordert (Demo)")}
              className="ml-auto shrink-0 rounded-lg border border-destructive/50 px-3 py-1.5 text-xs font-bold text-destructive"
            >
              Löschen
            </button>
          </Card>
        </div>
      </Section>

      <Disclaimer>
        Dies ist ein Prototyp mit Demo-Profil. Änderungen werden nicht dauerhaft gespeichert.
      </Disclaimer>
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
