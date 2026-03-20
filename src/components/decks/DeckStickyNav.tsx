import { useState } from "react";
import { cn } from "@/lib/utils";
import { Phone, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "floor-plans", label: "Floor Plans" },
  { id: "gallery", label: "Gallery" },
  { id: "location", label: "Location" },
  { id: "deposit-timeline", label: "Deposits" },
  { id: "projections", label: "Calculator" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];

interface DeckStickyNavProps {
  visible: boolean;
  activeSection: string;
  projectName: string;
  phoneNumber?: string;
}

export function DeckStickyNav({ visible, activeSection, phoneNumber }: DeckStickyNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const rawPhone = (phoneNumber || "17782313592").replace(/\D/g, "");

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const NAV_HEIGHT = 68; // px — accounts for the fixed nav bar
      const top = el.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
  };

  return (
    <>
      {/* Desktop + tablet nav */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          "bg-background border-b border-border/70 shadow-[0_2px_12px_-2px_hsl(var(--foreground)/0.08)]",
          visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        )}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          willChange: "transform",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4 overflow-visible">
          {/* Logo — oversized but clipped by nav height */}
          <Logo size="lg" className="h-[7rem] sm:h-[8rem] shrink-0" />

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                  activeSection === s.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/65 hover:text-foreground hover:bg-muted"
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>

          {/* Right: Call Now + mobile hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:+${rawPhone}`}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-lg text-[13px] sm:text-sm font-bold bg-primary text-primary-foreground touch-manipulation transition-all active:scale-[0.97] hover:bg-primary/90"
            >
              <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>Call Now</span>
            </a>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-border/60 bg-muted/50 text-foreground transition-colors hover:bg-muted active:scale-95 touch-manipulation"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-250 ease-in-out border-t border-border/50",
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="bg-background px-4 py-4 grid grid-cols-2 gap-2">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-medium text-left transition-all touch-manipulation",
                  activeSection === s.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground bg-muted/60 hover:bg-muted active:scale-[0.97]"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
