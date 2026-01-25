import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  ArrowRight,
  Zap,
  FileText,
  Users,
  TrendingUp,
  Shield,
  Clock,
  Building2,
  Star,
  Sparkles,
  Crown,
  Bell,
  DollarSign,
  BarChart3,
  Target,
  BadgeCheck,
  ChevronRight
} from "lucide-react";

const tiers = [
  {
    name: "Core",
    price: 99,
    description: "Essential tools for growing agents",
    badge: null,
    features: [
      "Access to all presale floor plans",
      "Real-time pricing updates",
      "5 assignment listings/month",
      "Basic lead notifications",
      "Email support"
    ],
    cta: "Start with Core",
    popular: false
  },
  {
    name: "Pro",
    price: 199,
    description: "Scale your presale business",
    badge: "Most Popular",
    features: [
      "Everything in Core, plus:",
      "Unlimited assignment listings",
      "Priority access to new projects",
      "Featured agent profile",
      "Advanced analytics dashboard",
      "Priority support"
    ],
    cta: "Go Pro",
    popular: true
  },
  {
    name: "Elite",
    price: 399,
    description: "For top-producing agents",
    badge: "Best Value",
    features: [
      "Everything in Pro, plus:",
      "Early access to VIP launches",
      "Off-market deal access",
      "Dedicated account manager",
      "White-glove listing service",
      "Co-marketing opportunities"
    ],
    cta: "Join Elite",
    popular: false
  }
];

