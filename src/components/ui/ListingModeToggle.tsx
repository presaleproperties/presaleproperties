import { useNavigate, useLocation } from "react-router-dom";
import { Building2, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListingModeToggleProps {
  className?: string;
  size?: "sm" | "default";
}

export function ListingModeToggle({ className, size = "default" }: ListingModeToggleProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine which mode is active based on current route
  const isResale = location.pathname.startsWith("/resale") || 
                   location.pathname === "/resale-map";
  const isPresale = !isResale;

  const handlePresaleClick = () => {
    if (location.pathname === "/resale") {
      navigate("/presale-projects");
    } else if (location.pathname === "/resale-map") {
      navigate("/presale-projects?view=map");
    } else if (location.pathname.startsWith("/resale/")) {
      // City page - convert to presale city page
      const city = location.pathname.replace("/resale/", "");
      navigate(`/${city}-presale-condos`);
    } else {
      navigate("/presale-projects");
    }
  };

  const handleResaleClick = () => {
    if (location.pathname === "/presale-projects") {
      navigate("/resale");
    } else if (location.pathname.includes("?view=map") || location.pathname === "/map-search") {
      navigate("/resale-map");
    } else if (location.pathname.includes("-presale-")) {
      // City page - try to convert
      navigate("/resale");
    } else {
      navigate("/resale");
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-1 p-1 bg-muted rounded-full",
      className
    )}>
      <button
        onClick={handlePresaleClick}
        className={cn(
          "flex items-center gap-1.5 rounded-full font-medium transition-all",
          size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
          isPresale 
            ? "bg-foreground text-background shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Building2 className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
        Presale
      </button>
      <button
        onClick={handleResaleClick}
        className={cn(
          "flex items-center gap-1.5 rounded-full font-medium transition-all",
          size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
          isResale 
            ? "bg-foreground text-background shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Home className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
        Move-In Ready
      </button>
    </div>
  );
}
