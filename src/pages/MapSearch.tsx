import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  List, 
  Map as MapIcon, 
  Building2,
  Loader2,
  ChevronDown
} from "lucide-react";
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
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { MapProjectCard } from "@/components/map/MapProjectCard";
import { supabase } from "@/integrations/supabase/client";

// Lazy load map component
import { lazy, Suspense } from "react";
const MapSearchView = lazy(() => import("@/components/map/MapSearchView").then(m => ({ default: m.MapSearchView })));

const CITIES = [
  "Vancouver", "Burnaby", "Richmond", "Surrey", "Coquitlam", 
  "Port Coquitlam", "Port Moody", "North Vancouver", "West Vancouver",
  "Langley", "Delta", "Abbotsford", "New Westminster", "White Rock"
];

const TYPE_OPTIONS = [
  { value: "any", label: "All Types" },
  { value: "condo", label: "Condos" },
  { value: "townhome", label: "Townhomes" },
  { value: "mixed", label: "Mixed" },
];

const PRICE_RANGES = [
  { value: "any", label: "Any Price" },
  { value: "0-500000", label: "Under $500K" },
  { value: "500000-750000", label: "$500K - $750K" },
  { value: "750000-1000000", label: "$750K - $1M" },
  { value: "1000000-1500000", label: "$1M - $1.5M" },
  { value: "1500000-999999999", label: "$1.5M+" },
];

const STATUS_OPTIONS = [
  { value: "any", label: "All Status" },
  { value: "active", label: "Selling Now" },
  { value: "registering", label: "Registering" },
  { value: "coming_soon", label: "Coming Soon" },
];

type Project = {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  project_type: "condo" | "townhome" | "mixed";
  starting_price: number | null;
  featured_image: string | null;
  map_lat: number | null;
  map_lng: number | null;
};

export default function MapSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  // Get filter values from URL params
  const filters = {
    city: searchParams.get("city") || "any",
    projectType: searchParams.get("type") || "any",
    priceRange: searchParams.get("price") || "any",
    status: searchParams.get("status") || "any",
  };

  // Fetch all projects with coordinates
  const { data: allProjects, isLoading } = useQuery({
    queryKey: ["map-search-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, starting_price, featured_image, map_lat, map_lng")
        .eq("is_published", true)
        .not("status", "eq", "sold_out");

      if (error) throw error;
      return data as Project[];
    },
  });

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (!allProjects) return [];
    
    let results = allProjects.filter(p => p.map_lat && p.map_lng);

    // Apply filters
    if (filters.city !== "any") {
      results = results.filter(p => p.city === filters.city);
    }
    if (filters.projectType !== "any") {
      results = results.filter(p => p.project_type === filters.projectType);
    }
    if (filters.priceRange !== "any") {
      const [min, max] = filters.priceRange.split("-").map(Number);
      results = results.filter(p => p.starting_price && p.starting_price >= min && p.starting_price <= max);
    }
    if (filters.status !== "any") {
      results = results.filter(p => p.status === filters.status);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      );
    }

    // Filter by map bounds if available
    if (mapBounds) {
      results = results.filter(p => 
        p.map_lat! >= mapBounds.south &&
        p.map_lat! <= mapBounds.north &&
        p.map_lng! >= mapBounds.west &&
        p.map_lng! <= mapBounds.east
      );
    }

    return results;
  }, [allProjects, filters, searchQuery, mapBounds]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "any" || value === "") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setSearchQuery("");
    setMapBounds(null);
  };

  const handleBoundsChange = useCallback((bounds: typeof mapBounds) => {
    setMapBounds(bounds);
  }, []);

  const activeFilterCount = [
    filters.city !== "any",
    filters.projectType !== "any",
    filters.priceRange !== "any",
    filters.status !== "any",
  ].filter(Boolean).length;

  const FilterControls = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">City</label>
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

      <div>
        <label className="text-sm font-medium mb-2 block">Project Type</label>
        <Select value={filters.projectType} onValueChange={(v) => updateFilter("type", v)}>
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Price Range</label>
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

      <div>
        <label className="text-sm font-medium mb-2 block">Status</label>
        <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
          <SelectTrigger>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="ghost" onClick={clearAllFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear Filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Map Search | Find Presale Projects by Location | PresaleProperties</title>
        <meta name="description" content="Search presale condos and townhomes on an interactive map. Find new construction projects by location in Vancouver, Surrey, Langley, Burnaby, and across Metro Vancouver." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <ConversionHeader />

      <main className="min-h-screen bg-background">
        {/* Search Bar */}
        <div className="border-b bg-card sticky top-0 z-50">
          <div className="container px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects, neighborhoods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>

              {/* Desktop Filters */}
              <div className="hidden lg:flex items-center gap-2">
                <Select value={filters.city} onValueChange={(v) => updateFilter("city", v)}>
                  <SelectTrigger className="w-[140px] h-10">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">All Cities</SelectItem>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.projectType} onValueChange={(v) => updateFilter("type", v)}>
                  <SelectTrigger className="w-[120px] h-10">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.priceRange} onValueChange={(v) => updateFilter("price", v)}>
                  <SelectTrigger className="w-[140px] h-10">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Mobile Filter Button */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden relative h-10 px-3">
                    <SlidersHorizontal className="h-4 w-4" />
                    {activeFilterCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterControls />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Main Content - Split Layout */}
        <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)]">
          {/* Map Section */}
          <div className="flex-1 min-h-[50vh] lg:min-h-0 relative">
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-muted">
                <div className="text-center text-muted-foreground">
                  <Loader2 className="h-10 w-10 mx-auto mb-2 animate-spin" />
                  <p>Loading map...</p>
                </div>
              </div>
            ) : (
              <Suspense fallback={
                <div className="h-full flex items-center justify-center bg-muted">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              }>
                <MapSearchView 
                  projects={filteredProjects} 
                  hoveredProjectId={hoveredProjectId}
                  onHoverProject={setHoveredProjectId}
                  onBoundsChange={handleBoundsChange}
                />
              </Suspense>
            )}

            {/* Results count on map */}
            <div className="absolute top-3 left-3 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 border shadow-md">
              <p className="text-sm font-medium">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Project List Sidebar */}
          <div className="w-full lg:w-[400px] xl:w-[450px] border-t lg:border-t-0 lg:border-l bg-background overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Results</h2>
                <span className="text-sm text-muted-foreground">
                  {filteredProjects.length} found
                </span>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No projects found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                  {activeFilterCount > 0 && (
                    <Button variant="outline" size="sm" onClick={clearAllFilters} className="mt-4">
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProjects.map((project) => (
                    <MapProjectCard
                      key={project.id}
                      id={project.id}
                      name={project.name}
                      slug={project.slug}
                      city={project.city}
                      neighborhood={project.neighborhood}
                      status={project.status}
                      project_type={project.project_type}
                      starting_price={project.starting_price}
                      featured_image={project.featured_image}
                      isHighlighted={hoveredProjectId === project.id}
                      onHover={setHoveredProjectId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
