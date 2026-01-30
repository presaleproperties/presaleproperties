import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronLeft, ChevronRight, Building2, Map, Home, ChevronRight as ChevronRightIcon, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { FloatingBottomNav } from "@/components/mobile/FloatingBottomNav";
import { Footer } from "@/components/layout/Footer";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { PresaleProjectCard } from "@/components/listings/PresaleProjectCard";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { RelatedContent } from "@/components/home/RelatedContent";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { UnifiedSearchFilters } from "@/components/search/UnifiedSearchFilters";
import { buildMapUrlFromGridFilters } from "@/lib/filterSync";
import { supabase } from "@/integrations/supabase/client";

// SEO FAQs for presale projects page
const PRESALE_FAQS = [
  {
    question: "What is a presale condo in BC?",
    answer: "A presale condo in BC is a property you purchase before construction is complete—sometimes before it even begins. You sign a contract, pay deposits over time (typically 15-25%), and take possession when the building is finished. This gives you time to save, lock in today's pricing, and customize finishes."
  },
  {
    question: "How do I buy a presale condo in Vancouver?",
    answer: "To buy a presale condo in Vancouver: 1) Register for VIP access with developers or a realtor to get early pricing. 2) Review floor plans and the disclosure statement. 3) Sign the contract and pay your initial deposit (usually 5%). 4) You have 7 days to rescind under BC's REDMA protection. 5) Pay remaining deposits on schedule until completion."
  },
  {
    question: "What deposit is required for presale condos?",
    answer: "Most BC presale condos require 15-25% total deposit, paid in installments. A typical structure is 5% at signing, 5% in 90 days, 5% in 180 days, and 5-10% at 12 months. Some developers offer reduced deposit programs (as low as 10% total) to attract first-time buyers."
  },
  {
    question: "Are presale condos a good investment in 2026?",
    answer: "Presale condos can be excellent investments in 2026 for several reasons: You lock in today's price while the market appreciates during construction (2-4 years). Your deposit grows with the property's value. New builds have lower maintenance costs and modern amenities. Many investors have seen 20-40% equity gains by completion."
  },
  {
    question: "What is the 7-day rescission period in BC?",
    answer: "Under BC's Real Estate Development Marketing Act (REDMA), you have 7 calendar days to cancel a presale contract after signing—no questions asked. Your deposit is fully refunded. This protection gives you time to review the disclosure statement with a lawyer and secure financing approval."
  },
  {
    question: "Can I sell my presale condo before completion?",
    answer: "This is called an 'assignment sale.' Some developers allow assignments (often with a fee of 1-2%), while others restrict them. Always check the assignment clause in your contract. If allowed, you can sell your contract to another buyer before completion, potentially capturing equity gains."
  }
];

// City SEO links for internal linking
const CITY_SEO_LINKS = [
  { city: "Vancouver", slug: "vancouver-presale-condos" },
  { city: "Surrey", slug: "surrey-presale-condos" },
  { city: "Burnaby", slug: "burnaby-presale-condos" },
  { city: "Coquitlam", slug: "coquitlam-presale-condos" },
  { city: "Langley", slug: "langley-presale-condos" },
  { city: "Richmond", slug: "richmond-presale-condos" },
  { city: "Delta", slug: "delta-presale-condos" },
  { city: "Abbotsford", slug: "abbotsford-presale-condos" },
];

// Lazy load map component
const ProjectsMap = lazy(() => import("@/components/projects/ProjectsMap").then(m => ({ default: m.ProjectsMap })));

const ITEMS_PER_PAGE = 18;

