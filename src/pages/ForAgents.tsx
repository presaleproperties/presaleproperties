import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Shield, 
  Eye, 
  Lock, 
  Users, 
  Search, 
  Calendar,
  ArrowRight,
  MessageSquare,
  Building2
} from "lucide-react";

export default function ForAgents() {
  return (
    <>
      <Helmet>
        <title>For Agents | List Your Assignment | PresaleProperties Vancouver</title>
        <meta 
          name="description" 
          content="A dedicated marketplace for licensed real estate agents to list presale condo assignments in Vancouver. Developer-compliant, searchable, and built for serious agents." 
        />
        <link rel="canonical" href="https://presaleproperties.com/agents" />
      </Helmet>

      <ConversionHeader />

      <main>
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
          <div className="container max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              A Better Way to Market Presale Assignments
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A dedicated marketplace built for agents who actually do assignments in Vancouver.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="shadow-gold text-lg px-8">
                  List an Assignment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  How It Works
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* The Real Problem */}
        <section className="py-16 lg:py-24">
          <div className="container max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Presale Assignments Don't Have a Marketplace
            </h2>
            <div className="prose prose-lg text-muted-foreground">
              <p>
                There is no central database for presale assignments in Vancouver.
                Inventory is scattered across Facebook groups, WhatsApp chats, Instagram stories, and email threads.
              </p>
              <p className="font-medium text-foreground">
                None of it is searchable.<br />
                None of it is organized.<br />
                None of it is built for buyers.
              </p>
              <p>
                As a result, serious buyers miss opportunities and agents struggle to surface assignments.
              </p>
            </div>
          </div>
        </section>

        {/* Why Facebook & WhatsApp Don't Work */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container max-w-3xl">
            <div className="flex items-start gap-4 mb-6">
              <MessageSquare className="h-10 w-10 text-muted-foreground flex-shrink-0 mt-1" />
              <h2 className="text-3xl md:text-4xl font-bold">
                Private Groups Aren't Built to Sell Real Estate
              </h2>
            </div>
            <div className="prose prose-lg text-muted-foreground ml-14">
              <p>
                Assignments posted in private groups get buried within hours.
                They aren't searchable, indexed, or discoverable by buyers actively looking.
              </p>
              <p className="font-semibold text-foreground">
                That's not exposure. That's noise.
              </p>
            </div>
          </div>
        </section>

        {/* Why This Marketplace Exists */}
        <section className="py-16 lg:py-24">
          <div className="container max-w-3xl">
            <div className="flex items-start gap-4 mb-6">
              <Building2 className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
              <h2 className="text-3xl md:text-4xl font-bold">
                Assignments Deserve Their Own Marketplace
              </h2>
            </div>
            <div className="prose prose-lg text-muted-foreground ml-14">
              <p>
                PresaleProperties was built specifically for presale assignments — not MLS, not social media.
              </p>
              <p>
                It gives assignments a permanent, searchable home where buyers actually come to look.
              </p>
            </div>
          </div>
        </section>

        {/* Developer Restrictions Explained */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container max-w-3xl">
            <div className="flex items-start gap-4 mb-6">
              <Shield className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
              <h2 className="text-3xl md:text-4xl font-bold">
                Built With Developer Marketing Rules in Mind
              </h2>
            </div>
            <div className="prose prose-lg text-muted-foreground ml-14">
              <p>
                Many developers do not allow public marketing of assignments.
                This is common and expected in presales.
              </p>
              <p>
                PresaleProperties supports two listing types:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 not-prose mt-6">
                <div className="p-4 rounded-lg border bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Public Assignments</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Full details visible to all visitors
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-5 w-5 text-amber-600" />
                    <span className="font-semibold">Restricted Assignments</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Developer-compliant, details shared on inquiry
                  </p>
                </div>
              </div>
              <p className="mt-6">
                Restricted assignments hide sensitive details and require buyer inquiry to access full information.
              </p>
            </div>
          </div>
        </section>

        {/* Why Restricted Listings Work */}
        <section className="py-16 lg:py-24">
          <div className="container max-w-3xl">
            <div className="flex items-start gap-4 mb-6">
              <Lock className="h-10 w-10 text-amber-600 flex-shrink-0 mt-1" />
              <h2 className="text-3xl md:text-4xl font-bold">
                Restricted Assignments Aren't a Limitation — They're an Advantage
              </h2>
            </div>
            <div className="prose prose-lg text-muted-foreground ml-14">
              <p>By gating sensitive details, restricted assignments:</p>
              <ul className="space-y-2 not-prose mt-4">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Stay compliant with developer rules</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Filter out tire-kickers</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Generate higher-intent buyer inquiries</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Put you in control of disclosure</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* What Agents Get */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
              What This Platform Gives You
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                "A central, searchable assignment marketplace",
                "Public exposure without breaking developer rules",
                "Assignments buyers can actually find",
                "Direct buyer inquiries to your email",
                "No middleman — you control the conversation",
                "Higher-quality buyer inquiries",
                "Admin-approved, professional environment",
                "Pay once, listed for 365 days",
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Direct Lead Routing Feature */}
        <section className="py-16 lg:py-24">
          <div className="container max-w-3xl">
            <div className="flex items-start gap-4 mb-6">
              <Users className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
              <h2 className="text-3xl md:text-4xl font-bold">
                All Leads Go Directly to You
              </h2>
            </div>
            <div className="prose prose-lg text-muted-foreground ml-14">
              <p>
                When a buyer submits an inquiry on your assignment, the lead is sent directly to your email.
              </p>
              <p>
                No platform middleman. No lead aggregation. No shared inquiries.
              </p>
              <p className="font-semibold text-foreground">
                You own the relationship from first contact.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 lg:py-24">
          <div className="container max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
              How It Works
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: "1", title: "Verify your license", icon: Shield },
                { step: "2", title: "Post your assignment", icon: Building2 },
                { step: "3", title: "Choose visibility mode", icon: Eye },
                { step: "4", title: "Receive buyer inquiries", icon: Users },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Step {item.step}
                  </div>
                  <div className="font-semibold text-lg">{item.title}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who This Is For */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              This Is Built for Serious Assignment Agents
            </h2>
            <div className="prose prose-lg text-muted-foreground">
              <p>
                This platform is for agents who handle presale assignments professionally and want real exposure in a compliant environment.
              </p>
              <p className="font-medium text-foreground">
                If you rely on Facebook groups and WhatsApp chats, this platform is not for you.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 lg:py-32 bg-primary/5">
          <div className="container max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to List Your Assignment?
            </h2>
            <Link to="/login">
              <Button size="lg" className="shadow-gold text-lg px-10 mb-4">
                List an Assignment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              Pay once. Stay listed for 365 days.
            </p>
          </div>
        </section>

        {/* Footer Disclaimer */}
        <section className="py-8 border-t">
          <div className="container max-w-3xl">
            <p className="text-sm text-muted-foreground text-center">
              All assignments are submitted by licensed real estate agents and reviewed prior to publication. 
              PresaleProperties does not represent developers and does not facilitate transactions.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}