import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  MapPin, 
  Calendar, 
  Building2, 
  Play, 
  Pause, 
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
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
  locationTeaser: null as string | null, // null = use "Prime {city} Location"
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
  const { data: project, isLoading, error } = useQuery({
    queryKey: ["ad-landing-project", projectSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select(`
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
        `)
        .eq("slug", projectSlug)
        .single();
      
      if (error) throw error;
      return data;
    },
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
      return firstSentence.length > 100 
        ? firstSentence.substring(0, 100) + "..." 
        : firstSentence + ".";
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
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
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

  const scrollToForm = () => {
    document.getElementById("lead-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-5 pt-8">
        <Skeleton className="aspect-[4/3] w-full rounded-xl mb-4" />
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-5">
        <Card className="p-6 text-center max-w-sm">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-lg font-semibold mb-2">Project Not Found</h1>
          <p className="text-sm text-muted-foreground">
            This exclusive opportunity may no longer be available.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{getHeadline()} | Presale Properties</title>
        <meta name="description" content={getSubheadline()} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* NO HEADER - Clean edge-to-edge mobile experience */}

        {/* Hero Gallery with Swipe - Tall hero for impact */}
        <section className="relative">
          <div 
            className="relative h-[65vh] min-h-[400px] max-h-[600px] bg-muted overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Video Player */}
            {showVideo && CAMPAIGN_OVERRIDES.videoUrl ? (
              <div className="absolute inset-0 bg-black">
                <video
                  src={CAMPAIGN_OVERRIDES.videoUrl}
                  className="w-full h-full object-contain"
                  autoPlay
                  controls
                  playsInline
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                  onEnded={() => setShowVideo(false)}
                />
                <button
                  onClick={() => setShowVideo(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white"
                >
                  ✕
                </button>
              </div>
            ) : images.length > 0 ? (
              <>
                {/* Current Image - Optimized loading */}
                <img
                  src={images[currentImageIndex]}
                  alt="Property preview"
                  className="absolute inset-0 w-full h-full object-cover will-change-transform"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
                
                {/* Image Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 text-white backdrop-blur-sm active:scale-95 transition-transform"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 text-white backdrop-blur-sm active:scale-95 transition-transform"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                {/* Image Dots Indicator */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.slice(0, 6).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          idx === currentImageIndex 
                            ? "bg-white scale-110" 
                            : "bg-white/50"
                        }`}
                        aria-label={`Go to image ${idx + 1}`}
                      />
                    ))}
                    {images.length > 6 && (
                      <span className="text-white/80 text-xs ml-1 self-center">+{images.length - 6}</span>
                    )}
                  </div>
                )}

                {/* Video Play Button (if video available) */}
                {CAMPAIGN_OVERRIDES.videoUrl && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className="absolute bottom-4 right-4 p-3 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
                    aria-label="Play video"
                  >
                    <Play className="h-5 w-5" />
                  </button>
                )}

                {/* Gradient overlay for text readability */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
                <Building2 className="h-24 w-24 text-primary/30" />
              </div>
            )}
            
            {/* Urgency Badge - Top left */}
            <div className="absolute top-4 left-4 safe-area-top">
              <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1.5 text-sm shadow-lg">
                {CAMPAIGN_OVERRIDES.urgencyBadge}
              </Badge>
            </div>

            {/* Photo Count Badge */}
            {images.length > 1 && (
              <div className="absolute top-4 right-4 safe-area-top">
                <Badge variant="secondary" className="bg-black/60 text-white border-0 font-medium">
                  {currentImageIndex + 1} / {images.length}
                </Badge>
              </div>
            )}

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

          {/* Compact CTA section - immediately visible */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {getSubheadline()}
            </p>

            {/* Primary CTA */}
            <Button 
              onClick={scrollToForm}
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-xl shadow-gold hover:shadow-gold-glow"
            >
              {CAMPAIGN_OVERRIDES.ctaText}
            </Button>
          </div>
        </section>

        {/* Selling Points */}
        <section className="px-5 py-6 bg-muted/30">
          <div className="space-y-3">
            {getSellingPoints().map((point, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground font-medium">{point}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Urgency Banner */}
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

        {/* Scroll indicator */}
        <div className="px-5 py-4 text-center">
          <button 
            onClick={scrollToForm}
            className="inline-flex flex-col items-center gap-1 text-muted-foreground"
          >
            <span className="text-sm">Get exclusive access</span>
            <ChevronDown className="h-5 w-5 animate-bounce" />
          </button>
        </div>

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
          
          <ProjectLeadForm 
            projectId={project.id}
            projectName="Exclusive Pre-Construction Opportunity"
            status={project.status === "active" ? "active" : "registering"}
            brochureUrl={getBrochureUrl()}
          />
        </section>

        {/* Trust Footer */}
        <footer className="px-5 py-6 bg-foreground text-background">
          <div className="text-center space-y-3">
            <img 
              src="/logo.svg" 
              alt="Presale Properties" 
              className="h-6 w-auto mx-auto invert"
            />
            <p className="text-xs text-background/60">
              Vancouver's New Construction Specialists
            </p>
            <p className="text-xs text-background/40">
              © {new Date().getFullYear()} Presale Properties. All rights reserved.
            </p>
          </div>
        </footer>

        {/* Sticky Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-border/50 safe-area-bottom z-40">
          <Button 
            onClick={scrollToForm}
            size="lg"
            className="w-full h-12 text-base font-semibold rounded-xl shadow-gold"
          >
            {CAMPAIGN_OVERRIDES.ctaText}
          </Button>
        </div>

        {/* Bottom padding for sticky CTA */}
        <div className="h-24" />
      </div>
    </>
  );
};

export default AdLandingPage;
