import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function TeslaVIPBanner() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await supabase.from("newsletter_subscribers").insert({
        email,
        source: "homepage_vip_banner",
        wants_projects: true,
        wants_assignments: true,
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-foreground relative overflow-hidden">
      {/* Subtle gold glow — keeps our brand warmth on the dark bg */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_110%,hsl(40_65%_55%/0.14),transparent)] pointer-events-none" />

      <div className="container px-6 sm:px-8 py-20 md:py-28 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-primary mb-5">Exclusive Access</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-background tracking-tight leading-[1.08] mb-5">
            Get VIP Presale Access.<br />
            <span className="text-primary">Before Anyone Else.</span>
          </h2>
          <p className="text-base text-background/50 leading-relaxed mb-10 max-w-md mx-auto">
            Floor plans, pricing, and exclusive incentives — delivered to your inbox before public launch.
          </p>

          {submitted ? (
            <div className="inline-flex items-center gap-2 h-14 px-8 bg-primary/15 border border-primary/30 text-primary font-bold text-sm">
              🎉 You're on the VIP list — check your inbox!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-0 max-w-md mx-auto">
              <input
                type="email"
                required
                placeholder="Your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 h-14 px-5 bg-background/[0.07] border border-background/15 text-sm text-background placeholder:text-background/35 focus:outline-none focus:border-primary/50 focus:bg-background/[0.10] transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-14 px-7 bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 active:scale-[0.98] transition-all shrink-0 flex items-center gap-2"
              >
                {loading ? "…" : <>Join VIP <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          <p className="mt-4 text-[11px] text-background/30">No spam. Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  );
}
