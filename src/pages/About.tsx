import { Helmet } from "@/components/seo/Helmet";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { AboutHero } from "@/components/about/AboutHero";
import { WhoWeAre } from "@/components/about/WhoWeAre";
import { WhatWeDoDifferently } from "@/components/about/WhatWeDoDifferently";
import { ForBuyersSection } from "@/components/about/ForBuyersSection";
import { MeetTheTeam } from "@/components/about/MeetTheTeam";
import { ClientImpact } from "@/components/about/ClientImpact";
import { ClientTestimonials } from "@/components/about/ClientTestimonials";
import { AboutCTA } from "@/components/about/AboutCTA";
import { AreasOfFocus } from "@/components/about/AreasOfFocus";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

// About page structured data
const aboutPageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About Presale Properties Group",
  "description": "A specialized real estate team guiding first-time buyers and investors through new condos, townhomes, duplexes, and single-family homes across Metro Vancouver and Fraser Valley.",
  "url": "https://presaleproperties.com/about",
  "mainEntity": {
    "@type": "RealEstateAgent",
    "name": "Presale Properties Group",
    "description": "Metro Vancouver and Fraser Valley's leading new construction real estate team specializing in condos, townhomes, duplexes, and single-family homes.",
    "areaServed": [
      {
        "@type": "Place",
        "name": "Metro Vancouver, British Columbia"
      },
      {
        "@type": "Place",
        "name": "Fraser Valley, British Columbia"
      }
    ],
    "knowsLanguage": ["English", "Hindi", "Punjabi", "Urdu", "Arabic"],
    "slogan": "New Construction. Expert Help. No Extra Cost."
  }
};

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MetaTags
        title="About Presale Properties Group | New Construction Experts"
        description="Meet Uzair Muhammad and The Presale Properties Group — Surrey-based presale specialists. 400+ buyers helped across Metro Vancouver since 2020."
        url="https://presaleproperties.com/about"
        type="website"
      />
      <Helmet>
        <title>About Us | Presale Properties Group - New Construction Experts</title>
        <meta name="title" content="About Us | Presale Properties Group - New Construction Experts" />
        <meta 
          name="description" 
          content="Meet Uzair Muhammad and The Presale Properties Group — Surrey-based presale specialists. 400+ buyers helped across Metro Vancouver since 2020." 
        />
        <link rel="canonical" href="https://presaleproperties.com/about" />
        <meta name="robots" content="index, follow" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://presaleproperties.com/about" />
        <meta property="og:title" content="About Presale Properties Group - New Construction Experts" />
        <meta property="og:description" content="Specialized team for new condos, townhomes, duplexes & single-family homes. 400+ homes sold. Free expert guidance." />
        <meta property="og:image" content="https://presaleproperties.com/og-image.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Presale Properties Group" />
        <meta name="twitter:description" content="New Construction. Expert Help. No Extra Cost. 400+ homes sold." />
        
        <script type="application/ld+json">
          {JSON.stringify(aboutPageSchema)}
        </script>
      </Helmet>

      <ConversionHeader />
      
      <main className="flex-1">
        <div className="border-b bg-muted/30">
          <div className="container py-3">
            <Breadcrumbs items={[{ label: "About Us" }]} />
          </div>
        </div>
        <AboutHero />
        
        <ScrollReveal animation="fade-up">
          <WhoWeAre />
        </ScrollReveal>
        
        <ScrollReveal animation="fade-up" delay={50}>
          <WhatWeDoDifferently />
        </ScrollReveal>
        
        <ScrollReveal animation="fade-up" delay={50}>
          <ForBuyersSection />
        </ScrollReveal>
        
        <ScrollReveal animation="fade-up" delay={50}>
          <MeetTheTeam />
        </ScrollReveal>
        
        <ScrollReveal animation="fade-up" delay={50}>
          <ClientImpact />
        </ScrollReveal>
        
        <ScrollReveal animation="fade-up" delay={50}>
          <ClientTestimonials />
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={50}>
          <AreasOfFocus />
        </ScrollReveal>
        
        <ScrollReveal animation="fade-up" delay={50}>
          <AboutCTA />
        </ScrollReveal>
      </main>
      
      <Footer />
    </div>
  );
}
