import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { ChevronRight, Building2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { PresaleProjectCard } from "@/components/listings/PresaleProjectCard";
import { supabase } from "@/integrations/supabase/client";

// City name mapping
const CITY_NAMES: Record<string, string> = {
  surrey: "Surrey",
  langley: "Langley",
  coquitlam: "Coquitlam",
  burnaby: "Burnaby",
  vancouver: "Vancouver",
  richmond: "Richmond",
  delta: "Delta",
  abbotsford: "Abbotsford",
  "port-coquitlam": "Port Coquitlam",
  "port-moody": "Port Moody",
  "new-westminster": "New Westminster",
  "north-vancouver": "North Vancouver",
  "white-rock": "White Rock",
  "maple-ridge": "Maple Ridge",
  chilliwack: "Chilliwack",
};

// Price points
const PRICE_POINTS = [500, 600, 700, 800, 900, 1000];

const formatPriceLabel = (priceK: number) => priceK >= 1000 ? `$${priceK / 1000}M` : `$${priceK}K`;

/**
 * SEO Page: /presale-projects/{city}/{type} AND /presale-projects/{city}/{type}-under-{price}k
 * Examples: /presale-projects/surrey/condos
 *           /presale-projects/surrey/condos-under-500k
 */
export default function PresaleCityTypePricePage() {
  const { citySlug, typePriceSlug } = useParams<{ citySlug: string; typePriceSlug: string }>();
  const [sortBy, setSortBy] = useState("price-low");

  // Parse the type-price slug:
  //   - plain type: "condos" | "townhomes"
  //   - with price:  "condos-under-500k" | "townhomes-under-700k"
  const priceMatch = typePriceSlug?.match(/^(condos|townhomes)-under-(\d+)k$/);
  const plainMatch = typePriceSlug?.match(/^(condos|townhomes)$/);

  const typeSlug = priceMatch?.[1] || plainMatch?.[1] || null;
  const priceK = priceMatch?.[2] ? parseInt(priceMatch[2]) : null;
  const maxPrice = priceK ? priceK * 1000 : null;
  const hasPriceFilter = !!maxPrice;

  const cityName = citySlug ? CITY_NAMES[citySlug] : null;
  const isCondos = typeSlug === "condos";
  const productType = isCondos ? "condo" : "townhome";
  const productLabel = isCondos ? "Condos" : "Townhomes";

  // Fetch projects — no price filter when plain /condos or /townhomes
  const { data: projects, isLoading } = useQuery({
    queryKey: ["city-type-price-projects", citySlug, productType, maxPrice],
    queryFn: async () => {
      if (!cityName || !productType) return [];

      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image, gallery_images, is_featured, last_verified_date")
        .eq("is_published", true)
        .ilike("city", cityName)
        .eq("project_type", productType);

      if (maxPrice) {
        query = query.not("starting_price", "is", null).lte("starting_price", maxPrice);
      }

      const { data, error } = await query.order("starting_price", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!cityName && !!productType,
  });

  // Sort projects
  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    
    const sorted = [...projects];
    switch (sortBy) {
      case "price-high":
        return sorted.sort((a, b) => (b.starting_price || 0) - (a.starting_price || 0));
      case "completion":
        return sorted.sort((a, b) => (a.completion_year || Infinity) - (b.completion_year || Infinity));
      default:
        return sorted.sort((a, b) => (a.starting_price || Infinity) - (b.starting_price || Infinity));
    }
  }, [projects, sortBy]);

  // 404 if invalid parameters
  if (!cityName || !typeSlug) {
    return (
      <div className="min-h-screen flex flex-col">
        <ConversionHeader />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
            <Link to="/presale-projects">
              <Button>View All Projects</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const priceLabel = priceK ? formatPriceLabel(priceK) : null;

  const metaTitle = hasPriceFilter
    ? `Presale ${productLabel} Under ${priceLabel} in ${cityName} (2026 Guide)`
    : `${cityName} Presale ${productLabel} 2026 | New Construction`;
  // Custom meta descriptions for key pages
  const customDescriptions: Record<string, string> = {
    "surrey-condos": "Browse new presale condos in Surrey, BC. Get VIP pricing, floor plans and early access to upcoming developments. Updated weekly.",
    "burnaby-condos": "Browse new presale condos in Burnaby, BC. Get VIP pricing, floor plans and early access to Metrotown, Brentwood and Lougheed projects.",
  };
  const descKey = `${citySlug}-${typeSlug}`;
  const metaDescription = customDescriptions[descKey]
    || (hasPriceFilter
      ? `Browse all presale ${productType}s under ${priceLabel} in ${cityName}, BC. Updated pricing, floor plans, deposit structures & expert guidance.`
      : `Browse all presale ${productType}s in ${cityName}, BC. Compare new construction projects, floor plans, pricing & get VIP early access.`);

  // Build structured data
  const breadcrumbItems: any[] = [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com/" },
    { "@type": "ListItem", "position": 2, "name": "Presale Projects", "item": "https://presaleproperties.com/presale-projects" },
    { "@type": "ListItem", "position": 3, "name": cityName, "item": `https://presaleproperties.com/presale-projects/${citySlug}` },
    { "@type": "ListItem", "position": 4, "name": productLabel, "item": `https://presaleproperties.com/presale-projects/${citySlug}/${typeSlug}` },
  ];
  if (hasPriceFilter) {
    breadcrumbItems.push({ "@type": "ListItem", "position": 5, "name": `Under ${priceLabel}`, "item": `https://presaleproperties.com/presale-projects/${citySlug}/${typePriceSlug}` });
  }
  const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": breadcrumbItems };

  const faqs = hasPriceFilter
    ? [
        {
          question: `What presale ${productType}s in ${cityName} are under ${priceLabel}?`,
          answer: `We list all ${cityName} presale ${productType}s with starting prices under ${priceLabel}. Availability changes as projects sell, so register early for VIP access.`
        },
        {
          question: `What deposit is required for ${cityName} presales under ${priceLabel}?`,
          answer: `Most presales in this price range require 10-20% deposits paid over 12-18 months. Lower-priced projects often have more flexible deposit structures.`
        },
      ]
    : [
        {
          question: `What are the best presale ${productType}s in ${cityName}?`,
          answer: `We list all active presale ${productType}s in ${cityName}. Browse floor plans, pricing, and register for VIP access to get early pricing before public launch.`
        },
        {
          question: `How do I buy a presale ${productType} in ${cityName}?`,
          answer: `Contact our team for VIP access. We'll walk you through the deposit structure, contract terms, and help you choose the best unit for your needs.`
        },
      ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
    }))
  };

  // Other price points
  const otherPricePoints = PRICE_POINTS.filter(p => p !== priceK);

  // Other cities
  const otherCities = Object.entries(CITY_NAMES)
    .filter(([slug]) => slug !== citySlug)
    .slice(0, 6);

  // Noindex when zero results
  const hasResults = sortedProjects.length > 0;
  const robotsContent = hasResults
    ? "index, follow, max-image-preview:large, max-snippet:-1"
    : "noindex, follow";

  const canonicalPath = hasPriceFilter
    ? `https://presaleproperties.com/presale-projects/${citySlug}/${typePriceSlug}`
    : `https://presaleproperties.com/presale-projects/${citySlug}/${typeSlug}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="robots" content={robotsContent} />
        <link rel="canonical" href={canonicalPath} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <ConversionHeader />

      <main className="flex-grow">
        {/* Breadcrumbs */}
        <div className="container px-4 pt-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/presale-projects" className="hover:text-foreground transition-colors">Presale Projects</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/presale-projects/${citySlug}`} className="hover:text-foreground transition-colors">{cityName}</Link>
            <ChevronRight className="h-4 w-4" />
            {hasPriceFilter ? (
              <>
                <Link to={`/presale-projects/${citySlug}/${typeSlug}`} className="hover:text-foreground transition-colors">{productLabel}</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">Under {priceLabel}</span>
              </>
            ) : (
              <span className="text-foreground">{productLabel}</span>
            )}
          </nav>
        </div>

        {/* Hero Section */}
        <section className="container px-4 py-8 md:py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              {isCondos ? <Building2 className="h-6 w-6 text-primary" /> : <Home className="h-6 w-6 text-primary" />}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">
              {hasPriceFilter
                ? `Presale ${productLabel} Under ${priceLabel} in ${cityName}`
                : `${cityName} Presale ${productLabel}`}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mb-6">
            {hasPriceFilter
              ? `Looking for an affordable presale ${productType} in ${cityName}? Browse all new construction ${productType}s with starting prices under ${priceLabel}. Get VIP access to floor plans, pricing sheets, and early registration.`
              : `Browse all presale ${productType}s in ${cityName}, BC. Compare new developments, floor plans, and deposit structures — register early for VIP pricing.`}
          </p>

          {/* Type switcher */}
          <div className="flex gap-2 mb-6">
            <Link to={`/presale-projects/${citySlug}/condos`}>
              <Button variant={isCondos ? "default" : "outline"} size="sm">
                <Building2 className="h-4 w-4 mr-2" />
                Condos
              </Button>
            </Link>
            <Link to={`/presale-projects/${citySlug}/townhomes`}>
              <Button variant={!isCondos ? "default" : "outline"} size="sm">
                <Home className="h-4 w-4 mr-2" />
                Townhomes
              </Button>
            </Link>
          </div>

          {/* Price point quick links */}
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="text-sm text-muted-foreground self-center mr-2">Filter by price:</span>
            <Link to={`/presale-projects/${citySlug}/${typeSlug}`}>
              <Button variant={!hasPriceFilter ? "default" : "outline"} size="sm">All Prices</Button>
            </Link>
            {PRICE_POINTS.map((price) => (
              <Link key={price} to={`/presale-projects/${citySlug}/${typeSlug}-under-${price}k`}>
                <Button variant={price === priceK ? "default" : "outline"} size="sm">
                  Under {formatPriceLabel(price)}
                </Button>
              </Link>
            ))}
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border rounded px-3 py-1.5 bg-background"
            >
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="completion">Completion Soonest</option>
            </select>
            <span className="text-sm text-muted-foreground ml-auto">
              {sortedProjects.length} project{sortedProjects.length !== 1 ? "s" : ""} found
            </span>
          </div>
        </section>

        {/* Project Grid */}
        <section className="container px-4 pb-12">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[360px] rounded-xl" />
              ))}
            </div>
          ) : sortedProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProjects.map((project) => (
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
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {hasPriceFilter ? `No ${productLabel} Under ${priceLabel}` : `No ${productLabel} Listed Yet`}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {hasPriceFilter
                  ? `We don't currently have ${cityName} ${productType}s with starting prices under ${priceLabel}. Try a higher price point or browse all projects.`
                  : `We don't currently have active presale ${productType}s listed in ${cityName}. Browse all presale projects or check back soon.`}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {hasPriceFilter && otherPricePoints.slice(0, 3).map((price) => (
                  <Link key={price} to={`/presale-projects/${citySlug}/${typeSlug}-under-${price}k`}>
                    <Button variant="outline" size="sm">Under {formatPriceLabel(price)}</Button>
                  </Link>
                ))}
                <Link to={`/presale-projects/${citySlug}`}>
                  <Button>All {cityName} Presales</Button>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Other Cities */}
        <section className="container px-4 py-12 border-t">
          <h2 className="text-xl font-semibold mb-6">
            {hasPriceFilter ? `${productLabel} Under ${priceLabel} in Other Cities` : `${productLabel} in Other Cities`}
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherCities.map(([slug, name]) => (
              <Link key={slug} to={hasPriceFilter ? `/presale-projects/${slug}/${typeSlug}-under-${priceK}k` : `/presale-projects/${slug}/${typeSlug}`}>
                <Button variant="outline" size="sm">{name}</Button>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container px-4 py-12 border-t">
          <h2 className="text-2xl font-bold mb-6">
            {hasPriceFilter ? `FAQ: Affordable Presale ${productLabel} in ${cityName}` : `FAQ: Presale ${productLabel} in ${cityName}`}
          </h2>
          <Accordion type="single" collapsible className="w-full max-w-3xl">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Internal Links */}
        <section className="container px-4 py-12 border-t">
          <h2 className="text-xl font-semibold mb-6">Explore More</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to={`/presale-projects/${citySlug}`} className="text-sm text-primary hover:underline">All {cityName} Presales</Link>
            <Link to={`/presale-projects/${citySlug}/${isCondos ? "townhomes" : "condos"}`} className="text-sm text-primary hover:underline">{cityName} {isCondos ? "Townhomes" : "Condos"}</Link>
            <Link to="/buyers-guide" className="text-sm text-primary hover:underline">Presale Buyer's Guide</Link>
            <Link to="/mortgage-calculator" className="text-sm text-primary hover:underline">Mortgage Calculator</Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
