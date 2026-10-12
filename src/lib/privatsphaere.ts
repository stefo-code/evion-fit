/**
 * Datensparsamkeit, KI-Einwilligung und lokales Backup (alle evion.*-Keys).
 */
import { useEffect, useState } from "react";

const KI_KEY = "evion.ki.einwilligung.v1";
const KI_EVENT = "evion:ki-einwilligung";
const BACKUP_META = "evion.backup.zuletzt.v1";
const SYNC_META = "evion.sync.zuletzt.v1";

/* ---------- Spitzname ---------- */
export function pruefeSpitzname(v: string): string | null {
  if (v.length > 20) return "Maximal 20 Zeichen.";
  if (/\S+@\S+\.\S+/.test(v) || v.includes("@")) return "Bitte keine E-Mail-Adresse verwenden.";
  return null;
}

/* ---------- Altersgruppe / Rundung ---------- */
export function altersgruppe(alter: number | null | undefined): string {
  if (!alter) return "—";
  const a = Math.floor(alter / 5) * 5;
  return `${a}–${a + 4}`;
}
export const rund = (v: number | null | undefined, schritt = 1) =>
  v === null || v === undefined ? null : Math.round(v / schritt) * schritt;

/* ---------- KI-Einwilligung ---------- */
export type KiStatus = "ja" | "nein" | null;
export function kiStatus(): KiStatus {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KI_KEY);
  return v === "ja" || v === "nein" ? v : null;
}
export function setzeKiStatus(s: KiStatus) {
  if (s) localStorage.setItem(KI_KEY, s);
  else localStorage.removeItem(KI_KEY);
  window.dispatchEvent(new Event(KI_EVENT));
}
export function useKiStatus() {
  const [s, setS] = useState<KiStatus>(null);
  useEffect(() => {
    const f = () => setS(kiStatus());
    f();
    window.addEventListener(KI_EVENT, f);
    window.addEventListener("storage", f);
    return () => {
      window.removeEventListener(KI_EVENT, f);
      window.removeEventListener("storage", f);
    };
  }, []);
  return s;
}

let anfrageResolver: ((ok: boolean) => void) | null = null;
export const KI_ANFRAGE_EVENT = "evion:ki-anfrage";
/** Prüft die Einwilligung; fragt beim ersten Mal per Dialog nach. */
export function fordereKi(): Promise<boolean> {
  const s = kiStatus();
  if (s === "ja") return Promise.resolve(true);
  if (s === "nein") return Promise.resolve(false);
  return new Promise((resolve) => {
    anfrageResolver = resolve;
    window.dispatchEvent(new Event(KI_ANFRAGE_EVENT));
  });
}
export function beantworteKi(ok: boolean) {
  setzeKiStatus(ok ? "ja" : "nein");
  anfrageResolver?.(ok);
  anfrageResolver = null;
}

/* ---------- Backup ---------- */
export type Backup = { app: "EVION"; version: 1; erstellt: string; daten: Record<string, unknown> };

const istMeta = (k: string) => k === BACKUP_META || k === SYNC_META;

export function sammleDaten(): Record<string, unknown> {
  const daten: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith("evion.") || istMeta(k)) continue;
    const roh = localStorage.getItem(k);
    try {
      daten[k] = roh === null ? null : JSON.parse(roh);
    } catch {
      daten[k] = roh;
    }
  }
  return daten;
}

export function erstelleBackup(): Backup {
  return { app: "EVION", version: 1, erstellt: new Date().toISOString(), daten: sammleDaten() };
}

export function ladeBackupHerunter() {
  const b = erstelleBackup();
  const blob = new Blob([JSON.stringify(b, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `evion-backup-${b.erstellt.slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  localStorage.setItem(BACKUP_META, b.erstellt);
}

export function letztesBackup(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(BACKUP_META);
}
export function letzterSync(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(SYNC_META);
}
export function merkeSync() {
  localStorage.setItem(SYNC_META, new Date().toISOString());
}

export function leseBackup(text: string): Backup {
  const b = JSON.parse(text) as Backup;
  if (!b || b.app !== "EVION" || typeof b.daten !== "object") throw new Error("Keine gültige EVION-Backup-Datei.");
  for (const k of Object.keys(b.daten)) if (!k.startsWith("evion.")) delete b.daten[k];
  return b;
}

export type BackupVorschau = { trainings: number; messungen: number; mahlzeiten: number; von: string | null; bis: string | null };

export function vorschau(b: Backup): BackupVorschau {
  const akt = (b.daten["evion.aktivitaet.v1"] ?? {}) as { einheiten?: { datum?: string }[]; messungen?: { datum?: string }[] };
  const ern = (b.daten["evion.ernaehrung.v1"] ?? {}) as { mahlzeiten?: { datum?: string; zeit?: string }[] };
  const daten = [
    ...(akt.einheiten ?? []).map((e) => e.datum),
    ...(akt.messungen ?? []).map((e) => e.datum),
    ...(ern.mahlzeiten ?? []).map((e) => e.datum ?? e.zeit),
  ]
    .filter((d): d is string => typeof d === "string")
    .map((d) => d.slice(0, 10))
    .sort();
  return {
    trainings: akt.einheiten?.length ?? 0,
    messungen: akt.messungen?.length ?? 0,
    mahlzeiten: ern.mahlzeiten?.length ?? 0,
    von: daten[0] ?? null,
    bis: daten[daten.length - 1] ?? null,
  };
}

function fuehreZusammen(lokal: unknown, neu: unknown): unknown {
  if (Array.isArray(lokal) && Array.isArray(neu)) {
    const schluessel = (x: unknown) =>
      x && typeof x === "object" && "id" in x ? `id:${String((x as { id: unknown }).id)}` : `j:${JSON.stringify(x)}`;
    const gesehen = new Set(lokal.map(schluessel));
    return [...lokal, ...neu.filter((x) => !gesehen.has(schluessel(x)))];
  }
  if (lokal && neu && typeof lokal === "object" && typeof neu === "object" && !Array.isArray(lokal) && !Array.isArray(neu)) {
    const out: Record<string, unknown> = { ...(neu as Record<string, unknown>) };
    for (const [k, v] of Object.entries(lokal as Record<string, unknown>)) {
      out[k] = k in out ? fuehreZusammen(v, out[k]) : v;
    }
    return out;
  }
  return lokal ?? neu;
}

export function stelleWiederHer(b: Backup, modus: "zusammenfuehren" | "ersetzen") {
  const lokal = sammleDaten();
  if (modus === "ersetzen") for (const k of Object.keys(lokal)) localStorage.removeItem(k);
  for (const [k, v] of Object.entries(b.daten)) {
    const wert = modus === "ersetzen" || !(k in lokal) ? v : fuehreZusammen(lokal[k], v);
    localStorage.setItem(k, typeof wert === "string" ? wert : JSON.stringify(wert));
  }
}

export function loescheLokaleDaten() {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("evion.")) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
