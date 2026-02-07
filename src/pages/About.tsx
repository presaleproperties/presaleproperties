import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { AboutHero } from "@/components/about/AboutHero";
import { WhoItsFor } from "@/components/about/WhoItsFor";
import { WhyItMatters } from "@/components/about/WhyItMatters";
import { WhyTrustUs } from "@/components/about/WhyTrustUs";
import { OurServices } from "@/components/about/OurServices";
import { MeetTheTeam } from "@/components/about/MeetTheTeam";
import { ClientImpact } from "@/components/about/ClientImpact";
import { ClientTestimonials } from "@/components/about/ClientTestimonials";
import { AboutFAQ } from "@/components/about/AboutFAQ";
import { AboutCTA } from "@/components/about/AboutCTA";
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
    "knowsLanguage": ["English", "Hindi", "Punjabi", "Urdu", "Arabic", "Korean"],
    "slogan": "New Construction. Expert Help. No Extra Cost."
  }
};

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>About Us | Presale Properties Group - New Construction Experts</title>
        <meta name="title" content="About Us | Presale Properties Group - New Construction Experts" />
        <meta 
          name="description" 
          content="Specialized real estate team for new condos, townhomes, duplexes & single-family homes in Metro Vancouver & Fraser Valley. 400+ homes sold. Free expert guidance." 
        />
        <link rel="canonical" href="https://presaleproperties.com/about" />
        <meta name="robots" content="index, follow" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://presaleproperties.com/about" />
        <meta property="og:title" content="About Presale Properties Group - New Construction Experts" />
        <meta property="og:description" content="Specialized team for new condos, townhomes, duplexes & single-family homes. 400+ homes sold. Free expert guidance." />
        <meta property="og:image" content="https://presaleproperties.com/og-about.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Presale Properties Group" />
        <meta name="twitter:description" content="New Construction. Expert Help. No Extra Cost. 400+ homes sold." />
        
        <script type="application/ld+json">
          {JSON.stringify(aboutPageSchema)}
        </script>
      </Helmet>

      <ConversionHeader />
      
      <main className="flex-1">
        {/* 1. What do you do? */}
        <AboutHero />
        
        {/* 2. Who is it for? */}
        <ScrollReveal animation="fade-up">
          <WhoItsFor />
        </ScrollReveal>
        
        {/* 3. What does it matter? */}
        <ScrollReveal animation="fade-up" delay={50}>
          <WhyItMatters />
        </ScrollReveal>
        
        {/* 4. Why should I trust you? */}
        <ScrollReveal animation="fade-up" delay={50}>
          <WhyTrustUs />
        </ScrollReveal>
        
        {/* 5. What are your services? */}
        <ScrollReveal animation="fade-up" delay={50}>
          <OurServices />
        </ScrollReveal>
        
        {/* 6. Show me proof */}
        <ScrollReveal animation="fade-up" delay={50}>
          <ClientImpact />
        </ScrollReveal>
        
        <ScrollReveal animation="fade-up" delay={50}>
          <ClientTestimonials />
        </ScrollReveal>
        
        {/* Meet the Team */}
        <ScrollReveal animation="fade-up" delay={50}>
          <MeetTheTeam />
        </ScrollReveal>
        
        {/* FAQ */}
        <ScrollReveal animation="fade-up" delay={50}>
          <AboutFAQ />
        </ScrollReveal>
        
        {/* 7. Tell me what to do next */}
        <ScrollReveal animation="fade-up" delay={50}>
          <AboutCTA />
        </ScrollReveal>
      </main>
      
      <Footer />
    </div>
  );
}
