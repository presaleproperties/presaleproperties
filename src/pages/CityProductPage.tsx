import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight, Building2, Home, MapPin, Shield, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PresaleProjectCard } from "@/components/listings/PresaleProjectCard";
import { supabase } from "@/integrations/supabase/client";

// SEO Configuration for city+product combinations
const CITY_PRODUCT_CONFIG: Record<string, Record<string, {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  cityName: string;
  productType: "condo" | "townhome";
  faqs: { question: string; answer: string }[];
}>> = {
  surrey: {
    condos: {
      metaTitle: "Presale Condos Surrey 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse all new presale condos in Surrey BC with floorplans, VIP pricing & deposit structures. City Centre, Cloverdale, South Surrey & Guildford new condo developments.",
      h1: "Presale Condos in Surrey, BC",
      intro: "Surrey is Metro Vancouver's fastest-growing city for presale condos. From high-rise towers in City Centre near SkyTrain to boutique low-rises in Cloverdale, discover Surrey presale condos with VIP pricing, floorplans, and deposit structures below.",
      cityName: "Surrey",
      productType: "condo",
      faqs: [
        { question: "What is the average price for presale condos in Surrey?", answer: "Surrey presale condos typically range from $450,000 for studios to $850,000+ for 3-bedroom units. City Centre condos near SkyTrain command premium pricing, while South Surrey offers waterfront luxury options." },
        { question: "What deposit is required for Surrey presale condos?", answer: "Most Surrey presale condos require 15-20% deposits paid over 12-18 months. Common structures include 5% at signing, 5% at 90 days, 5% at 180 days, and 5% at 1 year." },
        { question: "Can I assign my Surrey presale condo contract?", answer: "Assignment policies vary by developer. Many Surrey projects allow assignments after a holding period, typically with a fee of $5,000-$10,000. Check individual project disclosure statements for specific terms." }
      ]
    },
    townhomes: {
      metaTitle: "Presale Townhomes Surrey 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse new presale townhomes in Surrey BC with floorplans, VIP pricing & deposit info. Clayton Heights, Cloverdale, South Surrey townhome developments.",
      h1: "Presale Townhomes in Surrey, BC",
      intro: "Surrey offers some of the best presale townhome value in the Lower Mainland. From family-sized rowhomes in Clayton Heights to luxury townhomes in South Surrey, explore presale townhomes with VIP pricing and floorplans below.",
      cityName: "Surrey",
      productType: "townhome",
      faqs: [
        { question: "What is the price range for presale townhomes in Surrey?", answer: "Surrey presale townhomes typically range from $750,000 for 2-bedroom units to $1.2M+ for 4-bedroom family townhomes. Clayton Heights and Cloverdale offer the best value, while South Surrey commands premium prices." },
        { question: "What deposit structure is common for Surrey townhomes?", answer: "Surrey presale townhomes typically require 10-15% deposits. Many developers offer extended deposit structures with 5% at signing and 5% at completion to make townhome ownership more accessible." },
        { question: "Are Surrey presale townhomes a good investment?", answer: "Surrey townhomes offer strong investment potential due to limited supply, growing families seeking space, and Surrey's rapid population growth. Rental restrictions vary by project - check disclosure statements." }
      ]
    }
  },
  langley: {
    condos: {
      metaTitle: "Presale Condos Langley 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse new presale condos in Langley BC with floorplans, VIP pricing & deposit structures. Willoughby, Murrayville, Walnut Grove condo developments.",
      h1: "Presale Condos in Langley, BC",
      intro: "Langley offers affordable presale condos with suburban lifestyle appeal. From transit-oriented developments in Willoughby to boutique buildings in Murrayville, discover Langley presale condos with VIP pricing and floorplans below.",
      cityName: "Langley",
      productType: "condo",
      faqs: [
        { question: "What is the average price for presale condos in Langley?", answer: "Langley presale condos typically range from $400,000 for 1-bedroom units to $700,000+ for 3-bedroom condos. Willoughby and Langley City offer the most inventory, with competitive pricing compared to Metro Vancouver." },
        { question: "What deposit is required for Langley presale condos?", answer: "Langley presale condos often have more flexible deposits of 10-15%. Many developers offer reduced deposit structures like 5% at signing and 5% at completion to attract first-time buyers." },
        { question: "Is Langley a good area for presale condo investment?", answer: "Langley offers strong rental demand due to growing employment, excellent schools, and relative affordability. The planned SkyTrain extension will significantly boost property values along the corridor." }
      ]
    },
    townhomes: {
      metaTitle: "Presale Townhomes Langley 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse new presale townhomes in Langley BC with floorplans, VIP pricing & deposit info. Willoughby, Murrayville, Walnut Grove townhome developments.",
      h1: "Presale Townhomes in Langley, BC",
      intro: "Langley is a hotspot for presale townhomes, offering family-friendly communities with excellent schools. From Willoughby's master-planned neighborhoods to Murrayville's charming developments, explore Langley presale townhomes below.",
      cityName: "Langley",
      productType: "townhome",
      faqs: [
        { question: "What is the price range for presale townhomes in Langley?", answer: "Langley presale townhomes typically range from $650,000 for 2-bedroom units to $1.1M+ for 4-bedroom family townhomes. Willoughby and Brookswood are the most popular areas for new townhome construction." },
        { question: "What makes Langley townhomes attractive to families?", answer: "Langley townhomes offer larger square footage, private yards, and access to top-rated schools. The community feel, wine country proximity, and relative affordability make it ideal for young families." },
        { question: "Are Langley townhomes rentable?", answer: "Most Langley townhome developments allow rentals, though some strata may have restrictions. Check the disclosure statement for specific rental policies before purchasing as an investment." }
      ]
    }
  },
  coquitlam: {
    condos: {
      metaTitle: "Presale Condos Coquitlam 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse new presale condos in Coquitlam BC with floorplans, VIP pricing & deposit structures. Burquitlam, Burke Mountain, Coquitlam Centre developments.",
      h1: "Presale Condos in Coquitlam, BC",
      intro: "Coquitlam offers exceptional presale condo opportunities near the Evergreen Line. From transit-oriented high-rises at Burquitlam to mountain-view condos in Burke Mountain, discover Coquitlam presale condos below.",
      cityName: "Coquitlam",
      productType: "condo",
      faqs: [
        { question: "What is the average price for presale condos in Coquitlam?", answer: "Coquitlam presale condos range from $500,000 for 1-bedroom units to $900,000+ for 3-bedroom condos. Transit-oriented projects near Evergreen Line stations command premium pricing." },
        { question: "Which Coquitlam neighborhoods have the most presale activity?", answer: "Burquitlam and Coquitlam Centre see the most presale condo activity due to SkyTrain access. Burke Mountain offers more affordable options with mountain views and family-oriented amenities." },
        { question: "What are the benefits of buying presale in Coquitlam?", answer: "Coquitlam presales offer SkyTrain connectivity, stunning mountain views, excellent schools, and lower prices than Vancouver or Burnaby. The city continues to develop major amenities and employment centers." }
      ]
    },
    townhomes: {
      metaTitle: "Presale Townhomes Coquitlam 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse new presale townhomes in Coquitlam BC with floorplans, VIP pricing & deposit info. Burke Mountain, Westwood Plateau townhome developments.",
      h1: "Presale Townhomes in Coquitlam, BC",
      intro: "Coquitlam's Burke Mountain and Westwood Plateau offer premium presale townhomes with mountain views. Discover family-sized townhomes with modern finishes, VIP pricing, and floorplans below.",
      cityName: "Coquitlam",
      productType: "townhome",
      faqs: [
        { question: "What is the price range for presale townhomes in Coquitlam?", answer: "Coquitlam presale townhomes typically range from $800,000 for 2-bedroom units to $1.4M+ for 4-bedroom family townhomes. Burke Mountain offers the most new construction inventory." },
        { question: "Is Burke Mountain a good area for townhome investment?", answer: "Burke Mountain continues to develop with new schools, parks, and commercial amenities. The master-planned community attracts families seeking mountain living with urban convenience." },
        { question: "What amenities come with Coquitlam townhomes?", answer: "Coquitlam townhomes typically include private yards, 2-car garages, modern kitchens, and access to trails and nature. Many developments feature clubhouses and children's play areas." }
      ]
    }
  },
  burnaby: {
    condos: {
      metaTitle: "Presale Condos Burnaby 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse new presale condos in Burnaby BC with floorplans, VIP pricing & deposit structures. Metrotown, Brentwood, Lougheed condo developments.",
      h1: "Presale Condos in Burnaby, BC",
      intro: "Burnaby is a premium destination for presale condos with excellent SkyTrain connectivity. From iconic towers at Metrotown to transit-oriented developments at Brentwood, discover Burnaby presale condos below.",
      cityName: "Burnaby",
      productType: "condo",
      faqs: [
        { question: "What is the average price for presale condos in Burnaby?", answer: "Burnaby presale condos range from $550,000 for 1-bedroom units to $1M+ for 3-bedroom condos. Metrotown and Brentwood command the highest prices due to transit access and amenities." },
        { question: "Are Burnaby presale condos a good investment?", answer: "Burnaby presales offer strong appreciation potential due to limited land, excellent transit, and proximity to Vancouver. Rental demand is consistently high near SkyTrain stations." },
        { question: "What deposit is required for Burnaby presale condos?", answer: "Burnaby presale condos typically require 20-25% deposits due to high demand. Premium locations may require larger deposits, paid over 12-24 months before completion." }
      ]
    },
    townhomes: {
      metaTitle: "Presale Townhomes Burnaby 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse new presale townhomes in Burnaby BC with floorplans, VIP pricing & deposit info. Burnaby Heights, Capitol Hill townhome developments.",
      h1: "Presale Townhomes in Burnaby, BC",
      intro: "Burnaby presale townhomes are rare and highly sought-after. When available, they offer the perfect blend of urban convenience and family living. Explore current Burnaby townhome developments below.",
      cityName: "Burnaby",
      productType: "townhome",
      faqs: [
        { question: "Are presale townhomes available in Burnaby?", answer: "Presale townhomes in Burnaby are relatively rare due to high land costs. When available, they're typically found in Burnaby Heights, Capitol Hill, or as part of mixed-use developments." },
        { question: "What is the price range for Burnaby townhomes?", answer: "Burnaby presale townhomes, when available, typically range from $1M to $1.8M+ depending on size and location. Their scarcity makes them highly desirable for families seeking urban convenience." },
        { question: "Why are Burnaby townhomes so expensive?", answer: "Burnaby's central location, excellent transit, top schools, and limited developable land create high demand and limited supply for townhomes, driving premium pricing." }
      ]
    }
  },
  vancouver: {
    condos: {
      metaTitle: "Presale Condos Vancouver 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse new presale condos in Vancouver BC with floorplans, VIP pricing & deposit structures. Downtown, Mount Pleasant, Cambie Corridor developments.",
      h1: "Presale Condos in Vancouver, BC",
      intro: "Vancouver remains the epicenter of presale development in BC. From iconic Downtown towers to trendy Mount Pleasant lofts, discover Vancouver presale condos with VIP access and pricing below.",
      cityName: "Vancouver",
      productType: "condo",
      faqs: [
        { question: "What is the average price for presale condos in Vancouver?", answer: "Vancouver presale condos range from $600,000 for studios to $1.5M+ for 3-bedroom units. Downtown, Coal Harbour, and Olympic Village command premium pricing due to location and amenities." },
        { question: "Are Vancouver presale condos worth the premium?", answer: "Vancouver presales offer unmatched lifestyle, world-class amenities, and historically strong appreciation. For owner-occupiers, the lifestyle value often justifies the premium over suburban alternatives." },
        { question: "What deposit is required for Vancouver presales?", answer: "Vancouver presale condos typically require 20-25% deposits, with some luxury projects requiring up to 35%. Deposits are usually structured over 12-18 months before completion." }
      ]
    },
    townhomes: {
      metaTitle: "Presale Townhomes Vancouver 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse new presale townhomes in Vancouver BC with floorplans, VIP pricing & deposit info. Cambie Corridor, East Vancouver townhome developments.",
      h1: "Presale Townhomes in Vancouver, BC",
      intro: "Vancouver presale townhomes offer rare ground-oriented living in the city. From Cambie Corridor rowhomes to East Vancouver infill projects, explore exclusive Vancouver townhome opportunities below.",
      cityName: "Vancouver",
      productType: "townhome",
      faqs: [
        { question: "Are presale townhomes available in Vancouver?", answer: "Presale townhomes in Vancouver are rare and highly competitive. Most are found along the Cambie Corridor, East Vancouver, or as part of larger mixed-use developments." },
        { question: "What is the price range for Vancouver townhomes?", answer: "Vancouver presale townhomes typically range from $1.3M to $2.5M+ depending on location and size. Their scarcity and desirability command significant premiums." },
        { question: "Why choose a Vancouver townhome over a condo?", answer: "Vancouver townhomes offer private outdoor space, more square footage, and ground-oriented living - ideal for families or those seeking more privacy than condo life provides." }
      ]
    }
  },
  richmond: {
    condos: {
      metaTitle: "Presale Condos Richmond 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse new presale condos in Richmond BC with floorplans, VIP pricing & deposit structures. Richmond Centre, Brighouse, Steveston developments.",
      h1: "Presale Condos in Richmond, BC",
      intro: "Richmond offers excellent presale condos with Canada Line connectivity. From City Centre high-rises to Steveston waterfront living, discover Richmond presale condos with VIP pricing below.",
      cityName: "Richmond",
      productType: "condo",
      faqs: [
        { question: "What is the average price for presale condos in Richmond?", answer: "Richmond presale condos range from $500,000 for 1-bedroom units to $950,000+ for 3-bedroom condos. Canada Line stations command premium pricing." },
        { question: "Is Richmond good for presale condo investment?", answer: "Richmond offers strong rental demand near YVR airport and Canada Line. The diverse economy, excellent Asian dining, and transit access make it popular with renters and buyers alike." },
        { question: "What neighborhoods have the most Richmond presales?", answer: "City Centre/Brighouse near Richmond Centre has the most presale activity. Capstan Village is an emerging area with new transit-oriented developments." }
      ]
    },
    townhomes: {
      metaTitle: "Presale Townhomes Richmond 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse new presale townhomes in Richmond BC with floorplans, VIP pricing & deposit info. Steveston, East Richmond townhome developments.",
      h1: "Presale Townhomes in Richmond, BC",
      intro: "Richmond presale townhomes offer family living with urban convenience. From Steveston's charming village to East Richmond's newer communities, explore Richmond townhome developments below.",
      cityName: "Richmond",
      productType: "townhome",
      faqs: [
        { question: "What is the price range for presale townhomes in Richmond?", answer: "Richmond presale townhomes typically range from $900,000 for 2-bedroom units to $1.5M+ for 4-bedroom family townhomes. East Richmond and Hamilton offer more affordable options." },
        { question: "Are Richmond townhomes good for families?", answer: "Richmond townhomes offer excellent schools, safe neighborhoods, and family-friendly amenities. The flat terrain is ideal for cycling, and there's easy access to beaches and trails." },
        { question: "What's the difference between Steveston and East Richmond townhomes?", answer: "Steveston townhomes command premium prices for village charm and waterfront access. East Richmond offers newer construction at lower price points with suburban family appeal." }
      ]
    }
  },
  delta: {
    condos: {
      metaTitle: "Presale Condos Delta 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse new presale condos in Delta BC with floorplans, VIP pricing & deposit structures. Tsawwassen, Ladner, North Delta condo developments.",
      h1: "Presale Condos in Delta, BC",
      intro: "Delta offers unique presale opportunities across three distinct communities. From Tsawwassen's beachside living to Ladner's village charm, discover Delta presale condos below.",
      cityName: "Delta",
      productType: "condo",
      faqs: [
        { question: "What is the average price for presale condos in Delta?", answer: "Delta presale condos range from $450,000 for 1-bedroom units to $800,000+ for larger condos. Tsawwassen typically commands higher prices due to waterfront proximity." },
        { question: "Is Delta good for presale investment?", answer: "Delta offers excellent value compared to Vancouver proper. Tsawwassen Mills, the ferry terminal, and Deltaport employment create steady demand for housing." },
        { question: "What makes Tsawwassen presales unique?", answer: "Tsawwassen offers rare beachside living near Vancouver. The small-town feel, ferry access to Victoria, and Tsawwassen Mills shopping attract buyers seeking lifestyle over urban density." }
      ]
    },
    townhomes: {
      metaTitle: "Presale Townhomes Delta 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse new presale townhomes in Delta BC with floorplans, VIP pricing & deposit info. Tsawwassen, Ladner, North Delta townhome developments.",
      h1: "Presale Townhomes in Delta, BC",
      intro: "Delta presale townhomes offer excellent value and family living. From Tsawwassen's beach access to North Delta's suburban convenience, explore Delta townhome developments below.",
      cityName: "Delta",
      productType: "townhome",
      faqs: [
        { question: "What is the price range for presale townhomes in Delta?", answer: "Delta presale townhomes typically range from $700,000 for 2-bedroom units to $1.1M+ for 4-bedroom family townhomes. North Delta offers the most affordable options." },
        { question: "Why choose Delta for a townhome?", answer: "Delta townhomes offer larger lots, more affordable prices, and access to nature trails and beaches. It's ideal for families seeking space and outdoor lifestyle." },
        { question: "Are Delta townhomes rentable?", answer: "Most Delta townhome developments allow rentals, making them attractive for investors. Check individual disclosure statements for specific rental policies and restrictions." }
      ]
    }
  },
  abbotsford: {
    condos: {
      metaTitle: "Presale Condos Abbotsford 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse new presale condos in Abbotsford BC with floorplans, VIP pricing & deposit structures. Downtown, Mill Lake, West Abbotsford developments.",
      h1: "Presale Condos in Abbotsford, BC",
      intro: "Abbotsford offers exceptional presale condo value in the Fraser Valley. From Downtown revitalization to Mill Lake area developments, discover Abbotsford presale condos below.",
      cityName: "Abbotsford",
      productType: "condo",
      faqs: [
        { question: "What is the average price for presale condos in Abbotsford?", answer: "Abbotsford presale condos are among the most affordable in the Lower Mainland, ranging from $350,000 for 1-bedroom units to $600,000+ for larger condos." },
        { question: "Is Abbotsford good for first-time buyers?", answer: "Abbotsford is excellent for first-time buyers due to lower prices, flexible deposit structures, and growing amenities. It offers the best value per square foot in the region." },
        { question: "What deposit is typical for Abbotsford presales?", answer: "Abbotsford presale condos often require only 10-15% deposits with flexible structures. Many developers offer 5% at signing and 5% at completion to attract first-time buyers." }
      ]
    },
    townhomes: {
      metaTitle: "Presale Townhomes Abbotsford 2025 – Floorplans & VIP Pricing | PresaleProperties",
      metaDescription: "Browse new presale townhomes in Abbotsford BC with floorplans, VIP pricing & deposit info. West Abbotsford, Auguston townhome developments.",
      h1: "Presale Townhomes in Abbotsford, BC",
      intro: "Abbotsford presale townhomes offer unbeatable value for families. With mountain views, large floor plans, and affordable prices, explore Abbotsford townhome developments below.",
      cityName: "Abbotsford",
      productType: "townhome",
      faqs: [
        { question: "What is the price range for presale townhomes in Abbotsford?", answer: "Abbotsford presale townhomes offer the best value in the Lower Mainland, ranging from $550,000 for 2-bedroom units to $900,000+ for 4-bedroom family townhomes." },
        { question: "Why are Abbotsford townhomes so affordable?", answer: "Abbotsford's distance from Vancouver proper and available land keep prices competitive. However, the city is growing rapidly with new amenities, schools, and employment centers." },
        { question: "What lifestyle does Abbotsford offer?", answer: "Abbotsford offers mountain views, berry farms, wineries, and outdoor recreation. It's ideal for families seeking space, affordability, and small-city charm." }
      ]
    }
  }
};

