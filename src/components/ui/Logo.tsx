import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoSvg from "@/assets/logo.svg";

interface LogoProps {
  className?: string;
  asLink?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Logo({ className, asLink = true, onClick, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
    xl: "h-12 md:h-20",
  };

  const logoContent = (
    <img 
      src={logoSvg} 
      alt="Presale Properties" 
      className={cn(sizeClasses[size], "w-auto", className)} 
    />
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
