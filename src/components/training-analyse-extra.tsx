import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Card, QualityTag, Section, Stat } from "@/components/ui-kit";
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
import {
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

const axis = { tick: { fontSize: 10, fill: "var(--muted-foreground)" }, tickLine: false, axisLine: false };
const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

/**
 * Trainingsauswertung: Kraft- und Volumenkennzahlen, Wochenvolumen,
 * e1RM-Verlauf der Top-Übung sowie die letzten absolvierten Einheiten.
 * Wird in Training › Analyse eingebunden.
 */
export function TrainingAnalyseExtra() {
  const { aktivitaet } = useAktivitaet();

  const prs = useMemo(() => rekorde(aktivitaet), [aktivitaet]);
  const topUebung = prs[0] ?? null;
  const wochenVolumen = useMemo(() => volumenProWoche(aktivitaet), [aktivitaet]);
  const kraftDaten = useMemo(
    () => (topUebung ? e1rmVerlauf(aktivitaet, topUebung.uebungId) : []),
    [aktivitaet, topUebung],
  );
  const kraftDelta = useMemo(() => {
    if (kraftDaten.length < 2) return null;
    const erst = kraftDaten[0]!.e1rm;
    const letzt = kraftDaten[kraftDaten.length - 1]!.e1rm;
    if (!erst) return null;
    return Math.round(((letzt - erst) / erst) * 100);
  }, [kraftDaten]);

  const volumenGesamt = gesamtVolumen(aktivitaet);
  const saetzeGesamt = useMemo(
    () => aktivitaet.einheiten.reduce((s, e) => s + e.saetze.length, 0),
    [aktivitaet],
  );

  return (
    <div className="space-y-8">
      <Section titel="Kraft & Volumen">
        <Card>
          <div className="grid grid-cols-2 gap-5">
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
              tone={kraftDelta !== null && kraftDelta > 0 ? "good" : "default"}
            />
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
            {einheitenSeit(aktivitaet, 7).length} Einheiten in den letzten 7 Tagen · Serie {streak(aktivitaet)}
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
    </div>
  );
}
