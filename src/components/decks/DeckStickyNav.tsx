import { useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

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
  whatsappNumber?: string;
  projectNameForWa?: string;
}

export function DeckStickyNav({ visible, activeSection, projectName, whatsappNumber, projectNameForWa }: DeckStickyNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const rawNumber = (whatsappNumber || "17782313592").replace(/\D/g, "");
  const waMessage = encodeURIComponent(`Hi! I'm interested in ${projectNameForWa || projectName} — can you share details?`);

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
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo — same as main site */}
          <Logo size="md" />

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

          {/* Right: WhatsApp CTA + project name + mobile toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://wa.me/${rawNumber}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white touch-manipulation transition-all active:scale-[0.97]"
              style={{ background: "#25D366" }}
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              Text Us
            </a>
            <span className="hidden lg:block text-xs font-medium text-muted-foreground max-w-[140px] truncate">
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
