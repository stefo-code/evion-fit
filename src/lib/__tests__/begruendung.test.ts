import { test } from "vitest";
import { baueVorlagen, type PlanEinstellungen } from "@/lib/training-plan";

const kontext: any = {
  ziel: "muskelaufbau",
  geschlecht: "maennlich",
  alter: 34,
  erfahrung: "Fortgeschritten",
  equipment: ["maschine", "kabel", "kurzhantel"],
  tage: 3,
  dauer: 45,
  fokus: "muskelaufbau",
};

const eigen = {
  id: "eigen-123",
  name: "Rudern am Seilzug einarmig",
  muskel: "Rücken",
  muster: "ziehen" as const,
  equipment: ["kabel" as const],
  grund: false,
  zielSaetze: 4,
  wdhBereich: "10–12",
  startGewicht: 0,
  hinweis: "",
  rueckenschonend: true,
  rueckbildung: false,
  einsteiger: true,
};

const e: PlanEinstellungen = {
  fokus: "muskelaufbau",
  tausch: {},
  entfernt: {},
  zusatz: { "0": [eigen.id, "latzug"] },
  reihenfolge: {},
  eigene: [eigen],
  trainingstage: null,
  vorlagen: [],
  titel: {},
  zuordnung: {},
  pauseSek: 60,
};

test("begruendung", async () => {
  const vorlagen = baueVorlagen(kontext, e);
  for (const u of vorlagen[0]!.uebungen) {
    console.log(u.name, "→", u.begruendung);
  }
});
