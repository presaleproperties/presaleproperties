import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { HeroSection, SearchTab } from "@/components/home/HeroSection";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { FeaturedResaleListings } from "@/components/home/FeaturedResaleListings";
import { CityProjectsSection } from "@/components/home/CityProjectsSection";
import { ResaleCitySection } from "@/components/home/ResaleCitySection";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { RelatedContent } from "@/components/home/RelatedContent";
import { ROICalculatorTeaser } from "@/components/home/ROICalculatorTeaser";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { QuickSearchLinks } from "@/components/home/QuickSearchLinks";
import { MobileHomePage } from "@/components/mobile/MobileHomePage";
import { HomeUnifiedMapSection } from "@/components/map/HomeUnifiedMapSection";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";
import { TwoWaysToBuy } from "@/components/home/TwoWaysToBuy";
import { NewConstructionTrustBar } from "@/components/home/NewConstructionTrustBar";
// Homepage FAQs for structured data - optimized for AI snippet extraction with clear, quotable answers
const HOME_FAQS = [
  {
    question: "What is a presale?",
    answer: "A presale is a real estate purchase where you buy a property before it is built. You sign a contract and pay a deposit to secure a unit in a development that is still under construction. The full purchase price is paid when the building is completed, typically 2-4 years later."
  },
  {
    question: "How do presales work?",
    answer: "Presales work in 5 steps: First, register with the developer to receive pricing and floor plans. Second, select your unit and sign a purchase agreement. Third, pay a deposit (typically 15-20%) in installments over 12-18 months. Fourth, wait for construction to complete (usually 2-4 years). Fifth, pay the remaining balance and take possession of your new home."
  },
  {
    question: "What is the difference between a presale and an assignment?",
    answer: "A presale is purchased directly from the developer before construction is complete. An assignment is when the original presale buyer sells their contract to a new buyer before the building is finished. With an assignment, you take over the original buyer's purchase agreement and pay the remaining deposit and closing costs."
  },
  {
    question: "How much deposit do I need for a presale in BC?",
    answer: "Presale deposits in British Columbia typically range from 15% to 20% of the purchase price, paid in installments over 12-18 months. A common deposit structure is 5% at signing, 5% at 90 days, 5% at 180 days, and 5% at 12 months or foundation completion."
  },
  {
    question: "What is the benefit of buying presale?",
    answer: "Buying presale allows you to lock in today's prices while the development is built, often with lower deposit requirements than resale properties. Presales typically appreciate in value by completion, meaning you may have built-in equity before moving in. You also get a brand new home with modern finishes and full warranty coverage."
  },
  {
    question: "Can I rent out a presale condo after completion?",
    answer: "Rental policies vary by development. Some presale projects have no rental restrictions, while others may limit rentals for the first 1-2 years or require owner occupancy. Always check the disclosure statement for rental restrictions before purchasing a presale unit as an investment property."
  },
  {
    question: "Where can I find presale condos in Vancouver?",
    answer: "PresaleProperties.com lists presale condos and townhomes across Metro Vancouver including Vancouver, Surrey, Burnaby, Coquitlam, Langley, Richmond, Delta, and Abbotsford. Register for VIP access to get early pricing, floor plans, and exclusive incentives."
  },
  {
    question: "What happens if a presale project is delayed or cancelled?",
    answer: "If a presale project is delayed, your completion date will be extended. If cancelled, your deposit is returned in full as it is held in trust by a lawyer. British Columbia has strong consumer protections for presale buyers, and developers must provide regular updates on construction progress."
  }
];

