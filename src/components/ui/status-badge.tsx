import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { resolveStatus, type StatusTone } from "@/lib/status";

export interface StatusBadgeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Raw status string (e.g. "pending", "approved", "sold_out"). Resolved via the shared registry. */
  status: string | null | undefined;
  /** Optional override of the tone resolved from the registry. */
  tone?: StatusTone;
  /** Optional override of the label resolved from the registry. */
  label?: React.ReactNode;
  /** Optional leading icon. */
  icon?: React.ReactNode;
}

/**
 * Sitewide status pill. Always prefer this over hand-rolled
 * `<Badge className="bg-success-soft ...">` so colors stay consistent.
 */
export const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, tone, label, icon, className, ...rest }, ref) => {
    const resolved = resolveStatus(status);
    const finalTone = tone ?? resolved.tone;
    const finalLabel = label ?? resolved.label;

    return (
      <Badge ref={ref} tone={finalTone} className={cn("gap-1", className)} {...rest}>
        {icon}
        {finalLabel}
      </Badge>
    );
  }
);
StatusBadge.displayName = "StatusBadge";
