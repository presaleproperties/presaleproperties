import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Map, Building2, Home, Calendar, Castle, MapPin, DollarSign, BedDouble, X, Search } from "lucide-react";
import { MobileDiscoveryCarousel } from "./MobileDiscoveryCarousel";
import { MobileResaleCarousel } from "./MobileResaleCarousel";
import { MobileResaleCityCarousel } from "./MobileResaleCityCarousel";
import { MobileCityQuickLinks } from "./MobileCityQuickLinks";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { PresaleExpertsSection } from "@/components/home/PresaleExpertsSection";
import { RelatedContent } from "@/components/home/RelatedContent";
import { ROICalculatorTeaser } from "@/components/home/ROICalculatorTeaser";
import { HomeUnifiedMapSection } from "@/components/map/HomeUnifiedMapSection";
import { Footer } from "@/components/layout/Footer";
import { PowerSearch } from "@/components/search/PowerSearch";
import heroImage from "@/assets/hero-lifestyle.jpg";
import { SearchTab } from "@/components/home/HeroSection";


const TOP_CITIES = [
{ name: "Vancouver", slug: "vancouver" },
{ name: "Surrey", slug: "surrey" },
{ name: "Burnaby", slug: "burnaby" },
{ name: "Langley", slug: "langley" },
{ name: "Coquitlam", slug: "coquitlam" },
{ name: "Richmond", slug: "richmond" }];


interface MobileHomePageProps {
  activeTab?: SearchTab;
  onTabChange?: (tab: SearchTab) => void;
}



function MobileVIPModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ firstName: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        {submitted ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-foreground mb-1">You're In!</h2>
            <p className="text-sm text-muted-foreground">VIP access details are on the way.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">Get VIP Presale Access</h2>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Be first to see pricing, floor plans and off-market assignments before they go public.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" required placeholder="First Name" value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <input type="email" required placeholder="Email Address" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <input type="tel" placeholder="Phone Number (optional)" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <button type="submit" className="w-full h-11 bg-primary text-primary-foreground rounded-full font-bold text-sm">
                Get Instant Access
              </button>
              <p className="text-center text-[11px] text-muted-foreground">No spam. Unsubscribe anytime.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export function MobileHomePage({ activeTab: controlledTab, onTabChange }: MobileHomePageProps) {
  const [internalTab, setInternalTab] = useState<SearchTab>("projects");
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const activeTab = controlledTab ?? internalTab;

  const handleTabChange = (tab: SearchTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const [selectedCity, setSelectedCity] = useState("all");
  const queryClient = useQueryClient();
  const navigate = useNavigate();


  const handleCityClick = (slug: string) => {
    if (activeTab === "projects") {
      navigate(`/${slug}-presale-condos`);
    } else {
      navigate(`/properties/${slug}`);
    }
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["mobile-discovery"] });
  }, [queryClient]);

  const { pullDistance, isRefreshing, containerRef } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    maxPull: 120
  });

  const handleCityChange = useCallback((city: string) => {
    setSelectedCity(city);

    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "location_changed", {
        city: city
      });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background lg:hidden">

      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing} />



      {/* Full-Screen Hero Section */}
      <div
        className="relative min-h-[80vh] flex flex-col"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined
        }}>

        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Modern home interior"
            className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/55" />
        </div>

        {/* Hero Content — centered */}
        <div className="relative flex-1 flex flex-col justify-center items-center px-5 pt-20 pb-10">
          {/* Eyebrow */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55 mb-3 text-center">
            Metro Vancouver's Presale Platform
          </p>

          {/* Headline */}
          <h1 className="text-3xl font-extrabold text-white leading-tight text-center mb-4 tracking-tight">
            New Homes.{" "}
            <span className="text-primary">Exclusive Access.</span>
          </h1>

          {/* Feature pills — key differentiators */}
          <div className="flex items-center gap-2 flex-wrap justify-center mb-6">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/12 backdrop-blur-sm border border-white/20 text-white/90 text-[11px] font-semibold">
              📄 Instant Floor Plans
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/12 backdrop-blur-sm border border-white/20 text-white/90 text-[11px] font-semibold">
              💰 Instant Pricing Sheets
            </span>
          </div>

          {/* Search Bar — REW-style single pill */}
          <div className="w-full max-w-md">
            <div className="flex items-center bg-white rounded-full shadow-2xl overflow-visible h-[58px]">
              {/* Tab switcher — left side */}
              <div className="flex items-center shrink-0 pl-1.5 gap-0.5">
                <button
                  onClick={() => handleTabChange("projects")}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "projects"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground"
                  }`}
                >
                  Presale
                </button>
                <button
                  onClick={() => handleTabChange("resale")}
                  className={`px-3 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "resale"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground"
                  }`}
                >
                  Move-In Ready
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-border mx-1.5 shrink-0" />

              {/* Search input */}
              <div className="flex-1 overflow-visible min-w-0">
                <PowerSearch
                  placeholder={activeTab === "projects" ? "City, project…" : "Address, MLS#…"}
                  mode={activeTab === "projects" ? "presale" : "resale"}
                  variant="hero"
                  hideIcon
                  inputClassName="h-[58px] text-sm border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 pl-3 rounded-none shadow-none" />
              </div>

              {/* Circular search button */}
              <button
                onClick={() => navigate(activeTab === "projects" ? "/presale-projects" : "/properties")}
                className="shrink-0 w-10 h-10 mr-1.5 rounded-full bg-foreground text-background flex items-center justify-center"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Map text link */}
          <a
            href={activeTab === "projects" ? "/map-search?mode=presale" : "/map-search?mode=resale"}
            className="mt-3 text-[11px] text-white/50 hover:text-white/75 transition-colors"
          >
            or explore the map →
          </a>

          {/* VIP CTA */}
          <button
            onClick={() => setMobileModalOpen(true)}
            className="mt-4 text-xs text-primary font-semibold underline underline-offset-4"
          >
            Get VIP Access — It's Free →
          </button>
        </div>
      </div>

      {/* Trust Bar — 2×2 grid on mobile */}
      <div className="bg-[#0d0d0d] border-b border-white/5">
        <div className="grid grid-cols-2 divide-x divide-white/10">
          {[
            { value: "111", label: "Active Projects" },
            { value: "450+", label: "Agent Network" },
            { value: "$200M+", label: "In Presale Sales" },
            { value: "5.0 ★", label: "Google Rating" },
          ].map((stat, i) => (
            <div key={i} className={`flex flex-col items-center py-4 gap-0.5 ${i >= 2 ? "border-t border-white/10" : ""}`}>
              <span className="text-base font-extrabold text-white leading-none">{stat.value}</span>
              <span className="text-[9px] text-primary font-semibold uppercase tracking-wider text-center">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation — Cities only */}
      <div className="py-4 pb-5 bg-background border-b border-border/40">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap shrink-0 min-w-[52px]">
            Cities
          </span>
          {TOP_CITIES.map((city) => (
            <button
              key={city.slug}
              onClick={() => handleCityClick(city.slug)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-card border border-border shadow-sm hover:border-primary/50 active:scale-95 transition-all shrink-0"
            >
              <MapPin className="h-3 w-3 text-muted-foreground" />
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {/* Discovery Sections - Switch based on active tab */}
      <div className="pb-6">
        {activeTab === "projects" ?
        <>
            {/* Hot Projects - Featured Section */}
            <CarouselSection delay={0}>
              <MobileDiscoveryCarousel
              type="hot_projects"
              title="Most Popular Projects"
              subtitle="The most in-demand presale projects"
              city={selectedCity} />

            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* Condos */}
            <CarouselSection delay={50}>
              <MobileDiscoveryCarousel
              type="condos"
              title="Presale Condos"
              city={selectedCity} />

            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* Townhomes */}
            <CarouselSection delay={50}>
              <MobileDiscoveryCarousel
              type="townhomes"
              title="Presale Townhomes"
              city={selectedCity} />

            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* Single-Family / Detached */}
            <CarouselSection delay={100}>
              <MobileDiscoveryCarousel
              type="single_family"
              title="Detached Homes"
              city={selectedCity} />

            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* Projects Near You - City Quick Links */}
            <CarouselSection delay={125}>
              <MobileCityQuickLinks />
            </CarouselSection>
          </> :

        <>
            {/* Resale Mode - Show MLS listings */}
            <CarouselSection delay={0}>
              <MobileResaleCarousel
              title="Featured Listings"
              subtitle="New construction resale homes" />

            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* City Quick Links for Resale */}
            <CarouselSection delay={50}>
              <MobileCityQuickLinks mode="resale" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* Resale City Carousels */}
            <CarouselSection delay={100}>
              <MobileResaleCityCarousel city="Vancouver" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            <CarouselSection delay={150}>
              <MobileResaleCityCarousel city="Surrey" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            <CarouselSection delay={200}>
              <MobileResaleCityCarousel city="Burnaby" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            <CarouselSection delay={250}>
              <MobileResaleCityCarousel city="Langley" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            <CarouselSection delay={300}>
              <MobileResaleCityCarousel city="Coquitlam" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            <CarouselSection delay={350}>
              <MobileResaleCityCarousel city="Richmond" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            <CarouselSection delay={400}>
              <MobileResaleCityCarousel city="Delta" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            <CarouselSection delay={450}>
              <MobileResaleCityCarousel city="Abbotsford" />
            </CarouselSection>
          </>
        }

        {/* City-based Carousels - Only show for Presale tab */}
        {activeTab === "projects" &&
        <>
            <CarouselSection delay={150}>
              <MobileDiscoveryCarousel
              type="city_vancouver"
              title="Vancouver"
              city={selectedCity} />

            </CarouselSection>

            <CarouselSection delay={200}>
              <MobileDiscoveryCarousel
              type="city_surrey"
              title="Surrey"
              city={selectedCity} />

            </CarouselSection>

            <CarouselSection delay={250}>
              <MobileDiscoveryCarousel
              type="city_burnaby"
              title="Burnaby"
              city={selectedCity} />

            </CarouselSection>

            <CarouselSection delay={300}>
              <MobileDiscoveryCarousel
              type="city_coquitlam"
              title="Coquitlam"
              city={selectedCity} />

            </CarouselSection>

            <CarouselSection delay={350}>
              <MobileDiscoveryCarousel
              type="city_langley"
              title="Langley"
              city={selectedCity} />

            </CarouselSection>

            <CarouselSection delay={400}>
              <MobileDiscoveryCarousel
              type="city_richmond"
              title="Richmond"
              city={selectedCity} />

            </CarouselSection>

            <CarouselSection delay={450}>
              <MobileDiscoveryCarousel
              type="city_delta"
              title="Delta"
              city={selectedCity} />

            </CarouselSection>

            <CarouselSection delay={500}>
              <MobileDiscoveryCarousel
              type="city_abbotsford"
              title="Abbotsford"
              city={selectedCity} />

            </CarouselSection>
          </>
        }
      </div>

      {/* Benefits Section */}
      <div className="mt-6">
        <PresaleExpertsSection />
      </div>

      {/* ROI Calculator Teaser */}
      <div className="mt-4">
        <ROICalculatorTeaser />
      </div>

      {/* Quick Links Section */}
      <div className="mt-4">
        <RelatedContent />
      </div>

      {/* Large Map Section - Page Ending */}
      <div className="mt-4">
        <HomeUnifiedMapSection initialMode={activeTab === "projects" ? "presale" : "resale"} contextType="home" />
      </div>

      {/* Footer - with extra bottom padding for nav */}
      <div className="pb-28">
        <Footer />
      </div>

      {/* Floating Map Button - bottom right, above nav */}
      <button
        onClick={() => navigate(`/map-search?mode=${activeTab === "projects" ? "presale" : "resale"}`)}
        className="fixed right-4 z-40 lg:hidden h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 flex items-center justify-center hover:bg-primary/90 active:scale-90 transition-all animate-[pulse_3s_ease-in-out_infinite] ring-4 ring-primary/20"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)' }}
        aria-label="Map Search">
        <Map className="h-6 w-6" />
      </button>

      {/* VIP Modal */}
      {mobileModalOpen && <MobileVIPModal onClose={() => setMobileModalOpen(false)} />}

    </div>);

}

// Carousel section wrapper - no animation to prevent blinking on navigation
function CarouselSection({ children }: {children: React.ReactNode;delay?: number;}) {
  return (
    <div>
      {children}
    </div>);

}
