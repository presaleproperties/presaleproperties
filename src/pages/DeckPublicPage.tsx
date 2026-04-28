import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import { Helmet } from "@/components/seo/Helmet";
import { supabase } from "@/integrations/supabase/client";
import { DeckHeroSection } from "@/components/decks/DeckHeroSection";
import { DeckFloorPlansSection } from "@/components/decks/DeckFloorPlansSection";
import { DeckFloorPlansPdfSection } from "@/components/decks/DeckFloorPlansPdfSection";
import { DeckGallerySection } from "@/components/decks/DeckGallerySection";
import { DeckLocationSection } from "@/components/decks/DeckLocationSection";
import { DeckProjectionsSection } from "@/components/decks/DeckProjectionsSection";
import { DeckDepositTimelineSection, type DepositStep } from "@/components/decks/DeckDepositTimelineSection";
import { DeckContactSection } from "@/components/decks/DeckContactSection";
import { DeckWhatsAppWidget } from "@/components/decks/DeckWhatsAppWidget";
import { DeckStickyNav } from "@/components/decks/DeckStickyNav";
import { DeckAboutSection } from "@/components/decks/DeckAboutSection";
import { DeckFAQSection } from "@/components/decks/DeckFAQSection";
import { DeckPriceGate } from "@/components/decks/DeckPriceGate";
// DeckLeadGate removed — pricing is now gated inline via DeckPriceGate
import { Loader2 } from "lucide-react";
import { getVisitorId } from "@/lib/tracking/identifiers";
import { useDeckSectionTracking } from "@/hooks/useDeckSectionTracking";

const DEFAULT_DEPOSIT_STEPS: DepositStep[] = [
  { id: "d1", label: "Upon Signing", percent: 2.5, timing: "Due within 7 days", note: "Paid to the developer's trust account on execution of the Purchase Agreement." },
  { id: "d2", label: "2nd Deposit", percent: 2.5, timing: "Due in 3 months", note: "Second deposit due within 90 days of contract execution." },
  { id: "d3", label: "3rd Deposit", percent: 5, timing: "Due in 6 months", note: "Third deposit due within 180 days of contract execution." },
];

interface PitchDeck {
  id: string;
  slug: string;
  project_name: string;
  tagline: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  developer_name: string | null;
  stories: number | null;
  total_units: number | null;
  completion_year: string | null;
  hero_image_url: string | null;
  floor_plans: any[];
  gallery: string[];
  proximity_highlights: any[];
  projections: any;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  latitude: number | null;
  longitude: number | null;
  lat: number | null;
  lng: number | null;
  is_published: boolean;
  floor_plans_pdf_url: string | null;
  deposit_steps: DepositStep[] | null;
  assignment_fee: string | null;
  included_items: string[] | null;
  units_remaining: number | null;
  next_price_increase: string | null;
  description: string | null;
  highlights: string[] | null;
  amenities: string[] | null;
  incentives: string[] | null;
  gate_enabled: boolean | null;
  gated_sections: string[] | null;
}

const SECTION_IDS = ["overview", "floor-plans", "gallery", "location", "deposit-timeline", "projections", "faq", "contact"];

