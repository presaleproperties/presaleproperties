import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight,
  FileText,
  Users,
  Shield,
  Building2,
  Star,
  Sparkles,
  Crown,
  BadgeCheck,
  Lock,
  Megaphone,
  FolderOpen,
  Eye,
  Upload,
  CheckCircle2,
  Layers,
  Globe,
  TrendingUp
} from "lucide-react";

// Core value propositions
const coreFeatures = [
  {
    icon: FolderOpen,
    title: "Complete Project Library",
    description: "Access floor plans and brochures for every presale project in BC. Always up-to-date.",
    highlight: "100+ Projects",
    gradient: "from-amber-500/20 to-orange-500/20"
  },
  {
    icon: Lock,
    title: "All Assignments, One Place",
    description: "Stop scrolling Facebook groups. Search by location, price, and unit type. Connect with listing agents instantly—no more lost posts.",
    highlight: "Searchable & Organized",
    gradient: "from-violet-500/20 to-purple-500/20"
  },
  {
    icon: Upload,
    title: "Post Your Assignments",
    description: "List your client's assignments to our network of verified agents. Reach serious buyers instantly.",
    highlight: "500+ Agents",
    gradient: "from-amber-500/20 to-orange-500/20"
  },
  {
    icon: Megaphone,
    title: "Promote Your Exclusives",
    description: "Feature your exclusive assignments with premium placement. Get your listings in front of serious buyers and agents.",
    highlight: "Premium Exposure",
    gradient: "from-rose-500/20 to-pink-500/20"
  }
];

const platformBenefits = [
  {
    icon: FileText,
    stat: "100+",
    label: "Projects",
    description: "Floor plans & pricing"
  },
  {
    icon: Users,
    stat: "500+",
    label: "Agents",
    description: "BCFSA verified network"
  },
  {
    icon: Building2,
    stat: "50+",
    label: "Developers",
    description: "Direct partnerships"
  },
  {
    icon: Layers,
    stat: "Real-time",
    label: "Updates",
    description: "Always current data"
  }
];

const whatYouGet = [
  "Instant access to all presale floor plans",
  "Download project brochures",
  "Browse off-market assignments",
  "Post assignments to verified agents",
  "Promote your exclusive assignments",
  "Real-time project updates",
  "CMHC rental data & ROI tools",
  "Direct developer connections"
];

const testimonials = [
  {
    quote: "I closed 3 presale deals in my first month. The floor plan access alone saved me 10+ hours per week.",
    name: "Sarah Chen",
    title: "RE/MAX Crest Realty",
    avatar: "SC"
  },
  {
    quote: "The assignment marketplace is a game-changer. My clients get first access to the best deals.",
    name: "Michael Torres", 
    title: "Sutton Group",
    avatar: "MT"
  },
  {
    quote: "Finally, a platform built for agents who actually sell presales. The ROI tools close deals.",
    name: "Jennifer Wu",
    title: "Oakwyn Realty",
    avatar: "JW"
  }
];

