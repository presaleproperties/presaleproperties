import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, MapPin, Calendar, Building2, Star, ArrowRight } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

const ITEMS_PER_PAGE = 12;

const CITIES = ["Vancouver", "Burnaby", "Richmond", "Surrey", "Coquitlam", "North Vancouver", "West Vancouver"];
const STATUS_OPTIONS = [
  { value: "any", label: "All Status" },
  { value: "coming_soon", label: "Coming Soon" },
  { value: "active", label: "Selling Now" },
  { value: "sold_out", label: "Sold Out" },
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
  { value: "1500000-2000000", label: "$1.5M - $2M" },
  { value: "2000000-999999999", label: "$2M+" },
];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "completion", label: "Completion Date" },
];

type Project = {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  status: "coming_soon" | "active" | "sold_out";
  project_type: "condo" | "townhome" | "mixed";
  completion_year: number | null;
  starting_price: number | null;
  short_description: string | null;
  featured_image: string | null;
  is_featured: boolean;
};

export default function PresaleProjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Get filter values from URL params
  const filters = {
    city: searchParams.get("city") || "any",
    status: searchParams.get("status") || "any",
    projectType: searchParams.get("type") || "any",
    priceRange: searchParams.get("price") || "any",
    sort: searchParams.get("sort") || "newest",
  };

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading } = useQuery({
    queryKey: ["presale-projects", filters, currentPage],
    queryFn: async () => {
      // First, get total count
      let countQuery = supabase
        .from("presale_projects")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true);

      // Apply filters to count query
      if (filters.city !== "any") {
        countQuery = countQuery.eq("city", filters.city);
      }
      if (filters.status !== "any") {
        countQuery = countQuery.eq("status", filters.status as "coming_soon" | "active" | "sold_out");
      }
      if (filters.projectType !== "any") {
        countQuery = countQuery.eq("project_type", filters.projectType as "condo" | "townhome" | "mixed");
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        countQuery = countQuery.gte("starting_price", min).lte("starting_price", max);
      }

      const { count } = await countQuery;

      // Then get paginated data
      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, short_description, featured_image, is_featured")
        .eq("is_published", true);

      // Apply filters
      if (filters.city !== "any") {
        query = query.eq("city", filters.city);
      }
      if (filters.status !== "any") {
        query = query.eq("status", filters.status as "coming_soon" | "active" | "sold_out");
      }
      if (filters.projectType !== "any") {
        query = query.eq("project_type", filters.projectType as "condo" | "townhome" | "mixed");
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        query = query.gte("starting_price", min).lte("starting_price", max);
      }

      // Apply sorting
      switch (filters.sort) {
        case "price-asc":
          query = query.order("starting_price", { ascending: true, nullsFirst: false });
          break;
        case "price-desc":
          query = query.order("starting_price", { ascending: false, nullsFirst: false });
          break;
        case "completion":
          query = query.order("completion_year", { ascending: true }).order("completion_month", { ascending: true });
          break;
        default:
          query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: projectsData, error } = await query;
      if (error) throw error;

      return { projects: projectsData as Project[], totalCount: count || 0 };
    },
  });

  const projects = data?.projects || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Filter by search query client-side
  const filteredProjects = useMemo(() => {
    if (!projects || !searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

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
    filters.status !== "any",
    filters.projectType !== "any",
    filters.priceRange !== "any",
  ].filter(Boolean).length;

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "coming_soon":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Coming Soon</Badge>;
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Selling Now</Badge>;
      case "sold_out":
        return <Badge variant="secondary">Sold Out</Badge>;
      default:
        return null;
    }
  };

  const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1) + "s";
  };

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

      {/* Status */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
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

      {/* Project Type */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Project Type</label>
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

      {/* Price Range */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Starting Price</label>
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

  const LoadingSkeleton = () => (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-border">
          <Skeleton className="aspect-[16/10] w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Presale Projects | PresaleProperties.com</title>
        <meta name="description" content="Discover new presale projects in Greater Vancouver. Browse condos, townhomes, and mixed developments with VIP pricing and floor plans." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Section - Clean & Minimal */}
        <section className="bg-background border-b border-border py-8 md:py-12">
          <div className="container px-4">
            <div className="max-w-3xl">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
                New & Pre Construction Homes
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                Whether you're looking for a new condo, townhome, or development, we're here to guide you. 
                Search presale projects in Greater Vancouver. View details, floor plans, and pricing.
              </p>
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">{totalCount}</span>
                {" "}projects available.{" "}
                {activeFilterCount > 0 && (
                  <button 
                    onClick={clearAllFilters}
                    className="text-primary hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </p>
            </div>
          </div>
        </section>

        <main className="container px-4 py-4 md:py-8">

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
              {filters.status !== "any" && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {STATUS_OPTIONS.find((s) => s.value === filters.status)?.label}
                  <button onClick={() => updateFilter("status", "any")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.projectType !== "any" && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {TYPE_OPTIONS.find((t) => t.value === filters.projectType)?.label}
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
                <h3 className="font-semibold mb-4">Filter Projects</h3>
                <FilterControls />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <LoadingSkeleton />
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-16 md:py-20">
                  <Building2 className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">No projects found</h2>
                  <p className="text-sm md:text-base text-muted-foreground mb-6">
                    Try adjusting your search or filters
                  </p>
                  <Button onClick={clearAllFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
                    Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
                  </p>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {filteredProjects.map((project) => (
                      <Link key={project.id} to={`/presale-projects/${project.slug}`}>
                        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                          <div className="relative aspect-[16/10] overflow-hidden">
                            {project.featured_image ? (
                              <img
                                src={project.featured_image}
                                alt={project.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Building2 className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <CardContent className="p-3 md:p-4">
                            <div className="flex items-start justify-between gap-2 mb-1.5 md:mb-2">
                              <h3 className="font-semibold text-base md:text-lg line-clamp-1 group-hover:text-primary transition-colors">
                                {project.name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground mb-1.5 md:mb-2">
                              <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                              <span className="truncate">{project.city}, {project.neighborhood}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs md:text-sm mb-2 md:mb-3">
                              <span className="text-muted-foreground">{formatType(project.project_type)}</span>
                              {project.completion_year && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {project.completion_year}
                                </span>
                              )}
                            </div>
                            {project.short_description && (
                              <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-2 md:mb-3 hidden sm:block">
                                {project.short_description}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              {project.starting_price ? (
                                <span className="text-base md:text-lg font-bold text-primary">
                                  From {formatPrice(project.starting_price)}
                                </span>
                              ) : (
                                <span className="text-xs md:text-sm text-muted-foreground">Contact for pricing</span>
                              )}
                              <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>

                  <PaginationControls />
                </>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
