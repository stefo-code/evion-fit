import { Link, useRouterState } from "@tanstack/react-router";
import {
  Apple,
  Dumbbell,
  Home,
  LineChart,
  Pill,
  Settings,
  Shield,
  Sparkles,
  Watch,
} from "lucide-react";
import type { ReactNode } from "react";
import { EvionLogo } from "@/components/logo";
import { cn } from "@/lib/utils";

const main = [
  { to: "/", label: "Home", icon: Home },
  { to: "/training", label: "Training", icon: Dumbbell },
  { to: "/ernaehrung", label: "Ernährung", icon: Apple },
  { to: "/fortschritt", label: "Fortschritt", icon: LineChart },
  { to: "/coach", label: "Coach", icon: Sparkles },
] as const;

const secondary = [
  { to: "/supplements", label: "Supplements", icon: Pill },
  { to: "/geraete", label: "Geräte", icon: Watch },
  { to: "/einstellungen", label: "Einstellungen", icon: Settings },
  { to: "/datenschutz", label: "Datenschutz", icon: Shield },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
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

      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:px-6 lg:pb-14">{children}</main>
      </div>

      {/* Mobile Tab-Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-sidebar/95 backdrop-blur lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {main.map((i) => {
            const active = isActive(pathname, i.to);
            return (
              <li key={i.to}>
                <Link
                  to={i.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <i.icon className="h-5 w-5" />
                  {i.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
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
