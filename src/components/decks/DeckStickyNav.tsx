import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "floor-plans", label: "Floor Plans" },
  { id: "gallery", label: "Gallery" },
  { id: "location", label: "Location" },
  { id: "projections", label: "Projections" },
  { id: "contact", label: "Contact" },
];

interface DeckStickyNavProps {
  visible: boolean;
  activeSection: string;
  projectName: string;
}

export function DeckStickyNav({ visible, activeSection, projectName }: DeckStickyNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm",
          visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="shrink-0 flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-foreground">
              Presale<span className="text-primary">Properties</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  activeSection === s.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>

          {/* Right: project name + mobile toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden lg:block text-xs font-medium text-muted-foreground max-w-[160px] truncate">
              {projectName}
            </span>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/98 px-4 py-3 grid grid-cols-3 gap-2">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={cn(
                  "py-2 px-2 rounded-lg text-xs font-medium transition-all text-center",
                  activeSection === s.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
