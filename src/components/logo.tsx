import { cn } from "@/lib/utils";

export function EvionLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <svg
        viewBox="0 0 26 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-6 shrink-0 text-primary"
        aria-label="EVION"
      >
        {/* E as three horizontal bars */}
        <rect x="0" y="1" width="26" height="4" rx="2" fill="currentColor" />
        <rect x="0" y="8" width="26" height="4" rx="2" fill="currentColor" />
        <rect x="0" y="15" width="26" height="4" rx="2" fill="currentColor" />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight text-foreground">VION</span>
    </div>
  );
}
