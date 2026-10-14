import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BereichNavigation, Card, Chip, Disclaimer, QualityTag, Section, Stat } from "@/components/ui-kit";
import { MessungFormSheet } from "@/components/messung-form";
import { effektivesProfil, useOnboardingProfil } from "@/lib/onboarding-store";
import {
  ersterWert,
  feldDef,
  kompositionsVerlauf,
  koerperKennzahlen,
  letzterWert,
  messFelder,
  readinessAusMessungen,
  recompSignal,
  useAktivitaet,
  veraenderung,
  verlauf,
  type MessFeld,
} from "@/lib/activity-store";
import { Trash2 } from "lucide-react";
import {
  Area,
  AreaChart,
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Fortschritt – EVION" },
      {
        name: "description",
        content: "Gewicht, Körperfett, Muskeln, Wasser, Umfänge und Erholung im Verlauf.",
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

const koerperFelder: MessFeld[] = ["gewicht", "koerperfett", "muskeln", "wasser"];
const umfangFelder: MessFeld[] = ["taille", "huefte", "brust", "arm", "oberschenkel"];
const erholungFelder: MessFeld[] = ["schlafStunden", "ruhepuls", "hrv", "schritte"];

function FortschrittPage() {
  const { profil } = useOnboardingProfil();
  const eff = effektivesProfil(profil);
  const { aktivitaet, geladen, messungLoeschen } = useAktivitaet();
  const [zeit, setZeit] = useState(zeitraeume[1]!);
  const [metrik, setMetrik] = useState<MessFeld>("gewicht");
  const [messenOffen, setMessenOffen] = useState(false);

  const kurve = verlauf(aktivitaet, metrik, zeit.tage);
  const komposition = kompositionsVerlauf(aktivitaet, zeit.tage);
  const kennzahlen = koerperKennzahlen(aktivitaet, eff.groesse);
  const recomp = recompSignal(aktivitaet);
  const readiness = readinessAusMessungen(aktivitaet);

  const startGewicht = ersterWert(aktivitaet, "gewicht")?.wert ?? profil.gewicht ?? null;
  const aktuellGewicht = letzterWert(aktivitaet, "gewicht")?.wert ?? profil.gewicht ?? null;
  const zielGewicht = profil.zielGewicht ?? null;
  const gewichtDelta = veraenderung(aktivitaet, "gewicht", zeit.tage);
  const fettDelta = veraenderung(aktivitaet, "koerperfett", zeit.tage);
  const zielFortschritt =
    startGewicht !== null && aktuellGewicht !== null && zielGewicht !== null && startGewicht !== zielGewicht
      ? Math.max(0, Math.min(100, Math.round(((startGewicht - aktuellGewicht) / (startGewicht - zielGewicht)) * 100)))
      : null;

  const umfangDaten = useMemo(() => {
    const grenzeU = Date.now() - zeit.tage * 86400000;
    return aktivitaet.messungen
      .filter((m) => new Date(m.datum).getTime() >= grenzeU)
      .filter((m) => umfangFelder.some((f) => typeof m[f] === "number"))
      .map((m) => ({
        datum: new Date(m.datum).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
        taille: m.taille ?? undefined,
        huefte: m.huefte ?? undefined,
        brust: m.brust ?? undefined,
        arm: m.arm ?? undefined,
        oberschenkel: m.oberschenkel ?? undefined,
      }));
  }, [aktivitaet.messungen, zeit.tage]);

  const erholungsDaten = useMemo(() => {
    const grenzeE = Date.now() - zeit.tage * 86400000;
    return aktivitaet.messungen
      .filter((m) => new Date(m.datum).getTime() >= grenzeE)
      .filter((m) => erholungFelder.some((f) => typeof m[f] === "number"))
      .map((m) => ({
        datum: new Date(m.datum).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
        schlaf: m.schlafStunden ?? undefined,
        ruhepuls: m.ruhepuls ?? undefined,
        hrv: m.hrv ?? undefined,
        schritte: m.schritte ?? undefined,
      }));
  }, [aktivitaet.messungen, zeit.tage]);

  const keineDaten = geladen && aktivitaet.einheiten.length === 0 && aktivitaet.messungen.length === 0;
  const def = feldDef(metrik);

  return (
    <div className="space-y-8">
      <BereichNavigation bereich="fortschritt" aktiv="verlauf" />
      <header>
        <p className="label-xs">Fortschritt</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Deine Entwicklung</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Körperwerte und Erholung aus deinen selbst erfassten Messwerten. Deine Trainingsauswertung
          findest du in{" "}
          <Link to="/training" className="font-semibold text-primary underline-offset-2 hover:underline">
            Training › Analyse
          </Link>
          .
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {zeitraeume.map((z) => (
          <Chip key={z.label} active={z.label === zeit.label} onClick={() => setZeit(z)}>
            {z.label}
          </Chip>
        ))}
      </div>

      <button
        onClick={() => setMessenOffen(true)}
        className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-primary-foreground sm:w-auto"
      >
        Messung eintragen
      </button>

      {keineDaten && (
        <Card className="border-primary/40 bg-primary/10">
          <p className="font-display text-lg font-extrabold">Noch keine eigenen Daten</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Trage oben deine erste Messung ein – danach füllen sich alle Diagramme automatisch.
          </p>
        </Card>
      )}

      <Section titel="Überblick">
        <Card>
          <div className="grid grid-cols-2 gap-5">
            <Stat
              label="Gewicht"
              value={gewichtDelta === null ? "—" : `${gewichtDelta > 0 ? "+" : ""}${gewichtDelta.toLocaleString("de-DE")}`}
              unit="kg"
              delta={zeit.label}
            />
            <Stat
              label="Körperfett"
              value={fettDelta === null ? "—" : `${fettDelta > 0 ? "+" : ""}${fettDelta.toLocaleString("de-DE")}`}
              unit="%"
              delta={zeit.label}
              tone={fettDelta !== null && fettDelta < 0 ? "good" : "default"}
            />
          </div>
          {zielFortschritt !== null && (
            <p className="mt-4 rounded-xl bg-secondary/50 p-4 text-sm leading-relaxed">
              Du hast {zielFortschritt} % der Strecke zu deinem Zielgewicht ({zielGewicht} kg) zurückgelegt.
            </p>
          )}
          {recomp && (
            <p className="mt-3 rounded-xl bg-primary/10 p-4 text-sm leading-relaxed">
              Körperzusammensetzung: Fettmasse {recomp.fett > 0 ? "+" : ""}
              {recomp.fett.toLocaleString("de-DE")} kg · Magermasse {recomp.mager > 0 ? "+" : ""}
              {recomp.mager.toLocaleString("de-DE")} kg.{" "}
              {recomp.positiv
                ? "Das ist das typische Muster einer Body Recomposition – Kurs halten."
                : "Halte Protein und Krafttraining hoch, damit die Magermasse erhalten bleibt."}
            </p>
          )}
          <Disclaimer>
            Körperfett-, Wasser- und Muskelanteile aus Waagen sind Schätzungen. Aussagekräftig ist der
            Trend über mehrere Wochen, nicht der Einzelwert.
          </Disclaimer>
        </Card>
      </Section>

      <Section titel="Körperwerte im Verlauf">
        <Card>
          <div className="mb-4 flex flex-wrap gap-2">
            {[...koerperFelder, ...umfangFelder].map((f) => (
              <Chip key={f} active={metrik === f} onClick={() => setMetrik(f)}>
                {feldDef(f).label}
              </Chip>
            ))}
          </div>
          {kurve.length > 1 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kurve} margin={{ left: -18, right: 4, top: 8 }}>
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
                    dataKey="wert"
                    name={`${def.label} (${def.einheit})`}
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fill="url(#gw)"
                  />
                  <Line
                    type="monotone"
                    dataKey="trend"
                    name="7-Tage-Trend"
                    stroke="var(--info)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ab der zweiten Messung von „{def.label}“ siehst du hier deinen Verlauf.
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {startGewicht !== null ? `Start ${startGewicht} kg` : "Noch kein Startwert"}
              {aktuellGewicht !== null && ` · aktuell ${aktuellGewicht} kg`}
              {zielGewicht !== null && ` · Ziel ${zielGewicht} kg`}
              {kennzahlen.bmi !== null && ` · BMI ${kennzahlen.bmi.toLocaleString("de-DE")}`}
            </span>
            <QualityTag quality={metrik === "gewicht" ? "gemessen" : "geschätzt"} />
          </div>
        </Card>
      </Section>

      <Section titel="Fett- und Magermasse">
        <Card>
          {komposition.length > 1 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={komposition} margin={{ left: -18, right: 4, top: 8 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="datum" {...axis} />
                  <YAxis domain={["dataMin - 2", "dataMax + 2"]} {...axis} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="magermasse"
                    name="Magermasse (kg)"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.15}
                    strokeWidth={2.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="fettmasse"
                    name="Fettmasse (kg)"
                    stroke="var(--warning)"
                    fill="var(--warning)"
                    fillOpacity={0.15}
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Trage Gewicht und Körperfett gemeinsam ein – dann berechnet EVION Fett- und Magermasse.
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Stat label="Fettmasse" value={kennzahlen.fettmasse?.toLocaleString("de-DE") ?? "—"} unit="kg" />
            <Stat label="Magermasse" value={kennzahlen.magermasse?.toLocaleString("de-DE") ?? "—"} unit="kg" />
            <Stat label="Wasser" value={kennzahlen.wasser?.toLocaleString("de-DE") ?? "—"} unit="%" />
            <Stat label="Muskeln" value={kennzahlen.muskeln?.toLocaleString("de-DE") ?? "—"} unit="%" />
          </div>
          <div className="mt-3">
            <QualityTag quality="berechnet" />
          </div>
        </Card>
      </Section>

      {umfangDaten.length > 1 && (
        <Section titel="Umfänge">
          <Card>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={umfangDaten} margin={{ left: -18, right: 4, top: 8 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="datum" {...axis} />
                  <YAxis domain={["dataMin - 2", "dataMax + 2"]} {...axis} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="taille" name="Taille (cm)" stroke="var(--primary)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="huefte" name="Hüfte (cm)" stroke="var(--info)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="brust" name="Brust (cm)" stroke="var(--accent)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="arm" name="Arm (cm)" stroke="var(--warning)" strokeWidth={2} dot={false} />
                  <Line
                    type="monotone"
                    dataKey="oberschenkel"
                    name="Oberschenkel (cm)"
                    stroke="var(--muted-foreground)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Section>
      )}

      <Section titel="Erholung & Alltag">
        <Card>
          {readiness ? (
            <>
              <p className="text-sm leading-relaxed">
                Geschätzte Bereitschaft: <span className="num font-bold">{readiness.score}</span> / 100 –{" "}
                {readiness.score >= 75
                  ? "gute Voraussetzungen für eine schwere Einheit."
                  : readiness.score >= 55
                    ? "normales Training sinnvoll, Spitzenlasten dosieren."
                    : "eher lockere Einheit oder Technikfokus."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Basis: {readiness.gruende.join(" · ")}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Trage Schlaf, Ruhepuls, HRV oder dein Befinden ein – daraus schätzt EVION deine Bereitschaft.
            </p>
          )}
          {erholungsDaten.length > 1 && (
            <div className="mt-4 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={erholungsDaten} margin={{ left: -18, right: 4, top: 8 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="datum" {...axis} />
                  <YAxis {...axis} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="schlaf" name="Schlaf (h)" stroke="var(--info)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ruhepuls" name="Ruhepuls (bpm)" stroke="var(--warning)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="hrv" name="HRV (ms)" stroke="var(--primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </Section>

      <Section titel="Alle Messungen">
        <Card className="p-2">
          {aktivitaet.messungen.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Noch keine Messung erfasst.</p>
          ) : (
            <ul className="divide-y divide-border">
              {[...aktivitaet.messungen]
                .reverse()
                .slice(0, 20)
                .map((m) => {
                  const werte = messFelder
                    .filter((f) => typeof m[f.key] === "number")
                    .map((f) => `${f.label} ${(m[f.key] as number).toLocaleString("de-DE")} ${f.einheit}`);
                  return (
                    <li key={m.datum} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {new Date(m.datum).toLocaleDateString("de-DE", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">{werte.join(" · ")}</p>
                      </div>
                      <button
                        onClick={() => messungLoeschen(m.datum)}
                        aria-label="Messung löschen"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
        </Card>
      </Section>

      {messenOffen && <MessungFormSheet onSchliessen={() => setMessenOffen(false)} />}
    </div>
  );
}
