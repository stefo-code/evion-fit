import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Apple,
  Dumbbell,
  Home,
  LineChart,
  MoreHorizontal,
  Pill,
  Settings,
  Shield,
  Sparkles,
  User,
  Watch,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { EvionLogo } from "@/components/logo";
import { ladeProfil } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";

const main = [
  { to: "/", label: "Home", kurz: "Home", icon: Home },
  { to: "/training", label: "Training", kurz: "Training", icon: Dumbbell },
  { to: "/ernaehrung", label: "Ernährung", kurz: "Essen", icon: Apple },
  { to: "/fortschritt", label: "Fortschritt", kurz: "Verlauf", icon: LineChart },
  { to: "/coach", label: "Coach", kurz: "Coach", icon: Sparkles },
] as const;


const secondary = [
  { to: "/profil", label: "Dein Profil", icon: User },
  { to: "/supplements", label: "Supplements", icon: Pill },
  { to: "/geraete", label: "Geräte", icon: Watch },
  { to: "/einstellungen", label: "Einstellungen", icon: Settings },
  { to: "/datenschutz", label: "Datenschutz", icon: Shield },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [mehrOffen, setMehrOffen] = useState(false);

  // Erststart: Onboarding automatisch öffnen (kein Menüpunkt).
  useEffect(() => {
    if (pathname.startsWith("/onboarding") || pathname.startsWith("/auth")) return;
    if (!ladeProfil().abgeschlossen) navigate({ to: "/onboarding" });
  }, [pathname, navigate]);

  useEffect(() => setMehrOffen(false), [pathname]);

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
            <NavItem key={i.to} {...i} active={isActive(pathname, i.to)} />
          ))}
        </nav>
        <p className="label-xs mt-8 px-3">Mehr</p>
        <nav className="mt-2 space-y-1">
          {secondary.map((i) => (
            <NavItem key={i.to} {...i} active={isActive(pathname, i.to)} />
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-border bg-secondary/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
          Demo-Profil mit Beispieldaten. Keine medizinische Beratung.
        </div>
      </aside>

      {/* Mobile Kopfzeile */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="flex items-center">
          <EvionLogo className="h-6" />
        </Link>
        <Link
          to="/profil"
          aria-label="Dein Profil"
          className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-primary/12 text-primary"
        >
          <User className="h-4.5 w-4.5" />
        </Link>
      </header>

      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:px-6 lg:pb-14">{children}</main>
      </div>

      {/* Mobile Tab-Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-sidebar/95 backdrop-blur lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-6">
          {main.map((i) => {
            const active = isActive(pathname, i.to);
            return (
              <li key={i.to} className="min-w-0">
                <Link
                  to={i.to}
                  className={cn(
                    "flex flex-col items-center gap-1 px-0.5 py-2.5 text-[9px] font-bold uppercase tracking-tight transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <i.icon className="h-5 w-5 shrink-0" />
                  <span className="w-full truncate text-center">{i.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="min-w-0">
            <button
              onClick={() => setMehrOffen(true)}
              className="flex w-full flex-col items-center gap-1 px-0.5 py-2.5 text-[9px] font-bold uppercase tracking-tight text-muted-foreground"
            >
              <MoreHorizontal className="h-5 w-5 shrink-0" />
              <span className="w-full truncate text-center">Mehr</span>
            </button>
          </li>
        </ul>
      </nav>


      {/* Mobile „Mehr“-Sheet */}
      {mehrOffen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Schließen"
            onClick={() => setMehrOffen(false)}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border bg-card p-5 pb-8 animate-in slide-in-from-bottom">
            <div className="flex items-center">
              <p className="label-xs">Mehr</p>
              <button
                onClick={() => setMehrOffen(false)}
                aria-label="Schließen"
                className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="mt-4 space-y-2">
              {secondary.map((i) => (
                <Link
                  key={i.to}
                  to={i.to}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                    <i.icon className="h-4.5 w-4.5" />
                  </span>
                  {i.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

function isActive(pathname: string, to: string) {
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
