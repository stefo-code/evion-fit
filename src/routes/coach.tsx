import { createFileRoute, Link as RLink } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Card, Chip, Disclaimer, Section, Why } from "@/components/ui-kit";
import { coachVorschlaege } from "@/lib/demo-data";
import { Loader2, Send, Sparkles, User } from "lucide-react";

import {
  koerperKennzahlen,
  readinessAusMessungen,
  recompSignal,
  tageSeitMessung,
  useAktivitaet,
  veraenderung,
} from "@/lib/activity-store";
import { effektivesProfil, useOnboardingProfil } from "@/lib/onboarding-store";
import { useErnaehrung } from "@/lib/nutrition-store";
import { usePlanEinstellungen } from "@/lib/training-plan";
import { baueCoachKontext } from "@/lib/coach-context";
import { coachAntwort } from "@/lib/coach.functions";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "KI-Coach – EVION" },
      {
        name: "description",
        content: "Proaktive Empfehlungen zu Training, Ernährung, Regeneration und Supplements.",
      },
      { property: "og:title", content: "KI-Coach – EVION" },
      { property: "og:description", content: "Ein Coach, der deine Daten kennt – und daraus Handlungen ableitet." },
    ],
  }),
  component: CoachPage,
});

type Msg = { rolle: "coach" | "user"; text: string };


/** Empfehlungen, die ausschließlich aus selbst erfassten Werten entstehen. */
function KoerperEmpfehlungen() {
  const { aktivitaet } = useAktivitaet();
  const { profil } = useOnboardingProfil();
  const eff = effektivesProfil(profil);
  const kennzahlen = koerperKennzahlen(aktivitaet, eff.groesse);
  const bereitschaft = readinessAusMessungen(aktivitaet);
  const recomp = recompSignal(aktivitaet);
  const gewicht30 = veraenderung(aktivitaet, "gewicht", 30);
  const tage = tageSeitMessung(aktivitaet);

  const karten: { ton: string; text: string; warum?: string[] }[] = [];

  if (tage === null) {
    karten.push({
      ton: "border-primary/40",
      text: "Trage deine erste Messung ein (Gewicht reicht). Ab dem zweiten Wert kann ich deinen Trend bewerten und Kalorien konkret anpassen.",
    });
  } else if (tage > 7) {
    karten.push({
      ton: "border-warning/40",
      text: `Deine letzte Messung ist ${tage} Tage her. Für belastbare Trends reicht ein Wert pro Woche – am besten morgens, nüchtern, nach dem Toilettengang.`,
    });
  }

  if (bereitschaft) {
    karten.push({
      ton: "border-info/30",
      text:
        bereitschaft.score >= 75
          ? `Deine Bereitschaft liegt bei ${bereitschaft.score}/100 – heute ist ein guter Tag für schwere Grundübungen und einen Steigerungsversuch.`
          : bereitschaft.score >= 55
            ? `Bereitschaft ${bereitschaft.score}/100: Training wie geplant, aber die letzten Sätze mit 1–2 Wiederholungen Reserve.`
            : `Bereitschaft ${bereitschaft.score}/100: Reduziere heute Volumen und Last um rund 30 % oder lege einen Erholungstag ein.`,
      warum: bereitschaft.gruende,
    });
  }

  if (gewicht30 !== null) {
    const ziel = eff.ziel;
    const text =
      ziel === "fettabbau"
        ? gewicht30 <= -0.4
          ? `Gewicht ${gewicht30.toLocaleString("de-DE")} kg in 30 Tagen – gutes Tempo. Kalorien beibehalten, Protein hoch.`
          : `Gewicht ${gewicht30 > 0 ? "+" : ""}${gewicht30.toLocaleString("de-DE")} kg in 30 Tagen. Wenn du abnehmen willst: rund 150–200 kcal weniger pro Tag oder 1.500 Schritte mehr.`
        : ziel === "muskelaufbau"
          ? gewicht30 >= 0.3
            ? `Gewicht +${gewicht30.toLocaleString("de-DE")} kg in 30 Tagen – solider Aufbau. Weiter progressiv steigern.`
            : `Gewicht ${gewicht30.toLocaleString("de-DE")} kg in 30 Tagen. Für Aufbau fehlen dir vermutlich 150–250 kcal pro Tag.`
          : `Gewicht ${gewicht30 > 0 ? "+" : ""}${gewicht30.toLocaleString("de-DE")} kg in 30 Tagen. Für Recomposition ist ein stabiles Gewicht bei sinkendem Körperfett das Ziel.`;
    karten.push({ ton: "border-primary/30", text });
  }

  if (recomp) {
    karten.push({
      ton: recomp.positiv ? "border-success/40" : "border-border",
      text: recomp.positiv
        ? `Fettmasse ${recomp.fett.toLocaleString("de-DE")} kg bei Magermasse ${recomp.mager > 0 ? "+" : ""}${recomp.mager.toLocaleString("de-DE")} kg – das ist genau der Verlauf, den wir sehen wollen.`
        : `Fettmasse ${recomp.fett > 0 ? "+" : ""}${recomp.fett.toLocaleString("de-DE")} kg, Magermasse ${recomp.mager > 0 ? "+" : ""}${recomp.mager.toLocaleString("de-DE")} kg. Erhöhe Protein auf etwa 2 g je kg Körpergewicht und halte die schweren Grundübungen.`,
    });
  }

  if (kennzahlen.gewicht !== null && kennzahlen.koerperfett === null) {
    karten.push({
      ton: "border-border",
      text: "Wenn deine Waage Körperfett, Wasser und Muskeln anzeigt: trage sie mit ein. Dann trenne ich Fett- und Magermasse statt nur Gewicht zu betrachten.",
    });
  }

  if (karten.length === 0) return null;

  return (
    <Section titel="Aus deinen Messwerten">
      <div className="space-y-3">
        {karten.map((k, i) => (
          <Card key={i} className={k.ton}>
            <p className="text-sm leading-relaxed">{k.text}</p>
            {k.warum && <Why punkte={k.warum} />}
          </Card>
        ))}
        <RLink to="/fortschritt" className="inline-flex text-xs font-bold uppercase tracking-wider text-primary">
          Messung eintragen
        </RLink>
      </div>
    </Section>
  );
}

