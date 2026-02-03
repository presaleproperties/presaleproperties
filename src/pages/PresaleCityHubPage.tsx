import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Building2, MapPin, Home, ArrowRight, Map } from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { PresaleProjectCard } from "@/components/listings/PresaleProjectCard";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { HomeUnifiedMapSection } from "@/components/map/HomeUnifiedMapSection";
import { supabase } from "@/integrations/supabase/client";

const ITEMS_PER_PAGE = 12;

// City configuration with SEO data
const CITY_CONFIG: Record<string, {
  name: string;
  region: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  description: string;
  longDescription: string;
  neighborhoods: string[];
  keywords: string[];
  faqs: { question: string; answer: string }[];
}> = {
  "surrey": {
    name: "Surrey",
    region: "Fraser Valley",
    metaTitle: "Presale Projects Surrey | New Condos & Townhomes 2026",
    metaDescription: "Browse 20+ presale projects in Surrey. New condos & townhomes in City Centre, South Surrey, Cloverdale. VIP pricing from $299K. Floor plans & deposit info.",
    h1: "Presale Projects in Surrey",
    description: "Explore new construction condos and townhomes across Surrey, BC. Find presale opportunities in Cloverdale, South Surrey, Guildford, Fleetwood & more.",
    longDescription: "Surrey is one of the fastest-growing cities in Metro Vancouver, offering diverse presale opportunities from urban condos in City Centre to family townhomes in Clayton Heights.",
    neighborhoods: ["City Centre", "Cloverdale", "South Surrey", "Guildford", "Fleetwood", "Clayton Heights", "Whalley", "Newton"],
    keywords: ["presale projects surrey", "surrey presale condos", "surrey presale townhomes", "new construction surrey"],
    faqs: [
      { question: "What presale projects are available in Surrey?", answer: "Surrey has 20+ active presale projects including condos in City Centre, townhomes in South Surrey, and mixed developments across Cloverdale and Fleetwood." },
      { question: "What is the deposit structure for Surrey presales?", answer: "Surrey presale deposits typically range from 15-20% paid in installments. Common structures include 5% at signing, 5% at 90 days, 5% at 180 days." },
      { question: "When will Surrey presale projects complete?", answer: "Completion dates vary by project. Most Surrey presales in our database have completion dates between 2025-2028." }
    ]
  },
  "vancouver": {
    name: "Vancouver",
    region: "Metro Vancouver",
    metaTitle: "Presale Projects Vancouver | New Condos & Townhomes 2026",
    metaDescription: "Browse presale projects in Vancouver. New condos in Downtown, Mount Pleasant, Cambie Corridor. VIP pricing & floor plans. Expert presale guidance.",
    h1: "Presale Projects in Vancouver",
    description: "Explore presale condos in Vancouver, BC. New construction in Downtown, Mount Pleasant, Cambie Corridor, East Van & Olympic Village.",
    longDescription: "Vancouver remains the epicenter of presale development in BC, with world-class condos in Downtown, trendy lofts in Mount Pleasant, and family-friendly townhomes along the Cambie Corridor.",
    neighborhoods: ["Downtown", "Mount Pleasant", "Cambie Corridor", "East Vancouver", "Olympic Village", "Kitsilano", "Yaletown"],
    keywords: ["presale projects vancouver", "vancouver presale condos", "downtown vancouver presale", "new construction vancouver"],
    faqs: [
      { question: "What presale projects are available in Vancouver?", answer: "Vancouver has numerous presale projects across Downtown, Mount Pleasant, Cambie Corridor, and East Vancouver, ranging from boutique buildings to large towers." },
      { question: "What deposit structure is typical for Vancouver presales?", answer: "Vancouver presale deposits typically range from 20-25%, often paid as 5% at signing, 5% at 90 days, 5% at 180 days, and 5-10% at 1 year." },
      { question: "Are Vancouver presales a good investment?", answer: "Vancouver presales offer strong long-term appreciation potential due to limited land supply, strong demand, and world-class amenities. Location and transit access are key factors." }
    ]
  },
  "burnaby": {
    name: "Burnaby",
    region: "Metro Vancouver",
    metaTitle: "Presale Projects Burnaby | New Condos & Townhomes 2026",
    metaDescription: "Browse presale projects in Burnaby. New condos at Metrotown, Brentwood, Lougheed near SkyTrain. VIP pricing & floor plans available.",
    h1: "Presale Projects in Burnaby",
    description: "Discover presale condos in Burnaby, BC. New construction at Metrotown, Brentwood, Lougheed & Edmonds near SkyTrain.",
    longDescription: "Burnaby offers some of the most sought-after presale opportunities in Metro Vancouver, with high-rise developments at Metrotown and Brentwood Town Centre.",
    neighborhoods: ["Metrotown", "Brentwood", "Lougheed", "Edmonds", "Highgate", "Burnaby Heights"],
    keywords: ["presale projects burnaby", "burnaby presale condos", "metrotown presale", "brentwood presale"],
    faqs: [
      { question: "What presale projects are available in Burnaby?", answer: "Burnaby has active presale projects at Metrotown, Brentwood Town Centre, Lougheed, and Edmonds, featuring high-rise condos near SkyTrain stations." },
      { question: "What deposit structure applies to Burnaby presales?", answer: "Burnaby presale deposits typically range from 20-25% due to high demand. Premium locations may require larger deposits." },
      { question: "Why are Burnaby presales popular with investors?", answer: "Burnaby presales offer excellent transit connectivity via SkyTrain, strong rental demand, and proximity to both Vancouver and the suburbs." }
    ]
  },
  "coquitlam": {
    name: "Coquitlam",
    region: "Tri-Cities",
    metaTitle: "Presale Projects Coquitlam | New Condos & Townhomes 2026",
    metaDescription: "Browse presale projects in Coquitlam. New condos near Evergreen Line, Burke Mountain townhomes. VIP pricing & floor plans available.",
    h1: "Presale Projects in Coquitlam",
    description: "Find presale condos and townhomes in Coquitlam, BC. New construction near Evergreen Line, Burquitlam, Burke Mountain & Coquitlam Centre.",
    longDescription: "Coquitlam is a premier destination for presale buyers, featuring transit-oriented developments along the Evergreen Line and master-planned communities on Burke Mountain.",
    neighborhoods: ["Burquitlam", "Burke Mountain", "Coquitlam Centre", "Maillardville", "Westwood Plateau", "Town Centre"],
    keywords: ["presale projects coquitlam", "coquitlam presale condos", "burke mountain presale", "evergreen line condos"],
    faqs: [
      { question: "What presale projects are available in Coquitlam?", answer: "Coquitlam has presale projects near Evergreen Line stations and on Burke Mountain, offering both high-rise condos and family townhomes." },
      { question: "What deposit structure applies to Coquitlam presales?", answer: "Coquitlam presale deposits typically range from 15-25%, with transit-oriented projects requiring deposits at the higher end." },
      { question: "Is Burke Mountain a good area for presale investment?", answer: "Burke Mountain offers excellent value with master-planned communities, parks, schools, and growing amenities. It's popular with families." }
    ]
  },
  "langley": {
    name: "Langley",
    region: "Fraser Valley",
    metaTitle: "Presale Projects Langley | New Condos & Townhomes 2026",
    metaDescription: "Browse presale projects in Langley. New condos & townhomes in Willoughby, Murrayville. VIP pricing from $299K. Floor plans available.",
    h1: "Presale Projects in Langley",
    description: "Explore presale condos and townhomes in Langley, BC. New construction in Willoughby, Murrayville, Walnut Grove & Langley City.",
    longDescription: "Langley offers the perfect blend of suburban living and urban convenience, with presale developments ranging from modern condos in Willoughby to spacious townhomes in Murrayville.",
    neighborhoods: ["Willoughby", "Murrayville", "Walnut Grove", "Langley City", "Aldergrove", "Brookswood"],
    keywords: ["presale projects langley", "langley presale condos", "willoughby presale", "langley townhomes"],
    faqs: [
      { question: "What presale projects are available in Langley?", answer: "Langley has presale condos and townhomes in Willoughby, Murrayville, and Walnut Grove, offering excellent value for families." },
      { question: "What deposit structure is typical for Langley presales?", answer: "Langley presale deposits typically range from 10-20%, with many developers offering flexible terms for first-time buyers." },
      { question: "Why choose Langley for presale investment?", answer: "Langley offers excellent schools, wine country lifestyle, and strong appreciation potential as SkyTrain expansion approaches." }
    ]
  },
  "richmond": {
    name: "Richmond",
    region: "Metro Vancouver",
    metaTitle: "Presale Projects Richmond | New Condos 2026",
    metaDescription: "Browse presale projects in Richmond. New condos near Canada Line, City Centre, Steveston. VIP pricing & floor plans available.",
    h1: "Presale Projects in Richmond",
    description: "Explore presale condos in Richmond, BC. New construction near Canada Line, Richmond Centre, Steveston & Bridgeport.",
    longDescription: "Richmond combines urban convenience with waterfront living, offering presale condos near Canada Line stations and charming townhomes in Steveston.",
    neighborhoods: ["City Centre", "Steveston", "Bridgeport", "Aberdeen", "Ironwood", "East Richmond"],
    keywords: ["presale projects richmond", "richmond presale condos", "canada line condos", "steveston presale"],
    faqs: [
      { question: "What presale projects are available in Richmond?", answer: "Richmond has presale condos near Canada Line stations and in established neighborhoods like Steveston and City Centre." },
      { question: "What deposit structure applies to Richmond presales?", answer: "Richmond presale deposits typically range from 15-20%, with projects near transit commanding higher deposits." },
      { question: "Is Richmond good for presale investment?", answer: "Richmond offers strong rental demand, excellent transit via Canada Line, and diverse dining/shopping amenities." }
    ]
  },
  "delta": {
    name: "Delta",
    region: "South of Fraser",
    metaTitle: "Presale Projects Delta | New Condos & Townhomes 2026",
    metaDescription: "Browse presale projects in Delta. New condos in Tsawwassen, Ladner, North Delta. VIP pricing & floor plans available.",
    h1: "Presale Projects in Delta",
    description: "Find presale condos and townhomes in Delta, BC. New construction in Tsawwassen, Ladner & North Delta.",
    longDescription: "Delta offers unique presale opportunities across three distinct communities: beachside living in Tsawwassen, village charm in Ladner, and suburban convenience in North Delta.",
    neighborhoods: ["Tsawwassen", "Ladner", "North Delta", "Sunbury", "Scottsdale"],
    keywords: ["presale projects delta", "delta presale condos", "tsawwassen presale", "ladner townhomes"],
    faqs: [
      { question: "What presale projects are available in Delta?", answer: "Delta has presale projects in Tsawwassen, Ladner, and North Delta, offering waterfront condos and family townhomes." },
      { question: "What deposit structure is typical for Delta presales?", answer: "Delta presale deposits typically range from 10-20%, with Tsawwassen waterfront projects at the higher end." },
      { question: "Why choose Delta for presale investment?", answer: "Delta offers excellent value, beachside lifestyle in Tsawwassen, and proximity to Tsawwassen Mills outlet shopping." }
    ]
  },
  "abbotsford": {
    name: "Abbotsford",
    region: "Fraser Valley",
    metaTitle: "Presale Projects Abbotsford | New Condos & Townhomes 2026",
    metaDescription: "Browse presale projects in Abbotsford. Affordable new construction from $299K. VIP pricing & floor plans available.",
    h1: "Presale Projects in Abbotsford",
    description: "Browse presale condos and townhomes in Abbotsford, BC. New construction in West Abbotsford, Clearbrook & Mill Lake.",
    longDescription: "Abbotsford offers exceptional value for presale buyers, with spacious townhomes and affordable condos in a family-friendly setting.",
    neighborhoods: ["West Abbotsford", "Clearbrook", "Mill Lake", "Historic Downtown", "Matsqui", "Auguston"],
    keywords: ["presale projects abbotsford", "abbotsford presale condos", "affordable presale bc", "abbotsford townhomes"],
    faqs: [
      { question: "What presale projects are available in Abbotsford?", answer: "Abbotsford has affordable presale condos and townhomes, offering excellent value for first-time buyers and families." },
      { question: "What deposit structure is typical for Abbotsford presales?", answer: "Abbotsford presale deposits are among BC's most flexible, often 10-15% with extended payment schedules." },
      { question: "Why choose Abbotsford for presale investment?", answer: "Abbotsford offers the lowest entry point in the Lower Mainland with excellent space-per-dollar value." }
    ]
  },
  "port-coquitlam": {
    name: "Port Coquitlam",
    region: "Tri-Cities",
    metaTitle: "Presale Projects Port Coquitlam | New Condos 2026",
    metaDescription: "Browse presale projects in Port Coquitlam. New condos & townhomes near West Coast Express. VIP pricing available.",
    h1: "Presale Projects in Port Coquitlam",
    description: "Discover presale condos and townhomes in Port Coquitlam, BC. New construction near West Coast Express and Traboulay Trail.",
    longDescription: "Port Coquitlam offers excellent presale value in the Tri-Cities, with family-oriented townhomes and condos near transit.",
    neighborhoods: ["Downtown", "Citadel Heights", "Mary Hill", "Riverwood", "Oxford Heights"],
    keywords: ["presale projects port coquitlam", "poco presale condos", "tri-cities presale"],
    faqs: [
      { question: "What presale projects are available in Port Coquitlam?", answer: "Port Coquitlam has family-focused presale townhomes and condos with excellent transit connections." },
      { question: "What deposit structure is typical for PoCo presales?", answer: "Port Coquitlam presale deposits typically range from 10-20% with flexible terms." },
      { question: "Why choose Port Coquitlam for presale?", answer: "PoCo offers excellent value, strong community feel, and commuter-friendly transit options." }
    ]
  },
  "port-moody": {
    name: "Port Moody",
    region: "Tri-Cities",
    metaTitle: "Presale Projects Port Moody | New Condos 2026",
    metaDescription: "Browse presale projects in Port Moody. New condos at Moody Centre, Newport Village near Evergreen Line. VIP pricing available.",
    h1: "Presale Projects in Port Moody",
    description: "Find presale condos in Port Moody, BC. New construction at Moody Centre, Newport Village & Inlet Centre near Evergreen Line.",
    longDescription: "Port Moody is a boutique presale market known for waterfront living, craft breweries, and stunning natural beauty.",
    neighborhoods: ["Moody Centre", "Newport Village", "Inlet Centre", "Glenayre", "College Park"],
    keywords: ["presale projects port moody", "port moody presale condos", "evergreen line condos"],
    faqs: [
      { question: "What presale projects are available in Port Moody?", answer: "Port Moody has boutique presale condos near Evergreen Line with waterfront and mountain views." },
      { question: "What deposit structure is typical for Port Moody?", answer: "Port Moody presale deposits typically range from 20% due to high demand and premium locations." },
      { question: "Why choose Port Moody for presale?", answer: "Port Moody offers exceptional lifestyle with breweries, trails, and SkyTrain connectivity." }
    ]
  },
  "new-westminster": {
    name: "New Westminster",
    region: "Metro Vancouver",
    metaTitle: "Presale Projects New Westminster | New Condos 2026",
    metaDescription: "Browse presale projects in New Westminster. New condos at Sapperton, Quayside, Downtown near SkyTrain. VIP pricing available.",
    h1: "Presale Projects in New Westminster",
    description: "Explore presale condos in New Westminster, BC. New construction at Sapperton, Quayside & Downtown near SkyTrain.",
    longDescription: "New Westminster offers historic charm meets modern presale development, with waterfront condos at Quayside and transit-oriented living near multiple SkyTrain stations.",
    neighborhoods: ["Downtown", "Sapperton", "Quayside", "Uptown", "Queensborough"],
    keywords: ["presale projects new westminster", "new west presale condos", "quayside presale"],
    faqs: [
      { question: "What presale projects are available in New Westminster?", answer: "New Westminster has presale condos at Sapperton, Quayside, and Downtown with excellent SkyTrain access." },
      { question: "What deposit structure is typical for New West presales?", answer: "New Westminster presale deposits typically range from 15-20% with some reduced deposit options." },
      { question: "Why choose New Westminster for presale?", answer: "New West offers excellent value with multiple SkyTrain stations and waterfront living at Quayside." }
    ]
  },
  "north-vancouver": {
    name: "North Vancouver",
    region: "North Shore",
    metaTitle: "Presale Projects North Vancouver | New Condos 2026",
    metaDescription: "Browse presale projects in North Vancouver. New condos at Lonsdale, Lynn Valley near SeaBus. VIP pricing & floor plans available.",
    h1: "Presale Projects in North Vancouver",
    description: "Browse presale condos in North Vancouver, BC. New construction at Lonsdale, Central Lonsdale, Lynn Valley & Lower Lonsdale.",
    longDescription: "North Vancouver presales offer mountain lifestyle with urban convenience, from waterfront developments at Lonsdale Quay to family townhomes in Lynn Valley.",
    neighborhoods: ["Lower Lonsdale", "Central Lonsdale", "Lynn Valley", "Capilano", "Deep Cove"],
    keywords: ["presale projects north vancouver", "north van presale condos", "lonsdale presale"],
    faqs: [
      { question: "What presale projects are available in North Vancouver?", answer: "North Vancouver has presale condos at Lonsdale and family townhomes in Lynn Valley." },
      { question: "What deposit structure is typical for North Van presales?", answer: "North Vancouver presale deposits typically range from 20-25% due to high demand." },
      { question: "Why choose North Vancouver for presale?", answer: "North Van offers mountain lifestyle, SeaBus connectivity, and world-class outdoor recreation." }
    ]
  },
  "white-rock": {
    name: "White Rock",
    region: "South of Fraser",
    metaTitle: "Presale Projects White Rock | New Condos 2026",
    metaDescription: "Browse presale projects in White Rock. Oceanfront condos near White Rock Beach. VIP pricing & floor plans available.",
    h1: "Presale Projects in White Rock",
    description: "Discover presale condos in White Rock, BC. New construction near White Rock Beach, Semiahmoo & Five Corners.",
    longDescription: "White Rock is a premium presale market known for oceanfront living, the iconic pier, and resort-style atmosphere.",
    neighborhoods: ["Town Centre", "Semiahmoo", "East Beach", "West Beach", "Five Corners"],
    keywords: ["presale projects white rock", "white rock presale condos", "oceanfront presale"],
    faqs: [
      { question: "What presale projects are available in White Rock?", answer: "White Rock has premium presale condos with ocean views near the beach and pier." },
      { question: "What deposit structure is typical for White Rock?", answer: "White Rock presale deposits typically range from 20-25% for premium oceanfront locations." },
      { question: "Why choose White Rock for presale?", answer: "White Rock offers resort-style oceanfront living with limited supply and strong appreciation." }
    ]
  },
  "maple-ridge": {
    name: "Maple Ridge",
    region: "Fraser Valley",
    metaTitle: "Presale Projects Maple Ridge | New Townhomes 2026",
    metaDescription: "Browse presale projects in Maple Ridge. New townhomes in Albion, Silver Valley. VIP pricing from $599K.",
    h1: "Presale Projects in Maple Ridge",
    description: "Find presale townhomes in Maple Ridge, BC. New construction in Albion, Silver Valley & downtown.",
    longDescription: "Maple Ridge offers exceptional presale value for families, with spacious townhomes in master-planned communities like Silver Valley.",
    neighborhoods: ["Albion", "Silver Valley", "Downtown", "Cottonwood", "Hammond"],
    keywords: ["presale projects maple ridge", "maple ridge presale townhomes", "silver valley presale"],
    faqs: [
      { question: "What presale projects are available in Maple Ridge?", answer: "Maple Ridge focuses on family townhomes in Silver Valley, Albion, and downtown." },
      { question: "What deposit structure is typical for Maple Ridge?", answer: "Maple Ridge presale deposits are typically 10-15% with flexible payment schedules." },
      { question: "Why choose Maple Ridge for presale?", answer: "Maple Ridge offers excellent value, outdoor lifestyle near Golden Ears, and family communities." }
    ]
  },
  "chilliwack": {
    name: "Chilliwack",
    region: "Fraser Valley",
    metaTitle: "Presale Projects Chilliwack | New Homes 2026",
    metaDescription: "Browse presale projects in Chilliwack. Affordable new construction from $399K. VIP pricing available.",
    h1: "Presale Projects in Chilliwack",
    description: "Explore presale homes in Chilliwack, BC. New construction townhomes and single-family homes in Sardis, Promontory & Vedder.",
    longDescription: "Chilliwack offers the most affordable presale opportunities in the Lower Mainland, with spacious townhomes surrounded by stunning mountain scenery.",
    neighborhoods: ["Sardis", "Promontory", "Vedder", "Yarrow", "Garrison"],
    keywords: ["presale projects chilliwack", "chilliwack presale homes", "affordable presale bc"],
    faqs: [
      { question: "What presale projects are available in Chilliwack?", answer: "Chilliwack has affordable presale townhomes and single-family homes in Sardis and Promontory." },
      { question: "What deposit structure is typical for Chilliwack?", answer: "Chilliwack presale deposits are among BC's lowest, often 5-10% with extended terms." },
      { question: "Why choose Chilliwack for presale?", answer: "Chilliwack offers BC's most affordable entry point with excellent space-per-dollar value." }
    ]
  }
};

