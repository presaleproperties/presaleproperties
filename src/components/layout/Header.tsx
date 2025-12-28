import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { to: "/presale-projects", label: "Presale Projects" },
    { to: "/assignments", label: "Assignments" },
    { to: "/blog", label: "Blog" },
    { to: "/agents", label: "For Agents", highlight: true },
  ];

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
              <Button variant="ghost" size="icon" className="shrink-0 relative">
                <span className="sr-only">Toggle menu</span>
                <Menu className={`h-5 w-5 absolute transition-all duration-300 ${open ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`} />
                <X className={`h-5 w-5 absolute transition-all duration-300 ${open ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`} />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[260px] p-0 border-l border-border/30"
            >
              <div className="flex flex-col h-full">
                {/* Navigation Links */}
                <nav className="flex-1 py-4 px-3">
                  <div className="flex flex-col">
                    {navLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setOpen(false)}
                        className={`px-3 py-2.5 text-sm font-medium transition-colors ${
                          link.highlight 
                            ? "text-primary" 
                            : "text-foreground/80 hover:text-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border/30">
                  <Link to="/login" onClick={() => setOpen(false)} className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm font-medium">
                      Agent Login
                    </Button>
                  </Link>
                  <Link to="/contact" onClick={() => setOpen(false)} className="block mt-1">
                    <Button size="sm" className="w-full text-sm font-medium">
                      <Phone className="h-3.5 w-3.5 mr-1.5" />
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