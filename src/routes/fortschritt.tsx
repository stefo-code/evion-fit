import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, Chip, Disclaimer, QualityTag, Section, Stat } from "@/components/ui-kit";
import { datenquellen, ernaehrungsVerlauf, schlafVerlauf } from "@/lib/demo-data";
import { effektivesProfil, useOnboardingProfil } from "@/lib/onboarding-store";
import {
  e1rmVerlauf,
  einheitenSeit,
  gesamtVolumen,
  rekorde,
  streak,
  useAktivitaet,
  volumen,
  volumenProWoche,
} from "@/lib/activity-store";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar as RBar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/fortschritt")({
  head: () => ({
    meta: [
      { title: "Fortschritt – EVION" },
      {
        name: "description",
        content: "Gewicht, Körperzusammensetzung, Kraft, Volumen, Schlaf und Aktivität im Verlauf.",
      },
      { property: "og:title", content: "Fortschritt – EVION" },
      { property: "og:description", content: "Sichtbarer Fortschritt – auch wenn das Gewicht stagniert." },
    ],
  }),
  component: FortschrittPage,
});

const zeitraeume = [
  { label: "4 Wochen", tage: 28 },
  { label: "3 Monate", tage: 90 },
  { label: "6 Monate", tage: 180 },
  { label: "Gesamt", tage: 3650 },
];

const axis = { tick: { fontSize: 10, fill: "var(--muted-foreground)" }, tickLine: false, axisLine: false };
const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

