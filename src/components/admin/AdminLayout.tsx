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
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Presentation,
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
const navSections = [
  {
    id: "overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, color: "text-primary" },
    ],
  },
  {
    id: "properties",
    label: "Properties",
    emoji: "🏢",
    items: [
      { href: "/admin/projects",    label: "Presale Projects", icon: Building2,  color: "text-blue-500",   badgeKey: null },
      { href: "/admin/listings",    label: "Assignments",      icon: FileStack,  color: "text-violet-500", badgeKey: "assignments" as const },
      { href: "/admin/developers",  label: "Developers",       icon: Landmark,   color: "text-slate-400",  badgeKey: null },
    ],
  },
  {
    id: "people",
    label: "People",
    emoji: "👥",
    items: [
      { href: "/admin/leads",        label: "Leads",      icon: Users,        color: "text-emerald-500", badgeKey: null },
      { href: "/admin/bookings",     label: "Bookings",   icon: CalendarDays, color: "text-amber-500",   badgeKey: "bookings" as const },
      { href: "/admin/clients",      label: "Clients",    icon: UserRound,    color: "text-cyan-500",    badgeKey: null },
      { href: "/admin/agents",       label: "Agents",     icon: UserCheck,    color: "text-indigo-500",  badgeKey: "agents" as const },
      { href: "/admin/team-members", label: "Team",       icon: UserCog,      color: "text-slate-400",   badgeKey: null },
    ],
  },
  {
    id: "content",
    label: "Content",
    emoji: "✍️",
    items: [
      { href: "/admin/top-deals",           label: "Top Deals",     icon: Sparkles,  color: "text-primary",     badgeKey: null },
      { href: "/admin/blogs",               label: "Blog Posts",    icon: BookOpen,  color: "text-rose-500",    badgeKey: null },
      { href: "/admin/landing-pages",       label: "Campaigns",     icon: Megaphone, color: "text-orange-500",  badgeKey: null },
      { href: "/admin/marketing-hub",       label: "Marketing Hub", icon: Mail,      color: "text-emerald-500", badgeKey: null },
      { href: "/admin/campaign-builder/new",label: "Flyer Builder", icon: FileStack, color: "text-amber-400",   badgeKey: null },
      { href: "/admin/google-reviews",      label: "Reviews",       icon: Star,      color: "text-yellow-500",  badgeKey: null },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    emoji: "📊",
    items: [
      { href: "/admin/leads/analytics",  label: "Lead Insights",    icon: BarChart3,  color: "text-teal-500",    badgeKey: null },
      { href: "/admin/market-dashboard", label: "Market Dashboard", icon: TrendingUp, color: "text-purple-500",  badgeKey: null },
      { href: "/admin/ai-analytics",     label: "AI Analytics",     icon: Sparkles,   color: "text-violet-500",  badgeKey: null },
      { href: "/admin/live-activity",    label: "Live Monitor",     icon: Activity,   color: "text-red-500",     badgeKey: null },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    emoji: "⚙️",
    items: [
      { href: "/admin/tasks",              label: "Tasks",           icon: ClipboardList, color: "text-orange-500", badgeKey: null },
      { href: "/admin/email-workflows",    label: "Email Workflows", icon: Workflow,      color: "text-pink-500",   badgeKey: null },
      { href: "/admin/scheduler-settings", label: "Scheduler",      icon: CalendarCog,   color: "text-amber-500",  badgeKey: null },
      { href: "/admin/mls-sync",           label: "MLS Sync",        icon: RefreshCw,     color: "text-sky-500",    badgeKey: null },
      { href: "/admin/system",             label: "System Health",   icon: Shield,        color: "text-slate-400",  badgeKey: null },
      { href: "/admin/tech-stack",         label: "Tech Stack",      icon: Cpu,           color: "text-purple-500", badgeKey: null },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    emoji: "🔧",
    items: [
      { href: "/admin/settings",        label: "General",         icon: Settings,   color: "text-slate-400",   badgeKey: null },
      { href: "/admin/email-templates", label: "Email Templates", icon: Mail,       color: "text-pink-500",    badgeKey: null },
      { href: "/admin/theme",           label: "Branding",        icon: Palette,    color: "text-fuchsia-500", badgeKey: null },
      { href: "/admin/payments",        label: "Payments",        icon: DollarSign, color: "text-emerald-500", badgeKey: null },
      { href: "/admin/market-data",     label: "Market Data",     icon: BarChart3,  color: "text-indigo-500",  badgeKey: null },
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

// ── Collapsed icon nav item ───────────────────────────────────────
function CollapsedNavItem({
  item,
  active,
  pending,
}: {
  item: (typeof allNavItems)[number];
  active: boolean;
  pending?: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={item.href}
          className={cn(
            "relative flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-150 mx-auto",
            active
              ? "bg-primary/12 text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
          )}
        >
          <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : item.color)} />
          {pending && pending > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-amber-500 text-[8px] text-white font-bold flex items-center justify-center">
              {pending > 9 ? "9+" : pending}
            </span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

// ── Expanded nav item ─────────────────────────────────────────────
function NavItem({
  item,
  active,
  pending,
  onClick,
}: {
  item: (typeof allNavItems)[number];
  active: boolean;
  pending?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-all duration-150 relative",
        active
          ? "bg-primary/10 text-foreground font-semibold shadow-sm"
          : "font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
      )}
      <item.icon
        className={cn(
          "h-[15px] w-[15px] shrink-0 transition-colors",
          active ? "text-primary" : item.color
        )}
      />
      <span className="truncate flex-1">{item.label}</span>
      {pending && pending > 0 ? (
        <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
          {pending > 99 ? "99+" : pending}
        </span>
      ) : active ? (
        <ChevronRight className="shrink-0 h-3 w-3 opacity-30" />
      ) : null}
    </Link>
  );
}

// ── Collapsible section ───────────────────────────────────────────
function NavSection({
  section,
  isActive,
  getPending,
  onItemClick,
  defaultOpen,
}: {
  section: typeof navSections[number];
  isActive: (href: string) => boolean;
  getPending: (key: string | null) => number | undefined;
  onItemClick?: () => void;
  defaultOpen?: boolean;
}) {
  const hasActive = section.items.some((i) => isActive(i.href));
  const [open, setOpen] = useState(defaultOpen ?? hasActive);

  // If a child becomes active, open the section
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  if (!section.label) {
    // Dashboard item — no collapsible wrapper
    return (
      <div className="space-y-0.5">
        {section.items.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={isActive(item.href)}
            pending={getPending(item.badgeKey ?? null)}
            onClick={onItemClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 hover:text-muted-foreground transition-colors group"
      >
        <span className="flex-1 text-left">{section.label}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            open ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>

      {open && (
        <div className="mt-0.5 space-y-0.5">
          {section.items.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isActive(item.href)}
              pending={getPending(item.badgeKey ?? null)}
              onClick={onItemClick}
            />
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
  const currentSection = navSections.find((s) =>
    s.items.some((i) => isActive(i.href))
  );
  const totalPending = pending.bookings + pending.assignments + pending.agents;

  const isCampaignBuilder =
    location.pathname === "/admin/campaign-builder" ||
    location.pathname.startsWith("/admin/campaign-builder/");

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen flex bg-muted/40">

        {/* ── Desktop Sidebar ────────────────────────────────────── */}
        <aside className={cn(
          "hidden lg:flex flex-col border-r border-border/60 bg-card shadow-sm transition-all duration-200 shrink-0",
          sidebarCollapsed ? "w-[56px]" : "w-[220px]"
        )}>
          {/* Logo / Brand */}
          <div className={cn(
            "flex items-center border-b border-border/50",
            sidebarCollapsed ? "h-14 justify-center px-2" : "h-14 px-4 gap-3"
          )}>
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center shadow-sm shrink-0">
              <Shield className="h-[14px] w-[14px] text-primary-foreground" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[13px] tracking-tight text-foreground leading-tight truncate">Admin Panel</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Command Center</p>
              </div>
            )}
          </div>

          {/* Nav */}
          <ScrollArea className="flex-1">
            {sidebarCollapsed ? (
              /* Collapsed: icons only */
              <div className="py-3 px-1.5 space-y-1">
                {navSections.flatMap((s) =>
                  s.label
                    ? [
                        <div key={`div-${s.id}`} className="my-2 mx-2 h-px bg-border/50" />,
                        ...s.items.map((item) => (
                          <CollapsedNavItem
                            key={item.href}
                            item={item}
                            active={isActive(item.href)}
                            pending={getPending(item.badgeKey ?? null)}
                          />
                        )),
                      ]
                    : s.items.map((item) => (
                        <CollapsedNavItem
                          key={item.href}
                          item={item}
                          active={isActive(item.href)}
                          pending={getPending(item.badgeKey ?? null)}
                        />
                      ))
                )}
              </div>
            ) : (
              /* Expanded: sections with labels */
              <nav className="py-3 px-2.5 space-y-1">
                {navSections.map((section) => (
                  <NavSection
                    key={section.id}
                    section={section}
                    isActive={isActive}
                    getPending={getPending}
                    defaultOpen={
                      section.id === "overview" ||
                      section.items.some((i) => isActive(i.href))
                    }
                  />
                ))}
              </nav>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className={cn(
            "border-t border-border/50 p-2 space-y-1",
            sidebarCollapsed && "flex flex-col items-center"
          )}>
            {sidebarCollapsed ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <PanelLeftOpen className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Expand sidebar</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/" target="_blank">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5 text-sky-500" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">View Live Site</TooltipContent>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="w-full justify-start text-[12px] h-8 text-muted-foreground hover:text-foreground gap-2"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                  Collapse
                </Button>
                <Link to="/" target="_blank">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-[12px] h-8 text-muted-foreground hover:text-foreground gap-2">
                    <ExternalLink className="h-3.5 w-3.5 text-sky-500" />
                    View Live Site
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full justify-start text-[12px] h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/8 gap-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </aside>

        {/* ── Main Area ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Top bar */}
          <header className="sticky top-0 z-50 h-14 flex items-center border-b border-border/60 bg-card/95 backdrop-blur-xl px-4 sm:px-5 gap-3 shadow-sm">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
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
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-bold text-[13px]">Admin</span>
            </Link>

            {/* Desktop breadcrumb */}
            <div className="hidden lg:flex items-center gap-1.5">
              <span className="text-[12px] text-muted-foreground font-medium">
                {currentSection?.label ?? "Admin"}
              </span>
              {currentPage && (
                <>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[13px] font-semibold text-foreground">
                    {currentPage.label}
                  </span>
                </>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Pending alerts */}
              {totalPending > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-[11px] font-medium">
                  <Bell className="h-3 w-3" />
                  {pending.bookings > 0 && (
                    <span>{pending.bookings} booking{pending.bookings !== 1 ? "s" : ""}</span>
                  )}
                  {pending.bookings > 0 && pending.assignments > 0 && (
                    <span className="opacity-30">·</span>
                  )}
                  {pending.assignments > 0 && (
                    <span>{pending.assignments} assignment{pending.assignments !== 1 ? "s" : ""}</span>
                  )}
                  {(pending.bookings > 0 || pending.assignments > 0) && pending.agents > 0 && (
                    <span className="opacity-30">·</span>
                  )}
                  {pending.agents > 0 && (
                    <span>{pending.agents} agent{pending.agents !== 1 ? "s" : ""}</span>
                  )}
                  <span className="opacity-40 ml-0.5">pending</span>
                </div>
              )}

              <Link to="/" target="_blank" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="h-8 text-[12px] text-muted-foreground hover:text-foreground gap-1.5 px-2.5">
                  <ExternalLink className="h-3.5 w-3.5 text-sky-500" />
                  <span className="hidden md:inline">View Site</span>
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </header>

          {/* Mobile nav drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-b bg-card shadow-md z-40">
              <ScrollArea className="max-h-[75vh]">
                <nav className="py-3 px-3 space-y-1">
                  {navSections.map((section) => (
                    <NavSection
                      key={section.id}
                      section={section}
                      isActive={isActive}
                      getPending={getPending}
                      onItemClick={() => setMobileMenuOpen(false)}
                      defaultOpen={section.items.some((i) => isActive(i.href))}
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
