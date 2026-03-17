import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

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
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "bg-background/90 backdrop-blur-md border-b border-border/50",
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="shrink-0 flex items-center gap-2">
          <span className="text-base font-bold tracking-tight text-foreground">
            Presale<span className="text-primary">Properties</span>
          </span>
        </Link>

        {/* Section links — hidden on small mobile */}
        <nav className="hidden sm:flex items-center gap-1">
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

        {/* Project name */}
        <span className="shrink-0 text-sm font-semibold text-foreground/70 hidden lg:block max-w-[200px] truncate">
          {projectName}
        </span>
      </div>
    </div>
  );
}
