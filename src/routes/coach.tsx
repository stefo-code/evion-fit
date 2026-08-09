import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Chip, Disclaimer, Section, Why } from "@/components/ui-kit";
import { coachVorschlaege, heute, muskelStatus, profile, readiness } from "@/lib/demo-data";
import { Send, Sparkles, User } from "lucide-react";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "KI-Coach – Vektor" },
      {
        name: "description",
        content: "Proaktive Empfehlungen zu Training, Ernährung, Regeneration und Supplements.",
      },
      { property: "og:title", content: "KI-Coach – Vektor" },
      { property: "og:description", content: "Ein Coach, der deine Daten kennt – und daraus Handlungen ableitet." },
    ],
  }),
  component: CoachPage,
});

type Msg = { rolle: "coach" | "user"; text: string };

const antwort = (frage: string) => {
  const f = frage.toLowerCase();
  if (f.includes("protein"))
    return `Dir fehlen heute noch ${heute.protein.ziel - heute.protein.ist} g Protein. Drei Optionen: 250 g Skyr mit Beeren (≈ 30 g), 180 g Hähnchen mit Reis (≈ 55 g) oder ein Whey-Shake (≈ 25 g). Am wenigsten Aufwand: Skyr plus Shake.`;
  if (f.includes("trainieren") || f.includes("pausieren"))
    return `Dein Körperstatus liegt bei ${readiness.score} von 100 – Schlaf und Erholungswerte sind in deinem normalen Bereich. Volles Oberkörper-Training ist sinnvoll. Deine Beine sind vom Freitag noch belastet, also heute keine schwere Beinarbeit.`;
  if (f.includes("morgen"))
    return `Morgen steht Pull an: Klimmzüge, Rudern, Latzug, Facepulls, Bizeps. Rücken liegt diese Woche bei ${muskelStatus.ruecken.saetze} von ${muskelStatus.ruecken.ziel} Sätzen – 5 weitere Sätze sind gut investiert.`;
  if (f.includes("creatin") || f.includes("supplement"))
    return "Creatin Monohydrat ist gut untersucht und passt zu deinem Ziel: 3–5 g täglich, Timing ist nachrangig. Nahrungsergänzung ist ein Zusatz, keine Voraussetzung. Bei Vorerkrankungen bitte ärztlich abklären.";
  if (f.includes("fortschritt") || f.includes("fettabbau"))
    return "In 10 Wochen: −4,7 kg Gewicht, −6,2 cm Taille, Kraft +8 %. Das spricht für Fettabbau bei erhaltener Leistungsfähigkeit. Die aktuelle Kalorienvorgabe würde ich beibehalten.";
  return "Kurz zusammengefasst: Dein Trend passt zu deinem Ziel. Heute stehen noch offene Kalorien und Protein an – eine proteinreiche Hauptmahlzeit schließt beides gut ab. Ich bin kein Arzt und stelle keine Diagnosen.";
};

function CoachPage() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      rolle: "coach",
      text: `Hi ${profile.name}. Ich habe deine Woche angesehen: Training läuft, Protein hängt hinterher. Frag mich alles – oder nutze einen der Vorschläge unten.`,
    },
  ]);
  const [input, setInput] = useState("");

  function senden(text: string) {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { rolle: "user", text }, { rolle: "coach", text: antwort(text) }]);
    setInput("");
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">KI-Coach</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Dein Coach</h1>
      </header>

      <Section titel="Proaktive Empfehlungen">
        <div className="space-y-3">
          <Card className="border-primary/30">
            <p className="text-sm leading-relaxed">
              Du hast diese Woche bereits {muskelStatus.quadrizeps.saetze} von{" "}
              {muskelStatus.quadrizeps.ziel} Beinsätzen erreicht. Heute würde ich keine zusätzliche
              schwere Beinarbeit einplanen.
            </p>
            <Why
              punkte={[
                "Quadrizeps: hohe Belastung am Freitag",
                "Geschätzte Bereitschaft: 46 %",
                "Zusätzliche Sätze bringen bei erreichtem Wochenvolumen wenig Zusatznutzen",
              ]}
            />
          </Card>
          <Card className="border-info/30">
            <p className="text-sm leading-relaxed">
              Dein Protein liegt heute noch {heute.protein.ziel - heute.protein.ist} g unter deinem Ziel.
              Ich habe drei passende Abendessen vorbereitet.
            </p>
            <Link
              to="/ernaehrung"
              className="mt-3 inline-flex rounded-xl border border-border px-4 py-2 text-sm font-bold"
            >
              Vorschläge ansehen
            </Link>
          </Card>
          <Card>
            <p className="text-sm leading-relaxed">
              Du trainierst heute erst um 19:30 Uhr. Koffein kurz vor dem Training könnte deinen Schlaf
              beeinflussen – 100 mg statt 200 mg wären eine ruhigere Variante.
            </p>
          </Card>
        </div>
      </Section>

      <Section titel="Chat">
        <Card className="flex h-[26rem] flex-col p-0">
          <ul className="flex-1 space-y-4 overflow-y-auto p-5">
            {msgs.map((m, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className={
                    "grid h-8 w-8 shrink-0 place-items-center rounded-xl " +
                    (m.rolle === "coach" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground")
                  }
                >
                  {m.rolle === "coach" ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </span>
                <p className="min-w-0 whitespace-pre-line rounded-2xl bg-secondary/50 px-4 py-3 text-sm leading-relaxed">
                  {m.text}
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t border-border p-3">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {coachVorschlaege.map((v) => (
                <Chip key={v} onClick={() => senden(v)} className="shrink-0 whitespace-nowrap">
                  {v}
                </Chip>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                senden(input);
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Frage an deinen Coach …"
                className="min-w-0 flex-1 rounded-xl border border-input bg-secondary/40 px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"
                aria-label="Senden"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </Card>
        <Disclaimer>
          Der Coach nutzt ausschließlich die von dir freigegebenen Daten und stellt keine medizinischen
          Diagnosen. Bei Schmerzen, Verletzungen oder Erkrankungen wende dich an medizinisches Fachpersonal.
          Die Antworten in dieser Demo stammen aus vorbereiteten Beispiel-Regeln.
        </Disclaimer>
      </Section>
    </div>
  );
}
