import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo-new.png";

interface LogoProps {
  className?: string;
  asLink?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Logo({ className, asLink = true, onClick, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-10",
    md: "h-14",
    lg: "h-20",
    xl: "h-32 sm:h-32 md:h-36",
  };

  const logoContent = (
    <img 
      src={logoImg} 
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
