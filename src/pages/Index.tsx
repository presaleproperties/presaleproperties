import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { TrustBar } from "@/components/home/TrustBar";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { FeaturedListings } from "@/components/home/FeaturedListings";
import { LatestListings } from "@/components/home/LatestListings";
import { TrustSection } from "@/components/home/TrustSection";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <TrustBar />
        <FeaturedProjects />
        <FeaturedListings />
        <LatestListings />
        <TrustSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
