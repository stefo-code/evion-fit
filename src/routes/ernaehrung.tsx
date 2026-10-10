import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analysiereFoto } from "@/lib/food-vision.functions";
import type { FotoAnalyse } from "@/lib/food-vision.server";
import { Bar, BereichNavigation, Card, Chip, Disclaimer, Ring, Section } from "@/components/ui-kit";
import { berechnePlan, useOnboardingProfil } from "@/lib/onboarding-store";
import { useErnaehrung } from "@/lib/nutrition-store";
import { lebensmittel, rezeptVorschlaege, vorratVorschlaege, type RezeptTreffer } from "@/lib/recipes";
import {
  Camera,
  ChevronDown,
  Droplets,
  Loader2,
  Plus,
  ScanBarcode,
  Search,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { produktPerBarcode } from "@/lib/barcode.functions";
import type { BarcodeProdukt } from "@/lib/barcode.server";


export const Route = createFileRoute("/ernaehrung")({
  head: () => ({
    meta: [
      { title: "Ernährung – EVION" },
      {
        name: "description",
        content:
          "Kalorien, Protein und Makros tracken, Mahlzeiten per Foto schätzen und Rezepte aus deinem Vorrat erhalten.",
      },
      { property: "og:title", content: "Ernährung – EVION" },
      { property: "og:description", content: "Vorschläge, die zu deinem restlichen Tagesziel passen." },
    ],
  }),
  component: ErnaehrungPage,
});

function ErnaehrungPage() {
  const { profil } = useOnboardingProfil();
  const plan = useMemo(() => berechnePlan(profil), [profil]);
  const {
    daten,
    heutigeMahlzeiten,
    heuteSumme,
    wasserHeute,
    mahlzeitHinzufuegen,
    mahlzeitEntfernen,
    wasserHinzufuegen,
    vorratHinzufuegen,
    vorratEntfernen,
  } = useErnaehrung();

  const [bild, setBild] = useState<string | null>(null);
  const [analyse, setAnalyse] = useState<FotoAnalyse | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [faktoren, setFaktoren] = useState<number[]>([]);
  const [suche, setSuche] = useState("");
  const [menge, setMenge] = useState<Record<string, number>>({});
  const [erfassenOffen, setErfassenOffen] = useState(false);
  const [neueZutat, setNeueZutat] = useState("");
  const [offenesRezept, setOffenesRezept] = useState<string | null>(null);
  const [nurVorrat, setNurVorrat] = useState(false);
  const [scannerOffen, setScannerOffen] = useState(false);
  const [produkt, setProdukt] = useState<BarcodeProdukt | null>(null);
  const [produktMenge, setProduktMenge] = useState(100);
  const [suchtCode, setSuchtCode] = useState(false);
  const kamera = useRef<HTMLInputElement>(null);
  const analysiere = useServerFn(analysiereFoto);
  const barcodeSuche = useServerFn(produktPerBarcode);

  const codeGefunden = useCallback(
    async (code: string) => {
      setScannerOffen(false);
      setSuchtCode(true);
      try {
        const p = await barcodeSuche({ data: { code } });
        if (!p) {
          toast("Produkt nicht gefunden – bitte per Suche oder Foto erfassen.");
          return;
        }
        setProdukt(p);
        setProduktMenge(p.portion_g);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Barcode-Suche fehlgeschlagen");
      } finally {
        setSuchtCode(false);
      }
    },
    [barcodeSuche],
  );


  const offenKcal = Math.max(0, plan.kalorien - heuteSumme.kcal);
  const offenProtein = Math.max(0, plan.protein - heuteSumme.protein);
  const wasserZiel = 2500;

  const treffer = useMemo(
    () =>
      rezeptVorschlaege({
        vorrat: daten.vorrat,
        offenKcal,
        offenProtein,
        ernaehrungsform: profil.ernaehrungsform,
        allergien: profil.allergien,
      }),
    [daten.vorrat, offenKcal, offenProtein, profil.ernaehrungsform, profil.allergien],
  );

  const sichtbareRezepte = (nurVorrat ? treffer.filter((t) => t.abdeckung >= 0.75) : treffer).slice(0, 8);

  const gefiltert = suche
    ? lebensmittel.filter((l) => l.name.toLowerCase().includes(suche.toLowerCase())).slice(0, 8)
    : lebensmittel.slice(0, 6);

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
    Math.round((analyse?.items ?? []).reduce((acc, it, i) => acc + it[feld] * (faktoren[i] ?? 1), 0));

  return (
    <div className="space-y-8">
      <BereichNavigation bereich="ernaehrung" aktiv="essen" />
      <header>
        <p className="label-xs">Ernährung</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Dein Tag</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ziele aus deinem Profil: {plan.kalorien.toLocaleString("de-DE")} kcal · {plan.protein} g Protein
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5">
          <Ring
            value={(heuteSumme.kcal / plan.kalorien) * 100}
            label={heuteSumme.kcal.toLocaleString("de-DE")}
            sub={`von ${plan.kalorien.toLocaleString("de-DE")} kcal`}
          />
          <div className="min-w-0 space-y-3">
            <Makro label="Protein" ist={heuteSumme.protein} ziel={plan.protein} unit="g" tone="primary" />
            <Makro label="Kohlenhydrate" ist={heuteSumme.kh} ziel={plan.kohlenhydrate} unit="g" tone="info" />
            <Makro label="Fett" ist={heuteSumme.fett} ziel={plan.fett} unit="g" tone="accent" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-secondary/40 p-3 text-sm">
          <Droplets className="h-4 w-4 shrink-0 text-info" />
          Wasser {(wasserHeute / 1000).toFixed(2).replace(".", ",")} / 2,5 l
          <span className="ml-auto flex gap-2">
            <button
              onClick={() => wasserHinzufuegen(250)}
              className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold"
            >
              +250 ml
            </button>
            <button
              onClick={() => wasserHinzufuegen(-250)}
              className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-muted-foreground"
              aria-label="250 ml abziehen"
            >
              −250 ml
            </button>
          </span>
        </div>
        <Bar className="mt-2" value={(wasserHeute / wasserZiel) * 100} tone="info" />
      </Card>

      <Section titel="Schnell erfassen">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setScannerOffen(true)}
            className="surface flex flex-col items-center gap-2 p-4 text-center text-xs font-bold transition-colors hover:border-primary/50"
          >
            <ScanBarcode className="h-5 w-5 text-primary" />
            Barcode scannen
          </button>
          <button
            onClick={() => kamera.current?.click()}
            className="surface flex flex-col items-center gap-2 p-4 text-center text-xs font-bold transition-colors hover:border-primary/50"
          >
            <Camera className="h-5 w-5 text-primary" />
            Foto analysieren
          </button>
          <button
            onClick={() => setErfassenOffen((o) => !o)}
            className="surface flex flex-col items-center gap-2 p-4 text-center text-xs font-bold transition-colors hover:border-primary/50"
          >
            <Search className="h-5 w-5 text-primary" />
            Lebensmittel suchen
          </button>
        </div>

        {suchtCode && (
          <Card className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Produkt wird gesucht …
          </Card>
        )}

        {produkt && (
          <Card className="mt-3 border-primary/30">
            <div className="flex items-start gap-3">
              {produkt.bild && (
                <img
                  src={produkt.bild}
                  alt={`Produktfoto ${produkt.name}`}
                  className="h-16 w-16 rounded-xl object-contain"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{produkt.name}</p>
                <p className="text-xs text-muted-foreground">
                  {produkt.marke ? `${produkt.marke} · ` : ""}
                  {produkt.kcal > 0
                    ? `${produkt.kcal} kcal / 100 ${produkt.einheit}`
                    : "Für dieses Produkt sind keine Nährwerte hinterlegt – bitte per Suche oder Foto erfassen."}
                </p>

              </div>
              <button onClick={() => setProdukt(null)} aria-label="Produkt verwerfen">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={10}
                step={10}
                value={produktMenge}
                onChange={(e) => setProduktMenge(Math.max(0, Number(e.target.value)))}
                aria-label={`Menge ${produkt.name}`}
                className="num w-24 rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
              />
              <span className="text-xs text-muted-foreground">{produkt.einheit}</span>
              <p className="num text-xs text-muted-foreground">
                = {Math.round((produkt.kcal * produktMenge) / 100)} kcal ·{" "}
                {Math.round((produkt.protein * produktMenge) / 100)} g Protein
              </p>
              <button
                onClick={() => {
                  mahlzeitHinzufuegen({
                    name: `${produkt.marke ? `${produkt.marke} ` : ""}${produkt.name} (${produktMenge} ${produkt.einheit})`,
                    kcal: Math.round((produkt.kcal * produktMenge) / 100),
                    protein: Math.round((produkt.protein * produktMenge) / 100),
                    kh: Math.round((produkt.kh * produktMenge) / 100),
                    fett: Math.round((produkt.fett * produktMenge) / 100),
                    quelle: "datenbank",
                  });
                  toast.success(`${produkt.name} erfasst`);
                  setProdukt(null);
                }}
                className="ml-auto flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> Erfassen
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Angaben aus Open Food Facts – Herstellerdaten können abweichen.
            </p>
          </Card>
        )}


        {erfassenOffen && (
          <Card className="mt-3">
            <div className="flex items-center gap-2">
              <input
                value={suche}
                onChange={(e) => setSuche(e.target.value)}
                placeholder="z. B. Hähnchenbrust"
                aria-label="Lebensmittel suchen"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              />
              <button onClick={() => setErfassenOffen(false)} aria-label="Suche schließen">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <ul className="mt-3 divide-y divide-border">
              {gefiltert.map((l) => {
                const g = menge[l.name] ?? 100;
                return (
                  <li key={l.name} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{l.name}</p>
                      <p className="num text-xs text-muted-foreground">
                        {Math.round((l.kcal * g) / 100)} kcal · {Math.round((l.protein * g) / 100)} g Protein
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={10}
                        step={10}
                        value={g}
                        onChange={(e) => setMenge((m) => ({ ...m, [l.name]: Number(e.target.value) }))}
                        aria-label={`Menge ${l.name} in Gramm`}
                        className="num w-24 rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
                      />
                      <span className="text-xs text-muted-foreground">g</span>
                      <button
                        onClick={() => {
                          mahlzeitHinzufuegen({
                            name: `${l.name} (${g} g)`,
                            kcal: Math.round((l.kcal * g) / 100),
                            protein: Math.round((l.protein * g) / 100),
                            kh: Math.round((l.kh * g) / 100),
                            fett: Math.round((l.fett * g) / 100),
                            quelle: "datenbank",
                          });
                          toast.success(`${l.name} erfasst`);
                        }}
                        className="ml-auto flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                      >
                        <Plus className="h-3.5 w-3.5" /> Erfassen
                      </button>
                    </div>
                  </li>
                );
              })}
              {gefiltert.length === 0 && (
                <li className="py-3 text-sm text-muted-foreground">
                  Nichts gefunden – erfasse die Mahlzeit per Foto.
                </li>
              )}
            </ul>
          </Card>
        )}
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

      <BarcodeScanner offen={scannerOffen} onSchliessen={() => setScannerOffen(false)} onCode={codeGefunden} />



      {(bild || laedt) && (
        <Section titel="Foto-Erkennung">
          <Card className="border-info/30">
            <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
              {bild && (
                <img src={bild} alt="Foto der erfassten Mahlzeit" className="h-40 w-full rounded-2xl object-cover" />
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
                      <p className="num mt-3 text-2xl font-extrabold">
                        {summe("kcal").toLocaleString("de-DE")} kcal
                      </p>
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
                      onChange={(e) => setFaktoren((f) => f.map((v, j) => (j === i ? Number(e.target.value) : v)))}
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
                  {analyse.hinweis} Eine Fotoanalyse kann Kalorien nicht exakt bestimmen – korrigiere die
                  Portionen, dann wird die Schätzung deutlich genauer.
                </Disclaimer>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      mahlzeitHinzufuegen({
                        name: analyse.gericht,
                        kcal: summe("kcal"),
                        protein: summe("protein_g"),
                        kh: summe("kh_g"),
                        fett: summe("fett_g"),
                        quelle: "foto",
                      });
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

      <Section titel="Heutige Mahlzeiten">
        <Card className="p-2">
          <ul className="divide-y divide-border">
            {heutigeMahlzeiten.map((m) => (
              <li key={m.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {m.name}{" "}
                    <span className="text-muted-foreground">
                      ·{" "}
                      {new Date(m.datum).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.protein} g Protein · {m.kh} g KH · {m.fett} g Fett
                  </p>
                </div>
                <span className="num shrink-0 text-sm font-bold">{m.kcal} kcal</span>
                <button
                  onClick={() => mahlzeitEntfernen(m.id)}
                  aria-label={`${m.name} löschen`}
                  className="shrink-0 rounded-lg p-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
            {heutigeMahlzeiten.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                Noch nichts erfasst. Nutze Foto-Analyse oder die Lebensmittelsuche.
              </li>
            )}
          </ul>
        </Card>
      </Section>

      <Section titel="Was habe ich zu Hause?">
        <Card>
          <p className="text-sm text-muted-foreground">
            Trage ein, was da ist – EVION gleicht deinen Vorrat mit den Rezepten ab und berücksichtigt deine
            Ernährungsform ({profil.ernaehrungsform})
            {profil.allergien.length > 0 ? ` und Unverträglichkeiten (${profil.allergien.join(", ")})` : ""}.
          </p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!neueZutat.trim()) return;
              vorratHinzufuegen(neueZutat);
              setNeueZutat("");
            }}
          >
            <input
              value={neueZutat}
              onChange={(e) => setNeueZutat(e.target.value)}
              placeholder="Zutat hinzufügen …"
              aria-label="Zutat hinzufügen"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>

          {daten.vorrat.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {daten.vorrat.map((v) => (
                <button
                  key={v}
                  onClick={() => vorratEntfernen(v)}
                  className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary"
                >
                  {v} <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          <p className="label-xs mt-5">Häufige Zutaten</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {vorratVorschlaege
              .filter((v) => !daten.vorrat.some((x) => x.toLowerCase() === v.toLowerCase()))
              .slice(0, 24)
              .map((v) => (
                <Chip key={v} onClick={() => vorratHinzufuegen(v)}>
                  {v}
                </Chip>
              ))}
          </div>
        </Card>
      </Section>

      <Section titel="Rezepte für dich">
        <Card className="border-primary/30">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="label-xs">Noch offen</p>
              <p className="num text-2xl font-extrabold">{offenKcal.toLocaleString("de-DE")} kcal</p>
            </div>
            <div>
              <p className="label-xs">Protein offen</p>
              <p className="num text-2xl font-extrabold">{offenProtein} g</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip active={!nurVorrat} onClick={() => setNurVorrat(false)}>
              Alle Rezepte
            </Chip>
            <Chip active={nurVorrat} onClick={() => setNurVorrat(true)}>
              Nur mit meinem Vorrat
            </Chip>
          </div>
        </Card>

        <div className="mt-3 space-y-3">
          {sichtbareRezepte.map((t) => (
            <RezeptKarte
              key={t.rezept.id}
              treffer={t}
              offen={offenesRezept === t.rezept.id}
              onToggle={() => setOffenesRezept(offenesRezept === t.rezept.id ? null : t.rezept.id)}
              onGegessen={() => {
                mahlzeitHinzufuegen({
                  name: t.rezept.name,
                  kcal: t.rezept.kcal,
                  protein: t.rezept.protein,
                  kh: t.rezept.kh,
                  fett: t.rezept.fett,
                  quelle: "rezept",
                });
                toast.success(`${t.rezept.name} erfasst`);
              }}
              onEinkauf={() => {
                t.fehlt.forEach((f) => vorratHinzufuegen(f.replace(/^[\d.,]+\s*(g|ml|EL|TL|Dose|Scheiben)?\s*/i, "")));
                toast.success("Fehlende Zutaten in den Vorrat übernommen");
              }}
            />
          ))}
          {sichtbareRezepte.length === 0 && (
            <Card className="text-sm text-muted-foreground">
              Keine Treffer – füge weitere Zutaten hinzu oder zeige alle Rezepte an.
            </Card>
          )}
        </div>
      </Section>

      <Disclaimer>
        Alle Nährwerte sind Durchschnitts- bzw. Schätzwerte je Portion. Sie ersetzen keine
        ernährungsmedizinische Beratung.
      </Disclaimer>
    </div>
  );
}

function RezeptKarte({
  treffer,
  offen,
  onToggle,
  onGegessen,
  onEinkauf,
}: {
  treffer: RezeptTreffer;
  offen: boolean;
  onToggle: () => void;
  onGegessen: () => void;
  onEinkauf: () => void;
}) {
  const r = treffer.rezept;
  return (
    <Card className="p-0">
      <button onClick={onToggle} className="w-full p-5 text-left">
        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3">
          <div className="min-w-0">
            <p className="font-display text-lg font-bold">{r.name}</p>
            <p className="text-xs text-muted-foreground">
              {r.zeit} Min. · {r.portionen} Portion{r.portionen > 1 ? "en" : ""} · {r.tags.join(" · ")}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-2">
            <span className="num text-sm font-bold">
              {r.kcal} kcal · {r.protein} g
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", offen && "rotate-180")} />
          </span>
        </div>
        <p
          className={cn(
            "mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
            treffer.abdeckung === 1
              ? "bg-primary/15 text-primary"
              : treffer.abdeckung >= 0.5
                ? "bg-success/15 text-success"
                : "bg-secondary text-muted-foreground",
          )}
        >
          {treffer.passung}
        </p>
      </button>

      {offen && (
        <div className="border-t border-border p-5 text-sm">
          <p className="label-xs">Zutaten</p>
          <ul className="mt-2 space-y-1">
            {r.zutaten.map((zt) => (
              <li key={zt.text} className="flex items-center gap-2">
                <Utensils className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className={cn(treffer.fehlt.includes(zt.text) && "text-muted-foreground")}>{zt.text}</span>
                {treffer.vorhanden.includes(zt.text) && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">vorhanden</span>
                )}
              </li>
            ))}
          </ul>

          <p className="label-xs mt-4">Zubereitung</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
            {r.schritte.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>

          <p className="mt-4 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
            Je Portion: {r.kcal} kcal · {r.protein} g Protein · {r.kh} g KH · {r.fett} g Fett
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={onGegessen}
              className="flex-1 rounded-2xl bg-primary px-4 py-3 font-display text-sm font-extrabold uppercase tracking-wide text-primary-foreground"
            >
              Gegessen – erfassen
            </button>
            {treffer.fehlt.length > 0 && (
              <Chip onClick={onEinkauf}>Fehlende Zutaten übernehmen</Chip>
            )}
          </div>
        </div>
      )}
    </Card>
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
