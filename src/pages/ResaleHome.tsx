import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { ResaleHeroSection } from "@/components/resale/ResaleHeroSection";
import { FeaturedResaleListings } from "@/components/home/FeaturedResaleListings";
import { ResaleCitySection } from "@/components/resale/ResaleCitySection";
import { ResaleMapSection } from "@/components/resale/ResaleMapSection";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { BuyerCTASection } from "@/components/home/BuyerCTASection";
import { RelatedContent } from "@/components/home/RelatedContent";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MobileResaleHome } from "@/components/mobile/MobileResaleHome";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";

const ResaleHome = () => {
  const isMobileOrTablet = useIsMobileOrTablet();

  // Structured data for resale homepage
  const resaleSchema = {
    "@context": "https://schema.org",
    "@type": ["RealEstateAgent", "LocalBusiness"],
    "@id": "https://presaleproperties.com/resale#organization",
    "name": "PresaleProperties.com - Resale Homes",
    "url": "https://presaleproperties.com/resale",
    "description": "Browse MLS listings for condos and townhomes for sale in Metro Vancouver. Find homes in Vancouver, Surrey, Burnaby, Coquitlam, Langley and more.",
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
      { "@type": "City", "name": "Richmond" }
    ]
  };

  if (isMobileOrTablet) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Helmet>
          <title>Condos & Townhomes for Sale Vancouver | MLS Listings | PresaleProperties</title>
          <meta name="description" content="Browse condos and townhomes for sale in Vancouver, Surrey, Burnaby, Coquitlam & Langley. Find MLS listings with prices, photos and agent info." />
          <link rel="canonical" href="https://presaleproperties.com/resale" />
          <script type="application/ld+json">
            {JSON.stringify(resaleSchema)}
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
        <title>Condos & Townhomes for Sale Vancouver | MLS Listings | PresaleProperties</title>
        <meta name="description" content="Browse condos and townhomes for sale in Vancouver, Surrey, Burnaby, Coquitlam & Langley. Find MLS listings with prices, photos and agent info." />
        <meta name="keywords" content="condos for sale Vancouver, townhomes for sale Surrey, Vancouver MLS listings, Burnaby condos for sale, Coquitlam real estate, Langley homes for sale" />
        <link rel="canonical" href="https://presaleproperties.com/resale" />
        <script type="application/ld+json">
          {JSON.stringify(resaleSchema)}
        </script>
      </Helmet>

      <ConversionHeader />
      <main className="flex-1">
        <ResaleHeroSection />
        <ScrollReveal animation="fade-up">
          <FeaturedResaleListings />
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={100}>
          <ResaleCitySection />
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={100}>
          <ResaleMapSection />
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={100}>
          <NewConstructionBenefits />
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={100}>
          <RelatedContent />
        </ScrollReveal>
        <ScrollReveal animation="scale" delay={100}>
          <BuyerCTASection />
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
};

export default ResaleHome;
