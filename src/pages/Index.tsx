import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { CityProjectsSection } from "@/components/home/CityProjectsSection";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { BuyerCTASection } from "@/components/home/BuyerCTASection";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
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
