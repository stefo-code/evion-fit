import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analysiereFoto } from "@/lib/food-vision.functions";
import type { FotoAnalyse } from "@/lib/food-vision.server";
import { Bar, Card, Chip, Disclaimer, Ring, Section, Why } from "@/components/ui-kit";
import {
  adaptiveKalorien,
  fotoErkennung,
  heute,
  mahlzeiten,
  profile,
  rezeptVorschlaege,
} from "@/lib/demo-data";
import { Barcode, Camera, Droplets, Loader2, Mic, Plus, Search, ShoppingCart, Trash2, Utensils } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ernaehrung")({
  head: () => ({
    meta: [
      { title: "Ernährung – EVION" },
      {
        name: "description",
        content:
          "Kalorien, Protein und Makros tracken, Mahlzeiten per Foto schätzen und passende Rezepte erhalten.",
      },
      { property: "og:title", content: "Ernährung – EVION" },
      { property: "og:description", content: "Vorschläge, die zu deinem restlichen Tagesziel passen." },
    ],
  }),
  component: ErnaehrungPage,
});

function ErnaehrungPage() {
  const [bild, setBild] = useState<string | null>(null);
  const [analyse, setAnalyse] = useState<FotoAnalyse | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [faktoren, setFaktoren] = useState<number[]>([]);
  const [demoFoto, setDemoFoto] = useState(false);
  const [mengen, setMengen] = useState([195, 225, 155]);
  const kamera = useRef<HTMLInputElement>(null);
  const analysiere = useServerFn(analysiereFoto);

  const bildWaehlen = async (file: File) => {
    const dataUrl = await komprimiere(file);
    setBild(dataUrl);
    setAnalyse(null);
    setLaedt(true);
    try {
      const res = await analysiere({ data: { dataUrl } });
      setAnalyse(res);
      setFaktoren(res.items.map(() => 1));
      if (res.items.length === 0) toast("Kein Essen erkannt – bitte erneut fotografieren.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analyse fehlgeschlagen");
      setBild(null);
    } finally {
      setLaedt(false);
    }
  };

  const summe = (feld: "kcal" | "protein_g" | "kh_g" | "fett_g") =>
    Math.round(
      (analyse?.items ?? []).reduce((acc, it, i) => acc + it[feld] * (faktoren[i] ?? 1), 0),
    );
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
              onClick={() =>
                a.label === "Foto"
                  ? kamera.current?.click()
                  : a.label === "Favoriten"
                    ? setDemoFoto(true)
                    : toast(`${a.label}-Erfassung (Demo)`)
              }
              className="surface flex flex-col items-center gap-2 p-4 text-xs font-bold transition-colors hover:border-primary/50"
            >
              <a.icon className="h-5 w-5 text-primary" />
              {a.label}
            </button>
          ))}
        </div>
      </Section>

      <input
        ref={kamera}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void bildWaehlen(f);
          e.target.value = "";
        }}
      />

      {(bild || laedt) && (
        <Section titel="Foto-Erkennung">
          <Card className="border-info/30">
            <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
              {bild && (
                <img
                  src={bild}
                  alt="Foto der erfassten Mahlzeit"
                  className="h-40 w-full rounded-2xl object-cover sm:h-40"
                />
              )}
              <div className="min-w-0">
                {laedt ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Mahlzeit wird analysiert …
                  </p>
                ) : (
                  analyse && (
                    <>
                      <p className="font-display text-lg font-bold">{analyse.gericht}</p>
                      <p className="text-xs text-muted-foreground">
                        Geschätzt · Unsicherheit ca. ±{analyse.unsicherheitProzent}%
                      </p>
                      <p className="num mt-3 text-2xl font-extrabold">{summe("kcal").toLocaleString("de-DE")} kcal</p>
                      <p className="text-sm text-muted-foreground">
                        {summe("protein_g")} g Protein · {summe("kh_g")} g KH · {summe("fett_g")} g Fett
                      </p>
                    </>
                  )
                )}
              </div>
            </div>

            {analyse && analyse.items.length > 0 && (
              <ul className="mt-4 space-y-3">
                {analyse.items.map((it, i) => (
                  <li key={`${it.name}-${i}`} className="rounded-xl bg-secondary/40 p-3">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{it.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          Sicherheit: {it.sicherheit} · {Math.round(it.kcal * (faktoren[i] ?? 1))} kcal ·{" "}
                          {Math.round(it.protein_g * (faktoren[i] ?? 1))} g Protein
                        </p>
                      </div>
                      <div className="num shrink-0 rounded-lg bg-card px-3 py-1.5 text-sm font-bold">
                        {Math.round(it.menge_g * (faktoren[i] ?? 1))} g
                      </div>
                      <button
                        aria-label={`${it.name} entfernen`}
                        onClick={() => {
                          setAnalyse({ ...analyse, items: analyse.items.filter((_, j) => j !== i) });
                          setFaktoren((f) => f.filter((_, j) => j !== i));
                        }}
                        className="shrink-0 rounded-lg p-2 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="range"
                      min={0.25}
                      max={2.5}
                      step={0.05}
                      value={faktoren[i] ?? 1}
                      onChange={(e) =>
                        setFaktoren((f) => f.map((v, j) => (j === i ? Number(e.target.value) : v)))
                      }
                      className="mt-3 w-full accent-[var(--primary)]"
                      aria-label={`Portion ${it.name}`}
                    />
                  </li>
                ))}
              </ul>
            )}

            {analyse && (
              <>
                <Disclaimer>
                  {analyse.hinweis} Eine Fotoanalyse kann Kalorien nicht exakt bestimmen – korrigiere die Portionen,
                  dann wird die Schätzung deutlich genauer.
                </Disclaimer>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setBild(null);
                      setAnalyse(null);
                      toast.success("Mahlzeit gespeichert – Tageswerte aktualisiert");
                    }}
                    className="flex-1 rounded-2xl bg-primary px-5 py-3 font-display font-extrabold uppercase tracking-wide text-primary-foreground"
                  >
                    Mahlzeit speichern
                  </button>
                  <Chip onClick={() => kamera.current?.click()}>Neues Foto</Chip>
                </div>
              </>
            )}
          </Card>
        </Section>
      )}

      {demoFoto && !bild && (
        <Section titel="Beispiel-Erkennung">
          <Card className="border-info/30">
            <ul className="mt-1 space-y-3">
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
                    onChange={(e) => setMengen((m) => m.map((v, j) => (j === i ? Number(e.target.value) : v)))}
                    className="mt-3 w-full accent-[var(--primary)]"
                    aria-label={`Menge ${it.name}`}
                  />
                </li>
              ))}
            </ul>
            <p className="num mt-4 text-lg font-bold">
              Geschätzt: {fotoErkennung.summe} · {fotoErkennung.proteinSumme} Protein
            </p>
            <button
              onClick={() => setDemoFoto(false)}
              className="mt-4 w-full rounded-2xl border border-border py-3 text-sm font-bold"
            >
              Beispiel schließen
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
            Gib vorhandene Zutaten ein – EVION berücksichtigt deine offenen Kalorien, dein Protein-Ziel,
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

/** Verkleinert das Foto vor der Analyse (schneller Upload, weniger Datenvolumen). */
async function komprimiere(file: File, max = 1024): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Bild konnte nicht verarbeitet werden.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}
