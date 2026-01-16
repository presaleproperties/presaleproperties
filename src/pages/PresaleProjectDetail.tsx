import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useParams, Link, useSearchParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { generateProjectCanonicalUrl, parseProjectUrl, slugify } from "@/lib/seoUrls";
import { generateProjectFAQs, generateFAQSchema, generateSEOTitle, generateSEODescription, type FAQItem } from "@/lib/seoFaq";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ProjectContextualLinks } from "@/components/seo/ProjectContextualLinks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { REWPhotoGallery } from "@/components/resale/REWPhotoGallery";
import { ProjectLeadForm } from "@/components/projects/ProjectLeadForm";
import { ProjectHighlights } from "@/components/projects/ProjectHighlights";
import { CityProjectsCarousel } from "@/components/home/CityProjectsCarousel";
import { NeighborhoodProjectsCarousel } from "@/components/home/NeighborhoodProjectsCarousel";
import { BookingModal } from "@/components/booking/BookingModal";
import { InlineScheduler } from "@/components/booking/InlineScheduler";
import { FloorPlanModal } from "@/components/projects/FloorPlanModal";
import { InvestmentAnalysis } from "@/components/projects/InvestmentAnalysis";
import { LocationDeepDive } from "@/components/projects/LocationDeepDive";
import { ProjectLeadMagnetsBar, SaveProjectButton, PriceAlertButton } from "@/components/conversion/LeadMagnets";
import { ProjectMobileCTA } from "@/components/projects/ProjectMobileCTA";
import { PropertyStickyHeader } from "@/components/mobile/PropertyStickyHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLoftyProjectTracking } from "@/hooks/useLoftyTracking";
import { usePropertyViewTracking } from "@/hooks/useBehaviorTracking";
import { trackFloorplanView, trackFloorplanDownload, trackCTAClick } from "@/lib/tracking";
import { MetaEvents, MetaCustomEvents } from "@/components/tracking/MetaPixel";
import { MapPin, Calendar, Building2, DollarSign, Download, ChevronLeft, Loader2, Phone, CheckCircle, Home, Layers, Star, Share2, CalendarCheck, Eye, Gift } from "lucide-react";
type Project = {
  id: string;
  name: string;
  slug: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  city: string;
  neighborhood: string;
  address: string | null;
  developer_id: string | null;
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
  faq: {
    question: string;
    answer: string;
  }[] | null;
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
  const {
    slug,
    seoSlug,
    cityProductSlug
  } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const {
    toast
  } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | undefined>();
  const [bookingTimePeriod, setBookingTimePeriod] = useState<string | undefined>();
  const [floorPlanModalOpen, setFloorPlanModalOpen] = useState(false);

  // Track project view to Lofty CRM (legacy)
  useLoftyProjectTracking(project);

  // Track project view with new behavioral tracking
  usePropertyViewTracking(project ? {
    project_id: project.id,
    project_name: project.name,
    address: project.address || undefined,
    city: project.city,
    price_from: project.starting_price
  } : null);
  const handleRequestTour = (date: Date, timePeriod: string) => {
    setBookingDate(date);
    setBookingTimePeriod(timePeriod);
    setBookingOpen(true);
  };
  const handleAskQuestion = () => {
    formRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };
  const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window !== "undefined") {
      if ((window as any).gtag) {
        (window as any).gtag("event", eventName, params);
      }
      // Track ViewContent via Meta Pixel when project loads
      if (eventName === "project_view" && project) {
        MetaEvents.viewContent({
          content_name: project.name,
          content_ids: [project.id],
          content_type: "presale_project",
          content_category: project.project_type,
          value: project.starting_price || undefined,
          currency: "CAD"
        });
      }
    }
  };
  const handleGetPlansClick = () => {
    trackEvent("click_get_plans", {
      project_name: project?.name,
      project_city: project?.city,
      project_status: project?.status
    });

    // Track with behavioral tracking
    if (project) {
      trackCTAClick({
        cta_name: "get_floor_plans",
        cta_location: "project_detail_cta",
        destination_url: window.location.href
      });
      trackFloorplanView({
        project_id: project.id,
        project_name: project.name
      });
    }

    // On mobile, open modal instead of scrolling
    if (window.innerWidth < 1024) {
      setFloorPlanModalOpen(true);
    } else {
      handleAskQuestion();
    }
  };
  const handleScheduleTourClick = (date: Date, timePeriod: string) => {
    trackEvent("click_schedule_tour", {
      project_name: project?.name,
      project_city: project?.city,
      selected_date: date.toISOString(),
      time_period: timePeriod
    });

    // Track with behavioral tracking
    if (project) {
      trackCTAClick({
        cta_name: "schedule_tour",
        cta_location: "project_detail_scheduler"
      });
    }
    handleRequestTour(date, timePeriod);
  };

  // Will be updated with project data once loaded - for now use current URL
  const currentUrl = `https://presaleproperties.com${location.pathname}`;
  const previewToken = searchParams.get("preview");

  // Determine actual slug from URL params
  // Handles /presale-projects/:slug, /:seoSlug, and /:cityProductSlug patterns
  const actualSlug = slug || (() => {
    // Check both seoSlug and cityProductSlug (from CityProductPage routing)
    const urlSlug = seoSlug || cityProductSlug;
    if (urlSlug) {
      // Parse SEO-friendly URL: {neighborhood}-presale-{type}-{slug}
      const match = urlSlug.match(/^(.+)-presale-(condos|townhomes|homes|duplexes)-(.+)$/);
      return match ? match[3] : urlSlug;
    }
    return null;
  })();
  useEffect(() => {
    if (actualSlug) {
      fetchProject();
    }
  }, [actualSlug, previewToken]);
  const fetchProject = async () => {
    try {
      // If preview token is present, fetch without is_published filter
      // and verify user is admin
      if (previewToken) {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (user) {
          // Check if user is admin
          const {
            data: roleData
          } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
          if (roleData) {
            // Admin can preview unpublished projects
            const {
              data,
              error
            } = await supabase.from("presale_projects").select("*").eq("slug", actualSlug).maybeSingle();
            if (error) throw error;
            if (data) {
              setProject({
                ...data,
                faq: (Array.isArray(data.faq) ? data.faq : []) as {
                  question: string;
                  answer: string;
                }[]
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
      const {
        data,
        error
      } = await supabase.from("presale_projects").select("*").eq("slug", actualSlug).eq("is_published", true).maybeSingle();
      if (error) throw error;
      if (data) {
        setProject({
          ...data,
          faq: (Array.isArray(data.faq) ? data.faq : []) as {
            question: string;
            answer: string;
          }[]
        });
        setSelectedImage(data.featured_image);

        // Track project view in analytics
        trackEvent("project_view", {
          project_id: data.id,
          project_name: data.name,
          project_city: data.city,
          project_neighborhood: data.neighborhood,
          project_status: data.status,
          project_type: data.project_type
        });

        // Increment view count in database
        supabase.rpc('increment_project_view', {
          project_id: data.id
        });
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };
  const scrollToForm = () => {
    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0
    }).format(price);
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "coming_soon":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-0.5">Coming Soon</Badge>;
      case "active":
        return <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-2 py-0.5">Now Selling</Badge>;
      case "sold_out":
        return <Badge variant="secondary" className="text-xs px-2 py-0.5">Sold Out</Badge>;
      default:
        return null;
    }
  };
  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString("default", {
      month: "long"
    });
  };
  const handleShare = async () => {
    const shareUrl = window.location.href;

    // Try native share API first (works on mobile and some desktop browsers)
    if (navigator.share && navigator.canShare?.({
      url: shareUrl
    })) {
      try {
        await navigator.share({
          title: project?.name,
          url: shareUrl
        });
        return;
      } catch (err) {
        // User cancelled or share failed - fall through to clipboard
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied to clipboard!"
      });
    } catch (err) {
      // Final fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast({
        title: "Link copied to clipboard!"
      });
    }
  };
  if (loading) {
    return <>
        <ConversionHeader />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </>;
  }
  if (!project) {
    return <>
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
      </>;
  }
  const allImages = [project.featured_image, ...(project.gallery_images || [])].filter(Boolean) as string[];

  // SEO helpers
  const projectTypeLabel = project.project_type === "condo" ? "Condos" : project.project_type === "townhome" ? "Townhomes" : project.project_type === "mixed" ? "Mixed-Use Development" : project.project_type === "duplex" ? "Duplexes" : "Single Family Homes";
  const projectTypeSingular = project.project_type === "condo" ? "condos" : project.project_type === "townhome" ? "townhomes" : project.project_type === "mixed" ? "residences" : project.project_type === "duplex" ? "duplexes" : "homes";
  const priceDisplay = project.starting_price ? `from ${formatPrice(project.starting_price)}` : "";
  const unitMixShort = project.unit_mix || `Studios to ${projectTypeSingular}`;

  // Generate optimized SEO title (under 60 chars)
  // Pattern: [Project Name] [Location] - Presale [Type] from $[Price] | [Feature]
  const seoTitle = project.seo_title || generateSEOTitle({
    name: project.name,
    neighborhood: project.neighborhood,
    city: project.city,
    projectType: project.project_type,
    startingPrice: project.starting_price,
    developerName: project.developer_name,
    unitMix: project.unit_mix
  });

  // Generate optimized SEO description (155-160 chars)
  // Pattern: "[Name] presale [type] in [location]. [Units]. [Feature]. VIP pricing & floor plans."
  const seoDescription = project.seo_description || generateSEODescription({
    name: project.name,
    neighborhood: project.neighborhood,
    city: project.city,
    projectType: project.project_type,
    startingPrice: project.starting_price,
    unitMix: project.unit_mix,
    highlights: project.highlights
  });

  // Shorter OG description for social sharing
  const ogDescription = project.short_description || `Modern living in ${project.neighborhood}. Thoughtfully designed ${projectTypeSingular}${priceDisplay ? ` starting ${priceDisplay}` : ""}.`;

  // Generate comprehensive FAQs - use custom if available, otherwise auto-generate
  const projectFAQs: FAQItem[] = project.faq && project.faq.length > 0 ? project.faq : generateProjectFAQs({
    name: project.name,
    city: project.city,
    neighborhood: project.neighborhood,
    projectType: project.project_type,
    startingPrice: project.starting_price,
    depositStructure: project.deposit_structure,
    strataFees: project.strata_fees,
    assignmentFees: project.assignment_fees,
    completionYear: project.completion_year,
    completionMonth: project.completion_month,
    developerName: project.developer_name,
    amenities: project.amenities,
    highlights: project.highlights,
    incentives: project.incentives
  });

  // Generate FAQ schema for rich results
  const faqSchema = generateFAQSchema(projectFAQs);

  // Generate SEO-friendly canonical URL
  const canonicalUrl = generateProjectCanonicalUrl({
    slug: project.slug,
    neighborhood: project.neighborhood,
    projectType: project.project_type
  });
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
      "availability": project.status === "sold_out" ? "https://schema.org/SoldOut" : project.status === "coming_soon" ? "https://schema.org/PreOrder" : "https://schema.org/InStock"
    } : undefined,
    "additionalType": project.project_type === "condo" ? "https://schema.org/Apartment" : project.project_type === "townhome" ? "https://schema.org/House" : "https://schema.org/Residence"
  };

  // Product schema for enhanced rich snippets (Google Shopping, rich results)
  // Use simple Offer instead of AggregateOffer to avoid missing field warnings
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${project.name} ${project.neighborhood}`,
    "description": project.full_description || project.short_description || seoDescription,
    "image": project.featured_image || undefined,
    "brand": project.developer_name ? {
      "@type": "Organization",
      "name": project.developer_name
    } : undefined,
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "priceCurrency": "CAD",
      "price": project.starting_price || undefined,
      "availability": project.status === "sold_out" ? "https://schema.org/SoldOut" : project.status === "coming_soon" ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
      "priceValidUntil": project.completion_year ? `${project.completion_year}-12-31` : undefined
    },
    "category": "Residential Real Estate",
    "additionalProperty": [{
      "@type": "PropertyValue",
      "name": "Property Type",
      "value": projectTypeLabel
    }, {
      "@type": "PropertyValue",
      "name": "Status",
      "value": project.status === "active" ? "Now Selling" : project.status === "coming_soon" ? "Coming Soon" : project.status === "registering" ? "Registering" : "Sold Out"
    }, ...(project.completion_year ? [{
      "@type": "PropertyValue",
      "name": "Estimated Completion",
      "value": project.completion_month ? `${new Date(2000, project.completion_month - 1).toLocaleString("default", {
        month: "long"
      })} ${project.completion_year}` : `${project.completion_year}`
    }] : []), ...(project.deposit_structure ? [{
      "@type": "PropertyValue",
      "name": "Deposit Structure",
      "value": project.deposit_structure
    }] : [])],
    "location": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": project.address || project.neighborhood,
        "addressLocality": project.city,
        "addressRegion": "BC",
        "addressCountry": "CA"
      },
      ...(project.map_lat && project.map_lng ? {
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": project.map_lat,
          "longitude": project.map_lng
        }
      } : {})
    }
  };

  // Build breadcrumb items for visual and structured data
  const citySlugForBreadcrumb = slugify(project.city);
  const neighborhoodSlugForBreadcrumb = slugify(project.neighborhood);
  const breadcrumbItems = [{
    label: `${project.city} Presale`,
    href: `/${citySlugForBreadcrumb}-presale-condos`
  }, {
    label: project.neighborhood,
    href: `/${citySlugForBreadcrumb}-${neighborhoodSlugForBreadcrumb}-presale`
  }, {
    label: project.name
  }];
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://presaleproperties.com"
    }, {
      "@type": "ListItem",
      "position": 2,
      "name": `${project.city} Presale Properties`,
      "item": `https://presaleproperties.com/${citySlugForBreadcrumb}-presale-condos`
    }, {
      "@type": "ListItem",
      "position": 3,
      "name": project.neighborhood,
      "item": `https://presaleproperties.com/${citySlugForBreadcrumb}-${neighborhoodSlugForBreadcrumb}-presale`
    }, {
      "@type": "ListItem",
      "position": 4,
      "name": project.name,
      "item": canonicalUrl
    }]
  };
  return <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={`${project.name}, ${project.name} presale, ${project.neighborhood} presale ${projectTypeSingular}, ${project.city} presale ${projectTypeSingular}, new construction ${project.city}, ${project.developer_name || ""} ${project.city}, pre-construction ${project.neighborhood}, VIP presale ${project.city}`} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph - optimized for social sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${project.name} ${project.neighborhood} Presale ${projectTypeLabel}${priceDisplay ? ` | ${priceDisplay.charAt(0).toUpperCase() + priceDisplay.slice(1)}` : ""}`} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Presale Properties" />
        {project.featured_image && <meta property="og:image" content={project.featured_image} />}
        {project.featured_image && <meta property="og:image:alt" content={`${project.name} - ${project.neighborhood} presale ${projectTypeSingular}`} />}
        <meta property="og:locale" content="en_CA" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${project.name} ${project.neighborhood} Presale ${projectTypeLabel}${priceDisplay ? ` | ${priceDisplay.charAt(0).toUpperCase() + priceDisplay.slice(1)}` : ""}`} />
        <meta name="twitter:description" content={ogDescription} />
        {project.featured_image && <meta name="twitter:image" content={project.featured_image} />}
        
        {/* Geo targeting for local SEO */}
        <meta name="geo.region" content="CA-BC" />
        <meta name="geo.placename" content={`${project.neighborhood}, ${project.city}`} />
        {project.map_lat && project.map_lng && <meta name="geo.position" content={`${project.map_lat};${project.map_lng}`} />}
        {project.map_lat && project.map_lng && <meta name="ICBM" content={`${project.map_lat}, ${project.map_lng}`} />}
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
        {/* FAQ Schema for rich results */}
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <ConversionHeader hideOnMobile />

      {/* Mobile/Tablet Scroll-Up Sticky Header */}
      <PropertyStickyHeader
        price={project.starting_price ? formatPrice(project.starting_price) : "Contact for pricing"}
        specs={`${project.project_type === "condo" ? "Condos" : project.project_type === "townhome" ? "Townhomes" : project.project_type === "mixed" ? "Mixed" : project.project_type === "duplex" ? "Duplexes" : "Homes"} • ${project.neighborhood} • ${project.completion_year || "TBD"}`}
        onShare={handleShare}
        backPath="/presale-projects"
      />

      <main className="min-h-screen bg-background pb-24 lg:pb-0">
        <article itemScope itemType="https://schema.org/RealEstateListing">
        {/* Preview Mode Banner */}
        {isPreviewMode && <div className="bg-yellow-500 text-yellow-950 py-2 px-4 text-center text-sm font-medium">
            Preview Mode — This project is not published yet
          </div>}

        {/* Breadcrumbs - edge-to-edge section on mobile */}
        <div className="px-3 lg:container lg:px-4 pt-3 md:pt-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Hero - Side-by-side layout on tablet and desktop */}
        <section className="bg-gradient-to-b from-muted/30 to-background">
          <div className="lg:container px-0 lg:px-4 py-0 lg:py-4">
            {/* Desktop: 3-column grid matching resale page */}
            <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
              {/* Left Column - Gallery & Details (2 columns) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Gallery */}
                <REWPhotoGallery photos={allImages.map(url => ({
                  url
                }))} alt={project.name} previewAspectClassName="aspect-[3/2]" />

                {/* Desktop Quick Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {project.map_lat && project.map_lng && <Link to={`/map-search?lat=${project.map_lat}&lng=${project.map_lng}&zoom=16&project=${project.slug}`}>
                      <Button variant="outline" size="sm" className="h-8 px-3 text-xs rounded-full gap-1.5 hover:bg-muted">
                        <MapPin className="h-3.5 w-3.5" />
                        Map
                      </Button>
                    </Link>}
                  {project.map_lat && project.map_lng && <Button variant="outline" size="sm" className="h-8 px-3 text-xs rounded-full gap-1.5 hover:bg-muted" onClick={() => {
                      window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${project.map_lat},${project.map_lng}`, "_blank");
                    }}>
                      <Eye className="h-3.5 w-3.5" />
                      Street View
                    </Button>}
                  {project.map_lat && project.map_lng && <Button variant="outline" size="sm" className="h-8 px-3 text-xs rounded-full gap-1.5 hover:bg-muted" onClick={() => {
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${project.map_lat},${project.map_lng}`, "_blank");
                    }}>
                      <MapPin className="h-3.5 w-3.5" />
                      Directions
                    </Button>}
                  <div className="ml-auto">
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs rounded-full gap-1.5 hover:bg-muted" onClick={handleShare}>
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </Button>
                  </div>
                </div>

                {/* Desktop Price Section - Matching resale layout */}
                <div className="space-y-1.5">
                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(project.status)}
                    {project.is_featured && <Badge className="bg-yellow-500/90 hover:bg-yellow-500 text-white gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Featured
                      </Badge>}
                    <Badge variant="secondary" className="text-xs">
                      {project.project_type === "condo" ? "Condos" : project.project_type === "townhome" ? "Townhomes" : project.project_type === "mixed" ? "Mixed-Use" : project.project_type === "duplex" ? "Duplexes" : "Homes"}
                    </Badge>
                    {project.completion_year && <Badge variant="outline" className="text-xs gap-1">
                        <Calendar className="h-3 w-3" />
                        {project.completion_month ? `${getMonthName(project.completion_month)} ` : ""}{project.completion_year}
                      </Badge>}
                  </div>
                  
                  {/* Price with From prefix */}
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {project.starting_price ? <>
                        <span className="text-muted-foreground text-base font-medium">From</span>
                        <span className="text-3xl md:text-4xl font-bold text-foreground">
                          {formatPrice(project.starting_price)}
                        </span>
                      </> : <span className="text-2xl text-muted-foreground font-semibold">Contact for pricing</span>}
                  </div>

                  {/* Project Name as Title */}
                  <h1 className="text-xl md:text-2xl font-semibold text-foreground">
                    {project.name}
                  </h1>
                  
                  {/* Location */}
                  <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                    <Link to={`/${slugify(project.city)}-presale-condos`} className="text-primary hover:underline font-medium">
                      {project.city}
                    </Link>
                    <span className="mx-1">•</span>
                    <span className="font-medium">{project.neighborhood}</span>
                    {project.address && project.address !== `${project.neighborhood}, ${project.city}` && <>
                        <span className="mx-1">•</span>
                        <span>{project.address}</span>
                      </>}
                  </div>

                  {/* Quick Facts - Inline with icons */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-foreground">
                    {project.developer_name && <span className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{project.developer_name}</span>
                      </span>}
                    {project.unit_mix && <span className="flex items-center gap-1.5">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{project.unit_mix}</span>
                      </span>}
                    {project.deposit_structure && <span className="flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{project.deposit_structure}</span>
                      </span>}
                  </div>
                </div>

                {/* Description */}
                {project.short_description && <div>
                    <h2 className="text-lg md:text-xl font-bold text-foreground mb-3">About this project</h2>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {project.short_description}
                    </p>
                  </div>}
              </div>

              {/* Right Column - Form & Scheduler (Desktop Sidebar) */}
              <div className="lg:col-span-1">
                <div ref={formRef} id="contact-form-desktop" className="sticky top-24 space-y-4">
                  {/* Lead Form */}
                  <div className="bg-card border rounded-xl p-4 md:p-6 shadow-sm">
                    <ProjectLeadForm projectId={project.id} projectName={project.name} status={project.status} brochureUrl={project.brochure_files?.[0] || null} />
                  </div>
                  
                  {/* Inline Scheduler */}
                  <div className="bg-card border rounded-xl p-4 md:p-6 shadow-sm">
                    <InlineScheduler projectId={project.id} projectName={project.name} projectCity={project.city} projectNeighborhood={project.neighborhood} onRequestTour={handleScheduleTourClick} />
                  </div>

                  {/* Lead Magnets Bar */}
                  <ProjectLeadMagnetsBar projectId={project.id} projectName={project.name} city={project.city} />
                </div>
              </div>
            </div>

            {/* Mobile & Tablet Layout - Unchanged */}
            <div className="lg:hidden">
              {/* Gallery - Full width edge-to-edge */}
              <REWPhotoGallery photos={allImages.map(url => ({
                url
              }))} alt={project.name} previewAspectClassName="aspect-[4/3] md:aspect-[4/3]" />

              {/* Project Info */}
              <div className="flex flex-col px-4 pt-4">
                {/* Status Badge Row */}
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                  {getStatusBadge(project.status)}
                  {project.is_featured && <Badge className="bg-yellow-500/90 hover:bg-yellow-500 text-white text-xs px-2 py-0.5">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Featured
                    </Badge>}
                </div>

                {/* Title and City Badge */}
                <div className="flex flex-wrap items-center gap-2 mb-1.5 md:mb-2">
                  <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{project.name}</h1>
                  <Badge variant="secondary" className="md:hidden text-[10px] px-1.5 py-0.5 font-medium">
                    {project.city}
                  </Badge>
                </div>
                
                {project.starting_price ? <div className="mb-2 md:mb-3">
                    <span className="text-muted-foreground text-sm md:text-base font-medium mr-1">From</span>
                    <span className="font-bold text-primary !text-[28px] sm:!text-[32px] md:!text-[36px] leading-tight">
                      {formatPrice(project.starting_price)}
                    </span>
                  </div> : <div className="!text-xl md:!text-2xl text-muted-foreground mb-2 md:mb-3 font-semibold">Contact for pricing</div>}

                {/* City/Neighborhood */}
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1 md:mb-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium text-foreground">{project.neighborhood}, {project.city}</span>
                </div>
                
                {/* Full Address */}
                {project.address && project.address !== `${project.neighborhood}, ${project.city}` && <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2 md:hidden">
                    <span className="ml-5 truncate">{project.address}</span>
                  </div>}

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-3">
                  {project.map_lat && project.map_lng && <Link to={`/map-search?lat=${project.map_lat}&lng=${project.map_lng}&zoom=16&project=${project.slug}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>Map</span>
                    </Link>}
                  {project.map_lat && project.map_lng && <a href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${project.map_lat},${project.map_lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors">
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      <span>Street View</span>
                    </a>}
                  <button onClick={handleShare} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors">
                    <Share2 className="h-3.5 w-3.5 text-primary" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Lead Magnets Bar */}
                <ProjectLeadMagnetsBar projectId={project.id} projectName={project.name} city={project.city} />

                {/* Quick Facts - visible on tablet */}
                <div className="hidden md:block space-y-1.5 mb-2">
                  {project.developer_name && <div className="flex items-center gap-2 text-xs">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Developer:</span>
                      <span className="font-medium truncate">{project.developer_name}</span>
                    </div>}
                  {project.completion_year && <div className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Completion:</span>
                      <span className="font-medium">
                        {project.completion_month ? `${getMonthName(project.completion_month)} ` : ""}{project.completion_year}
                      </span>
                    </div>}
                  {project.unit_mix && <div className="flex items-center gap-2 text-xs">
                      <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Units:</span>
                      <span className="font-medium truncate">{project.unit_mix}</span>
                    </div>}
                  {project.deposit_structure && <div className="flex items-center gap-2 text-xs">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Deposit:</span>
                      <span className="font-medium truncate">{project.deposit_structure}</span>
                    </div>}
                </div>

                {/* Short description */}
                {project.short_description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                    {project.short_description}
                  </p>}

                {/* Tablet-only Lead Form and Scheduler */}
                <div className="hidden md:block lg:hidden mt-3 space-y-4">
                  <ProjectLeadForm projectId={project.id} projectName={project.name} status={project.status} brochureUrl={project.brochure_files?.[0] || null} />
                  <InlineScheduler projectId={project.id} projectName={project.name} projectCity={project.city} projectNeighborhood={project.neighborhood} onRequestTour={handleScheduleTourClick} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile-only Project Highlights Section - edge-to-edge */}
        <section className="border-t md:hidden">
          <div className="px-4 py-4">
            <ProjectHighlights projectType={project.project_type} unitMix={project.unit_mix} completionMonth={project.completion_month} completionYear={project.completion_year} city={project.city} neighborhood={project.neighborhood} depositStructure={project.deposit_structure} incentives={project.incentives} developerId={project.developer_id} developerName={project.developer_name} strataFees={project.strata_fees} assignmentFees={project.assignment_fees} />
          </div>
        </section>

        {/* Details Grid - Edge-to-edge on mobile/tablet */}
        <section className="py-2 sm:py-3 md:py-5 lg:py-8">
          <div className="px-4 lg:container lg:px-4">
            {/* Desktop: Full-width content since sidebar is in hero */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-6 lg:max-w-4xl">
                {/* Deposit, Fees & Developer - Combined section */}
                {(project.deposit_structure || project.strata_fees || project.assignment_fees || project.incentives || project.developer_name) && <div className="bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-6 border border-border/40">
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      {project.developer_name && <div className="hidden md:block bg-background/70 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border/30">
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5 sm:mb-1">Developer</p>
                          <p className="font-semibold text-sm sm:text-base text-foreground">{project.developer_name}</p>
                        </div>}
                      {project.strata_fees && <div className="hidden md:block bg-background/70 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border/30">
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5 sm:mb-1">Strata Fees</p>
                          <p className="font-semibold text-sm sm:text-base text-foreground">{project.strata_fees}</p>
                        </div>}
                      {project.assignment_fees && <div className="hidden md:block bg-background/70 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border/30">
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5 sm:mb-1">Assignment</p>
                          <p className="font-semibold text-sm sm:text-base text-foreground">{project.assignment_fees}</p>
                        </div>}
                    </div>
                    
                    {project.incentives && <div className="mt-2 sm:mt-3 bg-green-50 dark:bg-green-950/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200/50 dark:border-green-800/30">
                        <div className="flex items-start gap-2">
                          <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-400 font-semibold uppercase tracking-wide mb-0.5 sm:mb-1">Current Incentives</p>
                            <p className="text-xs sm:text-sm text-green-800 dark:text-green-300">{project.incentives}</p>
                          </div>
                        </div>
                      </div>}
                  </div>}

                {/* Amenities */}
                {project.amenities && project.amenities.length > 0 && <div className="bg-muted/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-6">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-3 sm:mb-4 md:mb-4">Amenities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-3 md:gap-4">
                      {project.amenities.map((a, i) => <div key={i} className="flex items-center gap-2 sm:gap-2">
                          <CheckCircle className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-500 shrink-0" />
                          <span className="text-sm sm:text-sm md:text-base text-foreground">{a}</span>
                        </div>)}
                    </div>
                  </div>}

                {/* Description */}
                {project.full_description && <div className="bg-muted/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-6">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-3 sm:mb-4 md:mb-4">Development Features</h2>
                    <div className="prose prose-sm max-w-none text-muted-foreground space-y-3 sm:space-y-3">
                      {project.full_description.split("\n").map((line, i) => {
                      const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
                      const parsedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
                      if (isBullet) {
                        const bulletContent = line.trim().replace(/^[•\-]\s*/, "");
                        const parsedBullet = bulletContent.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
                        return <div key={i} className="flex items-start gap-2 sm:gap-2 text-sm sm:text-sm lg:text-base">
                              <span className="text-primary mt-0.5">•</span>
                              <span dangerouslySetInnerHTML={{
                            __html: parsedBullet
                          }} />
                            </div>;
                      }
                      if (!line.trim()) return null;
                      return <p key={i} className="text-sm sm:text-sm lg:text-base leading-relaxed" dangerouslySetInnerHTML={{
                        __html: parsedLine
                      }} />;
                    })}
                    </div>
                  </div>}

                {/* Highlights */}
                {project.highlights && project.highlights.length > 0 && <div className="bg-muted/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-6">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-3 md:mb-4">Key Highlights</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {project.highlights.map((h, i) => <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm md:text-base text-foreground">{h}</span>
                        </li>)}
                    </ul>
                  </div>}

                {/* Investment Analysis Section */}
                <InvestmentAnalysis projectName={project.name} city={project.city} neighborhood={project.neighborhood} startingPrice={project.starting_price} projectType={project.project_type} completionYear={project.completion_year} />

                {/* Location Deep Dive */}
                <LocationDeepDive projectName={project.name} city={project.city} neighborhood={project.neighborhood} address={project.address} mapLat={project.map_lat} mapLng={project.map_lng} />

                {/* FAQ Section */}
                <section id="faq" className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 border border-border/30">
                  <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground">
                      Frequently Asked Questions About {project.name}
                    </h2>
                  </div>
                  <Accordion type="single" collapsible className="w-full space-y-3">
                    {projectFAQs.map((item, i) => <AccordionItem key={i} value={`faq-${i}`} className="bg-background/60 rounded-xl border border-border/40 px-4 data-[state=open]:bg-background/80 transition-colors">
                        <AccordionTrigger className="text-left text-sm md:text-base py-4 md:py-5 font-semibold text-foreground hover:no-underline gap-3 min-h-[56px]">
                          <span className="pr-2">{item.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed pb-5">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>)}
                  </Accordion>
                </section>
              
              {/* Mobile-only Lead Form and Scheduler - positioned after FAQ */}
              <div className="md:hidden space-y-4">
                <div ref={formRef} id="contact-form-mobile" className="w-full">
                  <ProjectLeadForm projectId={project.id} projectName={project.name} status={project.status} brochureUrl={project.brochure_files?.[0] || null} />
                </div>
                <InlineScheduler projectId={project.id} projectName={project.name} projectCity={project.city} projectNeighborhood={project.neighborhood} onRequestTour={handleScheduleTourClick} />
              </div>
            </div>
          </div>
        </section>
        </article>
      </main>

      {/* Mobile Sticky CTA */}
      <ProjectMobileCTA projectName={project.name} status={project.status} startingPrice={project.starting_price} onRegisterClick={handleGetPlansClick} />

      {/* Booking Modal */}
      <BookingModal open={bookingOpen} onOpenChange={setBookingOpen} projectId={project.id} projectName={project.name} projectCity={project.city} projectNeighborhood={project.neighborhood} projectUrl={canonicalUrl} initialDate={bookingDate} initialTimePeriod={bookingTimePeriod} />

      {/* Floor Plan Modal - Mobile only */}
      <FloorPlanModal open={floorPlanModalOpen} onOpenChange={setFloorPlanModalOpen} projectId={project.id} projectName={project.name} status={project.status} brochureUrl={project.brochure_files?.[0] || null} />

      {/* Contextual Internal Links */}
      <ProjectContextualLinks projectName={project.name} neighborhood={project.neighborhood} city={project.city} projectType={project.project_type} startingPrice={project.starting_price} />

      {/* More Projects in Same Neighborhood - edge-to-edge on mobile */}
      <section className="bg-muted/30 py-6 md:py-12">
        <div className="px-4 lg:container lg:px-4">
          <NeighborhoodProjectsCarousel neighborhood={project.neighborhood} city={project.city} title={`More in ${project.neighborhood}`} subtitle={`Explore presales in ${project.neighborhood}, ${project.city}`} excludeSlug={project.slug} />
        </div>
      </section>

      {/* More Projects in Same City - edge-to-edge on mobile */}
      <section className="py-6 md:py-12">
        <div className="px-4 lg:container lg:px-4">
          <CityProjectsCarousel city={project.city} title={`More Projects in ${project.city}`} subtitle="Explore similar presale opportunities nearby" excludeSlug={project.slug} />
        </div>
      </section>

      <Footer />
    </>;
}