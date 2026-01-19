import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MapPin, Calendar, Building2, Play, Pause, ChevronDown } from "lucide-react";
import { ProjectLeadForm } from "@/components/projects/ProjectLeadForm";

// ============================================
// AD LANDING PAGE CONFIGURATION
// Edit these values to customize for each campaign
// ============================================
const CAMPAIGN_CONFIG = {
  // Project details (hidden from user but used for tracking)
  projectId: "campaign-landing", // Change to actual project ID when running ads
  projectName: "Exclusive Pre-Construction Opportunity", // Used in lead form
  brochureUrl: null as string | null, // Add brochure URL if available
  
  // Hero section content
  heroHeadline: "Exclusive Pre-Construction Opportunity",
  heroSubheadline: "Limited Units Available in Metro Vancouver's Most Anticipated Development",
  
  // Location teaser (vague to maintain mystery)
  locationTeaser: "Prime Metro Vancouver Location",
  
  // Key selling points
  sellingPoints: [
    "Starting from the low $400s",
    "Move-in ready by 2027",
    "Steps from rapid transit",
    "Developer incentives available",
  ],
  
  // Media assets - add your videos and images here
  heroVideo: null as string | null, // e.g., "/videos/campaign-hero.mp4"
  heroImage: null as string | null, // Fallback image if no video
  
  // Gallery media (videos and images)
  galleryMedia: [
    // Add media items like:
    // { type: "video", src: "/videos/interior.mp4", poster: "/images/interior-poster.jpg" },
    // { type: "image", src: "/images/exterior.jpg", alt: "Stunning exterior" },
  ] as Array<{ type: "video" | "image"; src: string; poster?: string; alt?: string }>,
  
  // Urgency messaging
  urgencyBadge: "Limited Time Offer",
  urgencyText: "Only 12 units remaining at pre-construction pricing",
  
  // CTA text
  ctaText: "Get Floor Plans & Pricing",
};

const AdLandingPage = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const scrollToForm = () => {
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("lead-form-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <>
      <Helmet>
        <title>{CAMPAIGN_CONFIG.heroHeadline} | Presale Properties</title>
        <meta name="description" content={CAMPAIGN_CONFIG.heroSubheadline} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Minimal Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/50 safe-area-top">
          <div className="flex items-center justify-center h-14 px-4">
            <img 
              src="/logo.svg" 
              alt="Presale Properties" 
              className="h-8 w-auto"
            />
          </div>
        </header>

        {/* Hero Section with Video/Image */}
        <section className="pt-14 relative">
          {/* Hero Media */}
          <div className="relative aspect-[4/3] bg-muted overflow-hidden">
            {CAMPAIGN_CONFIG.heroVideo ? (
              <>
                <video
                  src={CAMPAIGN_CONFIG.heroVideo}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                />
                <button
                  className="absolute bottom-4 right-4 p-3 rounded-full bg-black/50 text-white backdrop-blur-sm"
                  onClick={(e) => {
                    const video = e.currentTarget.previousElementSibling as HTMLVideoElement;
                    if (video.paused) {
                      video.play();
                    } else {
                      video.pause();
                    }
                  }}
                >
                  {isVideoPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
              </>
            ) : CAMPAIGN_CONFIG.heroImage ? (
              <img
                src={CAMPAIGN_CONFIG.heroImage}
                alt="Exclusive development"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              // Placeholder gradient when no media
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
                <Building2 className="h-24 w-24 text-primary/30" />
              </div>
            )}
            
            {/* Urgency Badge */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1.5 text-sm shadow-lg">
                {CAMPAIGN_CONFIG.urgencyBadge}
              </Badge>
            </div>
          </div>

          {/* Hero Content */}
          <div className="px-5 py-6 space-y-4">
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              {CAMPAIGN_CONFIG.heroHeadline}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              {CAMPAIGN_CONFIG.heroSubheadline}
            </p>
            
            {/* Location Teaser */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium">{CAMPAIGN_CONFIG.locationTeaser}</span>
            </div>

            {/* Primary CTA */}
            <Button 
              onClick={scrollToForm}
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-xl shadow-gold hover:shadow-gold-glow"
            >
              {CAMPAIGN_CONFIG.ctaText}
            </Button>
          </div>
        </section>

        {/* Selling Points */}
        <section className="px-5 py-6 bg-muted/30">
          <div className="space-y-3">
            {CAMPAIGN_CONFIG.sellingPoints.map((point, index) => (
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
              {CAMPAIGN_CONFIG.urgencyText}
            </p>
          </div>
        </section>

        {/* Gallery Section */}
        {CAMPAIGN_CONFIG.galleryMedia.length > 0 && (
          <section className="px-5 py-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Preview the Lifestyle</h2>
            <div className="space-y-4">
              {CAMPAIGN_CONFIG.galleryMedia.map((media, index) => (
                <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                  {media.type === "video" ? (
                    <video
                      src={media.src}
                      poster={media.poster}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      src={media.src}
                      alt={media.alt || "Development preview"}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

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

        {/* Scroll indicator when form is hidden */}
        {!showForm && (
          <div className="px-5 py-4 text-center">
            <button 
              onClick={scrollToForm}
              className="inline-flex flex-col items-center gap-1 text-muted-foreground"
            >
              <span className="text-sm">Get exclusive access</span>
              <ChevronDown className="h-5 w-5 animate-bounce" />
            </button>
          </div>
        )}

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
            projectId={CAMPAIGN_CONFIG.projectId}
            projectName={CAMPAIGN_CONFIG.projectName}
            status="registering"
            brochureUrl={CAMPAIGN_CONFIG.brochureUrl}
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-border/50 safe-area-bottom z-40 hide-on-keyboard">
          <Button 
            onClick={scrollToForm}
            size="lg"
            className="w-full h-12 text-base font-semibold rounded-xl shadow-gold"
          >
            {CAMPAIGN_CONFIG.ctaText}
          </Button>
        </div>

        {/* Bottom padding for sticky CTA */}
        <div className="h-24" />
      </div>
    </>
  );
};

export default AdLandingPage;
