import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Download, MessageCircle, X, ExternalLink, FileText, LayoutGrid, DollarSign, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { usePresaleLeadCapture } from "@/hooks/usePresaleLeadCapture";

const phoneRegex = /^[\+]?[1]?[-.\s]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

const emailSchema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255),
});

const detailsSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  phone: z.string().trim().min(1, "Phone is required").regex(phoneRegex, "Enter a valid phone number"),
  isRealtor: z.boolean().default(false),
});

type EmailFormData = z.infer<typeof emailSchema>;
type DetailsFormData = z.infer<typeof detailsSchema>;

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

export function ProjectLeadForm({ projectId, projectName, status, brochureUrl, floorplanUrl, pricingUrl, leadSource = "floor_plan_request", onClose }: ProjectLeadFormProps) {
  const [whatsappNumber, setWhatsappNumber] = useState<string>("16722581100");

  const {
    step,
    isSubmitting,
    capturedEmail,
    handleFormInteraction,
    submitEmail,
    submitDetails,
    reset,
  } = usePresaleLeadCapture({
    projectId,
    projectName,
    leadSource,
    formLocation: "project_lead_form",
  });

  useEffect(() => {
    const fetchWhatsappNumber = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .maybeSingle();
      if (data?.value) {
        setWhatsappNumber(data.value as string);
      }
    };
    fetchWhatsappNumber();
  }, []);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const detailsForm = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { fullName: "", phone: "", isRealtor: false },
  });

  const onEmailSubmit = async (data: EmailFormData) => {
    await submitEmail(data.email);
  };

  const onDetailsSubmit = async (data: DetailsFormData) => {
    await submitDetails(data);
  };

  const whatsappMessage = encodeURIComponent(`Hi! I just submitted my info for ${projectName} and would love to learn more.`);
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // ========================================
  // FORM CONTENT BY STATUS
  // ========================================
  const getFormContent = () => {
    switch (status) {
      case "coming_soon":
        return { title: "Get Early Access to Floor Plans & Pricing", buttonText: "Download Info" };
      case "registering":
        return { title: "Register for VIP Access", buttonText: "Download Info" };
      case "active":
        return { title: "Get Floor Plans & Pricing", buttonText: "Download Info" };
      default:
        return { title: "Get Notified of Similar Projects", buttonText: "Download Info" };
    }
  };

  const content = getFormContent();

  // ========================================
  // SUCCESS STATE
  // ========================================
  if (step === "success") {
    const hasValidUrl = (url: string | null | undefined): url is string =>
      Boolean(url && url.trim().length > 0);

    const hasBrochure = hasValidUrl(brochureUrl);
    const hasFloorplan = hasValidUrl(floorplanUrl);
    const hasPricing = hasValidUrl(pricingUrl);
    const hasAnyDocuments = hasBrochure || hasFloorplan || hasPricing;

    const isGoogleDriveLink = (url: string) => url.includes('drive.google.com') || url.includes('docs.google.com');

    return (
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-premium">
        <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />
        <div className="bg-foreground px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/15 rounded-xl">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-background">You're All Set!</h3>
              <p className="text-xs text-background/45 font-medium">
                {hasAnyDocuments ? "Access your documents below." : "Check your email for pricing & floor plans."}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {hasAnyDocuments && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Documents</p>
              {hasFloorplan && (
                <Button asChild size="lg" className="w-full h-12 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
                  <a href={floorplanUrl!} target="_blank" rel="noopener noreferrer">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    {isGoogleDriveLink(floorplanUrl!) ? "View Floor Plans" : "Download Floor Plans"}
                    {isGoogleDriveLink(floorplanUrl!) && <ExternalLink className="h-3 w-3 ml-1.5" />}
                  </a>
                </Button>
              )}
              {hasPricing && (
                <Button asChild size="lg" variant={hasFloorplan ? "outline" : "default"} className="w-full h-12 text-sm font-semibold rounded-xl">
                  <a href={pricingUrl!} target="_blank" rel="noopener noreferrer">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {isGoogleDriveLink(pricingUrl!) ? "View Pricing Sheet" : "Download Pricing"}
                    {isGoogleDriveLink(pricingUrl!) && <ExternalLink className="h-3 w-3 ml-1.5" />}
                  </a>
                </Button>
              )}
              {hasBrochure && (
                <Button asChild size="lg" variant="outline" className="w-full h-12 text-sm font-semibold rounded-xl">
                  <a href={brochureUrl!} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    {isGoogleDriveLink(brochureUrl!) ? "View Brochure" : "Download Brochure"}
                    {isGoogleDriveLink(brochureUrl!) && <ExternalLink className="h-3 w-3 ml-1.5" />}
                  </a>
                </Button>
              )}
            </div>
          )}

          <Button
            asChild
            size="lg"
            variant={hasAnyDocuments ? "secondary" : "default"}
            className={`w-full h-12 text-sm font-semibold rounded-xl ${!hasAnyDocuments ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
          >
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with an Agent Now
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // ========================================
  // TWO-STEP FORM
  // ========================================
  return (
    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-premium transition-shadow duration-300 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 p-1.5 rounded-full bg-background/10 text-background/70 hover:text-background hover:bg-background/20 transition-all"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Premium accent line */}
      <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />

      {/* Header */}
      <div className="bg-foreground px-5 sm:px-6 py-4 sm:py-5 pr-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.06),_transparent_60%)]" />
        <div className="relative">
          {brochureUrl && step === "email" && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-primary bg-primary/15 px-2.5 py-1 rounded-md mb-2.5">
              <Download className="h-3 w-3" />
              Brochure Available
            </span>
          )}
          {step === "details" && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-primary bg-primary/15 px-2.5 py-1 rounded-md mb-2.5">
              <Mail className="h-3 w-3" />
              Step 2 of 2
            </span>
          )}
          <h3 className="text-lg lg:text-xl font-bold text-background leading-snug">
            {step === "email" ? content.title : "Complete Your Request"}
          </h3>
          <p className="text-xs text-background/45 mt-1 font-medium">
            {step === "email" ? "Instant access · No obligation" : `Finish up to get your ${projectName} details`}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="p-5 sm:p-6">
        {step === "email" ? (
          /* STEP 1: Email only */
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} onFocus={handleFormInteraction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="lead-email" className="text-xs font-semibold text-foreground/80">
                Email Address
              </Label>
              <Input
                id="lead-email"
                type="email"
                inputMode="email"
                placeholder="john@email.com"
                autoComplete="email"
                autoCapitalize="none"
                enterKeyHint="go"
                {...emailForm.register("email")}
                className="h-12 sm:h-11 text-[16px] sm:text-sm rounded-lg border border-border bg-background shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
              {emailForm.formState.errors.email && (
                <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 sm:h-11 text-sm font-semibold rounded-lg gap-2 shadow-gold hover:shadow-gold-glow transition-all"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <>
                  Get Access
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-[10px] text-muted-foreground/60">
              <span className="text-primary/70">✓</span> Instant access · No spam · <a href="/privacy" className="underline hover:text-foreground/60">Privacy Policy</a>
            </p>
          </form>
        ) : (
          /* STEP 2: Name, Phone, Realtor */
          <form onSubmit={detailsForm.handleSubmit(onDetailsSubmit)} className="space-y-4">
            {/* Email confirmation */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-lg">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-xs text-foreground/70 truncate">{capturedEmail}</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lead-fullName" className="text-xs font-semibold text-foreground/80">
                Full Name
              </Label>
              <Input
                id="lead-fullName"
                placeholder="John Smith"
                autoComplete="name"
                autoCapitalize="words"
                autoFocus
                enterKeyHint="next"
                {...detailsForm.register("fullName")}
                className="h-12 sm:h-11 text-[16px] sm:text-sm rounded-lg border border-border bg-background shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
              {detailsForm.formState.errors.fullName && (
                <p className="text-xs text-destructive">{detailsForm.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lead-phone" className="text-xs font-semibold text-foreground/80">
                Phone
              </Label>
              <Input
                id="lead-phone"
                type="tel"
                inputMode="tel"
                placeholder="(604) 555-0123"
                autoComplete="tel"
                enterKeyHint="done"
                {...detailsForm.register("phone")}
                className="h-12 sm:h-11 text-[16px] sm:text-sm rounded-lg border border-border bg-background shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
              {detailsForm.formState.errors.phone && (
                <p className="text-xs text-destructive">{detailsForm.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-0.5">
              <Checkbox
                id="lead-isRealtor"
                checked={detailsForm.watch("isRealtor")}
                onCheckedChange={(checked) => detailsForm.setValue("isRealtor", checked === true)}
                className="h-[18px] w-[18px] rounded border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors"
              />
              <Label htmlFor="lead-isRealtor" className="text-sm text-foreground/70 cursor-pointer select-none">
                I'm a Realtor
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 sm:h-11 text-sm font-semibold rounded-lg gap-2 shadow-gold hover:shadow-gold-glow transition-all"
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
                  {content.buttonText}
                </>
              )}
            </Button>

            <p className="text-center text-[10px] text-muted-foreground/60">
              <span className="text-primary/70">✓</span> Instant access · No spam
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
