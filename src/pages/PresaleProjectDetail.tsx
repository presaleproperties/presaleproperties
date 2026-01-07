import { useEffect, useState, useRef } from "react";
import { useParams, Link, useSearchParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { GalleryWithLightbox } from "@/components/ui/lightbox-gallery";
import { ProjectLeadForm } from "@/components/projects/ProjectLeadForm";
import { ProjectHighlights } from "@/components/projects/ProjectHighlights";
import { CityProjectsCarousel } from "@/components/home/CityProjectsCarousel";
import { BookingModal } from "@/components/booking/BookingModal";
import { InlineScheduler } from "@/components/booking/InlineScheduler";

import { ProjectMobileCTA } from "@/components/projects/ProjectMobileCTA";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLoftyProjectTracking } from "@/hooks/useLoftyTracking";
import { 
  MapPin,
  Calendar,
  Building2,
  DollarSign,
  Download,
  ChevronLeft,
  Loader2,
  Phone,
  CheckCircle,
  Home,
  Layers,
  Star,
  Share2,
  CalendarCheck,
  Eye
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  slug: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  city: string;
  neighborhood: string;
  address: string | null;
  developer_name: string | null;
  project_type: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  unit_mix: string | null;
  starting_price: number | null;
  deposit_structure: string | null;
  strata_fees: string | null;
  assignment_fees: string | null;
  incentives: string | null;
  completion_month: number | null;
  completion_year: number | null;
  occupancy_estimate: string | null;
  short_description: string | null;
  full_description: string | null;
  highlights: string[] | null;
  amenities: string[] | null;
  faq: { question: string; answer: string }[] | null;
  featured_image: string | null;
  gallery_images: string[] | null;
  floorplan_files: string[] | null;
  brochure_files: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  is_featured: boolean;
  published_at: string | null;
  map_lat: number | null;
  map_lng: number | null;
};

