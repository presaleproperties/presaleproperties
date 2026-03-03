import { ReactNode, useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileStack,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  UserRound,
  UserCheck,
  UserCog,
  BookOpen,
  CalendarDays,
  Landmark,
  RefreshCw,
  Mail,
  TrendingUp,
  Megaphone,
  Palette,
  ExternalLink,
  ClipboardList,
  Cpu,
  Activity,
  Star,
  Sparkles,
  Workflow,
  CalendarCog,
  BarChart3,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface AdminLayoutProps {
  children: ReactNode;
}

interface PendingCounts {
  bookings: number;
  assignments: number;
  agents: number;
}

// ── Navigation definition ─────────────────────────────────────────
// Every route in App.tsx has a home here — nothing orphaned
const navSections = [
  {
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, color: "text-primary" },
    ],
  },
  {
    label: "Properties",
    items: [
      { href: "/admin/projects",   label: "Projects",     icon: Building2,  color: "text-blue-600",   badgeKey: null },
      { href: "/admin/listings",   label: "Assignments",  icon: FileStack,  color: "text-violet-600", badgeKey: "assignments" as const },
      { href: "/admin/developers", label: "Developers",   icon: Landmark,   color: "text-slate-500",  badgeKey: null },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/leads",        label: "Leads",    icon: Users,      color: "text-emerald-600", badgeKey: null },
      { href: "/admin/bookings",     label: "Bookings", icon: CalendarDays, color: "text-amber-600", badgeKey: "bookings" as const },
      { href: "/admin/clients",      label: "Clients",  icon: UserRound,  color: "text-cyan-600",   badgeKey: null },
      { href: "/admin/agents",       label: "Agents",   icon: UserCheck,  color: "text-indigo-600", badgeKey: "agents" as const },
      { href: "/admin/team-members", label: "Team",     icon: UserCog,    color: "text-slate-500",  badgeKey: null },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/blogs",              label: "Blog Posts",       icon: BookOpen,  color: "text-rose-500",   badgeKey: null },
      { href: "/admin/landing-pages",      label: "Campaigns",        icon: Megaphone, color: "text-orange-500", badgeKey: null },
      { href: "/admin/campaign-builder",   label: "Campaign Builder", icon: FileStack, color: "text-amber-400",  badgeKey: null },
      { href: "/admin/google-reviews",     label: "Reviews",          icon: Star,      color: "text-yellow-500", badgeKey: null },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/admin/leads/analytics",  label: "Lead Insights",     icon: BarChart3,  color: "text-teal-600",   badgeKey: null },
      { href: "/admin/market-dashboard", label: "Market Dashboard",  icon: TrendingUp, color: "text-purple-600", badgeKey: null },
      { href: "/admin/ai-analytics",     label: "AI Analytics",      icon: Sparkles,   color: "text-violet-500", badgeKey: null },
      { href: "/admin/live-activity",    label: "Live Monitor",      icon: Activity,   color: "text-red-500",    badgeKey: null },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/tasks",               label: "Tasks",             icon: ClipboardList, color: "text-orange-600", badgeKey: null },
      { href: "/admin/email-workflows",     label: "Email Workflows",  icon: Workflow,      color: "text-pink-500",   badgeKey: null },
      { href: "/admin/scheduler-settings",  label: "Scheduler",        icon: CalendarCog,   color: "text-amber-500",  badgeKey: null },
      { href: "/admin/mls-sync",            label: "MLS Sync",         icon: RefreshCw,     color: "text-sky-600",    badgeKey: null },
      { href: "/admin/system",              label: "System",           icon: Shield,        color: "text-slate-500",  badgeKey: null },
      { href: "/admin/tech-stack",          label: "Tech Stack",       icon: Cpu,           color: "text-purple-500", badgeKey: null },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/settings",         label: "General",         icon: Settings,  color: "text-slate-500",   badgeKey: null },
      { href: "/admin/email-templates",  label: "Email Templates", icon: Mail,      color: "text-pink-500",    badgeKey: null },
      { href: "/admin/theme",            label: "Branding",        icon: Palette,   color: "text-fuchsia-500", badgeKey: null },
      { href: "/admin/payments",         label: "Payments",        icon: DollarSign, color: "text-emerald-500", badgeKey: null },
      { href: "/admin/market-data",      label: "Market Data",    icon: BarChart3,  color: "text-indigo-500",  badgeKey: null },
    ],
  },
];

const allNavItems = navSections.flatMap((s) => s.items);

// ── Pending counts fetcher ────────────────────────────────────────
function usePendingCounts() {
  const [counts, setCounts] = useState<PendingCounts>({ bookings: 0, assignments: 0, agents: 0 });

  useEffect(() => {
    const fetch = async () => {
      const [b, a, ag] = await Promise.all([
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("listings").select("*", { count: "exact", head: true }).eq("status", "pending_approval"),
        (supabase as any).from("agent_verifications").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
      ]);
      setCounts({
        bookings:    b.count    ?? 0,
        assignments: a.count    ?? 0,
        agents:      ag.count   ?? 0,
      });
    };
    fetch();
    // refresh every 2 minutes
    const id = setInterval(fetch, 120_000);
    return () => clearInterval(id);
  }, []);

  return counts;
}