const benefits = [
  {
    icon: FileText,
    title: "Instant Floor Plans & Pricing",
    description: "No more chasing developers. Get every floor plan and price sheet the moment they're released."
  },
  {
    icon: Zap,
    title: "Lightning-Fast Updates",
    description: "Real-time notifications when new projects launch, prices change, or incentives become available."
  },
  {
    icon: Users,
    title: "Off-Market Assignment Access",
    description: "Browse and list assignments in our exclusive agent marketplace before they hit public sites."
  },
  {
    icon: TrendingUp,
    title: "Market Intelligence",
    description: "CMHC rental data, price history, and ROI calculators built for investor conversations."
  },
  {
    icon: Shield,
    title: "Verified Agent Network",
    description: "Connect with 500+ licensed BC agents. All members are BCFSA verified."
  },
  {
    icon: Building2,
    title: "Developer Connections",
    description: "Direct relationships with 50+ developers. VIP access to launches and incentives."
  }
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

const stats = [
  { value: "100+", label: "Active Projects" },
  { value: "500+", label: "Verified Agents" },
  { value: "50+", label: "Developer Partners" },
  { value: "$2B+", label: "Volume Represented" }
];

export default function ForAgents() {
  return (
    <>
      <Helmet>
        <title>For Agents | Presale Floor Plans & Pricing Access | PresaleProperties</title>
        <meta 
          name="description" 
          content="Join Vancouver's #1 presale agent network. Instant access to floor plans, pricing, off-market assignments, and verified developer connections." 
        />
        <link rel="canonical" href="https://presaleproperties.com/for-agents" />
      </Helmet>

      <ConversionHeader />

      <main className="overflow-hidden">
        {/* Hero Section - Premium dark gradient */}
        <section className="relative py-20 lg:py-32 bg-gradient-to-b from-foreground via-foreground/95 to-foreground/90 text-background overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-glow/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/10 to-transparent rounded-full" />
          </div>

          <div className="container relative z-10 max-w-5xl">
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-6 px-4 py-2 border-primary/50 text-primary bg-primary/10 backdrop-blur-sm">
                <Crown className="w-4 h-4 mr-2" />
                Exclusive Agent Network
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
                <span className="text-background">Stop Chasing Developers.</span>
                <br />
                <span className="text-gradient-gold">Start Closing Presales.</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-background/70 max-w-3xl mx-auto mb-10 leading-relaxed">
                Get instant access to every floor plan, price sheet, and off-market assignment in Metro Vancouver. 
                Join 500+ agents already selling smarter.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/login?tab=signup&type=agent">
                  <Button size="xl" className="shadow-gold-glow hover:shadow-gold text-lg font-semibold group">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Join the Network
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/login?type=agent">
                  <Button size="xl" variant="outline" className="border-background/30 text-background hover:bg-background/10 hover:text-background text-lg">
                    Agent Login
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats bar */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4 rounded-xl bg-background/5 backdrop-blur-sm border border-background/10">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-background/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="py-6 bg-muted/50 border-y border-border">
          <div className="container">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-success" />
                <span>BCFSA Verified Agents Only</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>256-bit SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-info" />
                <span>Real-Time Data Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" />
                <span>4.9/5 Agent Rating</span>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-20 lg:py-28">
          <div className="container max-w-6xl">
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4">Why Agents Choose Us</Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Everything You Need to{" "}
                <span className="text-gradient-gold">Dominate Presales</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Built by agents, for agents. Every feature designed to save you time and close more deals.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="group hover-lift border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 lg:py-28 bg-gradient-to-b from-muted/30 to-muted/50">
          <div className="container max-w-6xl">
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4">Simple Pricing</Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Choose Your{" "}
                <span className="text-gradient-gold">Growth Plan</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                No hidden fees. Cancel anytime. Start with a 14-day free trial.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {tiers.map((tier, index) => (
                <Card 
                  key={index} 
                  className={`relative overflow-hidden transition-all duration-300 ${
                    tier.popular 
                      ? "border-primary shadow-gold scale-105 z-10" 
                      : "border-border/50 hover:border-primary/30 hover:shadow-elevated"
                  }`}
                >
                  {tier.badge && (
                    <div className="absolute top-0 right-0">
                      <div className={`px-4 py-1 text-xs font-semibold ${
                        tier.popular 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-foreground text-background"
                      }`}>
                        {tier.badge}
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="p-6 lg:p-8">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">${tier.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-3">
                          <CheckCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                            tier.popular ? "text-primary" : "text-success"
                          }`} />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link to="/login?tab=signup&type=agent" className="block">
                      <Button 
                        className="w-full" 
                        variant={tier.popular ? "default" : "outline"}
                        size="lg"
                      >
                        {tier.cta}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              All plans include a 14-day free trial. No credit card required to start.
            </p>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 lg:py-28">
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
                <Card key={index} className="border-border/50 bg-card/50">
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
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.title}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 lg:py-28 bg-muted/30">
          <div className="container max-w-5xl">
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4">Quick Start</Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Get Started in{" "}
                <span className="text-gradient-gold">3 Minutes</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  step: "1", 
                  title: "Create Your Profile", 
                  description: "Sign up with your BCFSA license. We verify within 24 hours.",
                  icon: Users
                },
                { 
                  step: "2", 
                  title: "Explore the Platform", 
                  description: "Browse floor plans, assignments, and developer partnerships.",
                  icon: Target
                },
                { 
                  step: "3", 
                  title: "Start Closing Deals", 
                  description: "Use our tools to win more presale and assignment listings.",
                  icon: TrendingUp
                }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-deep text-primary-foreground flex items-center justify-center mx-auto shadow-gold">
                      <item.icon className="h-7 w-7" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-foreground text-background text-sm font-bold flex items-center justify-center">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 lg:py-32 bg-gradient-to-b from-foreground to-foreground/95 text-background relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-20 w-80 h-80 bg-primary-glow/15 rounded-full blur-3xl" />
          </div>

          <div className="container relative z-10 max-w-3xl text-center">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
              Ready to Sell More Presales?
            </h2>
            <p className="text-xl text-background/70 mb-10 max-w-xl mx-auto">
              Join 500+ agents who are already using our platform to close more deals and grow their presale business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login?tab=signup&type=agent">
                <Button size="xl" className="shadow-gold-glow text-lg font-semibold group">
                  <Crown className="mr-2 h-5 w-5" />
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="xl" variant="outline" className="border-background/30 text-background hover:bg-background/10 hover:text-background text-lg">
                  Talk to Sales
                </Button>
              </Link>
            </div>
            <p className="text-sm text-background/50 mt-6">
              14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </section>

        {/* Footer Note */}
        <section className="py-8 border-t bg-card">
          <div className="container max-w-3xl">
            <p className="text-sm text-muted-foreground text-center">
              Agent Portal access requires BCFSA license verification. All agents must be in good standing with the BC Financial Services Authority.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
