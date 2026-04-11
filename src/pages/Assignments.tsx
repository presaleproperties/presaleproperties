import { useState, useMemo, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { supabase } from "@/integrations/supabase/client";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, Bed, Bath, Maximize, Search,
  Building2, ArrowRight, Lock, X, Map, LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVerifiedAgent } from "@/hooks/useVerifiedAgent";
import { AboutContactForm } from "@/components/about/AboutContactForm";

const AssignmentsMap = lazy(() => import("@/components/assignments/AssignmentsMap"));

interface Assignment {
  id: string;
  title: string;
  project_name: string;
  city: string;
  neighborhood: string | null;
  assignment_price: number;
  original_price: number | null;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  featured_image: string | null;
  photos: string[] | null;
  status: string;
  unit_number: string | null;
  estimated_completion: string | null;
  exposure: string | null;
  project_id: string | null;
  address: string | null;
  _project_featured_image?: string | null;
  _project_gallery_images?: string[] | null;
  map_lat?: number | null;
  map_lng?: number | null;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(price);

const CITY_OPTIONS = [
  "Vancouver", "Burnaby", "Richmond", "Surrey", "Coquitlam",
  "Port Moody", "Langley", "Abbotsford", "Delta", "New Westminster",
];

const PRICE_RANGES = [
  { label: "Any Price", min: 0, max: Infinity },
  { label: "Under $600K", min: 0, max: 600000 },
  { label: "$600K–$800K", min: 600000, max: 800000 },
  { label: "$800K–$1M", min: 800000, max: 1000000 },
  { label: "$1M–$1.5M", min: 1000000, max: 1500000 },
  { label: "$1.5M+", min: 1500000, max: Infinity },
];

function AssignmentCard({ listing }: {
  listing: Assignment;
}) {
  const photo = listing.photos?.[0] || listing.featured_image || listing._project_gallery_images?.[0] || listing._project_featured_image;
  const savings = listing.original_price && listing.original_price > listing.assignment_price
    ? listing.original_price - listing.assignment_price : null;

  return (
    <Link to={`/assignments/${listing.id}`} className="group rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Building2 className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px] px-2">Assignment</Badge>
          {savings && savings > 0 && (
            <Badge className="bg-green-600 hover:bg-green-600 text-white text-[10px] px-2">
              Save {formatPrice(savings)}
            </Badge>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xl font-bold text-foreground">{formatPrice(listing.assignment_price)}</p>
            {listing.original_price && (
              <p className="text-xs text-muted-foreground line-through">{formatPrice(listing.original_price)}</p>
            )}
          </div>
          {listing.unit_number && (
            <Badge variant="outline" className="text-[10px]">Unit {listing.unit_number}</Badge>
          )}
        </div>
        <p className="font-semibold text-sm text-foreground truncate mb-1">{listing.project_name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{listing.neighborhood || listing.city}, {listing.city}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{listing.beds} bed</span>
          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{listing.baths} bath</span>
          {listing.interior_sqft && (
            <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{listing.interior_sqft.toLocaleString()} sqft</span>
          )}
        </div>
        <Button size="sm" className="w-full gap-1.5 h-9 text-xs font-semibold">
          View Full Details <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Link>
  );
}

export default function Assignments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [inquireTitle, setInquireTitle] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const { isVerified } = useVerifiedAgent();

  const cityFilter = searchParams.get("city") || "any";
  const bedsFilter = searchParams.get("beds") || "any";
  const priceFilter = searchParams.get("price") || "any";
  const neighborhoodFilter = searchParams.get("neighbourhood") || "any";
  const searchQuery = searchParams.get("q") || "";

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "any" || value === "") next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["assignments-browse"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("listings")
        .select("id, title, project_name, city, neighborhood, assignment_price, original_price, beds, baths, interior_sqft, featured_image, photos, status, unit_number, estimated_completion, exposure, project_id, address")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const projectIds = [...new Set((data || []).map((l: any) => l.project_id).filter(Boolean))];
      const projectMap: Record<string, { featured_image: string | null; gallery_images: string[] | null; map_lat: number | null; map_lng: number | null }> = {};
      if (projectIds.length > 0) {
        const { data: projects } = await (supabase as any)
          .from("presale_projects")
          .select("id, featured_image, gallery_images, map_lat, map_lng")
          .in("id", projectIds);
        (projects || []).forEach((p: any) => { projectMap[p.id] = p; });
      }

      return (data || []).map((l: any) => {
        const proj = l.project_id ? projectMap[l.project_id] : null;
        return {
          ...l,
          _project_featured_image: proj?.featured_image || null,
          _project_gallery_images: proj?.gallery_images || null,
          map_lat: proj?.map_lat || null,
          map_lng: proj?.map_lng || null,
        };
      }) as Assignment[];
    },
  });

