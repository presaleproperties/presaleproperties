/**
 * LpLeadForm — 3-field form used exclusively on /lp/:slug paid-traffic
 * landing pages. Same submission pipeline as ProjectLeadForm
 * (Supabase → Lofty → Meta CAPI → GTM dataLayer) but:
 *  - No agent / realtor questions
 *  - lead_type = "project_inquiry_lp" so paid vs organic can be split
 *  - lead_source defaults to "lp_paid" but accepts overrides
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLeadSubmission } from "@/hooks/useLeadSubmission";
import { upsertProjectLead } from "@/lib/upsertProjectLead";
import { formatPhoneNumber, stripPhoneFormatting } from "@/lib/formatPhone";
import { isValidPhoneNumber } from "libphonenumber-js";
import {
  trackFormStart,
  trackFormSubmit,
  getVisitorId,
  getSessionId,
  pushLeadEvent,
} from "@/lib/tracking";
import { getClientTrackingSnapshot } from "@/lib/tracking/cookies";
import { getUtmDataForSubmission } from "@/hooks/useUtmTracking";
import { getIntentScore, getCityInterests } from "@/lib/tracking/intentScoring";
import { MetaEvents } from "@/components/tracking/MetaPixel";

const formSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine((val) => {
      const digits = stripPhoneFormatting(val);
      if (digits.length !== 10) return false;
      return isValidPhoneNumber(`+1${digits}`, "CA");
    }, "Please enter a valid Canadian phone number"),
  // Honeypot — bots fill it, humans never see it
  website_url: z.string().max(0).optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface LpLeadFormProps {
  projectId: string;
  projectName: string;
  projectSlug: string;
  /** Override CTA copy if needed (default: "Send Me the Floor Plans") */
  ctaLabel?: string;
  /** Position id for analytics — e.g. "hero" | "bottom" */
  formPosition?: string;
  /** Override lead source attribution (default: "lp_paid") */
  leadSource?: string;
}

