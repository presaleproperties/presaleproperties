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

// ============================================
// CAMPAIGN OVERRIDE CONFIG
// Use these to customize messaging without changing database
// Set to null to use database values
// ============================================
const CAMPAIGN_OVERRIDES = {
  // Override headline (null = use generic teaser headline)
  headline: null as string | null,
  // Override subheadline
  subheadline: null as string | null,
  // Custom selling points (null = use auto-generated from project data)
  sellingPoints: null as string[] | null,
  // Video URL (MP4 or YouTube embed)
  videoUrl: null as string | null,
  // Urgency messaging
  urgencyBadge: "Limited Time Offer",
  urgencyText: "Pre-construction pricing available for a limited time",
  // CTA text
  ctaText: "Get Floor Plans & Pricing",
  // Location teaser (vague to maintain mystery)
  locationTeaser: null as string | null // null = use "Prime {city} Location"
};

// Default project slug for the campaign
const DEFAULT_PROJECT_SLUG = "jericho-park";
const AdLandingPage = () => {
  const [searchParams] = useSearchParams();
  const projectSlug = searchParams.get("p") || DEFAULT_PROJECT_SLUG;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

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

  // Generate dynamic content based on project data
  const getHeadline = () => {
    if (CAMPAIGN_OVERRIDES.headline) return CAMPAIGN_OVERRIDES.headline;
    return "Exclusive Pre-Construction Opportunity";
  };
  const getSubheadline = () => {
    if (CAMPAIGN_OVERRIDES.subheadline) return CAMPAIGN_OVERRIDES.subheadline;
    if (project?.short_description) {
      // Truncate to first sentence for mystery
      const firstSentence = project.short_description.split('.')[0];
      return firstSentence.length > 100 ? firstSentence.substring(0, 100) + "..." : firstSentence + ".";
    }
    return "Limited units available in Metro Vancouver's most anticipated development";
  };
  const getLocationTeaser = () => {
    if (CAMPAIGN_OVERRIDES.locationTeaser) return CAMPAIGN_OVERRIDES.locationTeaser;
    if (project?.city) return `Prime ${project.city} Location`;
    return "Prime Metro Vancouver Location";
  };
  const getSellingPoints = () => {
    if (CAMPAIGN_OVERRIDES.sellingPoints) return CAMPAIGN_OVERRIDES.sellingPoints;
    const points: string[] = [];
    if (project?.starting_price) {
      const priceK = Math.floor(project.starting_price / 1000);
      points.push(`Starting from the low $${priceK}s`);
    }
    if (project?.completion_year) {
      points.push(`Move-in ready by ${project.completion_year}`);
    }
    if (project?.deposit_percent) {
      points.push(`Only ${project.deposit_percent}% deposit required`);
    }

    // Add generic points if we don't have enough
    if (points.length < 4) {
      points.push("Developer incentives available");
    }
    if (points.length < 4) {
      points.push("Steps from transit & amenities");
    }
    if (points.length < 4) {
      points.push("First access to best floor plans");
    }
    return points.slice(0, 4);
  };
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
          <div className="relative h-[65vh] min-h-[400px] max-h-[600px] bg-muted overflow-hidden w-screen max-w-none" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            {/* Video Player */}
            {showVideo && CAMPAIGN_OVERRIDES.videoUrl ? <div className="absolute inset-0 bg-black">
                <video src={CAMPAIGN_OVERRIDES.videoUrl} className="w-full h-full object-contain" autoPlay controls playsInline onPlay={() => setIsVideoPlaying(true)} onPause={() => setIsVideoPlaying(false)} onEnded={() => setShowVideo(false)} />
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
                {CAMPAIGN_OVERRIDES.videoUrl && <button onClick={() => setShowVideo(true)} className="absolute bottom-4 right-4 p-3 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform" aria-label="Play video">
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
                {CAMPAIGN_OVERRIDES.urgencyBadge}
              </Badge>
            </div>

            {/* Photo Count Badge - Flat design */}
            {images.length > 1 && <div className="absolute top-4 right-4 safe-area-top">
                <Badge variant="secondary" className="bg-black/50 text-white border-0 font-medium">
                  {currentImageIndex + 1} / {images.length}
                </Badge>
              </div>}

            {/* Overlaid headline for above-the-fold impact */}
            <div className="absolute inset-x-0 bottom-0 p-5 pb-6 text-white">
              <h1 className="text-2xl font-bold leading-tight drop-shadow-lg">
                {getHeadline()}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-white/90">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">{getLocationTeaser()}</span>
              </div>
            </div>
          </div>

          {/* Compact info + scroll hint */}
          <div className="px-5 py-4">
            <p className="text-muted-foreground text-sm leading-relaxed text-center">
              {getSubheadline()}
            </p>

            {/* Scroll down arrow hint */}
            <button onClick={scrollToForm} className="w-full flex flex-col items-center gap-1 mt-3 py-2 text-primary" aria-label="Scroll to get pricing">
              <span className="text-sm font-medium">View Pricing</span>
              <ChevronDown className="h-6 w-6 animate-bounce" />
            </button>
          </div>
        </section>

        {/* Selling Points */}
        <section className="px-5 py-6 bg-muted/30">
          <div className="space-y-3">
            {getSellingPoints().map((point, index) => <div key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground font-medium">{point}</span>
              </div>)}
          </div>
        </section>

        {/* 🔥 INCENTIVES SECTION - High Impact Promo */}
        <section className="px-5 py-6 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5">
          <div className="text-center mb-4">
            <Badge className="bg-destructive text-destructive-foreground font-bold px-4 py-1.5 text-sm mb-3 animate-pulse">
              🔥 LIMITED TIME
            </Badge>
            <h2 className="text-xl font-bold text-foreground">
              Incentives Available Now
            </h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-primary/30">
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-semibold text-foreground">Up to $50,000 in Savings</p>
                <p className="text-xs text-muted-foreground">Developer credits & closing cost assistance</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-primary/30">
              <span className="text-2xl">📉</span>
              <div>
                <p className="font-semibold text-foreground">Reduced Deposit Structure</p>
                <p className="text-xs text-muted-foreground">Only 10% down until completion</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-primary/30">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="font-semibold text-foreground">Free Upgrade Package</p>
                <p className="text-xs text-muted-foreground">Premium finishes included at no extra cost</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-primary/30">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold text-foreground">Extended Rate Hold</p>
                <p className="text-xs text-muted-foreground">Lock in your rate for up to 24 months</p>
              </div>
            </div>
          </div>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            *Incentives subject to availability. Contact for full details.
          </p>
        </section>

        {/* 💰 MONTHLY COST VISUAL - Easy to skim */}
        <section className="px-5 py-6 bg-background">
          <h2 className="text-lg font-bold text-foreground text-center mb-4">
            Own For Just
          </h2>
          
          <div className="space-y-3">
            {/* 1 Bed + Den */}
            <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20 overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                POPULAR
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">1 Bed + Den</div>
                  <div className="text-xs text-muted-foreground">570 sqft</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">$1,950</div>
                  <div className="text-xs text-muted-foreground">/month • 10% down</div>
                </div>
              </div>
            </div>
            
            {/* 2 Bed 2 Bath */}
            <div className="relative bg-gradient-to-br from-foreground to-foreground/90 rounded-2xl p-5 border border-foreground overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                BEST VALUE
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-background">2 Bed 2 Bath</div>
                  <div className="text-xs text-background/70">774 sqft</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-background">$2,500</div>
                  <div className="text-xs text-background/70">/month • 10% down</div>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-center text-[10px] text-muted-foreground mt-3">
            *Based on current rates. Contact for personalized estimate.
          </p>
        </section>

        <section className="px-5 py-4 bg-primary/10 border-y border-primary/20">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm font-medium text-foreground">
              {CAMPAIGN_OVERRIDES.urgencyText}
            </p>
          </div>
        </section>

        {/* Why Act Now Section */}
        <section className="px-5 py-6">
          <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <h3 className="text-lg font-semibold text-foreground mb-3">Why Get In Now?</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Lock in today's pricing before public launch</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>First access to the best floor plans and views</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Exclusive incentives for early registrants</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Expert guidance from Vancouver's presale specialists</span>
              </li>
            </ul>
          </Card>
        </section>


        {/* Lead Form Section */}
        <section id="lead-form-section" className="px-5 py-8 bg-muted/50">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Get Exclusive Access
            </h2>
            <p className="text-muted-foreground text-sm">
              Be the first to receive floor plans, pricing, and VIP incentives
            </p>
          </div>
          
          <ProjectLeadForm projectId={project.id} projectName="Exclusive Pre-Construction Opportunity" status={project.status === "active" ? "active" : "registering"} brochureUrl={getBrochureUrl()} />
        </section>

        {/* Premium Trust Footer - No external links */}
        <footer className="px-5 py-8 bg-gradient-to-b from-foreground to-foreground/95 text-background">
          <div className="text-center space-y-5">
            {/* Logo */}
            
            
            {/* Tagline */}
            <p className="text-sm font-medium text-background/80">
              Vancouver's New Construction Specialists
            </p>
            
            {/* Trust Badges */}
            <div className="flex justify-center gap-6 py-2">
              <div className="text-center">
                <p className="text-lg font-bold text-primary">150+</p>
                <p className="text-xs text-background/50">Projects</p>
              </div>
              <div className="w-px bg-background/20" />
              <div className="text-center">
                <p className="text-lg font-bold text-primary">400+</p>
                <p className="text-xs text-background/50">Happy Buyers</p>
              </div>
              <div className="w-px bg-background/20" />
              <div className="text-center">
                <p className="text-lg font-bold text-primary">5★</p>
                <p className="text-xs text-background/50">Rated</p>
              </div>
            </div>
            
            {/* Divider */}
            <div className="w-16 h-px bg-primary/40 mx-auto" />
            
            {/* Legal */}
            <div className="space-y-1">
              <p className="text-xs text-background/40">
                © {new Date().getFullYear()} Presale Properties. All rights reserved.
              </p>
              <p className="text-xs text-background/30">
                Licensed Real Estate Professionals | REAL Broker
              </p>
            </div>
          </div>
        </footer>

        {/* Sticky Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-border/50 safe-area-bottom z-40">
          <Button onClick={scrollToForm} size="lg" className="w-full h-12 text-base font-semibold rounded-xl shadow-gold">
            {CAMPAIGN_OVERRIDES.ctaText}
          </Button>
        </div>

        {/* Bottom padding for sticky CTA */}
        <div className="h-24" />
      </div>
    </>;
};
export default AdLandingPage;