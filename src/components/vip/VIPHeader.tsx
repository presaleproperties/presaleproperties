import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export const VIPHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToForm = () => {
    document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Presale Properties" className="h-8 md:h-10" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/presale-projects" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Projects
            </Link>
            <Link to="/about" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>

          <div className="hidden md:block">
            <Button onClick={scrollToForm} className="bg-primary text-primary-foreground font-semibold">
              Claim $1,500 Credit
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border py-4">
            <nav className="flex flex-col gap-4">
              <Link to="/" className="px-4 py-2 text-foreground hover:bg-muted rounded-lg">Home</Link>
              <Link to="/presale-projects" className="px-4 py-2 text-foreground hover:bg-muted rounded-lg">Projects</Link>
              <Link to="/about" className="px-4 py-2 text-foreground hover:bg-muted rounded-lg">About</Link>
              <Link to="/contact" className="px-4 py-2 text-foreground hover:bg-muted rounded-lg">Contact</Link>
              <div className="px-4 pt-2">
                <Button onClick={scrollToForm} className="w-full bg-primary text-primary-foreground">
                  Claim $1,500 Credit
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
