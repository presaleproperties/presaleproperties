import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  ArrowRight,
  Tag,
  Lock,
  Users
} from "lucide-react";

export default function ForAgents() {
  return (
    <>
      <Helmet>
        <title>For Agents | List Assignments & Access Off-Market Deals | PresaleProperties</title>
        <meta 
          name="description" 
          content="List your assignments. Access off-market inventory. The platform built for presale agents." 
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
              List Your Assignments.<br />
              Access Off-Market Deals.
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              The only platform built for agents who sell presale condos and assignments in Metro Vancouver.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login?tab=signup&type=agent">
                <Button size="lg" className="shadow-gold text-base px-8 w-full sm:w-auto">
                  Join Free
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

        {/* Two Value Props */}
        <section className="py-12 lg:py-20">
          <div className="container max-w-4xl">
            <div className="grid md:grid-cols-2 gap-6">
              {/* List Assignments */}
              <div className="p-6 lg:p-8 rounded-xl border-2 border-primary/20 bg-primary/5">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-3">List Your Assignments</h2>
                <p className="text-muted-foreground mb-5">
                  Market your client's presale assignments to qualified buyers and cooperating agents.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Reach active presale buyers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">All inquiries come directly to you</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Professional listing presentation</span>
                  </li>
                </ul>
              </div>

              {/* Off-Market Access */}
              <div className="p-6 lg:p-8 rounded-xl border-2 border-primary/20 bg-primary/5">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-3">Access Off-Market Inventory</h2>
                <p className="text-muted-foreground mb-5">
                  See assignments before they hit the public market. Connect directly with selling agents.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Agent-only listings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">First look at new inventory</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Direct agent-to-agent deals</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Simplified */}
        <section className="py-12 lg:py-20 bg-muted/30">
          <div className="container max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">
              How It Works
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Sign Up", desc: "Create your free agent account" },
                { step: "2", title: "List or Browse", desc: "Add assignments or find deals" },
                { step: "3", title: "Connect", desc: "Work directly with buyers & agents" },
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
              Ready to grow your presale business?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join agents already using the platform to list assignments and find off-market deals.
            </p>
            <Link to="/login?tab=signup&type=agent">
              <Button size="lg" className="shadow-gold text-base px-10">
                Join Free
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
