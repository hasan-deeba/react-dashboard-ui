import { cn } from "@/utils/cn";

const PALETTES = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-cyan-500 to-sky-600",
];

/** Deterministic gradient avatar built from the person's initials. */
export function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const hash = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const palette = PALETTES[hash % PALETTES.length];

  return (
    <div
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold text-white",
        palette,
        className,
      )}
    >
      {initials}
    </div>
  );
}