function CoachPage() {
  const { aktivitaet } = useAktivitaet();
  const { daten: ernaehrung } = useErnaehrung();
  const { profil } = useOnboardingProfil();
  const { einstellungen: plan } = usePlanEinstellungen();
  const eff = effektivesProfil(profil);

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      rolle: "coach",
      text: `Hi ${eff.name}. Ich kenne deine Trainings, Körperwerte, Ernährung und Erholung aus der App. Frag mich konkret – zum Beispiel nach deinem Kaloriendefizit, deinem Trainingsvolumen oder was heute sinnvoll ist.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const liste = useRef<HTMLUListElement>(null);

  const kontext = useMemo(
    () => baueCoachKontext({ aktivitaet, ernaehrung, profil, plan }),
    [aktivitaet, ernaehrung, profil, plan],
  );

  async function senden(text: string) {
    const frage = text.trim();
    if (!frage || laedt) return;
    const verlauf: Msg[] = [...msgs, { rolle: "user", text: frage }];
    setMsgs(verlauf);
    setInput("");
    setFehler(null);
    setLaedt(true);
    requestAnimationFrame(() => liste.current?.scrollTo({ top: liste.current.scrollHeight }));
    try {
      const res = await coachAntwort({ data: { kontext, verlauf: verlauf.slice(1) } });
      setMsgs((m) => [...m, { rolle: "coach", text: res.text }]);
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Der Coach ist gerade nicht erreichbar.");
    } finally {
      setLaedt(false);
      requestAnimationFrame(() => liste.current?.scrollTo({ top: liste.current.scrollHeight }));
    }
  }


  return (
    <div className="space-y-8">
      <header>
        <p className="label-xs">KI-Coach</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Dein Coach</h1>
      </header>

      <KoerperEmpfehlungen />

      <Section titel="Chat mit deinem Coach">

        <Card className="flex h-[30rem] flex-col p-0">
          <ul ref={liste} className="flex-1 space-y-4 overflow-y-auto p-5">
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
                  {ohneMarkdown(m.text)}
                </p>

              </li>
            ))}
            {laedt && (
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
                Der Coach sieht sich deine Daten an …
              </li>
            )}
            {fehler && <li className="text-sm text-destructive">{fehler}</li>}
          </ul>
          <div className="border-t border-border p-3">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {coachVorschlaege.map((v) => (
                <Chip key={v} onClick={() => void senden(v)} className="shrink-0 whitespace-nowrap">
                  {v}
                </Chip>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void senden(input);
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
                disabled={laedt || !input.trim()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
                aria-label="Senden"
              >
                {laedt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </Card>
        <Disclaimer>
          Der Coach wertet die von dir in EVION erfassten Daten aus und stellt keine medizinischen
          Diagnosen. Bei Schmerzen, Verletzungen oder Erkrankungen wende dich an medizinisches Fachpersonal.
        </Disclaimer>
      </Section>

    </div>
  );
}
