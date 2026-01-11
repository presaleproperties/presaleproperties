import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  asLink?: boolean;
  onClick?: () => void;
}

export function Logo({ className, asLink = true, onClick }: LogoProps) {
  const logoContent = (
    <span className={cn("font-bold tracking-tight flex items-center", className)}>
      <span className="text-primary">p</span>
      <span>resaleproperties</span>
      <span className="text-primary ml-0.5">.</span>
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
