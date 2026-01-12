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
  Workflow
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AdminLayoutProps {
  children: ReactNode;
}

// Organized navigation with logical groups
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
    ]
  },
  {
    label: "Users & Leads",
    items: [
      { href: "/admin/agents", label: "Agents", icon: Users },
      { href: "/admin/leads", label: "Leads", icon: Users2 },
      { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
    ]
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/payments", label: "Payments", icon: DollarSign },
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

// Flat list for mobile quick access
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
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-muted/30">
        <div className="p-4 border-b">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-xl">
            <Shield className="h-6 w-6 text-primary" />
            <span>Admin Panel</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navGroups.map((group) => (
            <Collapsible 
              key={group.label}
              open={expandedGroups.includes(group.label)}
              onOpenChange={() => toggleGroup(group.label)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground">
                {group.label}
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  expandedGroups.includes(group.label) && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
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

        <div className="p-4 border-t space-y-2">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="w-full">
              Agent Dashboard
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-4 gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <Link to="/admin" className="flex items-center gap-2 font-bold text-xl lg:hidden">
              <Shield className="h-6 w-6 text-primary" />
              <span>Admin</span>
            </Link>

            <div className="ml-auto flex items-center gap-2">
              <Link to="/" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  View Site
                </Button>
              </Link>
              <Link to="/dashboard" className="lg:hidden">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="lg:hidden">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b bg-background">
            <nav className="flex flex-col p-4 gap-1 max-h-[70vh] overflow-y-auto">
              {allNavItems.map((item) => (
                <Link 
                  key={item.href} 
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
