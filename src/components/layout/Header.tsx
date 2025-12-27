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
            Assignment<span className="text-primary">Hub</span>
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
          <Link to="/contact">
            <Button size="sm" className="shadow-gold">
              <Phone className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Contact Us</span>
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
              className="w-[280px] sm:w-[320px] p-0 border-l border-border/50"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-border/50">
                  <span className="text-lg font-bold tracking-tight">
                    Assignment<span className="text-primary">Hub</span>
                  </span>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-6">
                  <div className="flex flex-col gap-1">
                    {navLinks.map((link, index) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setOpen(false)}
                        className={`group flex items-center gap-3 px-4 py-3.5 rounded-lg text-base font-medium transition-all duration-200 hover:bg-muted/80 active:scale-[0.98] ${
                          link.highlight 
                            ? "text-primary bg-primary/5 hover:bg-primary/10" 
                            : "text-foreground"
                        }`}
                        style={{
                          animationDelay: `${index * 50}ms`,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 group-hover:opacity-100 transition-opacity" />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </nav>

                {/* Footer Actions */}
                <div className="p-6 border-t border-border/50 bg-muted/30">
                  <Link to="/login" onClick={() => setOpen(false)} className="block">
                    <Button variant="outline" className="w-full h-12 text-base font-medium">
                      Agent Login
                    </Button>
                  </Link>
                  <Link to="/contact" onClick={() => setOpen(false)} className="block mt-3">
                    <Button className="w-full h-12 text-base font-medium shadow-gold">
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