export default function ForAgents() {
  return (
    <>
      <Helmet>
        <title>Assignment Sales & Agent Tools | Presale Contract Marketplace | PresaleProperties</title>
        <meta 
          name="description" 
          content="Browse off-market assignment sales and presale contract transfers. Access floor plans, VIP pricing, and connect with 500+ verified BC real estate agents." 
        />
        <meta name="keywords" content="assignment sales Vancouver, presale assignment, contract assignment BC, off-market assignments, presale agent tools" />
        <link rel="canonical" href="https://presaleproperties.com/for-agents" />
      </Helmet>

      <ConversionHeader />

      <main className="overflow-hidden">
        {/* Hero Section - Premium dark with gold accents */}
        <section className="relative py-24 lg:py-36 bg-foreground text-background overflow-hidden">
          {/* Premium background effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.1),transparent_50%)]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          </div>

          <div className="container relative z-10 max-w-6xl">
            <div className="text-center">
              <Badge variant="outline" className="mb-8 px-5 py-2.5 border-primary/40 text-primary bg-primary/10 backdrop-blur-sm text-sm font-medium">
                <Crown className="w-4 h-4 mr-2" />
                Vancouver's Premier Agent Network
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
                <span className="text-background">Your Complete</span>
                <br />
                <span className="text-gradient-gold">Presale Toolkit</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-background/70 max-w-3xl mx-auto mb-12 leading-relaxed">
                Access <span className="text-background font-semibold">every floor plan</span>, browse{" "}
                <span className="text-background font-semibold">off-market assignments</span>, and{" "}
                <span className="text-background font-semibold">promote your listings</span> to 500+ verified BC agents.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link to="/login?tab=signup&type=agent">
                  <Button size="xl" className="shadow-gold-glow hover:shadow-gold text-lg font-semibold group w-full sm:w-auto">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Join Free Today
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/login?type=agent">
                  <Button size="xl" variant="outline" className="border-background/30 text-background hover:bg-background/10 hover:text-background text-lg w-full sm:w-auto">
                    Agent Login
                  </Button>
                </Link>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {platformBenefits.map((item, index) => (
                  <div key={index} className="p-5 rounded-2xl bg-background/5 backdrop-blur-sm border border-background/10 hover:border-primary/30 transition-colors">
                    <item.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl md:text-3xl font-bold text-primary">{item.stat}</div>
                    <div className="text-sm font-medium text-background/80">{item.label}</div>
                    <div className="text-xs text-background/50 mt-1">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="py-5 bg-muted/50 border-b border-border">
          <div className="container">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-success" />
                <span className="font-medium">BCFSA Verified Only</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-medium">Secure & Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-info" />
                <span className="font-medium">Real-Time Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-warning fill-warning" />
                <span className="font-medium">4.9/5 Rating</span>
              </div>
            </div>
          </div>
        </section>

        {/* Core Value Props - Big Feature Cards */}
        <section className="py-20 lg:py-28">
          <div className="container max-w-6xl">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 text-sm">Everything You Need</Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
                Four Pillars of{" "}
                <span className="text-gradient-gold">Agent Success</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Built by presale agents, for presale agents. Every feature designed to help you close more deals.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {coreFeatures.map((feature, index) => (
                <Card 
                  key={index} 
                  className="group relative overflow-hidden border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-elevated"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
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

        {/* What's Included - Checklist Section */}
        <section className="py-20 lg:py-28 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30">
          <div className="container max-w-5xl">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <Badge variant="secondary" className="mb-4">Full Access Included</Badge>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                  Everything a Presale Agent{" "}
                  <span className="text-gradient-gold">Needs to Win</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Join our network and get instant access to the tools and resources that top-producing agents use every day.
                </p>
                
                <Link to="/login?tab=signup&type=agent">
                  <Button size="lg" className="shadow-gold hover:shadow-gold-glow">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              
              <div className="bg-card rounded-3xl border border-border/50 p-8 shadow-elevated">
                <div className="grid gap-4">
                  {whatYouGet.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 lg:py-28">
          <div className="container max-w-5xl">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">Quick Start</Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
                Start in{" "}
                <span className="text-gradient-gold">3 Minutes</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Simple setup. No credit card required.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  step: "1", 
                  title: "Create Account", 
                  description: "Sign up with your BCFSA license number. We verify within 24 hours.",
                  icon: Users
                },
                { 
                  step: "2", 
                  title: "Explore Platform", 
                  description: "Browse floor plans, assignments, and connect with developer partners.",
                  icon: Eye
                },
                { 
                  step: "3", 
                  title: "Close More Deals", 
                  description: "Use our tools to win more presale and assignment listings.",
                  icon: TrendingUp
                }
              ].map((item, index) => (
                <div key={index} className="relative">
                  {index < 2 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/40 to-transparent" />
                  )}
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary-deep text-primary-foreground flex items-center justify-center mx-auto shadow-gold">
                        <item.icon className="h-9 w-9" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold shadow-lg">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 lg:py-28 bg-muted/30">
          <div className="container max-w-6xl">
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4">Agent Success Stories</Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                Trusted by{" "}
                <span className="text-gradient-gold">Top Producers</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-border/50 bg-card hover:shadow-elevated transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <blockquote className="text-foreground mb-6 leading-relaxed">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center text-sm font-semibold text-primary-foreground shadow-sm">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.title}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 lg:py-32 bg-foreground text-background relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.2),transparent_70%)]" />
          </div>
          
          <div className="container relative z-10 max-w-4xl text-center">
            <Badge variant="outline" className="mb-6 px-4 py-2 border-primary/40 text-primary bg-primary/10">
              <Sparkles className="w-4 h-4 mr-2" />
              Free to Join
            </Badge>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Ready to Dominate{" "}
              <span className="text-gradient-gold">Presales?</span>
            </h2>
            
            <p className="text-xl text-background/70 mb-10 max-w-2xl mx-auto">
              Join 500+ verified BC agents who use our platform to access floor plans, 
              find off-market assignments, and close more deals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login?tab=signup&type=agent">
                <Button size="xl" className="shadow-gold-glow hover:shadow-gold text-lg font-semibold group w-full sm:w-auto">
                  <Crown className="mr-2 h-5 w-5" />
                  Join the Network
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/dashboard/assignments">
                <Button size="xl" variant="outline" className="border-background/30 text-background hover:bg-background/10 text-lg w-full sm:w-auto">
                  Browse Assignments
                </Button>
              </Link>
            </div>

            <p className="text-sm text-background/50 mt-8">
              BCFSA license required • Verification within 24 hours • No credit card needed
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
