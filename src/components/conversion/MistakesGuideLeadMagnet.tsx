import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, ChevronRight, Shield, CheckCircle, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId, getSessionId, trackFormStart, trackFormSubmit } from "@/lib/tracking";
import { MetaEvents } from "@/components/tracking/MetaPixel";
import { useLeadSubmission } from "@/hooks/useLeadSubmission";
import { upsertProjectLead } from "@/lib/upsertProjectLead";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email").max(255),
});

type FormData = z.infer<typeof schema>;

const MISTAKES = [
  "Hidden contract clauses that cost buyers $50K+",
  "Developer red flags most buyers overlook",
  "Deposit traps & assignment restriction risks",
  "GST, PTT & closing costs nobody warns you about",
  "Completion delay loopholes developers use",
  "What the sales centre won't tell you",
  "Why you need YOUR own agent — not theirs",
];

interface MistakesGuideLeadMagnetProps {
  /** Where the component is placed — used for analytics */
  location?: string;
  /** Compact variant for sidebars */
  variant?: "full" | "compact" | "inline";
  className?: string;
}

export function MistakesGuideLeadMagnet({
  location = "page_section",
  variant = "full",
  className = "",
}: MistakesGuideLeadMagnetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [formStarted, setFormStarted] = useState(false);
  const { toast } = useToast();
  const { submitLead } = useLeadSubmission();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "" },
  });

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "exit_intent_pdf_url")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setPdfUrl(String(data.value).replace(/^"|"$/g, ""));
      });
  }, []);

  const handleFormFocus = () => {
    if (!formStarted) {
      setFormStarted(true);
      MetaEvents.formStart({ content_name: "7 Mistakes Guide", content_category: "lead_magnet" });
      trackFormStart({ form_name: "7_mistakes_guide", form_location: location });
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const utmSource = sessionStorage.getItem("utm_source") || null;
      const utmMedium = sessionStorage.getItem("utm_medium") || null;
      const utmCampaign = sessionStorage.getItem("utm_campaign") || null;
      const referrer = sessionStorage.getItem("referrer") || document.referrer || null;
      const landingPage = sessionStorage.getItem("landing_page") || window.location.href;

      const firstName = data.name.trim().split(" ")[0];

      await supabase.from("newsletter_subscribers").insert({
        email: data.email,
        source: "7_mistakes_guide",
        preferred_city: null,
        wants_projects: true,
        wants_assignments: false,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        referrer,
        landing_page: landingPage,
      }).then(({ error }) => {
        if (error && !error.message.includes("duplicate")) throw error;
      });

      // Use central upsert helper — dedupes on email, validates form_type/
      // lead_source so this magnet always appears in ROI reporting.
      const leadId = await upsertProjectLead({
        name: data.name.trim(),
        email: data.email.trim(),
        form_type: "lead_magnet",
        message: `7 Mistakes Guide - ${location}`,
        lead_source: "lead_magnet_7_mistakes",
        visitor_id: visitorId,
        session_id: sessionId,
        landing_page: landingPage,
        referrer,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      });

      submitLead({
        leadId,
        firstName,
        lastName: "",
        email: data.email.trim(),
        phone: "",
        formType: "lead_magnet",
        message: `7 Mistakes Guide - ${location}`,
        projectUrl: window.location.href,
      });

      trackFormSubmit({ form_name: "7_mistakes_guide", form_location: location, email: data.email });
      MetaEvents.lead({ content_name: "7 Mistakes Guide", content_category: "lead_magnet" });

      supabase.functions.invoke("meta-conversions-api", {
        body: {
          event_name: "Lead",
          email: data.email,
          event_source_url: window.location.href,
          content_name: "7 Mistakes Guide",
          content_category: "lead_magnet",
          client_user_agent: navigator.userAgent,
          fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1],
          fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1],
        },
      }).catch(console.error);

      localStorage.setItem("presale_lead_converted", "true");
      localStorage.setItem("pp_form_submitted", "true");
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Error:", error);
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show if already converted
  const alreadyConverted = localStorage.getItem("presale_lead_converted") === "true";

  if (alreadyConverted && !isSubmitted) return null;

  if (variant === "compact") {
    return (
      <div className={`rounded-2xl border border-primary/20 bg-gradient-to-br from-foreground to-foreground/95 p-5 ${className}`}>
        {!isSubmitted ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15">
                <AlertTriangle className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Free Guide</span>
            </div>
            <h3 className="text-lg font-extrabold text-background leading-tight mb-2">
              7 Costly Mistakes <span className="text-primary">Presale Buyers Make</span>
            </h3>
            <p className="text-background/60 text-xs mb-4 leading-relaxed">
              Don't sign anything before reading this. Download the free guide.
            </p>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2.5" onFocus={handleFormFocus}>
              <Input
                type="text"
                placeholder="First Name"
                autoComplete="given-name"
                {...form.register("name")}
                className="h-10 bg-background/10 border-background/20 text-background placeholder:text-background/40 text-sm"
              />
              <Input
                type="email"
                placeholder="Email Address"
                autoComplete="email"
                {...form.register("email")}
                className="h-10 bg-background/10 border-background/20 text-background placeholder:text-background/40 text-sm"
              />
              <Button type="submit" className="w-full h-10 font-bold text-sm" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Get the Free Guide"}
              </Button>
            </form>
            <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-background/40">
              <Shield className="h-2.5 w-2.5" /> No spam · 100% free
            </p>
          </>
        ) : (
          <SuccessState pdfUrl={pdfUrl} compact />
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`rounded-2xl border border-border bg-muted/30 p-6 md:p-8 ${className}`}>
        {!isSubmitted ? (
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-3">
                <AlertTriangle className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Free Guide</span>
              </div>
              <h3 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight mb-2">
                7 Costly Mistakes Presale Buyers Make
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Most buyers don't find out until it's too late. Get the free guide before you sign anything.
              </p>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full md:w-auto md:min-w-[320px] space-y-2.5" onFocus={handleFormFocus}>
              <Input
                type="text"
                placeholder="First Name"
                autoComplete="given-name"
                {...form.register("name")}
                className="h-11"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
              <Input
                type="email"
                placeholder="Email Address"
                autoComplete="email"
                {...form.register("email")}
                className="h-11"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
              <Button type="submit" className="w-full h-11 font-bold text-sm gap-2" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : (
                  <>
                    Send Me the Free Guide
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Shield className="h-3 w-3" /> No spam. Unsubscribe anytime. 100% free.
              </p>
            </form>
          </div>
        ) : (
          <SuccessState pdfUrl={pdfUrl} />
        )}
      </div>
    );
  }

  // Full variant — hero-style banner
  return (
    <section className={`py-12 md:py-16 ${className}`}>
      <div className="container px-4">
        <div className="relative rounded-3xl overflow-hidden bg-foreground">
          {/* Background glow effects */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative grid md:grid-cols-2 gap-0">
            {/* Left — Content */}
            <div className="p-8 md:p-12 lg:p-14">
              <div className="inline-flex items-center gap-1.5 bg-primary/15 border border-primary/30 rounded-full px-3 py-1 mb-5">
                <AlertTriangle className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Free Guide</span>
              </div>

              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-background leading-[1.15] mb-4">
                7 Costly Mistakes<br />
                <span className="text-primary">Presale Buyers Make</span>
              </h2>
              <p className="text-background/60 text-sm md:text-base leading-relaxed mb-6 max-w-md">
                Most buyers don't find out until it's too late. This guide reveals what developers and their sales teams won't tell you — before you sign anything.
              </p>

              {/* Mistakes list */}
              <div className="space-y-2 mb-2">
                {MISTAKES.map((m, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-background/75 leading-snug">{m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Form */}
            <div className="bg-background p-8 md:p-12 lg:p-14 flex flex-col justify-center">
              {!isSubmitted ? (
                <>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    Download the Free Guide
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Enter your details and we'll send the guide instantly.
                  </p>

                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" onFocus={handleFormFocus}>
                    <div>
                      <Input
                        type="text"
                        placeholder="First Name"
                        autoComplete="given-name"
                        {...form.register("name")}
                        className="h-12 text-base"
                      />
                      {form.formState.errors.name && (
                        <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Email Address"
                        autoComplete="email"
                        {...form.register("email")}
                        className="h-12 text-base"
                      />
                      {form.formState.errors.email && (
                        <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                    <Button type="submit" size="lg" className="w-full h-12 font-bold gap-2" disabled={isSubmitting}>
                      {isSubmitting ? "Sending…" : (
                        <>
                          Send Me the Free Guide
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="mt-4 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                    <Shield className="h-3 w-3 shrink-0" />
                    <span>No spam. Unsubscribe anytime. 100% free.</span>
                  </div>

                  <div className="mt-6 pt-5 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">
                      Trusted by <span className="font-semibold text-foreground">400+ families</span> across Metro Vancouver
                    </p>
                  </div>
                </>
              ) : (
                <SuccessState pdfUrl={pdfUrl} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SuccessState({ pdfUrl, compact = false }: { pdfUrl: string | null; compact?: boolean }) {
  return (
    <div className={`text-center ${compact ? "py-2" : "py-4"}`}>
      <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mb-3">
        <CheckCircle className="h-7 w-7 text-primary" />
      </div>
      <h3 className={`font-extrabold ${compact ? "text-lg text-background" : "text-xl text-foreground"} mb-1`}>
        You're All Set! 🎉
      </h3>
      <p className={`text-sm mb-4 ${compact ? "text-background/60" : "text-muted-foreground"}`}>
        Check your inbox — the guide is on its way.
      </p>
      {pdfUrl && (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download PDF Now
        </a>
      )}
      {!pdfUrl && (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          Your guide will arrive in your inbox shortly.
        </div>
      )}
    </div>
  );
}
