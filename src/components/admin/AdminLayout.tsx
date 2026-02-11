import { ReactNode, useState } from "react";
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
  Users2,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminLayoutProps {
  children: ReactNode;
}

// Color-coded icon styles per section for visual differentiation
const iconColors: Record<string, string> = {
  Dashboard: "text-primary",
  Projects: "text-blue-600",
  Assignments: "text-violet-600",
  Developers: "text-slate-600",
  Leads: "text-emerald-600",
  Bookings: "text-amber-600",
  Clients: "text-cyan-600",
  Agents: "text-indigo-600",
  "Blog Posts": "text-rose-500",
  Campaigns: "text-orange-500",
  Reviews: "text-yellow-600",
  "Lead Insights": "text-teal-600",
  "Market Data": "text-purple-600",
  General: "text-slate-500",
  Email: "text-pink-500",
  "MLS Sync": "text-sky-600",
  Branding: "text-fuchsia-500",
  Payments: "text-emerald-500",
  "Action Items": "text-orange-600",
};

const navSections = [
  {
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ]
  },
  {
    label: "Properties",
    items: [
      { href: "/admin/projects", label: "Projects", icon: Building2 },
      { href: "/admin/listings", label: "Assignments", icon: FileStack },
      { href: "/admin/developers", label: "Developers", icon: Landmark },
    ]
  },
  {
    label: "People",
    items: [
      { href: "/admin/leads", label: "Leads", icon: Users },
      { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
      { href: "/admin/clients", label: "Clients", icon: Users2 },
      { href: "/admin/agents", label: "Agents", icon: Users2 },
    ]
  },
  {
    label: "Content",
    items: [
      { href: "/admin/blogs", label: "Blog Posts", icon: BookOpen },
      { href: "/admin/landing-pages", label: "Campaigns", icon: Megaphone },
      { href: "/admin/google-reviews", label: "Reviews", icon: Users2 },
    ]
  },
  {
    label: "Analytics",
    items: [
      { href: "/admin/leads/analytics", label: "Lead Insights", icon: TrendingUp },
      { href: "/admin/market-dashboard", label: "Market Data", icon: TrendingUp },
    ]
  },
  {
    label: "Ops",
    items: [
      { href: "/admin/tasks", label: "Action Items", icon: ClipboardList },
    ]
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/settings", label: "General", icon: Settings },
      { href: "/admin/email-templates", label: "Email", icon: Mail },
      { href: "/admin/mls-sync", label: "MLS Sync", icon: RefreshCw },
      { href: "/admin/theme", label: "Branding", icon: Palette },
      { href: "/admin/payments", label: "Payments", icon: DollarSign },
    ]
  },
];

const allNavItems = navSections.flatMap(s => s.items);

export function AdminLayout({ children }: AdminLayoutProps) {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(href);
  };

  const currentPageLabel = allNavItems.find(item => isActive(item.href))?.label || "Admin";

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-[240px] flex-col border-r border-border/50 bg-card shadow-sm">
        {/* Premium header with gold accent line */}
        <div className="p-5 pb-4">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center shadow-sm">
              <Shield className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-foreground">Admin Panel</span>
              <p className="text-[10px] text-muted-foreground leading-tight">Command Center</p>
            </div>
          </Link>
        </div>

        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <ScrollArea className="flex-1 px-3 pt-3">
          <nav className="space-y-5 pb-4">
            {navSections.map((section, idx) => (
              <div key={idx}>
                {section.label && (
                  <p className="px-2 mb-2 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em]">
                    {section.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    const colorClass = iconColors[item.label] || "text-muted-foreground";
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-200",
                          active
                            ? "bg-primary/10 text-foreground shadow-sm border border-primary/15"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        )}
                      >
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          active ? "text-primary" : colorClass
                        )} />
                        {item.label}
                        {active && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="p-3 space-y-0.5">
          <Link to="/" target="_blank">
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-9 text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-3.5 w-3.5 mr-2 text-sky-500" />
              View Site
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-xs h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/8" 
            onClick={handleSignOut}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/85 shadow-xs">
          <div className="flex h-14 items-center px-4 sm:px-6 gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            <Link to="/admin" className="flex items-center gap-2 lg:hidden">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {currentPageLabel}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link to="/" target="_blank" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-sky-500" />
                  View Site
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="lg:hidden h-8 text-destructive">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b bg-card shadow-md">
            <ScrollArea className="max-h-[70vh]">
              <nav className="p-3 space-y-4">
                {navSections.map((section, idx) => (
                  <div key={idx}>
                    {section.label && (
                      <p className="px-2 mb-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em]">
                        {section.label}
                      </p>
                    )}
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const active = isActive(item.href);
                        const colorClass = iconColors[item.label] || "text-muted-foreground";
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                              active
                                ? "bg-primary/10 text-foreground border border-primary/15"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            )}
                          >
                            <item.icon className={cn(
                              "h-4 w-4 shrink-0",
                              active ? "text-primary" : colorClass
                            )} />
                            {item.label}
                            {active && (
                              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
