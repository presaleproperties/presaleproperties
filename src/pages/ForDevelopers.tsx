import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Upload,
  Users,
  BarChart3,
  Clock,
  ArrowRight,
  Building2,
  FileText,
  Calendar
} from "lucide-react";

export default function ForDevelopers() {
  return (
    <>
      <Helmet>
        <title>For Developers | Share Your Projects with Active Agents | PresaleProperties</title>
        <meta 
          name="description" 
          content="Get your project in front of agents who actually sell presale condos. Share pricing and floor plans in one place. Spend less time on calls." 
        />
        <link rel="canonical" href="https://presaleproperties.com/for-developers" />
      </Helmet>

      <ConversionHeader />

      <main>
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
          <div className="container max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Get Your Project in Front of Active Agents
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Share your pricing and floor plans with agents who actually sell presale condos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login?tab=signup&type=developer">
                <Button size="lg" className="shadow-gold text-lg px-8">
                  Request Developer Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login?type=developer">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Developer Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* What This Is */}
        <section className="py-16 lg:py-24">
          <div className="container max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              This Is Not a Consumer Listing Site
            </h2>
            <div className="prose prose-lg text-muted-foreground">
              <p>
                We don't advertise to buyers.
              </p>
              <p>
                We share your project info with <strong>real estate agents</strong> who are actively selling presale condos.
              </p>
              <p className="font-medium text-foreground">
                Think of it as a distribution channel for agents.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
              Why Developers Use Our Platform
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: Users, text: "Reach agents who actively sell presales" },
                { icon: Upload, text: "Upload floor plans and pricing once" },
                { icon: Clock, text: "Spend less time answering calls" },
                { icon: BarChart3, text: "Keep your info up to date easily" },
                { icon: Calendar, text: "Receive tour requests directly" },
                { icon: CheckCircle, text: "Move inventory faster" },
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-background border">
                  <benefit.icon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What You Can Do */}
        <section className="py-16 lg:py-24">
          <div className="container max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
              What You Can Do in the Developer Portal
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border bg-background">
                <FileText className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Upload Floor Plans</h3>
                <p className="text-muted-foreground">
                  Add PDFs for each unit type. Replace them anytime.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-background">
                <BarChart3 className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Share Pricing Sheets</h3>
                <p className="text-muted-foreground">
                  Keep pricing current. Agents see the latest version.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-background">
                <Upload className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Add Brochures</h3>
                <p className="text-muted-foreground">
                  Upload marketing materials for agents to download.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-background">
                <Building2 className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Update Project Status</h3>
                <p className="text-muted-foreground">
                  Mark as preselling, under construction, or completed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Simple Process */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
              How It Works
            </h2>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Request Access", description: "Tell us about your company. We'll verify and approve you." },
                { step: "2", title: "Add Your Project", description: "Upload floor plans, pricing, and brochures." },
                { step: "3", title: "Agents Find You", description: "Active agents see your project. They book tours directly." },
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

        {/* Value Prop */}
        <section className="py-16 lg:py-24">
          <div className="container max-w-3xl text-center">
            <Building2 className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Spend Less Time on Calls. More Time Selling.
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              When agents have the info they need, they bring buyers faster.
            </p>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 lg:py-32 bg-primary/5">
          <div className="container max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Reach More Agents?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join developers who use our platform to share their projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login?tab=signup&type=developer">
                <Button size="lg" className="shadow-gold text-lg px-10">
                  Request Developer Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <section className="py-8 border-t">
          <div className="container max-w-3xl">
            <p className="text-sm text-muted-foreground text-center">
              Developer Portal access requires verification. We review all requests within 1-2 business days.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
