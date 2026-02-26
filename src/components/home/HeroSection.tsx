import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PowerSearch } from "@/components/search/PowerSearch";
import heroImage from "@/assets/hero-lifestyle.jpg";

const projectCities = ["Vancouver", "Surrey", "Langley", "Coquitlam", "Abbotsford", "Burnaby"];

export type SearchTab = "projects" | "resale";

interface HeroSectionProps {
  activeTab?: SearchTab;
  onTabChange?: (tab: SearchTab) => void;
}

const FEATURE_BAR = [
  { icon: "🔍", value: "Search Presale Projects", label: "111 active listings across Metro Vancouver" },
  { icon: "📄", value: "Brochures & Floor Plans", label: "Instant access — no waiting" },
  { icon: "🏗️", value: "Exclusive Developer Inventory", label: "Off-market releases before public launch" },
  { icon: "🏠", value: "Move-In Ready Homes", label: "Brand new — never lived in" },
  { icon: "👤", value: "Hire a Presale Expert", label: "Expert guidance at no cost to you" },
];

function VIPModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ firstName: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">You're In!</h2>
            <p className="text-sm text-muted-foreground">Check your inbox — VIP access details are on the way.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Get VIP Presale Access</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Be first to see pricing, floor plans and off-market assignments before they go public.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                required
                placeholder="First Name"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                type="tel"
                placeholder="Phone Number (optional)"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button
                type="submit"
                className="w-full h-11 rounded-full font-bold text-sm"
              >
                Get Instant Access
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">No spam. Unsubscribe anytime.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export function HeroSection({
  activeTab: controlledTab,
  onTabChange
}: HeroSectionProps) {
  const [internalTab, setInternalTab] = useState<SearchTab>("projects");
  const [modalOpen, setModalOpen] = useState(false);
  const activeTab = controlledTab ?? internalTab;
  const navigate = useNavigate();

  const handleTabChange = (tab: SearchTab) => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };

  const handleCityClick = (city: string) => {
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    if (activeTab === "projects") navigate(`/${citySlug}-presale-condos`);
    else navigate(`/properties/${citySlug}`);
  };

  return (
    <>
      {/* Hero Section — centered REW-style layout */}
      <section className="relative flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 72px)" }}>
        {/* Background Image */}
        <img
          src={heroImage}
          alt="Luxury presale homes Metro Vancouver"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />

        {/* Centered Content */}
        <div className="relative z-10 w-full flex flex-col items-center px-4 sm:px-6 py-16">
          {/* Eyebrow */}
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-white/60 mb-4 text-center">
            Metro Vancouver's Presale-Exclusive Platform
          </p>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white text-center leading-[1.05] tracking-tight mb-4 max-w-4xl drop-shadow-2xl">
            New Homes.{" "}
            <span className="text-primary">Exclusive Access.</span>
          </h1>

          {/* Subheadline — hidden on mobile */}
          <p className="hidden sm:block text-base sm:text-lg text-white/65 text-center max-w-xl mb-6 leading-relaxed">
            Presale condos, move-in ready homes &amp; off-market developer inventory — all in one place.
          </p>

          {/* Key feature pills — instant downloads */}
          <div className="hidden sm:flex items-center gap-2.5 flex-wrap justify-center mb-8">
            {[
              { icon: "📄", label: "Instant Floor Plan Download" },
              { icon: "💰", label: "Instant Pricing Sheet Download" },
              { icon: "🏗️", label: "Off-Market Developer Inventory" },
            ].map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/12 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold"
              >
                <span>{f.icon}</span>
                {f.label}
              </span>
            ))}
          </div>

          {/* Search Bar — REW-style single pill */}
          <div className="w-full max-w-2xl">
            <div className="flex items-center bg-white rounded-full shadow-2xl overflow-visible h-[60px] sm:h-[68px]">
              {/* Tab switcher — left side of pill */}
              <div className="flex items-center shrink-0 pl-2 gap-1">
                <button
                  onClick={() => handleTabChange("projects")}
                  className={`px-4 sm:px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === "projects"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Presale
                </button>
                <button
                  onClick={() => handleTabChange("resale")}
                  className={`px-4 sm:px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === "resale"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Move-In Ready
                </button>
              </div>

              {/* Vertical divider */}
              <div className="w-px h-7 bg-border mx-2 shrink-0" />

              {/* Search input — middle */}
              <div className="flex-1 overflow-visible min-w-0">
                <PowerSearch
                  placeholder={activeTab === "projects" ? "City, project or neighbourhood…" : "Address, MLS#, city…"}
                  mode={activeTab === "projects" ? "presale" : "resale"}
                  variant="hero"
                  hideIcon
                  inputClassName="h-[60px] sm:h-[68px] text-sm border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 pl-3 rounded-none shadow-none"
                />
              </div>

              {/* Circular search button — right */}
              <button
                onClick={() => navigate(activeTab === "projects" ? "/presale-projects" : "/properties")}
                className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 mr-2 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/85 transition-colors"
                aria-label="Search"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Map link */}
          <Link
            to={activeTab === "projects" ? "/map-search?mode=presale" : "/map-search?mode=resale"}
            className="mt-3 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            or explore the map →
          </Link>

          {/* City pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center mt-6">
            <span className="text-white/40 text-xs uppercase tracking-wider font-medium">Top Cities:</span>
            {projectCities.map((city) => (
              <button
                key={city}
                onClick={() => handleCityClick(city)}
                className="text-xs px-3.5 py-1.5 rounded-full bg-white/10 border border-white/25 text-white/75 hover:bg-white/20 hover:text-white transition-all backdrop-blur-sm font-medium"
              >
                {city}
              </button>
            ))}
          </div>

          {/* VIP CTA — subtle below cities */}
          <button
            onClick={() => setModalOpen(true)}
            className="mt-5 text-xs text-primary font-semibold underline underline-offset-4 hover:text-primary/80 transition-colors"
          >
            Get VIP Access — It's Free →
          </button>
        </div>
      </section>

      {/* Feature Bar */}
      <div className="bg-[#111] border-b border-white/8">
        <div className="container px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 divide-white/10 md:divide-x">
            {FEATURE_BAR.map((f, i) => (
              <div
                key={i}
                className={`flex flex-col items-center justify-center py-5 sm:py-6 px-3 gap-1.5 text-center
                  ${i < 4 ? "border-b md:border-b-0 border-white/8" : ""}
                  ${i % 2 === 0 && i < 4 ? "border-r md:border-r-0 border-white/8" : ""}
                  ${i === 4 ? "col-span-2 md:col-span-1" : ""}
                `}
              >
                <span className="text-lg">{f.icon}</span>
                <span className="text-sm sm:text-base font-extrabold text-white leading-tight tracking-tight">
                  {f.value}
                </span>
                <span className="text-[10px] sm:text-[11px] text-primary font-semibold uppercase tracking-wider leading-tight">
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* VIP Modal */}
      {modalOpen && <VIPModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

