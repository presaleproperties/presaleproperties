import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "@/components/seo/Helmet";
import { supabase } from "@/integrations/supabase/client";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Lock, MapPin, Bed, Bath, Maximize, Building2, Calendar,
  ArrowLeft, Phone, Mail, ChevronLeft, ChevronRight, Shield,
  FileText, MessageSquare, Download, BookOpen, Compass, Car,
  Box, CheckCircle, XCircle, Home, FileDown, Loader2,
} from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useVerifiedAgent } from "@/hooks/useVerifiedAgent";
import { ExpertAdvisoryCard } from "@/components/listings/ExpertAdvisoryCard";
import { AboutContactForm } from "@/components/about/AboutContactForm";
import { AssignmentOnePager } from "@/components/assignments/AssignmentOnePager";
import { AssignmentLocationMap } from "@/components/assignments/AssignmentLocationMap";
import { AssignmentMobileCTA } from "@/components/assignments/AssignmentMobileCTA";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface ListingRow {
  id: string;
  title: string;
  project_name: string;
  project_id: string | null;
  developer_name: string | null;
  city: string;
  neighborhood: string | null;
  address: string | null;
  assignment_price: number;
  original_price: number | null;
  deposit_to_lock: number | null;
  buyer_agent_commission: string | null;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  exterior_sqft: number | null;
  floor_level: number | null;
  floor_plan_level?: number | null;
  exposure: string | null;
  parking: string | null;
  has_locker: boolean;
  unit_number: string | null;
  unit_type: string | null;
  floor_plan_url: string | null;
  floor_plan_name: string | null;
  brochure_url: string | null;
  featured_image: string | null;
  photos: string[] | null;
  estimated_completion: string | null;
  description: string | null;
  developer_approval_required: boolean;
  status: string;
  listing_agent_id: string | null;
}

interface ListingAgent {
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  brokerage_name: string;
}

