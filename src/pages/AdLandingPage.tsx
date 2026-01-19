import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, MapPin, Calendar, Building2, Play, Pause, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { ProjectLeadForm } from "@/components/projects/ProjectLeadForm";
import { trackPageView } from "@/lib/tracking";
import { MetaEvents } from "@/components/tracking/MetaPixel";

// Default project slug for the campaign
const DEFAULT_PROJECT_SLUG = "jericho-park";

interface Campaign {
  id: string;
  name: string;
  slug: string;
  project_id: string | null;
  headline: string | null;
  subheadline: string | null;
  selling_points: string[] | null;
  urgency_badge: string | null;
  urgency_text: string | null;
  cta_text: string | null;
  location_teaser: string | null;
  video_url: string | null;
  incentive_savings: string | null;
  incentive_deposit: string | null;
  incentive_bonus: string | null;
  monthly_1br: string | null;
  monthly_2br: string | null;
  is_active: boolean;
}

// Fallback config when no campaign is found
const DEFAULT_CONFIG = {
  urgencyBadge: "Limited Time Offer",
  urgencyText: "Pre-construction pricing available for a limited time",
  ctaText: "Get Floor Plans & Pricing",
  incentiveSavings: "$50K",
  incentiveDeposit: "5%",
  incentiveBonus: "Free A/C",
  monthly1br: "~$1,950",
  monthly2br: "~$2,600",
};