export default function DeckPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [deck, setDeck] = useState<PitchDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [navVisible, setNavVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [globalPriceGateOpen, setGlobalPriceGateOpen] = useState(false);
  const openPriceGate = useCallback(() => setGlobalPriceGateOpen(true), []);
  // Scroll position to restore when closing gallery
  const scrollYBeforeGallery = useRef<number>(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // Track which sections the lead engages with
  useDeckSectionTracking({
    slug: slug || "",
    projectName: deck?.project_name || "",
    projectId: (deck as any)?.project_id || null,
    deckId: deck?.id,
    sectionIds: SECTION_IDS,
  });
  useEffect(() => {
    if (!slug) return;
    let deckId: string | null = null;

    // Check localStorage first (fastest)
    if (localStorage.getItem(`deck_unlocked_${slug}`)) {
      setIsUnlocked(true);
    }

    const fetchDeck = async () => {
      const { data, error } = await (supabase as any)
        .from("pitch_decks")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error || !data) { setLoading(false); return null; }
      deckId = data.id;
      setDeck(data);
      setLoading(false);
      return data as any;
    };

    fetchDeck().then(async (deckData) => {
      if (!deckData) return;
      const id = deckData.id as string;

      // Log deck visit for return-visit tracking
      try {
        const visitorId = getVisitorId();
        const leadEmail = localStorage.getItem(`deck_lead_email_${slug}`) || undefined;
        const leadName = localStorage.getItem(`deck_lead_name_${slug}`) || undefined;
        const { data: insertedVisit } = await (supabase as any).from("deck_visits").insert({
          deck_id: id,
          slug,
          project_name: deckData.project_name || slug,
          visitor_id: visitorId || undefined,
          lead_email: leadEmail,
          lead_name: leadName,
          device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
          referrer: document.referrer || undefined,
        }).select("visit_number").single();
        // If this is a return visit, fire the WhatsApp notification
        if (insertedVisit?.visit_number > 1) {
          supabase.functions.invoke("notify-deck-return-visit", { body: {} }).catch(console.error);
        }
      } catch (_) { /* non-critical */ }

      // Secondary check: visitor_id in project_leads (covers different browsers / cleared storage)
      if (!localStorage.getItem(`deck_unlocked_${slug}`)) {
        const visitorId = getVisitorId();
        if (visitorId) {
          const { data: existingLead } = await (supabase as any)
            .from("project_leads")
            .select("id")
            .eq("visitor_id", visitorId)
            .ilike("message", "Pitch Deck:%")
            .maybeSingle();
          if (existingLead) {
            localStorage.setItem(`deck_unlocked_${slug}`, "1");
            setIsUnlocked(true);
          }
        }
      }

      // Subscribe to realtime updates so reorders/edits in the builder reflect immediately
      const channel = supabase
        .channel(`pitch_deck_${id}`)
        .on(
          "postgres_changes" as any,
          { event: "UPDATE", schema: "public", table: "pitch_decks", filter: `id=eq.${id}` },
          (payload: any) => {
            if (payload.new) setDeck(payload.new as any);
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    });
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

  // Fade-up animation via IntersectionObserver
  useEffect(() => {
    if (!deck) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("deck-visible"); }),
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".deck-animate").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [deck]);

  const handleGalleryOpen = useCallback(() => {
    scrollYBeforeGallery.current = window.scrollY;
    setGalleryOpen(true);
  }, []);

  const handleGalleryClose = useCallback(() => {
    setGalleryOpen(false);
    // Restore scroll position after the portal unmounts
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollYBeforeGallery.current, behavior: "instant" });
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!deck) return <NotFound />;

  const defaultPrice = deck.floor_plans?.[0]?.price_from
    ? parseFloat(deck.floor_plans[0].price_from.replace(/[^0-9.]/g, ""))
    : undefined;

  // Starting price label for meta tags
  const startingPriceLabel = deck.floor_plans?.find((p: any) => p?.price_from)?.price_from ?? null;
  const locationLabel = deck.neighborhood && deck.city
    ? `${deck.neighborhood}, ${deck.city}`
    : deck.neighborhood || deck.city || null;

  const rawDesc = (deck.description || deck.tagline || `Exclusive presale opportunity${deck.city ? ` in ${deck.city}` : ""}.`).replace(/[#*_`>]/g, "").trim();
  const descBase = rawDesc.length > 120 ? rawDesc.slice(0, 117) + "…" : rawDesc;
  const metaDesc = startingPriceLabel
    ? `Starting from ${startingPriceLabel}. ${descBase}`.slice(0, 160)
    : descBase.slice(0, 160);

  const ogTitle = startingPriceLabel
    ? `${deck.project_name} — From ${startingPriceLabel}${locationLabel ? ` | ${locationLabel}` : ""}`
    : `${deck.project_name} — Exclusive Presale${locationLabel ? ` | ${locationLabel}` : ""}`;

  const canonicalUrl = `https://presaleproperties.com/deck/${deck.slug}`;

  return (
    <>
    <Helmet>
      <title>{deck.project_name} — Presale Investment Deck | Presale Properties</title>
      <meta name="description" content={metaDesc} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:url" content={canonicalUrl} />
      {deck.hero_image_url && <meta property="og:image" content={deck.hero_image_url} />}
      {deck.hero_image_url && <meta property="og:image:secure_url" content={deck.hero_image_url} />}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="PresaleProperties.com" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={metaDesc} />
      {deck.hero_image_url && <meta name="twitter:image" content={deck.hero_image_url} />}
      <link rel="canonical" href={canonicalUrl} />
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
    {/* No full-page gate — content is freely browsable; only pricing is gated */}
    {/* Global price gate — triggered from anywhere on the page */}
    {globalPriceGateOpen && !(isUnlocked || deck.gate_enabled === false) && (
      <DeckPriceGate
        slug={slug || ""}
        projectName={deck.project_name}
        projectId={(deck as any).project_id || null}
        onUnlock={() => { setGlobalPriceGateOpen(false); setIsUnlocked(true); }}
        onClose={() => setGlobalPriceGateOpen(false)}
      />
    )}

    <div className="w-full sm:pb-0 pb-24" style={{ overflowX: "clip", scrollPaddingTop: "80px" }}>

      <DeckStickyNav
        visible={navVisible}
        activeSection={activeSection}
        projectName={deck.project_name}
        phoneNumber={deck.contact_phone || deck.contact_whatsapp || undefined}
      />

      {/* ── 1. Hero ── */}
      <DeckHeroSection
        projectName={deck.project_name}
        tagline={deck.tagline || undefined}
        heroImageUrl={deck.hero_image_url || undefined}
        developerName={deck.developer_name || undefined}
        stories={deck.stories || undefined}
        totalUnits={deck.total_units || undefined}
        completionYear={deck.completion_year || undefined}
        assignmentFee={deck.assignment_fee || undefined}
        city={deck.city || undefined}
        neighborhood={deck.neighborhood || undefined}
        startingPrice={isUnlocked || deck.gate_enabled === false ? (deck.floor_plans?.[0]?.price_from || undefined) : undefined}
        whatsappNumber={deck.contact_whatsapp || deck.contact_phone || undefined}
        onFloorPlansClick={() => document.getElementById("floor-plans")?.scrollIntoView({ behavior: "smooth" })}
        onContactClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
      />

      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* ── 2. About / Description ── */}
      {(deck.description || (deck.highlights && deck.highlights.length > 0) || (deck.amenities && deck.amenities.length > 0)) && (
        <div className="deck-animate">
          <DeckAboutSection
            description={deck.description}
            highlights={deck.highlights}
            amenities={deck.amenities}
            projectName={deck.project_name}
          />
        </div>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />

      {/* ── 3. Floor Plans — floor plans visible freely; only price is gated ── */}
      <div className="deck-animate">
        <DeckFloorPlansSection
          floorPlans={deck.floor_plans || []}
          whatsappNumber={deck.contact_whatsapp || deck.contact_phone || undefined}
          projectName={deck.project_name}
          projectId={(deck as any).project_id || null}
          slug={slug}
          assignmentFee={deck.assignment_fee}
          includedItems={deck.included_items}
          unitsRemaining={deck.units_remaining}
          nextPriceIncrease={deck.next_price_increase}
          incentives={deck.incentives}
          isUnlocked={isUnlocked || deck.gate_enabled === false}
          onUnlock={() => setIsUnlocked(true)}
        />
      </div>

      {/* Floor Plans PDF */}
      {deck.floor_plans_pdf_url && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
          <div className="deck-animate">
            <DeckFloorPlansPdfSection pdfUrl={deck.floor_plans_pdf_url} />
          </div>
        </>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />

      {/* ── 4. Gallery — scroll restore on close ── */}
      <div className="deck-animate">
        <DeckGallerySection
          images={deck.gallery || []}
          onGalleryOpen={handleGalleryOpen}
          onGalleryClose={handleGalleryClose}
        />
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />

      {/* ── 5. Location ── */}
      <div className="deck-animate">
        <DeckLocationSection
          address={deck.address || undefined}
          city={deck.city || undefined}
          neighborhood={deck.neighborhood || deck.city || undefined}
          lat={deck.lat ?? deck.latitude ?? undefined}
          lng={deck.lng ?? deck.longitude ?? undefined}
          highlights={deck.proximity_highlights || []}
        />
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />

      {/* ── 6. Deposit Timeline ── */}
      <div className="deck-animate">
        <section className="py-16 sm:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <DeckDepositTimelineSection
              depositSteps={deck.deposit_steps && deck.deposit_steps.length > 0 ? deck.deposit_steps : DEFAULT_DEPOSIT_STEPS}
              projectName={deck.project_name}
              completionYear={deck.completion_year || undefined}
              defaultPrice={defaultPrice}
              floorPlans={deck.floor_plans || []}
              isUnlocked={isUnlocked || deck.gate_enabled === false}
            onUnlockRequest={openPriceGate}
            />
          </div>
        </section>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />

      {/* ── 7. Investment Calculator ── */}
      <div className="deck-animate">
        <section className="py-16 sm:py-24 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <DeckProjectionsSection
              projections={deck.projections || {}}
              defaultPrice={defaultPrice}
              floorPlans={deck.floor_plans || []}
              isUnlocked={isUnlocked || deck.gate_enabled === false}
              onUnlockRequest={openPriceGate}
            />
          </div>
        </section>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />

      {/* ── 8. FAQ ── */}
      <div className="deck-animate">
        <DeckFAQSection />
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />

      {/* ── 9. Contact ── */}
      <div className="deck-animate">
        <DeckContactSection
          projectName={deck.project_name}
          contactName={deck.contact_name || undefined}
          contactPhone={deck.contact_phone || undefined}
          contactEmail={deck.contact_email || undefined}
          contactWhatsapp={deck.contact_whatsapp || undefined}
        />
      </div>

      {/* WhatsApp chat widget — all devices */}
      {(deck.contact_whatsapp || deck.contact_phone) && (
        <DeckWhatsAppWidget
          projectName={deck.project_name}
          contactName={deck.contact_name || undefined}
          whatsappNumber={deck.contact_whatsapp || deck.contact_phone || ""}
        />
      )}

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border/50 px-4 sm:px-8 py-8 pb-safe">
        <div className="max-w-4xl mx-auto space-y-3 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground/70">DISCLAIMER:</strong> This is not an offering for sale. Any such offering can only be made with a disclosure statement. E.&amp;O.E. — Pricing, availability, and project details are subject to change without notice. All renderings, floor plans, and specifications are for illustrative purposes only.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This presentation is prepared in compliance with the <em>Real Estate Development Marketing Act</em> (REDMA) and the British Columbia Financial Services Authority (BCFSA). No binding purchase agreement is created by this material.
          </p>
          <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/60">
            <span>© {new Date().getFullYear()} PresaleProperties.com · Real Broker · 3211 152 St, Building C, Suite 402, Surrey, BC V3Z 1H8</span>
            <span>info@presaleproperties.com · 672-258-1100</span>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