interface ProjectRow {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  address: string | null;
  developer_name: string | null;
  featured_image: string | null;
  gallery_images: string[] | null;
  highlights: string[] | null;
  amenities: string[] | null;
  deposit_structure: string | null;
  deposit_percent: number | null;
  completion_year: number | null;
  completion_month: number | null;
  strata_fees: string | null;
  near_skytrain: boolean | null;
  rental_restrictions: string | null;
  slug: string;
  full_description: string | null;
  short_description: string | null;
  starting_price: number | null;
  map_lat: number | null;
  map_lng: number | null;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(price);

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const onePagerRef = useRef<HTMLDivElement>(null);
  const { isVerified } = useVerifiedAgent();

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["assignment-detail", id],
    queryFn: async () => {
      if (!id) throw new Error("No assignment ID");
      const { data, error } = await (supabase as any)
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Assignment not found");
      return data as ListingRow;
    },
    enabled: !!id,
  });

  const { data: project } = useQuery({
    queryKey: ["assignment-project", listing?.project_id],
    queryFn: async () => {
      if (!listing?.project_id) return null;
      const { data } = await (supabase as any)
        .from("presale_projects")
        .select("id, name, city, neighborhood, address, developer_name, featured_image, gallery_images, highlights, amenities, deposit_structure, deposit_percent, completion_year, completion_month, strata_fees, near_skytrain, rental_restrictions, slug, full_description, short_description, starting_price, map_lat, map_lng")
        .eq("id", listing.project_id)
        .maybeSingle();
      return data as ProjectRow | null;
    },
    enabled: !!listing?.project_id,
  });

  // Fetch floorplan images and videos from listing_files
  const { data: listingFiles } = useQuery({
    queryKey: ["assignment-files", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await (supabase as any)
        .from("listing_files")
        .select("id, url, file_name, file_type")
        .eq("listing_id", id);
      return (data || []) as { id: string; url: string; file_name: string; file_type: string }[];
    },
    enabled: !!id,
  });

  // Fetch listing agent profile
  const { data: listingAgent } = useQuery({
    queryKey: ["listing-agent", listing?.listing_agent_id],
    queryFn: async () => {
      if (!listing?.listing_agent_id) return null;
      // Get profile
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("full_name, email, phone, avatar_url, user_id")
        .eq("user_id", listing.listing_agent_id)
        .maybeSingle();
      if (!profile) return null;
      // Get agent brokerage
      const { data: agentProfile } = await (supabase as any)
        .from("agent_profiles")
        .select("brokerage_name")
        .eq("user_id", listing.listing_agent_id)
        .maybeSingle();
      return {
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        brokerage_name: agentProfile?.brokerage_name || "Real Broker",
      } as ListingAgent;
    },
    enabled: !!listing?.listing_agent_id,
  });

  const floorplanFiles = (listingFiles || []).filter(f => f.file_type === "floorplan");
  const videoFiles = (listingFiles || []).filter(f => f.file_type === "video");
  const floorplanImages = floorplanFiles.filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.url));

  const gallery: string[] = [
    ...(listing?.photos || []),
    ...(project?.gallery_images || []),
    ...(listing?.featured_image ? [listing.featured_image] : []),
    ...(project?.featured_image && !listing?.featured_image ? [project.featured_image] : []),
  ].filter(Boolean);
  const uniqueGallery = [...new Set(gallery)];

  const completionDisplay = listing?.estimated_completion
    || (project?.completion_month && project?.completion_year
      ? `${new Date(2024, project.completion_month - 1).toLocaleString("default", { month: "short" })} ${project.completion_year}`
      : project?.completion_year?.toString() || "TBD");

  const discount = listing?.original_price && listing.original_price > listing.assignment_price
    ? listing.original_price - listing.assignment_price
    : null;

  const premium = listing?.original_price && listing.assignment_price > listing.original_price
    ? listing.assignment_price - listing.original_price
    : null;

  const handleDownloadOnePager = async () => {
    if (!onePagerRef.current || !listing) return;
    setIsExporting(true);
    try {
      const el = onePagerRef.current;
      el.scrollIntoView({ block: "start" });
      await new Promise((r) => setTimeout(r, 150));
      const rect = el.getBoundingClientRect();
      const canvas = await html2canvas(el, {
        scale: 3, useCORS: true, allowTaint: false, logging: false,
        backgroundColor: "#ffffff", x: 0, y: 0, scrollX: 0, scrollY: 0,
        windowWidth: rect.width, windowHeight: rect.height,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `assignment-${listing.project_name.replace(/\s+/g, "-").toLowerCase()}-${listing.unit_number || listing.id.slice(0, 6)}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("One-pager downloaded!");
      }, "image/png");
    } catch (e) {
      console.error(e);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ConversionHeader />
        <main className="container px-4 py-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="aspect-[16/10] w-full rounded-xl mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </main>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <ConversionHeader />
        <main className="container px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Assignment Not Found</h1>
          <p className="text-muted-foreground mb-8">This assignment may have been sold or removed.</p>
          <Link to="/map-search?mode=assignments"><Button>Browse Assignments</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const priceFormatted = formatPrice(listing.assignment_price);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{listing.title} | Assignment Sale | PresaleProperties</title>
        <meta name="description" content={`${listing.beds}BR assignment at ${listing.project_name} in ${listing.city}. ${priceFormatted}.`} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href={`https://presaleproperties.com/assignments/${listing.id}`} />
        <meta property="og:title" content={`${listing.title} | Assignment Sale`} />
        <meta property="og:description" content={`${listing.beds}BR at ${listing.project_name} in ${listing.city}. ${priceFormatted}.`} />
        <meta property="og:type" content="website" />
        {listing.featured_image && <meta property="og:image" content={listing.featured_image} />}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "RealEstateListing",
          "name": listing.title, "url": `https://presaleproperties.com/assignments/${listing.id}`,
          "image": listing.featured_image || undefined,
          "offers": { "@type": "Offer", "price": listing.assignment_price, "priceCurrency": "CAD", "availability": "https://schema.org/InStock" },
          "address": { "@type": "PostalAddress", "addressLocality": listing.city, "addressRegion": "BC", "addressCountry": "CA" },
          "numberOfRooms": listing.beds
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com" },
            { "@type": "ListItem", "position": 2, "name": "Assignments", "item": "https://presaleproperties.com/assignments" },
            { "@type": "ListItem", "position": 3, "name": listing.title, "item": `https://presaleproperties.com/assignments/${listing.id}` }
          ]
        })}</script>
      </Helmet>

      <ConversionHeader />

      <main className="container px-4 py-4 sm:py-6 lg:py-10">
        {/* Breadcrumb — hidden on mobile for cleaner look */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/map-search?mode=assignments" className="hover:text-foreground">Assignments</Link>
          <span>/</span>
          <span className="text-foreground truncate">{listing.title}</span>
        </div>

        {/* Mobile back button */}
        <button onClick={() => window.history.back()} className="sm:hidden flex items-center gap-1.5 text-sm text-muted-foreground mb-3 -ml-1">
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-8">

            {/* ── Photo Gallery ──────────────────────────────── */}
            <div>
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-muted aspect-[16/10]">
                {uniqueGallery.length > 0 ? (
                  <img
                    src={uniqueGallery[currentImageIndex]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Building2 className="h-12 w-12 sm:h-16 sm:w-16" />
                  </div>
                )}

                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex gap-2">
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] sm:text-xs">Assignment</Badge>
                  {discount && discount > 0 && (
                    <Badge className="bg-green-600 hover:bg-green-700 text-white text-[10px] sm:text-xs">
                      Save {formatPrice(discount)}
                    </Badge>
                  )}
                  {premium && premium > 0 && (
                    <Badge className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] sm:text-xs">
                      +{formatPrice(premium)} premium
                    </Badge>
                  )}
                </div>

                {uniqueGallery.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(i => i === 0 ? uniqueGallery.length - 1 : i - 1)}
                      className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow"
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(i => i === uniqueGallery.length - 1 ? 0 : i + 1)}
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow"
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {uniqueGallery.slice(0, 8).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImageIndex(i)}
                          className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors", i === currentImageIndex ? "bg-white" : "bg-white/50")}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Photo counter on mobile */}
                {uniqueGallery.length > 1 && (
                  <div className="absolute bottom-2 right-2 sm:hidden bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                    {currentImageIndex + 1}/{uniqueGallery.length}
                  </div>
                )}
              </div>

              {/* Thumbnails — desktop only */}
              {uniqueGallery.length > 1 && (
                <div className="hidden sm:flex gap-2 mt-3 overflow-x-auto pb-1">
                  {uniqueGallery.slice(0, 8).map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={cn("w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all", i === currentImageIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100")}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Title + Quick Stats ────────────────────────── */}
            <div>
              {listing.unit_number && (
                <Badge variant="outline" className="mb-2 sm:mb-3 text-[10px] sm:text-xs">Unit {listing.unit_number}</Badge>
              )}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1.5 sm:mb-2">{listing.title}</h1>
              <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground text-sm mb-3 sm:mb-5">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">{listing.project_name}{listing.neighborhood ? `, ${listing.neighborhood}` : ""}, {listing.city}</span>
              </div>

              {/* Mobile price display — visible only on mobile since desktop has the sidebar card */}
              <div className="lg:hidden mb-4">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-2xl font-bold text-foreground">{priceFormatted}</span>
                  {listing.original_price && (
                    <span className="text-sm text-muted-foreground line-through">{formatPrice(listing.original_price)}</span>
                  )}
                </div>
                {discount && discount > 0 && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 text-xs">
                    {formatPrice(discount)} below original
                  </Badge>
                )}
              </div>

              {/* Quick specs grid */}
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1 sm:gap-1.5"><Bed className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" /><span>{listing.beds} Bed{listing.beds !== 1 ? "s" : ""}</span></div>
                <div className="flex items-center gap-1 sm:gap-1.5"><Bath className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" /><span>{listing.baths} Bath{listing.baths !== 1 ? "s" : ""}</span></div>
                {listing.interior_sqft && <div className="flex items-center gap-1 sm:gap-1.5"><Maximize className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" /><span>{listing.interior_sqft.toLocaleString()} sf</span></div>}
                {listing.floor_level && <div className="flex items-center gap-1 sm:gap-1.5"><Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" /><span>Floor {listing.floor_level}</span></div>}
                {listing.exposure && <div className="flex items-center gap-1 sm:gap-1.5"><Compass className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" /><span>{listing.exposure}</span></div>}
                <div className="flex items-center gap-1 sm:gap-1.5"><Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" /><span>{completionDisplay}</span></div>
              </div>
            </div>

            {/* ── Unit Details ───────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6"><CardTitle className="text-base sm:text-lg">Unit Details</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div><dt className="text-muted-foreground mb-0.5">Project</dt><dd className="font-medium">{listing.project_name}</dd></div>
                  {(listing.developer_name || project?.developer_name) && (
                    <div><dt className="text-muted-foreground mb-0.5">Developer</dt><dd className="font-medium">{listing.developer_name || project?.developer_name}</dd></div>
                  )}
                  <div><dt className="text-muted-foreground mb-0.5">City</dt><dd className="font-medium">{listing.city}</dd></div>
                  {listing.unit_type && <div><dt className="text-muted-foreground mb-0.5">Unit Type</dt><dd className="font-medium">{listing.unit_type}</dd></div>}
                  <div><dt className="text-muted-foreground mb-0.5">Est. Completion</dt><dd className="font-medium">{completionDisplay}</dd></div>
                  <div><dt className="text-muted-foreground mb-0.5">Parking</dt><dd className="font-medium">{listing.parking || "Not included"}</dd></div>
                  <div>
                    <dt className="text-muted-foreground mb-0.5">Locker</dt>
                    <dd className="font-medium flex items-center gap-1">
                      {listing.has_locker ? <><CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" /> Included</> : <><XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" /> No</>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-0.5">Dev. Approval</dt>
                    <dd className="font-medium">{listing.developer_approval_required ? "Required" : "Not required"}</dd>
                  </div>
                  {listing.buyer_agent_commission && (
                    <div><dt className="text-muted-foreground mb-0.5">Buyer Agent Commission</dt><dd className="font-medium">{listing.buyer_agent_commission}</dd></div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* ── Project Highlights ─────────────────────────── */}
            {project?.highlights && project.highlights.length > 0 && (
              <Card>
                <CardHeader className="pb-3 sm:pb-6"><CardTitle className="text-base sm:text-lg">Project Highlights</CardTitle></CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {project.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                        <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mt-0.5 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* ── Amenities ──────────────────────────────────── */}
            {project?.amenities && project.amenities.length > 0 && (
              <Card>
                <CardHeader className="pb-3 sm:pb-6"><CardTitle className="text-base sm:text-lg">Building Amenities</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {project.amenities.map((a, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] sm:text-xs">{a}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Description ────────────────────────────────── */}
            {(listing.description || project?.full_description) && (
              <Card>
                <CardHeader className="pb-3 sm:pb-6"><CardTitle className="text-base sm:text-lg">About This Unit</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                    {listing.description || project?.full_description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* ── Floor Plans (Visual) ───────────────────────── */}
            {floorplanImages.length > 0 && (
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Floor Plan{floorplanImages.length > 1 ? "s" : ""}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn("grid gap-4", floorplanImages.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
                    {floorplanImages.map((fp) => (
                      <a key={fp.id} href={fp.url} target="_blank" rel="noopener noreferrer" className="group block">
                        <div className="rounded-xl overflow-hidden border border-border bg-muted/30 hover:border-primary/40 transition-colors">
                          <img
                            src={fp.url}
                            alt={fp.file_name || "Floor Plan"}
                            className="w-full h-auto object-contain max-h-[500px] p-2"
                          />
                          <div className="px-3 py-2 border-t border-border flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-muted-foreground truncate">{fp.file_name || "Floor Plan"}</span>
                            <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Video Walkthrough ──────────────────────────── */}
            {videoFiles.length > 0 && (
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                    Video Walkthrough
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {videoFiles.map((vid) => (
                      <div key={vid.id} className="rounded-xl overflow-hidden border border-border bg-black">
                        <video
                          controls
                          preload="metadata"
                          className="w-full max-h-[500px]"
                          playsInline
                        >
                          <source src={vid.url} type={vid.url.endsWith(".webm") ? "video/webm" : vid.url.endsWith(".mov") ? "video/quicktime" : "video/mp4"} />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Documents ──────────────────────────────────── */}
            {(listing.floor_plan_url || listing.brochure_url || floorplanFiles.filter(f => !floorplanImages.includes(f)).length > 0) && (
              <Card>
                <CardHeader className="pb-3 sm:pb-6"><CardTitle className="text-base sm:text-lg">Documents</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {listing.floor_plan_url && (
                    <a href={listing.floor_plan_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                      <span className="flex-1 text-xs sm:text-sm font-medium">{listing.floor_plan_name || "Floor Plan"}</span>
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </a>
                  )}
                  {/* PDF floorplans as downloadable docs */}
                  {floorplanFiles.filter(f => !floorplanImages.includes(f)).map((fp) => (
                    <a key={fp.id} href={fp.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                      <span className="flex-1 text-xs sm:text-sm font-medium">{fp.file_name || "Floor Plan PDF"}</span>
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </a>
                  ))}
                  {listing.brochure_url && (
                    <a href={listing.brochure_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                      <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                      <span className="flex-1 text-xs sm:text-sm font-medium">Project Brochure</span>
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Parent Project Link ────────────────────────── */}
            {project && (
              <div className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  {project.featured_image && (
                    <img src={project.featured_image} alt={project.name} className="h-10 w-14 sm:h-12 sm:w-16 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Presale Project</p>
                    <p className="font-semibold text-sm sm:text-base truncate">{project.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{project.city}{project.neighborhood ? ` · ${project.neighborhood}` : ""}</p>
                  </div>
                </div>
                <Link to={`/presale/${project.slug}`}>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm shrink-0">View Project</Button>
                </Link>
              </div>
            )}

            {/* ── Location Map ───────────────────────────────── */}
            {project?.map_lat && project?.map_lng && (
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AssignmentLocationMap
                    lat={project.map_lat}
                    lng={project.map_lng}
                    projectName={listing.project_name}
                    address={listing.address || project.address}
                  />
                  <p className="text-xs sm:text-sm text-muted-foreground mt-3">
                    {listing.address || project.address || listing.project_name}, {listing.neighborhood || project.neighborhood || ""} {listing.city}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── RIGHT COLUMN (desktop only sidebar) ──────── */}
          <div className="hidden lg:block space-y-6">
            {/* Pricing Card */}
            <Card className="border-primary/20 sticky top-4 overflow-hidden">
              <CardContent className="pt-6 relative">
                {!isVerified && (
                  <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-6 text-center rounded-xl">
                    <Lock className="h-8 w-8 text-primary mb-3" />
                    <p className="font-semibold text-foreground mb-1">Agent Access Only</p>
                    <p className="text-sm text-muted-foreground mb-4">Verify your agent credentials to view full pricing & details.</p>
                    <Button size="sm" className="w-full" onClick={() => setFormOpen(true)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Request Access
                    </Button>
                  </div>
                )}

                <p className="text-sm text-muted-foreground mb-1">Assignment Price</p>
                <div className="text-3xl font-bold text-foreground mb-3">{priceFormatted}</div>

                {discount && discount > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground line-through">{formatPrice(listing.original_price!)}</span>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">Save {formatPrice(discount)}</Badge>
                  </div>
                )}

                <Separator className="my-4" />

                <div className="space-y-3 text-sm">
                  {listing.original_price && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Original Purchase Price</span>
                      <span className="font-medium">{formatPrice(listing.original_price)}</span>
                    </div>
                  )}
                  {listing.deposit_to_lock && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deposit to Lock</span>
                      <span className="font-medium">{formatPrice(listing.deposit_to_lock)}</span>
                    </div>
                  )}
                  {listing.buyer_agent_commission && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Buyer Agent Commission</span>
                      <span className="font-medium">{listing.buyer_agent_commission}</span>
                    </div>
                  )}
                  {listing.developer_approval_required && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>Developer Approval Required</span>
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Agent CTA */}
                {listingAgent ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {listingAgent.avatar_url ? (
                          <img src={listingAgent.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-primary">
                            {(listingAgent.full_name || "A").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{listingAgent.full_name || "Listing Agent"}</p>
                        <p className="text-xs text-muted-foreground">Real Broker</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {listingAgent.phone && (
                        <a href={`tel:${listingAgent.phone}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                            <Phone className="h-3.5 w-3.5" />Call
                          </Button>
                        </a>
                      )}
                      <a href={`mailto:${listingAgent.email}?subject=Assignment Inquiry: ${listing.title}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                          <Mail className="h-3.5 w-3.5" />Email
                        </Button>
                      </a>
                    </div>
                    <Button size="lg" className="w-full" onClick={() => setFormOpen(true)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact {listingAgent.full_name?.split(" ")[0] || "Agent"}
                    </Button>
                  </div>
                ) : (
                  <Button size="lg" className="w-full" onClick={() => setFormOpen(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Inquire About This Assignment
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Deposit / Project Info */}
            {project?.deposit_structure && (
              <Card>
                <CardHeader><CardTitle className="text-base">Deposit Structure</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.deposit_structure}</p>
                  {project.deposit_percent && (
                    <p className="text-sm font-medium mt-2">{project.deposit_percent}% total deposit</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Key Dates */}
            <Card>
              <CardHeader><CardTitle className="text-base">Key Dates</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Estimated Completion</p>
                      <p className="text-muted-foreground">{completionDisplay}</p>
                    </div>
                  </div>
                  {listing.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-muted-foreground">{listing.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documents Sidebar */}
            {(listing.floor_plan_url || listing.brochure_url) && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4 text-primary" />Downloads</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {listing.floor_plan_url && (
                    <a href={listing.floor_plan_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="flex-1 text-sm font-medium">{listing.floor_plan_name || "Floor Plan"}</span>
                      <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  )}
                  {listing.brochure_url && (
                    <a href={listing.brochure_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                      <BookOpen className="h-4 w-4 text-primary shrink-0" />
                      <span className="flex-1 text-sm font-medium">Project Brochure</span>
                      <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Expert Advisory Card */}
            <ExpertAdvisoryCard />

            {/* One-Pager Download — verified agents only */}
            {isVerified && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <FileDown className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Download One-Pager</p>
                      <p className="text-xs text-muted-foreground">Branded PDF for client sharing</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleDownloadOnePager}
                    disabled={isExporting}
                    variant="outline"
                    className="w-full h-10 gap-2 text-sm font-semibold border-primary/30 hover:bg-primary/5"
                  >
                    {isExporting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
                    ) : (
                      <><Download className="h-4 w-4" />Download PNG One-Pager</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Mobile sticky CTA */}
      <AssignmentMobileCTA
        projectName={listing.project_name}
        price={priceFormatted}
        onInquireClick={() => setFormOpen(true)}
      />

      <AboutContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        selectedAgentName={listing.title}
      />

      {/* Off-screen one-pager template for html2canvas capture */}
      <div
        style={{
          position: "fixed", top: 0, left: "-9999px", width: 612,
          visibility: "visible", pointerEvents: "none", zIndex: -1,
        }}
      >
        <AssignmentOnePager
          ref={onePagerRef}
          listing={listing}
          project={project || null}
          heroImage={uniqueGallery[0]}
          completionDisplay={completionDisplay}
        />
      </div>
    </div>
  );
}