// Filter options
const CITY_OPTIONS = [
  { value: "any", label: "All Cities" },
  { value: "Vancouver", label: "Vancouver" },
  { value: "Burnaby", label: "Burnaby" },
  { value: "Richmond", label: "Richmond" },
  { value: "Surrey", label: "Surrey" },
  { value: "Coquitlam", label: "Coquitlam" },
  { value: "Port Coquitlam", label: "Port Coquitlam" },
  { value: "Port Moody", label: "Port Moody" },
  { value: "North Vancouver", label: "North Vancouver" },
  { value: "West Vancouver", label: "West Vancouver" },
  { value: "Langley", label: "Langley" },
  { value: "Delta", label: "Delta" },
  { value: "Abbotsford", label: "Abbotsford" },
  { value: "Chilliwack", label: "Chilliwack" },
  { value: "Maple Ridge", label: "Maple Ridge" },
  { value: "New Westminster", label: "New Westminster" },
  { value: "White Rock", label: "White Rock" },
];

const TYPE_OPTIONS = [
  { value: "any", label: "All Types" },
  { value: "condo", label: "Condos" },
  { value: "townhome", label: "Townhomes" },
  { value: "mixed", label: "Mixed" },
];

const PRICE_RANGE_OPTIONS = [
  { value: "any", label: "Any Price" },
  { value: "0-500000", label: "Under $500K" },
  { value: "500000-750000", label: "$500K - $750K" },
  { value: "750000-1000000", label: "$750K - $1M" },
  { value: "1000000-1500000", label: "$1M - $1.5M" },
  { value: "1500000-2000000", label: "$1.5M - $2M" },
  { value: "2000000-999999999", label: "$2M+" },
];

const DEPOSIT_OPTIONS = [
  { value: "any", label: "Any Deposit" },
  { value: "5", label: "Up to 5%" },
  { value: "10", label: "Up to 10%" },
  { value: "15", label: "Up to 15%" },
  { value: "20", label: "Up to 20%" },
];

const COMPLETION_OPTIONS = [
  { value: "any", label: "Any Year" },
  { value: "2025", label: "2025" },
  { value: "2026", label: "2026" },
  { value: "2027", label: "2027" },
  { value: "2028", label: "2028+" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "deposit-asc", label: "Lowest Deposit" },
  { value: "completion", label: "Soonest Completion" },
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
  is_featured: boolean;
  last_verified_date: string | null;
  deposit_percent: number | null;
  map_lat: number | null;
  map_lng: number | null;
};

// Presale/Move-In Ready Toggle Component
function PresaleToggle() {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-full">
      <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-foreground text-background shadow-sm">
        Presale
      </button>
      <button
        onClick={() => navigate("/resale")}
        className="px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Move-In Ready
      </button>
    </div>
  );
}

