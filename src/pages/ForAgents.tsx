import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  ArrowRight,
  FileText,
  Download,
  Calendar,
  Tag,
  Lock,
  Users,
  Zap,
  Star,
  Crown,
  Bell,
  MessageSquare,
  BadgeCheck
} from "lucide-react";

const tiers = [
  {
    name: "Core",
    price: 99,
    tagline: "Everything in one place. No chasing.",
    description: "For agents selling presale occasionally",
    features: [
      "Access all active presale projects",
      "Download floor plans, pricing, brochures",
      "Project status tracking",
      "Book tours directly with developers",
      "View assignment listings (read-only)",
    ],
    cta: "Start with Core",
    popular: false,
    icon: FileText,
  },
  {
    name: "Pro",
    price: 199,
    tagline: "Access deals before others — including assignments.",
    description: "For presale-focused & investor-focused agents",
    features: [
      "Everything in Core, plus:",
      "Early access to new presale projects",
      "Advanced project comparison",
      "Pricing update alerts",
      "Priority tour booking",
      "VERIFIED Presale Agent badge",
      "Full access to assignment listings",
      "Upload & market your own assignments",
    ],
    cta: "Go Pro",
    popular: true,
    icon: BadgeCheck,
  },
  {
    name: "Elite",
    price: 399,
    tagline: "Be first. Be visible. Move inventory faster.",
    description: "For high-volume presale & assignment agents",
    features: [
      "Everything in Pro, plus:",
      "Priority assignment placement",
      "Featured assignment exposure",
      "Early alerts on new assignments",
      "Direct agent-to-agent contact tools",
      "Priority support",
    ],
    cta: "Go Elite",
    popular: false,
    icon: Crown,
  },
];

export default function ForAgents() {
  return (
    <>
      <Helmet>
        <title>For Agents | Presale Project Hub for Real Estate Agents | PresaleProperties</title>
        <meta 
          name="description" 
          content="Everything you need to sell presale condos — in one place. Floor plans, pricing, brochures, assignments. No forms. No waiting." 
        />
        <link rel="canonical" href="https://presaleproperties.com/agents" />
      </Helmet>

      <ConversionHeader />

      <main>
        {/* Hero Section */}
        <section className="relative py-16 lg:py-20 bg-gradient-to-b from-background to-muted/30">
          <div className="container max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Users className="h-4 w-4" />
              For Licensed Agents Only
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              The Presale Agent Hub
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              Floor plans. Pricing. Brochures. Assignments.
            </p>
            <p className="text-base text-muted-foreground">
              No forms. No chasing developers. Everything in one place.
            </p>
          </div>
        </section>

        {/* What You Get - Quick Overview */}
        <section className="py-10 border-b">
          <div className="container max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { icon: FileText, label: "Floor Plans & Pricing" },
                { icon: Calendar, label: "Book Tours Direct" },
                { icon: Tag, label: "Assignment Access" },
                { icon: Zap, label: "Always Updated" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4">
                  <item.icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-16 lg:py-20">
          <div className="container max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Choose Your Plan
              </h2>
              <p className="text-muted-foreground">
                Pick the level that matches how you work
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {tiers.map((tier) => (
                <div 
                  key={tier.name}
                  className={`relative rounded-xl border-2 p-6 ${
                    tier.popular 
                      ? "border-primary bg-primary/5" 
                      : "border-border bg-background"
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-2">
                    <tier.icon className={`h-5 w-5 ${tier.popular ? "text-primary" : "text-muted-foreground"}`} />
                    <h3 className="font-bold text-lg">{tier.name}</h3>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold">${tier.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    {tier.description}
                  </p>
                  
                  <p className="text-sm font-medium mb-4 text-foreground">
                    "{tier.tagline}"
                  </p>

                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/login?tab=signup&type=agent" className="block">
                    <Button 
                      className={`w-full ${tier.popular ? "shadow-gold" : ""}`}
                      variant={tier.popular ? "default" : "outline"}
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Assignment Focus Section */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium mb-4">
              <Lock className="h-3 w-3" />
              PRO & ELITE ONLY
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Assignment Marketing Tools
            </h2>
            <p className="text-muted-foreground mb-8">
              List your client's assignments. Access off-market inventory. Connect directly with other agents.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-lg bg-background border">
                <Tag className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-semibold text-sm mb-1">List Your Assignments</h3>
                <p className="text-xs text-muted-foreground">Upload APS, pricing, and key dates</p>
              </div>
              <div className="p-4 rounded-lg bg-background border">
                <Lock className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-semibold text-sm mb-1">Off-Market Access</h3>
                <p className="text-xs text-muted-foreground">See assignments before they go public</p>
              </div>
              <div className="p-4 rounded-lg bg-background border">
                <MessageSquare className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-semibold text-sm mb-1">Agent-to-Agent</h3>
                <p className="text-xs text-muted-foreground">Connect directly with selling agents</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 lg:py-16">
          <div className="container max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">
              How It Works
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Sign Up", desc: "Pick your plan and create your account" },
                { step: "2", title: "Log In", desc: "Access all project info instantly" },
                { step: "3", title: "Get to Work", desc: "Download, compare, book tours, list assignments" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                    {item.step}
                  </div>
                  <div className="font-semibold mb-1">{item.title}</div>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 lg:py-20 bg-primary/5">
          <div className="container max-w-2xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to save time and close more deals?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join agents who already use the platform to access presale info and assignments.
            </p>
            <Link to="/login?tab=signup&type=agent">
              <Button size="lg" className="shadow-gold text-base px-10">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-4">
              For licensed real estate professionals only
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
