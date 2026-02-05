import { Helmet } from "react-helmet-async";
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
import { ScrollReveal } from "@/components/ui/scroll-reveal";

// About page structured data
const aboutPageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About Presale Properties Group",
  "description": "A specialized real estate team guiding first-time buyers and investors through every step of the presale journey — from project selection to move-in or assignment.",
  "url": "https://presaleproperties.com/about",
  "mainEntity": {
    "@type": "RealEstateAgent",
    "name": "Presale Properties Group",
    "description": "Metro Vancouver's leading presale real estate team specializing in new condos, townhomes, and presale homes.",
    "areaServed": {
      "@type": "Place",
      "name": "Metro Vancouver and Fraser Valley, British Columbia"
    },
    "knowsLanguage": ["English", "Hindi", "Punjabi", "Urdu", "Arabic", "Korean"],
    "slogan": "New Condos & Presales. Expert Help. No Extra Cost."
  }
};

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>About Us | Presale Properties Group - New Condos & Presales. Expert Help. No Extra Cost.</title>
        <meta name="title" content="About Us | Presale Properties Group - New Condos & Presales. Expert Help. No Extra Cost." />
        <meta 
          name="description" 
          content="A specialized real estate team guiding first-time buyers and investors through every step of the presale journey. 400+ homes sold. Free expert guidance." 
        />
        <link rel="canonical" href="https://presaleproperties.com/about" />
        <meta name="robots" content="index, follow" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://presaleproperties.com/about" />
        <meta property="og:title" content="About Presale Properties Group - New Condos & Presales. Expert Help. No Extra Cost." />
        <meta property="og:description" content="A specialized real estate team guiding first-time buyers and investors through presales. 400+ homes sold. Free expert guidance." />
        <meta property="og:image" content="https://presaleproperties.com/og-about.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Presale Properties Group" />
        <meta name="twitter:description" content="New Condos & Presales. Expert Help. No Extra Cost. 400+ homes sold." />
        
        <script type="application/ld+json">
          {JSON.stringify(aboutPageSchema)}
        </script>
      </Helmet>

      <ConversionHeader />
      
      <main className="flex-1">
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
          <AboutCTA />
        </ScrollReveal>
      </main>
      
      <Footer />
    </div>
  );
}