function FortschrittPage() {
  const { profil } = useOnboardingProfil();
  const eff = effektivesProfil(profil);
  const { aktivitaet, geladen, gewichtLoggen } = useAktivitaet();
  const [zeit, setZeit] = useState(zeitraeume[1]!);

  const grenze = Date.now() - zeit.tage * 86400000;
  const einheiten = aktivitaet.einheiten.filter((e) => new Date(e.datum).getTime() >= grenze);
  const gewichte = aktivitaet.gewichte.filter((g) => new Date(g.datum).getTime() >= grenze);

  const gewichtsDaten = gewichte.map((g) => ({
    datum: new Date(g.datum).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
    gewicht: g.gewicht,
    taille: g.taille ?? undefined,
  }));

  const prs = rekorde(aktivitaet);
  const topUebung = prs[0];
  const kraftDaten = topUebung ? e1rmVerlauf(aktivitaet, topUebung.uebungId) : [];
  const wochenVolumen = volumenProWoche(aktivitaet, 10);

  const startGewicht = aktivitaet.gewichte[0]?.gewicht ?? profil.gewicht ?? null;
  const aktuellGewicht = aktivitaet.gewichte[aktivitaet.gewichte.length - 1]?.gewicht ?? profil.gewicht ?? null;
  const zielGewicht = profil.zielGewicht ?? null;
  const gewichtDelta =
    startGewicht !== null && aktuellGewicht !== null ? +(aktuellGewicht - startGewicht).toFixed(1) : null;
  const zielFortschritt =
    startGewicht !== null && aktuellGewicht !== null && zielGewicht !== null && startGewicht !== zielGewicht
      ? Math.max(0, Math.min(100, Math.round(((startGewicht - aktuellGewicht) / (startGewicht - zielGewicht)) * 100)))
      : null;

  const volumenGesamt = einheiten.reduce((s, e) => s + volumen(e.saetze), 0);
  const saetzeGesamt = einheiten.reduce((s, e) => s + e.saetze.length, 0);
  const kraftDelta = useMemo(() => {
    if (kraftDaten.length < 2) return null;
    const a = kraftDaten[0]!.e1rm;
    const b = kraftDaten[kraftDaten.length - 1]!.e1rm;
    if (!a) return null;
    return Math.round(((b - a) / a) * 100);
  }, [kraftDaten]);

  const [neuesGewicht, setNeuesGewicht] = useState("");
  const [neueTaille, setNeueTaille] = useState("");

  function gewichtSpeichern() {
    const kg = Number(neuesGewicht.replace(",", "."));
    if (!Number.isFinite(kg) || kg <= 20 || kg > 400) {
      toast.error("Bitte ein realistisches Gewicht in kg eingeben.");
      return;
    }
    const taille = neueTaille ? Number(neueTaille.replace(",", ".")) : null;
    const neu = gewichtLoggen(kg, Number.isFinite(taille as number) ? taille : null);
    setNeuesGewicht("");
    setNeueTaille("");
    toast.success("Messung gespeichert");
    for (const e of neu) toast.success(`Erfolg freigeschaltet: ${e.titel}`);
  }

  const keineDaten = geladen && aktivitaet.einheiten.length === 0 && aktivitaet.gewichte.length === 0;

  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">Fortschritt</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Deine Entwicklung</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle Auswertungen entstehen aus deinen protokollierten Trainings und Messungen.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {zeitraeume.map((z) => (
          <Chip key={z.label} active={z.label === zeit.label} onClick={() => setZeit(z)}>
            {z.label}
          </Chip>
        ))}
      </div>

      {keineDaten && (
        <Card className="border-primary/40 bg-primary/10">
          <p className="font-display text-lg font-extrabold">Noch keine eigenen Daten</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Trage unten dein Gewicht ein oder schließe ein Training ab – danach füllen sich alle Diagramme
            automatisch.
          </p>
          <Link
            to="/training/workout"
            search={{ tag: 0 }}
            className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-primary-foreground"
          >
            Training starten
          </Link>
        </Card>
      )}

      <Section titel="Überblick">
        <Card>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Stat
              label="Gewicht"
              value={gewichtDelta === null ? "—" : `${gewichtDelta > 0 ? "+" : ""}${gewichtDelta.toLocaleString("de-DE")}`}
              unit="kg"
              delta={zeit.label}
            />
            <Stat label="Einheiten" value={String(einheiten.length)} delta={zeit.label} tone="good" />
            <Stat
              label="Volumen"
              value={volumenGesamt.toLocaleString("de-DE")}
              unit="kg"
              delta={`${saetzeGesamt} Sätze`}
            />
            <Stat
              label="Kraft"
              value={kraftDelta === null ? "—" : `${kraftDelta > 0 ? "+" : ""}${kraftDelta}`}
              unit="%"
              delta={topUebung?.name ?? "noch keine Rekorde"}
              tone={kraftDelta && kraftDelta > 0 ? "good" : "default"}
            />
          </div>
          {zielFortschritt !== null && (
            <p className="mt-4 rounded-xl bg-secondary/50 p-4 text-sm leading-relaxed">
              Du hast {zielFortschritt} % der Strecke zu deinem Zielgewicht ({zielGewicht} kg) zurückgelegt.
              Kraft- und Volumenentwicklung zeigen, ob die Substanz dabei erhalten bleibt.
            </p>
          )}
          <Disclaimer>
            Aus diesen Daten lässt sich kein garantierter Muskelaufbau ableiten. Körperfett- und
            Muskelmassewerte aus Waagen sind Schätzungen.
          </Disclaimer>
        </Card>
      </Section>

      <Section titel="Gewicht & Taille">
        <Card>
          {gewichtsDaten.length > 1 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gewichtsDaten} margin={{ left: -18, right: 4, top: 8 }}>
                  <defs>
                    <linearGradient id="gw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="datum" {...axis} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} {...axis} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="gewicht"
                    name="Gewicht (kg)"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fill="url(#gw)"
                  />
                  <Line type="monotone" dataKey="taille" name="Taille (cm)" stroke="var(--info)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ab der zweiten Messung siehst du hier deinen Verlauf.
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="text-sm">
              <span className="label-xs">Gewicht (kg)</span>
              <input
                inputMode="decimal"
                value={neuesGewicht}
                onChange={(e) => setNeuesGewicht(e.target.value)}
                placeholder={String(eff.gewicht ?? 80)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5"
              />
            </label>
            <label className="text-sm">
              <span className="label-xs">Taille (cm, optional)</span>
              <input
                inputMode="decimal"
                value={neueTaille}
                onChange={(e) => setNeueTaille(e.target.value)}
                placeholder="—"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5"
              />
            </label>
            <button
              onClick={gewichtSpeichern}
              className="mt-1 self-end rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-primary-foreground sm:mt-0"
            >
              Speichern
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {startGewicht !== null ? `Start ${startGewicht} kg` : "Noch kein Startwert"}
              {aktuellGewicht !== null && ` · aktuell ${aktuellGewicht} kg`}
              {zielGewicht !== null && ` · Ziel ${zielGewicht} kg`}
            </span>
            <QualityTag quality="gemessen" />
          </div>
        </Card>
      </Section>

      <Section titel="Trainingsvolumen pro Woche">
        <Card>
          {wochenVolumen.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wochenVolumen} margin={{ left: -18, right: 4, top: 8 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="woche" {...axis} />
                  <YAxis {...axis} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                  <RBar dataKey="volumen" name="Volumen (kg)" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Noch kein Training protokolliert.</p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            Gesamtvolumen bisher: {gesamtVolumen(aktivitaet).toLocaleString("de-DE")} kg ·{" "}
            {einheitenSeit(aktivitaet, 7).length} Einheiten in den letzten 7 Tagen · Serie{" "}
            {streak(aktivitaet)}
          </p>
        </Card>
      </Section>

      <Section titel="Kraftentwicklung (geschätztes 1RM)">
        <Card>
          {kraftDaten.length > 1 ? (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kraftDaten} margin={{ left: -18, right: 4, top: 8 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="datum" {...axis} />
                    <YAxis domain={["dataMin - 5", "dataMax + 5"]} {...axis} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="e1rm"
                      name={`${topUebung?.name} (kg)`}
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <QualityTag quality="berechnet" /> Epley-Schätzung aus deinen Sätzen.
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nach der zweiten Einheit mit derselben Übung erscheint hier deine Kraftkurve.
            </p>
          )}
          {prs.length > 0 && (
            <ul className="mt-4 divide-y divide-border">
              {prs.slice(0, 5).map((r) => (
                <li key={r.uebungId} className="flex justify-between gap-3 py-2 text-sm">
                  <span className="truncate">{r.name}</span>
                  <span className="num shrink-0 font-semibold">
                    {r.gewicht} kg × {r.wdh} · ≈ {r.e1rm} kg
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/erfolge" className="mt-4 inline-flex text-xs font-bold uppercase tracking-wider text-primary">
            Alle Erfolge & Rekorde
          </Link>
        </Card>
      </Section>

      <Section titel="Letzte Einheiten">
        <Card className="p-2">
          {aktivitaet.einheiten.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Noch keine Einheit abgeschlossen.</p>
          ) : (
            <ul className="divide-y divide-border">
              {[...aktivitaet.einheiten]
                .reverse()
                .slice(0, 8)
                .map((e) => (
                  <li key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{e.titel}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {new Date(e.datum).toLocaleDateString("de-DE", {
                          weekday: "short",
                          day: "2-digit",
                          month: "2-digit",
                        })}{" "}
                        · {e.saetze.length} Sätze · {e.dauerMin} min
                      </p>
                    </div>
                    <span className="num shrink-0 text-sm font-bold">
                      {volumen(e.saetze).toLocaleString("de-DE")} kg
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </Section>

      <Section titel="Ernährung & Aktivität (Beispieldaten)">
        <Card>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ernaehrungsVerlauf} margin={{ left: -18, right: 4, top: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="tag" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <RBar dataKey="kalorien" name="kcal" fill="var(--info)" radius={[6, 6, 0, 0]} />
                <RBar dataKey="protein" name="Protein (g)" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schlafVerlauf} margin={{ left: -18, right: 4, top: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="tag" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <RBar dataKey="schritte" name="Schritte" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Schlaf- und Schrittdaten stammen aus der Beispielquelle, bis ein Gerät verbunden ist.
          </p>
        </Card>
      </Section>

      <Section titel="Datenherkunft">
        <Card className="p-2">
          <ul className="divide-y divide-border">
            {datenquellen.map((d) => (
              <li key={d.feld} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{d.feld}</p>
                  <p className="truncate text-xs text-muted-foreground">{d.quelle}</p>
                </div>
                <QualityTag quality={d.qualitaet} />
              </li>
            ))}
          </ul>
        </Card>
      </Section>
    </div>
  );
}
