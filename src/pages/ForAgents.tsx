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
  BarChart3,
  Calendar,
  Tag,
  Lock,
  Users,
  Zap
} from "lucide-react";

export default function ForAgents() {
  return (
    <>
      <Helmet>
        <title>For Agents | Presale Project Hub for Real Estate Agents | PresaleProperties</title>
        <meta 
          name="description" 
          content="Everything you need to sell presale condos — in one place. Floor plans, pricing, brochures. No forms. No waiting." 
        />
        <link rel="canonical" href="https://presaleproperties.com/agents" />
      </Helmet>

      <ConversionHeader />

      <main>
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 bg-gradient-to-b from-background to-muted/30">
          <div className="container max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Users className="h-4 w-4" />
              For Licensed Agents Only
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Everything You Need to Sell Presale Condos
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              No forms. No chasing developers. No outdated info.
            </p>
            <p className="text-base text-muted-foreground mb-8">
              Log in. Download. Compare. Book tours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login?tab=signup&type=agent">
                <Button size="lg" className="shadow-gold text-base px-8 w-full sm:w-auto">
                  Join as an Agent
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-base px-8 w-full sm:w-auto">
                  Agent Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Core Value Props */}
        <section className="py-12 lg:py-20">
          <div className="container max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              What You Get
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: FileText, title: "Floor Plans", desc: "Every unit type. Always the latest version." },
                { icon: BarChart3, title: "Pricing Sheets", desc: "Current pricing for all projects." },
                { icon: Download, title: "Brochures", desc: "One-click download. No forms." },
                { icon: Calendar, title: "Book Tours", desc: "Request tours directly with developers." },
                { icon: Zap, title: "Project Status", desc: "Preselling, construction, or completed." },
                { icon: CheckCircle, title: "Always Updated", desc: "Info updated as things change." },
              ].map((item, index) => (
                <div key={index} className="p-5 rounded-lg border bg-background">
                  <item.icon className="h-6 w-6 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Problem */}
        <section className="py-12 lg:py-20 bg-muted/30">
          <div className="container max-w-2xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Stop Chasing Developers for Info
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>You fill out forms. You wait for callbacks. You dig through old emails.</p>
              <p className="font-medium text-foreground">That wastes your time.</p>
              <p>With our Agent Portal, you log in and get everything you need. Instantly.</p>
            </div>
          </div>
        </section>

        {/* Bonus: Assignment Marketing */}
        <section className="py-12 lg:py-20">
          <div className="container max-w-4xl">
            <div className="text-center mb-8">
              <p className="text-sm font-medium text-primary mb-2">BONUS</p>
              <h2 className="text-2xl md:text-3xl font-bold">
                Assignment Marketing Tools
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border-2 border-primary/20 bg-primary/5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold mb-2">List Your Assignments</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Market your client's presale assignments to qualified buyers and cooperating agents.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Reach active presale buyers</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>All inquiries come directly to you</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-xl border-2 border-primary/20 bg-primary/5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Access Off-Market Inventory</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  See assignments before they hit the public market. Find deals for your buyers.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Agent-only listings</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>First look at new inventory</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 lg:py-20 bg-muted/30">
          <div className="container max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">
              How It Works
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Sign Up", desc: "Create your agent account in 2 minutes" },
                { step: "2", title: "Log In", desc: "Access all project info instantly" },
                { step: "3", title: "Get to Work", desc: "Download, compare, and book tours" },
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
        <section className="py-16 lg:py-24">
          <div className="container max-w-2xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Save Time?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join agents who already use our portal to access presale info instantly.
            </p>
            <Link to="/login?tab=signup&type=agent">
              <Button size="lg" className="shadow-gold text-base px-10">
                Join as an Agent
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
