import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { ChevronRight, Building2, Home, MapPin, DollarSign, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

// Price point configurations
const PRICE_POINTS = [500, 600, 700, 800, 900, 1000] as const;

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
  "new-westminster": "New Westminster",
};

const formatPriceLabel = (priceK: number) => {
  if (priceK >= 1000) {
    return `$${priceK / 1000}M`;
  }
  return `$${priceK}K`;
};

const generatePageConfig = (priceK: number, citySlug: string, productType: "condos" | "townhomes") => {
  const cityName = CITY_NAMES[citySlug] || citySlug.charAt(0).toUpperCase() + citySlug.slice(1).replace(/-/g, ' ');
  const priceLabel = formatPriceLabel(priceK);
  const productLabel = productType === "condos" ? "Condos" : "Townhomes";
  const productSingular = productType === "condos" ? "condo" : "townhome";
  
  return {
    metaTitle: `Presale ${productLabel} Under ${priceLabel} in ${cityName} | PresaleProperties`,
    metaDescription: `Find affordable presale ${productType} under ${priceLabel} in ${cityName}, BC. Browse new construction with VIP pricing, floorplans & deposit structures for budget-conscious buyers.`,
    h1: `Presale ${productLabel} Under ${priceLabel} in ${cityName}`,
    intro: `Looking for an affordable presale ${productSingular} in ${cityName}? Browse all new construction ${productType} with starting prices under ${priceLabel}. Get VIP access to floorplans, pricing sheets, and early registration.`,
    cityName,
    priceK,
    productType,
    faqs: [
      {
        question: `What presale ${productType} in ${cityName} are under ${priceLabel}?`,
        answer: `We list all ${cityName} presale ${productType} with starting prices under ${priceLabel}. Availability changes as projects sell, so register early for VIP access to the best units and pricing.`
      },
      {
        question: `What deposit is required for ${cityName} presales under ${priceLabel}?`,
        answer: `Most presales in this price range require 10-20% deposits paid over 12-18 months. Lower-priced projects often have more flexible deposit structures to attract first-time buyers.`
      },
      {
        question: `Are affordable ${cityName} ${productType} a good investment?`,
        answer: `Entry-level presales can offer strong appreciation as buyers seek affordability. Consider factors like transit access, completion timeline, and rental potential when evaluating investment value.`
      }
    ]
  };
};

