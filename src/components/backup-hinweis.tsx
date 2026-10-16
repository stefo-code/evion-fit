import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HardDriveDownload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { letztesBackup } from "@/lib/privatsphaere";

/** Ältestes Datum der lokal gespeicherten Daten (Messungen/Einheiten) oder null. */
function aeltesterEintrag(): number | null {
  try {
    const roh = localStorage.getItem("evion.aktivitaet.v1");
    if (!roh) return null;
    const a = JSON.parse(roh) as { messungen?: { datum?: string }[]; einheiten?: { datum?: string }[] };
    const zeiten = [...(a.messungen ?? []), ...(a.einheiten ?? [])]
      .map((x) => (x.datum ? new Date(x.datum).getTime() : NaN))
      .filter((t) => Number.isFinite(t));
    return zeiten.length > 0 ? Math.min(...zeiten) : null;
  } catch {
    return null;
  }
}

/** Dezenter Hinweis, wenn seit mehr als 30 Tagen Daten vorhanden sind, das letzte Backup älter als
 *  30 Tage ist (oder fehlt) und kein Sync aktiv ist. Neue Nutzer sehen ihn nicht. */
export function BackupHinweis() {
  const { session, laedt } = useAuth();
  const [alt, setAlt] = useState(false);
  useEffect(() => {
    const l = letztesBackup();
    const monat = 30 * 86400000;
    const seit = aeltesterEintrag();
    const datenAlt = seit !== null && Date.now() - seit > monat;
    setAlt(datenAlt && (!l || Date.now() - new Date(l).getTime() > monat));
  }, []);
  if (laedt || session || !alt) return null;
  return (
    <Link to="/profil" className="flex items-center gap-2 px-5 py-4 text-xs text-muted-foreground">
      <HardDriveDownload className="h-4 w-4 shrink-0" />
      Letztes Backup älter als 30 Tage · <span className="font-semibold text-primary">Sync & Backup</span>
    </Link>
  );
}
