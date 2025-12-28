import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Building2, MapPin, Home, ArrowRight } from "lucide-react";
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
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { PresaleProjectCard } from "@/components/listings/PresaleProjectCard";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { supabase } from "@/integrations/supabase/client";

const ITEMS_PER_PAGE = 12;

// City configuration with SEO data
const CITY_CONFIG: Record<string, {
  name: string;
  region: string;
  description: string;
  longDescription: string;
  neighborhoods: string[];
  keywords: string[];
}> = {
  "surrey": {
    name: "Surrey",
    region: "Fraser Valley",
    description: "Discover presale condos and townhomes in Surrey, BC. Browse new construction projects in Cloverdale, South Surrey, Guildford & more.",
    longDescription: "Surrey is one of the fastest-growing cities in Metro Vancouver, offering diverse presale opportunities from urban condos in City Centre to family townhomes in Clayton Heights and luxury developments in South Surrey. With excellent transit connections including SkyTrain, new schools, and major amenities, Surrey presales offer exceptional value for first-time buyers and investors alike.",
    neighborhoods: ["City Centre", "Cloverdale", "South Surrey", "Guildford", "Fleetwood", "Clayton Heights", "Whalley", "Newton"],
    keywords: ["presale condos Surrey", "new construction Surrey BC", "Surrey townhomes for sale", "presale Surrey City Centre", "South Surrey presale", "Clayton Heights new homes"]
  },
  "langley": {
    name: "Langley",
    region: "Fraser Valley",
    description: "Explore presale condos and townhomes in Langley, BC. New construction projects in Willowbrook, Murrayville, Walnut Grove & Langley City.",
    longDescription: "Langley offers the perfect blend of suburban living and urban convenience, with presale developments ranging from modern condos in Willoughby to spacious townhomes in Murrayville. Known for excellent schools, wine country, and family-friendly communities, Langley presales attract buyers seeking quality lifestyle at competitive prices.",
    neighborhoods: ["Willowbrook", "Willoughby", "Murrayville", "Walnut Grove", "Langley City", "Aldergrove", "Brookswood"],
    keywords: ["presale condos Langley", "Langley townhomes new construction", "Willoughby presale", "Langley BC new homes", "Walnut Grove presale", "Murrayville condos"]
  },
  "coquitlam": {
    name: "Coquitlam",
    region: "Tri-Cities",
    description: "Find presale condos and townhomes in Coquitlam, BC. New construction near Evergreen Line, Burquitlam, Burke Mountain & Coquitlam Centre.",
    longDescription: "Coquitlam is a premier destination for presale buyers, featuring transit-oriented developments along the Evergreen Line and master-planned communities on Burke Mountain. With stunning mountain views, excellent schools, and world-class amenities at Coquitlam Centre, presales here offer strong investment potential and lifestyle appeal.",
    neighborhoods: ["Burquitlam", "Burke Mountain", "Coquitlam Centre", "Maillardville", "Westwood Plateau", "Austin Heights", "Town Centre"],
    keywords: ["presale condos Coquitlam", "Burke Mountain townhomes", "Burquitlam presale condos", "Coquitlam new construction", "Evergreen Line condos", "Coquitlam Centre presale"]
  },
  "vancouver": {
    name: "Vancouver",
    region: "Metro Vancouver",
    description: "Browse presale condos in Vancouver, BC. New construction in Downtown, Mount Pleasant, Cambie Corridor, East Van & Olympic Village.",
    longDescription: "Vancouver remains the epicenter of presale development in BC, with world-class condos in Downtown, trendy lofts in Mount Pleasant, and family-friendly townhomes along the Cambie Corridor. Despite premium pricing, Vancouver presales offer unmatched lifestyle, transit access, and long-term appreciation potential.",
    neighborhoods: ["Downtown", "Mount Pleasant", "Cambie Corridor", "East Vancouver", "Olympic Village", "Kitsilano", "Yaletown", "Coal Harbour"],
    keywords: ["presale condos Vancouver", "Downtown Vancouver new construction", "Cambie Corridor presale", "Vancouver presale condos 2024", "Mount Pleasant condos", "East Van presale"]
  },
  "burnaby": {
    name: "Burnaby",
    region: "Metro Vancouver",
    description: "Discover presale condos in Burnaby, BC. New construction at Metrotown, Brentwood, Lougheed & Edmonds near SkyTrain.",
    longDescription: "Burnaby offers some of the most sought-after presale opportunities in Metro Vancouver, with high-rise developments at Metrotown and Brentwood Town Centre. Excellent SkyTrain connectivity, major shopping destinations, and proximity to Vancouver make Burnaby presales attractive to both end-users and investors.",
    neighborhoods: ["Metrotown", "Brentwood", "Lougheed", "Edmonds", "Highgate", "Burnaby Heights", "Capitol Hill"],
    keywords: ["presale condos Burnaby", "Metrotown presale condos", "Brentwood Town Centre condos", "Burnaby new construction", "Lougheed presale", "SkyTrain condos Burnaby"]
  },
  "richmond": {
    name: "Richmond",
    region: "Metro Vancouver",
    description: "Explore presale condos in Richmond, BC. New construction near Canada Line, Richmond Centre, Steveston & Bridgeport.",
    longDescription: "Richmond combines urban convenience with waterfront living, offering presale condos near Canada Line stations and charming townhomes in Steveston. As a major employment hub with excellent Asian dining and shopping, Richmond presales appeal to diverse buyers seeking transit-oriented living.",
    neighborhoods: ["City Centre", "Steveston", "Bridgeport", "Aberdeen", "Ironwood", "East Richmond", "Thompson"],
    keywords: ["presale condos Richmond", "Richmond new construction", "Canada Line condos Richmond", "Steveston townhomes", "Richmond Centre presale", "Richmond BC presale"]
  },
  "delta": {
    name: "Delta",
    region: "South of Fraser",
    description: "Find presale condos and townhomes in Delta, BC. New construction in Tsawwassen, Ladner & North Delta communities.",
    longDescription: "Delta offers unique presale opportunities across three distinct communities: beachside living in Tsawwassen, village charm in Ladner, and suburban convenience in North Delta. With the Tsawwassen Mills, ferry terminal, and excellent schools, Delta presales attract families and retirees seeking quality lifestyle.",
    neighborhoods: ["Tsawwassen", "Ladner", "North Delta", "Sunbury", "Scottsdale"],
    keywords: ["presale condos Delta", "Tsawwassen new construction", "Ladner townhomes", "North Delta presale", "Delta BC new homes", "Tsawwassen presale condos"]
  },
  "abbotsford": {
    name: "Abbotsford",
    region: "Fraser Valley",
    description: "Browse presale condos and townhomes in Abbotsford, BC. New construction in West Abbotsford, Clearbrook & Mill Lake area.",
    longDescription: "Abbotsford offers exceptional value for presale buyers, with spacious townhomes and affordable condos in a family-friendly setting. Known for berry farms, mountain views, and a growing downtown core, Abbotsford presales attract first-time buyers and families priced out of Vancouver.",
    neighborhoods: ["West Abbotsford", "Clearbrook", "Mill Lake", "Historic Downtown", "Matsqui", "Auguston"],
    keywords: ["presale condos Abbotsford", "Abbotsford townhomes new construction", "Fraser Valley presale", "Abbotsford BC new homes", "West Abbotsford presale", "affordable presale BC"]
  },
  "port-coquitlam": {
    name: "Port Coquitlam",
    region: "Tri-Cities",
    description: "Discover presale condos and townhomes in Port Coquitlam, BC. New construction near West Coast Express and Traboulay Trail.",
    longDescription: "Port Coquitlam offers excellent presale value in the Tri-Cities, with family-oriented townhomes and condos near transit and the scenic Traboulay PoCo Trail. With a revitalized downtown and strong community feel, PoCo presales attract young families and commuters.",
    neighborhoods: ["Downtown", "Citadel Heights", "Mary Hill", "Riverwood", "Oxford Heights"],
    keywords: ["presale condos Port Coquitlam", "PoCo townhomes", "Port Coquitlam new construction", "Tri-Cities presale", "West Coast Express condos"]
  },
  "port-moody": {
    name: "Port Moody",
    region: "Tri-Cities",
    description: "Find presale condos in Port Moody, BC. New construction at Moody Centre, Newport Village & Inlet Centre near Evergreen Line.",
    longDescription: "Port Moody is a boutique presale market known for waterfront living, craft breweries, and stunning natural beauty. With Evergreen Line connectivity and the charming Rocky Point area, Port Moody presales command premium prices but offer exceptional lifestyle value.",
    neighborhoods: ["Moody Centre", "Newport Village", "Inlet Centre", "Glenayre", "College Park"],
    keywords: ["presale condos Port Moody", "Moody Centre presale", "Newport Village condos", "Port Moody new construction", "Evergreen Line Port Moody", "waterfront condos Port Moody"]
  },
  "new-westminster": {
    name: "New Westminster",
    region: "Metro Vancouver",
    description: "Explore presale condos in New Westminster, BC. New construction at Sapperton, Quayside & Downtown near SkyTrain stations.",
    longDescription: "New Westminster offers historic charm meets modern presale development, with waterfront condos at Quayside and transit-oriented living near multiple SkyTrain stations. As one of the most affordable entry points to Metro Vancouver's SkyTrain network, New West presales attract savvy buyers.",
    neighborhoods: ["Downtown", "Sapperton", "Quayside", "Uptown", "Queensborough", "Brow of the Hill"],
    keywords: ["presale condos New Westminster", "New West presale", "Quayside condos", "Sapperton presale", "SkyTrain condos New Westminster", "New Westminster new construction"]
  },
  "north-vancouver": {
    name: "North Vancouver",
    region: "North Shore",
    description: "Browse presale condos in North Vancouver, BC. New construction at Lonsdale, Central Lonsdale, Lynn Valley & Lower Lonsdale.",
    longDescription: "North Vancouver presales offer mountain lifestyle with urban convenience, from waterfront developments at Lonsdale Quay to family townhomes in Lynn Valley. With SeaBus connectivity and world-class outdoor recreation, North Van presales attract active lifestyle buyers.",
    neighborhoods: ["Lower Lonsdale", "Central Lonsdale", "Lynn Valley", "Capilano", "Deep Cove", "Edgemont"],
    keywords: ["presale condos North Vancouver", "Lonsdale presale", "Lynn Valley townhomes", "North Van new construction", "SeaBus condos", "North Shore presale"]
  },
  "white-rock": {
    name: "White Rock",
    region: "South of Fraser",
    description: "Discover presale condos in White Rock, BC. New construction near White Rock Beach, Semiahmoo & Five Corners.",
    longDescription: "White Rock is a premium presale market known for oceanfront living, the iconic pier, and resort-style atmosphere. With limited land supply and high demand, White Rock presales offer both lifestyle appeal and investment potential for discerning buyers.",
    neighborhoods: ["Town Centre", "Semiahmoo", "East Beach", "West Beach", "Five Corners"],
    keywords: ["presale condos White Rock", "White Rock new construction", "oceanfront condos White Rock", "Semiahmoo presale", "South Surrey White Rock presale"]
  },
  "maple-ridge": {
    name: "Maple Ridge",
    region: "Fraser Valley",
    description: "Find presale townhomes in Maple Ridge, BC. New construction in Albion, Silver Valley & downtown near Golden Ears.",
    longDescription: "Maple Ridge offers exceptional presale value for families, with spacious townhomes in master-planned communities like Silver Valley. With Golden Ears Provincial Park nearby and improving transit connections, Maple Ridge presales attract outdoor enthusiasts and value-seekers.",
    neighborhoods: ["Albion", "Silver Valley", "Downtown", "Cottonwood", "Hammond", "Whonnock"],
    keywords: ["presale townhomes Maple Ridge", "Maple Ridge new construction", "Silver Valley presale", "Fraser Valley townhomes", "Albion presale", "affordable townhomes BC"]
  },
  "chilliwack": {
    name: "Chilliwack",
    region: "Fraser Valley",
    description: "Explore presale homes in Chilliwack, BC. New construction townhomes and single-family homes in Sardis, Promontory & Vedder.",
    longDescription: "Chilliwack offers the most affordable presale opportunities in the Lower Mainland, with spacious townhomes and single-family homes surrounded by stunning mountain scenery. Ideal for remote workers and families seeking value, Chilliwack presales provide exceptional square footage per dollar.",
    neighborhoods: ["Sardis", "Promontory", "Vedder", "Yarrow", "Garrison", "Downtown"],
    keywords: ["presale homes Chilliwack", "Chilliwack new construction", "affordable presale BC", "Fraser Valley new homes", "Promontory presale", "Sardis townhomes"]
  }
};

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
  featured_image: string | null;
  gallery_images: string[] | null;
  is_featured: boolean;
};

