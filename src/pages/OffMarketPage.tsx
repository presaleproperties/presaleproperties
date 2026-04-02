import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { OffMarketCard } from "@/components/off-market/OffMarketCard";
import { UnlockModal } from "@/components/off-market/UnlockModal";
import { supabase } from "@/integrations/supabase/client";
import { trackOffMarketEvent, getApprovedEmail, checkAccess } from "@/lib/offMarketAnalytics";
import { Lock, ChevronDown, X, MessageCircle, Phone, SlidersHorizontal } from "lucide-react";
import { useVipAuth } from "@/hooks/useVipAuth";

interface OffMarketListing {
  id: string;
  linked_project_name: string;
  linked_project_slug: string;
  developer_name: string | null;
  available_units: number;
  total_units: number;
  construction_stage: string | null;
  access_level: string | null;
  auto_approve_access: boolean;
  incentives: string | null;
  status: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function OffMarketPage() {
  const navigate = useNavigate();
  const { isVipLoggedIn, isVipApproved } = useVipAuth();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<OffMarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectDataMap, setProjectDataMap] = useState<Record<string, any>>({});
  const [minPriceMap, setMinPriceMap] = useState<Record<string, number>>({});
  const [accessMap, setAccessMap] = useState<Record<string, boolean>>({});
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [bedsFilter, setBedsFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Unlock modal
  const [unlockListing, setUnlockListing] = useState<OffMarketListing | null>(null);
  const preOpenSlug = searchParams.get("unlock");

  useEffect(() => {
    trackOffMarketEvent("page_view");
    fetchListings();
  }, []);

  // Pre-open unlock modal if URL has ?unlock=slug
  useEffect(() => {
    if (preOpenSlug && listings.length > 0) {
      const found = listings.find((l) => l.linked_project_slug === preOpenSlug);
      if (found) setUnlockListing(found);
    }
  }, [preOpenSlug, listings]);

  async function fetchListings() {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("off_market_listings")
      .select("id, linked_project_name, linked_project_slug, developer_name, available_units, total_units, construction_stage, access_level, auto_approve_access, incentives, status")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (fetchError) {
      console.error(fetchError);
      setError("Failed to load listings. Please try again.");
      setLoading(false);
      return;
    }

    const items = (data || []) as OffMarketListing[];
    setListings(items);

    // Fetch linked project data
    const slugs = items.map((l) => l.linked_project_slug);
    if (slugs.length > 0) {
      const { data: projects } = await supabase
        .from("presale_projects")
        .select("slug, city, neighborhood, project_type, featured_image, starting_price, completion_year")
        .in("slug", slugs);

      const pMap: Record<string, any> = {};
      (projects || []).forEach((p: any) => { pMap[p.slug] = p; });
      setProjectDataMap(pMap);
    }

    // Fetch min prices from units
    const listingIds = items.map((l) => l.id);
    if (listingIds.length > 0) {
      const { data: units } = await supabase
        .from("off_market_units")
        .select("listing_id, price")
        .in("listing_id", listingIds)
        .eq("status", "available")
        .order("price", { ascending: true });

      const priceMap: Record<string, number> = {};
      (units || []).forEach((u: any) => {
        if (!priceMap[u.listing_id]) priceMap[u.listing_id] = u.price;
      });
      setMinPriceMap(priceMap);
    }

    // If VIP approved, grant access to all listings
    if (isVipApproved) {
      const accMap: Record<string, boolean> = {};
      items.forEach((item) => { accMap[item.id] = true; });
      setAccessMap(accMap);
    } else {
      // Check access for stored email
      const email = getApprovedEmail();
      if (email) {
        const accMap: Record<string, boolean> = {};
        for (const item of items) {
          accMap[item.id] = await checkAccess(item.id, email);
        }
        setAccessMap(accMap);
      }
    }

    setLoading(false);
  }

  // Get distinct cities from project data
  const cities = useMemo(() => {
    const set = new Set<string>();
    Object.values(projectDataMap).forEach((p: any) => { if (p.city) set.add(p.city); });
    return Array.from(set).sort();
  }, [projectDataMap]);

  // Filter listings
  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const proj = projectDataMap[l.linked_project_slug];
      if (debouncedSearch && !l.linked_project_name.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      if (cityFilter !== "all" && proj?.city !== cityFilter) return false;
      if (typeFilter !== "all" && proj?.project_type !== typeFilter) return false;
      const mp = minPriceMap[l.id] || proj?.starting_price;
      if (minPrice && mp && mp < Number(minPrice)) return false;
      if (maxPrice && mp && mp > Number(maxPrice)) return false;
      return true;
    });
  }, [listings, debouncedSearch, cityFilter, typeFilter, bedsFilter, minPrice, maxPrice, projectDataMap, minPriceMap]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setCityFilter("all");
    setTypeFilter("all");
    setBedsFilter("all");
    setMinPrice("");
    setMaxPrice("");
  }, []);

  const hasFilters = search || cityFilter !== "all" || typeFilter !== "all" || minPrice || maxPrice;
  const activeFilterCount = [cityFilter !== "all", typeFilter !== "all", !!minPrice, !!maxPrice].filter(Boolean).length;

  const filterControls = (
    <>
      <Input
        placeholder="Search project..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-52 bg-card border-border h-9 text-sm"
        aria-label="Search projects"
      />
      <Select value={cityFilter} onValueChange={setCityFilter}>
        <SelectTrigger className="w-full md:w-36 bg-card border-border h-9 text-sm" aria-label="Filter by city">
          <SelectValue placeholder="City" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Cities</SelectItem>
          {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-full md:w-36 bg-card border-border h-9 text-sm" aria-label="Filter by type">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="condo">Condo</SelectItem>
          <SelectItem value="townhome">Townhome</SelectItem>
          <SelectItem value="duplex">Duplex</SelectItem>
          <SelectItem value="mixed">Mixed</SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder="Min $"
        value={minPrice}
        onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))}
        className="w-full md:w-24 bg-card border-border h-9 text-sm"
        inputMode="numeric"
        aria-label="Minimum price"
      />
      <Input
        placeholder="Max $"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))}
        className="w-full md:w-24 bg-card border-border h-9 text-sm"
        inputMode="numeric"
        aria-label="Maximum price"
      />
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
          <X className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      )}
    </>
  );

  return (
    <>
      <Helmet>
        <title>Off-Market Presale Inventory | VIP Access | Presale Properties</title>
        <meta name="description" content="Access exclusive off-market presale condos and townhomes in Metro Vancouver. VIP pricing, floor plans & developer incentives not available to the public." />
        <link rel="canonical" href="https://presaleproperties.com/off-market" />
        <meta property="og:title" content="Off-Market Presale Inventory | VIP Access" />
        <meta property="og:description" content="Access exclusive off-market presale condos and townhomes in Metro Vancouver. VIP pricing, floor plans & developer incentives not available to the public." />
        <meta property="og:url" content="https://presaleproperties.com/off-market" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Off-Market Presale Inventory — Metro Vancouver",
            "description": "Exclusive off-market presale condos and townhomes with VIP pricing and developer incentives.",
            "url": "https://presaleproperties.com/off-market",
            "numberOfItems": filtered.length,
            "itemListElement": filtered.slice(0, 10).map((l, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "name": l.linked_project_name,
              "url": `https://presaleproperties.com/off-market/${l.linked_project_slug}`,
            })),
          })}
        </script>
      </Helmet>

      <ConversionHeader />

      {/* Hero */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <Badge className="bg-primary/15 text-primary border-primary/30 font-bold tracking-wider text-xs px-4 py-1.5">
            <Lock className="h-3 w-3 mr-1.5" /> EXCLUSIVE VIP ACCESS
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Off-Market <span className="text-primary">Presale</span> Inventory
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Access developer pricing, floor plans & incentives before they hit the public market
          </p>
          <div className="flex items-center justify-center gap-6 pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{listings.length}+</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Projects</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {listings.reduce((s, l) => s + (l.available_units || 0), 0)}+
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">VIP Units</p>
            </div>
          </div>
          <Button size="lg" className="rounded-xl font-semibold shadow-md" onClick={() => document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" })}>
            Browse Inventory <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </section>

      {/* Filters — Desktop inline, Mobile drawer */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border py-3 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Desktop filters */}
          <div className="hidden md:flex flex-wrap items-center gap-2">
            {filterControls}
          </div>
          {/* Mobile: search + filter button */}
          <div className="flex md:hidden items-center gap-2">
            <Input
              placeholder="Search project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-card border-border h-10 text-sm"
              aria-label="Search projects"
            />
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 px-3 shrink-0 relative">
                  <SlidersHorizontal className="h-4 w-4 mr-1" /> Filters
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="w-full h-11" aria-label="Filter by city">
                      <SelectValue placeholder="City" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full h-11" aria-label="Filter by type">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhome">Townhome</SelectItem>
                      <SelectItem value="duplex">Duplex</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Min $"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))}
                      className="h-11"
                      inputMode="numeric"
                    />
                    <Input
                      placeholder="Max $"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))}
                      className="h-11"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    {hasFilters && (
                      <Button variant="outline" className="flex-1 h-11" onClick={() => { clearFilters(); setMobileFiltersOpen(false); }}>
                        Clear All
                      </Button>
                    )}
                    <Button className="flex-1 h-11" onClick={() => setMobileFiltersOpen(false)}>
                      Show {filtered.length} Result{filtered.length !== 1 ? "s" : ""}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <section id="listings" className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Available Projects</h2>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} exclusive {filtered.length === 1 ? "listing" : "listings"} available</p>
          </div>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" onClick={fetchListings}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Lock className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <h3 className="text-xl font-semibold">
              {listings.length === 0 ? "Coming soon!" : "No listings found"}
            </h3>
            <p className="text-muted-foreground">
              {listings.length === 0
                ? "We're working with developers to bring you exclusive inventory. Check back soon."
                : hasFilters
                  ? "Try adjusting your filters"
                  : "Check back soon for exclusive inventory"}
            </p>
            {hasFilters && <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((listing) => (
              <OffMarketCard
                key={listing.id}
                listing={listing}
                projectData={projectDataMap[listing.linked_project_slug]}
                minPrice={minPriceMap[listing.id]}
                hasAccess={!!accessMap[listing.id]}
                onUnlock={() => setUnlockListing(listing)}
                onViewDetails={() => navigate(`/off-market/${listing.linked_project_slug}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Mobile Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-md border-t border-border p-3 flex gap-2 safe-area-bottom">
        <Button className="flex-1 h-11" asChild onClick={() => trackOffMarketEvent("whatsapp_click")}>
          <a href="https://wa.me/16722581100?text=Hi! I'm interested in off-market inventory" target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
          </a>
        </Button>
        <Button variant="outline" className="flex-1 h-11" asChild onClick={() => trackOffMarketEvent("call_click")}>
          <a href="tel:6722581100">
            <Phone className="h-4 w-4 mr-1" /> Call
          </a>
        </Button>
      </div>

      {/* Bottom CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-16 md:pb-16 pb-28">
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Want personalized recommendations?</h2>
          <p className="text-muted-foreground">
            Our team can match you with the best off-market deals based on your criteria.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button
              asChild
              onClick={() => trackOffMarketEvent("whatsapp_click")}
            >
              <a href="https://wa.me/16722581100?text=Hi! I'm interested in off-market inventory" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp Us
              </a>
            </Button>
            <Button variant="outline" asChild onClick={() => trackOffMarketEvent("call_click")}>
              <a href="tel:6722581100">
                <Phone className="h-4 w-4 mr-1" /> Call (672) 258-1100
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />

      {/* Unlock Modal */}
      {unlockListing && (
        <UnlockModal
          open={!!unlockListing}
          onOpenChange={(open) => { if (!open) setUnlockListing(null); }}
          listingId={unlockListing.id}
          projectName={unlockListing.linked_project_name}
          autoApprove={unlockListing.auto_approve_access}
          onApproved={() => {
            setUnlockListing(null);
            navigate(`/off-market/${unlockListing.linked_project_slug}`);
          }}
        />
      )}
    </>
  );
}
