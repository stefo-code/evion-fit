import { cn } from "@/lib/utils";

export function EvionLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-[3px]", className)}>
      <svg
        viewBox="0 0 22 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[22px] w-[26px] shrink-0 text-foreground"
        aria-label="EVION"
      >
        {/* E as three horizontal bars */}
        <rect x="0" y="0" width="22" height="4" rx="1" fill="currentColor" />
        <rect x="0" y="7" width="22" height="4" rx="1" fill="currentColor" />
        <rect x="0" y="14" width="22" height="4" rx="1" fill="currentColor" />
      </svg>
      <span className="font-display text-[22px] font-bold leading-none tracking-tight text-foreground">VION</span>
    </div>
  );
}
