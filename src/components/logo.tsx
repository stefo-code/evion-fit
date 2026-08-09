import { cn } from "@/lib/utils";

export function EvionLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-9 w-9 shrink-0"
        aria-label="EVION Logo"
      >
        <rect width="40" height="40" rx="10" fill="hsl(var(--primary))" />
        <g fill="hsl(var(--primary-foreground))">
          {/* Vertical spine of the E */}
          <rect x="10" y="9" width="5" height="22" rx="1.5" />
          {/* Three horizontal bars of the E */}
          <rect x="16" y="9" width="14" height="5" rx="1.5" />
          <rect x="16" y="17.5" width="11" height="5" rx="1.5" />
          <rect x="16" y="26" width="14" height="5" rx="1.5" />
        </g>
      </svg>
      <span className="font-display text-lg font-bold tracking-tight">
        <span className="sr-only">E</span>
        <span aria-hidden="true" className="text-foreground">VION</span>
      </span>
    </div>
  );
}
