import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { X, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PowerSearch } from "@/components/search/PowerSearch";
import { HeroProjectSlider } from "./HeroProjectSlider";
import { supabase } from "@/integrations/supabase/client";

const projectCities = ["Vancouver", "Surrey", "Langley", "Coquitlam", "Abbotsford", "Burnaby"];

export type SearchTab = "projects" | "resale";

interface HeroSectionProps {
  activeTab?: SearchTab;
  onTabChange?: (tab: SearchTab) => void;
}

const TRUST_STATS = [
  { value: "111", label: "Active Projects" },
  { value: "450+", label: "Presale Properties Sold" },
  { value: "$200M+", label: "In Presale Sales" },
  { value: "5.0 ★", label: "Google Rating" },
];

function VIPModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ firstName: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { error: dbError } = await supabase.from("vip_registrations").insert({
        first_name: form.firstName,
        email: form.email,
        phone: form.phone || null,
        source: "hero_vip_modal",
        utm_source: new URLSearchParams(window.location.search).get("utm_source"),
        utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
        utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
        landing_page: window.location.pathname,
      });
      if (dbError) throw dbError;
      setSubmitted(true);
    } catch (err) {
      console.error("VIP form error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
                disabled={isSubmitting}
                className="w-full h-11 rounded-full font-bold text-sm"
              >
                {isSubmitting ? "Submitting..." : "Get Instant Access"}
              </Button>
              {error && <p className="text-center text-xs text-red-500">{error}</p>}
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
  const searchBarRef = useRef<HTMLDivElement>(null);
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
      {/* Hero Section — minimal premium */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden" style={{ minHeight: "calc(100dvh - 72px)" }}>
        {/* Auto-scrolling project slider as background */}
        <HeroProjectSlider />
        {/* Fallback overlay for when slider loads */}
        <div className="absolute inset-0 bg-black/10 z-[2] pointer-events-none" />

        {/* Centered Content */}
        <div className="relative z-[5] w-full flex flex-col items-center px-5 sm:px-8" style={{ paddingTop: "clamp(32px, 6vh, 72px)" }}>



          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-[4.8rem] font-extrabold text-white text-center leading-[1.05] tracking-tight mb-3 max-w-3xl" style={{ textShadow: "0 2px 40px rgba(0,0,0,0.6)" }}>
            Find New{" "}
            <span className="text-primary" style={{ textShadow: "0 0 40px hsl(40 65% 55% / 0.5)" }}>Homes.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-white/75 text-base md:text-lg text-center max-w-xl mb-6 leading-relaxed flex items-center justify-center gap-2" style={{ textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}>
            <MapPin className="w-4 h-4 text-primary shrink-0" strokeWidth={2.5} />
            Metro Vancouver
          </p>

          {/* Search Bar — glassmorphism premium */}
          <div className="relative z-[10] w-full max-w-2xl">
            <div ref={searchBarRef} className="relative flex items-center bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] overflow-visible h-[72px] border border-white/40">
              {/* Tab switcher */}
              <div className="flex items-center shrink-0 pl-2 gap-1">
                <button
                  onClick={() => handleTabChange("projects")}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === "projects"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Presale
                </button>
                <button
                  onClick={() => handleTabChange("resale")}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === "resale"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Move-In Ready
                </button>
              </div>

              {/* Vertical divider */}
              <div className="w-px h-7 bg-border/60 mx-2 shrink-0" />

              {/* Search input */}
              <div className="flex-1 overflow-visible min-w-0">
                <PowerSearch
                  placeholder={activeTab === "projects" ? "City, project or neighbourhood…" : "Address, MLS#, city…"}
                  mode={activeTab === "projects" ? "presale" : "resale"}
                  variant="hero"
                  hideIcon
                  dropdownContainer={searchBarRef}
                  inputClassName="h-[72px] text-sm border-0 bg-transparent text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0 pl-3 rounded-none shadow-none"
                />
              </div>

              {/* Search button — gold accent */}
              <button
                onClick={() => navigate(activeTab === "projects" ? "/presale-projects" : "/properties")}
                className="shrink-0 w-12 h-12 mr-2 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all shadow-md"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CTAs */}
          <div className="relative z-[1] flex flex-wrap items-center justify-center gap-3 mt-5">
            <Link
              to={activeTab === "projects" ? "/map-search?mode=presale" : "/map-search?mode=resale"}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 text-white text-sm font-semibold hover:bg-black/65 active:scale-95 transition-all shadow-lg"
            >
              <MapPin className="w-4 h-4 text-white/80" />
              Search by Map
            </Link>
          </div>
        </div>
      </section>


      {/* VIP Modal */}
      {modalOpen && <VIPModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