export default function CityPresalePage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const cityConfig = citySlug ? CITY_CONFIG[citySlug] : null;
  const cityName = cityConfig?.name || "";

  // Get filter values from URL params
  const filters = {
    status: searchParams.get("status") || "any",
    projectType: searchParams.get("type") || "any",
    priceRange: searchParams.get("price") || "any",
    sort: searchParams.get("sort") || "newest",
  };

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading } = useQuery({
    queryKey: ["city-presale-projects", cityName, filters, currentPage],
    queryFn: async () => {
      if (!cityName) return { projects: [], totalCount: 0 };

      // First, get total count
      let countQuery = supabase
        .from("presale_projects")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true)
        .eq("city", cityName);

      // Apply filters to count query
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
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image, gallery_images, is_featured")
        .eq("is_published", true)
        .eq("city", cityName);

      // Apply filters
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
    enabled: !!cityName,
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
        p.neighborhood.toLowerCase().includes(q)
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
    await queryClient.invalidateQueries({ queryKey: ["city-presale-projects"] });
  }, [queryClient]);

  const activeFilterCount = [
    filters.status !== "any",
    filters.projectType !== "any",
    filters.priceRange !== "any",
  ].filter(Boolean).length;

  if (!cityConfig) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background py-20">
          <div className="container text-center">
            <h1 className="text-3xl font-bold mb-4">City Not Found</h1>
            <p className="text-muted-foreground mb-8">The city you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to="/presale-projects">View All Projects</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const canonicalUrl = `https://presaleproperties.com/presale-condos-${citySlug}`;
  const currentYear = new Date().getFullYear();

  const seoTitle = `Presale Condos & Townhomes ${cityName} BC ${currentYear} | New Construction Homes`;
  const seoDescription = cityConfig.description;

  // Structured data for the city page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Presale Projects in ${cityName}, BC`,
    "description": cityConfig.longDescription,
    "url": canonicalUrl,
    "numberOfItems": totalCount,
    "itemListElement": projects?.slice(0, 10).map((project, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "RealEstateListing",
        "name": project.name,
        "url": `https://presaleproperties.com/presale-projects/${project.slug}`,
        "image": project.featured_image,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": project.city,
          "addressRegion": "BC",
          "addressCountry": "CA"
        }
      }
    })) || []
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://presaleproperties.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Presale Projects",
        "item": "https://presaleproperties.com/presale-projects"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `${cityName} Presales`,
        "item": canonicalUrl
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How many presale projects are available in ${cityName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `There are currently ${totalCount} presale projects available in ${cityName}, BC. Browse condos, townhomes, and new construction developments with VIP pricing and early access.`
        }
      },
      {
        "@type": "Question",
        "name": `What neighborhoods in ${cityName} have presale developments?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Popular neighborhoods for presale developments in ${cityName} include ${cityConfig.neighborhoods.slice(0, 5).join(", ")}. Each area offers unique lifestyle benefits and investment opportunities.`
        }
      },
      {
        "@type": "Question",
        "name": `What is the starting price for presale condos in ${cityName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Presale prices in ${cityName} vary by project and unit type. Contact us to receive current pricing, floor plans, and VIP incentives for ${cityName} presale developments.`
        }
      }
    ]
  };

  const FilterControls = () => (
    <div className="space-y-4">
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
          Clear Filters
        </Button>
      )}
    </div>
  );

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

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

        <span className="text-sm text-muted-foreground px-4">
          Page {currentPage} of {totalPages}
        </span>

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

  // Related cities for internal linking
  const relatedCities = Object.entries(CITY_CONFIG)
    .filter(([slug]) => slug !== citySlug)
    .slice(0, 6);

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={cityConfig.keywords.join(", ")} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="PresaleProperties.com" />
        <meta property="og:locale" content="en_CA" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        
        {/* Geo */}
        <meta name="geo.region" content="CA-BC" />
        <meta name="geo.placename" content={cityName} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
          <div className="container px-4 py-12 md:py-16 lg:py-20">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <Link to="/presale-projects" className="hover:text-foreground transition-colors">Presale Projects</Link>
              <span>/</span>
              <span className="text-foreground font-medium">{cityName}</span>
            </nav>

            <div className="max-w-4xl">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                <MapPin className="h-3 w-3 mr-1" />
                {cityConfig.region}
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
                Presale Condos & Townhomes in {cityName}
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">
                {cityConfig.longDescription}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {cityConfig.neighborhoods.slice(0, 6).map((neighborhood) => (
                  <Badge key={neighborhood} variant="outline" className="text-sm">
                    {neighborhood}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{totalCount}</span>
                  <span className="text-muted-foreground">Active Projects</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PullToRefresh onRefresh={handleRefresh}>
          <section className="container px-4 py-8 md:py-12">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Desktop Sidebar Filters */}
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-24 space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">Filter Projects</h3>
                    <FilterControls />
                  </div>

                  {/* Sorting */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">Sort By</h3>
                    <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
                      <SelectTrigger>
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
              </aside>

              {/* Main Content */}
              <div className="flex-1">
                {/* Mobile Controls */}
                <div className="flex items-center gap-3 mb-6 lg:hidden">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="relative">
                        <SlidersHorizontal className="h-4 w-4" />
                        {activeFilterCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                            {activeFilterCount}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterControls />
                        <div className="mt-6">
                          <h3 className="font-semibold text-foreground mb-4">Sort By</h3>
                          <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
                            <SelectTrigger>
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
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Desktop Search */}
                <div className="hidden lg:flex items-center justify-between mb-6">
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects in this city..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredProjects.length} of {totalCount} projects
                  </p>
                </div>

                {/* Results */}
                {isLoading ? (
                  <LoadingSkeleton />
                ) : filteredProjects.length === 0 ? (
                  <div className="text-center py-16">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your filters or search query.
                    </p>
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                      {filteredProjects.map((project) => (
                        <PresaleProjectCard
                          key={project.id}
                          id={project.id}
                          name={project.name}
                          slug={project.slug}
                          city={project.city}
                          neighborhood={project.neighborhood}
                          status={project.status}
                          projectType={project.project_type}
                          completionYear={project.completion_year}
                          startingPrice={project.starting_price}
                          featuredImage={project.featured_image}
                          galleryImages={project.gallery_images}
                        />
                      ))}
                    </div>
                    <PaginationControls />
                  </>
                )}
              </div>
            </div>
          </section>
        </PullToRefresh>

        {/* SEO Content Section */}
        <section className="bg-muted/30 border-t border-border">
          <div className="container px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                Why Buy Presale in {cityName}?
              </h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {cityName} is one of the most dynamic real estate markets in British Columbia, 
                  offering exceptional opportunities for presale buyers. Whether you're a first-time 
                  homebuyer looking for an affordable entry point, an investor seeking rental income, 
                  or a family upgrading to a larger home, {cityName} presale developments cater to 
                  diverse needs and budgets.
                </p>
                <h3 className="text-xl font-semibold mt-8 mb-4">Popular Neighborhoods for Presale</h3>
                <ul className="grid sm:grid-cols-2 gap-2 mb-8">
                  {cityConfig.neighborhoods.map((neighborhood) => (
                    <li key={neighborhood} className="flex items-center gap-2 text-muted-foreground">
                      <Home className="h-4 w-4 text-primary shrink-0" />
                      {neighborhood}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Related Cities Section */}
        <section className="border-t border-border">
          <div className="container px-4 py-12 md:py-16">
            <h2 className="text-2xl font-bold mb-6">Explore Other Cities</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedCities.map(([slug, config]) => (
                <Link
                  key={slug}
                  to={`/presale-condos-${slug}`}
                  className="group flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-accent/50 transition-all"
                >
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {config.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{config.region}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <NewConstructionBenefits />
      </main>

      <Footer />
    </>
  );
}
