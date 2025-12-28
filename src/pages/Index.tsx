import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { CityProjectsSection } from "@/components/home/CityProjectsSection";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { BuyerCTASection } from "@/components/home/BuyerCTASection";

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
      
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturedProjects />
        <CityProjectsSection />
        <NewConstructionBenefits />
        <BuyerCTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