export default function PriceBasedPage() {
  const { pricePoint, citySlug } = useParams<{ 
    pricePoint: string; 
    citySlug: string; 
  }>();
  const [sortBy, setSortBy] = useState("price-low");

  // Determine product type from URL path
  const pathname = window.location.pathname;
  const productType = pathname.includes("townhomes") ? "townhomes" : "condos";

  // Parse price from URL (e.g., "700k" -> 700000)
  const priceK = pricePoint ? parseInt(pricePoint.replace(/k/i, '')) : null;
  const maxPrice = priceK ? priceK * 1000 : null;

  // Generate page configuration
  const config = priceK && citySlug && productType
    ? generatePageConfig(priceK, citySlug, productType) 
    : null;

  // Fetch projects filtered by city, product type, and price
  const { data: projects, isLoading } = useQuery({
    queryKey: ["price-based-projects", citySlug, productType, maxPrice],
    queryFn: async () => {
      if (!config || !maxPrice) return [];
      
      const dbProductType = config.productType === "townhomes" ? "townhome" : "condo";
      
      const { data, error } = await supabase
        .from("presale_projects")
        .select("*")
        .eq("is_published", true)
        .ilike("city", config.cityName)
        .eq("project_type", dbProductType)
        .not("starting_price", "is", null)
        .lte("starting_price", maxPrice)
        .order("starting_price", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!config && !!maxPrice,
  });

  // Sort projects
  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    
    const sorted = [...projects];
    switch (sortBy) {
      case "price-high":
        return sorted.sort((a, b) => (b.starting_price || 0) - (a.starting_price || 0));
      case "completion":
        return sorted.sort((a, b) => {
          const aDate = a.completion_year ? a.completion_year * 12 + (a.completion_month || 0) : Infinity;
          const bDate = b.completion_year ? b.completion_year * 12 + (b.completion_month || 0) : Infinity;
          return aDate - bDate;
        });
      case "newest":
        return sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      default: // price-low
        return sorted.sort((a, b) => (a.starting_price || Infinity) - (b.starting_price || Infinity));
    }
  }, [projects, sortBy]);

  // 404 if invalid parameters
  if (!config || !maxPrice) {
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

  const priceLabel = formatPriceLabel(priceK!);

  // Build structured data for FAQ
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": config.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  // Build breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com/" },
      { "@type": "ListItem", "position": 2, "name": "Presale Projects", "item": "https://presaleproperties.com/presale-projects" },
      { "@type": "ListItem", "position": 3, "name": `${config.cityName} Presales`, "item": `https://presaleproperties.com/presale-condos/${citySlug}` },
      { "@type": "ListItem", "position": 4, "name": `Under ${priceLabel}`, "item": `https://presaleproperties.com/presale-${productType}-under-${pricePoint}-${citySlug}` }
    ]
  };

  // Other price points for this city
  const otherPricePoints = PRICE_POINTS.filter(p => p !== priceK);

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{config.metaTitle}</title>
        <meta name="description" content={config.metaDescription} />
        <link rel="canonical" href={`https://presaleproperties.com/presale-${productType}-under-${pricePoint}-${citySlug}`} />
        <meta property="og:title" content={config.metaTitle} />
        <meta property="og:description" content={config.metaDescription} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
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
            <Link to={`/presale-condos/${citySlug}`} className="hover:text-foreground transition-colors">{config.cityName}</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Under {priceLabel}</span>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="container px-4 py-8 md:py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingDown className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{config.h1}</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mb-6">
            {config.intro}
          </p>

          {/* Price point quick links */}
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="text-sm text-muted-foreground self-center mr-2">Price ranges:</span>
            {PRICE_POINTS.map((price) => (
              <Link 
                key={price} 
                to={`/presale-${productType}-under-${price}k-${citySlug}`}
              >
                <Button 
                  variant={price === priceK ? "default" : "outline"} 
                  size="sm"
                >
                  Under {formatPriceLabel(price)}
                </Button>
              </Link>
            ))}
          </div>

          {/* Product type switcher */}
          <div className="flex gap-2 mb-8">
            <Link to={`/presale-condos-under-${pricePoint}-${citySlug}`}>
              <Button variant={productType === "condos" ? "default" : "outline"} size="sm">
                <Building2 className="h-4 w-4 mr-2" />
                Condos Under {priceLabel}
              </Button>
            </Link>
            <Link to={`/presale-townhomes-under-${pricePoint}-${citySlug}`}>
              <Button variant={productType === "townhomes" ? "default" : "outline"} size="sm">
                <Home className="h-4 w-4 mr-2" />
                Townhomes Under {priceLabel}
              </Button>
            </Link>
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
              <option value="newest">Recently Updated</option>
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
                  projectType={project.project_type}
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
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Projects Under {priceLabel}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We don't currently have {config.cityName} {productType} with starting prices under {priceLabel}. 
                Try a higher price point or browse all projects.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {otherPricePoints.slice(0, 3).map((price) => (
                  <Link key={price} to={`/presale-${productType}-under-${price}k-${citySlug}`}>
                    <Button variant="outline" size="sm">
                      Under {formatPriceLabel(price)}
                    </Button>
                  </Link>
                ))}
                <Link to="/presale-projects">
                  <Button>Browse All Projects</Button>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Explore Other Cities */}
        <section className="container px-4 py-12 border-t">
          <h2 className="text-xl font-semibold mb-6">
            {productType === "condos" ? "Condos" : "Townhomes"} Under {priceLabel} in Other Cities
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CITY_NAMES)
              .filter(([slug]) => slug !== citySlug)
              .slice(0, 6)
              .map(([slug, name]) => (
                <Link key={slug} to={`/presale-${productType}-under-${pricePoint}-${slug}`}>
                  <Button variant="outline" size="sm">
                    {name}
                  </Button>
                </Link>
              ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container px-4 py-12 border-t">
          <h2 className="text-2xl font-bold mb-6">
            FAQ: Affordable Presale {productType === "condos" ? "Condos" : "Townhomes"} in {config.cityName}
          </h2>
          <Accordion type="single" collapsible className="w-full max-w-3xl">
            {config.faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Internal Links Section */}
        <section className="container px-4 py-12 border-t">
          <h2 className="text-xl font-semibold mb-6">Explore More</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to={`/presale-condos/${citySlug}`} className="text-sm text-primary hover:underline">
              All {config.cityName} Presales
            </Link>
            <Link to={`/${citySlug}-presale-${productType}`} className="text-sm text-primary hover:underline">
              {config.cityName} {productType === "condos" ? "Condos" : "Townhomes"}
            </Link>
            <Link to="/buyers-guide" className="text-sm text-primary hover:underline">
              Presale Buyer's Guide
            </Link>
            <Link to="/mortgage-calculator" className="text-sm text-primary hover:underline">
              Mortgage Calculator
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

