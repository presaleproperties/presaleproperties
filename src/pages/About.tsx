import { useEffect } from "react";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Shield, 
  Users, 
  Building2, 
  Target,
  CheckCircle,
  ArrowRight,
  Mail,
  Phone,
  BadgeCheck,
  FileSearch,
  Lock
} from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Trust & Transparency",
    description: "Every listing is verified by our team. Every agent is licensed and vetted. No surprises, just honest transactions."
  },
  {
    icon: Users,
    title: "Agent-First Platform",
    description: "We built this platform with real estate professionals in mind, providing tools that make listing and managing assignments effortless."
  },
  {
    icon: Building2,
    title: "Local Expertise",
    description: "Focused exclusively on Metro Vancouver's pre-construction market, we understand the unique dynamics of assignment sales in this region."
  },
  {
    icon: Target,
    title: "Quality Over Quantity",
    description: "We prioritize curated, high-quality listings over volume, ensuring buyers find genuine opportunities."
  }
];

const stats = [
  { value: "500+", label: "Assignments Listed" },
  { value: "200+", label: "Verified Agents" },
  { value: "50+", label: "Developer Projects" },
  { value: "98%", label: "Satisfaction Rate" }
];

const trustFeatures = [
  {
    icon: BadgeCheck,
    title: "Licensed Agents Only",
    description: "Every agent is verified with a valid BC real estate license"
  },
  {
    icon: FileSearch,
    title: "Admin-Reviewed Listings",
    description: "Our team reviews every listing before it goes live"
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your information is protected and never shared without consent"
  }
];

export default function About() {
  useEffect(() => {
    document.title = "About Us | AssignmentHub Vancouver - Trusted Assignment Marketplace";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Learn about AssignmentHub Vancouver, the trusted marketplace for pre-construction condo assignments. Verified agents, admin-reviewed listings, and complete transparency.");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ConversionHeader />
      
      <main className="flex-1 pt-14 md:pt-16">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-muted/50 to-background">
          <div className="container">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                Vancouver's Trusted Assignment Marketplace
              </h1>
              <p className="text-xl text-muted-foreground">
                AssignmentHub connects buyers with pre-construction assignment opportunities through a network of verified real estate professionals. We're making assignment sales accessible, transparent, and secure.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-b border-border">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="py-12 bg-primary/5">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-8">
              {trustFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-primary font-medium uppercase tracking-wider text-sm">Our Story</span>
                <h2 className="text-3xl font-bold mt-2 mb-6">Built for Vancouver's Unique Market</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Vancouver's pre-construction market is unlike anywhere else in Canada. With limited land, high demand, and significant price appreciation, assignment sales have become an essential part of the real estate ecosystem.
                  </p>
                  <p>
                    Yet finding assignment opportunities has always been challenging. Listings were scattered across classified sites, social media groups, and word-of-mouth networks. Buyers struggled to find legitimate opportunities, and agents lacked a professional platform to showcase their listings.
                  </p>
                  <p>
                    AssignmentHub was created to solve this problem. We built a dedicated marketplace where verified agents can list assignments and qualified buyers can browse with confidence, knowing every listing has been reviewed and every agent is licensed.
                  </p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-2xl p-8 lg:p-12">
                <h3 className="text-xl font-semibold mb-6">Our Mission</h3>
                <p className="text-lg text-muted-foreground mb-8">
                  To create the most trusted and efficient marketplace for pre-construction assignment sales in Vancouver, empowering buyers and agents with transparency, security, and opportunity.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Verify every agent and listing</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Provide complete transparency on pricing and terms</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Connect buyers with qualified opportunities</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Support agents with professional listing tools</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <span className="text-primary font-medium uppercase tracking-wider text-sm">Our Values</span>
              <h2 className="text-3xl font-bold mt-2">What We Stand For</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">Why Choose AssignmentHub?</h2>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Verified Agents Only</h3>
                    <p className="text-sm text-muted-foreground">
                      Every agent on our platform is a licensed real estate professional. We verify license numbers and brokerage affiliations before approving any account.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Admin-Reviewed Listings</h3>
                    <p className="text-sm text-muted-foreground">
                      Unlike classified sites, every listing on AssignmentHub is reviewed by our team for accuracy, completeness, and legitimacy before going live.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Complete Transparency</h3>
                    <p className="text-sm text-muted-foreground">
                      We require detailed information on every listing including original purchase price, deposits paid, assignment fee, and completion dates so buyers can make informed decisions.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Vancouver Focus</h3>
                    <p className="text-sm text-muted-foreground">
                      We specialize exclusively in the Greater Vancouver market, giving us deep knowledge of local developers, projects, and market conditions.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
                <p className="text-primary-foreground/80 mb-8">
                  Have questions about AssignmentHub? Want to learn more about listing your assignments? We'd love to hear from you.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5" />
                    <span>info@assignmenthub.ca</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5" />
                    <span>(604) 555-0123</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 lg:justify-end">
                <Link to="/assignments">
                  <Button size="lg" variant="secondary">
                    Browse Assignments
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    Agent Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
