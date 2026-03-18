import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "floor-plans", label: "Floor Plans" },
  { id: "gallery", label: "Gallery" },
  { id: "location", label: "Location" },
  { id: "projections", label: "Calculator" },
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
  const rawNumber = (whatsappNumber || "17782313592").replace(/\D/g, "");
  const waMessage = encodeURIComponent(`Hi! I'm interested in ${projectNameForWa || projectName} — can you share details?`);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={cn(
        "hidden lg:block fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm",
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        transform: visible ? "translateZ(0)" : "translateY(-100%) translateZ(0)",
        willChange: "transform",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo — larger */}
        <Logo size="md" />

        {/* Nav links */}
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

        {/* Right: Text Us only */}
        <a
          href={`https://wa.me/${rawNumber}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white touch-manipulation transition-all active:scale-[0.97]"
          style={{ background: "#25D366" }}
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          Text Us
        </a>
      </div>
    </div>
  );
}
