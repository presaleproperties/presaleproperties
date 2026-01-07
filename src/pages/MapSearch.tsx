import { useState, useMemo, useCallback, lazy, Suspense, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Search, SlidersHorizontal, X, Map, LayoutGrid, 
  ChevronDown, MapPin, Building2, ArrowLeft 
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

import { PresaleProjectCard } from "@/components/listings/PresaleProjectCard";
import { SafeMapWrapper } from "@/components/map/SafeMapWrapper";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy load the map component
const ProjectsMap = lazy(() => 
  import("@/components/projects/ProjectsMap").then(m => ({ default: m.ProjectsMap }))
);

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

type Project = {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  project_type: "condo" | "townhome" | "mixed";
  completion_year: number | null;
  starting_price: number | null;
  featured_image: string | null;
  gallery_images: string[] | null;
  map_lat: number | null;
  map_lng: number | null;
};

export default function MapSearch() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showList, setShowList] = useState(!isMobile);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Scroll to selected project in carousel
  const handleProjectSelect = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    
    if (isMobile && carouselRef.current) {
      const cardElement = carouselRef.current.querySelector(`[data-project-id="${projectId}"]`);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [isMobile]);

  const filters = {
    city: searchParams.get("city") || "any",
    projectType: searchParams.get("type") || "any",
    priceRange: searchParams.get("price") || "any",
  };

  // Fetch all published projects with coordinates
  const { data: allProjects, isLoading } = useQuery({
    queryKey: ["map-search-projects", filters],
    queryFn: async () => {
      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image, gallery_images, map_lat, map_lng")
        .eq("is_published", true)
        .not("status", "eq", "sold_out");

      // Apply filters
      if (filters.city !== "any") {
        query = query.eq("city", filters.city);
      }
      if (filters.projectType !== "any") {
        query = query.eq("project_type", filters.projectType as "condo" | "townhome" | "mixed");
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        query = query.gte("starting_price", min).lte("starting_price", max);
      }

      query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as Project[];
    },
  });

  // Filter by search query
  const filteredProjects = useMemo(() => {
    if (!allProjects) return [];
    if (!searchQuery.trim()) return allProjects;
    
    const q = searchQuery.toLowerCase();
    return allProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );
  }, [allProjects, searchQuery]);

  // Projects with valid coordinates (used for stats only)
  const projectsWithCoords = useMemo(() => {
    return filteredProjects.filter((p) => p.map_lat && p.map_lng);
  }, [filteredProjects]);

  // Projects to render on map (falls back to city centers when coordinates are missing)
  const mapProjects = filteredProjects;

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
  };

  const activeFilterCount = [
    filters.city !== "any",
    filters.projectType !== "any",
    filters.priceRange !== "any",
  ].filter(Boolean).length;

  const LoadingMap = () => (
    <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <Map className="h-12 w-12 mx-auto mb-2 animate-pulse" />
        <p>Loading map...</p>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Map Search | Find Presale Projects Near You | PresaleProperties</title>
        <meta name="description" content="Search presale condos and townhomes on an interactive map. Find new construction projects near you in Metro Vancouver." />
        <link rel="canonical" href="https://presaleproperties.com/map-search" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <ConversionHeader />

        {/* Search & Filter Bar */}
        <div className="border-b border-border bg-background sticky top-0 z-40">
          <div className="container px-4 py-3">
            <div className="flex items-center gap-2 md:gap-4">
              {/* Back Button */}
              <Link to="/presale-projects">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              </Link>

              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>

              {/* Filters Button (Mobile) */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden relative">
                    <SlidersHorizontal className="h-4 w-4" />
                    {activeFilterCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
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
                      <label className="text-sm font-medium mb-2 block">Type</label>
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
                      <label className="text-sm font-medium mb-2 block">Price</label>
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
                        Clear All
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Filters */}
              <div className="hidden lg:flex items-center gap-2">
                <Select value={filters.city} onValueChange={(v) => updateFilter("city", v)}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">All Cities</SelectItem>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.projectType} onValueChange={(v) => updateFilter("type", v)}>
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.priceRange} onValueChange={(v) => updateFilter("price", v)}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Any Price" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* List Toggle (Desktop) */}
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex gap-2"
                onClick={() => setShowList(!showList)}
              >
                {showList ? <Map className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                {showList ? "Hide List" : "Show List"}
              </Button>
            </div>

          </div>
        </div>

        {/* Main Content - Map & List */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Map Section - Full height on mobile */}
          <div className={`
            flex-1
            ${!isMobile && showList ? "lg:w-3/5" : "w-full"} 
            relative min-h-[300px]
          `}>
            <SafeMapWrapper height="h-full">
              <Suspense fallback={<LoadingMap />}>
                {isLoading ? (
                  <LoadingMap />
                ) : mapProjects.length === 0 ? (
                  <div className="h-full w-full bg-muted flex items-center justify-center">
                    <div className="text-center text-muted-foreground p-6">
                      <Building2 className="h-12 w-12 mx-auto mb-3" />
                      <h3 className="font-semibold text-foreground mb-2">No projects found</h3>
                      <p className="text-sm mb-4">Try adjusting your filters</p>
                      <Button onClick={clearAllFilters} size="sm">Clear Filters</Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full">
                    <ProjectsMap 
                      projects={mapProjects as any} 
                      isLoading={false} 
                      onProjectSelect={handleProjectSelect}
                    />
                  </div>
                )}
              </Suspense>
            </SafeMapWrapper>
          </div>

          {/* Desktop List Section - Only on lg+ */}
          {showList && (
            <div className="hidden lg:block lg:w-2/5 border-l border-border overflow-y-auto">
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-4">
                  {filteredProjects.length} Project{filteredProjects.length !== 1 ? "s" : ""}
                </h3>
                
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-10 w-10 mx-auto mb-2" />
                    <p>No projects match your filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredProjects.slice(0, 20).map((project) => (
                      <PresaleProjectCard
                        key={project.id}
                        id={project.id}
                        slug={project.slug}
                        name={project.name}
                        city={project.city}
                        neighborhood={project.neighborhood}
                        projectType={project.project_type}
                        status={project.status}
                        completionYear={project.completion_year}
                        startingPrice={project.starting_price}
                        featuredImage={project.featured_image}
                        galleryImages={project.gallery_images}
                        size="default"
                      />
                    ))}
                    {filteredProjects.length > 20 && (
                      <div className="text-center py-4">
                        <Link to="/presale-projects">
                          <Button variant="outline">
                            View All {filteredProjects.length} Projects
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile & Tablet Bottom Carousel */}
          {filteredProjects.length > 0 && (
            <div className="lg:hidden absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-4">
              <div 
                ref={carouselRef}
                className="flex gap-3 overflow-x-auto px-4 pb-2 pt-2 snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {filteredProjects.slice(0, 20).map((project) => (
                  <Link 
                    key={project.id} 
                    to={`/presale/${project.slug}`}
                    data-project-id={project.id}
                    className="snap-start flex-shrink-0 w-[280px]"
                  >
                    <div className={`bg-card rounded-xl shadow-lg border-2 overflow-hidden transition-all ${
                      selectedProjectId === project.id 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border'
                    }`}>
                      {/* Image */}
                      <div className="relative h-32 bg-muted">
                        {project.featured_image ? (
                          <img
                            src={project.featured_image}
                            alt={project.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {/* Status Badge */}
                        <div className="absolute top-2 left-2">
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-background/90 backdrop-blur-sm"
                          >
                            {project.status === 'coming_soon' ? 'Coming Soon' : 
                             project.status === 'registering' ? 'Registering' : 
                             project.status === 'active' ? 'Selling Now' : 'Sold Out'}
                          </Badge>
                        </div>
                      </div>
                      {/* Content */}
                      <div className="p-3">
                        <h4 className="font-semibold text-foreground text-sm truncate">
                          {project.name}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {project.neighborhood}, {project.city}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-semibold text-primary">
                            {project.starting_price 
                              ? `From $${(project.starting_price / 1000).toFixed(0)}K`
                              : 'TBA'}
                          </span>
                          {project.completion_year && (
                            <span className="text-xs text-muted-foreground">
                              {project.completion_year}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
