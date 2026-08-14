import { Layers } from "lucide-react";
import clsx from "clsx";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-lg bg-accent text-white"
      style={{ width: size, height: size }}
    >
      <Layers size={size * 0.55} strokeWidth={2.25} />
    </span>
  );
}

export function Logo({ markSize = 32, className }: { markSize?: number; className?: string }) {
  return (
    <span className={clsx("flex items-center gap-2", className)}>
      <LogoMark size={markSize} />
      <span className="text-lg font-bold tracking-tight text-gray-900">DocDeck</span>
    </span>
  );
}
