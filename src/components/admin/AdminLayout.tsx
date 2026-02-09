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
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface AdminLayoutProps {
  children: ReactNode;
}

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
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-[220px] flex-col border-r border-border/60 bg-card">
        <div className="p-4 pb-3">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
              <Shield className="h-4 w-4 text-background" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Admin Panel</span>
          </Link>
        </div>

        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-5 pb-4">
            {navSections.map((section, idx) => (
              <div key={idx}>
                {section.label && (
                  <p className="px-2 mb-1.5 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest">
                    {section.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-3 border-t border-border/60 space-y-1">
          <Link to="/" target="_blank">
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8 text-muted-foreground">
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              View Site
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
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
        <header className="sticky top-0 z-50 border-b border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex h-12 items-center px-4 gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            <Link to="/admin" className="flex items-center gap-2 lg:hidden">
              <div className="h-7 w-7 rounded-md bg-foreground flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-background" />
              </div>
            </Link>

            <span className="hidden lg:block text-sm font-medium text-foreground">
              {currentPageLabel}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <Link to="/" target="_blank" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
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
          <div className="lg:hidden border-b bg-card">
            <ScrollArea className="max-h-[70vh]">
              <nav className="p-3 space-y-4">
                {navSections.map((section, idx) => (
                  <div key={idx}>
                    {section.label && (
                      <p className="px-2 mb-1 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest">
                        {section.label}
                      </p>
                    )}
                    <div className="space-y-0.5">
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive(item.href)
                              ? "bg-foreground text-background"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      ))}
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
