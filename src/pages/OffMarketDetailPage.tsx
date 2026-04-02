import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { supabase } from "@/integrations/supabase/client";
import { trackOffMarketEvent, getApprovedEmail, checkAccess } from "@/lib/offMarketAnalytics";
import { useVipAuth } from "@/hooks/useVipAuth";
import { UnlockModal } from "@/components/off-market/UnlockModal";
import { DeckHeroSection } from "@/components/decks/DeckHeroSection";
import { DeckStickyNav } from "@/components/decks/DeckStickyNav";
import { DeckAboutSection } from "@/components/decks/DeckAboutSection";
import { DeckGallerySection } from "@/components/decks/DeckGallerySection";
import { DeckContactSection } from "@/components/decks/DeckContactSection";
import { FloorPlanModal, type FloorPlan } from "@/components/decks/FloorPlanModal";
import { OffMarketUnitsSection } from "@/components/off-market/OffMarketUnitsSection";
import { OffMarketIncentivesSection } from "@/components/off-market/OffMarketIncentivesSection";
import { OffMarketDocumentsSection } from "@/components/off-market/OffMarketDocumentsSection";
import { OffMarketDepositSection } from "@/components/off-market/OffMarketDepositSection";
import { Lock, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SECTION_IDS = ["overview", "floor-plans", "gallery", "incentives", "documents", "contact"];

export default function OffMarketDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isVipApproved } = useVipAuth();
  const [listing, setListing] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);

  // Deck-style nav state
  const [navVisible, setNavVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null);
  const scrollYBeforeGallery = useRef<number>(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    if (slug) loadData();
  }, [slug]);

  // Sticky nav + active section via scroll
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      setNavVisible(window.scrollY > heroHeight * 0.8);
      for (const id of [...SECTION_IDS].reverse()) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 80) { setActiveSection(id); break; }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fade-up animation
  useEffect(() => {
    if (!listing || !hasAccess) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("deck-visible"); }),
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".deck-animate").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [listing, hasAccess]);

  async function loadData() {
    setLoading(true);

    const { data: listingData } = await supabase
      .from("off_market_listings")
      .select("*")
      .eq("linked_project_slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (!listingData) { navigate("/off-market"); return; }
    setListing(listingData);
    trackOffMarketEvent("listing_view", listingData.id);

    // Check access
    if (isVipApproved) {
      setHasAccess(true);
    } else {
      const email = getApprovedEmail();
      if (email) {
        const approved = await checkAccess(listingData.id, email);
        setHasAccess(approved);
        if (!approved) { setShowUnlock(true); setLoading(false); return; }
      } else {
        setShowUnlock(true); setLoading(false); return;
      }
    }

    // Get project info
    const { data: proj } = await supabase
      .from("presale_projects")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    setProject(proj);

    // Get units
    const { data: unitData } = await supabase
      .from("off_market_units")
      .select("*")
      .eq("listing_id", listingData.id)
      .order("display_order", { ascending: true });
    setUnits(unitData || []);
    setLoading(false);
  }

  const handleGalleryOpen = useCallback(() => {
    scrollYBeforeGallery.current = window.scrollY;
    setGalleryOpen(true);
  }, []);

  const handleGalleryClose = useCallback(() => {
    setGalleryOpen(false);
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollYBeforeGallery.current, behavior: "instant" });
    });
  }, []);

  // Convert off_market_units to FloorPlan format for the card grid + modal
  const unitsAsFloorPlans: FloorPlan[] = units
    .filter((u) => u.status !== "sold")
    .map((u) => ({
      id: u.id,
      unit_type: u.unit_name || u.unit_type || `Unit ${u.unit_number}`,
      size_range: u.sqft ? `${Number(u.sqft).toLocaleString()} sqft` : "",
      price_from: u.price ? `$${Number(u.price).toLocaleString()}` : "",
      price_per_sqft: u.price_per_sqft ? `$${Math.round(Number(u.price_per_sqft))}` : "",
      tags: [u.status],
      image_url: u.floorplan_url || u.floorplan_thumbnail_url || undefined,
      interior_sqft: u.sqft ? Number(u.sqft) : null,
      beds: u.bedrooms,
      baths: u.bathrooms ? Number(u.bathrooms) : null,
      exposure: u.orientation,
      projected_rent: null,
    }));

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Locked state
  if (!hasAccess) {
    return (
      <>
        <Helmet><title>{listing?.linked_project_name} — Off-Market | Presale Properties</title></Helmet>
        {/* Full-screen hero with lock overlay */}
        <section className="relative flex flex-col items-center justify-center text-center" style={{ height: "100dvh" }}>
          {project?.featured_image && (
            <div className="absolute inset-0 z-0">
              <img src={project.featured_image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            </div>
          )}
          <div className="relative z-10 max-w-md px-6 space-y-6">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/15 flex items-center justify-center">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{listing?.linked_project_name}</h1>
            <p className="text-white/70 text-lg">
              This is exclusive, off-market inventory. Request VIP access to view pricing, floor plans, and unit details.
            </p>
            <Button
              size="lg"
              className="h-14 px-8 text-base font-bold rounded-xl shadow-lg shadow-primary/30"
              onClick={() => setShowUnlock(true)}
            >
              <Lock className="h-5 w-5 mr-2" /> Request VIP Access
            </Button>
          </div>
        </section>
        {listing && (
          <UnlockModal
            open={showUnlock}
            onOpenChange={setShowUnlock}
            listingId={listing.id}
            projectName={listing.linked_project_name}
            autoApprove={listing.auto_approve_access}
            onApproved={() => { setHasAccess(true); setShowUnlock(false); loadData(); }}
          />
        )}
      </>
    );
  }

  // Derive hero data
  const heroImage = project?.featured_image || (listing?.photo_urls && listing.photo_urls.length > 0 ? listing.photo_urls[0] : undefined);
  const locationLabel = project?.neighborhood && project?.city
    ? `${project.neighborhood}, ${project.city}`
    : project?.city || undefined;
  const lowestPrice = units.filter(u => u.status !== "sold").reduce((min, u) => {
    const p = Number(u.price);
    return p > 0 && p < min ? p : min;
  }, Infinity);
  const startingPrice = lowestPrice < Infinity ? `$${lowestPrice.toLocaleString()}` : undefined;

  // Gallery images from listing photos + floorplans
  const galleryImages = [
    ...(listing?.photo_urls || []),
  ].filter(Boolean);

  // Included items for unit cards
  const includedItems: string[] = [];
  if (listing?.parking_included) includedItems.push("Parking");
  else if (listing?.parking_cost) includedItems.push(`Parking ($${Number(listing.parking_cost).toLocaleString()})`);
  if (listing?.storage_included) includedItems.push("Storage");
  else if (listing?.storage_cost) includedItems.push(`Storage ($${Number(listing.storage_cost).toLocaleString()})`);
  if (listing?.locker_included) includedItems.push("Locker");

  return (
    <>
      <Helmet>
        <title>{listing.linked_project_name} — Off-Market VIP Inventory | Presale Properties</title>
        <meta name="description" content={`Exclusive off-market inventory for ${listing.linked_project_name}. VIP pricing, floor plans and incentives.`} />
        <style>{`
          .deck-animate {
            opacity: 0;
            transform: translateY(24px);
            transition: opacity 0.6s ease, transform 0.6s ease;
          }
          .deck-visible {
            opacity: 1;
            transform: translateY(0);
          }
          html {
            scroll-padding-top: 80px;
          }
        `}</style>
      </Helmet>

      <div className="w-full sm:pb-0 pb-24" style={{ overflowX: "clip", scrollPaddingTop: "80px" }}>

        {/* Sticky Nav */}
        <DeckStickyNav
          visible={navVisible}
          activeSection={activeSection}
          projectName={listing.linked_project_name}
          phoneNumber="6722581100"
        />

        {/* ── 1. Hero ── */}
        <DeckHeroSection
          projectName={listing.linked_project_name}
          tagline={`Off-Market Opportunity — ${locationLabel || "Metro Vancouver"}`}
          heroImageUrl={heroImage}
          developerName={listing.developer_name || undefined}
          stories={project?.stories || undefined}
          totalUnits={listing.total_units || undefined}
          completionYear={listing.completion_date || project?.completion_year || undefined}
          city={project?.city || undefined}
          neighborhood={project?.neighborhood || undefined}
          startingPrice={startingPrice}
          onFloorPlansClick={() => document.getElementById("floor-plans")?.scrollIntoView({ behavior: "smooth" })}
          onContactClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
        />

        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        {/* ── 2. About ── */}
        {project?.description && (
          <div className="deck-animate">
            <DeckAboutSection
              description={project.description}
              highlights={project.highlights}
              amenities={project.amenities}
              projectName={listing.linked_project_name}
            />
          </div>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />

        {/* ── 3. Unit Inventory (Floor Plan Card Style) ── */}
        <div className="deck-animate">
          <OffMarketUnitsSection
            units={unitsAsFloorPlans}
            allUnits={units}
            includedItems={includedItems.length > 0 ? includedItems : ["Parking", "Storage"]}
            projectName={listing.linked_project_name}
            onSelectPlan={setSelectedPlan}
            listingId={listing.id}
          />
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />

        {/* ── 4. Gallery ── */}
        {galleryImages.length > 0 && (
          <>
            <div className="deck-animate">
              <DeckGallerySection
                images={galleryImages}
                onGalleryOpen={handleGalleryOpen}
                onGalleryClose={handleGalleryClose}
              />
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
          </>
        )}

        {/* ── 5. Incentives + Deposit + Documents ── */}
        {(listing.incentives || listing.vip_incentives || listing.deposit_structure) && (
          <>
            <div className="deck-animate">
              <OffMarketIncentivesSection listing={listing} />
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
          </>
        )}

        {/* ── 6. Documents (Downloads) ── */}
        {(listing.pricing_sheet_url || listing.brochure_url || listing.info_sheet_url) && (
          <>
            <div className="deck-animate">
              <OffMarketDocumentsSection listing={listing} />
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
          </>
        )}

        {/* ── 7. Contact ── */}
        <div className="deck-animate">
          <DeckContactSection
            projectName={listing.linked_project_name}
          />
        </div>

        {/* Mobile sticky CTA */}
        <div
          className="sm:hidden fixed bottom-0 left-0 right-0 z-[99999]"
          style={{ isolation: "isolate", transform: "translate3d(0,0,0)" }}
        >
          <div className="bg-background border-t border-border/50 px-4"
            style={{ paddingTop: "0.625rem", paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            <a
              href={`https://wa.me/16722581100?text=${encodeURIComponent(`Hi! I'm interested in ${listing.linked_project_name} off-market units — can you share more details?`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-12 rounded-xl font-semibold text-sm text-white touch-manipulation active:opacity-90 select-none"
              style={{ background: "#25D366" }}
              onClick={() => trackOffMarketEvent("whatsapp_click", listing.id)}
            >
              <MessageCircle className="h-4 w-4" />
              I'm Interested
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-muted/30 border-t border-border/50 px-4 sm:px-8 py-8 pb-safe">
          <div className="max-w-4xl mx-auto space-y-3 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground/70">DISCLAIMER:</strong> This is not an offering for sale. Any such offering can only be made with a disclosure statement. E.&amp;O.E. — Pricing, availability, and project details are subject to change without notice.
            </p>
            <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/60">
              <span>© {new Date().getFullYear()} PresaleProperties.com · Real Broker</span>
              <span>info@presaleproperties.com · 672-258-1100</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Floor Plan Modal */}
      <FloorPlanModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        projectName={listing.linked_project_name}
        includedItems={includedItems.length > 0 ? includedItems : ["Parking", "Storage"]}
        isUnlocked={true}
      />
    </>
  );
}
