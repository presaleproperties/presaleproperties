import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle, Download, MessageCircle, X, ExternalLink,
  FileText, LayoutGrid, DollarSign, Lock, Clock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { getUtmDataForSubmission } from "@/hooks/useUtmTracking";
import { trackCTAClick } from "@/hooks/useLoftyTracking";
import { trackFormStart, trackFormSubmit, getVisitorId, getSessionId } from "@/lib/tracking";
import { getIntentScore, getCityInterests, getTopViewedProjects } from "@/lib/tracking/intentScoring";
import { MetaEvents } from "@/components/tracking/MetaPixel";

const phoneRegex = /^[\+]?[1]?[-.\s]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

const formSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(1, "Phone is required").regex(phoneRegex, "Enter a valid phone number"),
  workingWithAgent: z.boolean().default(false),
  isRealtor: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface ProjectLeadFormProps {
  projectId: string;
  projectName: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  brochureUrl?: string | null;
  floorplanUrl?: string | null;
  pricingUrl?: string | null;
  leadSource?: "floor_plan_request" | "general_inquiry" | "scheduler";
  onClose?: () => void;
}

const isGoogleDriveLink = (url: string) =>
  url.includes("drive.google.com") || url.includes("docs.google.com");

const hasValidUrl = (url: string | null | undefined): url is string =>
  Boolean(url && url.trim().length > 0);

