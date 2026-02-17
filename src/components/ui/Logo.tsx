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
    sm: "h-14",
    md: "h-[5.2rem]",
    lg: "h-[6.9rem]",
    xl: "h-[10.4rem] sm:h-[10.4rem] md:h-[11.5rem]",
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
