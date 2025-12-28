import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X, Building2, FileText, Newspaper, Users, ChevronRight } from "lucide-react";

export function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const navLinks = [
    { to: "/presale-projects", label: "Presale Projects", icon: Building2, description: "New developments" },
    { to: "/assignments", label: "Assignments", icon: FileText, description: "Available units" },
    { to: "/blog", label: "Blog", icon: Newspaper, description: "News & insights" },
    { to: "/agents", label: "For Agents", icon: Users, description: "Partner with us", highlight: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold tracking-tight">
              presale<span className="text-primary">properties</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? "text-primary"
                    : link.highlight 
                      ? "text-primary hover:text-primary/80" 
                      : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Agent Login
              </Button>
            </Link>
            <Link to="/contact" className="hidden sm:block">
              <Button size="sm" className="shadow-gold">
                <Phone className="h-4 w-4 mr-2" />
                Contact Us
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden shrink-0 relative z-[60]"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              <Menu className={`h-5 w-5 absolute transition-all duration-300 ${open ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`} />
              <X className={`h-5 w-5 absolute transition-all duration-300 ${open ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div 
        className={`fixed top-16 left-0 right-0 bottom-0 z-50 bg-background lg:hidden transition-all duration-300 ease-out ${
          open ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Navigation Links */}
          <nav className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="flex flex-col gap-2">
              {navLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`group flex items-center gap-4 p-4 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                      isActive(link.to)
                        ? "bg-primary/10 border border-primary/20"
                        : link.highlight 
                          ? "bg-primary/5 hover:bg-primary/10 border border-primary/10" 
                          : "hover:bg-muted border border-transparent"
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                      isActive(link.to) 
                        ? "bg-primary text-primary-foreground" 
                        : link.highlight
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <span className={`block font-medium ${
                        isActive(link.to) || link.highlight ? "text-primary" : "text-foreground"
                      }`}>
                        {link.label}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {link.description}
                      </span>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${
                      isActive(link.to) ? "text-primary" : "text-muted-foreground"
                    }`} />
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 border-t border-border bg-muted/30 safe-bottom">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/login" className="flex-1">
                <Button variant="outline" className="w-full h-12 text-base font-medium">
                  Agent Login
                </Button>
              </Link>
              <Link to="/contact" className="flex-1">
                <Button className="w-full h-12 text-base font-medium shadow-gold">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
