import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PowerSearch } from "@/components/search/PowerSearch";
import heroImage from "@/assets/hero-lifestyle.jpg";

const projectCities = ["Vancouver", "Surrey", "Langley", "Coquitlam", "Abbotsford", "Burnaby"];

export type SearchTab = "projects" | "resale";

interface HeroSectionProps {
  activeTab?: SearchTab;
  onTabChange?: (tab: SearchTab) => void;
}

const TRUST_STATS = [
  { value: "111", label: "Active Projects" },
  { value: "450+", label: "Agent Network" },
  { value: "$200M+", label: "In Presale Sales" },
  { value: "5.0 ★", label: "Google Rating" },
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
    <>
      {/* Hero Section */}
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

        {/* Overlay — darkened for contrast */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

        {/* Main Hero Content */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="container px-4 sm:px-6 py-12 sm:py-16 md:py-20">
            <div className="max-w-2xl xl:max-w-3xl space-y-5 sm:space-y-6">

              {/* Top Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/50 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-widest text-white">
                  Vancouver's Only Presale-Exclusive Platform
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-[36px] sm:text-5xl md:text-6xl lg:text-[64px] font-extrabold tracking-tight text-white leading-[1.06] drop-shadow-2xl max-w-[90vw] sm:max-w-none">
                Access Presale Projects{" "}
                <span className="text-primary drop-shadow-[0_0_30px_hsl(40_65%_55%/0.5)]">
                  Before They Go Public
                </span>
              </h1>

              {/* Subheadline — hidden on mobile */}
              <p className="hidden sm:block text-base sm:text-lg text-white/70 font-medium max-w-xl leading-relaxed">
                111 active projects. Exclusive VIP pricing. Off-market assignments. One team that only does presale.
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
              </div>

              {/* Primary CTA — above search bar */}
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 sm:h-13 px-8 rounded-full text-base font-bold shadow-xl shadow-primary/30"
                  onClick={() => setModalOpen(true)}
                >
                  Get VIP Access — It's Free
                </Button>

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

                {/* Map text link — below search bar */}
                <div>
                  <Link
                    to={activeTab === "projects" ? "/map-search?mode=presale" : "/map-search?mode=resale"}
                    className="text-xs text-white/55 hover:text-white/80 transition-colors"
                  >
                    or explore the map →
                  </Link>
                </div>
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
      </section>

      {/* Trust Bar — full-width dark bar below hero */}
      <div className="bg-[#0d0d0d] border-b border-white/5">
        <div className="container px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
            {TRUST_STATS.map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center py-5 sm:py-6 gap-1 px-3">
                <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-none tracking-tight">
                  {stat.value}
                </span>
                <span className="text-[10px] sm:text-xs text-primary font-semibold uppercase tracking-wider text-center leading-tight">
                  {stat.label}
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
