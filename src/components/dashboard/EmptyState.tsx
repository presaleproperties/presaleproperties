import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "card" | "dashed" | "plain";
  className?: string;
}

/**
 * Unified empty state used across all dashboard pages so loading→empty
 * transitions feel consistent. Use `dashed` for in-section emptiness
 * (template list, filter results) and `card` for whole-page emptiness.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "dashed",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-12 sm:py-16",
        variant === "card" && "rounded-xl border border-border bg-card",
        variant === "dashed" && "rounded-xl border-2 border-dashed border-border/70",
        variant === "plain" && "",
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center">
          <Icon className="h-6 w-6 text-muted-foreground/50" />
        </div>
      )}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
