import { useState } from "react";
import { Link } from "react-router-dom";
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
      await supabase.from("vip_registrations").insert({
        first_name: "",
        email,
        source: "homepage_vip_banner",
        utm_source: new URLSearchParams(window.location.search).get("utm_source"),
        utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
        utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
        landing_page: window.location.pathname,
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true); // still show success
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#0a0a0a] relative overflow-hidden">
      {/* Subtle gold glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_120%,hsl(40_65%_55%/0.12),transparent)] pointer-events-none" />

      <div className="container px-4 sm:px-6 py-20 md:py-28 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-5">Exclusive Access</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-5">
            Get VIP Presale Access.<br />
            <span className="text-primary">Before Anyone Else.</span>
          </h2>
          <p className="text-base text-white/55 leading-relaxed mb-10 max-w-md mx-auto">
            Floor plans, pricing, and exclusive incentives — delivered to your inbox before public launch.
          </p>

          {submitted ? (
            <div className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-primary/15 border border-primary/30 text-primary font-bold text-sm">
              🎉 You're on the VIP list — check your inbox!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                required
                placeholder="Your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 h-14 px-5 rounded-full bg-white/[0.07] border border-white/15 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-primary/50 focus:bg-white/[0.10] transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-14 px-7 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all shrink-0 flex items-center gap-2"
              >
                {loading ? "…" : <>Join VIP <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          <p className="mt-4 text-[11px] text-white/30">No spam. Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  );
}
