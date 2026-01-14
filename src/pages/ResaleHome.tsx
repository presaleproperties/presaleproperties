import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { ResaleHeroSection } from "@/components/resale/ResaleHeroSection";
import { HottestResaleListings } from "@/components/resale/HottestResaleListings";
import { ResalePropertyTypeSection } from "@/components/resale/ResalePropertyTypeSection";
import { ResaleCitySectionCompact } from "@/components/resale/ResaleCitySectionCompact";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { HomeUnifiedMapSection } from "@/components/map/HomeUnifiedMapSection";
import { ROICalculatorTeaser } from "@/components/home/ROICalculatorTeaser";
import { RelatedContent } from "@/components/home/RelatedContent";
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
      { "@type": "City", "name": "Burnaby" },
      { "@type": "City", "name": "Vancouver" },
      { "@type": "City", "name": "Coquitlam" },
      { "@type": "City", "name": "Langley" }
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
          <title>New Homes for Sale BC | Move-In Ready 2025 Builds | PresaleProperties</title>
          <meta name="title" content="New Homes for Sale BC | Move-In Ready 2025 Builds" />
          <meta name="description" content="Find ready-to-move-in new construction homes in Vancouver, Surrey, Burnaby & BC. Brand new condos and townhomes built 2025+ with full warranty. Browse new builds today." />
          <meta name="keywords" content="new homes for sale Vancouver, move-in ready homes Surrey, 2025 new construction BC, new build condos, new townhomes, ready to move in homes, new construction homes BC" />
          <link rel="canonical" href="https://presaleproperties.com/resale" />
          <meta name="robots" content="index, follow, max-image-preview:large" />
          
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://presaleproperties.com/resale" />
          <meta property="og:title" content="New Homes for Sale BC | Move-In Ready 2025 Builds" />
          <meta property="og:description" content="Find move-in ready new construction homes in Metro Vancouver. Brand new condos and townhomes built 2025+." />
          <meta property="og:image" content="https://presaleproperties.com/og-image.png" />
          
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="New Homes for Sale BC | Move-In Ready 2025" />
          <meta name="twitter:description" content="Find move-in ready new construction homes in Metro Vancouver." />
          
          <meta name="geo.region" content="CA-BC" />
          <meta name="geo.placename" content="Vancouver" />
          
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
        <title>New Homes for Sale BC | Move-In Ready 2025 Builds | PresaleProperties</title>
        <meta name="title" content="New Homes for Sale BC | Move-In Ready 2025 Builds" />
        <meta name="description" content="Find ready-to-move-in new construction homes in Vancouver, Surrey, Burnaby & BC. Brand new condos and townhomes built 2025+ with full warranty. Browse new builds today." />
        <meta name="keywords" content="new homes for sale Vancouver, move-in ready homes Surrey, 2025 new construction BC, new build condos, new townhomes, ready to move in homes, new construction homes BC" />
        <link rel="canonical" href="https://presaleproperties.com/resale" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://presaleproperties.com/resale" />
        <meta property="og:title" content="New Homes for Sale BC | Move-In Ready 2025 Builds" />
        <meta property="og:description" content="Find move-in ready new construction homes in Metro Vancouver. Brand new condos and townhomes built 2025+." />
        <meta property="og:image" content="https://presaleproperties.com/og-image.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="New Homes for Sale BC | Move-In Ready 2025" />
        <meta name="twitter:description" content="Find move-in ready new construction homes in Metro Vancouver." />
        
        <meta name="geo.region" content="CA-BC" />
        <meta name="geo.placename" content="Vancouver" />
        
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
        
        {/* Calculator Teaser */}
        <ScrollReveal animation="fade-up" delay={100}>
          <ROICalculatorTeaser />
        </ScrollReveal>
        
        {/* Related Content */}
        <ScrollReveal animation="fade-up" delay={100}>
          <RelatedContent />
        </ScrollReveal>
        
        {/* Large Map Section - Page Ending */}
        <ScrollReveal animation="fade-up" delay={100}>
          <HomeUnifiedMapSection initialMode="resale" contextType="resale" />
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
};

export default ResaleHome;
