import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatPhoneNumber } from "@/lib/formatPhone";
import {
  FileText,
  AlertTriangle,
  CheckSquare,
  Calculator,
  ArrowRight,
  Lock,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  User,
  ChevronRight,
  BookOpen,
  Shield,
  TrendingUp,
  Clock,
  Building2,
  Sparkles,
  Download,
  Star,
} from "lucide-react";

// ── Lead Capture form (reusable for both magnets) ────────────────────────────

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().min(10, "Valid phone number required"),
});

interface LeadMagnetFormProps {
  magnetId: string;
  label: string;
  onSuccess: () => void;
}

function LeadMagnetForm({ magnetId, label, onSuccess }: LeadMagnetFormProps) {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const validation = leadSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      const visitorId = localStorage.getItem("pp_vid") || crypto.randomUUID();
      const sessionId = sessionStorage.getItem("pp_sid") || crypto.randomUUID();
      const leadId = crypto.randomUUID();
      const { error } = await supabase.from("project_leads").insert({
        id: leadId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        lead_source: magnetId,
        message: `Lead magnet: ${label}`,
        persona: "buyer",
        landing_page: window.location.href,
        visitor_id: visitorId,
        session_id: sessionId,
        utm_source: sessionStorage.getItem("utm_source") || null,
        utm_medium: sessionStorage.getItem("utm_medium") || null,
        utm_campaign: sessionStorage.getItem("utm_campaign") || null,
        referrer: sessionStorage.getItem("referrer") || document.referrer || null,
      });
      if (error) throw error;
      supabase.functions.invoke("send-project-lead", { body: { leadId } }).catch(() => {});
      localStorage.setItem("pp_form_submitted", "true");
      toast.success("You're in! Check your inbox.");
      onSuccess();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-4">
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`pl-9 h-11 ${errors.name ? "border-destructive" : ""}`}
          autoComplete="name"
        />
      </div>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={`pl-9 h-11 ${errors.email ? "border-destructive" : ""}`}
          autoComplete="email"
        />
      </div>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="tel"
          inputMode="numeric"
          placeholder="(604) 555-0123"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
          className={`pl-9 h-11 text-[16px] ${errors.phone ? "border-destructive" : ""}`}
          autoComplete="tel"
        />
      </div>
      {(errors.name || errors.email || errors.phone) && (
        <p className="text-xs text-destructive">{errors.name || errors.email || errors.phone}</p>
      )}
      <Button type="submit" className="w-full h-11 font-semibold gap-2" disabled={isSubmitting}>
        {isSubmitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
        ) : (
          <><Download className="h-4 w-4" /> Get Instant Access</>
        )}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">
        <span className="text-primary/70">✓</span> Free · No spam · Instant delivery
      </p>
    </form>
  );
}

// ── Lead Magnet Card ─────────────────────────────────────────────────────────

interface MagnetCardProps {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  points: string[];
  icon: React.ElementType;
  magnetId: string;
  previewItems?: string[];
}

