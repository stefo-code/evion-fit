import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HardDriveDownload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { letztesBackup } from "@/lib/privatsphaere";

/** Dezenter Hinweis, wenn das letzte Backup älter als 30 Tage ist und kein Sync aktiv ist. */
export function BackupHinweis() {
  const { session, laedt } = useAuth();
  const [alt, setAlt] = useState(false);
  useEffect(() => {
    const l = letztesBackup();
    const hatDaten = Object.keys(localStorage).some((k) => k === "evion.aktivitaet.v1" || k === "evion.ernaehrung.v1");
    setAlt(hatDaten && (!l || Date.now() - new Date(l).getTime() > 30 * 86400000));
  }, []);
  if (laedt || session || !alt) return null;
  return (
    <Link to="/profil" className="flex items-center gap-2 text-xs text-muted-foreground">
      <HardDriveDownload className="h-4 w-4 shrink-0" />
      Letztes Backup älter als 30 Tage · <span className="font-semibold text-primary">Sync & Backup</span>
    </Link>
  );
}
