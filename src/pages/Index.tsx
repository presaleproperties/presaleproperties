import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { StickyConversionBar } from "@/components/conversion/StickyConversionBar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { CityProjectsSection } from "@/components/home/CityProjectsSection";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { BuyerCTASection } from "@/components/home/BuyerCTASection";
import { RelatedContent } from "@/components/home/RelatedContent";
import { FAQSchema } from "@/components/seo/FAQSchema";

// Homepage FAQs for structured data (helps with AI recommendations)
const HOME_FAQS = [
  {
    question: "What are presale condos?",
    answer: "Presale condos are properties sold before construction is complete. Buyers purchase at today's prices with a deposit, then pay the balance when the building is finished, typically 2-4 years later."
  },
  {
    question: "What is the difference between presale and assignment?",
    answer: "A presale is buying directly from the developer before completion. An assignment is when an original presale buyer sells their purchase contract to a new buyer before the building is finished."
  },
  {
    question: "Where can I find presale condos in Vancouver?",
    answer: "PresaleProperties.com lists presale condos and townhomes across Metro Vancouver including Vancouver, Surrey, Burnaby, Coquitlam, Langley, Richmond, and other cities."
  },
  {
    question: "How much deposit do I need for a presale?",
    answer: "Presale deposits typically range from 15-20% of the purchase price, paid in installments over 12-18 months. Some developers offer lower deposits or extended schedules."
  },
];

const Index = () => {
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
          {JSON.stringify(offerCatalogSchema)}
        </script>
      </Helmet>

      <FAQSchema faqs={HOME_FAQS} />
      
      <ConversionHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturedProjects />
        <CityProjectsSection />
        <NewConstructionBenefits />
        <RelatedContent />
        <BuyerCTASection />
      </main>
      <StickyConversionBar />
      <Footer />
    </div>
  );
};

export default Index;
