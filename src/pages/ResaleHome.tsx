import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { ResaleHeroSection } from "@/components/resale/ResaleHeroSection";
import { HottestResaleListings } from "@/components/resale/HottestResaleListings";
import { ResalePropertyTypeSection } from "@/components/resale/ResalePropertyTypeSection";
import { ResaleCitySectionCompact } from "@/components/resale/ResaleCitySectionCompact";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { ResaleMapSection } from "@/components/resale/ResaleMapSection";
import { ROICalculatorTeaser } from "@/components/home/ROICalculatorTeaser";
import { RelatedContent } from "@/components/home/RelatedContent";
import { BuyerCTASection } from "@/components/home/BuyerCTASection";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MobileResaleHome } from "@/components/mobile/MobileResaleHome";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";

const ResaleHome = () => {
  const isMobileOrTablet = useIsMobileOrTablet();

  // Structured data for new homes page
  const newHomesSchema = {
    "@context": "https://schema.org",
    "@type": ["RealEstateAgent", "LocalBusiness"],
    "@id": "https://presaleproperties.com/resale#organization",
    "name": "PresaleProperties.com - New Construction Homes",
    "url": "https://presaleproperties.com/resale",
    "description": "Find ready-to-move-in newly built homes across Metro Vancouver and Fraser Valley. Brand new condos, townhomes, and detached homes built 2025 or later with full warranty protection.",
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
      { "@type": "City", "name": "Burnaby" },
      { "@type": "City", "name": "Coquitlam" },
      { "@type": "City", "name": "Langley" },
      { "@type": "City", "name": "Richmond" },
      { "@type": "City", "name": "Delta" },
      { "@type": "City", "name": "Abbotsford" }
    ],
    "knowsAbout": [
      "New Construction Homes",
      "Move-In Ready Homes",
      "New Build Condos",
      "New Build Townhomes",
      "2025 New Homes"
    ]
  };

  if (isMobileOrTablet) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Helmet>
          <title>New Homes for Sale | Move-In Ready 2025 Builds | PresaleProperties</title>
          <meta name="description" content="Find ready-to-move-in new construction homes in Vancouver, Surrey, Burnaby & BC. Brand new condos and townhomes built 2025+ with full warranty. Browse new builds today." />
          <link rel="canonical" href="https://presaleproperties.com/resale" />
          <script type="application/ld+json">
            {JSON.stringify(newHomesSchema)}
          </script>
        </Helmet>
        <ConversionHeader />
        <MobileResaleHome />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>New Homes for Sale | Move-In Ready 2025 Builds | PresaleProperties</title>
        <meta name="description" content="Find ready-to-move-in new construction homes in Vancouver, Surrey, Burnaby & BC. Brand new condos and townhomes built 2025+ with full warranty. Browse new builds today." />
        <meta name="keywords" content="new homes for sale Vancouver, move-in ready homes Surrey, 2025 new construction BC, new build condos, new townhomes, ready to move in homes" />
        <link rel="canonical" href="https://presaleproperties.com/resale" />
        <script type="application/ld+json">
          {JSON.stringify(newHomesSchema)}
        </script>
      </Helmet>

      <ConversionHeader />
      <main className="flex-1">
        <ResaleHeroSection />
        
        {/* Hottest Listings - Grid format like FeaturedProjects */}
        <ScrollReveal animation="fade-up">
          <HottestResaleListings />
        </ScrollReveal>
        
        {/* Property Type Carousels */}
        <ScrollReveal animation="fade-up" delay={100}>
          <ResalePropertyTypeSection />
        </ScrollReveal>
        
        {/* City Carousels */}
        <ScrollReveal animation="fade-up" delay={100}>
          <ResaleCitySectionCompact />
        </ScrollReveal>
        
        {/* Benefits Section */}
        <ScrollReveal animation="fade-up" delay={100}>
          <NewConstructionBenefits />
        </ScrollReveal>
        
        {/* Map Section */}
        <ScrollReveal animation="fade-up" delay={100}>
          <ResaleMapSection />
        </ScrollReveal>
        
        {/* Calculator Teaser */}
        <ScrollReveal animation="fade-up" delay={100}>
          <ROICalculatorTeaser />
        </ScrollReveal>
        
        {/* Related Content */}
        <ScrollReveal animation="fade-up" delay={100}>
          <RelatedContent />
        </ScrollReveal>
        
        {/* CTA Section */}
        <ScrollReveal animation="scale" delay={100}>
          <BuyerCTASection />
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
};

export default ResaleHome;
