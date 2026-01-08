import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Download,
  FileText,
  BarChart3,
  Calendar,
  ArrowRight,
  Clock,
  Building2,
  Users,
  Tag,
  Lock,
  TrendingUp
} from "lucide-react";

export default function ForAgents() {
  return (
    <>
      <Helmet>
        <title>For Agents | Market Assignments & Access Off-Market Deals | PresaleProperties</title>
        <meta 
          name="description" 
          content="Market your own assignments and access exclusive off-market deals. The agent platform built for presale specialists." 
        />
        <link rel="canonical" href="https://presaleproperties.com/agents" />
      </Helmet>

      <ConversionHeader />

      <main>
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
          <div className="container max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Your Assignment Advantage
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Market your own assignments. Access off-market deals. Close more presale transactions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login?tab=signup&type=agent">
                <Button size="lg" className="shadow-gold text-lg px-8">
                  Join as an Agent
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Agent Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Assignment Value Proposition */}
        <section className="py-16 lg:py-24 bg-primary/5">
          <div className="container max-w-4xl">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 rounded-xl bg-background border-2 border-primary/20">
                <Tag className="h-10 w-10 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-4">Market Your Assignments</h2>
                <p className="text-muted-foreground mb-4">
                  List your client's assignments to our network of active buyers and agents.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Reach qualified presale buyers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Professional listing presentation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Direct buyer inquiries to you</span>
                  </li>
                </ul>
              </div>
              <div className="p-8 rounded-xl bg-background border-2 border-primary/20">
                <Lock className="h-10 w-10 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-4">Access Off-Market Deals</h2>
                <p className="text-muted-foreground mb-4">
                  Get early access to assignments before they hit the public market.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Exclusive agent-only listings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>First look at new inventory</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Connect directly with selling agents</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="py-16 lg:py-24">
          <div className="container max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
              Everything You Need
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: Tag, text: "List and market your client's assignments" },
                { icon: Lock, text: "Access off-market assignment inventory" },
                { icon: FileText, text: "Download floor plans and pricing instantly" },
                { icon: Clock, text: "Always up-to-date project info" },
                { icon: BarChart3, text: "Compare projects side by side" },
                { icon: Calendar, text: "Book tours directly with developers" },
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                  <benefit.icon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Problem */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Stop Leaving Money on the Table
            </h2>
            <div className="prose prose-lg text-muted-foreground">
              <p>
                Your clients have assignments to sell. But where do you list them?
              </p>
              <p>
                Other agents have off-market deals. But how do you find them?
              </p>
              <p className="font-medium text-foreground">
                You need a platform built for presale agents.
              </p>
              <p>
                Our Agent Portal gives you everything in one place — your own assignments, off-market inventory, and all the project info you need.
              </p>
            </div>
          </div>
        </section>

        {/* What's Inside */}
        <section className="py-16 lg:py-24">
          <div className="container max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
              What's in the Agent Portal
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border bg-background">
                <TrendingUp className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Assignment Marketing</h3>
                <p className="text-muted-foreground">
                  List your client's assignments with photos, pricing, and floor plans.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-background">
                <Lock className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Off-Market Access</h3>
                <p className="text-muted-foreground">
                  Browse exclusive assignments not available to the public.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-background">
                <FileText className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Floor Plans</h3>
                <p className="text-muted-foreground">
                  Download floor plans for every unit type. Always the latest version.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-background">
                <BarChart3 className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Pricing Sheets</h3>
                <p className="text-muted-foreground">
                  See current pricing for all projects. Updated as prices change.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-background">
                <Download className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Brochures</h3>
                <p className="text-muted-foreground">
                  One-click download for all marketing materials.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-background">
                <Building2 className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Project Status</h3>
                <p className="text-muted-foreground">
                  Know if a project is preselling, under construction, or completed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
              How It Works
            </h2>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Sign Up", description: "Create your agent account in 2 minutes." },
                { step: "2", title: "List & Browse", description: "Market your assignments. Access off-market deals." },
                { step: "3", title: "Close Deals", description: "Connect with buyers and agents directly." },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {item.step}
                  </div>
                  <div className="font-semibold text-lg mb-2">{item.title}</div>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 lg:py-32 bg-primary/5">
          <div className="container max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Grow Your Presale Business?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join agents who are already listing assignments and accessing off-market inventory.
            </p>
            <Link to="/login?tab=signup&type=agent">
              <Button size="lg" className="shadow-gold text-lg px-10">
                Join as an Agent
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer Note */}
        <section className="py-8 border-t">
          <div className="container max-w-3xl">
            <p className="text-sm text-muted-foreground text-center">
              Agent Portal access is for licensed real estate professionals only.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
