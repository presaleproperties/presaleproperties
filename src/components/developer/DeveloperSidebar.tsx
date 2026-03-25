import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Building2,
  Plus,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/developer", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/developer/projects", label: "My Projects", icon: Building2, exact: false },
  { href: "/developer/settings", label: "Company Profile", icon: Settings, exact: true },
  { href: "/developer/help", label: "Help", icon: HelpCircle, exact: true },
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
    <aside className="flex flex-col w-64 flex-shrink-0 bg-[#1A1A2E] min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/10">
        <Building2 className="h-5 w-5 text-[#C8A951]" />
        <div>
          <div className="text-white font-semibold text-sm leading-tight">Developer Portal</div>
          <div className="text-white/30 text-xs">Presale Properties Group</div>
        </div>
      </div>

      {/* Add Project CTA */}
      <div className="px-4 pt-5 pb-2">
        <Link to="/developer/projects/new">
          <button className="w-full flex items-center justify-center gap-2 bg-[#C8A951] hover:bg-[#b8993f] text-[#1A1A2E] font-bold text-sm py-2.5 rounded-lg transition-colors">
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                active
                  ? "bg-[#C8A951]/15 text-[#C8A951]"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-[#C8A951]" : "")} />
              <span>{item.label}</span>
              {active && <ChevronRight className="h-3 w-3 ml-auto text-[#C8A951]/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="px-3 pb-6 border-t border-white/10 pt-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
