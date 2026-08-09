import { cn } from "@/lib/utils";

export function EvionLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <svg
        viewBox="0 0 32 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-8 shrink-0"
        aria-label="EVION"
      >
        {/* E as three horizontal bars */}
        <rect x="0" y="2" width="28" height="4.5" rx="2.25" fill="hsl(var(--primary))" />
        <rect x="0" y="9.75" width="28" height="4.5" rx="2.25" fill="hsl(var(--primary))" />
        <rect x="0" y="17.5" width="28" height="4.5" rx="2.25" fill="hsl(var(--primary))" />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight text-foreground">VION</span>
    </div>
  );
}
