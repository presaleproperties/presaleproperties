import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-lifestyle.jpg";

export type SearchTab = "projects" | "resale";

interface HeroSectionProps {
  activeTab?: SearchTab;
  onTabChange?: (tab: SearchTab) => void;
}

export function HeroSection({
  activeTab: controlledTab,
  onTabChange
}: HeroSectionProps) {
  const [internalTab, setInternalTab] = useState<SearchTab>("projects");
  const activeTab = controlledTab ?? internalTab;
  const navigate = useNavigate();

  const handleTabChange = (tab: SearchTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  return (
    <section className="relative min-h-[600px] sm:min-h-[640px] md:min-h-[720px] lg:min-h-[800px] flex items-end overflow-hidden">
      {/* Background Image */}
      <img
        src={heroImage}
        alt="Luxury presale homes"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
        decoding="sync"
        fetchPriority="high"
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

      {/* Content — left-aligned, bottom-weighted */}
      <div className="container relative z-10 pb-16 sm:pb-20 md:pb-24 lg:pb-28 pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-6 sm:space-y-8">
          {/* Category Pills */}
          <div className="flex items-center gap-2 sm:gap-3 animate-fade-in">
            <button
              onClick={() => handleTabChange("projects")}
              className={`px-5 sm:px-6 py-2.5 rounded-sm text-xs sm:text-sm font-semibold tracking-widest uppercase transition-all duration-300 border ${
                activeTab === "projects"
                  ? "bg-white/15 backdrop-blur-sm text-white border-white/40"
                  : "bg-transparent text-white/70 border-white/20 hover:border-white/40 hover:text-white"
              }`}
            >
              Presale
            </button>
            <button
              onClick={() => handleTabChange("resale")}
              className={`px-5 sm:px-6 py-2.5 rounded-sm text-xs sm:text-sm font-semibold tracking-widest uppercase transition-all duration-300 border ${
                activeTab === "resale"
                  ? "bg-white/15 backdrop-blur-sm text-white border-white/40"
                  : "bg-transparent text-white/70 border-white/20 hover:border-white/40 hover:text-white"
              }`}
            >
              Move-In Ready
            </button>
          </div>

          {/* Heading */}
          <h1
            className="font-serif text-[40px] sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.1] animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Find Your{" "}
            <span className="text-primary italic">New</span>
            <br />
            Home
          </h1>

          {/* Subheadline */}
          <p
            className="text-white/75 text-base sm:text-lg md:text-xl max-w-xl leading-relaxed animate-fade-in"
            style={{ animationDelay: "0.15s" }}
          >
            Search presale & move-in ready homes across Metro Vancouver.
            Expert guidance at no extra cost.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <Button
              size="lg"
              className="gap-2 text-sm sm:text-base px-6 sm:px-8 py-3 h-auto"
              onClick={() =>
                navigate(
                  activeTab === "projects"
                    ? "/presale-projects"
                    : "/properties"
                )
              }
            >
              Browse {activeTab === "projects" ? "Projects" : "Listings"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Link
              to={
                activeTab === "projects"
                  ? "/map-search?mode=presale"
                  : "/map-search?mode=resale"
              }
              className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 border border-white/40 text-white text-sm sm:text-base font-medium hover:bg-white hover:text-foreground transition-all duration-300"
            >
              <MapPin className="h-4 w-4" />
              Explore Map
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom trust bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/30 z-20">
        <div className="container px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Expert guidance at no extra cost
            </span>
            <span className="hidden md:inline text-border">|</span>
            <span className="hidden md:inline">
              Vancouver's New Construction Marketplace
            </span>
          </div>
          <Link
            to={
              activeTab === "projects"
                ? "/presale-projects"
                : "/properties"
            }
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            View Exclusive Properties
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
