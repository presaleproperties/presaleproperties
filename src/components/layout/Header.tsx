import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X, Building2, FileStack, BookOpen, Users, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/presale-projects", label: "Presale Projects", icon: Building2 },
    { to: "/assignments", label: "Assignments", icon: FileStack },
    { to: "/blog", label: "Blog", icon: BookOpen },
    { to: "/agents", label: "For Agents", icon: Users, highlight: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
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
                link.highlight 
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

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="shrink-0">
                <span className="sr-only">Toggle menu</span>
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[280px] p-0 bg-background border-l-0 shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Navigation Links */}
                <nav className="flex-1 pt-8">
                  <div className="space-y-1 px-3">
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      const active = isActive(link.to);
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setOpen(false)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                            active 
                              ? "bg-primary/10 text-primary" 
                              : link.highlight
                                ? "text-primary hover:bg-primary/5"
                                : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                            <span className="text-[15px] font-medium">{link.label}</span>
                          </div>
                          <ChevronRight className={`h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 ${active ? "text-primary/50" : ""}`} />
                        </Link>
                      );
                    })}
                  </div>
                </nav>

                {/* Footer Actions */}
                <div className="p-4 space-y-2">
                  <Link to="/login" onClick={() => setOpen(false)} className="block">
                    <Button variant="outline" className="w-full h-11 font-medium">
                      Agent Login
                    </Button>
                  </Link>
                  <Link to="/contact" onClick={() => setOpen(false)} className="block">
                    <Button className="w-full h-11 font-medium">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}