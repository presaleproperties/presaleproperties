import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  User, 
  LogOut,
  Menu,
  X,
  Home,
  Shield,
  ChevronRight,
  Sparkles,
  Mail,
  FolderOpen,
  Presentation,
  Megaphone,
  FileText,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  noPadding?: boolean;
}

interface NavSection {
  label: string;
  items: {
    label: string;
    href: string;
    icon: any;
    description: string;
    badge?: string;
  }[];
}

const navSections: NavSection[] = [
  {
    label: "Workflow",
    items: [
      { 
        label: "Overview", 
        href: "/dashboard", 
        icon: LayoutDashboard,
        description: "Onboard leads & quick actions"
      },
      { 
        label: "Leads", 
        href: "/dashboard/leads", 
        icon: Users,
        description: "Manage & prioritize clients"
      },
      { 
        label: "Pitch Decks", 
        href: "/dashboard/decks", 
        icon: Presentation,
        description: "Share project presentations"
      },
      { 
        label: "Marketing", 
        href: "/dashboard/marketing-hub", 
        icon: Megaphone,
        description: "Email campaigns & templates"
      },
      { 
        label: "Emails", 
        href: "/dashboard/emails", 
        icon: Mail,
        description: "Track opens & engagement"
      },
    ],
  },
  {
    label: "Resources",
    items: [
      { 
        label: "Project Docs", 
        href: "/dashboard/projects", 
        icon: FolderOpen,
        description: "Floorplans & brochures",
        badge: "Premium"
      },
      { 
        label: "My Listings", 
        href: "/dashboard/listings", 
        icon: FileText,
        description: "Assignment marketplace"
      },
    ],
  },
  {
    label: "Account",
    items: [
      { 
        label: "Profile", 
        href: "/dashboard/profile", 
        icon: User,
        description: "License & settings"
      },
    ],
  },
];

export function DashboardLayout({ children, noPadding }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fullName, setFullName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).single()
        .then(({ data }) => {
          if (data?.full_name) setFullName(data.full_name);
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        });
    });
    });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Premium Top Header */}
      <header className="sticky top-0 z-[60] bg-background/80 backdrop-blur-xl border-b border-border/50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex h-14 md:h-16 items-center justify-between px-3 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary-foreground" />
              </div>
              <span className="text-lg md:text-xl font-bold tracking-tight">
                Agent<span className="text-primary">Hub</span>
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-8 px-2 md:px-3">
                  <Shield className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
            )}
            <Link to="/">
              <Button variant="ghost" size="sm" className="h-8 px-2 md:px-3">
                <Home className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Site</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-8 px-2 md:px-3">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Premium Sidebar - Desktop */}
        <aside className="hidden md:flex w-72 flex-col border-r border-border/50 bg-gradient-to-b from-background to-muted/10">
          {/* User Info Card */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold">
                {(fullName || user?.email || "A").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fullName || user?.email?.split("@")[0]}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 py-1.5">
                  {section.label}
                </p>
                <div className="space-y-0.5 mt-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                        isActive(item.href)
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        isActive(item.href) 
                          ? "bg-primary-foreground/20" 
                          : "bg-muted group-hover:bg-background"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className={cn(
                          "text-xs truncate",
                          isActive(item.href) ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity",
                        isActive(item.href) && "opacity-100"
                      )} />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          
          {/* Quick Help */}
          <div className="p-4 border-t border-border/50">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <p className="text-sm font-medium mb-1">Need Help?</p>
              <p className="text-xs text-muted-foreground mb-3">
                Get support or learn how to maximize your listings.
              </p>
              <Button size="sm" variant="outline" className="w-full text-xs">
                Contact Support
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-14 z-50 md:hidden">
            <div 
              className="fixed inset-0 top-14 bg-background/60 backdrop-blur-sm" 
              onClick={() => setMobileMenuOpen(false)} 
            />
            <nav className="fixed left-0 top-14 bottom-0 w-72 bg-background border-r border-border/50 overflow-y-auto shadow-xl">
              {/* Mobile User Card */}
              <div className="p-3 border-b border-border/30">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {(fullName || user?.email || "A").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fullName || user?.email?.split("@")[0]}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-2 space-y-3">
                {navSections.map((section) => (
                  <div key={section.label}>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 py-1">
                      {section.label}
                    </p>
                    <div className="space-y-0.5 mt-1">
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                            isActive(item.href)
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <item.icon className="h-[18px] w-[18px] shrink-0" />
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </nav>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {noPadding ? children : (
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