export default function PresaleProjectDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | undefined>();
  const [bookingTimePeriod, setBookingTimePeriod] = useState<string | undefined>();

  // Track project view to Lofty CRM
  useLoftyProjectTracking(project);

  const handleRequestTour = (date: Date, timePeriod: string) => {
    setBookingDate(date);
    setBookingTimePeriod(timePeriod);
    setBookingOpen(true);
  };

  const handleAskQuestion = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window !== "undefined") {
      if ((window as any).gtag) {
        (window as any).gtag("event", eventName, params);
      }
      if ((window as any).fbq && eventName === "project_view") {
        (window as any).fbq("track", "ViewContent", {
          content_name: params?.project_name,
          content_category: "presale_project",
        });
      }
    }
  };

  const handleGetPlansClick = () => {
    trackEvent("click_get_plans", {
      project_name: project?.name,
      project_city: project?.city,
      project_status: project?.status,
    });
    handleAskQuestion();
  };

  const handleScheduleTourClick = (date: Date, timePeriod: string) => {
    trackEvent("click_schedule_tour", {
      project_name: project?.name,
      project_city: project?.city,
      selected_date: date.toISOString(),
      time_period: timePeriod,
    });
    handleRequestTour(date, timePeriod);
  };

  const canonicalUrl = `https://presaleproperties.com${location.pathname}`;

  const previewToken = searchParams.get("preview");

  useEffect(() => {
    if (slug) {
      fetchProject();
    }
  }, [slug, previewToken]);

  const fetchProject = async () => {
    try {
      // If preview token is present, fetch without is_published filter
      // and verify user is admin
      if (previewToken) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if user is admin
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (roleData) {
            // Admin can preview unpublished projects
            const { data, error } = await supabase
              .from("presale_projects")
              .select("*")
              .eq("slug", slug)
              .maybeSingle();

            if (error) throw error;
            if (data) {
              setProject({
                ...data,
                faq: (Array.isArray(data.faq) ? data.faq : []) as { question: string; answer: string }[]
              });
              setSelectedImage(data.featured_image);
              setIsPreviewMode(!data.is_published);
              setLoading(false);
              return;
            }
          }
        }
      }

      // Default: fetch only published projects
      const { data, error } = await supabase
        .from("presale_projects")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProject({
          ...data,
          faq: (Array.isArray(data.faq) ? data.faq : []) as { question: string; answer: string }[]
        });
        setSelectedImage(data.featured_image);
        
        // Track project view in analytics
        trackEvent("project_view", {
          project_id: data.id,
          project_name: data.name,
          project_city: data.city,
          project_neighborhood: data.neighborhood,
          project_status: data.status,
          project_type: data.project_type,
        });
        
        // Increment view count in database
        supabase.rpc('increment_project_view', { project_id: data.id });
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "coming_soon":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-xs px-2 py-0.5">Coming Soon</Badge>;
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600 text-xs px-2 py-0.5">Now Selling</Badge>;
      case "sold_out":
        return <Badge variant="secondary" className="text-xs px-2 py-0.5">Sold Out</Badge>;
      default:
        return null;
    }
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString("default", { month: "long" });
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    // Try native share API first (works on mobile and some desktop browsers)
    if (navigator.share && navigator.canShare?.({ url: shareUrl })) {
      try {
        await navigator.share({
          title: project?.name,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed - fall through to clipboard
      }
    }
    
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied to clipboard!" });
    } catch (err) {
      // Final fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  if (loading) {
    return (
      <>
        <ConversionHeader />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </>
    );
  }

  if (!project) {
    return (
      <>
        <ConversionHeader />
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The project you're looking for doesn't exist or is no longer available.
          </p>
          <Link to="/presale-projects">
            <Button>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const allImages = [
    project.featured_image,
    ...(project.gallery_images || [])
  ].filter(Boolean) as string[];

  // SEO helpers
  const projectTypeLabel = project.project_type === "condo" ? "Condos" : 
                           project.project_type === "townhome" ? "Townhomes" : 
                           project.project_type === "mixed" ? "Mixed-Use Development" :
                           project.project_type === "duplex" ? "Duplexes" : "Single Family Homes";
  
  const seoTitle = project.seo_title || 
    `${project.name} | New ${projectTypeLabel} in ${project.neighborhood}, ${project.city}`;
  
  const seoDescription = project.seo_description || project.short_description ||
    `${project.name} - New presale ${project.project_type} development in ${project.neighborhood}, ${project.city}. ${project.starting_price ? `Starting from $${project.starting_price.toLocaleString()}.` : ""} ${project.completion_year ? `Estimated completion ${project.completion_year}.` : ""} View floor plans, pricing & register for VIP access.`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": project.name,
    "description": seoDescription,
    "url": canonicalUrl,
    "image": project.featured_image || undefined,
    "datePosted": project.published_at || undefined,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": project.city,
      "addressRegion": "BC",
      "addressCountry": "CA",
      "streetAddress": project.address || project.neighborhood
    },
    "geo": project.map_lat && project.map_lng ? {
      "@type": "GeoCoordinates",
      "latitude": project.map_lat,
      "longitude": project.map_lng
    } : undefined,
    "offers": project.starting_price ? {
      "@type": "Offer",
      "priceCurrency": "CAD",
      "price": project.starting_price,
      "priceValidUntil": project.completion_year ? `${project.completion_year}-12-31` : undefined,
      "availability": project.status === "sold_out" ? "https://schema.org/SoldOut" : 
                      project.status === "coming_soon" ? "https://schema.org/PreOrder" : 
                      "https://schema.org/InStock"
    } : undefined,
    "additionalType": project.project_type === "condo" ? "https://schema.org/Apartment" :
                      project.project_type === "townhome" ? "https://schema.org/House" : 
                      "https://schema.org/Residence"
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://presaleproperties.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Presale Projects",
        "item": "https://presaleproperties.com/presale-projects"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": project.city,
        "item": `https://presaleproperties.com/presale-projects?city=${encodeURIComponent(project.city)}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": project.name,
        "item": canonicalUrl
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={`${project.name}, presale ${project.city}, new ${project.project_type} ${project.neighborhood}, ${project.developer_name || ""} development, pre-construction ${project.city}, ${project.neighborhood} new homes`} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="realestate.listing" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="PresaleProperties.com" />
        {project.featured_image && <meta property="og:image" content={project.featured_image} />}
        <meta property="og:locale" content="en_CA" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        {project.featured_image && <meta name="twitter:image" content={project.featured_image} />}
        
        {/* Geo */}
        <meta name="geo.region" content="CA-BC" />
        <meta name="geo.placename" content={project.city} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
      </Helmet>

      <ConversionHeader />

      <main className="min-h-screen bg-background pb-24 lg:pb-0">
        {/* Preview Mode Banner */}
        {isPreviewMode && (
          <div className="bg-yellow-500 text-yellow-950 py-2 px-4 text-center text-sm font-medium">
            Preview Mode — This project is not published yet
          </div>
        )}

        {/* Hero - Side-by-side layout on tablet and desktop */}
        <section className="bg-gradient-to-b from-muted/30 to-background">
          <div className="container px-3 py-3 md:px-4 md:py-5 lg:py-6">
            <div className="grid lg:grid-cols-5 gap-3 md:gap-5 lg:gap-6">
              {/* Gallery - Full width on mobile/tablet, 3 columns on desktop */}
              <div className="lg:col-span-3">
                <GalleryWithLightbox
                  images={allImages}
                  selectedIndex={allImages.indexOf(selectedImage || allImages[0])}
                  onSelectIndex={(index) => setSelectedImage(allImages[index])}
                  alt={project.name}
                  compact
                />
              </div>

              {/* Project Info - Full width on mobile/tablet, 2 columns on desktop */}
              <div className="lg:col-span-2 flex flex-col">
                {/* Status Badge Row */}
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                  {getStatusBadge(project.status)}
                  {project.is_featured && (
                    <Badge className="bg-yellow-500/90 hover:bg-yellow-500 text-white text-xs px-2 py-0.5">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                  )}
                </div>

                {/* Title and City Badge */}
                <div className="flex flex-wrap items-center gap-2 mb-1.5 md:mb-2">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">{project.name}</h1>
                  <Badge variant="secondary" className="md:hidden text-[10px] px-1.5 py-0.5 font-medium">
                    {project.city}
                  </Badge>
                </div>
                
                {project.starting_price ? (
                  <div className="mb-2 md:mb-3">
                    <span className="text-lg md:text-xl font-semibold text-primary">
                      From {formatPrice(project.starting_price)}
                    </span>
                  </div>
                ) : (
                  <div className="text-base md:text-lg text-muted-foreground mb-2 md:mb-3">Contact for pricing</div>
                )}

                {/* City/Neighborhood - shown prominently on mobile */}
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1 md:mb-3">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium text-foreground">{project.neighborhood}, {project.city}</span>
                </div>
                
                {/* Full Address - shown below on mobile, hidden if same as neighborhood */}
                {project.address && project.address !== `${project.neighborhood}, ${project.city}` && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2 md:hidden">
                    <span className="ml-5 truncate">{project.address}</span>
                  </div>
                )}

                {/* Quick Facts - visible on tablet and desktop, more compact */}
                <div className="hidden md:block space-y-1.5 lg:space-y-2 mb-2 lg:mb-3">
                  {project.developer_name && (
                    <div className="flex items-center gap-2 text-xs">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Developer:</span>
                      <span className="font-medium truncate">{project.developer_name}</span>
                    </div>
                  )}
                  {project.completion_year && (
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Completion:</span>
                      <span className="font-medium">
                        {project.completion_month ? `${getMonthName(project.completion_month)} ` : ""}{project.completion_year}
                      </span>
                    </div>
                  )}
                  {project.unit_mix && (
                    <div className="flex items-center gap-2 text-xs">
                      <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Units:</span>
                      <span className="font-medium truncate">{project.unit_mix}</span>
                    </div>
                  )}
                  {project.deposit_structure && (
                    <div className="flex items-center gap-2 text-xs">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Deposit:</span>
                      <span className="font-medium truncate">{project.deposit_structure}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 md:mt-3 mb-2">
                  <Button
                    size="default"
                    onClick={handleGetPlansClick}
                    className="w-full justify-center font-semibold text-sm h-9 md:h-10"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Get Floor Plans
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleShare}
                    className="w-full justify-center text-sm h-9 md:h-10"
                  >
                    <Share2 className="h-4 w-4 mr-1.5" />
                    Share
                  </Button>
                </div>

                {/* Short description - visible on all screen sizes */}
                {project.short_description && (
                  <p className="text-sm md:text-sm lg:text-base text-muted-foreground mt-2 md:mt-3 leading-relaxed">
                    {project.short_description}
                  </p>
                )}

                {/* Inline Scheduler - Tablet and Desktop, directly under project info */}
                <div className="hidden md:block mt-4 lg:mt-3">
                  <InlineScheduler
                    projectId={project.id}
                    projectName={project.name}
                    projectCity={project.city}
                    projectNeighborhood={project.neighborhood}
                    onRequestTour={handleScheduleTourClick}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile-only Project Highlights Section */}
        <section className="border-t md:hidden">
          <div className="container px-3 py-4">
            <ProjectHighlights
              projectType={project.project_type}
              unitMix={project.unit_mix}
              completionMonth={project.completion_month}
              completionYear={project.completion_year}
              city={project.city}
              neighborhood={project.neighborhood}
              depositStructure={project.deposit_structure}
              incentives={project.incentives}
            />
          </div>
        </section>

        {/* Details Grid */}
        <section className="py-3 md:py-5 lg:py-8">
          <div className="container px-3 md:px-4">
            <div className="grid lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4 md:space-y-5 lg:space-y-6">
                {/* Amenities */}
                {project.amenities && project.amenities.length > 0 && (
                  <div className="bg-muted/30 rounded-xl p-4 md:p-5 lg:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-foreground mb-3 md:mb-4">Amenities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
                      {project.amenities.map((a, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 shrink-0" />
                          <span className="text-sm md:text-base text-foreground">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {project.full_description && (
                  <div className="bg-muted/30 rounded-xl p-4 md:p-5 lg:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-foreground mb-3 md:mb-4">Development Features</h2>
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      {project.full_description.split("\n").map((p, i) => (
                        <p key={i} className="text-sm lg:text-base leading-relaxed mb-3 last:mb-0">{p}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {project.highlights && project.highlights.length > 0 && (
                  <div className="bg-muted/30 rounded-xl p-4 md:p-5 lg:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-foreground mb-3 md:mb-4">Key Highlights</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3">
                      {project.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm md:text-base text-foreground">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}


                {/* Deposit & Incentives */}
                {(project.deposit_structure || project.strata_fees || project.assignment_fees || project.incentives) && (
                  <div className="bg-muted/30 rounded-xl p-4 md:p-5 lg:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-foreground mb-3 md:mb-4">Deposit & Fees</h2>
                    <div className="space-y-4 md:space-y-5">
                      {project.deposit_structure && (
                        <div>
                          <h4 className="font-semibold text-sm md:text-base mb-1.5">Deposit Structure</h4>
                          <p className="text-muted-foreground text-base md:text-lg">{project.deposit_structure}</p>
                        </div>
                      )}
                      {(project.strata_fees || project.assignment_fees) && (
                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                          {project.strata_fees && (
                            <div>
                              <h4 className="font-semibold text-sm md:text-base mb-1.5">Strata Fees (Est.)</h4>
                              <p className="text-muted-foreground text-base md:text-lg">{project.strata_fees}</p>
                            </div>
                          )}
                          {project.assignment_fees && (
                            <div>
                              <h4 className="font-semibold text-sm md:text-base mb-1.5">Assignment Fees</h4>
                              <p className="text-muted-foreground text-base md:text-lg">{project.assignment_fees}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {project.incentives && (
                        <div>
                          <h4 className="font-semibold text-sm md:text-base mb-1.5">Current Incentives</h4>
                          <p className="text-muted-foreground text-base md:text-lg">{project.incentives}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Downloads */}
                {((project.floorplan_files && project.floorplan_files.length > 0) || 
                  (project.brochure_files && project.brochure_files.length > 0)) && (
                  <div className="bg-muted/30 rounded-xl p-4 md:p-5 lg:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-foreground mb-3 md:mb-4">Downloads</h2>
                    <div className="flex flex-wrap gap-2.5">
                      {project.floorplan_files?.map((file, i) => (
                        <Button key={i} variant="outline" size="default" className="text-sm h-10" asChild>
                          <a href={file} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Floor Plan {i + 1}
                          </a>
                        </Button>
                      ))}
                      {project.brochure_files?.map((file, i) => (
                        <Button key={i} variant="outline" size="default" className="text-sm h-10" asChild>
                          <a href={file} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Brochure {i + 1}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Developer Info */}
                {project.developer_name && (
                  <div className="bg-muted/30 rounded-xl p-4 md:p-5 lg:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-foreground mb-2">Developer</h2>
                    <p className="font-medium text-base md:text-lg text-foreground">{project.developer_name}</p>
                  </div>
                )}

                {/* Mobile & Tablet Lead Form - positioned after deposits & developer */}
                <div className="lg:hidden">
                  <Separator className="my-2" />
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-bold text-foreground">Get Floor Plans & Pricing</h2>
                    <p className="text-sm text-muted-foreground mt-1">Submit your info to receive detailed information</p>
                  </div>
                  <div className="bg-background border rounded-xl p-5 shadow-sm">
                    <ProjectLeadForm
                      projectId={project.id}
                      projectName={project.name}
                      status={project.status}
                      brochureUrl={project.brochure_files?.[0] || null}
                    />
                    <Button variant="outline" size="default" className="w-full justify-center h-10 text-sm mt-3" asChild>
                      <a href="tel:+16722581100">
                        <Phone className="h-4 w-4 mr-1.5" />
                        Call Now
                      </a>
                    </Button>
                  </div>
                </div>

                {/* FAQ */}
                {project.faq && project.faq.length > 0 && (
                  <div className="bg-muted/30 rounded-xl p-4 md:p-5 lg:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-foreground mb-3 md:mb-4">Frequently Asked Questions</h2>
                    <Accordion type="single" collapsible className="w-full">
                      {project.faq.map((item, i) => (
                        <AccordionItem key={i} value={`faq-${i}`}>
                          <AccordionTrigger className="text-left text-sm md:text-base py-3 font-medium">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </div>

              {/* Sidebar - Desktop only (tablet forms are shown above) */}
              <div className="hidden lg:block lg:col-span-1">
                <div
                  ref={formRef}
                  id="contact-form"
                  className="w-full lg:sticky lg:top-20 space-y-4"
                >
                  {/* Lead Form */}
                  <ProjectLeadForm
                    projectId={project.id}
                    projectName={project.name}
                    status={project.status}
                    brochureUrl={project.brochure_files?.[0] || null}
                  />
                  
                  {/* Quick Actions Below Form */}
                  <Button variant="outline" size="default" className="w-full justify-center h-10 text-sm" asChild>
                    <a href="tel:+16722581100">
                      <Phone className="h-4 w-4 mr-1.5" />
                      Call Now
                    </a>
                  </Button>
                </div>
              </div>
              
              {/* Mobile-only InlineScheduler - positioned after FAQ for separation */}
              <div className="md:hidden">
                <div
                  ref={formRef}
                  id="contact-form-mobile"
                  className="w-full"
                >
                  <InlineScheduler
                    projectId={project.id}
                    projectName={project.name}
                    projectCity={project.city}
                    projectNeighborhood={project.neighborhood}
                    onRequestTour={handleScheduleTourClick}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Sticky CTA */}
      <ProjectMobileCTA
        projectName={project.name}
        status={project.status}
        startingPrice={project.starting_price}
        onRegisterClick={handleGetPlansClick}
      />

      {/* Booking Modal */}
      <BookingModal
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        projectId={project.id}
        projectName={project.name}
        projectCity={project.city}
        projectNeighborhood={project.neighborhood}
        projectUrl={canonicalUrl}
        initialDate={bookingDate}
        initialTimePeriod={bookingTimePeriod}
      />

      {/* More Projects from Same City */}
      <section className="bg-muted/30 py-8 md:py-12">
        <div className="container px-4">
          <CityProjectsCarousel
            city={project.city}
            title={`More Projects in ${project.city}`}
            subtitle="Explore similar presale opportunities nearby"
            excludeSlug={project.slug}
          />
        </div>
      </section>

      <Footer />
    </>
  );
}
