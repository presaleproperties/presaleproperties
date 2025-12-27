import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { to: "/assignments", label: "Assignments" },
    { to: "/how-it-works", label: "How It Works" },
    { to: "/about", label: "About" },
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
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={`text-lg font-medium py-2 transition-colors ${
                      link.highlight 
                        ? "text-primary" 
                        : "text-foreground hover:text-primary"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-2" />
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Agent Login
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}