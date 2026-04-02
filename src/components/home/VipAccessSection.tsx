import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function VipAccessSection() {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any).from("project_leads").insert({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        lead_source: "vip_form_homepage",
        project_name: "VIP Homepage Signup",
        message: "VIP access request from homepage",
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("You're in! Check your inbox for VIP access details.");
    } catch (err) {
      console.error("VIP form error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 md:py-20 bg-foreground relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />

      <div className="container px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/15 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Exclusive Access
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold text-background tracking-tight mb-3">
            Get VIP Access to Presale Pricing & Floor Plans
          </h2>
          <p className="text-background/60 text-base md:text-lg mb-8 max-w-lg mx-auto">
            Unlock exclusive pricing, early access to floor plans, and priority registration for upcoming presale developments across Metro Vancouver.
          </p>

          {submitted ? (
            <div className="bg-background/10 backdrop-blur-sm rounded-2xl p-8 border border-background/10">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-background mb-2">You're In!</h3>
              <p className="text-background/60 text-sm">
                Check your inbox — VIP access details and exclusive pricing are on the way.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="flex-1 h-12 px-4 rounded-xl bg-background/10 border border-background/20 text-background placeholder:text-background/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm"
              />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="flex-1 h-12 px-4 rounded-xl bg-background/10 border border-background/20 text-background placeholder:text-background/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="flex-1 h-12 px-4 rounded-xl bg-background/10 border border-background/20 text-background placeholder:text-background/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm sm:max-w-[160px]"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-6 rounded-xl font-bold text-sm whitespace-nowrap"
              >
                {isSubmitting ? "Submitting..." : "Get VIP Access"}
              </Button>
            </form>
          )}

          <p className="text-background/30 text-xs mt-4">No spam. Unsubscribe anytime. Your info is kept confidential.</p>
        </div>
      </div>
    </section>
  );
}
