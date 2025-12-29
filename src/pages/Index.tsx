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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "PresaleProperties.com",
    "url": "https://presaleproperties.com",
    "description": "Metro Vancouver's leading platform for presale condos, townhomes, and new construction homes in Vancouver, Surrey, Langley, Coquitlam, Burnaby, Delta, and Abbotsford.",
    "areaServed": ["Vancouver", "Surrey", "Langley", "Coquitlam", "Burnaby", "Delta", "Abbotsford", "Richmond"],
    "serviceType": ["Presale Condos", "New Construction Homes", "Townhomes", "Pre-Construction Real Estate"]
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Presale Properties | New Construction Condos & Townhomes in Metro Vancouver</title>
        <meta name="description" content="Browse presale condos, townhomes & new construction homes in Vancouver, Surrey, Langley, Coquitlam, Burnaby, Delta & Abbotsford. VIP pricing, floor plans & early access." />
        <meta name="keywords" content="presale condos Vancouver, new construction Surrey, presale townhomes Langley, new homes Coquitlam, pre-construction Burnaby, presale Delta, new developments Abbotsford, Metro Vancouver presale" />
        <link rel="canonical" href="https://presaleproperties.com/" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Presale Properties | New Construction in Metro Vancouver" />
        <meta property="og:description" content="Browse presale condos, townhomes & new construction homes in Vancouver, Surrey, Langley, Coquitlam & more." />
        <meta property="og:url" content="https://presaleproperties.com/" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Presale Properties | New Construction in Metro Vancouver" />
        <meta name="twitter:description" content="Browse presale condos, townhomes & new construction homes in Metro Vancouver." />
        
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
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
