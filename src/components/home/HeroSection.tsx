import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, ShieldCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PowerSearch } from "@/components/search/PowerSearch";
import heroImage from "@/assets/hero-lifestyle.jpg";

const projectCities = ["Vancouver", "Surrey", "Langley", "Coquitlam", "Abbotsford"];
const resaleCities = ["Vancouver", "Surrey", "Langley", "Coquitlam", "Abbotsford"];

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

  const handleCityClick = (city: string) => {
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    if (activeTab === "projects") {
      navigate(`/${citySlug}-presale-condos`);
    } else {
      navigate(`/properties/${citySlug}`);
    }
  };

  return (
    <section className="relative h-[calc(100vh-72px)] min-h-[520px] max-h-[900px] flex items-end overflow-hidden">
      {/* Background Image */}
      <img
        src={heroImage}
        alt="Luxury presale homes"
        className="absolute inset-0 w-full h-full object-cover scale-105"
        loading="eager"
        decoding="sync"
        fetchPriority="high"
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/8 via-transparent to-primary/5" />

      {/* Content — left-aligned, bottom-anchored */}
      <div className="container relative z-10 px-4 pb-8 sm:pb-10 md:pb-12 lg:pb-14">
        <div className="max-w-3xl space-y-5 sm:space-y-6 md:space-y-8">
          {/* Heading */}
          <h1
            className="text-[40px] sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] drop-shadow-2xl"
          >
            Find Your{" "}
            <span className="text-primary drop-shadow-[0_0_40px_hsl(40_65%_55%/0.6)] relative">
              New
              <span className="absolute -inset-1 bg-primary/10 blur-2xl -z-10" />
            </span>{" "}
            Home.
          </h1>

          {/* Tabs — pill-style, inline */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => handleTabChange("projects")}
              className={`px-5 sm:px-6 py-2.5 rounded-sm text-sm font-semibold transition-all duration-300 border ${
                activeTab === "projects"
                  ? "bg-white/20 border-white/60 text-white"
                  : "bg-transparent border-white/30 text-white/70 hover:border-white/50 hover:text-white"
              }`}
            >
              Presale
            </button>
            <button
              onClick={() => handleTabChange("resale")}
              className={`px-5 sm:px-6 py-2.5 rounded-sm text-sm font-semibold transition-all duration-300 border ${
                activeTab === "resale"
                  ? "bg-white/20 border-white/60 text-white"
                  : "bg-transparent border-white/30 text-white/70 hover:border-white/50 hover:text-white"
              }`}
            >
              Move-In Ready
            </button>
            <Link
              to={activeTab === "projects" ? "/map-search?mode=presale" : "/map-search?mode=resale"}
              className={`px-5 sm:px-6 py-2.5 rounded-sm text-sm font-semibold transition-all duration-300 border bg-transparent border-white/30 text-white/70 hover:border-white/50 hover:text-white`}
            >
              Map
            </Link>
          </div>

          {/* Search Bar — wide, single row */}
          <div className="flex items-center gap-0 max-w-2xl">
            <div className="flex-1 bg-white rounded-l-lg">
              <PowerSearch
                placeholder={activeTab === "projects" ? "Area, project or community" : "Address, MLS#, city, neighbourhood..."}
                mode={activeTab === "projects" ? "presale" : "resale"}
                variant="hero"
                inputClassName="h-12 sm:h-14 text-base sm:text-lg border-0 bg-white text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 rounded-l-lg rounded-r-none"
              />
            </div>
            <Button
              size="lg"
              className="h-12 sm:h-14 px-6 sm:px-8 rounded-l-none rounded-r-lg shadow-xl shadow-primary/30 text-sm sm:text-base font-semibold"
              onClick={() => {
                if (activeTab === "projects") {
                  navigate("/presale-projects");
                } else {
                  navigate("/properties");
                }
              }}
            >
              Search
            </Button>
          </div>

          {/* Trust stats — inline */}
          <div className="flex items-center gap-3 sm:gap-4 text-white/70 text-sm font-medium flex-wrap">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Expert guidance at no extra cost
            </span>
            <span className="text-white/30">·</span>
            <span>400+ Homes Sold</span>
            <span className="text-white/30">·</span>
            <span>$200M+ In Transactions</span>
          </div>
        </div>
      </div>
    </section>
  );
}
