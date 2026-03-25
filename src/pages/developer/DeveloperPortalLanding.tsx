import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Building2, Upload, Users, ArrowRight, CheckCircle2, Crown,
  BadgeCheck, Shield, BarChart2, Sparkles, Eye, FileText, Globe, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Your Project",
    desc: "Add building details, floor plans, pricing sheets, and brochures in minutes.",
    highlight: "5 min setup",
  },
  {
    number: "02",
    icon: Building2,
    title: "Add Your Units",
    desc: "List individual completed or near-completion condo and townhome units with full specs.",
    highlight: "Unlimited units",
  },
  {
    number: "03",
    icon: Users,
    title: "Buyers Find You",
    desc: "Your inventory reaches qualified buyers and agents across BC — completely free.",
    highlight: "12,000+ buyers",
  },
];

const features = [
  {
    icon: Eye,
    title: "Maximum Exposure",
    description: "Your completed inventory appears directly in search results alongside active presale projects — in front of buyers actively looking right now.",
    highlight: "12,000+ Buyers",
  },
  {
    icon: FileText,
    title: "Rich Project Pages",
    description: "Upload floor plans, pricing sheets, brochures, and photos. Give buyers and agents everything they need to make a decision fast.",
    highlight: "Full Media Support",
  },
  {
    icon: BarChart2,
    title: "Track Performance",
    description: "See how many views, clicks, and tour requests your listings are generating. Know which units are getting the most interest.",
    highlight: "Real-Time Analytics",
  },
  {
    icon: Users,
    title: "Connect with Agents",
    description: "Our verified network of 800+ BCFSA-licensed agents can source buyers for your units. No cold calling required.",
    highlight: "800+ Agents",
  },
];

const benefits = [
  "No listing fees — always free",
  "Instant exposure to verified agents",
  "Upload floor plans, pricing & brochures",
  "Track views and buyer interest",
  "Manage multiple projects in one dashboard",
  "Approved within 1–2 business days",
];

const stats = [
  { value: "12,000+", label: "Active Buyers", icon: Users },
  { value: "800+", label: "Verified Agents", icon: BadgeCheck },
  { value: "20+", label: "Cities Covered", icon: Globe },
  { value: "$0", label: "Listing Cost", icon: Star },
];

export default function DeveloperPortalLanding() {
  return (
    <>
      <Helmet>
        <title>Developer Portal — List Your Inventory Free | Presale Properties Group</title>
        <meta name="description" content="Reach 12,000+ active buyers and 800+ verified agents across BC. List your completed and near-completion condo and townhome inventory — completely free." />
      </Helmet>

      <ConversionHeader />

      <main className="overflow-hidden">
        {/* ── Hero ── */}
        <section className="relative py-24 lg:py-36 bg-foreground text-background overflow-hidden">
          {/* Premium radial glow layers */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.18),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.1),transparent_55%)]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </div>

          <div className="container relative z-10 max-w-6xl">
            <div className="text-center">
              <Badge
                variant="outline"
                className="mb-8 px-5 py-2.5 border-primary/40 text-primary bg-primary/10 backdrop-blur-sm text-sm font-medium"
              >
                <Crown className="w-4 h-4 mr-2" />
                Free for Real Estate Developers
              </Badge>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
                <span className="text-background">List Your Unsold</span>
                <br />
                <span className="text-gradient-gold">Inventory — Free.</span>
              </h1>

              <p className="text-xl md:text-2xl text-background/70 max-w-3xl mx-auto mb-12 leading-relaxed">
                Connect your{" "}
                <span className="text-background font-semibold">completed and near-completion</span>{" "}
                condos and townhomes directly with{" "}
                <span className="text-background font-semibold">thousands of active buyers</span>{" "}
                and agents across British Columbia.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link to="/developer/signup">
                  <Button size="xl" className="shadow-gold-glow hover:shadow-gold text-lg font-semibold group w-full sm:w-auto">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Create Developer Account
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/developer/login">
                  <Button
                    size="xl"
                    variant="outline"
                    className="border-background/30 text-background hover:bg-background/10 hover:text-background text-lg w-full sm:w-auto"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="p-5 rounded-2xl bg-background/5 backdrop-blur-sm border border-background/10 hover:border-primary/30 transition-colors"
                  >
                    <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl md:text-3xl font-bold text-primary">{s.value}</div>
                    <div className="text-sm font-medium text-background/80">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust bar ── */}
        <section className="py-5 bg-muted/50 border-b border-border">
          <div className="container">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-[hsl(var(--success))]" />
                <span className="font-medium">No Listing Fees — Ever</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-medium">Verified Agents Only</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-info" />
                <span className="font-medium">Live Across BC</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary fill-primary" />
                <span className="font-medium">Approved in 1–2 Business Days</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-20 lg:py-28">
          <div className="container max-w-6xl">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 text-sm">Simple Process</Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
                Up and Running in{" "}
                <span className="text-gradient-gold">Under an Hour</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Three simple steps to get your inventory in front of thousands of qualified buyers.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((step) => (
                <Card
                  key={step.number}
                  className="group relative overflow-hidden border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-elevated"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="relative p-8">
                    <div className="absolute -top-4 left-8">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                        Step {step.number}
                      </span>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary flex items-center justify-center mb-5 mt-4 transition-colors duration-300">
                      <step.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs mb-3">
                      {step.highlight}
                    </Badge>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Feature Grid ── */}
        <section className="py-20 lg:py-28 bg-muted/30">
          <div className="container max-w-6xl">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 text-sm">Built for Developers</Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
                Everything You Need to{" "}
                <span className="text-gradient-gold">Move Inventory Faster</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Built specifically for real estate developers who need to sell completed and near-completion units.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="group relative overflow-hidden border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-elevated"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="relative p-8">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-colors duration-300 flex-shrink-0">
                        <feature.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{feature.title}</h3>
                          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs">
                            {feature.highlight}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Benefits dark section ── */}
        <section className="relative py-20 lg:py-28 bg-foreground text-background overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_60%)]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>
          <div className="container max-w-5xl relative z-10">
            <div className="grid md:grid-cols-2 gap-14 items-center">
              <div>
                <Badge variant="outline" className="mb-6 border-primary/40 text-primary bg-primary/10 text-sm">
                  Why Developers Choose Us
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                  The fastest way to reach
                  <span className="block text-gradient-gold">motivated buyers in BC.</span>
                </h2>
                <p className="text-background/60 text-lg mb-8 leading-relaxed">
                  Your completed inventory shouldn't sit unsold. Our platform puts you in front of buyers who are ready to purchase — not just browsing.
                </p>
                <Link to="/developer/signup">
                  <Button className="shadow-gold font-bold px-6 py-3 rounded-lg group">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {benefits.map((b) => (
                  <div
                    key={b}
                    className="flex items-center gap-3 bg-background/5 border border-background/10 hover:border-primary/30 rounded-xl px-5 py-4 transition-colors"
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-background/90 font-medium">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-20 lg:py-28">
          <div className="container max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 text-sm">Zero Risk, Zero Cost</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              Ready to list your inventory?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
              Create your free developer account today and start connecting with buyers across BC.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/developer/signup">
                <Button size="xl" className="shadow-gold-glow hover:shadow-gold font-bold text-lg group w-full sm:w-auto">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Create Developer Account
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/developer/login">
                <Button size="xl" variant="outline" className="text-lg w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              No credit card required · Always free to list · Approved within 1–2 business days
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