const Index = () => {
  const isMobileOrTablet = useIsMobileOrTablet();
  const [activeTab, setActiveTab] = useState<SearchTab>("projects");
  // Primary structured data - RealEstateAgent with LocalBusiness
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["RealEstateAgent", "LocalBusiness"],
    "@id": "https://presaleproperties.com/#organization",
    "name": "PresaleProperties.com",
    "url": "https://presaleproperties.com",
    "logo": "https://presaleproperties.com/logo.svg",
    "description": "Metro Vancouver's leading platform for presale condos, townhomes, and new construction homes. Browse VIP pricing, floor plans & incentives for projects in Vancouver, Surrey, Langley, Coquitlam, Burnaby, Delta, and Abbotsford.",
    "telephone": "+1-672-258-1100",
    "email": "info@presaleproperties.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Vancouver",
      "addressRegion": "BC",
      "addressCountry": "CA"
    },
    "areaServed": [
      { "@type": "City", "name": "Vancouver" },
      { "@type": "City", "name": "Surrey" },
      { "@type": "City", "name": "Langley" },
      { "@type": "City", "name": "Coquitlam" },
      { "@type": "City", "name": "Burnaby" },
      { "@type": "City", "name": "Delta" },
      { "@type": "City", "name": "Abbotsford" },
      { "@type": "City", "name": "Richmond" }
    ],
    "serviceType": [
      "Presale Condos",
      "New Construction Homes",
      "Presale Townhomes",
      "Pre-Construction Real Estate",
      "VIP Access Registration"
    ],
    "priceRange": "$400,000 - $3,000,000",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "09:00",
      "closes": "21:00"
    }
  };

  // SiteNavigationElement schema - helps Google create sitelinks
  // Structured for 4 main sitelinks: Presale, Move-In Ready, Assignments, For Agents
  const siteNavigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "SiteNavigationElement",
        "position": 1,
        "name": "Presale Condos & Townhomes",
        "description": "Browse 50+ presale condos and townhomes in Metro Vancouver. VIP pricing, floor plans & deposit structures.",
        "url": "https://presaleproperties.com/presale-projects"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 2,
        "name": "Move-In Ready Homes",
        "description": "Brand new condos, townhomes & houses never lived in. Move in within 6 months.",
        "url": "https://presaleproperties.com/properties"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 3,
        "name": "Assignment Sales",
        "description": "Buy presale contracts from original buyers. Skip the wait and get today's pricing.",
        "url": "https://presaleproperties.com/for-agents"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 4,
        "name": "Surrey Presale Condos",
        "description": "Browse presale condos in Surrey BC with VIP pricing and floorplans",
        "url": "https://presaleproperties.com/surrey-presale-condos"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 5,
        "name": "Vancouver Presale Condos",
        "description": "Explore new presale condos in Vancouver with pricing and incentives",
        "url": "https://presaleproperties.com/vancouver-presale-condos"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 6,
        "name": "Langley Presale Condos",
        "description": "Discover presale condos in Langley with VIP access and floorplans",
        "url": "https://presaleproperties.com/langley-presale-condos"
      }
    ]
  };

  // OfferCatalog for presale services
  const offerCatalogSchema = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    "name": "Presale Properties Catalog",
    "description": "New construction condos and townhomes available in Metro Vancouver",
    "url": "https://presaleproperties.com/presale-projects",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Presale Condos Vancouver",
          "description": "New presale condos in Vancouver with VIP pricing and floor plans"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Presale Condos Surrey",
          "description": "Surrey presale condos and townhomes with pricing and incentives"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Presale Condos Langley",
          "description": "Langley presale condos including Willoughby and Murrayville"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Presale Condos Coquitlam",
          "description": "Coquitlam pre-construction condos near Evergreen Line"
        }
      }
    ]
  };

  // Mobile & Tablet: show home content (no redirect)
  if (isMobileOrTablet) {
    
    // Show home content when explicitly requested via ?view=home
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Helmet>
          <title>Vancouver Presale Condos & Townhomes 2026 | PresaleProperties</title>
          <meta name="description" content="Browse 100+ presale condos & townhomes in Metro Vancouver. VIP pricing, floor plans & early access for Surrey, Langley, Burnaby, Coquitlam. New construction experts." />
          <link rel="canonical" href="https://presaleproperties.com/" />
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
          <script type="application/ld+json">
            {JSON.stringify(organizationSchema)}
          </script>
          <script type="application/ld+json">
            {JSON.stringify(siteNavigationSchema)}
          </script>
          <script type="application/ld+json">
            {JSON.stringify(offerCatalogSchema)}
          </script>
        </Helmet>
        <FAQSchema faqs={HOME_FAQS} />
        <ConversionHeader transparentOnMobile />
        <MobileHomePage activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  // Desktop: Original layout
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Vancouver Presale Condos & Townhomes 2026 | PresaleProperties</title>
        <meta name="title" content="Vancouver Presale Condos & Townhomes 2026 | PresaleProperties" />
        <meta name="description" content="Browse 100+ presale condos & townhomes in Metro Vancouver. VIP pricing, floor plans & early access for Surrey, Langley, Burnaby, Coquitlam. New construction experts." />
        <meta name="keywords" content="presale condos Vancouver, presale townhomes Surrey, new construction Metro Vancouver, presale projects BC, VIP pricing 2026" />
        <link rel="canonical" href="https://presaleproperties.com/" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://presaleproperties.com/" />
        <meta property="og:title" content="Vancouver Presale Condos & Townhomes 2026" />
        <meta property="og:description" content="Browse 100+ presale condos & townhomes in Metro Vancouver. VIP pricing, floor plans & early access." />
        <meta property="og:image" content="https://presaleproperties.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="PresaleProperties.com" />
        <meta property="og:locale" content="en_CA" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://presaleproperties.com/" />
        <meta name="twitter:title" content="Vancouver Presale Condos & Townhomes 2026" />
        <meta name="twitter:description" content="Browse 100+ presale condos & townhomes in Metro Vancouver. VIP pricing & floor plans." />
        <meta name="twitter:image" content="https://presaleproperties.com/og-image.png" />
        
        <meta name="geo.region" content="CA-BC" />
        <meta name="geo.placename" content="Vancouver" />
        <meta name="author" content="PresaleProperties.com" />
        
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(siteNavigationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(offerCatalogSchema)}
        </script>
      </Helmet>

      <FAQSchema faqs={HOME_FAQS} />
      
      <ConversionHeader />
      <main className="flex-1">
        <HeroSection activeTab={activeTab} onTabChange={setActiveTab} />
        <QuickSearchLinks />
        <ScrollReveal animation="fade-up">
          {activeTab === "projects" ? <FeaturedProjects /> : <FeaturedResaleListings />}
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={100}>
          {activeTab === "projects" ? <CityProjectsSection /> : <ResaleCitySection />}
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={100}>
          <NewConstructionBenefits />
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={100}>
          <ROICalculatorTeaser />
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={100}>
          <RelatedContent />
        </ScrollReveal>
        {/* Large Map Section - Page Ending */}
        <ScrollReveal animation="fade-up" delay={100}>
          <HomeUnifiedMapSection initialMode={activeTab === "projects" ? "presale" : "resale"} contextType="home" />
        </ScrollReveal>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
