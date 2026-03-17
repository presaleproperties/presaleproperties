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
import { DeckDepositTimelineSection, type DepositStep } from "@/components/decks/DeckDepositTimelineSection";
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
    <div className="w-full sm:pb-0 pb-24" style={{ overflowX: "clip" }}>
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
        <DeckFloorPlansSection
          floorPlans={deck.floor_plans || []}
          whatsappNumber={deck.contact_whatsapp || deck.contact_phone || undefined}
          projectName={deck.project_name}
        />
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

      {/* Mobile sticky WhatsApp CTA — fixed bottom bar */}
      {deck.contact_whatsapp || deck.contact_phone ? (
        <div
          className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 bg-background/95 backdrop-blur-md border-t border-border/30"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))", paddingTop: "0.75rem" }}
        >
          <a
            href={`https://wa.me/${(deck.contact_whatsapp || deck.contact_phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! I'm interested in ${deck.project_name} — can you share more details?`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-bold text-sm text-white touch-manipulation active:opacity-90 transition-opacity"
            style={{ background: "#25D366", boxShadow: "0 4px 20px rgba(37,211,102,0.35)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Text Us About {deck.project_name}
          </a>
        </div>
      ) : null}

      {/* Disclaimer Footer */}
      <footer className="bg-muted/30 border-t border-border/50 px-4 sm:px-8 py-8 pb-safe">

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
