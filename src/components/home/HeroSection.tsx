import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroProjectSlider } from "./HeroProjectSlider";
import { supabase } from "@/integrations/supabase/client";

const projectCities = ["Vancouver", "Surrey", "Langley", "Coquitlam", "Abbotsford", "Burnaby"];

export type SearchTab = "projects" | "resale";

interface HeroSectionProps {
  activeTab?: SearchTab;
  onTabChange?: (tab: SearchTab) => void;
}

const TRUST_STATS = [
  { value: "111", label: "Active Projects" },
  { value: "450+", label: "Presale Properties Sold" },
  { value: "$200M+", label: "In Presale Sales" },
  { value: "5.0 ★", label: "Google Rating" },
];

function VIPModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ firstName: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { error: dbError } = await supabase.from("newsletter_subscribers").insert({
        email: form.email,
        source: "hero_vip_modal",
        wants_projects: true,
        wants_assignments: true,
      });
      // Ignore duplicate email error - user already subscribed is still a win
      if (dbError && !dbError.message.includes("unique")) throw dbError;
      // Also save to project_leads so it shows up in admin leads view
      await supabase.from("project_leads").insert({
        name: form.firstName,
        email: form.email,
        phone: form.phone || null,
        message: `VIP signup via hero modal. UTM: ${new URLSearchParams(window.location.search).get("utm_source") || "direct"}`,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("VIP form error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">You're In!</h2>
            <p className="text-sm text-muted-foreground">Check your inbox — VIP access details are on the way.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Get VIP Presale Access</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Be first to see pricing, floor plans and off-market assignments before they go public.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                required
                placeholder="First Name"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                type="tel"
                placeholder="Phone Number (optional)"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-full font-bold text-sm"
              >
                {isSubmitting ? "Submitting..." : "Get Instant Access"}
              </Button>
              {error && <p className="text-center text-xs text-red-500">{error}</p>}
              <p className="text-center text-[11px] text-muted-foreground">No spam. Unsubscribe anytime.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export function HeroSection({
  activeTab: controlledTab,
  onTabChange
}: HeroSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Hero — Tesla style: full-bleed background image with centered minimal content */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden" style={{ minHeight: "calc(100dvh - 72px)" }}>
        {/* Auto-scrolling project slider as background */}
        <HeroProjectSlider />
        {/* Cinematic dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60 z-[2] pointer-events-none" />

        {/* Bottom-left content — exact Tesla layout */}
        <div className="absolute bottom-0 left-0 right-0 z-[5] px-8 sm:px-12 lg:px-16 pb-14 sm:pb-20">

          {/* Headline — Tesla scale, bottom-left */}
          <h1
            className="text-[2.8rem] sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white leading-[1.0] tracking-tight mb-2"
            style={{ textShadow: "0 2px 40px rgba(0,0,0,0.4)" }}
          >
            Own. Before. Everyone.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-white/70 mb-6 font-medium">
            Metro Vancouver's #1 Presale Platform
          </p>

          {/* Two Tesla-style CTA buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/presale-projects")}
              className="h-14 px-10 sm:px-14 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 active:scale-[0.98] transition-all min-w-[180px]"
            >
              Browse Presales
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="h-14 px-10 sm:px-14 rounded-lg bg-white/[0.12] backdrop-blur-sm border border-white/25 text-sm font-bold text-white hover:bg-white/20 active:scale-[0.98] transition-all min-w-[180px]"
            >
              Get VIP Access
            </button>
          </div>
        </div>
      </section>


      {/* VIP Modal */}
      {modalOpen && <VIPModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