export default function CityProductPage() {
  const { citySlug, productType } = useParams<{ citySlug: string; productType: string }>();
  const [sortBy, setSortBy] = useState("newest");

  // Get page configuration
  const config = citySlug && productType ? CITY_PRODUCT_CONFIG[citySlug]?.[productType] : null;

  // Fetch projects filtered by city and product type
  const { data: projects, isLoading } = useQuery({
    queryKey: ["city-product-projects", citySlug, productType],
    queryFn: async () => {
      if (!config) return [];
      
      const dbProductType = config.productType === "townhome" ? "townhome" : "condo";
      
      const { data, error } = await supabase
        .from("presale_projects")
        .select("*")
        .eq("is_published", true)
        .ilike("city", config.cityName)
        .eq("project_type", dbProductType)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!config,
  });

  // Sort projects
  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    
    const sorted = [...projects];
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => (a.starting_price || Infinity) - (b.starting_price || Infinity));
      case "price-high":
        return sorted.sort((a, b) => (b.starting_price || 0) - (a.starting_price || 0));
      case "completion":
        return sorted.sort((a, b) => {
          const aDate = a.completion_year ? a.completion_year * 12 + (a.completion_month || 0) : Infinity;
          const bDate = b.completion_year ? b.completion_year * 12 + (b.completion_month || 0) : Infinity;
          return aDate - bDate;
        });
      default:
        return sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
  }, [projects, sortBy]);

  // 404 if invalid city/product combination
  if (!config) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
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
      { "@type": "ListItem", "position": 3, "name": `${config.cityName} ${productType === "condos" ? "Condos" : "Townhomes"}`, "item": `https://presaleproperties.com/${citySlug}-presale-${productType}` }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{config.metaTitle}</title>
        <meta name="description" content={config.metaDescription} />
        <link rel="canonical" href={`https://presaleproperties.com/${citySlug}-presale-${productType}`} />
        <meta property="og:title" content={config.metaTitle} />
        <meta property="og:description" content={config.metaDescription} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <Header />

      <main className="flex-grow">
        {/* Breadcrumbs */}
        <div className="container px-4 pt-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/presale-projects" className="hover:text-foreground transition-colors">Presale Projects</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/presale-condos/${citySlug}`} className="hover:text-foreground transition-colors">{config.cityName}</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{productType === "condos" ? "Condos" : "Townhomes"}</span>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="container px-4 py-8 md:py-12">
          <div className="flex items-center gap-3 mb-4">
            {config.productType === "condo" ? (
              <Building2 className="h-8 w-8 text-primary" />
            ) : (
              <Home className="h-8 w-8 text-primary" />
            )}
            <h1 className="text-3xl md:text-4xl font-bold">{config.h1}</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mb-6">
            {config.intro}
          </p>
          
          {/* Product type switcher */}
          <div className="flex gap-2 mb-8">
            <Link to={`/${citySlug}-presale-condos`}>
              <Button variant={productType === "condos" ? "default" : "outline"} size="sm">
                <Building2 className="h-4 w-4 mr-2" />
                {config.cityName} Condos
              </Button>
            </Link>
            <Link to={`/${citySlug}-presale-townhomes`}>
              <Button variant={productType === "townhomes" ? "default" : "outline"} size="sm">
                <Home className="h-4 w-4 mr-2" />
                {config.cityName} Townhomes
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
              <option value="newest">Newest</option>
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
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No {productType === "condos" ? "Condos" : "Townhomes"} Found</h3>
              <p className="text-muted-foreground mb-6">
                We don't have any {config.cityName} {productType} listings at the moment.
              </p>
              <Link to="/presale-projects">
                <Button>Browse All Projects</Button>
              </Link>
            </div>
          )}
        </section>

        {/* Buyer Protection Section */}
        <section className="container px-4 py-12">
          <div className="bg-muted/30 rounded-xl p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Buyer Protection in BC
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">7-Day Rescission Period</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  BC law gives you 7 days to cancel a presale contract without penalty after signing.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Deposit Held in Trust</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your deposits are protected in a lawyer's trust account until completion.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">REDMA Disclosure</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Developers must provide detailed disclosure statements before you sign.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">
            Frequently Asked Questions: {config.cityName} Presale {productType === "condos" ? "Condos" : "Townhomes"}
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
          <h2 className="text-xl font-semibold mb-6">Explore More Presale Projects</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to={`/presale-condos/${citySlug}`} className="text-sm text-primary hover:underline">
              All {config.cityName} Presales
            </Link>
            <Link to="/presale-projects" className="text-sm text-primary hover:underline">
              All BC Presale Projects
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
