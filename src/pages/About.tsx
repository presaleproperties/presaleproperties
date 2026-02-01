import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { AboutHero } from "@/components/about/AboutHero";
import { WhoWeAre } from "@/components/about/WhoWeAre";
import { WhatWeDoDifferently } from "@/components/about/WhatWeDoDifferently";
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
  "description": "Meet Vancouver's New Construction Specialists. We help first-time buyers and investors navigate the presale journey with clarity, confidence, and results.",
  "url": "https://presaleproperties.com/about",
  "mainEntity": {
    "@type": "RealEstateAgent",
    "name": "Presale Properties Group",
    "description": "Metro Vancouver's leading presale real estate team specializing 100% in new construction homes.",
    "areaServed": {
      "@type": "Place",
      "name": "Metro Vancouver, British Columbia"
    },
    "knowsLanguage": ["English", "Hindi", "Punjabi", "Urdu", "Arabic", "Korean"],
    "slogan": "Vancouver's New Construction Specialists"
  }
};

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>About Us | Presale Properties Group - Vancouver's New Construction Specialists</title>
        <meta name="title" content="About Us | Presale Properties Group - Vancouver's New Construction Specialists" />
        <meta 
          name="description" 
          content="Meet the team behind 400+ presale homes sold. We help first-time buyers and investors navigate presales with free expert guidance in English, Hindi, Punjabi, Korean & more." 
        />
        <link rel="canonical" href="https://presaleproperties.com/about" />
        <meta name="robots" content="index, follow" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://presaleproperties.com/about" />
        <meta property="og:title" content="About Presale Properties Group - Vancouver's New Construction Specialists" />
        <meta property="og:description" content="Meet the team behind 400+ presale homes sold. Free expert guidance for first-time buyers and investors." />
        <meta property="og:image" content="https://presaleproperties.com/og-about.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Presale Properties Group" />
        <meta name="twitter:description" content="Vancouver's New Construction Specialists - 400+ presale homes sold." />
        
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
