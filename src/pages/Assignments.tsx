import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { supabase } from "@/integrations/supabase/client";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AssignmentsHubFaq, type HubFaqItem } from "@/components/assignments/AssignmentsHubFaq";
import {
  MapPin, Bed, Bath, Maximize, Search,
  Building2, ArrowRight, X, Map, LayoutGrid,
  TrendingDown, DollarSign, BookOpen, MessageCircle,
  Calendar, Wallet, ShieldCheck, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";



interface Assignment {
  id: string;
  title: string;
  project_name: string;
  city: string;
  neighborhood: string | null;
  assignment_price: number;
  original_price: number | null;
  developer_credit: number | null;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  featured_image: string | null;
  photos: string[] | null;
  status: string;
  unit_number: string | null;
  estimated_completion: string | null;
  exposure: string | null;
  project_id: string | null;
  address: string | null;
  _project_featured_image?: string | null;
  _project_gallery_images?: string[] | null;
  map_lat?: number | null;
  map_lng?: number | null;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(price);

const CITY_OPTIONS = [
  "Vancouver", "Burnaby", "Richmond", "Surrey", "Coquitlam",
  "Port Moody", "Langley", "Abbotsford", "Delta", "New Westminster",
];

const PRICE_RANGES = [
  { label: "Any Price", min: 0, max: Infinity },
  { label: "Under $600K", min: 0, max: 600000 },
  { label: "$600K–$800K", min: 600000, max: 800000 },
  { label: "$800K–$1M", min: 800000, max: 1000000 },
  { label: "$1M–$1.5M", min: 1000000, max: 1500000 },
  { label: "$1.5M+", min: 1500000, max: Infinity },
];

const QUICK_ACTIONS = [
  {
    icon: LayoutGrid,
    title: "Browse listings",
    body: "All active assignments — pre-vetted, below new pricing.",
    href: "#listings",
    cta: "See inventory",
    accent: "primary" as const,
  },
  {
    icon: DollarSign,
    title: "Sell your assignment",
    body: "Free valuation. Full representation. 24h response.",
    href: "/assignments/sell-your-assignment",
    cta: "Get valuation",
    accent: "primary" as const,
  },
  {
    icon: BookOpen,
    title: "Buying guide",
    body: "Costs, risks, timeline, GST, deposits — explained.",
    href: "/assignments/buying-an-assignment",
    cta: "Read guide",
    accent: "muted" as const,
  },
  {
    icon: MessageCircle,
    title: "Talk to Uzair",
    body: "15-minute call. No pitch — just straight answers.",
    href: "/contact",
    cta: "Book a call",
    accent: "muted" as const,
  },
];

const WHY_BUY = [
  { icon: TrendingDown, title: "Below new pricing", body: "Typically 3–10% under current developer prices for the same floor plan." },
  { icon: Calendar, title: "Move in sooner", body: "6–18 months to completion vs. 3–4 years on a brand-new presale." },
  { icon: Wallet, title: "Deposits already paid", body: "Original buyer carried the early deposit cycles — you step in further along." },
  { icon: ShieldCheck, title: "2-5-10 warranty intact", body: "Full home warranty transfers with the contract — same coverage as new." },
];

const HUB_FAQS: HubFaqItem[] = [
  // GENERAL
  { topic: "general", q: "What is a presale assignment?", a: "When the original buyer of a pre-construction home transfers their purchase contract to a new buyer before the building completes. The new buyer steps into the original contract and closes with the developer once the building is built." },
  { topic: "general", q: "Do I need the developer’s permission to assign?", a: "Almost always, yes. BC developers require written consent. Some restrict marketing (no MLS) or limit the number of assignments per unit. We know each developer’s policy and handle the submission." },
  { topic: "general", q: "What is an assignment fee?", a: "A fee the developer charges to process the paperwork. It ranges from a few hundred dollars to 1–5% of the original purchase price. The seller (assignor) typically pays it, but it’s negotiable." },
  { topic: "general", q: "Can I list an assignment on MLS / Realtor.ca?", a: "Depends on the developer. In Vancouver and inner suburbs, most developers prohibit MLS listings. In the Fraser Valley (Surrey, Langley, Abbotsford, Coquitlam), many allow it. We confirm before marketing." },

  // BUYING
  { topic: "buying", q: "Are assignments cheaper than buying new from the developer?", a: "Usually yes — assuming the market has been flat or declining since the original purchase. The gap between the original contract price and the current developer price is where buyer and seller meet." },
  { topic: "buying", q: "What are the main benefits of buying an assignment?", a: [
    "Lower price than current developer pricing.",
    "Building is further along (less construction risk).",
    "Faster move-in timeline.",
    "Often better floor plans or views that already sold out in new inventory.",
    "2-5-10 home warranty still applies to you.",
  ]},
  { topic: "buying", q: "What are the risks of buying an assignment?", a: [
    "You take the contract \"as-is\" — including any clauses the original buyer signed.",
    "If the building gets delayed, you’re bound by the original completion date rules.",
    "GST on the assignment amount is usually the buyer’s responsibility.",
    "You need to requalify for a mortgage based on current rates.",
  ]},
  { topic: "buying", q: "How much deposit do I need as the buyer?", a: "Two layers: (1) reimburse the seller for the deposits already paid to the developer (typically 15–20% of contract price), and (2) cover any remaining deposits required by the developer before completion. A mortgage covers the balance at final closing." },
  { topic: "buying", q: "Do I get the GST rebate as an assignee?", a: "Yes, if you intend to live in the unit as your primary residence, you qualify for the BC New Housing Rebate the same as any first buyer. Investors can claim the New Residential Rental Property Rebate after closing if they rent for at least 12 months." },
  { topic: "buying", q: "Do I pay Property Transfer Tax?", a: "Yes. PTT is paid by the assignee (buyer) on the developer’s completion date, calculated on the full purchase price. First-time buyers may qualify for partial exemption depending on the price." },
  { topic: "buying", q: "Can I get a mortgage on an assignment?", a: "Yes. Most major banks lend on assignments, but they often require stronger credit, larger down payments (20%+), and proof of income. The mortgage is based on the assignment price, not the original contract price. Pre-approve before shopping." },

  // SELLING
  { topic: "selling", q: "How much can I sell my assignment for?", a: "Three numbers matter: (1) your original contract price, (2) the current developer price for the same floor plan, and (3) recent comparable assignment or resale comps. Your assignment price usually lands between original and current — discounted slightly because the buyer takes the contract as-is." },
  { topic: "selling", q: "How long does it take to sell an assignment?", a: "Expect 2–4 months from listing to accepted offer, depending on price, market conditions, and the developer’s marketing restrictions. Closing happens 30–60 days after offer acceptance." },
  { topic: "selling", q: "What are the tax implications of selling?", a: [
    "GST: As of May 2022, CRA applies 5% GST on all assignment sales of new residential properties — calculated on the assignment amount (your profit), not the full price.",
    "Income tax vs. capital gains: CRA typically treats assignment profit as business income (100% taxable) unless you can prove you intended to live in the unit.",
    "Anti-flipping rule: held under 12 months = automatic business income, no principal residence exemption.",
    "We are not accountants — talk to a CPA before accepting an offer.",
  ]},
  { topic: "selling", q: "What happens to my deposit when the assignment closes?", a: "On assignment completion, the new buyer pays your lawyer: (a) your original deposits back, plus (b) the uplift (the profit you negotiated). Your lawyer pays the developer’s assignment fee and taxes, then releases the balance to you." },
  { topic: "selling", q: "What if the market has dropped since I bought?", a: "You have three options: (1) sell at a loss and free up the capital, (2) hold through completion and rent it out, or (3) complete and flip as a resale. We model each scenario on the free valuation call." },
];

function AssignmentCard({ listing }: { listing: Assignment }) {
  const photo = listing.photos?.[0] || listing.featured_image || listing._project_gallery_images?.[0] || listing._project_featured_image;
  const savings = listing.original_price && listing.original_price > listing.assignment_price
    ? listing.original_price - listing.assignment_price : null;
  const credit = listing.developer_credit && listing.developer_credit > 0 ? listing.developer_credit : null;

  return (
    <Link to={`/assignments/${listing.id}`} className="group rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200">
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Building2 className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-1.5rem)]">
          <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px] px-2">Assignment</Badge>
          {savings && savings > 0 && (
            <Badge className="bg-green-600 hover:bg-green-600 text-white text-[10px] px-2">
              Save {formatPrice(savings)}
            </Badge>
          )}
          {credit && (
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] px-2 gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              {formatPrice(credit)} Credit
            </Badge>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xl font-bold text-foreground">{formatPrice(listing.assignment_price)}</p>
            {listing.original_price && (
              <p className="text-xs text-muted-foreground line-through">{formatPrice(listing.original_price)}</p>
            )}
          </div>
          {listing.unit_number && (
            <Badge variant="outline" className="text-[10px]">Unit {listing.unit_number}</Badge>
          )}
        </div>
        <p className="font-semibold text-sm text-foreground truncate mb-1">{listing.title || listing.project_name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{listing.neighborhood || listing.city}, {listing.city}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{listing.beds} bed</span>
          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{listing.baths} bath</span>
          {listing.interior_sqft && (
            <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{listing.interior_sqft.toLocaleString()} sqft</span>
          )}
        </div>
        <Button size="sm" className="w-full gap-1.5 h-9 text-xs font-semibold">
          View Full Details <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Link>
  );
}

const SECTIONS = [
  { id: "listings", label: "Listings" },
  { id: "why", label: "Why Assignments" },
  { id: "process", label: "How It Works" },
  { id: "faq", label: "FAQ" },
];

function StickySubNav() {
  const [active, setActive] = useState<string>("listings");

  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-16 z-30 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="container px-4">
        <nav className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1" aria-label="Page sections">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={cn(
                "shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap",
                active === s.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default function Assignments() {
  const [searchParams, setSearchParams] = useSearchParams();

  const cityFilter = searchParams.get("city") || "any";
  const bedsFilter = searchParams.get("beds") || "any";
  const priceFilter = searchParams.get("price") || "any";
  const neighborhoodFilter = searchParams.get("neighbourhood") || "any";
  const searchQuery = searchParams.get("q") || "";

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "any" || value === "") next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["assignments-browse"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("listings")
        .select("id, title, project_name, city, neighborhood, assignment_price, original_price, developer_credit, beds, baths, interior_sqft, featured_image, photos, status, unit_number, estimated_completion, exposure, project_id, address")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const projectIds = [...new Set((data || []).map((l: any) => l.project_id).filter(Boolean))];
      const projectMap: Record<string, { featured_image: string | null; gallery_images: string[] | null; map_lat: number | null; map_lng: number | null }> = {};
      if (projectIds.length > 0) {
        const { data: projects } = await (supabase as any)
          .from("presale_projects")
          .select("id, featured_image, gallery_images, map_lat, map_lng")
          .in("id", projectIds);
        (projects || []).forEach((p: any) => { projectMap[p.id] = p; });
      }

      return (data || []).map((l: any) => {
        const proj = l.project_id ? projectMap[l.project_id] : null;
        return {
          ...l,
          _project_featured_image: proj?.featured_image || null,
          _project_gallery_images: proj?.gallery_images || null,
          map_lat: proj?.map_lat || null,
          map_lng: proj?.map_lng || null,
        };
      }) as Assignment[];
    },
  });

  const neighbourhoods = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => { if (l.neighborhood) set.add(l.neighborhood); });
    return Array.from(set).sort();
  }, [listings]);

  const selectedPriceRange = PRICE_RANGES.find((r) => r.label === priceFilter) || PRICE_RANGES[0];

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (cityFilter !== "any" && l.city !== cityFilter) return false;
      if (bedsFilter !== "any" && String(l.beds) !== bedsFilter) return false;
      if (neighborhoodFilter !== "any" && l.neighborhood !== neighborhoodFilter) return false;
      if (selectedPriceRange.max !== Infinity || selectedPriceRange.min > 0) {
        if (l.assignment_price < selectedPriceRange.min || l.assignment_price > selectedPriceRange.max) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = [l.project_name, l.city, l.neighborhood, l.address].filter(Boolean).join(" ").toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [listings, cityFilter, bedsFilter, neighborhoodFilter, selectedPriceRange, searchQuery]);

  const mapAssignments = useMemo(() =>
    filtered.map((l) => ({
      id: l.id, title: l.title, project_name: l.project_name, city: l.city,
      neighborhood: l.neighborhood, assignment_price: l.assignment_price,
      original_price: l.original_price, beds: l.beds, baths: l.baths,
      interior_sqft: l.interior_sqft, map_lat: l.map_lat || null, map_lng: l.map_lng || null,
    })),
    [filtered]
  );

  const activeFilterCount = [
    cityFilter !== "any", bedsFilter !== "any", priceFilter !== "any",
    neighborhoodFilter !== "any", !!searchQuery,
  ].filter(Boolean).length;

  const clearFilters = () => setSearchParams({}, { replace: true });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Assignment Sales in Metro Vancouver | PresaleProperties</title>
        <meta name="description" content="Browse presale assignment sales in Metro Vancouver & Fraser Valley. Buying, selling, FAQ, and live inventory — all in one place." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href="https://presaleproperties.com/assignments" />
        <meta property="og:title" content="Assignment Sales in Metro Vancouver | PresaleProperties" />
        <meta property="og:description" content="Browse presale assignment sales in Metro Vancouver & Fraser Valley." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://presaleproperties.com/assignments" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "ItemList",
          name: "Presale Assignment Sales — Metro Vancouver",
          description: "Browse presale condo and townhome assignment sales across Metro Vancouver and Fraser Valley, BC.",
          url: "https://presaleproperties.com/assignments",
          itemListOrder: "https://schema.org/ItemListOrderDescending",
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://presaleproperties.com" },
            { "@type": "ListItem", position: 2, name: "Assignments", item: "https://presaleproperties.com/assignments" },
          ],
        })}</script>
      </Helmet>

      <ConversionHeader />

      <main>
        {/* HERO — simplified, action-first */}
        <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground to-foreground/95 text-background">
          <div className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,_hsl(var(--background))_1px,_transparent_0)] [background-size:24px_24px]" />
          <div className="pointer-events-none absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-40 -left-24 h-[360px] w-[360px] rounded-full bg-primary/10 blur-[120px]" />

          <div className="container relative px-4 py-10 sm:py-14 lg:py-16">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-background/60 mb-5">
              <Link to="/" className="hover:text-background transition-colors">Home</Link>
              <span aria-hidden>/</span>
              <span className="text-background/85">Assignments</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/[0.04] px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-primary mb-4 backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />
                Live Assignment Inventory
              </span>
              <h1 className="text-[2rem] sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.05] mb-4 text-balance">
                Presale Assignments in BC
              </h1>
              <p className="text-base sm:text-lg text-background/75 leading-relaxed max-w-2xl text-pretty mb-6">
                Below-market new construction. Move in sooner. Browse the live map, filter by city or budget, and connect directly.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="font-semibold gap-2 shadow-lg shadow-primary/20">
                  <a href="#listings">Browse inventory <ArrowRight className="h-4 w-4" /></a>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent border-background/30 text-background hover:bg-background hover:text-foreground font-semibold">
                  <Link to="/assignments/sell-your-assignment">Sell my assignment</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky in-page nav */}
        <StickySubNav />

        {/* LISTINGS — grid first, map as a side option */}
        <section id="listings" className="container px-4 py-10 lg:py-14 scroll-mt-32">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-2">Find Your Assignment</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                Browse the live inventory
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 hidden sm:block">
                Filter by city, beds, or budget — or open the full map to explore by location.
              </p>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {isLoading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "assignment" : "assignments"}`}
            </p>
          </div>

          {/* Filter Bar */}
          <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 mb-4 shadow-sm">
            <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search project, city, address..."
                  value={searchQuery}
                  onChange={(e) => setFilter("q", e.target.value)}
                  className="pl-9 h-10 bg-background"
                />
              </div>

              <Select value={cityFilter} onValueChange={(v) => setFilter("city", v)}>
                <SelectTrigger className="w-[130px] h-10 bg-background"><SelectValue placeholder="City" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">All Cities</SelectItem>
                  {CITY_OPTIONS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>

              {neighbourhoods.length > 0 && (
                <Select value={neighborhoodFilter} onValueChange={(v) => setFilter("neighbourhood", v)}>
                  <SelectTrigger className="w-[150px] h-10 bg-background"><SelectValue placeholder="Neighbourhood" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">All Neighbourhoods</SelectItem>
                    {neighbourhoods.map((n) => (<SelectItem key={n} value={n}>{n}</SelectItem>))}
                  </SelectContent>
                </Select>
              )}

              <Select value={bedsFilter} onValueChange={(v) => setFilter("beds", v)}>
                <SelectTrigger className="w-[110px] h-10 bg-background"><SelectValue placeholder="Beds" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Beds</SelectItem>
                  {[1, 2, 3, 4].map((b) => (<SelectItem key={b} value={String(b)}>{b} Bed{b > 1 ? "s" : ""}</SelectItem>))}
                </SelectContent>
              </Select>

              <Select value={priceFilter} onValueChange={(v) => setFilter("price", v)}>
                <SelectTrigger className="w-[150px] h-10 bg-background"><SelectValue placeholder="Price Range" /></SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((r) => (<SelectItem key={r.label} value={r.label}>{r.label}</SelectItem>))}
                </SelectContent>
              </Select>

              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 gap-1.5 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" /> Clear
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{activeFilterCount}</Badge>
                </Button>
              )}

              <Button asChild variant="outline" size="sm" className="h-10 gap-1.5 ml-auto font-semibold">
                <Link to="/map-search?mode=assignments">
                  <Map className="h-3.5 w-3.5" /> Open map view
                </Link>
              </Button>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border overflow-hidden">
                  <Skeleton className="aspect-[16/10] w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-9 w-full mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-1">No assignments found</p>
              <p className="text-sm mb-4">Try adjusting your filters or check back soon for new listings.</p>
              {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((listing) => (<AssignmentCard key={listing.id} listing={listing} />))}
              </div>

              {/* Map CTA — explore by location */}
              <Link
                to="/map-search?mode=assignments"
                className="group mt-10 block rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card hover:border-primary/40 hover:shadow-md transition-all p-6 sm:p-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                    <Map className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                      Prefer to explore by location?
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Open the full interactive map to see every assignment plotted by neighbourhood, with pricing, beds, and instant filters.
                    </p>
                  </div>
                  <Button size="lg" className="shrink-0 font-semibold gap-2 w-full sm:w-auto">
                    Open full map <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </Link>
            </>
          )}
        </section>

        {/* WHY ASSIGNMENTS */}
        <section id="why" className="bg-gradient-to-b from-muted/40 to-background border-y border-border py-16 sm:py-20 lg:py-24 scroll-mt-32">
          <div className="container px-4">
            <div className="max-w-3xl mb-10 sm:mb-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-3">Why Assignments</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight text-balance">
                The smartest way to buy new construction in BC
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {WHY_BUY.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="group relative rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-4 ring-1 ring-primary/10 group-hover:ring-primary/30 transition-all">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5 leading-snug">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section id="process" className="bg-background py-16 sm:py-20 lg:py-24 scroll-mt-32">
          <div className="container px-4">
            <div className="max-w-3xl mb-10 sm:mb-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-3">How It Works</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-3 text-balance">
                Buying or selling — same playbook
              </h2>
              <p className="text-muted-foreground leading-relaxed sm:text-lg text-pretty">
                Whether you’re stepping in or stepping out, the path is short and predictable.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 max-w-5xl">
              {/* Buyers path */}
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">If you’re buying</h3>
                </div>
                <ol className="space-y-3 text-sm sm:text-base text-muted-foreground">
                  {[
                    "Pre-approve for an assignment-friendly mortgage.",
                    "Browse our vetted inventory or share your criteria.",
                    "Review the contract, disclosure, and deposit ledger.",
                    "Negotiate price and terms — we represent you.",
                    "Submit to developer for written consent.",
                    "Pay deposits + uplift through your lawyer.",
                    "Close with the developer when the building completes.",
                  ].map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center tabular-nums mt-0.5">{i + 1}</span>
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ol>
                <Button asChild variant="outline" className="mt-6 w-full sm:w-auto font-semibold">
                  <Link to="/assignments/buying-an-assignment">Read the full buying guide <ArrowRight className="h-4 w-4 ml-1" /></Link>
                </Button>
              </div>

              {/* Sellers path */}
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">If you’re selling</h3>
                </div>
                <ol className="space-y-3 text-sm sm:text-base text-muted-foreground">
                  {[
                    "Free 15-min valuation call — we pull comps.",
                    "We review your contract and developer’s policy.",
                    "Get developer consent (we handle the paperwork).",
                    "Marketing strategy — MLS, private network, or both.",
                    "We negotiate offers and represent you exclusively.",
                    "Assignment paperwork and deposit transfer.",
                    "Close in 30–60 days and get your uplift.",
                  ].map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center tabular-nums mt-0.5">{i + 1}</span>
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ol>
                <Button asChild className="mt-6 w-full sm:w-auto font-semibold">
                  <Link to="/assignments/sell-your-assignment">Get a free valuation <ArrowRight className="h-4 w-4 ml-1" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <AssignmentsHubFaq faqs={HUB_FAQS} />

        {/* Final CTA */}
        <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground to-foreground/95 text-background py-16 sm:py-20">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-primary/15 blur-[120px]" />
          <div className="container relative px-4 max-w-3xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-4">Still have questions?</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-balance">
              Talk to Uzair — straight answers, no pitch
            </h2>
            <p className="text-background/70 mb-8 text-base sm:text-lg leading-relaxed max-w-xl mx-auto text-pretty">
              15 minutes. We’ll tell you whether an assignment is the right move, and what it’s worth.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="font-semibold gap-2 w-full sm:w-auto shadow-lg shadow-primary/20">
                <Link to="/contact">Book a 15-min call <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-background/30 text-background hover:bg-background hover:text-foreground font-semibold w-full sm:w-auto"
              >
                <Link to="/assignments/sell-your-assignment">Sell my assignment</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
