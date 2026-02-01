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
  ChevronDown,
  CalendarDays,
  Clock,
  Landmark,
  RefreshCw,
  Mail,
  Workflow,
  TrendingUp,
  Megaphone,
  Sparkles,
  BarChart3,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminLayoutProps {
  children: ReactNode;
}

const navGroups = [
  {
    label: "Dashboard",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
    ]
  },
  {
    label: "Content",
    items: [
      { href: "/admin/projects", label: "Projects", icon: Building2 },
      { href: "/admin/developers", label: "Developers", icon: Landmark },
      { href: "/admin/listings", label: "Assignments", icon: FileStack },
      { href: "/admin/blogs", label: "Blog Posts", icon: BookOpen },
      { href: "/admin/landing-pages", label: "Landing Pages", icon: Megaphone },
    ]
  },
  {
    label: "Users & Leads",
    items: [
      { href: "/admin/clients", label: "Clients", icon: Users },
      { href: "/admin/buyers", label: "VIP Buyers", icon: Users },
      { href: "/admin/leads", label: "Leads", icon: Users2 },
      { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
      { href: "/admin/agents", label: "Agents", icon: Users2 },
      { href: "/admin/team-members", label: "Team Members", icon: Users2 },
      { href: "/admin/google-reviews", label: "Google Reviews", icon: Users2 },
      { href: "/admin/developer-accounts", label: "Developer Accounts", icon: Landmark },
    ]
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/payments", label: "Payments", icon: DollarSign },
    ]
  },
  {
    label: "Analytics",
    items: [
      { href: "/admin/ai-analytics", label: "AI Recommendations", icon: Sparkles },
      { href: "/admin/leads/analytics", label: "Lead Analytics", icon: BarChart3 },
      { href: "/admin/market-dashboard", label: "Market Dashboard", icon: TrendingUp },
      { href: "/admin/market-data", label: "Upload Data", icon: TrendingUp },
    ]
  },
  {
    label: "System",
    items: [
      { href: "/admin/email-templates", label: "Email Templates", icon: Mail },
      { href: "/admin/email-workflows", label: "Email Workflows", icon: Workflow },
      { href: "/admin/mls-sync", label: "MLS Sync", icon: RefreshCw },
      { href: "/admin/scheduler-settings", label: "Scheduler", icon: Clock },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ]
  },
];

const allNavItems = navGroups.flatMap(group => group.items);

export function AdminLayout({ children }: AdminLayoutProps) {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Dashboard", "Content", "Users & Leads"]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(href);
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => 
      prev.includes(label) 
        ? prev.filter(g => g !== label)
        : [...prev, label]
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-5 border-b">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg">Admin</span>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Management Portal</p>
            </div>
          </Link>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {navGroups.map((group) => (
              <Collapsible 
                key={group.label}
                open={expandedGroups.includes(group.label)}
                onOpenChange={() => toggleGroup(group.label)}
                className="mb-2"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors">
                  {group.label}
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    expandedGroups.includes(group.label) && "rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 mt-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive(item.href)
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t space-y-2">
          <Link to="/" target="_blank">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Site
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              Agent Dashboard
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
          <div className="flex h-14 items-center px-4 gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <Link to="/admin" className="flex items-center gap-2 lg:hidden">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">Admin</span>
            </Link>

            <div className="ml-auto flex items-center gap-2">
              <Link to="/" target="_blank" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Site
                </Button>
              </Link>
              <Link to="/dashboard" className="lg:hidden">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="lg:hidden text-red-500">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b bg-white dark:bg-slate-900 shadow-lg">
            <ScrollArea className="max-h-[70vh]">
              <nav className="flex flex-col p-4 gap-1">
                {allNavItems.map((item) => (
                  <Link 
                    key={item.href} 
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive(item.href) ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        isActive(item.href) && "shadow-md"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </ScrollArea>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl py-6 px-4 sm:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}