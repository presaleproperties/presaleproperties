import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUtmDataForSubmission } from "@/hooks/useUtmTracking";
import { trackCTAClick } from "@/hooks/useLoftyTracking";
import { trackFormStart, trackFormSubmit, getVisitorId, getSessionId } from "@/lib/tracking";
import { getIntentScore, getCityInterests, getTopViewedProjects } from "@/lib/tracking/intentScoring";


interface UsePresaleLeadCaptureProps {
  projectId?: string;
  projectName: string;
  leadSource?: "floor_plan_request" | "general_inquiry" | "scheduler";
  formLocation: string;
}

export type LeadStep = "email" | "details" | "success";

export function usePresaleLeadCapture({
  projectId,
  projectName,
  leadSource = "floor_plan_request",
  formLocation,
}: UsePresaleLeadCaptureProps) {
  const [step, setStep] = useState<LeadStep>("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedEmail, setCapturedEmail] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [formStartTracked, setFormStartTracked] = useState(false);
  const { toast } = useToast();

  const handleFormInteraction = () => {
    if (!formStartTracked) {
      setFormStartTracked(true);
      trackFormStart({
        form_name: leadSource === "floor_plan_request" ? "floor_plan_request" : "project_inquiry",
        form_location: formLocation,
      });
    }
  };

  /** Step 1: Capture email and save partial lead to DB */
  const submitEmail = async (email: string) => {
    setIsSubmitting(true);
    try {
      const newLeadId = crypto.randomUUID();
      const utmData = getUtmDataForSubmission();
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const intentScore = getIntentScore();
      const cityInterest = getCityInterests();
      const projectInterest = getTopViewedProjects().map(p => p.project_id);

      const { error } = await supabase
        .from("project_leads")
        .insert({
          id: newLeadId,
          project_id: projectId || null,
          name: "(pending)",
          email,
          phone: null,
          message: "Partial lead - email only",
          persona: "buyer",
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

      setCapturedEmail(email);
      setLeadId(newLeadId);
      setStep("details");
    } catch (error: any) {
      console.error("Error saving email:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Step 2: Complete the lead with full details */
  const submitDetails = async (data: {
    fullName?: string;
    phone?: string;
    isRealtor?: boolean;
  }) => {
    if (!leadId) return;
    setIsSubmitting(true);

    const actualPersona = data.isRealtor ? "realtor" : "buyer";
    const messageData = data.isRealtor ? "I'm a Realtor" : "";

    trackCTAClick({
      cta_type: "lead_form_submit",
      cta_label: "Download Info",
      cta_location: formLocation,
      project_id: projectId,
      project_name: projectName,
    });

    trackFormSubmit({
      form_name: leadSource === "floor_plan_request" ? "floor_plan_request" : "project_inquiry",
      form_location: formLocation,
      first_name: data.fullName,
      last_name: "",
      email: capturedEmail,
      phone: data.phone,
      user_type: actualPersona,
      project_id: projectId,
      project_name: projectName,
    });

    try {
      const { error } = await supabase
        .from("project_leads")
        .update({
          name: data.fullName,
          phone: data.phone,
          message: messageData || null,
          persona: actualPersona,
          agent_status: data.isRealtor ? "i_am_realtor" : "no",
        })
        .eq("id", leadId);

      if (error) throw error;

      // Trigger workflows (non-blocking)
      supabase.functions.invoke("trigger-workflow", {
        body: {
          event: "project_inquiry",
          data: { email: capturedEmail, first_name: data.fullName, last_name: "", project_name: projectName, project_id: projectId },
          meta: { lead_id: leadId, source: leadSource },
        },
      }).catch(console.error);

      supabase.functions.invoke("send-project-lead", { body: { leadId } }).catch(console.error);

      supabase.functions.invoke("meta-conversions-api", {
        body: {
          event_name: "Lead",
          email: capturedEmail,
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
            source: formLocation,
          });
        }
        if ((window as any).fbq) {
          (window as any).fbq("track", "Lead", { content_name: projectName, content_category: actualPersona });
        }
      }

      setStep("success");

      // DealsFlow CRM push happens inside upsertProjectLead / send-project-lead

      toast({
        title: "Request submitted!",
        description: "We'll be in touch shortly.",
      });
    } catch (error: any) {
      console.error("Error completing lead:", error);
      toast({
        title: "Submission failed",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setStep("email");
    setCapturedEmail("");
    setLeadId(null);
    setFormStartTracked(false);
  };

  return {
    step,
    isSubmitting,
    capturedEmail,
    handleFormInteraction,
    submitEmail,
    submitDetails,
    reset,
  };
}
