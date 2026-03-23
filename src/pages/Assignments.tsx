import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, Bed, Bath, Maximize, Search, SlidersHorizontal,
  Building2, ArrowRight, Lock, Filter, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVerifiedAgent } from "@/hooks/useVerifiedAgent";
import { AboutContactForm } from "@/components/about/AboutContactForm";

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

function AssignmentCard({ listing, isVerified, onInquire }: {
  listing: Assignment;
  isVerified: boolean;
  onInquire: (title: string) => void;
}) {
  const photo = listing.photos?.[0] || listing.featured_image;
  const savings = listing.original_price && listing.original_price > listing.assignment_price
    ? listing.original_price - listing.assignment_price : null;

  return (
    <div className="group rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Image */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={listing.title}
            className={cn(
              "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300",
              !isVerified && "blur-lg"
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Building2 className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px] px-2">Assignment</Badge>
          {savings && savings > 0 && isVerified && (
            <Badge className="bg-green-600 hover:bg-green-600 text-white text-[10px] px-2">
              Save {formatPrice(savings)}
            </Badge>
          )}
        </div>

        {/* Lock overlay for non-verified */}
        {!isVerified && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <Lock className="h-7 w-7 text-white" />
            <span className="text-white text-xs font-medium">Agent Access Only</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 relative">
        {!isVerified && (
          <div className="absolute inset-0 bg-card/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-b-2xl gap-2 p-4">
            <p className="text-sm text-center text-muted-foreground">Verify as agent to see details & pricing</p>
            <Button size="sm" variant="outline" onClick={() => onInquire("Assignment Listing")} className="text-xs h-8">
              Request Access
            </Button>
          </div>
        )}

        {/* Price */}
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

        {/* Project + Location */}
        <p className="font-semibold text-sm text-foreground truncate mb-1">{listing.project_name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{listing.neighborhood || listing.city}, {listing.city}</span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{listing.beds} bed</span>
          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{listing.baths} bath</span>
          {listing.interior_sqft && (
            <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{listing.interior_sqft.toLocaleString()} sqft</span>
          )}
        </div>

        {/* CTA */}
        {isVerified ? (
          <Link to={`/assignments/${listing.id}`}>
            <Button size="sm" className="w-full gap-1.5 h-9 text-xs font-semibold">
              View Full Details <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        ) : (
          <Button size="sm" variant="outline" className="w-full h-9 text-xs" onClick={() => onInquire("Assignment Listing")}>
            Inquire to Access
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Assignments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [inquireTitle, setInquireTitle] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { isVerified } = useVerifiedAgent();

  // Filters from URL params
  const cityFilter = searchParams.get("city") || "any";
  const bedsFilter = searchParams.get("beds") || "any";
  const priceFilter = searchParams.get("price") || "any";
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
        .select("id, title, project_name, city, neighborhood, assignment_price, original_price, beds, baths, interior_sqft, featured_image, photos, status, unit_number, estimated_completion, exposure")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Assignment[];
    },
  });

  const selectedPriceRange = PRICE_RANGES.find((r) => r.label === priceFilter) || PRICE_RANGES[0];

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (cityFilter !== "any" && l.city !== cityFilter) return false;
      if (bedsFilter !== "any" && String(l.beds) !== bedsFilter) return false;
      if (selectedPriceRange.max !== Infinity || selectedPriceRange.min > 0) {
        if (l.assignment_price < selectedPriceRange.min || l.assignment_price > selectedPriceRange.max) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!l.project_name.toLowerCase().includes(q) && !l.city.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [listings, cityFilter, bedsFilter, selectedPriceRange, searchQuery]);

  const activeFilterCount = [
    cityFilter !== "any",
    bedsFilter !== "any",
    priceFilter !== "any",
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
                placeholder="Search project or city..."
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
          {!isVerified && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-full px-3 py-1.5">
              <Lock className="h-3 w-3" />
              <span>Verified agents see full details & pricing</span>
            </div>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden">
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1">No assignments found</p>
            <p className="text-sm mb-4">Try adjusting your filters or check back soon for new listings.</p>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((listing) => (
              <AssignmentCard
                key={listing.id}
                listing={listing}
                isVerified={isVerified}
                onInquire={handleInquire}
              />
            ))}
          </div>
        )}

        {/* CTA for non-agents */}
        {!isVerified && listings.length > 0 && (
          <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Are You a Real Estate Agent?</h2>
            <p className="text-muted-foreground mb-5 max-w-md mx-auto text-sm">
              Verified agents get full access to assignment pricing, unit details, floor plans, and direct contact with sellers.
            </p>
            <Button onClick={() => handleInquire("Agent Verification Request")} size="lg" className="gap-2">
              <ArrowRight className="h-4 w-4" /> Apply for Agent Access
            </Button>
          </div>
        )}
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
