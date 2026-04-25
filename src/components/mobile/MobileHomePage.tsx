import { useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Map, Building2, Home, Calendar, Castle, MapPin, DollarSign, BedDouble, X, Search, ArrowRight, Phone } from "lucide-react";
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
import { IncentivesStrip } from "@/components/home/IncentivesStrip";
import { VipListSignup } from "@/components/home/VipListSignup";
import { Footer } from "@/components/layout/Footer";
import { PowerSearch } from "@/components/search/PowerSearch";
import { HeroProjectSlider } from "@/components/home/HeroProjectSlider";
import { SpotlightProjectPromo } from "@/components/home/SpotlightProjectPromo";
import { TrendingProjectPromo } from "@/components/home/TrendingProjectPromo";


import { FeaturedProjectPromo } from "@/components/home/FeaturedProjectPromo";
import { SearchTab } from "@/components/home/HeroSection";
import { supabase } from "@/integrations/supabase/client";


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
        source: "mobile_hero_vip_modal",
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
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-neutral-900/70 backdrop-blur-sm" onClick={onClose} />
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
              <button type="submit" disabled={isSubmitting} className="w-full h-11 bg-primary text-primary-foreground rounded-full font-bold text-sm disabled:opacity-60">
                {isSubmitting ? "Submitting..." : "Get Instant Access"}
              </button>
              {error && <p className="text-center text-xs text-danger">{error}</p>}
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
  const searchBarRef = useRef<HTMLDivElement>(null);

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
        className="relative overflow-hidden"
        style={{
          height: 'calc(100dvh - 60px)',
          minHeight: '580px',
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined
        }}>

        <HeroProjectSlider lightOverlay />

        {/* Hero Content — anchored to top only, never covers bottom project card */}
        <div className="absolute inset-0 z-[5] flex flex-col items-center justify-start px-5 overflow-visible pointer-events-none" style={{ paddingTop: "clamp(48px, 14vh, 140px)" }}>

          {/* Headline */}
          <h1 className="text-[2rem] font-extrabold text-on-dark leading-[1.08] text-center mb-2 tracking-tight max-w-[320px]" style={{ textShadow: "0 2px 40px rgba(0,0,0,0.6)" }}>
            Find New Homes.
          </h1>

          {/* Subheadline */}
          <p className="text-on-dark/70 text-sm text-center max-w-[300px] mb-4 leading-relaxed flex items-center justify-center gap-1.5" style={{ textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}>
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={2.5} />
            Metro Vancouver
          </p>

          {/* Search bar */}
          <div className="relative z-[10] w-full max-w-[340px] pointer-events-auto">
            <div ref={searchBarRef} className="relative flex items-center bg-card/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] overflow-visible h-[60px] border border-card/40">
              {/* Tab switcher — compact on mobile */}
              <div className="flex items-center shrink-0 pl-1 gap-0.5">
                {(["projects", "resale"] as SearchTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                      activeTab === tab
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    {tab === "projects" ? "Presale" : "Ready"}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-border/60 mx-1.5 shrink-0" />

              <div className="flex-1 overflow-visible min-w-0">
                <PowerSearch
                  placeholder={activeTab === "projects" ? "City or project…" : "Address or MLS#…"}
                  mode={activeTab === "projects" ? "presale" : "resale"}
                  variant="hero"
                  hideIcon
                  dropdownContainer={searchBarRef}
                  inputClassName="h-[60px] text-sm border-0 bg-transparent text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0 pl-2 rounded-none shadow-none"
                />
              </div>
              <button
                onClick={() => navigate(activeTab === "projects" ? "/presale-projects" : "/properties")}
                className="shrink-0 w-10 h-10 mr-1.5 rounded-xl bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-all shadow-md"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Primary VIP CTA — single, focused */}
          <div className="flex items-center justify-center mt-4 pointer-events-auto">
            <button
              type="button"
              onClick={() => setMobileModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-bold active:scale-95 transition-all shadow-[0_8px_24px_-6px_hsl(40_65%_45%/0.55)]"
            >
              ✨ Get VIP Pricing — Free
            </button>
          </div>

          {/* Trust mini-strip — minimal on mobile, slightly fuller on tablet */}
          <div className="mt-3 pointer-events-auto px-2">
            <p
              className="text-[11px] sm:text-xs text-on-dark/90 text-center tracking-wide"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.55)" }}
            >
              <span className="font-bold text-on-dark">400+ clients served</span>
              <span className="hidden sm:inline">
                <span className="mx-1.5 text-on-dark/40">·</span>
                <span className="font-bold text-on-dark">5 yrs in presale</span>
              </span>
              <span className="mx-1.5 text-on-dark/40">·</span>
              <span className="font-bold text-on-dark">5.0★ Google</span>
            </p>
          </div>

        </div>
      </div>



      {/* City Quick Links */}
      <div className="py-3 bg-background border-b border-border/40">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {TOP_CITIES.map((city) => (
            <button
              key={city.slug}
              onClick={() => handleCityClick(city.slug)}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-muted/60 border border-border active:scale-95 transition-all shrink-0"
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active Incentives strip — only for Presale tab */}
      {activeTab === "projects" && <IncentivesStrip />}

      {/* Discovery Sections - Switch based on active tab */}
      <div className="pb-6">
        {activeTab === "projects" ?
        <>
            {/* 1. Hot Projects - Featured Section (Spotlight promo embedded inside) */}
            <CarouselSection delay={0}>
              <MobileGroup>
                <SpotlightProjectPromo inline />
                <MobileDiscoveryCarousel
                  type="hot_projects"
                  title="Most Popular Projects"
                  subtitle="The most in-demand presale projects"
                  city={selectedCity}
                  unpadded />
              </MobileGroup>
            </CarouselSection>

            {/* 2. Condos */}
            <CarouselSection delay={50}>
              <MobileDiscoveryCarousel
              type="condos"
              title="Presale Condos"
              city={selectedCity} />

            </CarouselSection>

            {/* 3. Townhomes */}
            <CarouselSection delay={50}>
              <MobileDiscoveryCarousel
              type="townhomes"
              title="Presale Townhomes"
              city={selectedCity} />

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

        {/* City-based Carousels - Only show for Presale tab. Each promo + carousel sits inside one unified rounded panel for visual cohesion. */}
        {activeTab === "projects" &&
        <>
            <CarouselSection delay={150}>
              <MobileGroup>
                <FeaturedProjectPromo slug="baden-park" badgeLabel="Vancouver Spotlight" inline />
                <MobileDiscoveryCarousel
                  type="city_vancouver"
                  title="Vancouver"
                  city={selectedCity}
                  unpadded />
              </MobileGroup>
            </CarouselSection>

            <CarouselSection delay={200}>
              <MobileGroup>
                <TrendingProjectPromo inline />
                <MobileDiscoveryCarousel
                  type="city_surrey"
                  title="Surrey"
                  city={selectedCity}
                  unpadded />
              </MobileGroup>
            </CarouselSection>

            <CarouselSection delay={300}>
              <MobileGroup>
                <FeaturedProjectPromo slug="ironwood" badgeLabel="Coquitlam Spotlight" inline />
                <MobileDiscoveryCarousel
                  type="city_coquitlam"
                  title="Coquitlam"
                  city={selectedCity}
                  unpadded />
              </MobileGroup>
            </CarouselSection>


            {/* Browse other cities CTA — replaces 4 carousels (Burnaby, Langley, Richmond, Delta, Abbotsford) */}
            <div className="px-4 my-8">
              <Link
                to="/presale-projects"
                className="flex items-center justify-center gap-2 w-full h-12 rounded-full border border-border bg-background text-foreground font-semibold text-sm shadow-sm active:scale-[0.98] transition-transform"
              >
                Explore other cities
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
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

      {/* Inline VIP capture — primary lead form */}
      <div className="mt-6">
        <VipListSignup />
      </div>

      {/* Large Map Section - Page Ending */}
      <div className="mt-4">
        <HomeUnifiedMapSection initialMode={activeTab === "projects" ? "presale" : "resale"} contextType="home" />
      </div>

      {/* Footer - with extra bottom padding for nav */}
      <div className="pb-28">
        <Footer />
      </div>


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

/**
 * Wraps a promo card + adjacent carousel inside a single rounded panel so the
 * two feel like one unified module on mobile/tablet — matches the desktop
 * CityGroup pattern. Uses px-4 outer margin and consistent internal padding.
 */
function MobileGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 my-6 rounded-2xl border border-border/60 bg-card/40 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 space-y-5 sm:space-y-6">
        {children}
      </div>
    </div>
  );
}
