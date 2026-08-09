import { cn } from "@/lib/utils";
import logoAsset from "@/assets/evion-logo.png.asset.json";

export function EvionLogo({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="EVION"
      className={cn("h-7 w-auto shrink-0 object-contain", className)}
    />
  );
}
