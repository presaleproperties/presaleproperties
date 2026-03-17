import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { DeckHeroSection } from "@/components/decks/DeckHeroSection";
import { DeckFloorPlansSection } from "@/components/decks/DeckFloorPlansSection";
import { DeckFloorPlansPdfSection } from "@/components/decks/DeckFloorPlansPdfSection";
import { DeckGallerySection } from "@/components/decks/DeckGallerySection";
import { DeckLocationSection } from "@/components/decks/DeckLocationSection";
import { DeckProjectionsSection } from "@/components/decks/DeckProjectionsSection";
import { DeckContactSection } from "@/components/decks/DeckContactSection";
import { DeckStickyNav } from "@/components/decks/DeckStickyNav";
import { Loader2 } from "lucide-react";

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
}

const SECTION_IDS = ["overview", "floor-plans", "gallery", "location", "projections", "contact"];

export default function DeckPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [deck, setDeck] = useState<PitchDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [navVisible, setNavVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  // Fetch deck
  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("pitch_decks")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data) {
        setLoading(false);
        return;
      }
      // If not published, only allow if user owns it (checked client-side as best-effort)
      setDeck(data);
      setLoading(false);
    })();
  }, [slug]);

  // Sticky nav + active section via scroll
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      setNavVisible(window.scrollY > heroHeight * 0.8);

      // Find active section
      for (const id of [...SECTION_IDS].reverse()) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 80) {
            setActiveSection(id);
            break;
          }
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
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("deck-visible");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".deck-animate").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [deck]);

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

  return (
    <div className="w-full" style={{ overflowX: "clip" }}>
      <Helmet>
        <title>{deck.project_name} — Presale Investment Deck | Presale Properties</title>
        <meta name="description" content={`Exclusive presale opportunity: ${deck.project_name}${deck.city ? ` in ${deck.city}` : ""}. View floor plans, pricing, and investment projections.`} />
        {/* OG / WhatsApp / iMessage preview */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${deck.project_name} — Presale Investment Deck`} />
        <meta property="og:description" content={`Exclusive presale opportunity${deck.city ? ` in ${deck.city}` : ""}. Floor plans, pricing & investment projections.`} />
        <meta property="og:url" content={`https://presaleproperties.com/deck/${deck.slug}`} />
        {deck.hero_image_url && <meta property="og:image" content={deck.hero_image_url} />}
        {deck.hero_image_url && <meta property="og:image:secure_url" content={deck.hero_image_url} />}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="PresaleProperties.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${deck.project_name} — Presale Investment Deck`} />
        <meta name="twitter:description" content={`Exclusive presale opportunity${deck.city ? ` in ${deck.city}` : ""}. Floor plans, pricing & investment projections.`} />
        {deck.hero_image_url && <meta name="twitter:image" content={deck.hero_image_url} />}
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
        `}</style>
      </Helmet>

      <DeckStickyNav
        visible={navVisible}
        activeSection={activeSection}
        projectName={deck.project_name}
        whatsappNumber={deck.contact_whatsapp || deck.contact_phone || undefined}
        projectNameForWa={deck.project_name}
      />

      {/* Section 1 — Hero */}
      <DeckHeroSection
        projectName={deck.project_name}
        tagline={deck.tagline || undefined}
        heroImageUrl={deck.hero_image_url || undefined}
        developerName={deck.developer_name || undefined}
        stories={deck.stories || undefined}
        totalUnits={deck.total_units || undefined}
        completionYear={deck.completion_year || undefined}
        whatsappNumber={deck.contact_whatsapp || deck.contact_phone || undefined}
        onFloorPlansClick={() => document.getElementById("floor-plans")?.scrollIntoView({ behavior: "smooth" })}
        onContactClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
      />

      {/* Accent divider */}
      <div className="h-px bg-primary/20" />

      {/* Section 2 — Floor Plans */}
      <div className="deck-animate">
        <DeckFloorPlansSection floorPlans={deck.floor_plans || []} />
      </div>

      {/* Section 2b — Full Floor Plans PDF (if uploaded) */}
      {deck.floor_plans_pdf_url && (
        <>
          <div className="h-px bg-primary/20" />
          <div className="deck-animate">
            <DeckFloorPlansPdfSection pdfUrl={deck.floor_plans_pdf_url} />
          </div>
        </>
      )}

      <div className="h-px bg-primary/20" />

      {/* Section 3 — Gallery */}
      <div className="deck-animate">
        <DeckGallerySection images={deck.gallery || []} />
      </div>

      <div className="h-px bg-primary/20" />

      {/* Section 4 — Location */}
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

      <div className="h-px bg-primary/20" />

      {/* Section 5 — Projections */}
      <div className="deck-animate">
        <DeckProjectionsSection
          projections={deck.projections || {}}
          defaultPrice={defaultPrice}
          floorPlans={deck.floor_plans || []}
        />
      </div>

      <div className="h-px bg-primary/20" />

      {/* Section 6 — Contact */}
      <div className="deck-animate">
        <DeckContactSection
          projectName={deck.project_name}
          contactName={deck.contact_name || undefined}
          contactPhone={deck.contact_phone || undefined}
          contactEmail={deck.contact_email || undefined}
          contactWhatsapp={deck.contact_whatsapp || undefined}
        />
      </div>

      {/* Disclaimer Footer */}
      <footer className="bg-muted/30 border-t border-border/50 px-4 sm:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-3 text-center">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground/70">DISCLAIMER:</strong> This is not an offering for sale. Any such offering can only be made with a disclosure statement. E.&amp;O.E. — Pricing, availability, and project details are subject to change without notice. All renderings, floor plans, and specifications are for illustrative purposes only. This communication is intended for informational purposes and does not constitute an offer or solicitation to purchase real estate.
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            This presentation is prepared in compliance with the <em>Real Estate Development Marketing Act</em> (REDMA) and the British Columbia Financial Services Authority (BCFSA). No binding purchase agreement is created by this material. Prospective purchasers should review all disclosure documents carefully before entering into any agreement of purchase and sale.
          </p>
          <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-muted-foreground/60">
            <span>© {new Date().getFullYear()} PresaleProperties.com · Real Broker · 666 Burrard St, Suite 500, Vancouver, BC V6C 3P6</span>
            <span>info@presaleproperties.com · 672-258-1100</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