const PRICE_RANGES = [
  { value: "any", label: "Any Price" },
  { value: "0-500000", label: "Under $500K" },
  { value: "500000-750000", label: "$500K - $750K" },
  { value: "750000-1000000", label: "$750K - $1M" },
  { value: "1000000-1500000", label: "$1M - $1.5M" },
  { value: "1500000-999999999", label: "$1.5M+" },
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
  project_type: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  completion_year: number | null;
  starting_price: number | null;
  featured_image: string | null;
  gallery_images: string[] | null;
  is_featured: boolean;
  last_verified_date: string | null;
};

export default function PresaleCityHubPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const cityConfig = citySlug ? CITY_CONFIG[citySlug] : null;
  const cityName = cityConfig?.name || "";

  // Get filter values from URL params
  const filters = {
    projectType: searchParams.get("type") || "any",
    priceRange: searchParams.get("price") || "any",
    sort: searchParams.get("sort") || "newest",
  };

  // Pagination
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Fetch projects
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["city-presale-projects", citySlug, filters],
    queryFn: async () => {
      if (!cityName) return [];
      
      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image, gallery_images, is_featured, last_verified_date")
        .eq("is_published", true)
        .ilike("city", cityName);

      // Apply type filter
      if (filters.projectType !== "any") {
        query = query.eq("project_type", filters.projectType as "condo" | "townhome" | "mixed" | "duplex" | "single_family");
      }

      // Apply price filter
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        if (min > 0) query = query.gte("starting_price", min);
        if (max < 999999999) query = query.lte("starting_price", max);
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
          query = query.order("completion_year", { ascending: true, nullsFirst: false });
          break;
        default:
          query = query.order("is_featured", { ascending: false }).order("updated_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as Project[]) || [];
    },
    enabled: !!cityConfig,
  });

  // Filter by search
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchQuery.trim()) return projects;
    
    const q = searchQuery.toLowerCase();
    return projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.neighborhood?.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  // Pagination
  const totalPages = Math.ceil((filteredProjects?.length || 0) / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const updateFilter = useCallback((key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "any") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    newParams.delete("page");
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handlePageChange = useCallback((page: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete("page");
    } else {
      newParams.set("page", page.toString());
    }
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchParams, setSearchParams]);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["city-presale-projects", citySlug] });
  }, [queryClient, citySlug]);

  if (!cityConfig) {
    return (
      <div className="min-h-screen flex flex-col">
        <ConversionHeader />
        <main className="flex-grow container px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">City Not Found</h1>
          <Link to="/presale-projects">
            <Button>View All Presale Projects</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Generate internal links for other cities
  const otherCities = Object.entries(CITY_CONFIG)
    .filter(([slug]) => slug !== citySlug)
    .slice(0, 8);

  // Build structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com/" },
      { "@type": "ListItem", "position": 2, "name": "Presale Projects", "item": "https://presaleproperties.com/presale-projects" },
      { "@type": "ListItem", "position": 3, "name": cityName, "item": `https://presaleproperties.com/presale-projects/${citySlug}` }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": cityConfig.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen flex flex-col">
        <Helmet>
          <title>{cityConfig.metaTitle}</title>
          <meta name="description" content={cityConfig.metaDescription} />
          <link rel="canonical" href={`https://presaleproperties.com/presale-projects/${citySlug}`} />
          <meta property="og:title" content={cityConfig.metaTitle} />
          <meta property="og:description" content={cityConfig.metaDescription} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={`https://presaleproperties.com/presale-projects/${citySlug}`} />
          <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
          <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        </Helmet>

        <ConversionHeader />

        <main className="flex-grow">
          {/* Breadcrumbs */}
          <div className="container px-4 pt-4">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <Link to="/presale-projects" className="hover:text-foreground transition-colors">Presale Projects</Link>
              <span>/</span>
              <span className="text-foreground">{cityName}</span>
            </nav>
          </div>

          {/* Hero Section */}
          <section className="container px-4 py-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{cityConfig.h1}</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mb-6">
              {cityConfig.description}
            </p>

            {/* Property Type Quick Links */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Link to={`/presale-projects/${citySlug}/condos`}>
                <Button variant="outline" size="lg">
                  <Building2 className="h-4 w-4 mr-2" />
                  {cityName} Condos
                </Button>
              </Link>
              <Link to={`/presale-projects/${citySlug}/townhomes`}>
                <Button variant="outline" size="lg">
                  <Home className="h-4 w-4 mr-2" />
                  {cityName} Townhomes
                </Button>
              </Link>
              <Link to={`/map-search?city=${encodeURIComponent(cityName)}&mode=presale`}>
                <Button variant="outline" size="lg">
                  <Map className="h-4 w-4 mr-2" />
                  Map View
                </Button>
              </Link>
            </div>

            {/* Price Range Links */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-sm text-muted-foreground self-center mr-2">By Price:</span>
              <Link to={`/presale-projects/${citySlug}/condos-under-500k`}>
                <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10">Under $500K</Badge>
              </Link>
              <Link to={`/presale-projects/${citySlug}/condos-under-600k`}>
                <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10">Under $600K</Badge>
              </Link>
              <Link to={`/presale-projects/${citySlug}/condos-under-700k`}>
                <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10">Under $700K</Badge>
              </Link>
              <Link to={`/presale-projects/${citySlug}/condos-under-800k`}>
                <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10">Under $800K</Badge>
              </Link>
            </div>
          </section>

          {/* Filters & Grid */}
          <section className="container px-4 pb-8">
            {/* Desktop Filters */}
            <div className="hidden md:flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filters.priceRange} onValueChange={(v) => updateFilter("price", v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground ml-auto">
                {filteredProjects?.length || 0} projects
              </span>
            </div>

            {/* Mobile Filters */}
            <div className="md:hidden flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[60vh]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Price Range</label>
                      <Select value={filters.priceRange} onValueChange={(v) => { updateFilter("price", v); setMobileFiltersOpen(false); }}>
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
                      <label className="text-sm font-medium mb-2 block">Sort By</label>
                      <Select value={filters.sort} onValueChange={(v) => { updateFilter("sort", v); setMobileFiltersOpen(false); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Newest First" />
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

            {/* Project Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-[360px] rounded-xl" />
                ))}
              </div>
            ) : paginatedProjects && paginatedProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProjects.map((project) => (
                  <PresaleProjectCard
                    key={project.id}
                    id={project.id}
                    slug={project.slug}
                    name={project.name}
                    city={project.city}
                    neighborhood={project.neighborhood}
                    status={project.status}
                    projectType={project.project_type as "condo" | "townhome" | "mixed" | "duplex" | "single_family"}
                    startingPrice={project.starting_price}
                    completionYear={project.completion_year}
                    featuredImage={project.featured_image}
                    galleryImages={project.gallery_images}
                    lastVerifiedDate={project.last_verified_date}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-xl">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
                <p className="text-muted-foreground mb-6">
                  No presale projects match your criteria in {cityName}.
                </p>
                <Link to="/presale-projects">
                  <Button>Browse All Projects</Button>
                </Link>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </section>

          {/* Neighborhoods Section */}
          {cityConfig.neighborhoods.length > 0 && (
            <section className="container px-4 py-8 border-t">
              <h2 className="text-xl font-semibold mb-4">{cityName} Neighborhoods</h2>
              <div className="flex flex-wrap gap-2">
                {cityConfig.neighborhoods.map((neighborhood) => (
                  <Badge key={neighborhood} variant="outline" className="text-sm">
                    {neighborhood}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Internal Links - Other Cities */}
          <section className="container px-4 py-8 border-t">
            <h2 className="text-xl font-semibold mb-4">Presale Projects in Other Cities</h2>
            <div className="flex flex-wrap gap-2">
              {otherCities.map(([slug, config]) => (
                <Link key={slug} to={`/presale-projects/${slug}`}>
                  <Button variant="outline" size="sm">
                    {config.name}
                  </Button>
                </Link>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="container px-4 py-12 border-t">
            <h2 className="text-2xl font-bold mb-6">FAQ: Presale Projects in {cityName}</h2>
            <Accordion type="single" collapsible className="w-full max-w-3xl">
              {cityConfig.faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Long Description */}
          <section className="container px-4 py-8 border-t">
            <div className="prose prose-gray max-w-3xl">
              <p className="text-muted-foreground">{cityConfig.longDescription}</p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </PullToRefresh>
  );
}
