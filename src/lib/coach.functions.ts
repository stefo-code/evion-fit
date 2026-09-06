import { createServerFn } from "@tanstack/react-start";
import { frageCoach, type CoachNachricht } from "./coach.server";

export const coachAntwort = createServerFn({ method: "POST" })
  .inputValidator((data: { kontext: string; verlauf: CoachNachricht[] }) => {
    if (!data || typeof data.kontext !== "string") throw new Error("Ungültige Anfrage.");
    if (!Array.isArray(data.verlauf) || data.verlauf.length === 0) throw new Error("Keine Frage übermittelt.");
    return {
      kontext: data.kontext.slice(0, 20000),
      verlauf: data.verlauf.slice(-16).map((m) => ({
        rolle: m.rolle === "coach" ? ("coach" as const) : ("user" as const),
        text: String(m.text).slice(0, 4000),
      })),
    };
  })
  .handler(async ({ data }) => ({ text: await frageCoach(data) }));