function MagnetCard({
  badge,
  title,
  subtitle,
  description,
  points,
  icon: Icon,
  magnetId,
  previewItems,
}: MagnetCardProps) {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-transparent" />

      {/* Header */}
      <div className="bg-foreground px-6 py-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.08),_transparent_70%)]" />
        <div className="relative flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/15 px-2 py-0.5 rounded mb-1.5">
              <Sparkles className="h-2.5 w-2.5" /> {badge}
            </span>
            <h3 className="text-lg font-bold text-background leading-tight">{title}</h3>
            <p className="text-xs text-background/50 font-medium mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col flex-1">
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{description}</p>

        {/* What's inside */}
        <div className="space-y-2 mb-5">
          {points.map((point) => (
            <div key={point} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/80 leading-snug">{point}</span>
            </div>
          ))}
        </div>

        {/* Preview teaser */}
        {previewItems && previewItems.length > 0 && !unlocked && (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 mb-4 relative overflow-hidden">
            <div className="absolute inset-0 backdrop-blur-[2px] bg-background/60 flex items-center justify-center gap-2 z-10">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">Unlock free below</span>
            </div>
            <ul className="space-y-1 opacity-30">
              {previewItems.map((item) => (
                <li key={item} className="text-xs text-foreground flex items-center gap-1.5">
                  <ChevronRight className="h-3 w-3 text-primary flex-shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {unlocked ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-semibold text-sm text-foreground mb-0.5">You're all set!</p>
            <p className="text-xs text-muted-foreground">Check your inbox — we've sent your guide.</p>
            <Link to="/book" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Book a free strategy call <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <LeadMagnetForm magnetId={magnetId} label={title} onSuccess={() => setUnlocked(true)} />
        )}
      </div>
    </div>
  );
}

// ── Problem/Solution stat cards ──────────────────────────────────────────────
const problems = [
  {
    problem: "Bought without knowing the risks",
    stat: "38%",
    statLabel: "of first-time presale buyers",
    solution: "Our guides expose every hidden cost and risk before you sign",
    icon: AlertTriangle,
  },
  {
    problem: "Missed government tax savings",
    stat: "$20K+",
    statLabel: "left on the table on average",
    solution: "We outline every rebate, exemption & grant available in BC",
    icon: TrendingUp,
  },
  {
    problem: "Surprised by completion costs",
    stat: "65%",
    statLabel: "weren't fully prepared",
    solution: "Use our calculator to model every cost before you commit",
    icon: Calculator,
  },
];

// ── Process steps (condensed) ────────────────────────────────────────────────
const processSteps = [
  {
    number: "01",
    title: "Pre-Qualify & Budget",
    desc: "Understand what you can truly afford including deposits, GST, PTT, and closing costs.",
    icon: Calculator,
  },
  {
    number: "02",
    title: "Find the Right Project",
    desc: "Research developers, neighborhoods, and upcoming projects with strong fundamentals.",
    icon: Building2,
  },
  {
    number: "03",
    title: "Review & Sign",
    desc: "Review the disclosure statement with a lawyer during the 7-day rescission period.",
    icon: FileText,
  },
  {
    number: "04",
    title: "Wait & Stay Informed",
    desc: "Monitor construction milestones, plan your financing, and prepare for completion.",
    icon: Clock,
  },
  {
    number: "05",
    title: "Deficiency Walkthrough",
    desc: "Inspect every inch of your new home using our professional checklist.",
    icon: CheckSquare,
  },
  {
    number: "06",
    title: "Collect Your Keys",
    desc: "Complete your mortgage, pay closing costs, and move into your brand-new home.",
    icon: Shield,
  },
];

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Free Presale Buyer Resources & Guides | PresaleProperties.com</title>
        <meta
          name="description"
          content="Free guides, checklists, and calculators for BC presale buyers. Get the 7 Costly Mistakes guide, deficiency walkthrough checklist, and ROI calculator — all free."
        />
        <link rel="canonical" href="https://presaleproperties.com/resources" />
      </Helmet>

      <ConversionHeader />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30">
          <div className="container px-4 py-3">
            <Breadcrumbs items={[{ label: "Resources" }]} />
          </div>
        </div>

        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-background to-primary/3 pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.022] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative container px-4 py-14 md:py-20">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase">
                  <BookOpen className="h-3 w-3" /> Free Resources
                </span>
                <span className="text-muted-foreground/60 text-sm">Updated 2026</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-[1.08] mb-4 tracking-tight">
                Everything You Need to{" "}
                <span className="text-primary">Buy Smart</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-xl">
                Most buyers go into a presale purchase without the full picture. These free tools, guides, and checklists give you the knowledge to make confident decisions — and avoid the costly mistakes others have made.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#lead-magnets">
                  <Button size="lg" className="gap-2">
                    <Download className="h-4 w-4" /> Get the Free Guides
                  </Button>
                </a>
                <Link to="/roi-calculator">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Calculator className="h-4 w-4" /> Open Calculator
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Problem / Pain Points ───────────────────────────── */}
        <section className="py-12 md:py-16 bg-muted/30 border-b">
          <div className="container px-4">
            <div className="text-center max-w-xl mx-auto mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">The Reality</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Most buyers are flying blind
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Presale real estate is complex. Between deposits, taxes, developer contracts, and completion timelines — there's a lot that can go wrong. Here's where buyers typically struggle:
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {problems.map(({ problem, stat, statLabel, solution, icon: Icon }) => (
                <div key={problem} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4.5 w-4.5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-0.5">Common problem</p>
                      <p className="text-sm font-semibold text-foreground leading-snug">{problem}</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5 border-t border-b border-border py-2.5">
                    <span className="text-2xl font-bold text-destructive tabular-nums">{stat}</span>
                    <span className="text-xs text-muted-foreground">{statLabel}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-snug">{solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Lead Magnets ────────────────────────────────────── */}
        <section id="lead-magnets" className="py-14 md:py-20 border-b">
          <div className="container px-4">
            <div className="text-center max-w-xl mx-auto mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Free Downloads</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Your unfair advantage starts here
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                These two resources are what we give every serious buyer we work with. Now they're available free — just enter your info and get instant access.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <MagnetCard
                badge="Free PDF Guide"
                title="7 Costly Mistakes Buyers Make When Buying a Presale"
                subtitle="Essential reading before you sign anything"
                description="Most buyers don't know what they don't know — until it's too late. This guide walks you through the seven most expensive mistakes we see buyers make, and exactly how to avoid them."
                points={[
                  "The contract clause that can cost you your deposit",
                  "Why your mortgage pre-approval doesn't protect you",
                  "The developer incentive that's actually a red flag",
                  "What to check before the 7-day rescission period ends",
                  "Hidden completion costs most buyers forget to budget",
                  "The #1 sign a project will be delayed",
                  "Assignment clause traps and how to spot them",
                ]}
                previewItems={[
                  "Mistake #1: Skipping the disclosure statement review",
                  "Mistake #2: Ignoring the deposit structure fine print",
                  "Mistake #3: Not budgeting for completion surprises",
                  "Mistake #4: Trusting verbal promises",
                  "… and 3 more critical mistakes inside",
                ]}
                icon={AlertTriangle}
                magnetId="lead_magnet_7_mistakes"
              />

              <MagnetCard
                badge="Free Checklist"
                title="Deficiency Walkthrough Checklist"
                subtitle="Don't miss a single issue on move-in day"
                description="Your new home comes with a 2-5-10 warranty — but only if you document deficiencies properly at your walkthrough. This professional-grade checklist covers everything from windows to plumbing."
                points={[
                  "Room-by-room inspection checklist (condo & townhome)",
                  "BC 2-5-10 Home Warranty coverage breakdown",
                  "How to log deficiencies so they can't be disputed",
                  "What to do if the developer refuses to fix something",
                  "10–11 month warranty reminder checklist included",
                  "Downloadable PDF you can bring to your walkthrough",
                ]}
                previewItems={[
                  "✓ Windows, doors & locks",
                  "✓ Plumbing & fixtures",
                  "✓ Flooring, walls & ceilings",
                  "✓ Appliances & ventilation",
                  "✓ Exterior & common areas (strata)",
                ]}
                icon={CheckSquare}
                magnetId="lead_magnet_deficiency_checklist"
              />
            </div>
          </div>
        </section>

        {/* ── Calculator CTA ───────────────────────────────────── */}
        <section className="py-14 md:py-20 bg-muted/30 border-b">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto rounded-2xl border border-primary/20 bg-card overflow-hidden shadow-sm">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Left: copy */}
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded mb-4 w-fit">
                    <Calculator className="h-3 w-3" /> Free Tool
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight">
                    Run the numbers before you commit
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                    Our ROI & Mortgage Calculator models your total investment, monthly carrying costs, projected appreciation, and 5-year returns — all in one place. No lead form required.
                  </p>
                  <ul className="space-y-2 mb-6">
                    {[
                      "Total cost of ownership breakdown",
                      "Monthly mortgage & strata estimates",
                      "5-year ROI projection with appreciation",
                      "PTT, GST & closing cost calculator",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/roi-calculator">
                      <Button className="gap-2 w-full sm:w-auto">
                        <Calculator className="h-4 w-4" /> Open ROI Calculator
                      </Button>
                    </Link>
                    <Link to="/mortgage-calculator">
                      <Button variant="outline" className="gap-2 w-full sm:w-auto">
                        Open Mortgage Calculator
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Right: visual preview */}
                <div className="bg-foreground/[0.03] border-l border-border p-8 md:p-10 flex flex-col justify-center gap-4">
                  {[
                    { label: "Purchase Price", value: "$799,000" },
                    { label: "Total Investment", value: "$139,800" },
                    { label: "5-Year Return", value: "+28.4%" },
                    { label: "Monthly Cash Flow", value: "$320 / mo" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-bold text-primary tabular-nums">{value}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground/60 pt-1">Sample output only. Run your real numbers →</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Presale Process ──────────────────────────────────── */}
        <section className="py-14 md:py-20 border-b">
          <div className="container px-4">
            <div className="text-center max-w-xl mx-auto mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">The Process</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                How buying a presale actually works
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                From first look to key collection — here's the full journey, simplified.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto mb-8">
              {processSteps.map(({ number, title, desc, icon: Icon }) => (
                <div key={number} className="rounded-xl border border-border bg-card p-5 flex gap-4 items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-primary/60 tracking-widest">{number}</span>
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link to="/presale-process">
                <Button variant="outline" className="gap-2">
                  <BookOpen className="h-4 w-4" /> Read the Full Process Guide
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Social proof / CTA ──────────────────────────────── */}
        <section className="py-14 md:py-20 bg-muted/30">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex justify-center gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              <blockquote className="text-lg md:text-xl font-medium text-foreground mb-4 leading-relaxed">
                "The 7 Mistakes guide alone saved me from signing a contract with a bad assignment clause. I would have never caught it without this resource."
              </blockquote>
              <p className="text-sm text-muted-foreground mb-8">— Jason T., Burnaby presale buyer, 2025</p>

              <div className="rounded-2xl border border-primary/20 bg-card p-8">
                <h3 className="text-xl font-bold text-foreground mb-2">Not sure where to start?</h3>
                <p className="text-muted-foreground text-sm mb-5">
                  Book a free 20-minute call with our team. We'll map out your budget, timeline, and the best presale opportunities in your target area.
                </p>
                <Link to="/book">
                  <Button size="lg" className="gap-2">
                    Book a Free Strategy Call
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
