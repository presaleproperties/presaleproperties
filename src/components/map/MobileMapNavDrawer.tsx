import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, Building2, HomeIcon, Map, Calculator, Users, FileText,
  Phone, BookOpen, X
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MobileMapNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NAV_ITEMS = [
  { label: "Home", icon: Home, path: "/home" },
  { label: "Presale Projects", icon: Building2, path: "/presale-projects" },
  { label: "Move-In Ready", icon: HomeIcon, path: "/properties" },
  { label: "Map Search", icon: Map, path: "/map-search" },
  { label: "ROI Calculator", icon: Calculator, path: "/roi-calculator" },
  
  { label: "Blog", icon: BookOpen, path: "/blog" },
  { label: "Contact", icon: Phone, path: "/contact" },
];

export function MobileMapNavDrawer({ open, onOpenChange }: MobileMapNavDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (path: string) => {
    onOpenChange(false);
    // Small delay to let the sheet close animation start
    setTimeout(() => {
      if (path === "/home") {
        // Navigate to the actual homepage content
        navigate("/?view=home");
      } else {
        navigate(path);
      }
    }, 150);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="left" 
        className="w-[280px] sm:w-[320px] p-0 border-r border-border/20"
        style={{ backgroundColor: 'hsl(30, 20%, 99%)', color: 'hsl(30, 10%, 15%)' }}
      >
        {/* Header */}
        <div 
          className="px-5 pb-4 border-b border-border/20"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
        >
          <SheetTitle className="text-lg font-bold" style={{ color: 'hsl(30, 10%, 15%)' }}>
            PresaleProperties
          </SheetTitle>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(30, 8%, 45%)' }}>Metro Vancouver Real Estate</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-3 px-3">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === "/map-search" && location.pathname === "/map-search");
              const Icon = item.icon;
              
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200",
                    isActive
                      ? "font-semibold"
                      : "hover:bg-muted/60 active:bg-muted"
                  )}
                  style={isActive 
                    ? { backgroundColor: 'hsl(40, 65%, 55%, 0.12)', color: 'hsl(40, 65%, 40%)' }
                    : { color: 'hsl(30, 10%, 20%)' }
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" style={{ color: isActive ? 'hsl(40, 65%, 40%)' : 'hsl(30, 8%, 50%)' }} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div 
          className="px-5 py-4 border-t border-border/20 mt-auto"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          <p className="text-[10px] text-center" style={{ color: 'hsl(30, 8%, 55%)' }}>
            © {new Date().getFullYear()} PresaleProperties.com
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
