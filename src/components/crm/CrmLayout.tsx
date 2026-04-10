import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Mail,
  FileText,
  Zap,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "CRM Dashboard", path: "/crm/dashboard", icon: LayoutDashboard },
  { label: "Leads", path: "/crm/leads", icon: Users },
  { label: "Pipeline", path: "/crm/pipeline", icon: Kanban },
  { label: "Email Center", path: "/crm/email", icon: Mail },
  { label: "Templates", path: "/crm/templates", icon: FileText },
  { label: "Automations", path: "/crm/automations", icon: Zap },
  { label: "Showings Calendar", path: "/crm/calendar", icon: Calendar },
  { label: "Reports", path: "/crm/reports", icon: BarChart3 },
  { label: "CRM Settings", path: "/crm/settings", icon: Settings },
];

export default function CrmLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(220,20%,97%)]">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-[hsl(220,25%,14%)] text-white transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo + collapse */}
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center">
              <Logo size="sm" asLink={false} className="h-10 brightness-0 invert" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 p-3">
          {!collapsed && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-white/90 truncate">Uzair Muhammad</p>
              <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-white/50 hover:text-white text-xs w-full px-1 py-1.5 rounded hover:bg-white/8 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