export default function PresaleProjects() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  // Get filter values from URL params
  const filters = {
    city: searchParams.get("city") || "any",
    projectType: searchParams.get("type") || "any",
    priceRange: searchParams.get("price") || "any",
    depositPercent: searchParams.get("deposit") || "any",
    completionYear: searchParams.get("year") || "any",
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
      // Handle multi-select city filter (comma-separated values)
      if (filters.city !== "any") {
        const cities = filters.city.split(",").filter(Boolean);
        if (cities.length === 1) {
          countQuery = countQuery.eq("city", cities[0]);
        } else if (cities.length > 1) {
          countQuery = countQuery.in("city", cities);
        }
      }
      // Handle multi-select projectType filter
      if (filters.projectType !== "any") {
        const types = filters.projectType.split(",").filter(Boolean);
        if (types.length === 1) {
          countQuery = countQuery.eq("project_type", types[0] as "condo" | "townhome" | "mixed");
        } else if (types.length > 1) {
          countQuery = countQuery.in("project_type", types as ("condo" | "townhome" | "mixed")[]);
        }
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        countQuery = countQuery.gte("starting_price", min).lte("starting_price", max);
      }
      if (filters.depositPercent !== "any") {
        const depositVal = parseInt(filters.depositPercent);
        countQuery = countQuery.lte("deposit_percent", depositVal);
      }
      if (filters.completionYear !== "any") {
        const yearVal = parseInt(filters.completionYear);
        if (yearVal >= 2028) {
          countQuery = countQuery.gte("completion_year", 2028);
        } else {
          countQuery = countQuery.eq("completion_year", yearVal);
        }
      }

      const { count } = await countQuery;

      // Then get paginated data
      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image, gallery_images, is_featured, last_verified_date, deposit_percent, map_lat, map_lng")
        .eq("is_published", true);

      // Apply filters
      // Handle multi-select city filter (comma-separated values)
      if (filters.city !== "any") {
        const cities = filters.city.split(",").filter(Boolean);
        if (cities.length === 1) {
          query = query.eq("city", cities[0]);
        } else if (cities.length > 1) {
          query = query.in("city", cities);
        }
      }
      // Handle multi-select projectType filter
      if (filters.projectType !== "any") {
        const types = filters.projectType.split(",").filter(Boolean);
        if (types.length === 1) {
          query = query.eq("project_type", types[0] as "condo" | "townhome" | "mixed");
        } else if (types.length > 1) {
          query = query.in("project_type", types as ("condo" | "townhome" | "mixed")[]);
        }
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        query = query.gte("starting_price", min).lte("starting_price", max);
      }
      if (filters.depositPercent !== "any") {
        const depositVal = parseInt(filters.depositPercent);
        query = query.lte("deposit_percent", depositVal);
      }
      if (filters.completionYear !== "any") {
        const yearVal = parseInt(filters.completionYear);
        if (yearVal >= 2028) {
          query = query.gte("completion_year", 2028);
        } else {
          query = query.eq("completion_year", yearVal);
        }
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
        case "deposit-asc":
          query = query.order("deposit_percent", { ascending: true, nullsFirst: false });
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

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["presale-projects"] });
  }, [queryClient]);

  const activeFilterCount = [
    filters.city !== "any",
    filters.projectType !== "any",
    filters.priceRange !== "any",
    filters.depositPercent !== "any",
    filters.completionYear !== "any",
  ].filter(Boolean).length;

  // Filter config for UnifiedSearchFilters
  const filterConfig = [
    { key: "city", label: "City", paramKey: "city", options: CITY_OPTIONS, multiSelect: true },
    { key: "projectType", label: "Type", paramKey: "type", options: TYPE_OPTIONS, multiSelect: true },
    { key: "priceRange", label: "Price", paramKey: "price", options: PRICE_RANGE_OPTIONS },
    { key: "depositPercent", label: "Deposit", paramKey: "deposit", options: DEPOSIT_OPTIONS },
    { key: "completionYear", label: "Completion", paramKey: "year", options: COMPLETION_OPTIONS },
  ];

  // Build map URL with current filters for seamless transition
  const mapUrlWithFilters = useMemo(() => {
    return buildMapUrlFromGridFilters(searchParams, "presale");
  }, [searchParams]);

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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-border">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  // SEO
  const hasActiveFilters = activeFilterCount > 0 || currentPage > 1;
  
  const canonicalUrl = filters.city !== "any" 
    ? `https://presaleproperties.com/${filters.city.toLowerCase().replace(/\s+/g, "-")}-presale-condos`
    : "https://presaleproperties.com/presale-projects";
  
  const robotsMeta = hasActiveFilters ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1";
  
  const getSeoTitle = () => {
    if (filters.city !== "any") {
      return `Presale Condos in ${filters.city} 2026 | New Construction`;
    }
    return "Presale Condos & Townhomes | New Construction in Metro Vancouver";
  };

  const getSeoDescription = () => {
    if (filters.city !== "any") {
      return `Browse ${totalCount}+ presale condos in ${filters.city}. View floor plans, VIP pricing & deposit structures.`;
    }
    return `Browse ${totalCount}+ presale condos, townhomes & new construction in Vancouver, Surrey, Langley, Coquitlam, Burnaby.`;
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": getSeoTitle(),
    "numberOfItems": totalCount,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": PRESALE_FAQS.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
    }))
  };

  return (
    <>
      <Helmet>
        <title>{getSeoTitle()}</title>
        <meta name="description" content={getSeoDescription()} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content={robotsMeta} />
        <meta property="og:title" content={getSeoTitle()} />
        <meta property="og:description" content={getSeoDescription()} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-background">
        <ConversionHeader />
        
        {/* Clean Header Section */}
        <section className="bg-background border-b border-border">
          <div className="container px-4 py-4 md:py-5">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
              <Link to="/" className="hover:text-foreground transition-colors">
                <Home className="h-3.5 w-3.5" />
              </Link>
              <ChevronRightIcon className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">Presale Projects</span>
              {filters.city !== "any" && (
                <>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                  <span className="text-foreground font-medium">{filters.city}</span>
                </>
              )}
            </nav>

            {/* Title & Toggle Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {filters.city !== "any" 
                    ? `Presale Projects in ${filters.city}` 
                    : "Presale Condos & Townhomes"}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  <span className="font-semibold text-foreground">{totalCount}</span> projects available
                </p>
              </div>
              <PresaleToggle />
            </div>
            
            {/* Unified Search & Filters */}
            <UnifiedSearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search projects, neighborhoods..."
              filters={filterConfig}
              filterValues={filters}
              onFilterChange={updateFilter}
              sortOptions={SORT_OPTIONS}
              sortValue={filters.sort}
              onSortChange={(v) => updateFilter("sort", v)}
              mapLink={mapUrlWithFilters}
              resultCount={totalCount}
              onClearAll={clearAllFilters}
            />
          </div>
        </section>

        {/* Main Grid */}
        <main className="container px-4 py-5 md:py-8">
          {isLoading ? (
            <LoadingSkeleton />
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No projects found</h2>
              <p className="text-muted-foreground mb-6">Try adjusting your filters</p>
              <Button onClick={clearAllFilters}>Clear Filters</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                {filteredProjects.map((project) => (
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
              </div>
              <PaginationControls />
            </>
          )}
        </main>

        {/* Map Section */}
        <section className="py-10 bg-muted/30 border-t border-border">
          <div className="container px-4">
            <div className="text-center mb-5">
              <h2 className="text-xl font-bold text-foreground mb-1">
                {filters.city !== "any" ? `${filters.city} on Map` : "Explore on Map"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Find presale projects near you
              </p>
            </div>
            <Suspense fallback={
              <div className="h-[350px] rounded-xl bg-muted animate-pulse flex items-center justify-center">
                <Map className="h-10 w-10 text-muted-foreground animate-pulse" />
              </div>
            }>
              <div className="rounded-xl overflow-hidden border border-border h-[350px]">
                <ProjectsMap projects={filteredProjects as any} isLoading={isLoading} />
              </div>
            </Suspense>
            <div className="text-center mt-4">
              <Link to={mapUrlWithFilters}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Map className="h-4 w-4" />
                  Open Full Map
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <ScrollReveal animation="fade-up">
          <NewConstructionBenefits />
        </ScrollReveal>

        {/* City Links */}
        {activeFilterCount === 0 && (
          <ScrollReveal animation="fade-up">
            <section className="py-10 bg-background border-t border-border">
              <div className="container px-4">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Browse by City
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {CITY_SEO_LINKS.map((link) => (
                    <Link
                      key={link.slug}
                      to={`/${link.slug}`}
                      className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {link.city}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* FAQs */}
        {activeFilterCount === 0 && (
          <ScrollReveal animation="fade-up">
            <section className="py-10 bg-muted/30 border-t border-border">
              <div className="container px-4">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center gap-2 mb-5">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">
                      Frequently Asked Questions
                    </h2>
                  </div>
                  <Accordion type="single" collapsible className="space-y-2">
                    {PRESALE_FAQS.map((faq, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`faq-${index}`}
                        className="bg-card border border-border rounded-lg px-4"
                      >
                        <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary py-3 text-sm">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-3 text-sm leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </section>
          </ScrollReveal>
        )}
        
        <ScrollReveal animation="fade-up" delay={100}>
          <RelatedContent />
        </ScrollReveal>
        
        <Footer />
        <FloatingBottomNav />
      </PullToRefresh>
    </>
  );
}