export function ProjectLeadForm({
  projectId,
  projectName,
  status,
  brochureUrl,
  floorplanUrl,
  pricingUrl,
  leadSource = "floor_plan_request",
  onClose,
}: ProjectLeadFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("16722581100");

  const hasBrochure = hasValidUrl(brochureUrl);
  const hasFloorplan = hasValidUrl(floorplanUrl);
  const hasPricing = hasValidUrl(pricingUrl);
  const hasAnyDocuments = hasBrochure || hasFloorplan || hasPricing;

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "whatsapp_number")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setWhatsappNumber(data.value as string);
      });
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", email: "", phone: "", workingWithAgent: false, isRealtor: false },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const leadId = crypto.randomUUID();
      const utmData = getUtmDataForSubmission();
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const intentScore = getIntentScore();
      const cityInterest = getCityInterests();
      const projectInterest = getTopViewedProjects().map((p) => p.project_id);
      const actualPersona = data.isRealtor ? "realtor" : "buyer";

      trackFormStart({ form_name: "floor_plan_request", form_location: "project_lead_form" });

      // Insert full lead in one shot
      const { error } = await supabase.from("project_leads").insert({
        id: leadId,
        project_id: projectId || null,
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        persona: actualPersona,
        agent_status: data.workingWithAgent ? "working_with_agent" : data.isRealtor ? "i_am_realtor" : "no",
        message: [
          data.workingWithAgent ? "Working with agent" : null,
          data.isRealtor ? "Is a Realtor" : null,
        ].filter(Boolean).join(", ") || null,
        drip_sequence: "buyer",
        last_drip_sent: 0,
        next_drip_at: new Date().toISOString(),
        lead_source: leadSource,
        utm_source: utmData.utm_source,
        utm_medium: utmData.utm_medium,
        utm_campaign: utmData.utm_campaign,
        utm_content: utmData.utm_content,
        utm_term: utmData.utm_term,
        referrer: utmData.referrer,
        landing_page: utmData.landing_page,
        visitor_id: visitorId,
        session_id: sessionId,
        intent_score: intentScore,
        city_interest: cityInterest,
        project_interest: projectInterest,
      });

      if (error) throw error;

      trackCTAClick({
        cta_type: "lead_form_submit",
        cta_label: "Get Instant Access",
        cta_location: "project_lead_form",
        project_id: projectId,
        project_name: projectName,
      });

      trackFormSubmit({
        form_name: "floor_plan_request",
        form_location: "project_lead_form",
        first_name: data.fullName,
        last_name: "",
        email: data.email,
        phone: data.phone,
        user_type: actualPersona,
        project_id: projectId,
        project_name: projectName,
      });

      // Non-blocking workflows
      supabase.functions.invoke("trigger-workflow", {
        body: {
          event: "project_inquiry",
          data: { email: data.email, first_name: data.fullName, last_name: "", project_name: projectName, project_id: projectId },
          meta: { lead_id: leadId, source: leadSource },
        },
      }).catch(console.error);

      supabase.functions.invoke("send-project-lead", { body: { leadId } }).catch(console.error);

      supabase.functions.invoke("meta-conversions-api", {
        body: {
          event_name: "Lead",
          email: data.email,
          phone: data.phone,
          first_name: data.fullName,
          last_name: "",
          event_source_url: window.location.href,
          content_name: projectName,
          content_category: actualPersona,
          client_user_agent: navigator.userAgent,
          fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1],
          fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1],
        },
      }).catch(console.error);

      localStorage.setItem("presale_persona", actualPersona);
      localStorage.setItem("pp_form_submitted", "true");
      localStorage.setItem("presale_lead_converted", "true");

      if (typeof window !== "undefined") {
        if ((window as any).gtag) {
          (window as any).gtag("event", "submit_access_pack", {
            page_path: window.location.pathname,
            project_name: projectName,
            persona: actualPersona,
            source: "project_lead_form",
          });
        }
        if ((window as any).fbq) {
          (window as any).fbq("track", "Lead", { content_name: projectName, content_category: actualPersona });
        }
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error("Lead form error:", err);
      form.setError("root", { message: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = encodeURIComponent(`Hello! Can I get more details about "${projectName}"?`);
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // ─── SUCCESS STATE ───────────────────────────────────────────
  if (submitted) {
    return (
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-premium">
        <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />

        <div className="bg-foreground px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-11 h-11 bg-primary/15 rounded-xl shrink-0">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-background leading-tight">You're All Set!</h3>
              <p className="text-xs text-background/50 mt-0.5">An email with full details will be sent to you shortly.</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {hasBrochure ? (
            <Button asChild size="lg" className="w-full h-12 text-sm font-semibold rounded-xl">
              <a href={brochureUrl!} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                {isGoogleDriveLink(brochureUrl!) ? "View Brochure" : "Download Brochure"}
                {isGoogleDriveLink(brochureUrl!) && <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-70" />}
              </a>
            </Button>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/15 rounded-xl">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Check your inbox shortly</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Full details for <strong>{projectName}</strong> will be emailed to you. One of our agents will follow up within <strong>24 hours</strong>.
                </p>
              </div>
            </div>
          )}

          <div className={hasBrochure ? "pt-2 border-t border-border/40" : ""}>
            {hasBrochure && <p className="text-[11px] text-muted-foreground text-center mb-2.5">Want to talk to an agent right now?</p>}
            <Button asChild size="lg" className="w-full h-12 text-sm font-semibold rounded-xl bg-[#25D366] hover:bg-[#1ebe5a] text-white border-0">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat Now on WhatsApp
              </a>
            </Button>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            We're available 7 days a week to answer your questions.
          </p>
        </div>
      </div>
    );
  }

  // ─── FORM ────────────────────────────────────────────────────
  return (
    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-premium relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 p-1.5 rounded-full bg-background/10 text-background/70 hover:text-background hover:bg-background/20 transition-all"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Accent line */}
      <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />

      {/* Header */}
      <div className="bg-foreground px-5 py-4 pr-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.06),_transparent_60%)]" />
        <div className="relative flex items-start gap-3">
          <div className="inline-flex items-center justify-center w-9 h-9 bg-primary/15 rounded-lg shrink-0 mt-0.5">
            <Download className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-background leading-snug">
              {hasAnyDocuments ? "Instant Access to Floor Plans & Pricing" : "Request Project Information"}
            </h3>
            <p className="text-[11px] text-background/45 mt-0.5 flex items-center gap-1">
              <Lock className="h-2.5 w-2.5" />
              {hasAnyDocuments
                ? (
                  <span className="flex items-center gap-1.5">
                    {hasFloorplan && <span>Floor Plans</span>}
                    {hasPricing && <><span className="opacity-40">·</span><span>Pricing</span></>}
                    {hasBrochure && <><span className="opacity-40">·</span><span>Brochure</span></>}
                    <span className="opacity-40">·</span><span>No obligation</span>
                  </span>
                )
                : "An agent will contact you within 24 hours"}
            </p>
          </div>
        </div>
      </div>

      {/* Form body */}
      <div className="p-5">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
          {/* Full Name */}
          <div className="space-y-1">
            <Label htmlFor="lf-name" className="text-xs font-semibold text-foreground/80">Full Name</Label>
            <Input
              id="lf-name"
              placeholder="John Smith"
              autoComplete="name"
              autoCapitalize="words"
              {...form.register("fullName")}
              className="h-11 text-[16px] sm:text-sm rounded-lg"
            />
            {form.formState.errors.fullName && (
              <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="lf-email" className="text-xs font-semibold text-foreground/80">Email Address</Label>
            <Input
              id="lf-email"
              type="email"
              inputMode="email"
              placeholder="john@email.com"
              autoComplete="email"
              autoCapitalize="none"
              {...form.register("email")}
              className="h-11 text-[16px] sm:text-sm rounded-lg"
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label htmlFor="lf-phone" className="text-xs font-semibold text-foreground/80">Phone Number</Label>
            <Input
              id="lf-phone"
              type="tel"
              inputMode="tel"
              placeholder="(604) 555-0123"
              autoComplete="tel"
              {...form.register("phone")}
              className="h-11 text-[16px] sm:text-sm rounded-lg"
            />
            {form.formState.errors.phone && (
              <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
            )}
          </div>

          {/* Checkboxes */}
          <div className="space-y-2.5 pt-1 pb-0.5">
            <div className="flex items-center gap-3">
              <Checkbox
                id="lf-agent"
                checked={form.watch("workingWithAgent")}
                onCheckedChange={(v) => form.setValue("workingWithAgent", v === true)}
                className="h-[18px] w-[18px] rounded border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="lf-agent" className="text-sm text-foreground/70 cursor-pointer select-none leading-tight">
                I'm working with a real estate agent
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="lf-realtor"
                checked={form.watch("isRealtor")}
                onCheckedChange={(v) => form.setValue("isRealtor", v === true)}
                className="h-[18px] w-[18px] rounded border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="lf-realtor" className="text-sm text-foreground/70 cursor-pointer select-none leading-tight">
                I am a Realtor
              </Label>
            </div>
          </div>

          {form.formState.errors.root && (
            <p className="text-xs text-destructive text-center">{form.formState.errors.root.message}</p>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-sm font-semibold rounded-lg gap-2 shadow-gold hover:shadow-gold-glow transition-all"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {hasAnyDocuments ? "Get Instant Access" : "Request Information"}
              </>
            )}
          </Button>

          <p className="text-center text-[10px] text-muted-foreground/60">
            <span className="text-primary/70">✓</span> No spam · <a href="/privacy" className="underline hover:text-foreground/60">Privacy Policy</a>
          </p>
        </form>
      </div>
    </div>
  );
}
