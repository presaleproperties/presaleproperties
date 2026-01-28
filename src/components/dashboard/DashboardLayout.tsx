import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAgentVerification } from "@/hooks/useAgentVerification";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ContactSupportModal } from "./ContactSupportModal";
import { 
  LayoutDashboard, 
  Users, 
  User, 
  LogOut,
  Menu,
  X,
  Home,
  CreditCard,
  Shield,
  ChevronRight,
  Sparkles,
  MessageSquare,
  FileText,
  FolderOpen,
  CheckCircle,
  Clock,
  Map,
  HelpCircle,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { 
    label: "Overview", 
    href: "/dashboard", 
    icon: LayoutDashboard,
    description: "Your dashboard home"
  },
  { 
    label: "Project Documents", 
    href: "/dashboard/projects", 
    icon: FolderOpen,
    description: "Floorplans & brochures",
    badge: "Premium"
  },
  { 
    label: "My Listings", 
    href: "/dashboard/listings", 
    icon: FileText,
    description: "Manage your listings"
  },
  { 
    label: "Messages", 
    href: "/dashboard/messages", 
    icon: MessageSquare,
    description: "Agent-to-agent inbox"
  },
  { 
    label: "Billing", 
    href: "/dashboard/billing", 
    icon: CreditCard,
    description: "Subscription & payments"
  },
  { 
    label: "Profile", 
    href: "/dashboard/profile", 
    icon: User,
    description: "Account settings"
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, isAdmin } = useAuth();
  const { isVerifiedAgent } = useAgentVerification();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

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
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Agent<span className="text-primary">Hub</span>
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                  <Shield className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
            )}
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Site</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
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
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email?.split("@")[0]}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                {isVerifiedAgent ? (
                  <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0 h-4 text-green-600 border-green-500/30 bg-green-500/10">
                    <CheckCircle className="h-2.5 w-2.5 mr-1" />
                    Verified Agent
                  </Badge>
                ) : (
                  <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0 h-4 text-amber-600 border-amber-500/30 bg-amber-500/10">
                    <Clock className="h-2.5 w-2.5 mr-1" />
                    Pending Verification
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
              Menu
            </p>
            {navItems.map((item) => (
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
          </nav>
          
          {/* Browse Marketplace Link */}
          <div className="p-4 border-t border-border/50">
            <Link to="/map-search?mode=assignments" className="block">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                    <Map className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Browse Marketplace</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Find assignments on the interactive map
                </p>
              </div>
            </Link>
          </div>

          {/* Quick Help */}
          <div className="p-4 border-t border-border/50">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-sm font-medium mb-1">Need Help?</p>
              <p className="text-xs text-muted-foreground mb-3">
                Get support or learn how to maximize your listings.
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full text-xs gap-2"
                onClick={() => setSupportModalOpen(true)}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Contact Support
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-16 z-40 md:hidden">
            <div 
              className="fixed inset-0 bg-background/80 backdrop-blur-sm" 
              onClick={() => setMobileMenuOpen(false)} 
            />
            <nav className="fixed left-0 top-16 bottom-0 w-72 bg-background border-r border-border p-4 space-y-1 overflow-y-auto">
              {/* Mobile User Card */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.email?.split("@")[0]}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  {isVerifiedAgent ? (
                    <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0 h-4 text-green-600 border-green-500/30 bg-green-500/10">
                      <CheckCircle className="h-2.5 w-2.5 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0 h-4 text-amber-600 border-amber-500/30 bg-amber-500/10">
                      <Clock className="h-2.5 w-2.5 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>

              {/* Browse Marketplace Mobile */}
              <Link 
                to="/map-search?mode=assignments" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 mb-4 text-sm bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
              >
                <Map className="h-5 w-5 text-primary" />
                <span className="font-medium text-primary">Browse Marketplace</span>
              </Link>

              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Support Modal */}
      <ContactSupportModal 
        open={supportModalOpen} 
        onOpenChange={setSupportModalOpen} 
      />
    </div>
  );
}
