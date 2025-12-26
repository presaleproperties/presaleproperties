import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">
            Assignment<span className="text-primary">Hub</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/assignments"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Assignments
          </Link>
          <Link
            to="/how-it-works"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </Link>
          <Link
            to="/about"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              Agent Login
            </Button>
          </Link>
          <Button size="sm" className="shadow-gold">
            <Phone className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Contact Us</span>
          </Button>
        </div>
      </div>
    </header>
  );
}