  // Extract unique neighbourhoods for filter
  const neighbourhoods = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => {
      if (l.neighborhood) set.add(l.neighborhood);
    });
    return Array.from(set).sort();
  }, [listings]);

  const selectedPriceRange = PRICE_RANGES.find((r) => r.label === priceFilter) || PRICE_RANGES[0];

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (cityFilter !== "any" && l.city !== cityFilter) return false;
      if (bedsFilter !== "any" && String(l.beds) !== bedsFilter) return false;
      if (neighborhoodFilter !== "any" && l.neighborhood !== neighborhoodFilter) return false;
      if (selectedPriceRange.max !== Infinity || selectedPriceRange.min > 0) {
        if (l.assignment_price < selectedPriceRange.min || l.assignment_price > selectedPriceRange.max) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = [l.project_name, l.city, l.neighborhood, l.address].filter(Boolean).join(" ").toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [listings, cityFilter, bedsFilter, neighborhoodFilter, selectedPriceRange, searchQuery]);

  // Map-ready data
  const mapAssignments = useMemo(() =>
    filtered.map((l) => ({
      id: l.id,
      title: l.title,
      project_name: l.project_name,
      city: l.city,
      neighborhood: l.neighborhood,
      assignment_price: l.assignment_price,
      original_price: l.original_price,
      beds: l.beds,
      baths: l.baths,
      interior_sqft: l.interior_sqft,
      map_lat: l.map_lat || null,
      map_lng: l.map_lng || null,
    })),
    [filtered]
  );

  const activeFilterCount = [
    cityFilter !== "any",
    bedsFilter !== "any",
    priceFilter !== "any",
    neighborhoodFilter !== "any",
    !!searchQuery,
  ].filter(Boolean).length;

  const handleInquire = (title: string) => {
    setInquireTitle(title);
    setFormOpen(true);
  };

  const clearFilters = () => setSearchParams({}, { replace: true });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Assignment Sales in Metro Vancouver | PresaleProperties</title>
        <meta name="description" content="Browse presale assignment sales in Metro Vancouver & Fraser Valley. Find below-market condos and townhomes from verified sellers." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href="https://presaleproperties.com/assignments" />
        <meta property="og:title" content="Assignment Sales in Metro Vancouver | PresaleProperties" />
        <meta property="og:description" content="Browse presale assignment sales in Metro Vancouver & Fraser Valley." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://presaleproperties.com/assignments" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Presale Assignment Sales — Metro Vancouver",
          "description": "Browse presale condo and townhome assignment sales across Metro Vancouver and Fraser Valley, BC.",
          "url": "https://presaleproperties.com/assignments",
          "itemListOrder": "https://schema.org/ItemListOrderDescending"
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type":"ListItem","position":1,"name":"Home","item":"https://presaleproperties.com"},
            {"@type":"ListItem","position":2,"name":"Assignments","item":"https://presaleproperties.com/assignments"}
          ]
        })}</script>
      </Helmet>

      <ConversionHeader />

      <main className="container px-4 py-8 lg:py-12">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <span className="text-foreground">Assignments</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Assignment Sales
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Exclusive presale assignment listings in Metro Vancouver & Fraser Valley — often below original developer pricing.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-8 shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search project, city, address..."
                value={searchQuery}
                onChange={(e) => setFilter("q", e.target.value)}
                className="pl-9 h-10 bg-background"
              />
            </div>

            {/* City */}
            <Select value={cityFilter} onValueChange={(v) => setFilter("city", v)}>
              <SelectTrigger className="w-[140px] h-10 bg-background">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All Cities</SelectItem>
                {CITY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Neighbourhood */}
            {neighbourhoods.length > 0 && (
              <Select value={neighborhoodFilter} onValueChange={(v) => setFilter("neighbourhood", v)}>
                <SelectTrigger className="w-[160px] h-10 bg-background">
                  <SelectValue placeholder="Neighbourhood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">All Neighbourhoods</SelectItem>
                  {neighbourhoods.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Beds */}
            <Select value={bedsFilter} onValueChange={(v) => setFilter("beds", v)}>
              <SelectTrigger className="w-[110px] h-10 bg-background">
                <SelectValue placeholder="Beds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Beds</SelectItem>
                {[1, 2, 3, 4].map((b) => (
                  <SelectItem key={b} value={String(b)}>{b} Bed{b > 1 ? "s" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price */}
            <Select value={priceFilter} onValueChange={(v) => setFilter("price", v)}>
              <SelectTrigger className="w-[150px] h-10 bg-background">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_RANGES.map((r) => (
                  <SelectItem key={r.label} value={r.label}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-10 w-10 flex items-center justify-center transition-colors",
                  viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                )}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={cn(
                  "h-10 w-10 flex items-center justify-center transition-colors",
                  viewMode === "map" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                )}
                title="Map view"
              >
                <Map className="h-4 w-4" />
              </button>
            </div>

            {/* Clear */}
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 gap-1.5 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" /> Clear
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{activeFilterCount}</Badge>
              </Button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${filtered.length} assignment${filtered.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
      </main>

      <Footer />

      <AboutContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        selectedAgentName={inquireTitle || undefined}
      />
    </div>
  );
}
