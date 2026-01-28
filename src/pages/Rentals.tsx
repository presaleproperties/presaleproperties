import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { 
  Search, SlidersHorizontal, Map, Grid3X3, Home, Building,
  Bed, ChevronDown, X
} from "lucide-react";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  SheetFooter,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { RentalListingCard, RentalListing } from "@/components/rentals/RentalListingCard";
import { supabase } from "@/integrations/supabase/client";
import { useEnabledCities } from "@/hooks/useEnabledCities";

const PROPERTY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "Apartment/Condo", label: "Condo" },
  { value: "Townhouse", label: "Townhouse" },
  { value: "Single Family", label: "House" },
];

const BED_OPTIONS = [
  { value: "any", label: "Any Beds" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1 Bed" },
  { value: "2", label: "2 Beds" },
  { value: "3", label: "3 Beds" },
  { value: "4", label: "4+ Beds" },
];

const PRICE_OPTIONS = [
  { value: "any", label: "Any Price" },
  { value: "0-1500", label: "Under $1,500" },
  { value: "1500-2000", label: "$1,500 - $2,000" },
  { value: "2000-2500", label: "$2,000 - $2,500" },
  { value: "2500-3000", label: "$2,500 - $3,000" },
  { value: "3000-4000", label: "$3,000 - $4,000" },
  { value: "4000-99999", label: "$4,000+" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price (Low to High)" },
  { value: "price_desc", label: "Price (High to Low)" },
];

export default function Rentals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [city, setCity] = useState("all");
  const [propertyType, setPropertyType] = useState("all");
  const [beds, setBeds] = useState("any");
  const [priceRange, setPriceRange] = useState("any");
  const [sort, setSort] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: enabledCities } = useEnabledCities();

  // Fetch rental listings
  const { data: rentals, isLoading } = useQuery({
    queryKey: ["rental-listings", city, propertyType, beds, priceRange, sort],
    queryFn: async () => {
      let query = supabase
        .from("mls_listings")
        .select("*")
        .eq("is_rental", true)
        .in("mls_status", ["Active", "Pending"])
        .not("lease_amount", "is", null)
        .gt("lease_amount", 0);

      // City filter
      if (city !== "all") {
        query = query.eq("city", city);
      } else if (enabledCities && enabledCities.length > 0) {
        query = query.in("city", enabledCities);
      }

      // Property type filter
      if (propertyType !== "all") {
        query = query.eq("property_sub_type", propertyType);
      }

      // Beds filter
      if (beds !== "any") {
        const bedNum = parseInt(beds);
        if (bedNum === 4) {
          query = query.gte("bedrooms_total", 4);
        } else {
          query = query.eq("bedrooms_total", bedNum);
        }
      }

      // Price range filter
      if (priceRange !== "any") {
        const [min, max] = priceRange.split("-").map(Number);
        query = query.gte("lease_amount", min);
        if (max < 99999) {
          query = query.lte("lease_amount", max);
        }
      }

      // Sorting
      if (sort === "price_asc") {
        query = query.order("lease_amount", { ascending: true });
      } else if (sort === "price_desc") {
        query = query.order("lease_amount", { ascending: false });
      } else {
        query = query.order("list_date", { ascending: false });
      }

      query = query.limit(100);

      const { data, error } = await query;
      if (error) throw error;
      return data as RentalListing[];
    },
    enabled: true,
  });

  // Filter by search query
  const filteredRentals = useMemo(() => {
    if (!rentals) return [];
    if (!searchQuery.trim()) return rentals;
    
    const q = searchQuery.toLowerCase();
    return rentals.filter(r => 
      r.city?.toLowerCase().includes(q) ||
      r.neighborhood?.toLowerCase().includes(q) ||
      r.street_name?.toLowerCase().includes(q) ||
      r.listing_key?.toLowerCase().includes(q)
    );
  }, [rentals, searchQuery]);

  // Get unique cities from rentals for filter
  const availableCities = useMemo(() => {
    if (!enabledCities) return [];
    return enabledCities;
  }, [enabledCities]);

  const activeFiltersCount = [
    city !== "all",
    propertyType !== "all",
    beds !== "any",
    priceRange !== "any",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setCity("all");
    setPropertyType("all");
    setBeds("any");
    setPriceRange("any");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Rentals in Greater Vancouver | PresaleProperties</title>
        <meta name="description" content="Find apartments, condos, and homes for rent in Greater Vancouver. Browse available rentals with photos, pricing, and amenities." />
      </Helmet>

      <ConversionHeader />

      <div className="container py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-2">
            <Home className="h-4 w-4" />
            <span>Rental Listings</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Rentals in Greater Vancouver
          </h1>
          <p className="text-muted-foreground">
            {isLoading ? "Loading..." : `${filteredRentals.length} rentals available`}
          </p>
        </div>

        {/* Search & Filters Bar */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by city, neighborhood, or MLS#..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Desktop Filters */}
          <div className="hidden lg:flex items-center gap-2">
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {availableCities.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={beds} onValueChange={setBeds}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Beds" />
              </SelectTrigger>
              <SelectContent>
                {BED_OPTIONS.map(b => (
                  <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_OPTIONS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>

          {/* Mobile Filters Button */}
          <div className="flex lg:hidden gap-2">
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex-1 gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">City</label>
                    <Select value={city} onValueChange={setCity}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Cities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cities</SelectItem>
                        {availableCities.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Property Type</label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Bedrooms</label>
                    <Select value={beds} onValueChange={setBeds}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BED_OPTIONS.map(b => (
                          <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Price Range</label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRICE_OPTIONS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort By</label>
                    <Select value={sort} onValueChange={setSort}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SheetFooter>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All
                  </Button>
                  <Button onClick={() => setFiltersOpen(false)}>
                    Show Results
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Link to="/map-search?mode=rental">
              <Button variant="outline" className="gap-2">
                <Map className="h-4 w-4" />
                Map
              </Button>
            </Link>
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
            ))}
          </div>
        ) : filteredRentals.length === 0 ? (
          <div className="text-center py-16">
            <Home className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Rentals Found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters or search criteria.
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRentals.map(rental => (
              <RentalListingCard key={rental.id} listing={rental} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
