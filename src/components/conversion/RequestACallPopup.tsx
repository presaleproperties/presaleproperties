import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, CheckCircle, Phone } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/lib/formatPhone";
import { upsertProjectLead } from "@/lib/upsertProjectLead";
import { useLeadSubmission } from "@/hooks/useLeadSubmission";
import { getVisitorId, getSessionId, trackFormStart, trackFormSubmit } from "@/lib/tracking";
import { MetaEvents } from "@/components/tracking/MetaPixel";

// ─── Trigger logic ──────────────────────────────────────────────────────
const PAGEVIEW_KEY = "pp_pageviews";
const SHOWN_KEY = "pp_request_call_shown";
const CONVERTED_KEY = "presale_lead_converted";
const EXIT_INTENT_SHOWN_KEY = "exit_intent_shown"; // sessionStorage key shared with ExitIntentPopup
const MIN_PAGEVIEWS = 3; // show on the 3rd page view in the session/visitor lifetime
const SHOW_DELAY_MS_DESKTOP = 1500;
const MOBILE_MIN_TIME_MS = 30000;   // mobile: at least 30s in session
const MOBILE_MIN_SCROLL_PCT = 0.5;  // …or 50% scroll depth, whichever comes first

// Routes where the popup should never appear (forms / portals / sensitive flows)
const BLOCKED_PATH_PREFIXES = [
  "/admin",
  "/dashboard",
  "/developer",
  "/buyer",
  "/login",
  "/auth",
  "/thank-you",
  "/deck/",
  "/lp/",
];

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .min(10, "Please enter a valid phone number")
    .max(20),
});

type FormData = z.infer<typeof schema>;

function shouldShowOnRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return !BLOCKED_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

export function RequestACallPopup() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formStarted, setFormStarted] = useState(false);
  const { toast } = useToast();
  const { submitLead } = useLeadSubmission();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  // ─── One-time trigger after N pageviews ───────────────────────────────
  useEffect(() => {
    try {
      // Already shown or already converted → never again
      if (localStorage.getItem(SHOWN_KEY) === "true") return;
      if (localStorage.getItem(CONVERTED_KEY) === "true") return;
      if (!shouldShowOnRoute(window.location.pathname)) return;

      const isMobile = window.innerWidth < 768 || "ontouchstart" in window;

      const current = parseInt(localStorage.getItem(PAGEVIEW_KEY) || "0", 10) + 1;
      localStorage.setItem(PAGEVIEW_KEY, String(current));

      if (current >= MIN_PAGEVIEWS) {
        const delay = isMobile ? SHOW_DELAY_MS_MOBILE : SHOW_DELAY_MS_DESKTOP;
        const t = setTimeout(() => {
          // Don't double-stack with the exit-intent popup in the same session
          try {
            if (sessionStorage.getItem(EXIT_INTENT_SHOWN_KEY) === "true") return;
          } catch {}
          setOpen(true);
          localStorage.setItem(SHOWN_KEY, "true");
          MetaEvents.formStart({
            content_name: "Request a Call Popup",
            content_category: "lead_magnet",
          });
        }, delay);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage may be blocked — silently skip
    }
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    form.setValue("phone", formatted, { shouldValidate: true });
  };

  const handleFormFocus = () => {
    if (!formStarted) {
      setFormStarted(true);
      trackFormStart({ form_name: "request_a_call", form_location: "global_popup" });
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
      const lastName = data.name.trim().split(" ").slice(1).join(" ");

      const leadId = await upsertProjectLead({
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        form_type: "callback_request",
        message: "Requested a callback via homepage popup",
        lead_source: "request_a_call_popup",
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
        lastName,
        email: data.email.trim(),
        phone: data.phone.trim(),
        formType: "callback_request",
        message: "Requested a callback via homepage popup",
        projectUrl: window.location.href,
      });

      trackFormSubmit({
        form_name: "request_a_call",
        form_location: "global_popup",
        email: data.email,
      });
      MetaEvents.lead({
        content_name: "Request a Call Popup",
        content_category: "lead_magnet",
      });

      localStorage.setItem(CONVERTED_KEY, "true");
      localStorage.setItem("pp_form_submitted", "true");
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("RequestACallPopup error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again or call us at (672) 258-1100.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-background border-0 shadow-2xl">
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {!isSubmitted ? (
          <div className="px-8 py-10 md:px-12 md:py-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">
                Request a call now
              </h2>
              <p className="text-base font-semibold text-muted-foreground">
                Our team will reach you within a minute
              </p>
            </div>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              onFocus={handleFormFocus}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name<span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  autoComplete="name"
                  {...form.register("name")}
                  className="h-12 text-base border-2"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email<span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  autoComplete="email"
                  {...form.register("email")}
                  className="h-12 text-base border-2"
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Number<span className="text-destructive">*</span>
                </label>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 px-3 h-12 border-2 border-input rounded-md bg-background shrink-0">
                    <span className="text-lg" aria-label="Canada">🇨🇦</span>
                    <span className="text-sm font-medium text-foreground">+1</span>
                  </div>
                  <Input
                    type="tel"
                    autoComplete="tel"
                    placeholder="(604) 555-0123"
                    {...form.register("phone")}
                    onChange={handlePhoneChange}
                    className="h-12 text-base border-2 flex-1"
                  />
                </div>
                {form.formState.errors.phone && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-12 font-bold text-base gap-2"
              >
                <Phone className="h-4 w-4" />
                {isSubmitting ? "Sending…" : "Call me"}
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                Note: This form is not for career enquiries.
              </p>
            </form>
          </div>
        ) : (
          <div className="px-8 py-12 md:px-12 md:py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-5">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-extrabold text-foreground mb-2">
              We&apos;ll call you shortly! 🎉
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              A presale specialist from our team will reach out within the next minute.
              Keep your phone handy.
            </p>
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              className="mt-6"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
