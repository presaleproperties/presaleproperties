import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Clock, Palette, Shield } from "lucide-react";

const BENEFITS = [
  { icon: TrendingUp, title: "Lock In Today's Price", desc: "Secure a home before it's built and benefit from appreciation before you move in." },
  { icon: Clock, title: "Flexible Deposits", desc: "Only 5–20% upfront, staggered over time. More runway to prepare your mortgage." },
  { icon: Palette, title: "Customize Your Home", desc: "Choose finishes, colours & upgrades. Your new home, exactly the way you want it." },
  { icon: Shield, title: "New Home Warranty", desc: "Full BC warranty coverage — 2-5-10 years on materials, envelope & structure." },
];


export function TeslaWhyPresale() {
  return (
    <section className="bg-background border-t border-border/40">
      {/* Two-column editorial */}
      <div className="container px-6 sm:px-8 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
          {/* Left copy */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary mb-4">Why Presale?</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-[1.08] mb-6">
              Buy Before It's Built.<br />
              <span className="text-primary">Own More for Less.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
              Presale buyers lock in today's prices on homes that won't be ready for 2–4 years — often building equity before they even move in.
            </p>
            <div className="flex items-center gap-3">
              <Link
                to="/presale-projects"
                className="inline-flex items-center gap-2 h-12 px-7 bg-foreground text-background text-sm font-bold hover:bg-foreground/85 transition-colors"
              >
                Browse Projects <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/vip"
                className="inline-flex items-center gap-2 h-12 px-7 border border-border text-sm font-bold text-foreground hover:bg-muted transition-colors"
              >
                Get VIP Access
              </Link>
            </div>
          </div>

          {/* Right — benefits grid */}
          <div className="grid grid-cols-2 gap-4">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 bg-muted/40 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="h-10 w-10 bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1.5">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
