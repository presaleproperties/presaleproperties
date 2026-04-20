import { ReactNode, useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
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
  Activity,
  Star,
  
  Workflow,
  BarChart3,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Presentation,
  Zap,
  CalendarCog,
  PenTool,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminLayoutProps {
  children: ReactNode;
}

interface PendingCounts {
  bookings: number;
  assignments: number;
  agents: number;
}

// ── Navigation definition ─────────────────────────────────────────
// Cleaned IA: 6 primary sections + Portals + Operations pushed lower.
// Marketing split: Hub (build assets) · Flows (automations) · Activity (sends/logs).
const navSections = [
  {
    id: "overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    items: [
      { href: "/admin/projects",    label: "Projects",    icon: Building2, badgeKey: null },
      { href: "/admin/assignments", label: "Assignments", icon: FileStack, badgeKey: "assignments" as const },
      { href: "/admin/developers",  label: "Developers",  icon: Landmark,  badgeKey: null },
      { href: "/admin/mls-sync",    label: "MLS Sync",    icon: RefreshCw, badgeKey: null },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      { href: "/admin/leads",    label: "Leads",    icon: Users,        badgeKey: null },
      { href: "/admin/bookings", label: "Bookings", icon: CalendarDays, badgeKey: "bookings" as const },
      { href: "/admin/clients",  label: "Clients",  icon: UserRound,    badgeKey: null },
      { href: "/admin/agents",   label: "Agents",   icon: UserCheck,    badgeKey: "agents" as const },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    items: [
      { href: "/admin/marketing-hub", label: "Marketing Hub", icon: Megaphone,    badgeKey: null },
      { href: "/admin/email-builder", label: "Email Builder", icon: PenTool,      badgeKey: null },
      { href: "/admin/email-flows",   label: "Email Flows",   icon: Zap,          badgeKey: null },
      { href: "/admin/email-center",  label: "Email Activity", icon: Mail,        badgeKey: null },
      { href: "/dashboard/decks",     label: "Pitch Decks",   icon: Presentation, badgeKey: null },
      { href: "/admin/blogs",         label: "Blog",          icon: BookOpen,     badgeKey: null },
      { href: "/admin/google-reviews",label: "Reviews",       icon: Star,         badgeKey: null },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      { href: "/admin/leads/analytics",  label: "Lead Insights", icon: BarChart3,  badgeKey: null },
      { href: "/admin/market-dashboard", label: "Market Data",   icon: TrendingUp, badgeKey: null },
      { href: "/admin/live-activity",    label: "Live Monitor",  icon: Activity,   badgeKey: null },
      { href: "/admin/ai-analytics",     label: "AI Insights",   icon: Zap,        badgeKey: null },
    ],
  },
  {
    id: "portals",
    label: "Portals",
    items: [
      { href: "/developer", label: "Developer Portal", icon: Presentation, badgeKey: null },
      { href: "/dashboard", label: "Agent Portal",     icon: UserCheck,    badgeKey: null },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    items: [
      { href: "/admin/tasks",              label: "Tasks",            icon: ClipboardList, badgeKey: null },
      { href: "/admin/scheduler-settings", label: "Scheduler",        icon: CalendarCog,   badgeKey: null },
      { href: "/admin/email-workflows",    label: "Legacy Workflows", icon: Workflow,      badgeKey: null },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [
      { href: "/admin/settings",        label: "General",          icon: Settings,   badgeKey: null },
      { href: "/admin/theme",           label: "Branding",         icon: Palette,    badgeKey: null },
      { href: "/admin/system-emails",   label: "System Emails",    icon: Mail,       badgeKey: null },
      { href: "/admin/email-templates", label: "External Templates", icon: Mail,     badgeKey: null },
      { href: "/admin/payments",        label: "Payments",         icon: DollarSign, badgeKey: null },
    ],
  },
];

const allNavItems = navSections.flatMap((s) => s.items);

// ── Pending counts ────────────────────────────────────────────────
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
        bookings:    b.count  ?? 0,
        assignments: a.count  ?? 0,
        agents:      ag.count ?? 0,
      });
    };
    fetch();
    const id = setInterval(fetch, 120_000);
    return () => clearInterval(id);
  }, []);

  return counts;
}

// ── Nav item (expanded) ───────────────────────────────────────────
function NavItem({
  item,
  active,
  pending,
  onClick,
  collapsed,
}: {
  item: (typeof allNavItems)[number];
  active: boolean;
  pending?: number;
  onClick?: () => void;
  collapsed?: boolean;
}) {
  const content = (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-all duration-150",
        collapsed
          ? "h-9 w-9 justify-center mx-auto"
          : "px-3 py-2 w-full",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      )}
    >
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-primary" />
      )}
      <item.icon className={cn("shrink-0", collapsed ? "h-[17px] w-[17px]" : "h-4 w-4", active ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground/80")} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {pending && pending > 0 ? (
            <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
              {pending > 99 ? "99+" : pending}
            </span>
          ) : null}
        </>
      )}
      {collapsed && pending && pending > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-amber-500 text-[8px] text-white font-bold flex items-center justify-center">
          {pending > 9 ? "9+" : pending}
        </span>
      ) : null}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs font-medium">
          {item.label}
          {pending && pending > 0 ? ` (${pending})` : ""}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

