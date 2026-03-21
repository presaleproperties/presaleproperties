import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { collectTrackingData } from "@/lib/collectTrackingData";
import { calculateLeadScore } from "@/lib/leadScoring";

export interface LeadSubmissionPayload {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  formType: string;
  projectName?: string;
  projectCity?: string;
  projectUrl?: string;
  message?: string;
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
        projectUrl: payload.projectUrl ?? window.location.href,
        message: payload.message ?? "",

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
        pagesVisited: JSON.stringify(tracking.pagesVisited),
        timeOnSite: tracking.timeOnSite,
        sessionCount: tracking.sessionCount,
        firstVisitDate: tracking.firstVisitDate ?? "",
        usedCalculator: tracking.usedCalculator,
        calculatorData: tracking.calculatorData ? JSON.stringify(tracking.calculatorData) : "",
        deviceType: tracking.deviceType,
        userLanguage: tracking.userLanguage,
      };

      // Fire-and-forget: call edge function. Lead is already saved in Supabase by the form itself.
      // We deliberately do NOT await this — never block form success on CRM sync.
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const supabaseUrl = `https://${projectId}.supabase.co`;
      fetch(`${supabaseUrl}/functions/v1/sync-lead-to-lofty`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ leadData: body }),
      }).then(async (res) => {
        const text = await res.text();
        console.log("[Lofty sync]", res.status, text);
      }).catch((err) => {
        console.warn("[Lofty sync failed — lead still saved in DB]", err);
      });

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
