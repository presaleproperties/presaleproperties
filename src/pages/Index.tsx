import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { FeaturedListings } from "@/components/home/FeaturedListings";
import { LatestListings } from "@/components/home/LatestListings";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturedProjects />
        <FeaturedListings />
        <LatestListings />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
