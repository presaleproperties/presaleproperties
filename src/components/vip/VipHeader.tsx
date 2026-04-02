import { useNavigate, useLocation } from "react-router-dom";
import { useVipAuth } from "@/hooks/useVipAuth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building2, Heart, LogOut, User, ChevronDown, Shield } from "lucide-react";

export function VipHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { vipUser, vipEmail, logoutVip } = useVipAuth();

  const meta = vipUser?.user_metadata || {};
  const displayName = [meta.first_name, meta.last_name].filter(Boolean).join(" ") || vipEmail || "VIP";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const navItems = [
    { label: "Projects", path: "/vip", icon: Building2 },
    { label: "My Interests", path: "/vip/interests", icon: Heart },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <button
          onClick={() => navigate("/vip")}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-none">VIP Portal</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">PresaleProperties.com</p>
          </div>
        </button>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 h-10 px-3">
              <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                {initials}
              </div>
              <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">{displayName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{vipEmail}</p>
            </div>
            <DropdownMenuSeparator />
            {/* Mobile nav items */}
            <div className="sm:hidden">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)} className="gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </div>
            <DropdownMenuItem onClick={() => navigate("/")} className="gap-2">
              <Building2 className="h-4 w-4" />
              Main Website
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { logoutVip(); navigate("/vip-login"); }} className="gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
