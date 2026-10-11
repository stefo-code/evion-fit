import { createServerFn } from "@tanstack/react-start";
import { erstelleKiPlan, type KiPlanAnfrage } from "./ki-plan.server";

const s = (v: unknown, n = 500) => String(v ?? "").slice(0, n);

export const kiPlanErstellen = createServerFn({ method: "POST" })
  .inputValidator((d: KiPlanAnfrage): KiPlanAnfrage => {
    if (!d || !d.formular || !Array.isArray(d.uebungen)) throw new Error("Ungültige Anfrage.");
    const f = d.formular;
    return {
      profil: s(d.profil, 4000),
      formular: {
        ziel: s(f.ziel, 200),
        tage: Math.max(1, Math.min(7, Math.round(Number(f.tage) || 3))),
        dauer: Math.max(15, Math.min(180, Math.round(Number(f.dauer) || 45))),
        fokus: s(f.fokus, 200),
        einschraenkungen: s(f.einschraenkungen),
        nichtMag: s(f.nichtMag),
        equipment: (Array.isArray(f.equipment) ? f.equipment : []).slice(0, 20).map((x) => s(x, 40)),
        freitext: s(f.freitext, 1500),
      },
      uebungen: d.uebungen.slice(0, 300).map((u) => ({
        id: s(u.id, 80),
        name: s(u.name, 120),
        muskel: s(u.muskel, 80),
        equipment: (Array.isArray(u.equipment) ? u.equipment : []).slice(0, 8).map((x) => s(x, 30)),
      })),
    };
  })
  .handler(async ({ data }) => ({ templates: await erstelleKiPlan(data) }));
