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
    sm: "h-12",
    md: "h-[4.5rem]",
    lg: "h-24",
    xl: "h-36 sm:h-36 md:h-40",
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
