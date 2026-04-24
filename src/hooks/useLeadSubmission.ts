import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { collectTrackingData } from "@/lib/collectTrackingData";
import { calculateLeadScore } from "@/lib/leadScoring";
import { getEmailAttribution } from "@/lib/emailAttribution";
import {
  buildBehaviorPayload,
  recordFormEvent,
  getPresaleUserId,
} from "@/lib/tracking/behaviorBuffer";
import { setKnownEmail, streamBehavior } from "@/lib/tracking/streamBehavior";


export interface LeadSubmissionPayload {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  formType: string;
  projectName?: string;
  projectCity?: string;
  propertyType?: string;
  projectUrl?: string;
  message?: string;
  /** Extra form selections to surface in Lofty notes */
  isRealtor?: boolean;
  persona?: string;
  homeSize?: string;
  timeline?: string;
  agentStatus?: string;
  /** If provided, also patches this project_leads row with tracking + score data */
  leadId?: string;
  /** Tracking signals captured at submit time — used for Meta CAPI dedup
   *  with the browser pixel and stored on project_leads for attribution. */
  eventId?: string;
  fbp?: string;
  fbc?: string;
  userAgent?: string;
  /** Monetary value for ad bidding (CAD). */
  value?: number;
}

export interface LeadSubmissionResult {
  submitLead: (payload: LeadSubmissionPayload) => Promise<void>;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
}

export function useLeadSubmission(): LeadSubmissionResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitLead = async (payload: LeadSubmissionPayload) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const tracking = collectTrackingData();
      const emailAttribution = getEmailAttribution();
      const { score, temperature } = calculateLeadScore({
        usedCalculator: tracking.usedCalculator,
        pagesViewed: tracking.pagesViewed,
        sessionCount: tracking.sessionCount,
        formType: payload.formType,
        phone: payload.phone,
        message: payload.message,
        utmSource: tracking.utmSource ?? undefined,
      });

      const body = {
        // Lead identity
        firstName: payload.firstName,
        lastName: payload.lastName ?? "",
        email: payload.email,
        phone: payload.phone,
        formType: payload.formType,
        projectName: payload.projectName ?? "",
        projectCity: payload.projectCity ?? "",
        propertyType: payload.propertyType ?? "",
        projectUrl: payload.projectUrl ?? window.location.href,
        message: payload.message ?? "",

        // Form selections
        isRealtor: payload.isRealtor ?? false,
        persona: payload.persona ?? "",
        homeSize: payload.homeSize ?? "",
        timeline: payload.timeline ?? "",
        agentStatus: payload.agentStatus ?? "",

        // Lead intelligence
        leadScore: score,
        leadTemperature: temperature,

        // UTM & attribution
        utmSource: tracking.utmSource ?? "",
        utmMedium: tracking.utmMedium ?? "",
        utmCampaign: tracking.utmCampaign ?? "",
        utmTerm: tracking.utmTerm ?? "",
        referrerUrl: tracking.referrerUrl ?? "",
        landingPage: tracking.landingPage,

        // Behavioral
        currentPageUrl: tracking.currentPageUrl,
        currentPageTitle: tracking.currentPageTitle,
        pagesViewed: tracking.pagesViewed,
        pagesVisited: tracking.pagesVisited,
        timeOnSite: tracking.timeOnSite,
        sessionCount: tracking.sessionCount,
        firstVisitDate: tracking.firstVisitDate ?? "",
        usedCalculator: tracking.usedCalculator,
        calculatorData: tracking.calculatorData ?? null,
        deviceType: tracking.deviceType,
        userLanguage: tracking.userLanguage,

        // Supabase lead ID for back-linking
        leadId: payload.leadId ?? "",
      };

      // If a leadId was provided, patch the project_leads row with tracking + score data
      // then fire send-project-lead → Zapier
      if (payload.leadId) {
        supabase.from("project_leads").update({
          form_type: payload.formType,
          lead_score: score,
          lead_temperature: temperature,
          pages_viewed: tracking.pagesViewed,
          time_on_site: tracking.timeOnSite,
          session_count: tracking.sessionCount,
          used_calculator: tracking.usedCalculator,
          device_type: tracking.deviceType,
          // Ad-attribution fields for Meta CAPI / Lofty
          event_id: payload.eventId ?? null,
          fbp: payload.fbp ?? null,
          fbc: payload.fbc ?? null,
          user_agent: payload.userAgent ?? null,
          value: payload.value ?? null,
          tracking_data: JSON.parse(JSON.stringify({
            pagesVisited: tracking.pagesVisited,
            firstVisitDate: tracking.firstVisitDate,
            userLanguage: tracking.userLanguage,
            referrerUrl: tracking.referrerUrl,
            landingPage: tracking.landingPage,
            currentPageUrl: tracking.currentPageUrl,
            currentPageTitle: tracking.currentPageTitle,
            calculatorData: tracking.calculatorData ?? null,
            utmTerm: tracking.utmTerm,
            utmContent: tracking.utmContent,
            // Per-card email attribution (set when the visitor arrived via
            // a tracked link in a recommendation/marketing email). Lets us
            // join project_leads ↔ email_logs ↔ email_link_clicks.
            email_attribution: emailAttribution ?? null,
          })),
        } as any).eq("id", payload.leadId).then(({ error: patchErr }) => {
          if (patchErr) console.warn("[useLeadSubmission] DB patch failed:", patchErr);
          else {
            console.log("[useLeadSubmission] DB row patched with tracking data");
            // Pin known email and record signup completion in the buffer so it
            // gets bundled into the bridge call below.
            setKnownEmail(payload.email);
            recordFormEvent({
              form_type: payload.formType || "signup_completed",
              status: "completed",
              funnel_step: 3,
              funnel_total_steps: 3,
            });
            const behavior = buildBehaviorPayload();
            const presale_user_id = getPresaleUserId();

            // Fire Zapier + DealzFlow bridge with full behavior bundle.
            supabase.functions.invoke("send-project-lead", {
              body: { leadId: payload.leadId, behavior, presale_user_id },
            })
              .then(({ error: fnErr }) => {
                if (fnErr) console.warn("[useLeadSubmission] send-project-lead failed:", fnErr);
                else console.log("[useLeadSubmission] Zapier webhook fired successfully");
              })
              .catch((e) => console.warn("[useLeadSubmission] send-project-lead error:", e));

            // Also stream behavior to the CRM directly with the now-known email
            // so anonymous activity collected pre-signup gets stitched.
            streamBehavior({ immediate: true });

            // Fire hot-lead alert (dispatcher checks threshold + enabled flag)
            supabase.functions.invoke("alert-dispatcher", {
              body: { type: "hot_lead", lead_id: payload.leadId },
            }).catch((e) => console.warn("[useLeadSubmission] alert-dispatcher error:", e));
          }
        });
      }

      // Leads go via Zapier through send-project-lead edge function.

      setIsSuccess(true);
    } catch (err: any) {
      console.error("[useLeadSubmission]", err);
      setError(err?.message ?? "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitLead, isSubmitting, isSuccess, error };
}
