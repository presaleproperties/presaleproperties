import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, ShieldCheck, TrendingUp, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PowerSearch } from "@/components/search/PowerSearch";
import heroImage from "@/assets/hero-lifestyle.jpg";

const projectCities = ["Vancouver", "Surrey", "Langley", "Coquitlam", "Abbotsford"];

export type SearchTab = "projects" | "resale";

interface HeroSectionProps {
  activeTab?: SearchTab;
  onTabChange?: (tab: SearchTab) => void;
}

const STATS = [
  { icon: TrendingUp, value: "$200M+", label: "In Transactions" },
  { icon: Award, value: "400+", label: "Homes Sold" },
  { icon: Users, value: "15+", label: "Years Experience" },
  { icon: ShieldCheck, value: "5.0★", label: "Google Rating" },
];

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
    <section className="relative flex flex-col" style={{ minHeight: "calc(100vh - 72px)" }}>
      {/* Background Image */}
      <img
        src={heroImage}
        alt="Luxury presale homes Metro Vancouver"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
        decoding="sync"
        fetchPriority="high"
      />

      {/* Layered Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/6 via-transparent to-primary/4" />

      {/* Main Hero Content — vertically centered in upper 80% */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="container px-4 sm:px-6 py-12 sm:py-16 md:py-20">
          <div className="max-w-2xl xl:max-w-3xl space-y-5 sm:space-y-6">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/40 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Metro Vancouver's Presale Experts
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-[38px] sm:text-5xl md:text-6xl lg:text-[68px] font-extrabold tracking-tight text-white leading-[1.06] drop-shadow-2xl">
              Find Your Next{" "}
              <span className="relative inline-block text-primary drop-shadow-[0_0_40px_hsl(40_65%_55%/0.5)]">
                New Home
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/60 rounded-full" />
              </span>
              <br className="hidden sm:block" />{" "}
              <span className="text-white/90">in Metro Vancouver</span>
            </h1>

            <p className="text-base sm:text-lg text-white/75 font-medium max-w-xl leading-relaxed">
              Expert guidance on presale condos, townhomes & new construction — at no extra cost.
            </p>

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleTabChange("projects")}
                className={`px-5 sm:px-6 py-2.5 rounded-sm text-sm font-semibold transition-all duration-300 border ${
                  activeTab === "projects"
                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-transparent border-white/30 text-white/70 hover:border-white/50 hover:text-white"
                }`}
              >
                Presale
              </button>
              <button
                onClick={() => handleTabChange("resale")}
                className={`px-5 sm:px-6 py-2.5 rounded-sm text-sm font-semibold transition-all duration-300 border ${
                  activeTab === "resale"
                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-transparent border-white/30 text-white/70 hover:border-white/50 hover:text-white"
                }`}
              >
                Move-In Ready
              </button>
              <Link
                to={activeTab === "projects" ? "/map-search?mode=presale" : "/map-search?mode=resale"}
                className="inline-flex items-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-sm text-sm font-semibold transition-all duration-300 border bg-transparent border-white/30 text-white/70 hover:border-white/50 hover:text-white"
              >
                <MapPin className="h-4 w-4" />
                Map
              </Link>
            </div>

            {/* Search Bar */}
            <div className="flex items-stretch gap-0 max-w-2xl w-full shadow-2xl">
              <div className="flex-1 bg-white rounded-l-lg overflow-visible">
                <PowerSearch
                  placeholder={activeTab === "projects" ? "Area, project or community…" : "Address, MLS#, city, neighbourhood…"}
                  mode={activeTab === "projects" ? "presale" : "resale"}
                  variant="hero"
                  inputClassName="h-12 sm:h-14 text-sm sm:text-base border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 rounded-l-lg rounded-r-none"
                />
              </div>
              <Button
                size="lg"
                className="h-12 sm:h-14 px-5 sm:px-8 rounded-l-none rounded-r-lg text-sm sm:text-base font-semibold shadow-none flex-shrink-0"
                onClick={() => navigate(activeTab === "projects" ? "/presale-projects" : "/properties")}
              >
                Search
              </Button>
            </div>

            {/* City pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white/40 text-xs uppercase tracking-wider font-medium">Quick:</span>
              {projectCities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCityClick(city)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:text-white transition-all backdrop-blur-sm"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar — pinned at bottom of hero */}
      <div className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-md">
        <div className="container px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
            {STATS.map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center py-4 sm:py-5 gap-0.5 sm:gap-1 px-3">
                <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-primary leading-none tracking-tight">
                  {stat.value}
                </span>
                <span className="text-[10px] sm:text-xs text-white/55 font-medium uppercase tracking-wider text-center leading-tight">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
