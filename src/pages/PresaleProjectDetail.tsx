import { useEffect, useState, useRef } from "react";
import { useParams, Link, useSearchParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProjectLeadForm } from "@/components/projects/ProjectLeadForm";
import { LightboxGallery } from "@/components/ui/lightbox-gallery";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin,
  Calendar,
  Building2,
  DollarSign,
  ChevronLeft,
  Loader2,
  Phone,
  CheckCircle,
  Home,
  Layers,
  ArrowRight,
  Train,
  FileText,
  Lock,
  AlertTriangle,
  Shield,
  Clock,
  TrendingUp,
  Users,
  Banknote,
  RefreshCw,
  Images,
  ChevronRight
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  slug: string;
  status: "coming_soon" | "active" | "sold_out";
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
  updated_at: string;
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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hasUnlockedFloorplans, setHasUnlockedFloorplans] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const canonicalUrl = `https://presaleproperties.com${location.pathname}`;
  const previewToken = searchParams.get("preview");

  // Check if user has already unlocked floorplans
  useEffect(() => {
    const persona = localStorage.getItem("presale_persona");
    if (persona) {
      setHasUnlockedFloorplans(true);
    }
  }, []);

  useEffect(() => {
    if (slug) {
      fetchProject();
    }
  }, [slug, previewToken]);

  const fetchProject = async () => {
    try {
      if (previewToken) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (roleData) {
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
              setIsPreviewMode(!data.is_published);
              setLoading(false);
              return;
            }
          }
        }
      }

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
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString("default", { month: "short" });
  };

  const getLastUpdated = () => {
    if (!project?.updated_at) return "Recently";
    const date = new Date(project.updated_at);
    return date.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <>
        <Header />
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
        <Header />
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

  // Combine all images for lightbox
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
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com" },
      { "@type": "ListItem", "position": 2, "name": "Presale Projects", "item": "https://presaleproperties.com/presale-projects" },
      { "@type": "ListItem", "position": 3, "name": project.city, "item": `https://presaleproperties.com/presale-condos/${project.city.toLowerCase().replace(/\s+/g, "-")}` },
      { "@type": "ListItem", "position": 4, "name": project.name, "item": canonicalUrl }
    ]
  };

  const faqSchema = project.faq && project.faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": project.faq.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": { "@type": "Answer", "text": item.answer }
    }))
  } : null;

  // Generate Why This Project bullets based on available data
  const buyerBullets = [
    project.amenities && project.amenities.length > 3 ? "Premium amenities for everyday convenience" : null,
    project.neighborhood ? `Prime ${project.neighborhood} location with walkable shops & dining` : null,
    project.completion_year && project.completion_year <= new Date().getFullYear() + 2 ? "Move-in ready within 2 years" : "Long-term equity growth before completion",
  ].filter(Boolean).slice(0, 3);

  const investorBullets = [
    project.neighborhood ? `Strong rental demand in ${project.neighborhood}` : "Strong rental demand in growing area",
    project.starting_price ? `Entry price competitive for ${project.city}` : "Competitive entry pricing",
    project.assignment_fees ? "Assignment flexibility available" : "Resale potential at completion",
  ].filter(Boolean).slice(0, 3);

  // Default FAQs if none provided
  const defaultFaqs = [
    { question: "How do presales work?", answer: "You purchase a unit before construction is complete, typically paying deposits over time. Once the building is finished, you complete the purchase and take possession." },
    { question: "Is my deposit safe?", answer: "Yes. BC law requires developers to hold deposits in trust, protected until completion. This is enforced under REDMA (Real Estate Development Marketing Act)." },
    { question: "Can I assign my contract?", answer: "Assignment policies vary by project. Some allow assignments with a fee, others restrict them. Check the specific project terms." },
    { question: "What taxes apply?", answer: "GST applies to new homes (5%). First-time buyers may qualify for rebates. Property Transfer Tax exemptions may also apply depending on price and buyer status." },
    { question: "Who should buy this project?", answer: "Ideal for buyers seeking new construction with warranty protection, investors looking for pre-completion appreciation, and those wanting to lock in today's pricing." }
  ];

  const displayFaqs = project.faq && project.faq.length > 0 ? project.faq : defaultFaqs;

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={`${project.name}, presale ${project.city}, new ${project.project_type} ${project.neighborhood}, ${project.developer_name || ""} development, pre-construction ${project.city}, ${project.neighborhood} new homes`} />
        <link rel="canonical" href={canonicalUrl} />
        
        <meta property="og:type" content="realestate.listing" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="PresaleProperties.com" />
        {project.featured_image && <meta property="og:image" content={project.featured_image} />}
        <meta property="og:locale" content="en_CA" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        {project.featured_image && <meta name="twitter:image" content={project.featured_image} />}
        
        <meta name="geo.region" content="CA-BC" />
        <meta name="geo.placename" content={project.city} />
        
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbData)}</script>
        {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      </Helmet>

      {/* Sticky Header CTA - Desktop */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold text-foreground">
              <span className="text-primary">presale</span>properties
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden xl:block">
                {project.name} · {project.city}
              </span>
              <Button onClick={scrollToForm} size="default" className="font-semibold">
                Get Floorplans + Pricing
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <Header />
      </div>

      <main className="min-h-screen bg-background lg:pt-16">
        {/* Preview Mode Banner */}
        {isPreviewMode && (
          <div className="bg-yellow-500 text-yellow-950 py-2 px-4 text-center text-sm font-medium">
            Preview Mode — This project is not published yet
          </div>
        )}

        {/* ===== SECTION 1: FULL-SCREEN HERO ===== */}
        <section className="relative min-h-[70vh] lg:min-h-[85vh] flex items-end">
          {/* Background Image - Clickable for gallery */}
          <div 
            className="absolute inset-0 cursor-pointer group"
            onClick={() => {
              if (allImages.length > 0) {
                setLightboxIndex(0);
                setLightboxOpen(true);
              }
            }}
          >
            {project.featured_image ? (
              <img
                src={project.featured_image}
                alt={project.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50" />
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            
            {/* Gallery Indicator - Top Right */}
            {allImages.length > 1 && (
              <button 
                className="absolute top-4 right-4 lg:top-6 lg:right-6 flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm font-medium transition-all z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(0);
                  setLightboxOpen(true);
                }}
              >
                <Images className="h-4 w-4" />
                <span>{allImages.length} Photos</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Hero Content */}
          <div className="relative z-10 w-full pb-8 lg:pb-16">
            <div className="container px-4">
              <div className="max-w-3xl">
                {/* Status Badge */}
                <div className="mb-4">
                  <Badge className={`text-sm px-3 py-1 ${
                    project.status === "active" ? "bg-green-500 hover:bg-green-600" :
                    project.status === "coming_soon" ? "bg-blue-500 hover:bg-blue-600" :
                    "bg-muted"
                  }`}>
                    {project.status === "active" ? "Now Selling" : 
                     project.status === "coming_soon" ? "Coming Soon" : "Sold Out"}
                  </Badge>
                </div>

                {/* Project Name */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 leading-tight">
                  {project.name}
                </h1>

                {/* Location */}
                <p className="text-lg lg:text-xl text-white/80 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {project.neighborhood}, {project.city}
                </p>

                {/* Key Info Line */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/90 text-base lg:text-lg mb-6">
                  {project.starting_price && (
                    <span className="font-semibold">
                      From {formatPrice(project.starting_price)}
                    </span>
                  )}
                  {project.completion_year && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Est. {project.completion_month ? getMonthName(project.completion_month) : ""} {project.completion_year}
                    </span>
                  )}
                  {project.deposit_structure && (
                    <span className="flex items-center gap-1.5">
                      <Banknote className="h-4 w-4" />
                      Deposit: {project.deposit_structure.split(",")[0] || project.deposit_structure}
                    </span>
                  )}
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <Button 
                    onClick={scrollToForm} 
                    size="lg" 
                    className="h-14 px-8 text-base font-bold rounded-xl shadow-2xl"
                  >
                    Get Floorplans + Pricing
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="h-14 px-8 text-base font-semibold rounded-xl bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                    onClick={scrollToForm}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Book 10-min Fit Call
                  </Button>
                </div>

                {/* Trust Micro-text */}
                <p className="text-sm text-white/60 flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Pricing & availability change. Updated weekly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 2: QUICK SPECS STRIP ===== */}
        <section className="border-b border-border bg-muted/30">
          <div className="container px-4 py-6 lg:py-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
              {project.developer_name && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Developer</p>
                    <p className="font-semibold text-sm">{project.developer_name}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Address</p>
                  <p className="font-semibold text-sm">{project.address || project.neighborhood}</p>
                </div>
              </div>
              {project.unit_mix && (
                <div className="flex items-start gap-3">
                  <Home className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Units</p>
                    <p className="font-semibold text-sm">{project.unit_mix}</p>
                  </div>
                </div>
              )}
              {project.completion_year && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Est. Completion</p>
                    <p className="font-semibold text-sm">
                      {project.completion_month ? getMonthName(project.completion_month) + " " : ""}{project.completion_year}
                    </p>
                  </div>
                </div>
              )}
              {project.deposit_structure && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Deposit</p>
                    <p className="font-semibold text-sm">{project.deposit_structure.split(",")[0] || "Contact for details"}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Assignments</p>
                  <p className="font-semibold text-sm">{project.assignment_fees ? "Allowed" : "TBD"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 3: WHY THIS PROJECT ===== */}
        <section className="py-12 lg:py-16 border-b border-border">
          <div className="container px-4">
            <h2 className="text-2xl lg:text-3xl font-bold mb-6">Why This Project</h2>
            <Tabs defaultValue="buyers" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                <TabsTrigger value="buyers" className="text-sm font-semibold">
                  <Users className="h-4 w-4 mr-2" />
                  For Buyers
                </TabsTrigger>
                <TabsTrigger value="investors" className="text-sm font-semibold">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  For Investors
                </TabsTrigger>
              </TabsList>
              <TabsContent value="buyers" className="mt-0">
                <ul className="space-y-3">
                  {buyerBullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-3 text-base lg:text-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="investors" className="mt-0">
                <ul className="space-y-3">
                  {investorBullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-3 text-base lg:text-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* ===== SECTION 4: FLOORPLANS (PRIMARY CONVERSION ZONE) ===== */}
        <section className="py-12 lg:py-16 bg-muted/20 border-b border-border" ref={formRef} id="floorplans">
          <div className="container px-4">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Left: Floorplan Preview */}
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold mb-2">Floor Plans & Layouts</h2>
                <p className="text-muted-foreground mb-6">
                  {project.unit_mix || "1 Bed · 1+Den · 2 Bed · Townhomes"}
                </p>

                {/* Blurred/Locked Floorplan Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden border border-border bg-muted ${
                        !hasUnlockedFloorplans ? "cursor-pointer" : ""
                      }`}
                      onClick={!hasUnlockedFloorplans ? scrollToForm : undefined}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/10 to-muted-foreground/5" />
                      {!hasUnlockedFloorplans && (
                        <div className="absolute inset-0 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
                          <Lock className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground font-medium">Tap to unlock</span>
                        </div>
                      )}
                      {hasUnlockedFloorplans && project.floorplan_files && project.floorplan_files[i-1] && (
                        <img 
                          src={project.floorplan_files[i-1]} 
                          alt={`Floor plan ${i}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Lead Form */}
              <div className="lg:sticky lg:top-24">
                <ProjectLeadForm
                  projectId={project.id}
                  projectName={project.name}
                  status={project.status}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 5: PRICING & INCENTIVES ===== */}
        <section className="py-12 lg:py-16 border-b border-border">
          <div className="container px-4">
            <div className="max-w-3xl">
              <h2 className="text-2xl lg:text-3xl font-bold mb-6">Pricing & Incentives</h2>
              
              {project.starting_price ? (
                <div className="bg-muted/50 rounded-xl p-6 mb-6">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Starting From</p>
                  <p className="text-3xl lg:text-4xl font-bold text-primary mb-2">{formatPrice(project.starting_price)}</p>
                  <p className="text-sm text-muted-foreground">Price ranges vary by unit type and floor level</p>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-xl p-6 mb-6">
                  <p className="text-lg text-muted-foreground">Pricing varies by release. Contact us for current availability.</p>
                </div>
              )}

              {project.incentives && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">Current Incentives</h3>
                  <p className="text-foreground">{project.incentives}</p>
                </div>
              )}

              {/* Verification Badge */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>Last verified: {getLastUpdated()} · Source: Sales Centre</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Pricing & availability change quickly. Verify current details with our team.
              </p>
            </div>
          </div>
        </section>

        {/* ===== SECTION 6: DEPOSIT STRUCTURE ===== */}
        {project.deposit_structure && (
          <section className="py-12 lg:py-16 border-b border-border bg-muted/20">
            <div className="container px-4">
              <div className="max-w-3xl">
                <h2 className="text-2xl lg:text-3xl font-bold mb-6">Deposit Structure</h2>
                
                <div className="space-y-3 mb-6">
                  {project.deposit_structure.split(/[,;]/).map((step, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-background rounded-lg border border-border">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {i + 1}
                      </div>
                      <span className="font-medium">{step.trim()}</span>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  Deposits held in trust per BC REDMA regulations. Subject to disclosure statement.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ===== SECTION 7: NEIGHBOURHOOD INTEL ===== */}
        <section className="py-12 lg:py-16 border-b border-border">
          <div className="container px-4">
            <div className="max-w-3xl">
              <h2 className="text-2xl lg:text-3xl font-bold mb-6">Neighbourhood Intel</h2>
              
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Train className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Transit Access</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.city === "Burnaby" ? "Near SkyTrain stations" :
                     project.city === "Surrey" ? "SkyTrain & bus access" :
                     project.city === "Coquitlam" ? "Evergreen Line nearby" :
                     "Transit accessible"}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Area Growth</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.neighborhood} is experiencing significant development momentum with new amenities planned.
                  </p>
                </div>
              </div>

              {project.amenities && project.amenities.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Building Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.amenities.map((amenity, i) => (
                      <span key={i} className="px-3 py-1.5 bg-muted rounded-full text-sm">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ===== SECTION 8: RISKS & REALITY ===== */}
        <section className="py-12 lg:py-16 border-b border-border bg-amber-50/50 dark:bg-amber-950/10">
          <div className="container px-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
                <h2 className="text-2xl lg:text-3xl font-bold">What to Know Before You Buy</h2>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-600 shrink-0 mt-2" />
                  <span>Pricing may change before contract signing</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-600 shrink-0 mt-2" />
                  <span>Completion dates are estimates and may shift</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-600 shrink-0 mt-2" />
                  <span>Assignment rules vary by project — review before signing</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-600 shrink-0 mt-2" />
                  <span>Disclosure statement matters — read it carefully</span>
                </li>
              </ul>

              <Button onClick={scrollToForm} variant="outline" className="font-semibold">
                Want help reviewing this? Get the full package
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* ===== SECTION 9: FAQ ===== */}
        <section className="py-12 lg:py-16 border-b border-border">
          <div className="container px-4">
            <div className="max-w-3xl">
              <h2 className="text-2xl lg:text-3xl font-bold mb-6">Frequently Asked Questions</h2>
              
              <Accordion type="single" collapsible className="w-full">
                {displayFaqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* ===== SECTION 10: FINAL FULL-SCREEN CTA ===== */}
        <section className="py-20 lg:py-28 bg-foreground text-background">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Get the Floorplans & Pricing Package
              </h2>
              <p className="text-lg lg:text-xl text-background/70 mb-8">
                Updated. Verified. No fluff.
              </p>
              <Button
                onClick={scrollToForm}
                size="lg"
                className="h-14 px-10 text-lg font-bold rounded-xl"
              >
                Get Instant Access
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <p className="text-sm text-background/50 mt-4 flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                Same-day callback available
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background/95 backdrop-blur-md border-t border-border z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">From</p>
              <p className="font-bold text-primary truncate">
                {project.starting_price ? formatPrice(project.starting_price) : "Contact for pricing"}
              </p>
            </div>
            <Button onClick={scrollToForm} className="font-semibold shrink-0">
              Get Floorplans
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox Gallery */}
      <LightboxGallery
        images={allImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        alt={project.name}
      />

      <Footer />
    </>
  );
}