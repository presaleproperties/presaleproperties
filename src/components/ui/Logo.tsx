import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  asLink?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, asLink = true, onClick, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-xs leading-[0.9]",
    md: "text-sm leading-[0.9]",
    lg: "text-base leading-[0.9]",
  };

  const logoContent = (
    <span className={cn("font-bold tracking-tight flex flex-col", sizeClasses[size], className)}>
      <span>
        <span className="text-primary">P</span>
        <span>resale</span>
        <span className="text-primary">.</span>
      </span>
      <span className="text-[0.7em] font-medium tracking-widest uppercase text-muted-foreground">
        properties
      </span>
    </span>
  );

  if (asLink) {
    return (
      <Link to="/" className="flex items-center shrink-0" onClick={onClick}>
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
