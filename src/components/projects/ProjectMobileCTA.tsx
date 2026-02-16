import { Phone, MessageCircle, Download, X, ChevronDown, CheckCircle, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { usePresaleLeadCapture } from "@/hooks/usePresaleLeadCapture";
import { MetaEvents } from "@/components/tracking/MetaPixel";

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

interface ProjectMobileCTAProps {
  projectName: string;
  projectId?: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  startingPrice?: number | null;
  onRegisterClick: () => void;
}

export function ProjectMobileCTA({ 
  projectName,
  projectId,
  status, 
  startingPrice,
  onRegisterClick 
}: ProjectMobileCTAProps) {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

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
    leadSource: "floor_plan_request",
    formLocation: "mobile_cta_footer",
  });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const detailsForm = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { fullName: "", phone: "", isRealtor: false },
  });

  useEffect(() => {
    const fetchWhatsappNumber = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .maybeSingle();
      if (data?.value) {
        setWhatsappNumber(String(data.value).replace(/"/g, ""));
      }
    };
    fetchWhatsappNumber();
  }, []);

  useEffect(() => {
    if (isExpanded) {
      MetaEvents.formStart({
        content_name: projectName || "Access Pack",
        content_category: "floorplans",
      });
    }
    if (!isExpanded) {
      reset();
      emailForm.reset();
      detailsForm.reset();
    }
  }, [isExpanded]);

  // Listen for gallery CTA event to expand the form
  useEffect(() => {
    const handleGalleryCTA = () => setIsExpanded(true);
    window.addEventListener("presale-gallery-cta", handleGalleryCTA);
    return () => window.removeEventListener("presale-gallery-cta", handleGalleryCTA);
  }, []);

  const onEmailSubmit = async (data: EmailFormData) => {
    await submitEmail(data.email);
  };

  const onDetailsSubmit = async (data: DetailsFormData) => {
    await submitDetails(data);

    MetaEvents.lead({
      content_name: projectName || "Access Pack",
      content_category: data.isRealtor ? "realtor" : "buyer",
    });
  };

  const whatsappMessage = encodeURIComponent(`Hi! I'm interested in ${projectName}. Can you send me more information?`);
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}` : null;
  const successWhatsappMessage = encodeURIComponent(`Hi! I just requested the ${projectName} package. Can you help me shortlist the best options in my budget?`);
  const successWhatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${successWhatsappMessage}` : null;

  return (
    <>
      {/* Spacer */}
      <div className="h-24 lg:hidden" aria-hidden="true" />
      
      {/* Fixed CTA bar */}
      <div 
        className="lg:hidden fixed inset-x-0 bottom-0"
        style={{
          zIndex: 99999,
          isolation: 'isolate',
          transform: 'translate3d(0,0,0)',
          WebkitTransform: 'translate3d(0,0,0)',
          willChange: 'transform',
          pointerEvents: 'auto',
          width: '100%',
        }}
      >
        <div 
          className={`bg-background border-t border-border transition-all duration-300 ease-out ${
            isExpanded 
              ? 'rounded-t-3xl shadow-[0_-16px_50px_rgba(0,0,0,0.3)]' 
              : 'shadow-[0_-8px_30px_rgba(0,0,0,0.2)]'
          }`}
        >
          {/* Expanded Form View */}
          {isExpanded && (
            <div 
              className="overflow-y-auto overscroll-contain bg-background rounded-t-3xl"
              style={{ maxHeight: 'calc(85vh - 70px)' }}
            >
              {/* Header */}
              <div className="sticky top-0 bg-background z-10 rounded-t-3xl overflow-hidden">
                <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />
                <div className="px-5 pt-5 pb-4 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg tracking-tight">
                          {step === "email" ? "Get Pricing & Floor Plans" : step === "details" ? "Complete Your Request" : "Request Sent!"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{projectName}</p>
                        {step === "details" && (
                          <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            Step 2 of 2
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full hover:bg-muted -mr-1"
                      onClick={() => setIsExpanded(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {step === "email" ? (
                /* STEP 1: Email only */
                <div className="p-5 pb-8">
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} onFocus={handleFormInteraction} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="mobile-email" className="text-xs font-semibold text-foreground/80">
                        Email Address
                      </Label>
                      <Input
                        id="mobile-email"
                        type="email"
                        inputMode="email"
                        placeholder="john@email.com"
                        autoComplete="email"
                        autoCapitalize="none"
                        enterKeyHint="go"
                        {...emailForm.register("email")}
                        className="h-12 text-[16px] rounded-lg border border-border bg-background shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                      {emailForm.formState.errors.email && (
                        <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-13 font-semibold text-[15px] rounded-lg shadow-gold hover:shadow-gold-glow transition-all mt-2 gap-2" 
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

                    <p className="text-center text-[10px] text-muted-foreground/60 pt-1">
                      <span className="text-primary/70">✓</span> Instant access · No spam
                    </p>
                  </form>
                </div>
              ) : step === "details" ? (
                /* STEP 2: Name, Phone, Realtor */
                <div className="p-5 pb-8">
                  <form onSubmit={detailsForm.handleSubmit(onDetailsSubmit)} className="space-y-4">
                    {/* Email confirmation */}
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-xs text-foreground/70 truncate">{capturedEmail}</span>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="mobile-fullName" className="text-xs font-semibold text-foreground/80">
                        Full Name
                      </Label>
                      <Input
                        id="mobile-fullName"
                        placeholder="John Smith"
                        autoComplete="name"
                        autoCapitalize="words"
                        autoFocus
                        {...detailsForm.register("fullName")}
                        className="h-12 text-[16px] rounded-lg border border-border bg-background shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                      {detailsForm.formState.errors.fullName && (
                        <p className="text-xs text-destructive">{detailsForm.formState.errors.fullName.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="mobile-phone" className="text-xs font-semibold text-foreground/80">
                        Phone
                      </Label>
                      <Input
                        id="mobile-phone"
                        type="tel"
                        inputMode="tel"
                        placeholder="(604) 555-0123"
                        autoComplete="tel"
                        {...detailsForm.register("phone")}
                        className="h-12 text-[16px] rounded-lg border border-border bg-background shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                      {detailsForm.formState.errors.phone && (
                        <p className="text-xs text-destructive">{detailsForm.formState.errors.phone.message}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-0.5">
                      <Checkbox
                        id="mobile-isRealtor"
                        checked={detailsForm.watch("isRealtor")}
                        onCheckedChange={(checked) => detailsForm.setValue("isRealtor", checked === true)}
                        className="h-[18px] w-[18px] rounded border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors"
                      />
                      <Label htmlFor="mobile-isRealtor" className="text-sm text-foreground/70 cursor-pointer select-none">
                        I'm a Realtor
                      </Label>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-13 font-semibold text-[15px] rounded-lg shadow-gold hover:shadow-gold-glow transition-all mt-2 gap-2" 
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
                          Download Info
                        </>
                      )}
                    </Button>

                    <p className="text-center text-[10px] text-muted-foreground/60 pt-1">
                      <span className="text-primary/70">✓</span> Instant access · No spam
                    </p>
                  </form>
                </div>
              ) : (
                /* SUCCESS STATE */
                <div className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-4">
                    <CheckCircle className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-1.5">Request Sent!</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Check your email for floor plans and pricing details.
                  </p>
                  {successWhatsappLink && (
                    <Button asChild variant="outline" className="w-full h-12 rounded-lg mb-3 font-semibold">
                      <a href={successWhatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat on WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" className="w-full h-11 rounded-lg text-muted-foreground" onClick={() => setIsExpanded(false)}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Collapsed CTA Bar */}
          <div 
            className="py-3 bg-background"
            style={{
              paddingLeft: 'max(16px, env(safe-area-inset-left, 16px))',
              paddingRight: 'max(16px, env(safe-area-inset-right, 16px))',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
            }}
          >
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl touch-active" asChild>
                <a href="tel:+16722581100" aria-label="Call agent">
                  <Phone className="h-5 w-5" />
                </a>
              </Button>

              {whatsappLink && (
                <Button variant="outline" size="icon" className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl text-primary border-border hover:bg-accent touch-active" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
                    <MessageCircle className="h-5 w-5" />
                  </a>
                </Button>
              )}

              <Button 
                size="lg"
                className="flex-1 h-14 min-h-[56px] rounded-xl font-semibold text-base gap-2 bg-foreground hover:bg-foreground/90 text-background touch-active"
                onClick={isExpanded ? () => setIsExpanded(false) : () => setIsExpanded(true)}
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span>Close</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Download Info</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
