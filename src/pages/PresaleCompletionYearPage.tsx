import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { ChevronRight, ChevronLeft, Home, Building2, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { PresaleProjectCard } from "@/components/listings/PresaleProjectCard";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "./NotFound";

const ITEMS_PER_PAGE = 16;

const YEAR_CONFIGS: Record<string, {
  year: number;
  seoTitle: string;
  description: string;
}> = {
  "presale-projects-completing-2025": {
    year: 2025,
    seoTitle: "Presale Projects Completing 2025",
    description: "Move-in ready presale condos and townhomes completing in 2025 across Metro Vancouver & Fraser Valley",
  },
  "presale-projects-completing-2026": {
    year: 2026,
    seoTitle: "Presale Projects Completing 2026",
    description: "New presale condos and townhomes completing in 2026 — secure today's pricing with near-term move-in",
  },
  "presale-projects-completing-2027": {
    year: 2027,
    seoTitle: "Presale Projects Completing 2027",
    description: "Pre-construction homes completing in 2027 — buy at today's prices with flexible deposit structures",
  },
  "presale-projects-completing-2028": {
    year: 2028,
    seoTitle: "Presale Projects Completing 2028",
    description: "Early-access presale projects completing in 2028 — lowest entry pricing and maximum appreciation potential",
  },
};

const CITY_OPTIONS = [
  { value: "any", label: "All Cities" },
  { value: "Vancouver", label: "Vancouver" },
  { value: "Surrey", label: "Surrey" },
  { value: "Burnaby", label: "Burnaby" },
  { value: "Langley", label: "Langley" },
  { value: "Coquitlam", label: "Coquitlam" },
  { value: "Richmond", label: "Richmond" },
  { value: "Abbotsford", label: "Abbotsford" },
  { value: "Delta", label: "Delta" },
];

const TYPE_OPTIONS = [
  { value: "any", label: "All Types" },
  { value: "condo", label: "Condos" },
  { value: "townhome", label: "Townhomes" },
];

const SORT_OPTIONS = [
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest Listed" },
];

export default function PresaleCompletionYearPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const slug = location.pathname.replace(/^\//, "");
  const config = YEAR_CONFIGS[slug] || null;

  const filters = {
    city: searchParams.get("city") || "any",
    type: searchParams.get("type") || "any",
    sort: searchParams.get("sort") || "price-asc",
  };

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading } = useQuery({
    queryKey: ["presale-completion-year", slug, filters, currentPage],
    queryFn: async () => {
      if (!config) return { projects: [], totalCount: 0 };

      let countQuery = supabase
        .from("presale_projects")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true)
        .eq("completion_year", config.year);

      if (filters.city !== "any") {
        countQuery = countQuery.ilike("city", filters.city);
      }
      if (filters.type !== "any") {
        countQuery = countQuery.eq("project_type", filters.type as any);
      }

      const { count } = await countQuery;

      let query = supabase
        .from("presale_projects")
        .select("id, slug, name, city, neighborhood, project_type, status, completion_year, completion_month, starting_price, featured_image, gallery_images, last_verified_date")
        .eq("is_published", true)
        .eq("completion_year", config.year);

      if (filters.city !== "any") {
        query = query.ilike("city", filters.city);
      }
      if (filters.type !== "any") {
        query = query.eq("project_type", filters.type as any);
      }

      switch (filters.sort) {
        case "price-asc":
          query = query.order("starting_price", { ascending: true, nullsFirst: false });
          break;
        case "price-desc":
          query = query.order("starting_price", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);

      const { data: projects, error } = await query;
      if (error) throw error;

      return { projects: projects || [], totalCount: count || 0 };
    },
    enabled: !!config,
  });

  const projects = data?.projects || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "any") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    newParams.delete("page");
    setSearchParams(newParams);
  };

  const goToPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) newParams.delete("page");
    else newParams.set("page", page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["presale-completion-year", slug] });
  }, [queryClient, slug]);

  if (!config) return <NotFound />;

  const pageTitle = config.year === 2026
    ? "Completing 2026 Presales | Presale Properties"
    : `${config.seoTitle} | New Condos & Townhomes BC | PresaleProperties`;
  const pageDescription = `Browse ${totalCount}+ ${config.seoTitle.toLowerCase()} in Metro Vancouver & Fraser Valley. ${config.description}. VIP pricing, floor plans & incentives.`;
  const canonicalUrl = `https://presaleproperties.com/${slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": config.seoTitle,
    "description": pageDescription,
    "url": canonicalUrl,
    "numberOfItems": totalCount,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What presale projects are completing in ${config.year}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `There are ${totalCount}+ presale condos and townhomes completing in ${config.year} across Metro Vancouver and the Fraser Valley. Browse floor plans, pricing, and VIP incentives on PresaleProperties.com.`,
        },
      },
      {
        "@type": "Question",
        "name": `Is it a good time to buy a presale completing in ${config.year}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Presale projects completing in ${config.year} allow buyers to lock in today's pricing with structured deposit plans. This is especially attractive in a rising market where property values may appreciate before completion.`,
        },
      },
      {
        "@type": "Question",
        "name": `What cities have presale projects completing in ${config.year}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Presale projects completing in ${config.year} are available in Vancouver, Surrey, Burnaby, Langley, Coquitlam, Richmond, Abbotsford, and other Metro Vancouver cities.`,
        },
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com" },
      { "@type": "ListItem", "position": 2, "name": "Presale Projects", "item": "https://presaleproperties.com/presale-projects" },
      { "@type": "ListItem", "position": 3, "name": `Completing ${config.year}`, "item": canonicalUrl },
    ],
  };

  const hasActiveFilters = filters.city !== "any" || filters.type !== "any";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta name="robots" content={config.year === 2025 ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1"} />
        <meta name="ai-discoverable" content="true" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <ConversionHeader />

      <main className="container px-4 py-4 md:py-8 pb-24 lg:pb-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 overflow-x-auto">
          <Link to="/" className="hover:text-foreground transition-colors shrink-0">
            <Home className="h-3.5 w-3.5" />
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link to="/presale-projects" className="hover:text-foreground transition-colors shrink-0">
            Presale Projects
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium">Completing {config.year}</span>
        </nav>

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            {config.seoTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} projects completing in {config.year} • {config.description}
          </p>
        </div>

        {/* Sticky filter bar */}
        <div className="sticky top-[56px] z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/50 mb-6">
          {/* Year switcher */}
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
            {Object.entries(YEAR_CONFIGS).map(([yearSlug, yearConfig]) => (
              <Link key={yearSlug} to={`/${yearSlug}`}>
                <button
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                    slug === yearSlug
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {yearConfig.year}
                </button>
              </Link>
            ))}
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Select value={filters.city} onValueChange={(v) => updateFilter("city", v)}>
              <SelectTrigger className="h-8 w-[130px] text-xs border-border/60">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                {CITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(v) => updateFilter("type", v)}>
              <SelectTrigger className="h-8 w-[120px] text-xs border-border/60">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  const newParams = new URLSearchParams();
                  if (filters.sort !== "price-asc") newParams.set("sort", filters.sort);
                  setSearchParams(newParams);
                }}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                Clear
              </button>
            )}

            <div className="ml-auto shrink-0">
              <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
                <SelectTrigger className="h-8 w-[145px] text-xs border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <PullToRefresh onRefresh={handleRefresh}>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[320px] rounded-xl" />
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projects.map((project: any) => (
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
                  lastVerifiedDate={project.last_verified_date}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or check back soon for new {config.year} projects.
              </p>
              <Link to="/presale-projects">
                <Button variant="outline">Browse All Presale Projects</Button>
              </Link>
            </div>
          )}
        </PullToRefresh>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-3">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* SEO content block */}
        <section className="mt-12 prose prose-sm max-w-none text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground">
            Presale Condos & Townhomes Completing in {config.year}
          </h2>
          <p>
            {config.description}. These projects include condos, townhomes, and mixed-use developments 
            from top developers across Vancouver, Surrey, Burnaby, Langley, Coquitlam, Richmond, and Abbotsford.
          </p>
          <p>
            Buying presale with a {config.year} completion date means you can lock in today's pricing and benefit 
            from potential appreciation before your keys are in hand. Many of these projects offer VIP pricing, 
            flexible deposit structures, and exclusive incentives for early buyers.
          </p>
          <p>
            Whether you're a first-time buyer, investor, or looking to upsize, presale projects completing in {config.year} 
            offer modern floorplans, premium amenities, and brand-new construction backed by BC's new home warranty program.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