// ── Nav link component ────────────────────────────────────────────
function NavLink({
  item,
  active,
  pending,
  onClick,
  mobile,
  collapsed,
}: {
  item: (typeof allNavItems)[number];
  active: boolean;
  pending?: number;
  onClick?: () => void;
  mobile?: boolean;
  collapsed?: boolean;
}) {
  return (
    <Link
      to={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg transition-all duration-150",
        collapsed ? "justify-center px-2 py-2" : mobile ? "px-2.5 py-2.5 text-sm" : "px-2.5 py-[7px] text-[13px]",
        active
          ? "bg-primary/10 text-foreground shadow-sm border border-primary/15 font-semibold"
          : "font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
      )}
    >
      <item.icon
        className={cn(
          "shrink-0 transition-colors",
          mobile ? "h-4 w-4" : "h-[15px] w-[15px]",
          active ? "text-primary" : item.color
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && pending && pending > 0 ? (
        <span className="ml-auto shrink-0 min-w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
          {pending > 99 ? "99+" : pending}
        </span>
      ) : !collapsed && active ? (
        <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
      ) : null}
      {collapsed && pending && pending > 0 ? (
        <span className="absolute top-0.5 right-0.5 h-3 w-3 rounded-full bg-amber-500" />
      ) : null}
    </Link>
  );
}

// ── Layout ────────────────────────────────────────────────────────
export function AdminLayout({ children }: AdminLayoutProps) {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("admin_sidebar_collapsed") === "true"; } catch { return false; }
  });
  const pending = usePendingCounts();

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(v => {
      const next = !v;
      try { localStorage.setItem("admin_sidebar_collapsed", String(next)); } catch {}
      return next;
    });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(href);
  };

  const getPending = (key: string | null): number | undefined => {
    if (!key) return undefined;
    return pending[key as keyof PendingCounts];
  };

  const currentPageLabel = allNavItems.find((item) => isActive(item.href))?.label ?? "Admin";

  const renderNav = (mobile = false, collapsed = false) => (
    <nav className={cn("space-y-4", mobile ? "p-3" : collapsed ? "py-4 px-1.5" : "pb-4")}>
      {navSections.map((section, idx) => (
        <div key={idx}>
          {section.label && !collapsed && (
            <p className="px-2 mb-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.14em]">
              {section.label}
            </p>
          )}
          {section.label && collapsed && (
            <div className="mx-auto h-px bg-border/50 mb-2 mt-1" />
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                pending={getPending(item.badgeKey ?? null)}
                onClick={mobile ? () => setMobileMenuOpen(false) : undefined}
                mobile={mobile}
                collapsed={collapsed}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  // Total pending count for mobile header badge
  const totalPending = pending.bookings + pending.assignments + pending.agents;

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* ── Sidebar Desktop ────────────────────────────────────── */}
      <aside className={cn(
        "hidden lg:flex flex-col border-r border-border/50 bg-card shadow-sm transition-all duration-200",
        sidebarCollapsed ? "w-14" : "w-[232px]"
      )}>
        {/* Header */}
        <div className={cn("p-3 flex items-center", sidebarCollapsed ? "justify-center" : "justify-between gap-2")}>
          {!sidebarCollapsed && (
            <Link to="/admin" className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center shadow-sm shrink-0">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[13px] tracking-tight text-foreground leading-tight">Admin Panel</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Command Center</p>
              </div>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/admin" className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center shadow-sm">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn("h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground", sidebarCollapsed && "mt-2")}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-border to-transparent mb-1" />

        <ScrollArea className={cn("flex-1 pt-2", sidebarCollapsed ? "px-0" : "px-2.5")}>
          {renderNav(false, sidebarCollapsed)}
        </ScrollArea>

        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className={cn("p-2 space-y-0.5", sidebarCollapsed && "flex flex-col items-center")}>
          {!sidebarCollapsed ? (
            <>
              <Link to="/" target="_blank">
                <Button variant="ghost" size="sm" className="w-full justify-start text-[13px] h-9 text-muted-foreground hover:text-foreground gap-2">
                  <ExternalLink className="h-3.5 w-3.5 text-sky-500" />
                  View Live Site
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-[13px] h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/8 gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/" target="_blank" title="View Live Site">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-3.5 w-3.5 text-sky-500" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/85 shadow-xs"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="flex h-14 items-center px-4 sm:px-6 gap-3">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 shrink-0 relative"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              {totalPending > 0 && !mobileMenuOpen && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-amber-500 text-[9px] text-white font-bold flex items-center justify-center">
                  {totalPending > 9 ? "9+" : totalPending}
                </span>
              )}
            </Button>

            {/* Mobile logo */}
            <Link to="/admin" className="flex items-center gap-2 lg:hidden">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            </Link>

            {/* Desktop breadcrumb */}
            <div className="hidden lg:flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">Admin</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="font-semibold text-foreground">{currentPageLabel}</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Pending summary pill — desktop */}
              {totalPending > 0 && (
                <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {pending.bookings > 0 && <span>{pending.bookings} booking{pending.bookings !== 1 ? "s" : ""}</span>}
                  {pending.bookings > 0 && pending.assignments > 0 && <span className="opacity-40">·</span>}
                  {pending.assignments > 0 && <span>{pending.assignments} assignment{pending.assignments !== 1 ? "s" : ""}</span>}
                  {(pending.bookings > 0 || pending.assignments > 0) && pending.agents > 0 && <span className="opacity-40">·</span>}
                  {pending.agents > 0 && <span>{pending.agents} agent{pending.agents !== 1 ? "s" : ""}</span>}
                  <span className="opacity-40">pending</span>
                </div>
              )}

              <Link to="/" target="_blank" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5 text-sky-500" />
                  View Site
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="lg:hidden h-8 w-8 text-muted-foreground hover:text-destructive">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile nav drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b bg-card shadow-md">
            <ScrollArea className="max-h-[72vh]">
              {renderNav(true)}
            </ScrollArea>
          </div>
        )}

        {/* Page content */}
        {location.pathname === "/admin/campaign-builder" ? (
          <main className="flex-1 overflow-hidden flex flex-col min-h-0">
            {children}
          </main>
        ) : (
          <main className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
              {children}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
