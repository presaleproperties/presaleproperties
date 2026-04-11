import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "@/components/seo/Helmet";
import { supabase } from "@/integrations/supabase/client";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { REWPhotoGallery } from "@/components/resale/REWPhotoGallery";
import { PropertyStickyHeader } from "@/components/mobile/PropertyStickyHeader";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import {
  MapPin, Bed, Bath, Maximize, Building2, Calendar, MessageCircle,
  Phone, Mail, Shield, FileText, Download, BookOpen, Compass, Car,
  CheckCircle, XCircle, Home, FileDown, Loader2, Lock, Share2, Eye,
  Ruler, Layers,
} from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useVerifiedAgent } from "@/hooks/useVerifiedAgent";
import { AboutContactForm } from "@/components/about/AboutContactForm";
import { AssignmentOnePager } from "@/components/assignments/AssignmentOnePager";
import { AssignmentLocationMap } from "@/components/assignments/AssignmentLocationMap";
import { AssignmentMobileCTA } from "@/components/assignments/AssignmentMobileCTA";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from "dompurify";

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
  developer_credit: number | null;
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
  const [formOpen, setFormOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const onePagerRef = useRef<HTMLDivElement>(null);
  const { isVerified } = useVerifiedAgent();
  const { toast: uiToast } = useToast();

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

  const { data: listingAgent } = useQuery({
    queryKey: ["listing-agent", listing?.listing_agent_id],
    queryFn: async () => {
      if (!listing?.listing_agent_id) return null;
      const { data: member } = await (supabase as any)
        .from("team_members")
        .select("full_name, email, phone, photo_url, title")
        .eq("id", listing.listing_agent_id)
        .maybeSingle();
      if (!member) return null;
      return {
        full_name: member.full_name,
        email: member.email,
        phone: member.phone,
        avatar_url: member.photo_url,
        brokerage_name: "Real Broker",
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
    ...floorplanImages.map(fp => fp.url),
    ...((listing?.floor_plan_url && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(listing.floor_plan_url)) ? [listing.floor_plan_url] : []),
  ].filter(Boolean);
  const uniqueGallery = [...new Set(gallery)];

  const completionDisplay = listing?.estimated_completion
    || (project?.completion_month && project?.completion_year
      ? `${new Date(2024, project.completion_month - 1).toLocaleString("default", { month: "short" })} ${project.completion_year}`
      : project?.completion_year?.toString() || "TBD");

  const discount = listing?.original_price && listing.original_price > listing.assignment_price
    ? listing.original_price - listing.assignment_price
    : null;

  const developerCredit = listing?.developer_credit && listing.developer_credit > 0 ? listing.developer_credit : null;

  const handleShare = async () => {
    const shareUrl = `https://presaleproperties.com/assignments/${listing?.id}`;
    if (navigator.share && navigator.canShare?.({ url: shareUrl })) {
      try { await navigator.share({ title: listing?.title, url: shareUrl }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      uiToast({ title: "Link copied to clipboard!" });
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareUrl; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      uiToast({ title: "Link copied to clipboard!" });
    }
  };

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

  const whatsappLink = `https://wa.me/16722581100?text=${encodeURIComponent(`Hi! I'm interested in the assignment at "${listing?.project_name}" (${listing?.title}). Can you send me more details?`)}`;

  if (isLoading) {
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

  if (error || !listing) {
    return (
      <>
        <ConversionHeader />
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Assignment Not Found</h1>
          <p className="text-muted-foreground mb-6">This assignment may have been sold or removed.</p>
          <Link to="/map-search?mode=assignments"><Button>Browse Assignments</Button></Link>
        </div>
        <Footer />
      </>
    );
  }

  const priceFormatted = formatPrice(listing.assignment_price);
  const allImages = uniqueGallery.map(url => ({ url }));

  const breadcrumbItems = [
    { label: "Assignments", href: "/assignments" },
    { label: listing.title },
  ];

  const descriptionHtml = (listing.description || project?.full_description || '');
  const sanitizedDescription = DOMPurify.sanitize(
    descriptionHtml
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
      .replace(/^• (.+)$/gm, '<div class="flex items-start gap-2 text-sm sm:text-sm lg:text-base"><span class="text-primary mt-0.5">•</span><span>$1</span></div>')
      .replace(/\n{2,}/g, '</p><p class="text-sm sm:text-sm lg:text-base leading-relaxed">')
      .replace(/\n/g, '<br/>'),
    { ALLOWED_TAGS: ['strong', 'em', 'span', 'br', 'p', 'div'], ALLOWED_ATTR: ['class'] }
  );

  // Build key facts for the inline summary row
  const keyFacts: string[] = [
    `${listing.beds} Bed`,
    `${listing.baths} Bath`,
    ...(listing.interior_sqft ? [`${listing.interior_sqft.toLocaleString()} sqft`] : []),
    ...(listing.floor_level ? [`Floor ${listing.floor_level}`] : []),
    ...(listing.exposure ? [listing.exposure] : []),
  ];

  // Merge all downloadable files
  const allDownloads: { label: string; url: string; icon: "floor" | "brochure" }[] = [];
  if (listing.floor_plan_url) allDownloads.push({ label: listing.floor_plan_name || "Floor Plan", url: listing.floor_plan_url, icon: "floor" });
  floorplanFiles.filter(f => !floorplanImages.includes(f)).forEach(fp => {
    allDownloads.push({ label: fp.file_name || "Floor Plan PDF", url: fp.url, icon: "floor" });
  });
  if (listing.brochure_url) allDownloads.push({ label: "Project Brochure", url: listing.brochure_url, icon: "brochure" });

  return (
    <>
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

      <ConversionHeader hideOnMobile />

      <PropertyStickyHeader
        price={priceFormatted}
        specs={`${listing.beds} Bed · ${listing.neighborhood || listing.city} · ${completionDisplay}`}
        onShare={handleShare}
        backPath="/assignments"
      />

      <main className="min-h-screen bg-background pb-24 lg:pb-0">
        {/* Breadcrumbs */}
        <div className="px-3 lg:container lg:px-4 pt-3 md:pt-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section>
          <div className="lg:container px-0 lg:px-4 py-0 lg:py-6">
            <div className="grid lg:grid-cols-5 gap-0 lg:gap-8 lg:items-start">
              {/* Gallery */}
              <div className="lg:col-span-3">
                <REWPhotoGallery
                  photos={allImages}
                  alt={listing.title}
                  previewAspectClassName="aspect-[4/3] md:aspect-[4/3] lg:aspect-[3/2]"
                />
              </div>

              {/* Info panel — matches presale project detail layout exactly */}
              <div className="lg:col-span-2 flex flex-col px-4 lg:px-0 pt-4 lg:pt-0">
                {/* Status Badge Row */}
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                  <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-2 py-0.5">Assignment</Badge>
                  {discount && discount > 0 && (
                    <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-0.5">
                      Save {formatPrice(discount)}
                    </Badge>
                  )}
                  {developerCredit && (
                    <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-0.5">
                      {formatPrice(developerCredit)} Credit
                    </Badge>
                  )}
                </div>

                {/* Title and City Badge — inline like presale */}
                <div className="flex flex-wrap items-center gap-2 mb-1.5 md:mb-2">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                    {listing.title}
                  </h1>
                  <Badge variant="secondary" className="md:hidden text-[10px] px-1.5 py-0.5 font-medium">
                    {listing.city}
                  </Badge>
                </div>

                {/* Price */}
                <div className="mb-2 md:mb-3">
                  <span className="font-bold text-primary !text-[28px] sm:!text-[32px] md:!text-[36px] lg:!text-[40px] leading-tight">
                    {priceFormatted}
                  </span>
                  {listing.original_price && listing.original_price > listing.assignment_price && (
                    <span className="text-sm text-muted-foreground line-through ml-3">{formatPrice(listing.original_price)}</span>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1 md:mb-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium text-foreground">
                    {listing.neighborhood || project?.neighborhood || listing.city}, {listing.city}
                  </span>
                </div>
                {listing.address && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2 md:hidden">
                    <span className="ml-5 truncate">{listing.address}</span>
                  </div>
                )}

                {/* Quick Action Buttons — Map, Street View, Share */}
                <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-3">
                  {project?.map_lat && project?.map_lng && (
                    <Link to={`/map-search?lat=${project.map_lat}&lng=${project.map_lng}&zoom=16`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>Map</span>
                    </Link>
                  )}
                  {project?.map_lat && project?.map_lng && (
                    <a href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${project.map_lat},${project.map_lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors">
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      <span>Street View</span>
                    </a>
                  )}
                  <button onClick={handleShare} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors">
                    <Share2 className="h-3.5 w-3.5 text-primary" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Key Facts — desktop/tablet only */}
                <div className="hidden md:block space-y-2 mb-3">
                  {(listing.developer_name || project?.developer_name) && (
                    <div className="flex items-center gap-2.5 text-sm lg:text-base">
                      <Building2 className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Developer:</span>
                      <span className="font-semibold truncate">{listing.developer_name || project?.developer_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-sm lg:text-base">
                    <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Completion:</span>
                    <span className="font-semibold">{completionDisplay}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm lg:text-base">
                    <Home className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Unit:</span>
                    <span className="font-semibold">{listing.beds} Bed / {listing.baths} Bath{listing.interior_sqft ? ` · ${listing.interior_sqft.toLocaleString()} sqft` : ""}</span>
                  </div>
                </div>

                {/* Short description — visible on all sizes */}
                {(listing.description || project?.full_description) && (
                  <p className="text-sm text-muted-foreground mt-4 mb-2 md:mt-2 md:mb-0 leading-relaxed line-clamp-3 lg:line-clamp-4">
                    {listing.description ? listing.description.replace(/<[^>]*>/g, '').slice(0, 200) : project?.full_description?.replace(/<[^>]*>/g, '').slice(0, 200)}
                    {((listing.description || project?.full_description || "").length > 200) && "…"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Mobile-only highlights section — matches presale style */}
        <section className="border-t md:hidden">
          <div className="px-4 py-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="flex items-center gap-2.5">
                <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Unit</p>
                  <p className="text-sm font-semibold">{listing.beds} Bed / {listing.baths} Bath</p>
                </div>
              </div>
              {listing.interior_sqft && (
                <div className="flex items-center gap-2.5">
                  <Ruler className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Interior</p>
                    <p className="text-sm font-semibold">{listing.interior_sqft.toLocaleString()} sqft</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Completion</p>
                  <p className="text-sm font-semibold">{completionDisplay}</p>
                </div>
              </div>
              {(listing.developer_name || project?.developer_name) && (
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Developer</p>
                    <p className="text-sm font-semibold truncate">{listing.developer_name || project?.developer_name}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Parking</p>
                  <p className="text-sm font-semibold">{listing.parking || "None"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Locker</p>
                  <p className="text-sm font-semibold">{listing.has_locker ? "Included" : "No"}</p>
                </div>
              </div>
              {listing.exposure && (
                <div className="flex items-center gap-2.5">
                  <Compass className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Exposure</p>
                    <p className="text-sm font-semibold">{listing.exposure}</p>
                  </div>
                </div>
              )}
              {listing.floor_level && (
                <div className="flex items-center gap-2.5">
                  <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Floor</p>
                    <p className="text-sm font-semibold">Level {listing.floor_level}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content grid */}
        <section className="py-4 lg:py-8">
          <div className="px-4 lg:container lg:px-4">
            <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-4 lg:space-y-6">

                {/* Key Documents — Floor Plans & Brochure (top priority) */}
                {(floorplanImages.length > 0 || allDownloads.length > 0) && (
                  <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
                    <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Key Documents
                    </h2>

                    {/* Download buttons first — prominent */}
                    {allDownloads.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        {allDownloads.map((dl, i) => (
                          <a key={i} href={dl.url} target="_blank" rel="noopener noreferrer" download
                            className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              {dl.icon === "brochure" ? <BookOpen className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{dl.label}</p>
                              <p className="text-[11px] text-muted-foreground">Tap to download</p>
                            </div>
                            <Download className="h-4 w-4 text-primary shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Floor plan images */}
                    {floorplanImages.length > 0 && (
                      <div className={cn("grid gap-3", floorplanImages.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
                        {floorplanImages.map((fp) => (
                          <a key={fp.id} href={fp.url} target="_blank" rel="noopener noreferrer" className="group block">
                            <div className="rounded-lg overflow-hidden border border-border bg-muted/20 hover:border-primary/40 transition-colors">
                              <img src={fp.url} alt={fp.file_name || "Floor Plan"} className="w-full h-auto object-contain max-h-[400px] p-2" />
                              <div className="px-3 py-2 border-t border-border/50 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground truncate">{fp.file_name || "Floor Plan"}</span>
                                <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Pricing Details — no duplicate of hero price */}
                {(listing.original_price || listing.deposit_to_lock || developerCredit || listing.buyer_agent_commission || listing.developer_approval_required) && (
                  <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
                    <h2 className="text-base font-bold text-foreground mb-3">Pricing Details</h2>
                    <div className="space-y-2.5 text-sm">
                      {listing.original_price && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Original Purchase Price</span>
                          <span className="font-medium">{formatPrice(listing.original_price)}</span>
                        </div>
                      )}
                      {discount && discount > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Savings vs. Original</span>
                          <span className="font-semibold">{formatPrice(discount)}</span>
                        </div>
                      )}
                      {listing.deposit_to_lock && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deposit to Lock</span>
                          <span className="font-medium">{formatPrice(listing.deposit_to_lock)}</span>
                        </div>
                      )}
                      {developerCredit && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Developer Credit</span>
                          <span className="font-semibold">{formatPrice(developerCredit)}</span>
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
                          <span>Developer Approval</span>
                          <span className="font-medium">Required</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* About This Unit */}
                {(listing.description || project?.full_description) && (
                  <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
                    <h2 className="text-base font-bold text-foreground mb-3">About This Unit</h2>
                    <div
                      className="prose prose-sm max-w-none text-muted-foreground space-y-2"
                      dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                    />
                  </div>
                )}

                {/* Amenities */}
                {project?.amenities && project.amenities.length > 0 && (
                  <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
                    <h2 className="text-base font-bold text-foreground mb-3">Building Amenities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                      {project.amenities.map((a, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          <span className="text-sm text-foreground">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video */}
                {videoFiles.length > 0 && (
                  <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
                    <h2 className="text-base font-bold text-foreground mb-3">Video Walkthrough</h2>
                    <div className="space-y-3">
                      {videoFiles.map((vid) => (
                        <div key={vid.id} className="rounded-lg overflow-hidden border border-border bg-black">
                          <video controls preload="metadata" className="w-full max-h-[500px]" playsInline>
                            <source src={vid.url} type={vid.url.endsWith(".webm") ? "video/webm" : vid.url.endsWith(".mov") ? "video/quicktime" : "video/mp4"} />
                          </video>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location Map */}
                {project?.map_lat && project?.map_lng && (
                  <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
                    <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Location
                    </h2>
                    <AssignmentLocationMap
                      lat={project.map_lat}
                      lng={project.map_lng}
                      projectName={listing.project_name}
                      address={listing.address || project.address}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {listing.address || project.address || listing.project_name}, {listing.neighborhood || project.neighborhood || ""} {listing.city}
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar — Desktop only */}
              <aside className="hidden lg:block lg:col-span-1" aria-label="Contact">
                <div className="w-full lg:sticky lg:top-20 space-y-4">
                  {/* Contact Card */}
                  <div className="bg-background rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-sm text-muted-foreground mb-1">Assignment Price</p>
                    <div className="text-3xl font-bold text-foreground mb-1">{priceFormatted}</div>

                    {discount && discount > 0 && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                        Save {formatPrice(discount)} vs. original
                      </p>
                    )}
                    {developerCredit && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                        {formatPrice(developerCredit)} developer credit
                      </p>
                    )}

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
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block">
                          <Button size="lg" className="w-full bg-[#25D366] hover:bg-[#1da851] text-white">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp {listingAgent.full_name?.split(" ")[0] || "Agent"}
                          </Button>
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button size="lg" className="w-full" onClick={() => setFormOpen(true)}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Inquire About This Unit
                        </Button>
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block">
                          <Button variant="outline" size="lg" className="w-full">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp Us
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="default" className="flex-1 justify-center h-11 text-sm" asChild>
                      <a href="tel:+16722581100">
                        <Phone className="h-4 w-4 mr-1.5" />
                        Call
                      </a>
                    </Button>
                    <Button variant="outline" size="default" className="flex-1 justify-center h-11 text-sm" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-1.5" />
                      Share
                    </Button>
                  </div>

                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Mobile sticky CTA */}
      <AssignmentMobileCTA
        projectName={listing.project_name}
        price={priceFormatted}
        onInquireClick={() => setFormOpen(true)}
        agentName={listingAgent?.full_name || undefined}
        agentPhone={listingAgent?.phone || undefined}
        floorPlanUrl={listing.floor_plan_url}
        brochureUrl={listing.brochure_url}
      />

      <AboutContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        selectedAgentName={listingAgent?.full_name || listing.title}
      />

      {/* Off-screen one-pager template */}
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
    </>
  );
}
