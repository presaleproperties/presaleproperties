import { ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DeveloperSidebar } from "./DeveloperSidebar";
import { Button } from "@/components/ui/button";
import { Menu, X, Building2, LogOut } from "lucide-react";

interface DeveloperPortalLayoutProps {
  children: ReactNode;
}

export function DeveloperPortalLayout({ children }: DeveloperPortalLayoutProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/developer-portal");
  };

  return (
    <div className="min-h-screen flex bg-muted/20">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DeveloperSidebar />
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0">
            <DeveloperSidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-background border-b sticky top-0 z-40">
          <button onClick={() => setMobileOpen(true)} className="p-1">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#C8A951]" />
            <span className="font-semibold text-sm">Developer Portal</span>
          </div>
          <button onClick={handleSignOut} className="p-1">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
