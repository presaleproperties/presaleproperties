import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, User, Phone, CheckCircle2, FileText, Loader2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().max(20).optional(),
});

export type CalculatorType = "roi" | "mortgage";

export interface CalculatorLeadData {
  summary: string; // e.g., "Purchase Price: $500K, City: Surrey..."
  calculatorType: CalculatorType;
}

interface CalculatorLeadCaptureProps {
  calculatorData: CalculatorLeadData;
  onSubmitSuccess?: () => void;
  onTrackEvent?: (event: string) => void;
  onDownloadPdf?: () => void;
  showPdfButton?: boolean;
  variant?: "card" | "inline";
}

const CALCULATOR_CONFIG = {
  roi: {
    title: "Get Your Full ROI Report",
    subtitle: "Plus tailored investment recommendations",
    submitText: "Email My Report",
    successTitle: "Report Request Submitted!",
    successMessage: "We'll email your detailed ROI report shortly.",
    leadSource: "roi_calculator",
    eventName: "roi_email_report_submitted",
  },
  mortgage: {
    title: "Get your estimate emailed",
    subtitle: "Plus tailored presale recommendations based on your budget",
    submitText: "Send My Estimate",
    successTitle: "Estimate Sent!",
    successMessage: "Check your email for your personalized estimate.",
    leadSource: "mortgage_calculator",
    eventName: "mortgage_estimate_submitted",
  },
};

export function CalculatorLeadCapture({
  calculatorData,
  onSubmitSuccess,
  onTrackEvent,
  onDownloadPdf,
  showPdfButton = false,
  variant = "card",
}: CalculatorLeadCaptureProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const config = CALCULATOR_CONFIG[calculatorData.calculatorType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const validation = leadSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Get tracking info
      const visitorId = localStorage.getItem("pp_vid") || crypto.randomUUID();
      const sessionId = sessionStorage.getItem("pp_sid") || crypto.randomUUID();
      const utmSource = sessionStorage.getItem("utm_source") || null;
      const utmMedium = sessionStorage.getItem("utm_medium") || null;
      const utmCampaign = sessionStorage.getItem("utm_campaign") || null;
      const referrer = sessionStorage.getItem("referrer") || document.referrer || null;
      const landingPage = sessionStorage.getItem("landing_page") || window.location.href;

      // Store lead in project_leads table with UUID
      const leadId = crypto.randomUUID();
      const { error } = await supabase.from("project_leads").insert({
        id: leadId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        lead_source: config.leadSource,
        message: `${calculatorData.calculatorType === "roi" ? "ROI" : "Mortgage"} Calculator Analysis:\n${calculatorData.summary}`,
        persona: "buyer",
        timeline: "0-3 months",
        landing_page: landingPage,
        referrer: referrer,
        visitor_id: visitorId,
        session_id: sessionId,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      });

      if (error) throw error;

      // Send to Zapier via edge function
      await supabase.functions.invoke("send-project-lead", { body: { leadId } });

      onTrackEvent?.(config.eventName);
      localStorage.setItem("pp_form_submitted", "true");
      setIsSubmitted(true);
      onSubmitSuccess?.();
      toast.success(config.successTitle);
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
    onTrackEvent?.(`${calculatorData.calculatorType}_pdf_downloaded`);
    onDownloadPdf?.();
  };

  if (isSubmitted) {
    return (
      <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="p-5 md:p-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-2">{config.successTitle}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {config.successMessage}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showPdfButton && onDownloadPdf && (
              <Button variant="outline" onClick={handleDownloadPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
            <Button variant="outline" asChild>
              <a href="/book">
                <Calendar className="h-4 w-4 mr-2" />
                Book a Call
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Your Name"
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
      </div>
      {(errors.name || errors.email) && (
        <p className="text-xs text-destructive">
          {errors.name || errors.email}
        </p>
      )}
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="tel"
          placeholder="Phone (optional)"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="pl-9 h-11"
          autoComplete="tel"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="submit" className="flex-1 h-11" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              {config.submitText}
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
        {showPdfButton && onDownloadPdf && (
          <Button type="button" variant="outline" onClick={handleDownloadPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        We respect your privacy. Your information will only be used to send your report.
      </p>
    </form>
  );

  if (variant === "inline") {
    return formContent;
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{config.title}</h3>
            <p className="text-sm text-muted-foreground">{config.subtitle}</p>
          </div>
        </div>
        {formContent}
      </CardContent>
    </Card>
  );
}