export function LpLeadForm({
  projectId,
  projectName,
  projectSlug,
  ctaLabel = "Send Me the Floor Plans",
  formPosition = "hero",
  leadSource = "lp_paid",
}: LpLeadFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { submitLead } = useLeadSubmission();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", email: "", phone: "", website_url: "" },
  });

  // Fire form_start once on first interaction
  const handleFirstChange = () => {
    if (hasStarted) return;
    setHasStarted(true);
    trackFormStart({
      form_name: "lp_floor_plan_request",
      form_location: `lp_${formPosition}`,
    });
  };

  useEffect(() => {
    const sub = form.watch(() => handleFirstChange());
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, hasStarted]);

  const onSubmit = async (data: FormData) => {
    // Honeypot trip → silently fake-success (don't alert bot)
    if (data.website_url && data.website_url.length > 0) {
      navigate(`/thank-you?type=project&project=${encodeURIComponent(projectSlug)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const leadId = crypto.randomUUID();
      const eventId = crypto.randomUUID();
      const tracking = getClientTrackingSnapshot();
      const utmData = getUtmDataForSubmission();
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const intentScore = getIntentScore();
      const cityInterest = getCityInterests();
      const leadValue = 100; // CAD — same intrinsic value as organic project inquiries

      // Use central upsert helper — dedupes on email, validates form_type/
      // lead_source, and merges sources for repeat submitters.
      await upsertProjectLead({
        id: leadId,
        project_id: projectId || null,
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        persona: "buyer",
        form_type: "project_inquiry_lp",
        lead_status: "new",
        drip_sequence: "buyer",
        last_drip_sent: 0,
        next_drip_at: new Date().toISOString(),
        lead_source: utmData.utm_source ? `lp_${utmData.utm_source}` : leadSource,
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
        // Ad-attribution fields for Meta CAPI dedup + Lofty enrichment
        event_id: eventId,
        fbp: tracking.fbp ?? null,
        fbc: tracking.fbc ?? null,
        user_agent: tracking.user_agent ?? null,
        value: leadValue,
      });

      // Lead-scoring + Lofty Zapier hand-off (also persists tracking columns)
      submitLead({
        leadId,
        firstName: data.fullName.split(" ")[0] ?? data.fullName,
        lastName: data.fullName.split(" ").slice(1).join(" ") || "",
        email: data.email,
        phone: data.phone,
        formType: "project_inquiry_lp",
        projectName,
        projectUrl: window.location.href,
        eventId,
        fbp: tracking.fbp,
        fbc: tracking.fbc,
        userAgent: tracking.user_agent,
        value: leadValue,
      });

      // Auto-response email
      supabase.functions
        .invoke("send-lead-autoresponse", { body: { leadId, projectId } })
        .catch(console.error);

      // Meta CAPI — share the same event_id with the browser pixel for dedup
      supabase.functions
        .invoke("meta-conversions-api", {
          body: {
            event_name: "Lead",
            event_id: eventId,
            lead_id: leadId,
            email: data.email,
            phone: data.phone,
            first_name: data.fullName,
            last_name: "",
            event_source_url: window.location.href,
            content_name: projectName,
            content_category: "project_inquiry_lp",
            client_user_agent: tracking.user_agent,
            fbc: tracking.fbc,
            fbp: tracking.fbp,
            value: leadValue,
            currency: "CAD",
          },
        })
        .catch(console.error);

      // Browser pixel — pass shared eventID so Meta dedupes it with the CAPI call
      (window as any).fbq?.("track", "Lead", {
        content_name: projectName,
        content_category: "project_inquiry_lp",
        eventID: eventId,
      });
      MetaEvents.lead({ content_name: projectName, content_category: "project_inquiry_lp" });

      // Behavioral analytics
      trackFormSubmit({
        form_name: "lp_floor_plan_request",
        form_location: `lp_${formPosition}`,
        first_name: data.fullName,
        email: data.email,
        phone: data.phone,
        project_id: projectId,
        project_name: projectName,
      });

      // GTM dataLayer — paid-LP-specific lead_type so GA4/Ads/Meta tags can split
      pushLeadEvent({
        lead_type: "project_inquiry_lp",
        project_name: projectName,
        project_slug: projectSlug,
        lead_source: utmData.utm_source ? `lp_${utmData.utm_source}` : leadSource,
        cities: cityInterest && cityInterest.length ? (cityInterest as string[]) : undefined,
        email: data.email,
        phone: data.phone,
        eventID: eventId,
        value: leadValue,
      }).catch(console.error);

      localStorage.setItem("pp_form_submitted", "true");
      localStorage.setItem("presale_lead_converted", "true");

      navigate(
        `/thank-you?type=project&project=${encodeURIComponent(projectSlug)}`
      );
    } catch (err) {
      console.error("LpLeadForm submit error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again or call us directly.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background border border-border/80 rounded-2xl shadow-xl overflow-hidden">
      <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />
      <div className="bg-foreground px-5 py-4">
        <h3 className="text-base font-bold text-background leading-snug">
          Instant Access to Floor Plans &amp; Pricing
        </h3>
        <p className="text-[11px] text-background/45 mt-0.5 flex items-center gap-1">
          <Lock className="h-2.5 w-2.5" />
          <span>No obligation · Sent within minutes</span>
        </p>
      </div>

      <div className="p-5">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
          {/* Honeypot — hidden from real users */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-9999px",
              top: "-9999px",
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: "none",
            }}
          >
            <label htmlFor={`lp-website-url-${formPosition}`}>Website (leave blank)</label>
            <input
              id={`lp-website-url-${formPosition}`}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...form.register("website_url")}
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor={`lp-name-${formPosition}`}
              className="text-xs font-semibold text-foreground/80"
            >
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`lp-name-${formPosition}`}
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

          <div className="space-y-1">
            <Label
              htmlFor={`lp-email-${formPosition}`}
              className="text-xs font-semibold text-foreground/80"
            >
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`lp-email-${formPosition}`}
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

          <div className="space-y-1">
            <Label
              htmlFor={`lp-phone-${formPosition}`}
              className="text-xs font-semibold text-foreground/80"
            >
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`lp-phone-${formPosition}`}
              type="tel"
              inputMode="numeric"
              placeholder="(604) 555-0123"
              autoComplete="tel"
              value={form.watch("phone")}
              onChange={(e) =>
                form.setValue("phone", formatPhoneNumber(e.target.value), {
                  shouldValidate: form.formState.isSubmitted,
                })
              }
              className="h-11 text-[16px] sm:text-sm rounded-lg"
            />
            {form.formState.errors.phone && (
              <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-12 rounded-xl text-sm font-bold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" /> {ctaLabel}
              </>
            )}
          </Button>

          <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
            By submitting, you agree to be contacted about this property.
          </p>
        </form>
      </div>
    </div>
  );
}
