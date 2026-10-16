import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Apple,
  Dumbbell,
  Home,
  LineChart,
  Moon,
  Plus,
  Scale,
  Settings,
  Shield,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { EvionLogo } from "@/components/logo";
import { MessungForm } from "@/components/messung-form";
import { Button } from "@/components/ui/button";
import { ladeProfil } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";

const main = [
  { to: "/", label: "Home", kurz: "Home", icon: Home },
  { to: "/training", label: "Training", kurz: "Training", icon: Dumbbell },
  { to: "/ernaehrung", label: "Essen", kurz: "Essen", icon: Apple },
  { to: "/fortschritt", label: "Verlauf", kurz: "Verlauf", icon: LineChart },
  { to: "/coach", label: "Coach", kurz: "Coach", icon: Sparkles },
] as const;


const secondary = [
  { to: "/profil", label: "Dein Profil", icon: User },
  { to: "/einstellungen", label: "Einstellungen", icon: Settings },
  { to: "/datenschutz", label: "Datenschutz", icon: Shield },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [eintragenOffen, setEintragenOffen] = useState(false);
  const [messungOffen, setMessungOffen] = useState(false);

  // Erststart: Onboarding automatisch öffnen (kein Menüpunkt).
  useEffect(() => {
    if (pathname.startsWith("/onboarding") || pathname.startsWith("/auth")) return;
    if (!ladeProfil().abgeschlossen) navigate({ to: "/onboarding" });
  }, [pathname, navigate]);

  useEffect(() => {
    setEintragenOffen(false);
    setMessungOffen(false);
  }, [pathname]);

  if (pathname.startsWith("/onboarding")) return <>{children}</>;

  return (
    <div className="min-h-screen w-full">
      {/* Desktop-Seitennavigation */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
        <Link to="/" className="mb-8 flex items-center px-2">
          <EvionLogo />
        </Link>
        <nav className="space-y-1">
          {main.map((i) => (
            <NavItem key={i.to} to={i.to} label={i.label} icon={i.icon} active={isActive(pathname, i.to)} />
          ))}

        </nav>
        <nav aria-label="Verwaltung" className="mt-8 space-y-1 border-t border-border pt-4">
          {secondary.map((i) => (
            <NavItem key={i.to} {...i} active={isActive(pathname, i.to)} />
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-border bg-secondary/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
          Ohne Sync bleiben deine Daten auf diesem Gerät. Keine medizinische Beratung.
        </div>
      </aside>

      {/* Mobile Kopfzeile */}
      <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="flex min-w-0 items-center">
          <EvionLogo className="h-6" />
        </Link>
        <Link
          to="/profil"
          aria-label="Dein Profil"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/12 text-primary"
        >
          <User className="h-4.5 w-4.5" />
        </Link>
      </header>

      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-3xl px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:pb-20">{children}</main>
      </div>

      {/* Mobile Tab-Bar */}
      {pathname !== "/training/workout" && (
      <nav aria-label="Hauptnavigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {main.map((i) => {
            const active = isActive(pathname, i.to);
            return (
              <li key={i.to} className="min-w-0">
                <Link
                  to={i.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-2 text-[11px] font-semibold transition-colors sm:text-xs",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <i.icon className="h-6 w-6 shrink-0" />
                  <span className="whitespace-nowrap text-center">{i.kurz}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      )}

      {/* Globaler „+ Eintragen“-Einstieg */}
      {!pathname.startsWith("/training") && <Button
        onClick={() => setEintragenOffen(true)}
        aria-label="Werte eintragen"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 h-12 rounded-full px-4 text-sm font-extrabold shadow-lg lg:bottom-6 lg:right-6 [&_svg]:size-5"
      >
        <Plus className="h-5 w-5" />
        <span>Eintragen</span>
      </Button>}

      {eintragenOffen && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Schließen"
            onClick={() => setEintragenOffen(false)}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 pb-8 animate-in slide-in-from-bottom">
            <div className="flex items-center">
              <p className="font-display text-base font-extrabold">Was möchtest du eintragen?</p>
              <button
                onClick={() => setEintragenOffen(false)}
                aria-label="Schließen"
                className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {messungOffen ? (
              <div className="mt-4">
                <MessungForm onGespeichert={() => setEintragenOffen(false)} />
              </div>
            ) : (
              <nav className="mt-4 space-y-2">
                <button
                  onClick={() => setMessungOffen(true)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left text-sm font-semibold"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                    <Scale className="h-4.5 w-4.5" />
                  </span>
                  Gewicht &amp; Umfänge
                </button>
                <button
                  onClick={() => setMessungOffen(true)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left text-sm font-semibold"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                    <Moon className="h-4.5 w-4.5" />
                  </span>
                  Schlaf &amp; Erholung
                </button>
                <Link
                  to="/ernaehrung"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                    <Apple className="h-4.5 w-4.5" />
                  </span>
                  Mahlzeit
                </Link>
                <Link
                  to="/training"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                    <Dumbbell className="h-4.5 w-4.5" />
                  </span>
                  Training
                </Link>
              </nav>
            )}
          </div>
        </div>
      )}




    </div>
  );
}

function isActive(pathname: string, to: string) {
  if (to === "/ernaehrung" && pathname === "/supplements") return true;
  if (to === "/fortschritt" && pathname === "/erfolge") return true;
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
