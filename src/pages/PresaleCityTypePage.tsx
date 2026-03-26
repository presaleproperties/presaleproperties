import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { ChevronRight, Building2, Home, MapPin, DollarSign, TrendingDown } from "lucide-react";
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

// Price points for SEO pages
const PRICE_POINTS = [500, 600, 700, 800, 900, 1000];

const formatPriceLabel = (priceK: number) => priceK >= 1000 ? `$${priceK / 1000}M` : `$${priceK}K`;

export default function PresaleCityTypePage() {
  const { citySlug, typeSlug } = useParams<{ citySlug: string; typeSlug: string }>();
  const [sortBy, setSortBy] = useState("price-low");

  const cityName = citySlug ? CITY_NAMES[citySlug] : null;
  const isCondos = typeSlug === "condos";
  const isTownhomes = typeSlug === "townhomes";
  const productType = isCondos ? "condo" : isTownhomes ? "townhome" : null;
  const productLabel = isCondos ? "Condos" : isTownhomes ? "Townhomes" : "Projects";

  // Fetch projects filtered by city and type
  const { data: projects, isLoading } = useQuery({
    queryKey: ["city-type-projects", citySlug, productType],
    queryFn: async () => {
      if (!cityName || !productType) return [];
      
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image, gallery_images, is_featured, last_verified_date")
        .eq("is_published", true)
        .ilike("city", cityName)
        .eq("project_type", productType)
        .order("starting_price", { ascending: true, nullsFirst: false });

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
        return sorted.sort((a, b) => {
          const aDate = a.completion_year || Infinity;
          const bDate = b.completion_year || Infinity;
          return aDate - bDate;
        });
      case "newest":
        return sorted.sort((a, b) => new Date(b.last_verified_date || 0).getTime() - new Date(a.last_verified_date || 0).getTime());
      default:
        return sorted.sort((a, b) => (a.starting_price || Infinity) - (b.starting_price || Infinity));
    }
  }, [projects, sortBy]);

  // 404 if invalid parameters
  if (!cityName || !productType) {
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

  const metaTitle = `Presale ${productLabel} in ${cityName} | New ${productLabel} 2026`;
  const metaDescription = `Browse all presale ${productType}s in ${cityName}, BC. View VIP pricing, floor plans, deposit structures & completion dates. Expert presale guidance.`;

  // Build structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com/" },
      { "@type": "ListItem", "position": 2, "name": "Presale Projects", "item": "https://presaleproperties.com/presale-projects" },
      { "@type": "ListItem", "position": 3, "name": cityName, "item": `https://presaleproperties.com/presale-projects/${citySlug}` },
      { "@type": "ListItem", "position": 4, "name": productLabel, "item": `https://presaleproperties.com/presale-projects/${citySlug}/${typeSlug}` }
    ]
  };

  const faqs = [
    {
      question: `What presale ${productType}s are available in ${cityName}?`,
      answer: `We list all presale ${productType}s in ${cityName} with verified pricing, floor plans, and deposit structures. Projects are updated regularly with new launches.`
    },
    {
      question: `What deposit is required for ${cityName} presale ${productType}s?`,
      answer: `Most ${cityName} presales require 15-20% deposits paid over 12-18 months. Some developers offer reduced deposits as incentives.`
    },
    {
      question: `When will ${cityName} presale ${productType}s complete?`,
      answer: `Completion dates vary by project. Browse individual listings to see estimated completion timelines for each development.`
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  // Other cities for internal linking
  const otherCities = Object.entries(CITY_NAMES)
    .filter(([slug]) => slug !== citySlug)
    .slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`https://presaleproperties.com/presale-projects/${citySlug}/${typeSlug}`} />
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
            <span className="text-foreground">{productLabel}</span>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="container px-4 py-8 md:py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              {isCondos ? <Building2 className="h-6 w-6 text-primary" /> : <Home className="h-6 w-6 text-primary" />}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Presale {productLabel} in {cityName}</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mb-6">
            Browse all presale {productType}s available in {cityName}, BC. Get VIP access to floor plans, pricing sheets, and early registration opportunities.
          </p>

          {/* Type switcher */}
          <div className="flex gap-2 mb-6">
            <Link to={`/presale-projects/${citySlug}/condos`}>
              <Button variant={isCondos ? "default" : "outline"} size="sm">
                <Building2 className="h-4 w-4 mr-2" />
                {cityName} Condos
              </Button>
            </Link>
            <Link to={`/presale-projects/${citySlug}/townhomes`}>
              <Button variant={isTownhomes ? "default" : "outline"} size="sm">
                <Home className="h-4 w-4 mr-2" />
                {cityName} Townhomes
              </Button>
            </Link>
          </div>

          {/* Price range quick links */}
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="text-sm text-muted-foreground self-center mr-2">By Price:</span>
            {PRICE_POINTS.map((price) => (
              <Link key={price} to={`/presale-projects/${citySlug}/${typeSlug}-under-${price}k`}>
                <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10">
                  Under {formatPriceLabel(price)}
                </Badge>
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
              <h3 className="text-xl font-semibold mb-2">No {productLabel} Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We don't currently have presale {productType}s listed in {cityName}. 
                Browse all projects or try another city.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link to={`/presale-projects/${citySlug}`}>
                  <Button variant="outline">All {cityName} Projects</Button>
                </Link>
                <Link to="/presale-projects">
                  <Button>Browse All Projects</Button>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Other Cities Internal Links */}
        <section className="container px-4 py-12 border-t">
          <h2 className="text-xl font-semibold mb-6">
            Presale {productLabel} in Other Cities
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherCities.map(([slug, name]) => (
              <Link key={slug} to={`/presale-projects/${slug}/${typeSlug}`}>
                <Button variant="outline" size="sm">
                  {name} {productLabel}
                </Button>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container px-4 py-12 border-t">
          <h2 className="text-2xl font-bold mb-6">
            FAQ: Presale {productLabel} in {cityName}
          </h2>
          <Accordion type="single" collapsible className="w-full max-w-3xl">
            {faqs.map((faq, index) => (
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
            <Link to={`/presale-projects/${citySlug}`} className="text-sm text-primary hover:underline">
              All {cityName} Presales
            </Link>
            <Link to={`/presale-projects/${citySlug}/${typeSlug}-under-500k`} className="text-sm text-primary hover:underline">
              {productLabel} Under $500K
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
