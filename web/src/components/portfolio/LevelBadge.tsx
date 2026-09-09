import { LEVEL_LABELS, LEVEL_BADGE_CLASSES, LEVEL_DESCRIPTIONS } from "@/utils/constants";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level?: number | null;
  size?: "sm" | "md";
  className?: string;
}

export default function LevelBadge({ level, size = "md", className }: LevelBadgeProps) {
  if (level == null) {
    return (
      <div
        className={cn(
          "inline-flex flex-col items-center justify-center rounded font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 shadow-xs",
          size === "md" ? "px-2.5 py-1.5 min-w-14 text-xs" : "px-2 py-0.5 min-w-10 text-[11px]",
          className
        )}
      >
        <span>N/A</span>
        {size === "md" && (
          <span className="text-[10px] font-normal opacity-75">Unassessed</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center justify-center rounded font-semibold shadow-xs transition-colors",
        size === "md" ? "px-3 py-2 min-w-14 text-base" : "px-2 py-1 min-w-10 text-sm",
        LEVEL_BADGE_CLASSES[level] || "bg-neutral-200 text-neutral-700",
        className
      )}
    >
      <span>{LEVEL_LABELS[level] || `L${level}`}</span>
      {size === "md" && (
        <span className="text-[10px] font-normal opacity-75">{LEVEL_DESCRIPTIONS[level] || ""}</span>
      )}
    </div>
  );
}
