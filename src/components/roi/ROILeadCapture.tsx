import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Download, CheckCircle2, Loader2, FileText } from "lucide-react";
import { ROIInputs, ROIResults } from "@/types/roi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { generateROIPdf } from "@/lib/generateROIPdf";

interface ROILeadCaptureProps {
  inputs: ROIInputs;
  results: ROIResults;
  onTrackEvent?: (event: string) => void;
}

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().max(20).optional(),
});

export function ROILeadCapture({ inputs, results, onTrackEvent }: ROILeadCaptureProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

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
      // Store lead in project_leads table
      const { error } = await supabase.from("project_leads").insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        lead_source: "roi_calculator",
        message: `ROI Calculator Analysis:
- Purchase Price: ${formatCurrency(inputs.purchase.purchasePrice)}
- City: ${inputs.purchase.city}
- Property Type: ${inputs.purchase.propertyType}
- Total Investment: ${formatCurrency(results.totalCashInvested)}
- 5-Year Return: ${results.totalReturnPercent.toFixed(1)}%`,
        landing_page: window.location.pathname,
        referrer: document.referrer || null,
      });

      if (error) throw error;

      onTrackEvent?.("roi_email_report_submitted");
      setIsSubmitted(true);
      toast.success("Report request submitted! Check your email.");
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
    onTrackEvent?.("roi_pdf_downloaded");
    
    try {
      generateROIPdf(inputs, results);
      toast.success("PDF report downloaded!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  if (isSubmitted) {
    return (
      <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-2">Request Submitted!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We'll email your detailed ROI report shortly. In the meantime, you can download a summary.
          </p>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          Get Your Full Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roi-name">Name *</Label>
            <Input
              id="roi-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your name"
              autoComplete="name"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="roi-email">Email *</Label>
            <Input
              id="roi-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              autoComplete="email"
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="roi-phone">Phone (optional)</Label>
            <Input
              id="roi-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(604) 123-4567"
              autoComplete="tel"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Email My Report
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleDownloadPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            We respect your privacy. Your information will only be used to send your report.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
