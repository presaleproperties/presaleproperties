import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/listings/ListingCard";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

const ITEMS_PER_PAGE = 12;

const CITIES = ["Vancouver", "Burnaby", "Richmond", "Surrey", "Coquitlam", "North Vancouver", "West Vancouver"];
const BEDS_OPTIONS = [
  { value: "any", label: "Any Beds" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1 Bed" },
  { value: "2", label: "2 Beds" },
  { value: "3", label: "3+ Beds" },
];
const PROPERTY_TYPES = [
  { value: "any", label: "All Types" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "other", label: "Other" },
];
const PRICE_RANGES = [
  { value: "any", label: "Any Price" },
  { value: "0-500000", label: "Under $500K" },
  { value: "500000-750000", label: "$500K - $750K" },
  { value: "750000-1000000", label: "$750K - $1M" },
  { value: "1000000-1500000", label: "$1M - $1.5M" },
  { value: "1500000-2000000", label: "$1.5M - $2M" },
  { value: "2000000-999999999", label: "$2M+" },
];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "completion", label: "Completion Date" },
];

export default function Assignments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Get filter values from URL params
  const filters = {
    city: searchParams.get("city") || "any",
    beds: searchParams.get("beds") || "any",
    propertyType: searchParams.get("type") || "any",
    priceRange: searchParams.get("price") || "any",
    sort: searchParams.get("sort") || "newest",
  };

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading } = useQuery({
    queryKey: ["assignments", filters, currentPage],
    queryFn: async () => {
      // First, get total count
      let countQuery = supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      // Apply filters to count query
      if (filters.city !== "any") {
        countQuery = countQuery.eq("city", filters.city);
      }
      if (filters.beds !== "any") {
        if (filters.beds === "3") {
          countQuery = countQuery.gte("beds", 3);
        } else {
          countQuery = countQuery.eq("beds", parseInt(filters.beds));
        }
      }
      if (filters.propertyType !== "any") {
        countQuery = countQuery.eq("property_type", filters.propertyType as "condo" | "townhouse" | "other");
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        countQuery = countQuery.gte("assignment_price", min).lte("assignment_price", max);
      }

      const { count } = await countQuery;

      // Then get paginated data
      let query = supabase
        .from("listings")
        .select(`
          *,
          listing_photos (url, sort_order)
        `)
        .eq("status", "published");

      // Apply filters
      if (filters.city !== "any") {
        query = query.eq("city", filters.city);
      }

      if (filters.beds !== "any") {
        if (filters.beds === "3") {
          query = query.gte("beds", 3);
        } else {
          query = query.eq("beds", parseInt(filters.beds));
        }
      }

      if (filters.propertyType !== "any") {
        query = query.eq("property_type", filters.propertyType as "condo" | "townhouse" | "other");
      }

      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        query = query.gte("assignment_price", min).lte("assignment_price", max);
      }

      // Apply sorting
      switch (filters.sort) {
        case "price-asc":
          query = query.order("assignment_price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("assignment_price", { ascending: false });
          break;
        case "completion":
          query = query.order("completion_year", { ascending: true }).order("completion_month", { ascending: true });
          break;
        default:
          query = query.order("published_at", { ascending: false });
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: listingsData, error } = await query;
      if (error) throw error;
      
      // Fetch agent profiles for all listings
      const agentIds = [...new Set(listingsData?.map(l => l.agent_id) || [])];
      
      const [profilesResult, agentProfilesResult] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", agentIds),
        supabase.from("agent_profiles").select("user_id, brokerage_name").in("user_id", agentIds)
      ]);
      
      const profilesMap = new Map(profilesResult.data?.map(p => [p.user_id, p]) || []);
      const agentProfilesMap = new Map(agentProfilesResult.data?.map(a => [a.user_id, a]) || []);
      
      const enrichedListings = listingsData?.map(listing => ({
        ...listing,
        agentProfile: profilesMap.get(listing.agent_id),
        agentInfo: agentProfilesMap.get(listing.agent_id),
      }));
      
      return { listings: enrichedListings, totalCount: count || 0 };
    },
  });

  const listings = data?.listings;
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Filter by search query client-side
  const filteredListings = useMemo(() => {
    if (!listings || !searchQuery.trim()) return listings;
    const q = searchQuery.toLowerCase();
    return listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.project_name.toLowerCase().includes(q) ||
        (l.neighborhood && l.neighborhood.toLowerCase().includes(q)) ||
        (l.developer_name && l.developer_name.toLowerCase().includes(q))
    );
  }, [listings, searchQuery]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "any" || value === "") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    // Reset to page 1 when filters change
    newParams.delete("page");
    setSearchParams(newParams);
  };

  const goToPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete("page");
    } else {
      newParams.set("page", page.toString());
    }
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setSearchQuery("");
  };

  const activeFilterCount = [
    filters.city !== "any",
    filters.beds !== "any",
    filters.propertyType !== "any",
    filters.priceRange !== "any",
  ].filter(Boolean).length;

  const FilterControls = () => (
    <div className="space-y-4">
      {/* City */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">City</label>
        <Select value={filters.city} onValueChange={(v) => updateFilter("city", v)}>
          <SelectTrigger>
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">All Cities</SelectItem>
            {CITIES.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Beds */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Bedrooms</label>
        <Select value={filters.beds} onValueChange={(v) => updateFilter("beds", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any Beds" />
          </SelectTrigger>
          <SelectContent>
            {BEDS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Property Type */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Property Type</label>
        <Select value={filters.propertyType} onValueChange={(v) => updateFilter("type", v)}>
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Price Range</label>
        <Select value={filters.priceRange} onValueChange={(v) => updateFilter("price", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any Price" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_RANGES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="ghost" onClick={clearAllFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages: (number | "...")[] = [];
      
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        
        if (currentPage > 3) pages.push("...");
        
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        
        for (let i = start; i <= end; i++) pages.push(i);
        
        if (currentPage < totalPages - 2) pages.push("...");
        
        pages.push(totalPages);
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, i) => (
            page === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(page)}
                className="min-w-[36px]"
              >
                {page}
              </Button>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-4 md:py-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 md:mb-2">
            Assignment Listings
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Browse pre-construction condo assignments across Metro Vancouver
          </p>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by project, neighborhood..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex gap-2">
            {/* Mobile Filters */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden relative h-10 px-3">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <span className="text-sm">Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterControls />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
              <SelectTrigger className="w-[140px] sm:w-[180px] h-10 text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Pills */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
            {filters.city !== "any" && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {filters.city}
                <button onClick={() => updateFilter("city", "any")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.beds !== "any" && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {BEDS_OPTIONS.find((b) => b.value === filters.beds)?.label}
                <button onClick={() => updateFilter("beds", "any")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.propertyType !== "any" && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {PROPERTY_TYPES.find((p) => p.value === filters.propertyType)?.label}
                <button onClick={() => updateFilter("type", "any")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.priceRange !== "any" && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {PRICE_RANGES.find((p) => p.value === filters.priceRange)?.label}
                <button onClick={() => updateFilter("price", "any")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-6 lg:gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="sticky top-6 bg-card border border-border rounded-xl p-4">
              <h2 className="font-semibold text-foreground mb-4">Filters</h2>
              <FilterControls />
            </div>
          </aside>

          {/* Listings Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/3] rounded-lg" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredListings && filteredListings.length > 0 ? (
              <>
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} assignment{totalCount !== 1 ? "s" : ""}
                </p>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      id={listing.id}
                      title={listing.title}
                      projectName={listing.project_name}
                      address={listing.address || undefined}
                      city={listing.city}
                      neighborhood={listing.neighborhood || undefined}
                      propertyType={listing.property_type}
                      unitType={listing.unit_type}
                      beds={listing.beds}
                      baths={listing.baths}
                      interiorSqft={listing.interior_sqft || undefined}
                      assignmentPrice={Number(listing.assignment_price)}
                      completionYear={listing.completion_year || undefined}
                      completionMonth={listing.completion_month || undefined}
                      isFeatured={listing.is_featured || false}
                      imageUrl={listing.listing_photos?.[0]?.url}
                      photoCount={listing.listing_photos?.length || 0}
                      visibilityMode={(listing as any).visibility_mode || "public"}
                      agent={{
                        name: listing.agentProfile?.full_name || undefined,
                        avatarUrl: listing.agentProfile?.avatar_url || undefined,
                        brokerage: listing.agentInfo?.brokerage_name || undefined,
                      }}
                    />
                  ))}
                </div>
                <PaginationControls />
              </>
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-xl">
                <p className="text-lg font-medium text-foreground mb-2">
                  No assignments found
                </p>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search query
                </p>
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}