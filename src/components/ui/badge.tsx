import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-gold",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border hover:bg-muted",
        success: "border-transparent bg-success text-success-foreground",
        premium: "border-transparent bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-gold",
      },
      tone: {
        none: "",
        // Solid tones
        success: "border-transparent bg-success text-success-foreground hover:bg-success/90",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/90",
        info: "border-transparent bg-info text-info-foreground hover:bg-info/90",
        danger: "border-transparent bg-danger text-danger-foreground hover:bg-danger/90",
        neutral: "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
        // Soft (low-emphasis) tones — preferred for table chips, statuses
        "success-soft": "border-transparent bg-success-soft text-success-soft-foreground hover:bg-success-soft/80",
        "warning-soft": "border-transparent bg-warning-soft text-warning-soft-foreground hover:bg-warning-soft/80",
        "info-soft": "border-transparent bg-info-soft text-info-soft-foreground hover:bg-info-soft/80",
        "danger-soft": "border-transparent bg-danger-soft text-danger-soft-foreground hover:bg-danger-soft/80",
        "neutral-soft": "border-transparent bg-muted text-foreground hover:bg-muted/80",
      },
    },
    defaultVariants: {
      variant: "default",
      tone: "none",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, tone, ...props }, ref) => {
    // When a tone is provided, it takes precedence over variant styling.
    const resolvedVariant = tone && tone !== "none" ? undefined : variant;
    return <div ref={ref} className={cn(badgeVariants({ variant: resolvedVariant, tone }), className)} {...props} />;
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