const AdLandingPage = () => {
  const [searchParams] = useSearchParams();
  const projectSlug = searchParams.get("p") || DEFAULT_PROJECT_SLUG;
  const campaignSlug = searchParams.get("c");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Fetch campaign data if campaign slug is provided
  const { data: campaign } = useQuery({
    queryKey: ["landing-campaign", campaignSlug],
    queryFn: async () => {
      if (!campaignSlug) return null;
      const { data, error } = await supabase
        .from("landing_page_campaigns")
        .select("*")
        .eq("slug", campaignSlug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as Campaign | null;
    },
    enabled: !!campaignSlug,
  });

  // Fetch project data from database
  const {
    data: project,
    isLoading,
    error
  } = useQuery({
    queryKey: ["ad-landing-project", projectSlug],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("presale_projects").select(`
          id,
          name,
          slug,
          city,
          neighborhood,
          featured_image,
          gallery_images,
          short_description,
          price_range,
          starting_price,
          status,
          brochure_files,
          highlights,
          amenities,
          completion_year,
          deposit_percent
        `).eq("slug", projectSlug).single();
      if (error) throw error;
      return data;
    }
  });

  // Track page view on mount
  useEffect(() => {
    trackPageView();
    // Track ad landing page view in Meta
    MetaEvents.viewContent({
      content_name: `Ad Landing: ${projectSlug}`,
      content_category: "Ad Landing Page",
      content_type: "landing_page",
    });
  }, [projectSlug]);

  // Helper to get campaign value or default
  const getCampaignValue = <K extends keyof Campaign>(
    key: K,
    fallback: string
  ): string => {
    if (campaign && campaign[key]) return campaign[key] as string;
    return fallback;
  };

  // Generate dynamic content based on project data and campaign overrides
  const getHeadline = () => {
    if (campaign?.headline) return campaign.headline;
    return "Exclusive Pre-Construction Opportunity";
  };
  
  const getSubheadline = () => {
    if (campaign?.subheadline) return campaign.subheadline;
    if (project?.short_description) {
      const firstSentence = project.short_description.split('.')[0];
      return firstSentence.length > 100 ? firstSentence.substring(0, 100) + "..." : firstSentence + ".";
    }
    return "Limited units available in Metro Vancouver's most anticipated development";
  };
  
  const getLocationTeaser = () => {
    if (campaign?.location_teaser) return campaign.location_teaser;
    if (project?.city) return `Prime ${project.city} Location`;
    return "Prime Metro Vancouver Location";
  };
  
  const getSellingPoints = () => {
    if (campaign?.selling_points && campaign.selling_points.length > 0) {
      return campaign.selling_points;
    }
    const points: string[] = [];
    if (project?.starting_price) {
      const priceK = Math.floor(project.starting_price / 1000);
      points.push(`From $${priceK}s`);
    }
    if (project?.completion_year) {
      points.push(`Move-in ${project.completion_year}`);
    }
    if (project?.deposit_percent) {
      points.push(`${project.deposit_percent}% Deposit`);
    }
    if (points.length < 4) points.push("Incentives Available");
    if (points.length < 4) points.push("Steps from transit");
    return points.slice(0, 4);
  };

  const getVideoUrl = () => campaign?.video_url || null;
  const getUrgencyBadge = () => campaign?.urgency_badge || DEFAULT_CONFIG.urgencyBadge;
  const getCtaText = () => campaign?.cta_text || DEFAULT_CONFIG.ctaText;
  const getIncentiveSavings = () => campaign?.incentive_savings || DEFAULT_CONFIG.incentiveSavings;
  const getIncentiveDeposit = () => campaign?.incentive_deposit || DEFAULT_CONFIG.incentiveDeposit;
  const getIncentiveBonus = () => campaign?.incentive_bonus || DEFAULT_CONFIG.incentiveBonus;
  const getMonthly1br = () => campaign?.monthly_1br || DEFAULT_CONFIG.monthly1br;
  const getMonthly2br = () => campaign?.monthly_2br || DEFAULT_CONFIG.monthly2br;
  const getAllImages = () => {
    const images: string[] = [];
    if (project?.featured_image) images.push(project.featured_image);
    if (project?.gallery_images && Array.isArray(project.gallery_images)) {
      images.push(...(project.gallery_images as string[]));
    }
    return images;
  };
  const getBrochureUrl = () => {
    if (project?.brochure_files && Array.isArray(project.brochure_files) && project.brochure_files.length > 0) {
      return project.brochure_files[0] as string;
    }
    return null;
  };
  const images = getAllImages();
  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  };
  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  };

  // Handle swipe gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();
  };

  // Auto-scroll hint on first impression
  const hasAutoScrolled = useRef(false);
  useEffect(() => {
    if (images.length > 1 && !hasAutoScrolled.current) {
      const timer = setTimeout(() => {
        hasAutoScrolled.current = true;
        // Scroll to next image to hint at scrollability
        setCurrentImageIndex(1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [images.length]);

  // Preload all images for lag-free transitions
  useEffect(() => {
    if (images.length > 0) {
      images.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [images]);
  const scrollToForm = () => {
    document.getElementById("lead-form-section")?.scrollIntoView({
      behavior: "smooth"
    });
  };

  // Loading state
  if (isLoading) {
    return <div className="min-h-screen bg-background p-5 pt-8">
        <Skeleton className="aspect-[4/3] w-full rounded-xl mb-4" />
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>;
  }

  // Error state
  if (error || !project) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-5">
        <Card className="p-6 text-center max-w-sm">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-lg font-semibold mb-2">Project Not Found</h1>
          <p className="text-sm text-muted-foreground">
            This exclusive opportunity may no longer be available.
          </p>
        </Card>
      </div>;
  }
  return <>
      <Helmet>
        <title>{getHeadline()} | Presale Properties</title>
        <meta name="description" content={getSubheadline()} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* NO HEADER - Clean edge-to-edge mobile experience */}

        {/* Hero Gallery with Swipe - Edge-to-edge, tall hero for impact */}
        <section className="relative -mx-0">
            <div className="relative h-[50vh] min-h-[320px] max-h-[450px] bg-muted overflow-hidden w-screen max-w-none" style={{
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)'
        }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            {/* Video Player */}
            {showVideo && getVideoUrl() ? <div className="absolute inset-0 bg-black">
                <video src={getVideoUrl()!} className="w-full h-full object-contain" autoPlay controls playsInline onPlay={() => setIsVideoPlaying(true)} onPause={() => setIsVideoPlaying(false)} onEnded={() => setShowVideo(false)} />
                <button onClick={() => setShowVideo(false)} className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white">
                  ✕
                </button>
              </div> : images.length > 0 ? <>
                {/* Current Image - HQ, GPU-accelerated, no lag */}
                <img key={currentImageIndex} src={images[currentImageIndex]} alt="Property preview" className="absolute inset-0 w-full h-full object-cover" style={{
              willChange: 'transform, opacity',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              imageRendering: 'auto'
            }} loading="eager" fetchPriority="high" decoding="sync" />
                
                {/* Image Navigation Arrows - Flat design, no shadows */}
                {images.length > 1 && <>
                    <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white active:scale-95 transition-transform" aria-label="Previous image">
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white active:scale-95 transition-transform" aria-label="Next image">
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>}


                {/* Video Play Button (if video available) */}
                {getVideoUrl() && <button onClick={() => setShowVideo(true)} className="absolute bottom-4 right-4 p-3 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform" aria-label="Play video">
                    <Play className="h-5 w-5" />
                  </button>}

                {/* Gradient overlay for text readability */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
              </> : <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
                <Building2 className="h-24 w-24 text-primary/30" />
              </div>}
            
            {/* Urgency Badge - Top left */}
            <div className="absolute top-4 left-4 safe-area-top">
              <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1.5 text-sm shadow-lg">
                {getUrgencyBadge()}
              </Badge>
            </div>

            {/* Photo Count Badge - Flat design */}
            {images.length > 1 && <div className="absolute top-4 right-4 safe-area-top">
                <Badge variant="secondary" className="bg-black/50 text-white border-0 font-medium">
                  {currentImageIndex + 1} / {images.length}
                </Badge>
              </div>}

            {/* Overlaid headline for above-the-fold impact */}
            <div className="absolute inset-x-0 bottom-0 p-6 pb-8 text-white">
              <h1 className="text-3xl font-bold leading-tight drop-shadow-lg tracking-tight">
                {getHeadline()}
              </h1>
              <div className="flex items-center gap-2 mt-3 text-white/90">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium tracking-wide">{getLocationTeaser()}</span>
              </div>
            </div>
          </div>

          {/* Selling Points - Inline pills for quick scanning */}
          <div className="px-4 py-5 flex flex-wrap justify-center gap-2">
            {getSellingPoints().map((point, index) => (
              <div 
                key={index} 
                className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 border border-primary/20"
              >
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-foreground text-sm font-semibold">{point}</span>
              </div>
            ))}
          </div>

          {/* CTA Arrow */}
          <button onClick={scrollToForm} className="w-full flex flex-col items-center gap-0.5 pb-4 text-primary" aria-label="Scroll to get pricing">
            <span className="text-sm font-semibold tracking-wide">View Pricing</span>
            <ChevronDown className="h-5 w-5 animate-bounce" />
          </button>
        </section>

        {/* 🔥 INCENTIVES - Compact & Punchy - Dark theme for contrast */}
        <section className="px-5 py-6 bg-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xl">🔥</span>
            <h2 className="text-lg font-bold text-background">Limited Incentives</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-background/10 backdrop-blur-sm rounded-2xl p-4 border border-primary/40">
              <p className="text-2xl font-bold text-primary">{getIncentiveSavings()}</p>
              <p className="text-[11px] text-background/70 mt-1">Savings*</p>
            </div>
            <div className="bg-background/10 backdrop-blur-sm rounded-2xl p-4 border border-primary/40">
              <p className="text-2xl font-bold text-primary">{getIncentiveDeposit()}</p>
              <p className="text-[11px] text-background/70 mt-1">Deposit*</p>
            </div>
            <div className="bg-background/10 backdrop-blur-sm rounded-2xl p-4 border border-primary/40">
              <p className="text-2xl font-bold text-primary">{getIncentiveBonus()}</p>
              <p className="text-[11px] text-background/70 mt-1">A/C*</p>
            </div>
          </div>
          
          <p className="text-center text-[10px] text-background/60 mt-3 italic">
            *Subject to availability. Contact for details.
          </p>
        </section>

        {/* 💰 MONTHLY COST - Visual Cards */}
        <section className="px-5 py-6 bg-background">
          <h2 className="text-lg font-bold text-foreground text-center mb-4">
            Own For Just
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {/* 1 Bed + Den */}
            <div className="relative bg-muted/50 rounded-2xl p-4 border border-border overflow-hidden">
              <Badge className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] px-2 py-0.5 rounded-bl-lg rounded-tr-xl">
                POPULAR
              </Badge>
              <p className="text-xs text-muted-foreground">1 Bed + Den</p>
              <p className="text-2xl font-bold text-foreground mt-1">{getMonthly1br()}</p>
              <p className="text-[10px] text-muted-foreground">/mo*</p>
            </div>
            
            {/* 2 Bed 2 Bath */}
            <div className="relative bg-foreground rounded-2xl p-4 overflow-hidden">
              <Badge className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] px-2 py-0.5 rounded-bl-lg rounded-tr-xl">
                BEST VALUE
              </Badge>
              <p className="text-xs text-background/70">2 Bed 2 Bath</p>
              <p className="text-2xl font-bold text-background mt-1">{getMonthly2br()}</p>
              <p className="text-[10px] text-background/60">/mo*</p>
            </div>
          </div>
          
          <p className="text-center text-[9px] text-muted-foreground mt-3 italic">
            *10% down, 3.89% rate, 30yr. Excl. tax/strata/CMHC.
          </p>
        </section>

        {/* 🏠 FIRST-TIME BUYER - Simplified */}
        <section className="px-5 py-6 bg-muted/30">
          <h2 className="text-lg font-bold text-foreground text-center mb-4">
            First-Time Buyer Benefits
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background rounded-2xl p-4 border border-border text-center">
              <div className="text-2xl mb-2">💵</div>
              <p className="text-xl font-bold text-foreground">$50K</p>
              <p className="text-[11px] text-muted-foreground mt-1">GST Rebate*</p>
            </div>
            <div className="bg-background rounded-2xl p-4 border border-border text-center">
              <div className="text-2xl mb-2">🏠</div>
              <p className="text-xl font-bold text-foreground">$8K</p>
              <p className="text-[11px] text-muted-foreground mt-1">PTT Savings*</p>
            </div>
          </div>
          
          <p className="text-center text-[9px] text-muted-foreground mt-3 italic">
            *Eligibility required. Consult a professional.
          </p>
        </section>

        {/* Lead Form Section */}
        <section id="lead-form-section" className="px-5 py-8 bg-gradient-to-b from-background to-muted/30">
          <div className="mb-5 text-center">
            <h2 className="text-xl font-bold text-foreground">
              Get Exclusive Access
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Floor plans, pricing & VIP incentives
            </p>
          </div>
          
          <ProjectLeadForm projectId={project.id} projectName="Exclusive Pre-Construction Opportunity" status={project.status === "active" ? "active" : "registering"} brochureUrl={getBrochureUrl()} />
        </section>

        {/* Minimal Footer */}
        <footer className="px-5 py-6 bg-foreground text-background">
          <div className="text-center space-y-4">
            <p className="text-sm font-medium text-background/80">
              Vancouver's New Construction Specialists
            </p>
            
            {/* Compact Trust */}
            <div className="flex justify-center gap-4 text-xs">
              <span className="text-primary font-bold">150+ Projects</span>
              <span className="text-background/30">•</span>
              <span className="text-primary font-bold">400+ Buyers</span>
              <span className="text-background/30">•</span>
              <span className="text-primary font-bold">5★</span>
            </div>
            
            <div className="pt-2 border-t border-background/10">
              <p className="text-[10px] text-background/40">
                © {new Date().getFullYear()} Presale Properties | Licensed REALTORS® | REAL Broker
              </p>
              <p className="text-[8px] text-background/25 max-w-xs mx-auto mt-2 leading-relaxed">
                All figures are estimates subject to change. Not an offer to sell.
              </p>
            </div>
          </div>
        </footer>

        {/* Sticky Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border/50 safe-area-bottom z-40">
          <Button onClick={scrollToForm} size="lg" className="w-full h-12 text-base font-bold rounded-xl shadow-gold">
            {getCtaText()}
          </Button>
        </div>

        {/* Bottom padding for sticky CTA */}
        <div className="h-20" />
      </div>
    </>;
};
export default AdLandingPage;