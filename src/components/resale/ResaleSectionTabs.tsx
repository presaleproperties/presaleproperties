import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Images, FileText, Calculator, GraduationCap, MapPin } from "lucide-react";

interface Section {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ResaleSectionTabsProps {
  photoCount?: number;
  onPhotoClick?: () => void;
}

const sections: Section[] = [
  { id: "overview", label: "Overview" },
  { id: "details", label: "Details", icon: FileText },
  { id: "calculator", label: "Calculator", icon: Calculator },
  { id: "location", label: "Location", icon: MapPin },
];

export function ResaleSectionTabs({ photoCount = 0, onPhotoClick }: ResaleSectionTabsProps) {
  const [activeSection, setActiveSection] = useState("overview");
  const [isSticky, setIsSticky] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-1px 0px 0px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 120;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const element = sectionElements[i];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 110;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      {/* Sentinel for intersection observer */}
      <div ref={sentinelRef} className="h-0" />
      
      <div
        ref={tabsRef}
        className={cn(
          "bg-background border-b transition-shadow duration-200 lg:hidden z-40",
          isSticky && "sticky top-[56px] shadow-md"
        )}
      >
        <nav className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
          {/* Photos button - special styling */}
          {photoCount > 0 && (
            <button
              onClick={onPhotoClick}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors border-r"
            >
              <Images className="h-4 w-4" />
              {photoCount} Photos
            </button>
          )}
          
          {/* Section tabs */}
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2",
                  activeSection === section.id
                    ? "text-primary border-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
