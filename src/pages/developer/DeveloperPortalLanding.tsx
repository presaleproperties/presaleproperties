import { Link } from "react-router-dom";
import { Building2, Upload, Users, TrendingUp, ArrowRight, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Your Project",
    desc: "Add your building details, floor plans, pricing sheets, and brochures in minutes.",
  },
  {
    number: "02",
    icon: Building2,
    title: "Add Your Units",
    desc: "List individual completed or near-completion condo and townhome units with full specs.",
  },
  {
    number: "03",
    icon: Users,
    title: "Buyers Find You",
    desc: "Your inventory gets in front of qualified buyers and agents across BC — completely free.",
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

export default function DeveloperPortalLanding() {
  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1F2937]">
      {/* Nav */}
      <header className="border-b bg-[#1A1A2E] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#C8A951]" />
            <span className="text-white font-semibold text-lg">Developer Portal</span>
            <span className="text-[#C8A951]/60 text-sm ml-1">by Presale Properties Group</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/developer/login">
              <Button variant="ghost" className="text-white hover:text-[#C8A951] hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link to="/developer/signup">
              <Button className="bg-[#C8A951] hover:bg-[#b8993f] text-[#1A1A2E] font-semibold rounded-lg">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#1A1A2E] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#C8A951]/15 border border-[#C8A951]/30 rounded-full px-4 py-1.5 mb-6">
            <Star className="h-3.5 w-3.5 text-[#C8A951] fill-[#C8A951]" />
            <span className="text-[#C8A951] text-sm font-medium">Free for Developers</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            List Your Unsold
            <span className="block text-[#C8A951]">Inventory — Free.</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect your completed and near-completion condos and townhomes directly with thousands of active buyers and agents across British Columbia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/developer/signup">
              <Button size="lg" className="bg-[#C8A951] hover:bg-[#b8993f] text-[#1A1A2E] font-bold text-lg px-8 py-6 rounded-lg shadow-lg">
                Create Developer Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/developer/login">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-lg">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-white/40 text-sm">
            No credit card required. Always free to list.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-[#6B7280] text-lg">Three simple steps to reach thousands of qualified buyers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative bg-white rounded-xl p-8 shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
                <div className="absolute -top-4 left-8">
                  <span className="bg-[#C8A951] text-[#1A1A2E] text-xs font-bold px-3 py-1 rounded-full">
                    Step {step.number}
                  </span>
                </div>
                <div className="w-12 h-12 bg-[#1A1A2E]/5 rounded-xl flex items-center justify-center mb-5 mt-2">
                  <step.icon className="h-6 w-6 text-[#1A1A2E]" />
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-[#6B7280] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-[#1A1A2E] text-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Everything you need to
                <span className="block text-[#C8A951]">move inventory faster.</span>
              </h2>
              <p className="text-white/60 text-lg mb-8 leading-relaxed">
                Built specifically for real estate developers, our platform puts your completed units in front of thousands of motivated buyers and verified agents across the Lower Mainland and BC.
              </p>
              <Link to="/developer/signup">
                <Button className="bg-[#C8A951] hover:bg-[#b8993f] text-[#1A1A2E] font-bold px-6 py-3 rounded-lg">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-5 py-3.5">
                  <CheckCircle2 className="h-5 w-5 text-[#C8A951] flex-shrink-0" />
                  <span className="text-white/90">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-b">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Active Buyers", value: "12,000+" },
            { label: "Verified Agents", value: "800+" },
            { label: "Cities Covered", value: "20+" },
            { label: "Listing Cost", value: "$0" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-[#C8A951] mb-1">{s.value}</div>
              <div className="text-[#6B7280] text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to list your inventory?</h2>
          <p className="text-[#6B7280] text-lg mb-8">
            Create your free developer account and start connecting with buyers today.
          </p>
          <Link to="/developer/signup">
            <Button size="lg" className="bg-[#1A1A2E] hover:bg-[#0f0f1e] text-white font-bold text-lg px-10 py-6 rounded-lg">
              Create Developer Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A2E] text-white/40 text-sm py-6 px-6 text-center">
        <p>© {new Date().getFullYear()} Presale Properties Group · <Link to="/privacy" className="hover:text-white/60 underline">Privacy</Link></p>
      </footer>
    </div>
  );
}
