import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { HeroSection, SearchTab } from "@/components/home/HeroSection";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { MobileHomePage } from "@/components/mobile/MobileHomePage";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";
import { TeslaFeaturedProjects } from "@/components/home/TeslaFeaturedProjects";
import { TeslaFeaturedResale } from "@/components/home/TeslaFeaturedResale";
import { TeslaCityStrip } from "@/components/home/TeslaCityStrip";
import { TeslaWhyPresale } from "@/components/home/TeslaWhyPresale";
import { TeslaVIPBanner } from "@/components/home/TeslaVIPBanner";
import { HomeUnifiedMapSection } from "@/components/map/HomeUnifiedMapSection";

const HOME_FAQS = [
  { question: "What is a presale?", answer: "A presale is a real estate purchase where you buy a property before it is built. You sign a contract and pay a deposit to secure a unit in a development that is still under construction. The full purchase price is paid when the building is completed, typically 2-4 years later." },
  { question: "How do presales work?", answer: "Presales work in 5 steps: First, register with the developer to receive pricing and floor plans. Second, select your unit and sign a purchase agreement. Third, pay a deposit (typically 15-20%) in installments over 12-18 months. Fourth, wait for construction to complete (usually 2-4 years). Fifth, pay the remaining balance and take possession of your new home." },
  { question: "What is the difference between a presale and an assignment?", answer: "A presale is purchased directly from the developer before construction is complete. An assignment is when the original presale buyer sells their contract to a new buyer before the building is finished. With an assignment, you take over the original buyer's purchase agreement and pay the remaining deposit and closing costs." },
  { question: "How much deposit do I need for a presale in BC?", answer: "Presale deposits in British Columbia typically range from 15% to 20% of the purchase price, paid in installments over 12-18 months. A common deposit structure is 5% at signing, 5% at 90 days, 5% at 180 days, and 5% at 12 months or foundation completion." },
  { question: "What is the benefit of buying presale?", answer: "Buying presale allows you to lock in today's prices while the development is built, often with lower deposit requirements than resale properties. Presales typically appreciate in value by completion, meaning you may have built-in equity before moving in. You also get a brand new home with modern finishes and full warranty coverage." },
  { question: "Where can I find presale condos in Vancouver?", answer: "PresaleProperties.com lists presale condos and townhomes across Metro Vancouver including Vancouver, Surrey, Burnaby, Coquitlam, Langley, Richmond, Delta, and Abbotsford. Register for VIP access to get early pricing, floor plans, and exclusive incentives." },
];

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["RealEstateAgent", "LocalBusiness"],
  "@id": "https://presaleproperties.com/#organization",
  "name": "PresaleProperties.com",
  "url": "https://presaleproperties.com",
  "logo": "https://presaleproperties.com/logo.svg",
  "description": "Metro Vancouver's leading platform for presale condos, townhomes, and new construction homes.",
  "telephone": "+1-672-258-1100",
  "email": "info@presaleproperties.com",
  "address": { "@type": "PostalAddress", "addressLocality": "Vancouver", "addressRegion": "BC", "addressCountry": "CA" },
  "areaServed": ["Vancouver","Surrey","Langley","Coquitlam","Burnaby","Delta","Abbotsford","Richmond"].map(n => ({ "@type": "City", "name": n })),
  "priceRange": "$400,000 - $3,000,000",
};

const Index = () => {
  const isMobileOrTablet = useIsMobileOrTablet();
  const [activeTab, setActiveTab] = useState<SearchTab>("projects");

  if (isMobileOrTablet) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Helmet>
          <title>Vancouver Presale Condos & Townhomes 2026 | PresaleProperties</title>
          <meta name="description" content="Browse 100+ presale condos & townhomes in Metro Vancouver. VIP pricing, floor plans & early access for Surrey, Langley, Burnaby, Coquitlam. New construction experts." />
          <link rel="canonical" href="https://presaleproperties.com/" />
          <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
        </Helmet>
        <FAQSchema faqs={HOME_FAQS} />
        <ConversionHeader transparentOnMobile />
        <MobileHomePage activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Vancouver Presale Condos & Townhomes 2026 | PresaleProperties</title>
        <meta name="description" content="Browse 100+ presale condos & townhomes in Metro Vancouver. VIP pricing, floor plans & early access for Surrey, Langley, Burnaby, Coquitlam. New construction experts." />
        <link rel="canonical" href="https://presaleproperties.com/" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://presaleproperties.com/" />
        <meta property="og:title" content="Vancouver Presale Condos & Townhomes 2026" />
        <meta property="og:description" content="Browse 100+ presale condos & townhomes in Metro Vancouver. VIP pricing, floor plans & early access." />
        <meta property="og:image" content="https://presaleproperties.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      </Helmet>
      <FAQSchema faqs={HOME_FAQS} />

      <ConversionHeader />

      <main className="flex-1">
        {/* 1. Full-bleed hero with search */}
        <HeroSection activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 2. Tesla-style: featured presale projects — full-bleed split cards */}
        <TeslaFeaturedProjects />

        {/* 3. City strip — compact horizontal nav */}
        <TeslaCityStrip activeTab={activeTab} />

        {/* 4. Featured resale / move-in ready */}
        <TeslaFeaturedResale />

        {/* 5. Why presale — editorial two-column */}
        <TeslaWhyPresale />

        {/* 6. VIP banner — full-bleed CTA */}
        <TeslaVIPBanner />

        {/* 7. Map section */}
        <HomeUnifiedMapSection initialMode={activeTab === "projects" ? "presale" : "resale"} contextType="home" />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
