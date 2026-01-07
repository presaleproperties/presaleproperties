import { useState, useMemo, useCallback, lazy, Suspense, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Search, SlidersHorizontal, X, Map, LayoutGrid, 
  MapPin, Building2, ArrowLeft, ChevronDown, ChevronUp
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showList, setShowList] = useState(true);
  const [showCarousel, setShowCarousel] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [visibleProjectIds, setVisibleProjectIds] = useState<string[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);
  const desktopListRef = useRef<HTMLDivElement>(null);

  const handleProjectSelect = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    // Show carousel if hidden (mobile/tablet)
    setShowCarousel(true);
    
    // Small delay to ensure elements are rendered before scrolling
    setTimeout(() => {
      // Scroll carousel (mobile/tablet)
      if (carouselRef.current) {
        const cardElement = carouselRef.current.querySelector(`[data-project-id="${projectId}"]`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
      // Scroll desktop list
      if (desktopListRef.current) {
        const cardElement = desktopListRef.current.querySelector(`[data-project-id="${projectId}"]`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  }, []);

  const handleVisibleProjectsChange = useCallback((projectIds: string[]) => {
    setVisibleProjectIds(projectIds);
  }, []);

  const filters = {
    city: searchParams.get("city") || "any",
    projectType: searchParams.get("type") || "any",
    priceRange: searchParams.get("price") || "any",
  };

  const { data: allProjects, isLoading } = useQuery({
    queryKey: ["map-search-projects", filters],
    queryFn: async () => {
      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image, gallery_images, map_lat, map_lng")
        .eq("is_published", true)
        .not("status", "eq", "sold_out");

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

  const mapProjects = filteredProjects;

  // Projects visible in current map viewport (synced with carousel/list)
  const visibleProjects = useMemo(() => {
    if (visibleProjectIds.length === 0) return filteredProjects;
    return filteredProjects.filter(p => visibleProjectIds.includes(p.id));
  }, [filteredProjects, visibleProjectIds]);

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

  const formatPrice = (price: number | null) => {
    if (!price) return 'TBA';
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  return (
    <>
      <Helmet>
        <title>Map Search | Find Presale Projects Near You | PresaleProperties</title>
        <meta name="description" content="Search presale condos and townhomes on an interactive map. Find new construction projects near you in Metro Vancouver." />
        <link rel="canonical" href="https://presaleproperties.com/map-search" />
      </Helmet>

      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <ConversionHeader />

        {/* Search & Filter Bar */}
        <div className="border-b border-border bg-background z-40 shrink-0">
          <div className="px-4 lg:px-6 py-3">
            <div className="flex items-center gap-2 md:gap-4">
              {/* List View Button - Icon only on mobile/tablet */}
              <Link to="/presale-projects" className="lg:hidden">
                <button className="p-2 rounded-md bg-background border border-border/50 hover:bg-muted transition-colors" aria-label="View all projects">
                  <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                </button>
              </Link>
              <Link to="/presale-projects" className="hidden lg:block">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
              </Link>

              {/* Desktop Presale/Resale Toggle */}
              <div className="hidden lg:flex bg-muted/50 rounded-md text-sm border border-border/30">
                <span className="px-3 py-1.5 bg-foreground text-background rounded-l-md font-medium">Presale</span>
                <Link to="/resale-map" className="px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-r-md">
                  Resale
                </Link>
              </div>

              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>

              {/* Mobile Filters */}
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
                        <SelectTrigger><SelectValue placeholder="All Cities" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">All Cities</SelectItem>
                          {CITIES.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Type</label>
                      <Select value={filters.projectType} onValueChange={(v) => updateFilter("type", v)}>
                        <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent>
                          {TYPE_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Price</label>
                      <Select value={filters.priceRange} onValueChange={(v) => updateFilter("price", v)}>
                        <SelectTrigger><SelectValue placeholder="Any Price" /></SelectTrigger>
                        <SelectContent>
                          {PRICE_RANGES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" onClick={clearAllFilters} className="w-full">
                        <X className="h-4 w-4 mr-2" /> Clear All
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Filters */}
              <div className="hidden lg:flex items-center gap-2">
                <Select value={filters.city} onValueChange={(v) => updateFilter("city", v)}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="All Cities" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">All Cities</SelectItem>
                    {CITIES.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={filters.projectType} onValueChange={(v) => updateFilter("type", v)}>
                  <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={filters.priceRange} onValueChange={(v) => updateFilter("price", v)}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Any Price" /></SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Toggle List Button */}
              <Button
                variant={showList ? "outline" : "default"}
                size="sm"
                className="hidden lg:flex gap-2"
                onClick={() => setShowList(!showList)}
              >
                {showList ? <Map className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                {showList ? "Expand Map" : "Show List"}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - isolate creates stacking context to contain map z-indexes */}
        <div className="flex-1 flex overflow-hidden relative isolate">
          {/* Map Section */}
          <div className={`relative transition-all duration-300 h-full w-full ${showList ? "lg:w-3/5" : "lg:w-full"}`}>
            {/* Presale/Resale Toggle - Thin minimal style matching zoom buttons */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] lg:hidden">
              <div className="flex bg-background/80 backdrop-blur-sm rounded-md shadow-sm border border-border/30 text-[11px]">
                <Link to="/map-search">
                  <button className="px-2.5 py-1 font-medium bg-foreground text-background rounded-l-md">
                    Presale
                  </button>
                </Link>
                <Link to="/resale-map">
                  <button className="px-2.5 py-1 font-medium text-muted-foreground hover:text-foreground transition-colors rounded-r-md">
                    Resale
                  </button>
                </Link>
              </div>
            </div>

            <div className="absolute inset-0">
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
                    <ProjectsMap 
                      projects={mapProjects as any} 
                      isLoading={false} 
                      onProjectSelect={handleProjectSelect}
                      onVisibleProjectsChange={handleVisibleProjectsChange}
                    />
                  )}
                </Suspense>
              </SafeMapWrapper>
            </div>

            {/* Toggle button when carousel is hidden - right side, minimal */}
            {!showCarousel && visibleProjects.length > 0 && (
              <div className="absolute bottom-4 right-4 z-[1100] safe-bottom lg:hidden">
                <button
                  onClick={() => setShowCarousel(true)}
                  className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm shadow-sm border border-border/30 hover:bg-background transition-colors"
                  aria-label="Show projects"
                >
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Bottom Carousel - Shows on mobile and tablet only, hovers over map */}
            {showCarousel && visibleProjects.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 z-[1100] lg:hidden">
                  {/* Carousel with count and minimal toggle on right */}
                  <div className="bg-background/95 backdrop-blur-sm border-t border-border/30 pt-2 pb-2 safe-bottom">
                    <div className="flex items-center justify-between px-4 md:px-6 pb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {visibleProjects.length} project{visibleProjects.length !== 1 ? "s" : ""} in view
                      </span>
                      <button
                        onClick={() => setShowCarousel(false)}
                        className="p-1 rounded-full hover:bg-muted/50 transition-colors"
                        aria-label="Hide projects"
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div 
                      ref={carouselRef}
                      className="flex gap-3 md:gap-4 overflow-x-auto px-4 md:px-6 pb-2 snap-x snap-mandatory"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {visibleProjects.slice(0, 30).map((project) => (
                        <Link 
                          key={project.id} 
                          to={`/presale-projects/${project.slug}`}
                          data-project-id={project.id}
                          className="snap-start shrink-0 w-[200px] sm:w-[220px] md:w-[240px]"
                        >
                          <div className={`bg-card rounded-xl shadow-lg border-2 overflow-hidden transition-all hover:shadow-xl ${
                            selectedProjectId === project.id 
                              ? 'border-primary ring-2 ring-primary/20 animate-selection-pulse'
                              : 'border-border hover:border-primary/50'
                          }`}>
                            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-muted">
                              {project.featured_image ? (
                                <img src={project.featured_image} alt={project.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Building2 className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <Badge className="absolute top-2 left-2 text-[10px] px-2 py-0.5 bg-primary text-primary-foreground">
                                {project.status === 'active' ? 'Selling Now' : project.status === 'registering' ? 'Registering' : 'Coming Soon'}
                              </Badge>
                            </div>
                            <div className="p-2.5 sm:p-3">
                              <h4 className="font-semibold text-foreground text-sm truncate">{project.name}</h4>
                              <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="text-xs truncate">{project.city}</span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-foreground text-sm">{formatPrice(project.starting_price)}</span>
                                {project.completion_year && (
                                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{project.completion_year}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
              </div>
            )}
          </div>

          {/* Desktop List Panel - Shows projects visible in map viewport */}
          <div className={`hidden lg:flex flex-col border-l border-border bg-background transition-all duration-300 ease-out ${
            showList ? "lg:w-2/5 opacity-100" : "lg:w-0 opacity-0 overflow-hidden"
          }`}>
              <div className="shrink-0 px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">
                    {visibleProjects.length} Project{visibleProjects.length !== 1 ? "s" : ""} in view
                  </h3>
                  <Link to="/presale-projects">
                    <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">View All →</Button>
                  </Link>
                </div>
              </div>
              
              <div ref={desktopListRef} className="flex-1 overflow-y-auto p-4">
                {visibleProjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-10 w-10 mx-auto mb-2" />
                    <p>No projects in current view</p>
                    <p className="text-xs mt-1">Zoom out to see more</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {visibleProjects.slice(0, 30).map((project) => (
                      <Link key={project.id} to={`/presale-projects/${project.slug}`} className="block" data-project-id={project.id}>
                        <div className={`bg-card rounded-lg border overflow-hidden transition-all hover:shadow-md hover:border-primary/50 ${
                          selectedProjectId === project.id ? 'ring-2 ring-primary border-primary animate-selection-pulse' : 'border-border'
                        }`}>
                          <div className="relative w-full aspect-[4/3] bg-muted">
                            {project.featured_image ? (
                              <img src={project.featured_image} alt={project.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <Badge className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground">
                              {project.status === 'active' ? 'Selling' : project.status === 'registering' ? 'Reg' : 'Soon'}
                            </Badge>
                          </div>
                          <div className="p-2.5">
                            <h4 className="font-semibold text-sm text-foreground truncate">{project.name}</h4>
                            <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="text-xs truncate">{project.city}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="font-bold text-sm text-foreground">{formatPrice(project.starting_price)}</span>
                              {project.completion_year && (
                                <span className="text-[10px] text-muted-foreground">{project.completion_year}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </>
  );
}
