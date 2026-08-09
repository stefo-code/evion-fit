import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, Card, Chip, Disclaimer, Ring, Section, Why } from "@/components/ui-kit";
import {
  adaptiveKalorien,
  fotoErkennung,
  heute,
  mahlzeiten,
  profile,
  rezeptVorschlaege,
} from "@/lib/demo-data";
import { Barcode, Camera, Droplets, Mic, Plus, Search, ShoppingCart, Utensils } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ernaehrung")({
  head: () => ({
    meta: [
      { title: "Ernährung – Vektor" },
      {
        name: "description",
        content:
          "Kalorien, Protein und Makros tracken, Mahlzeiten per Foto schätzen und passende Rezepte erhalten.",
      },
      { property: "og:title", content: "Ernährung – Vektor" },
      { property: "og:description", content: "Vorschläge, die zu deinem restlichen Tagesziel passen." },
    ],
  }),
  component: ErnaehrungPage,
});

function ErnaehrungPage() {
  const [foto, setFoto] = useState(false);
  const [mengen, setMengen] = useState([195, 225, 155]);
  const offenKcal = heute.kalorien.ziel - heute.kalorien.ist;
  const offenProtein = heute.protein.ziel - heute.protein.ist;

  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">Ernährung</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Dein Tag</h1>
      </header>

      <Card>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5">
          <Ring
            value={(heute.kalorien.ist / heute.kalorien.ziel) * 100}
            label={heute.kalorien.ist.toLocaleString("de-DE")}
            sub="von 2.180 kcal"
          />
          <div className="min-w-0 space-y-3">
            <Makro label="Protein" ist={heute.protein.ist} ziel={heute.protein.ziel} unit="g" tone="primary" />
            <Makro label="Kohlenhydrate" ist={148} ziel={profile.kohlenhydrateZiel} unit="g" tone="info" />
            <Makro label="Fett" ist={49} ziel={profile.fettZiel} unit="g" tone="accent" />
            <Makro label="Ballaststoffe" ist={21} ziel={profile.ballaststoffeZiel} unit="g" tone="warning" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-secondary/40 p-3 text-sm">
          <Droplets className="h-4 w-4 shrink-0 text-info" />
          Wasser {heute.wasser.ist} / {heute.wasser.ziel} l
          <button
            onClick={() => toast("250 ml hinzugefügt")}
            className="ml-auto rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold"
          >
            +250 ml
          </button>
        </div>
      </Card>

      <Section titel="Schnell erfassen">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { icon: Search, label: "Suche" },
            { icon: Barcode, label: "Barcode" },
            { icon: Camera, label: "Foto" },
            { icon: Mic, label: "Sprache" },
            { icon: Utensils, label: "Favoriten" },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => (a.label === "Foto" ? setFoto(true) : toast(`${a.label}-Erfassung (Demo)`))}
              className="surface flex flex-col items-center gap-2 p-4 text-xs font-bold transition-colors hover:border-primary/50"
            >
              <a.icon className="h-5 w-5 text-primary" />
              {a.label}
            </button>
          ))}
        </div>
      </Section>

      {foto && (
        <Section titel="Foto-Erkennung">
          <Card className="border-info/30">
            <p className="text-sm text-muted-foreground">
              Erkannte Lebensmittel und geschätzte Portionsgrößen. Bitte Mengen prüfen und korrigieren.
            </p>
            <ul className="mt-4 space-y-3">
              {fotoErkennung.items.map((it, i) => (
                <li key={it.name} className="rounded-xl bg-secondary/40 p-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{it.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {it.menge} · {it.kcal} · {it.protein} Protein
                      </p>
                    </div>
                    <div className="num shrink-0 rounded-lg bg-card px-3 py-1.5 text-sm font-bold">
                      {mengen[i] ?? 0} g
                    </div>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={400}
                    value={mengen[i] ?? 0}
                    onChange={(e) =>
                      setMengen((m) => m.map((v, j) => (j === i ? Number(e.target.value) : v)))
                    }
                    className="mt-3 w-full accent-[var(--primary)]"
                    aria-label={`Menge ${it.name}`}
                  />
                </li>
              ))}
            </ul>
            <p className="num mt-4 text-lg font-bold">
              Geschätzt: {fotoErkennung.summe} · {fotoErkennung.proteinSumme} Protein
            </p>
            <Disclaimer>
              Eine Fotoanalyse kann Kalorien nicht exakt bestimmen. Die Werte sind Schätzbereiche und
              werden genauer, wenn du Mengen korrigierst.
            </Disclaimer>
            <button
              onClick={() => {
                setFoto(false);
                toast.success("Mahlzeit gespeichert – Tageswerte aktualisiert");
              }}
              className="mt-4 w-full rounded-2xl bg-primary px-5 py-3 font-display font-extrabold uppercase tracking-wide text-primary-foreground"
            >
              Mahlzeit speichern
            </button>
          </Card>
        </Section>
      )}

      <Section titel="Heutige Mahlzeiten">
        <Card className="p-2">
          <ul className="divide-y divide-border">
            {mahlzeiten.map((m) => (
              <li key={m.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {m.name} <span className="text-muted-foreground">· {m.zeit}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.protein} g Protein · {m.kh} g KH · {m.fett} g Fett
                  </p>
                </div>
                <span className="num shrink-0 text-sm font-bold">{m.kcal} kcal</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => toast("Mahlzeit hinzufügen (Demo)")}
            className="m-2 flex w-[calc(100%-1rem)] items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-bold"
          >
            <Plus className="h-4 w-4" /> Mahlzeit hinzufügen
          </button>
        </Card>
      </Section>

      <Section titel="Noch offen heute">
        <Card className="border-primary/30">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="label-xs">Kalorien</p>
              <p className="num text-2xl font-extrabold">{offenKcal.toLocaleString("de-DE")} kcal</p>
            </div>
            <div>
              <p className="label-xs">Protein</p>
              <p className="num text-2xl font-extrabold">{offenProtein} g</p>
            </div>
          </div>
          <p className="label-xs mt-5">Vorschläge, die passen</p>
          <ul className="mt-2 space-y-3">
            {rezeptVorschlaege.map((r) => (
              <li key={r.name} className="rounded-2xl border border-border bg-secondary/40 p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display font-bold">{r.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.zeit} Min. · {r.tags.join(" · ")}
                    </p>
                  </div>
                  <span className="num shrink-0 text-sm font-bold">
                    {r.kcal} kcal · {r.protein} g
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Rezept anzeigen", "Portion anpassen", "Zutat ersetzen"].map((b) => (
                    <Chip key={b} onClick={() => toast(`${b} (Demo)`)}>
                      {b}
                    </Chip>
                  ))}
                  <Chip onClick={() => toast.success("Zur Einkaufsliste hinzugefügt")}>
                    <span className="inline-flex items-center gap-1.5">
                      <ShoppingCart className="h-3.5 w-3.5" /> Einkaufsliste
                    </span>
                  </Chip>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section titel="Was habe ich zu Hause?">
        <Card>
          <p className="text-sm text-muted-foreground">
            Gib vorhandene Zutaten ein – Vektor berücksichtigt deine offenen Kalorien, dein Protein-Ziel,
            deine Ernährungsform und Unverträglichkeiten ({profile.allergien.join(", ")}).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Hähnchen", "Reis", "Skyr", "Brokkoli", "Eier", "Tomaten"].map((z) => (
              <Chip key={z} active>
                {z}
              </Chip>
            ))}
          </div>
          <button
            onClick={() => toast("3 passende Gerichte gefunden (Demo)")}
            className="mt-4 w-full rounded-2xl border border-border py-3 text-sm font-bold"
          >
            Passende Gerichte finden
          </button>
        </Card>
      </Section>

      <Section titel="Adaptive Kalorien">
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="label-xs">Zielrate</p>
              <p className="num text-2xl font-extrabold">{adaptiveKalorien.zielRate} kg / Woche</p>
            </div>
            <div>
              <p className="label-xs">Tatsächlich ({adaptiveKalorien.beobachtung})</p>
              <p className="num text-2xl font-extrabold text-warning">
                {adaptiveKalorien.istRate} kg / Woche
              </p>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-secondary/50 p-4 text-sm">
            Vorschlag: {adaptiveKalorien.vorschlag}
          </p>
          <Why
            punkte={[
              "Beobachtungszeitraum: 3 Wochen gleitender Durchschnitt, keine Reaktion auf einzelne Tage.",
              "Berücksichtigt: Gewichtstrend, Taillenumfang, protokollierte Aufnahme, Aktivität.",
              adaptiveKalorien.hinweis,
            ]}
          />
        </Card>
      </Section>
    </div>
  );
}

function Makro({
  label,
  ist,
  ziel,
  unit,
  tone,
}: {
  label: string;
  ist: number;
  ziel: number;
  unit: string;
  tone: "primary" | "info" | "accent" | "warning";
}) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="num text-muted-foreground">
          {ist} / {ziel} {unit}
        </span>
      </div>
      <Bar className="mt-1.5" value={(ist / ziel) * 100} tone={tone} />
    </div>
  );
}