// ── Nav section (collapsible dropdown) ────────────────────────────
function NavSection({
  section,
  isActive,
  getPending,
  onItemClick,
  collapsed,
}: {
  section: typeof navSections[number];
  isActive: (href: string) => boolean;
  getPending: (key: string | null) => number | undefined;
  onItemClick?: () => void;
  collapsed?: boolean;
}) {
  const hasActiveItem = section.items.some((item) => isActive(item.href));
  const [open, setOpen] = useState(hasActiveItem || !section.label);

  // Auto-open when navigating into a section
  useEffect(() => {
    if (hasActiveItem && !open) setOpen(true);
  }, [hasActiveItem]);

  // Sections without a label (e.g. Dashboard) are always open
  if (!section.label) {
    return (
      <div className="space-y-0.5">
        {section.items.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} pending={getPending(item.badgeKey ?? null)} onClick={onItemClick} collapsed={collapsed} />
        ))}
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="space-y-0.5">
        <div className="mx-3 my-1.5 h-px bg-border/40" />
        {section.items.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} pending={getPending(item.badgeKey ?? null)} onClick={onItemClick} collapsed={collapsed} />
        ))}
      </div>
    );
  }

  return (
    <div className="pt-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1 px-3 pb-1 group cursor-pointer"
      >
        <ChevronDown className={cn("h-3 w-3 text-muted-foreground/50 transition-transform duration-200 shrink-0", !open && "-rotate-90")} />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none group-hover:text-muted-foreground transition-colors flex-1 text-left">
          {section.label}
        </p>
      </button>
      {open && (
        <div className="space-y-0.5">
          {section.items.map((item) => (
            <NavItem key={item.href} item={item} active={isActive(item.href)} pending={getPending(item.badgeKey ?? null)} onClick={onItemClick} collapsed={collapsed} />
          ))}
        </div>
      )}
    </div>
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
    setSidebarCollapsed((v) => {
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

  const currentPage = allNavItems.find((item) => isActive(item.href));
  const currentSection = navSections.find((s) => s.items.some((i) => isActive(i.href)));
  const totalPending = pending.bookings + pending.assignments + pending.agents;

  const isCampaignBuilder =
    location.pathname === "/admin/campaign-builder" ||
    location.pathname.startsWith("/admin/campaign-builder/");

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen flex bg-muted/30">

        {/* ── Desktop Sidebar ─────────────────────────────────── */}
        <aside className={cn(
          "hidden lg:flex flex-col border-r border-border/50 bg-card transition-all duration-200 shrink-0",
          sidebarCollapsed ? "w-[52px]" : "w-[210px]"
        )}>
          {/* Brand */}
          <div className={cn(
            "flex items-center h-14 border-b border-border/40 shrink-0",
            sidebarCollapsed ? "justify-center px-2" : "px-4 gap-3"
          )}>
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Shield className="h-[13px] w-[13px] text-primary-foreground" />
            </div>
            {sidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 mt-1">
                    <PanelLeftOpen className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Expand</TooltipContent>
              </Tooltip>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[13px] text-foreground leading-tight">Admin</p>
                  <p className="text-[10px] text-muted-foreground/70">Command Centre</p>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0">
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>

          {/* Nav */}
          <ScrollArea className="flex-1 py-3">
            <nav className={cn("space-y-4", sidebarCollapsed ? "px-1.5" : "px-2.5")}>
              {navSections.map((section) => (
                <NavSection
                  key={section.id}
                  section={section}
                  isActive={isActive}
                  getPending={getPending}
                  collapsed={sidebarCollapsed}
                />
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className={cn(
            "border-t border-border/40 p-2 shrink-0",
            sidebarCollapsed ? "flex flex-col items-center gap-1" : "space-y-0.5"
          )}>
            {sidebarCollapsed ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/" target="_blank">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">View Site</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <LogOut className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sign Out</TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <Link to="/" target="_blank">
                  <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-[12px] text-muted-foreground hover:text-foreground gap-2">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Live Site
                  </Button>
                </Link>
                <Button
                  variant="ghost" size="sm" onClick={handleSignOut}
                  className="w-full justify-start h-8 text-[12px] text-muted-foreground hover:text-destructive gap-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </aside>

        {/* ── Main Area ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Top bar */}
          <header className="sticky top-0 z-50 h-14 flex items-center border-b border-border/50 bg-card/90 backdrop-blur-xl px-4 sm:px-5 gap-3">
            {/* Mobile hamburger */}
            <Button
              variant="ghost" size="icon"
              className="lg:hidden h-9 w-9 shrink-0 relative"
              onClick={() => setMobileMenuOpen((v) => !v)}
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
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-bold text-[13px]">Admin</span>
            </Link>

            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center gap-1.5">
              {currentSection?.label && (
                <span className="text-[12px] text-muted-foreground">{currentSection.label}</span>
              )}
              {currentPage && (
                <>
                  {currentSection?.label && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
                  <span className="text-[13px] font-semibold text-foreground">{currentPage.label}</span>
                </>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Pending pill */}
              {totalPending > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-amber-700 text-[11px] font-medium">
                  <Bell className="h-3 w-3 shrink-0" />
                  <span>{totalPending} pending</span>
                </div>
              )}

              <Link to="/" target="_blank" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="h-8 text-[12px] text-muted-foreground hover:text-foreground gap-1.5 px-2.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">View Site</span>
                </Button>
              </Link>

              <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Sign out">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </header>

          {/* Mobile nav drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-b bg-card shadow-md z-40">
              <ScrollArea className="max-h-[75vh]">
                <nav className="py-3 px-3 space-y-4">
                  {navSections.map((section) => (
                    <NavSection
                      key={section.id}
                      section={section}
                      isActive={isActive}
                      getPending={getPending}
                      onItemClick={() => setMobileMenuOpen(false)}
                    />
                  ))}
                </nav>
              </ScrollArea>
            </div>
          )}

          {/* Page content */}
          {isCampaignBuilder ? (
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
    </TooltipProvider>
  );
}
