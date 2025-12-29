import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchPopup } from "@/components/conversion/SearchPopup";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  action?: "search";
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: <Home className="h-5 w-5" />, path: "/" },
  { id: "search", label: "Search", icon: <Search className="h-5 w-5" />, action: "search" },
  { id: "saved", label: "Saved", icon: <Heart className="h-5 w-5" />, path: "/dashboard" },
  { id: "alerts", label: "Alerts", icon: <Bell className="h-5 w-5" />, path: "/dashboard" },
  { id: "account", label: "Account", icon: <User className="h-5 w-5" />, path: "/login" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (item: NavItem) => {
    if (item.action === "search") {
      setSearchOpen(true);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-bottom md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const active = item.path ? isActive(item.path) : false;
            
            if (item.action) {
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 min-w-[56px] active:scale-95 transition-transform"
                >
                  <span className="text-muted-foreground">{item.icon}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.path!}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1 px-3 min-w-[56px] active:scale-95 transition-transform",
                  active && "text-primary"
                )}
              >
                <span className={active ? "text-primary" : "text-muted-foreground"}>
                  {item.icon}
                </span>
                <span className={cn(
                  "text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Search Popup */}
      <SearchPopup open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Spacer for fixed bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}
