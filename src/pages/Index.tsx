import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Map } from "lucide-react";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { CityProjectsSection } from "@/components/home/CityProjectsSection";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { BuyerCTASection } from "@/components/home/BuyerCTASection";
import { RelatedContent } from "@/components/home/RelatedContent";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MobileHomePage } from "@/components/mobile/MobileHomePage";
import { FloatingBottomNav } from "@/components/mobile/FloatingBottomNav";
import { HomeMapSection } from "@/components/home/HomeMapSection";
import { Button } from "@/components/ui/button";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";

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
  // Primary structured data - RealEstateAgent with LocalBusiness
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["RealEstateAgent", "LocalBusiness"],
    "@id": "https://presaleproperties.com/#organization",
    "name": "PresaleProperties.com",
    "url": "https://presaleproperties.com",
    "logo": "https://presaleproperties.com/logo.png",
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
  const siteNavigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "SiteNavigationElement",
        "position": 1,
        "name": "Surrey Presale Condos",
        "description": "Browse presale condos in Surrey BC with VIP pricing and floorplans",
        "url": "https://presaleproperties.com/surrey-presale-condos"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 2,
        "name": "Vancouver Presale Condos",
        "description": "Explore new presale condos in Vancouver with pricing and incentives",
        "url": "https://presaleproperties.com/vancouver-presale-condos"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 3,
        "name": "Langley Presale Condos",
        "description": "Discover presale condos in Langley with VIP access and floorplans",
        "url": "https://presaleproperties.com/langley-presale-condos"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 4,
        "name": "Coquitlam Presale Condos",
        "description": "Find presale condos in Coquitlam near Evergreen Line with pricing",
        "url": "https://presaleproperties.com/coquitlam-presale-condos"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 5,
        "name": "Burnaby Presale Condos",
        "description": "Browse presale condos in Burnaby near Metrotown and Brentwood",
        "url": "https://presaleproperties.com/burnaby-presale-condos"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 6,
        "name": "Surrey Presale Townhomes",
        "description": "Explore presale townhomes in Surrey with VIP pricing",
        "url": "https://presaleproperties.com/surrey-presale-townhomes"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 7,
        "name": "Langley Presale Townhomes",
        "description": "Browse presale townhomes in Langley with floorplans and pricing",
        "url": "https://presaleproperties.com/langley-presale-townhomes"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 8,
        "name": "All Presale Projects",
        "description": "Browse all presale condos and townhomes in Metro Vancouver",
        "url": "https://presaleproperties.com/presale-projects"
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

  // Mobile & Tablet: Show discovery-style layout
  if (isMobileOrTablet) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Helmet>
          <title>Presale Condos Vancouver | New Construction Pricing & Floor Plans | PresaleProperties</title>
          <meta name="description" content="Browse presale condos in Vancouver, Surrey, Langley, Coquitlam & Burnaby. Get VIP pricing, floor plans & incentives for new construction condos and townhomes across Metro Vancouver." />
          <meta name="keywords" content="presale condos Vancouver, Vancouver presale condos pricing, Vancouver presale condos floor plans, new presale condos Vancouver, presale condos Surrey, Surrey new condos presale, presale condos Langley, Langley presale townhomes, presale condos Coquitlam, Burnaby presale condos, Delta presale condos, Abbotsford presale condos, Fraser Valley presale condos, VIP presale access, presale register" />
          <link rel="canonical" href="https://presaleproperties.com/" />
          
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Presale Condos Vancouver | VIP Pricing & Floor Plans" />
          <meta property="og:description" content="Browse presale condos in Vancouver, Surrey, Langley & Coquitlam. Get VIP pricing, floor plans & incentives for new construction projects." />
          <meta property="og:url" content="https://presaleproperties.com/" />
          <meta property="og:site_name" content="PresaleProperties.com" />
          <meta property="og:locale" content="en_CA" />
          
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Presale Condos Vancouver | New Construction Pricing" />
          <meta name="twitter:description" content="Browse presale condos in Metro Vancouver. VIP pricing, floor plans & early access to new construction." />
          
          <meta name="geo.region" content="CA-BC" />
          <meta name="geo.placename" content="Vancouver" />
          
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
        <MobileHomePage />
      </div>
    );
  }

  // Desktop: Original layout
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Presale Condos Vancouver | New Construction Pricing & Floor Plans | PresaleProperties</title>
        <meta name="description" content="Browse presale condos in Vancouver, Surrey, Langley, Coquitlam & Burnaby. Get VIP pricing, floor plans & incentives for new construction condos and townhomes across Metro Vancouver." />
        <meta name="keywords" content="presale condos Vancouver, Vancouver presale condos pricing, Vancouver presale condos floor plans, new presale condos Vancouver, presale condos Surrey, Surrey new condos presale, presale condos Langley, Langley presale townhomes, presale condos Coquitlam, Burnaby presale condos, Delta presale condos, Abbotsford presale condos, Fraser Valley presale condos, VIP presale access, presale register" />
        <link rel="canonical" href="https://presaleproperties.com/" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Presale Condos Vancouver | VIP Pricing & Floor Plans" />
        <meta property="og:description" content="Browse presale condos in Vancouver, Surrey, Langley & Coquitlam. Get VIP pricing, floor plans & incentives for new construction projects." />
        <meta property="og:url" content="https://presaleproperties.com/" />
        <meta property="og:site_name" content="PresaleProperties.com" />
        <meta property="og:locale" content="en_CA" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Presale Condos Vancouver | New Construction Pricing" />
        <meta name="twitter:description" content="Browse presale condos in Metro Vancouver. VIP pricing, floor plans & early access to new construction." />
        
        <meta name="geo.region" content="CA-BC" />
        <meta name="geo.placename" content="Vancouver" />
        
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
        <HeroSection />
        <ScrollReveal animation="fade-up">
          <FeaturedProjects />
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={100}>
          <CityProjectsSection />
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={100}>
          <NewConstructionBenefits />
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={100}>
          <HomeMapSection />
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={100}>
          <RelatedContent />
        </ScrollReveal>
        <ScrollReveal animation="scale" delay={100}>
          <BuyerCTASection />
        </ScrollReveal>
      </main>
      
      {/* Desktop Map Button */}
      <Link 
        to="/map-search"
        className="fixed bottom-6 right-6 z-50 hidden lg:block md:bottom-8 md:right-8"
      >
        <Button 
          size="lg" 
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Map className="h-6 w-6" />
          <span className="sr-only">View Map</span>
        </Button>
      </Link>
      
      <Footer />
    </div>
  );
};

export default Index;
