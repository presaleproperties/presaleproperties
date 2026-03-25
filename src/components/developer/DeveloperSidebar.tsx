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
    <aside className="flex flex-col w-64 flex-shrink-0 bg-card border-r border-border min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <Link to="/" className="block mb-1">
          <Logo className="h-7 w-auto" />
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Developer Portal</p>
      </div>

      {/* Add Project CTA */}
      <div className="px-4 pt-5 pb-2">
        <Link to="/developer/projects/new">
          <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm py-2.5 rounded-lg transition-colors">
            <Plus className="h-4 w-4" />
            Add Project
          </button>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
      <div className="px-3 pb-6 border-t border-border pt-4 space-y-0.5">
        <Link
          to="/contact"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <HelpCircle className="h-4 w-4" />
          Help & Support
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
