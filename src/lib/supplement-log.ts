/** Tägliches Abhaken von Supplements (lokal). */
import { useCallback, useEffect, useState } from "react";

const LOG_KEY = "evion.supplements.log.v1";
const BESITZ_KEY = "evion.supplements.besitz.v1";
const EVENT = "evion-supp-log";

export type SuppLog = Record<string, Record<string, true>>;

export const KOFFEIN_IDS = ["koffein", "gruentee"];
export const SHAKE_IDS = ["whey", "mehrkomponenten", "veganprotein"];

export function datumKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${String(d.getDate()).padStart(2, "0")}`;
}

function lese<T>(key: string, fallback: T): T {
  try {
    const r = localStorage.getItem(key);
    return r ? (JSON.parse(r) as T) : fallback;
  } catch {
    return fallback;
  }
}

function schreibe(key: string, wert: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(wert));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignorieren */
  }
}

export function schreibeBesitzListe(ids: string[]) {
  schreibe(BESITZ_KEY, Array.from(new Set(ids)));
}

export function useSuppLog() {
  const [log, setLog] = useState<SuppLog>({});
  const [besitz, setBesitz] = useState<string[]>([]);

  useEffect(() => {
    const laden = () => {
      setLog(lese<SuppLog>(LOG_KEY, {}));
      setBesitz(lese<string[]>(BESITZ_KEY, []));
    };
    laden();
    window.addEventListener(EVENT, laden);
    window.addEventListener("storage", laden);
    return () => {
      window.removeEventListener(EVENT, laden);
      window.removeEventListener("storage", laden);
    };
  }, []);

  const heute = datumKey();
  const genommen = useCallback((id: string, tag = heute) => !!log[tag]?.[id], [log, heute]);

  const setzeGenommen = useCallback((id: string, wert: boolean) => {
    const l = lese<SuppLog>(LOG_KEY, {});
    const t = datumKey();
    const tag = { ...(l[t] ?? {}) };
    if (wert) tag[id] = true;
    else delete tag[id];
    schreibe(LOG_KEY, { ...l, [t]: tag });
  }, []);

  const schalteBesitz = useCallback((id: string) => {
    const b = lese<string[]>(BESITZ_KEY, []);
    schreibe(BESITZ_KEY, b.includes(id) ? b.filter((x) => x !== id) : [...b, id]);
  }, []);

  /** Aufeinanderfolgende Tage mit Einnahme (heute zählt, wenn bereits abgehakt). */
  const serie = useCallback(
    (id: string) => {
      const d = new Date();
      if (!log[datumKey(d)]?.[id]) d.setDate(d.getDate() - 1);
      let n = 0;
      while (log[datumKey(d)]?.[id]) {
        n++;
        d.setDate(d.getDate() - 1);
      }
      return n;
    },
    [log],
  );

  const letzte7 = useCallback(
    (id: string) =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { tag: d, genommen: !!log[datumKey(d)]?.[id] };
      }),
    [log],
  );

  return { log, besitz, genommen, setzeGenommen, schalteBesitz, serie, letzte7 };
}
