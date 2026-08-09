import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, Card, Chip, Disclaimer, QualityTag, Section, Stat } from "@/components/ui-kit";
import {
  datenquellen,
  ernaehrungsVerlauf,
  gewichtsVerlauf,
  kraftVerlauf,
  profile,
  schlafVerlauf,
} from "@/lib/demo-data";
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

const zeitraeume = ["7 Tage", "4 Wochen", "3 Monate", "6 Monate", "1 Jahr", "Gesamt"];

const axis = { tick: { fontSize: 10, fill: "var(--muted-foreground)" }, tickLine: false, axisLine: false };
const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

function FortschrittPage() {
  const [zeit, setZeit] = useState("3 Monate");

  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">Fortschritt</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Deine Entwicklung</h1>
      </header>

      <div className="flex flex-wrap gap-2">
        {zeitraeume.map((z) => (
          <Chip key={z} active={z === zeit} onClick={() => setZeit(z)}>
            {z}
          </Chip>
        ))}
      </div>

      <Section titel="Body Recomposition">
        <Card>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Stat label="Gewicht" value="−0,4" unit="kg" delta="4 Wochen" />
            <Stat label="Taille" value="−3,1" unit="cm" delta="4 Wochen" tone="good" />
            <Stat label="Kraft" value="+8" unit="%" delta="8 Wochen" tone="good" />
            <Stat label="Körperfett-Trend" value="sinkend" delta="geschätzt" tone="good" />
          </div>
          <p className="mt-4 rounded-xl bg-secondary/50 p-4 text-sm leading-relaxed">
            Obwohl sich dein Gewicht nur wenig verändert hat, sprechen Taillenumfang und
            Leistungsentwicklung für eine positive Körperentwicklung.
          </p>
          <Disclaimer>
            Aus diesen Daten lässt sich kein garantierter Muskelaufbau ableiten. Körperfett- und
            Muskelmassewerte sind Schätzungen.
          </Disclaimer>
        </Card>
      </Section>

      <Section titel="Gewicht & Taille">
        <Card>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={gewichtsVerlauf} margin={{ left: -18, right: 4, top: 8 }}>
                <defs>
                  <linearGradient id="gw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="woche" {...axis} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="gewicht" name="Gewicht (kg)" stroke="var(--primary)" strokeWidth={2.5} fill="url(#gw)" />
                <Line type="monotone" dataKey="taille" name="Taille (cm)" stroke="var(--info)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Start {profile.startGewicht} kg · aktuell {profile.gewicht} kg · Ziel {profile.zielGewicht} kg
            </span>
            <QualityTag quality="gemessen" />
          </div>
          <Bar className="mt-2" value={68} />
        </Card>
      </Section>

      <Section titel="Kraft & Volumen">
        <Card>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={kraftVerlauf} margin={{ left: -18, right: 4, top: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="woche" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="bank" name="Bankdrücken" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="kniebeuge" name="Kniebeuge" stroke="var(--info)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="kreuzheben" name="Kreuzheben" stroke="var(--accent)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4">
            <Stat label="e1RM Bank" value="≈ 101" unit="kg" delta="berechnet" />
            <Stat label="e1RM Kniebeuge" value="≈ 152" unit="kg" delta="berechnet" />
            <Stat label="Volumen/Woche" value="50.400" unit="kg" delta="+3,1 %" tone="good" />
          </div>
        </Card>
      </Section>

      <Section titel="Körperfett (geschätzt)">
        <Card>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gewichtsVerlauf} margin={{ left: -18, right: 4, top: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="woche" {...axis} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} {...axis} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} %`, "Körperfett"]} />
                <Line type="monotone" dataKey="kf" stroke="var(--warning)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <QualityTag quality="geschätzt" /> BIA-Waage – nur der Trend ist aussagekräftig.
          </div>
        </Card>
      </Section>

      <Section titel="Ernährung – letzte 7 Tage">
        <Card>
          <div className="h-48">
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
        </Card>
      </Section>

      <Section titel="Schlaf & Schritte">
        <Card>
          <div className="h-48">
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
          <p className="mt-3 text-sm text-muted-foreground">
            Ø Schlaf 7 h 21 min · Ø 9.482 Schritte pro Tag
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
