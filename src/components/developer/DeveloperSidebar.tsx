import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/ui/Logo";
import {
  LayoutDashboard,
  Building2,
  Plus,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/developer", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/developer/projects", label: "My Projects", icon: Building2, exact: false },
  { href: "/developer/tour-requests", label: "Tour Requests", icon: Calendar, exact: true },
  { href: "/developer/settings", label: "Company Profile", icon: Settings, exact: true },
];

export function DeveloperSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const isActive = (href: string, exact: boolean) =>
    exact ? location.pathname === href : location.pathname.startsWith(href);

  const handleSignOut = async () => {
    await signOut();
    navigate("/developer-portal");
  };

  return (
    <aside className="flex flex-col w-64 flex-shrink-0 bg-foreground min-h-screen relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 w-full h-48 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.15),transparent_70%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>

      {/* Logo */}
      <div className="relative z-10 px-5 py-5 border-b border-background/10">
        <Logo size="sm" className="brightness-0 invert" />
        <p className="text-xs text-background/30 mt-1.5 pl-0.5">Developer Portal</p>
      </div>

      {/* Add Project CTA */}
      <div className="relative z-10 px-4 pt-5 pb-3">
        <Link to="/developer/projects/new">
          <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm py-2.5 rounded-xl transition-all shadow-gold hover:shadow-gold-glow">
            <Plus className="h-4 w-4" />
            Add Project
          </button>
        </Link>
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-background/50 hover:text-background hover:bg-background/5"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight className="h-3 w-3 ml-auto text-primary/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Help + Sign Out */}
      <div className="relative z-10 px-3 pb-6 border-t border-background/10 pt-4 space-y-0.5">
        <Link
          to="/contact"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-background/40 hover:text-background hover:bg-background/5 transition-all"
        >
          <HelpCircle className="h-4 w-4" />
          Help & Support
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-background/40 hover:text-background hover:bg-background/5 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
