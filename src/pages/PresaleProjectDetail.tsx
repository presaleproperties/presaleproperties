import { useEffect, useState, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GalleryWithLightbox } from "@/components/ui/lightbox-gallery";
import { ProjectLeadForm } from "@/components/projects/ProjectLeadForm";
import { ProjectHighlights } from "@/components/projects/ProjectHighlights";

import { ProjectMobileCTA } from "@/components/projects/ProjectMobileCTA";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  Share2
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
};

export default function PresaleProjectDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

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
    if (navigator.share) {
      try {
        await navigator.share({
          title: project?.name,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard" });
    }
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

  const allImages = [
    project.featured_image,
    ...(project.gallery_images || [])
  ].filter(Boolean) as string[];

  return (
    <>
      <Helmet>
        <title>{project.seo_title || `${project.name} | PresaleProperties.com`}</title>
        <meta name="description" content={project.seo_description || project.short_description || `${project.name} - ${project.project_type} in ${project.city}, ${project.neighborhood}`} />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background pb-24 lg:pb-0">
        {/* Preview Mode Banner */}
        {isPreviewMode && (
          <div className="bg-yellow-500 text-yellow-950 py-2 px-4 text-center text-sm font-medium">
            Preview Mode — This project is not published yet
          </div>
        )}

        {/* Hero */}
        <section className="bg-gradient-to-b from-muted/30 to-background">
          <div className="container px-3 py-4 md:px-4 md:py-6 lg:py-8">
            <GalleryWithLightbox
              images={allImages}
              selectedIndex={allImages.indexOf(selectedImage || allImages[0])}
              onSelectIndex={(index) => setSelectedImage(allImages[index])}
              alt={project.name}
            />
          </div>
        </section>

        {/* Project Info Section */}
        <section className="border-t">
          <div className="container px-3 py-4 md:px-4 md:py-5 lg:py-6">
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

            {/* Title and Location */}
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1.5 md:mb-2">{project.name}</h1>
            
            {project.starting_price ? (
              <div className="mb-2 md:mb-3">
                <span className="text-lg md:text-xl font-semibold text-primary">
                  From {formatPrice(project.starting_price)}
                </span>
              </div>
            ) : (
              <div className="text-base md:text-lg text-muted-foreground mb-2 md:mb-3">Contact for pricing</div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground text-sm md:text-base mb-1.5 md:mb-2">
              <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
              <span>{project.address || `${project.neighborhood}, ${project.city}`}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 md:gap-3 mt-3 md:mt-4 mb-2">
              <Button size="default" onClick={scrollToForm} className="font-semibold text-sm md:text-base md:h-11">
                {project.status === "coming_soon" ? (
                  <>Register Now</>
                ) : (
                  <>Download Plans</>
                )}
              </Button>
            </div>

            {/* Highlights Grid */}
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
        <section className="py-4 md:py-6 lg:py-10">
          <div className="container px-3 md:px-4">
            <div className="grid lg:grid-cols-3 gap-4 md:gap-5 lg:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4 md:space-y-5 lg:space-y-8">
                {/* Amenities */}
                {project.amenities && project.amenities.length > 0 && (
                  <div className="bg-muted/30 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6">
                    <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Amenities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                      {project.amenities.map((a, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500 shrink-0" />
                          <span className="text-xs md:text-sm">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {project.full_description && (
                  <div className="bg-muted/30 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6">
                    <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Development Features</h2>
                    <div className="prose prose-sm max-w-none text-muted-foreground text-xs md:text-sm">
                      {project.full_description.split("\n").map((p, i) => (
                        <p key={i} className="mb-2 md:mb-3 last:mb-0">{p}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {project.highlights && project.highlights.length > 0 && (
                  <div className="bg-muted/30 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6">
                    <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Key Highlights</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                      {project.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-xs md:text-sm">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Deposit & Incentives */}
                {(project.deposit_structure || project.strata_fees || project.assignment_fees || project.incentives) && (
                  <div className="bg-muted/30 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6">
                    <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Deposit & Fees</h2>
                    <div className="space-y-3 md:space-y-4">
                      {project.deposit_structure && (
                        <div>
                          <h4 className="font-medium mb-1.5 md:mb-2 text-xs md:text-sm">Deposit Structure</h4>
                          <p className="text-muted-foreground text-xs md:text-sm">{project.deposit_structure}</p>
                        </div>
                      )}
                      {(project.strata_fees || project.assignment_fees) && (
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                          {project.strata_fees && (
                            <div>
                              <h4 className="font-medium mb-1.5 md:mb-2 text-xs md:text-sm">Strata Fees (Est.)</h4>
                              <p className="text-muted-foreground text-xs md:text-sm">{project.strata_fees}</p>
                            </div>
                          )}
                          {project.assignment_fees && (
                            <div>
                              <h4 className="font-medium mb-1.5 md:mb-2 text-xs md:text-sm">Assignment Fees</h4>
                              <p className="text-muted-foreground text-xs md:text-sm">{project.assignment_fees}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {project.incentives && (
                        <div>
                          <h4 className="font-medium mb-1.5 md:mb-2 text-xs md:text-sm">Current Incentives</h4>
                          <p className="text-muted-foreground text-xs md:text-sm">{project.incentives}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Downloads */}
                {((project.floorplan_files && project.floorplan_files.length > 0) || 
                  (project.brochure_files && project.brochure_files.length > 0)) && (
                  <div className="bg-muted/30 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6">
                    <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Downloads</h2>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {project.floorplan_files?.map((file, i) => (
                        <Button key={i} variant="outline" size="sm" className="text-xs md:text-sm h-8 md:h-9" asChild>
                          <a href={file} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                            Floor Plan {i + 1}
                          </a>
                        </Button>
                      ))}
                      {project.brochure_files?.map((file, i) => (
                        <Button key={i} variant="outline" size="sm" className="text-xs md:text-sm h-8 md:h-9" asChild>
                          <a href={file} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                            Brochure {i + 1}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Developer Info */}
                {project.developer_name && (
                  <div className="bg-muted/30 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6">
                    <h2 className="text-base md:text-lg font-semibold text-foreground mb-1.5 md:mb-2">Developer</h2>
                    <p className="font-medium text-sm md:text-base">{project.developer_name}</p>
                  </div>
                )}

                {/* FAQ */}
                {project.faq && project.faq.length > 0 && (
                  <div className="bg-muted/30 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6">
                    <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Frequently Asked Questions</h2>
                    <Accordion type="single" collapsible className="w-full">
                      {project.faq.map((item, i) => (
                        <AccordionItem key={i} value={`faq-${i}`}>
                          <AccordionTrigger className="text-left text-xs md:text-sm py-2.5 md:py-3">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-xs md:text-sm text-muted-foreground">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </div>

              {/* Sidebar - Contact Form */}
              <div>
                <div ref={formRef} id="contact-form" className="sticky top-24">
                  <ProjectLeadForm
                    projectId={project.id}
                    projectName={project.name}
                    status={project.status}
                  />
                  
                  {/* Quick Actions Below Form - Desktop only */}
                  <div className="mt-4 hidden lg:flex flex-col gap-3">
                    <Button variant="outline" size="lg" className="w-full" asChild>
                      <a href="tel:+16722581100">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Now
                      </a>
                    </Button>
                  </div>
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
        onRegisterClick={scrollToForm}
      />

      <Footer />
    </>
  );
}
