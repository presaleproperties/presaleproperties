import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, ArrowRight, Loader2, Phone, Shield } from "lucide-react";
import { getVisitorId, getSessionId } from "@/lib/tracking/identifiers";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const schema = z.object({
  buyerType: z.string().min(1, "Please select your situation"),
  timeline: z.string().min(1, "Please select your timeline"),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Phone number is required"),
  budget: z.string().min(1, "Please select a budget range"),
});

type FormData = z.infer<typeof schema>;

type FormStep = "details" | "verify" | "success";

export const VIPMembershipForm = () => {
  const [step, setStep] = useState<FormStep>("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [formData, setFormData] = useState<FormData | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const budgetValue = watch("budget");

  const formatPhoneForAuth = (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, "");
    // If starts with 1, assume it's already formatted
    if (digits.startsWith("1") && digits.length === 11) {
      return `+${digits}`;
    }
    // Otherwise assume it's a 10-digit North American number
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    return `+${digits}`;
  };

  const sendOTP = async (data: FormData) => {
    setIsSendingOTP(true);
    try {
      const formattedPhone = formatPhoneForAuth(data.phone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        if (error.message.includes("rate limit")) {
          toast.error("Too many attempts. Please wait a minute and try again.");
        } else {
          throw error;
        }
        return;
      }

      setFormData(data);
      setStep("verify");
      toast.success("Verification code sent to your phone!");
    } catch (error: any) {
      console.error("OTP send error:", error);
      toast.error(error.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsSendingOTP(false);
    }
  };

  const verifyOTP = async () => {
    if (otpCode.length !== 6 || !formData) return;
    
    setIsSubmitting(true);
    try {
      const formattedPhone = formatPhoneForAuth(formData.phone);
      
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otpCode,
        type: "sms",
      });

      if (verifyError) {
        if (verifyError.message.includes("expired")) {
          toast.error("Code expired. Please request a new one.");
        } else if (verifyError.message.includes("invalid")) {
          toast.error("Invalid code. Please check and try again.");
        } else {
          throw verifyError;
        }
        return;
      }

      // Phone verified - now submit the lead
      const leadId = crypto.randomUUID();
      const { error: leadError } = await supabase.from("project_leads").insert({
        id: leadId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        lead_source: "vip_membership",
        budget: formData.budget,
        persona: formData.buyerType,
        timeline: formData.timeline,
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
        landing_page: window.location.pathname,
        referrer: document.referrer || null,
        message: `VIP Membership (Phone Verified) | Type: ${formData.buyerType} | Timeline: ${formData.timeline}`,
      });

      if (leadError) throw leadError;

      // Check if buyer profile exists, if not create one
      if (authData.user) {
        const { data: existingProfile } = await supabase
          .from("buyer_profiles")
          .select("id")
          .eq("user_id", authData.user.id)
          .single();

        if (!existingProfile) {
          await supabase.from("buyer_profiles").insert({
            user_id: authData.user.id,
            email: formData.email,
            full_name: formData.name,
            phone: formData.phone,
            phone_verified: true,
            buyer_type: formData.buyerType,
            is_vip: true,
            vip_joined_at: new Date().toISOString(),
            budget_max: parseBudgetMax(formData.budget),
            timeline: formData.timeline,
          });

          // Send welcome email
          await supabase.functions.invoke("send-buyer-welcome", {
            body: {
              userId: authData.user.id,
              email: formData.email,
              fullName: formData.name,
              buyerType: formData.buyerType,
            },
          });
        }
      }

      // Sync to Zapier/Lofty
      await supabase.functions.invoke("send-project-lead", { body: { leadId } });

      setStep("success");
      toast.success("Welcome to VIP! Your phone has been verified.");
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || "Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseBudgetMax = (budget: string): number | null => {
    const budgetMap: Record<string, number> = {
      "under-500k": 500000,
      "500k-750k": 750000,
      "750k-1m": 1000000,
      "1m-1.5m": 1500000,
      "1.5m+": 2000000,
    };
    return budgetMap[budget] || null;
  };

  const resendOTP = async () => {
    if (!formData) return;
    setIsSendingOTP(true);
    try {
      const formattedPhone = formatPhoneForAuth(formData.phone);
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });
      if (error) throw error;
      toast.success("New code sent!");
      setOtpCode("");
    } catch (error: any) {
      toast.error("Failed to resend code. Please wait and try again.");
    } finally {
      setIsSendingOTP(false);
    }
  };

  if (step === "success") {
    return (
      <section id="membership-form" className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="max-w-[500px] mx-auto text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Welcome to VIP</h2>
          <p className="text-muted-foreground mb-6">
            Your phone has been verified. We'll review your profile and reach out within 24 hours 
            to discuss your goals and show you relevant opportunities.
          </p>
          <Button asChild variant="default">
            <a href="/buyer">Go to Your Dashboard</a>
          </Button>
        </div>
      </section>
    );
  }

  if (step === "verify") {
    return (
      <section id="membership-form" className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="max-w-[440px] mx-auto">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Verify Your Phone
            </h2>
            <p className="text-muted-foreground">
              We sent a 6-digit code to <span className="font-medium text-foreground">{formData?.phone}</span>
            </p>
          </div>

          <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-card">
            <div className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={verifyOTP}
                size="lg"
                className="w-full"
                disabled={otpCode.length !== 6 || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify & Join VIP
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Change number
                </button>
                <button
                  type="button"
                  onClick={resendOTP}
                  disabled={isSendingOTP}
                  className="text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  {isSendingOTP ? "Sending..." : "Resend code"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="membership-form" className="py-16 md:py-24 px-4 bg-muted/30">
      <div className="max-w-[600px] mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Join VIP Membership
          </h2>
          <p className="text-muted-foreground">
            Tell us about your goals and we'll connect you with relevant opportunities
          </p>
        </div>

        <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-card">
          <form onSubmit={handleSubmit(sendOTP)} className="space-y-6">
            {/* Buyer Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">I'm a...</Label>
              <RadioGroup
                onValueChange={(value) => setValue("buyerType", value)}
                className="grid grid-cols-2 gap-3"
              >
                {[
                  { value: "buyer", label: "First Time Buyer" },
                  { value: "investor", label: "Investor" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center justify-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value={option.value} className="sr-only" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
              {errors.buyerType && (
                <p className="text-sm text-destructive">{errors.buyerType.message}</p>
              )}
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Timeline</Label>
              <RadioGroup
                onValueChange={(value) => setValue("timeline", value)}
                className="grid grid-cols-3 gap-3"
              >
                {[
                  { value: "now", label: "Ready now" },
                  { value: "3-6", label: "3-6 months" },
                  { value: "6-12", label: "6-12 months" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center justify-center p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 text-center"
                  >
                    <RadioGroupItem value={option.value} className="sr-only" />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
              {errors.timeline && (
                <p className="text-sm text-destructive">{errors.timeline.message}</p>
              )}
            </div>

            {/* Contact Fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register("name")} placeholder="Your name" />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Phone (for verification)
                </Label>
                <Input id="phone" type="tel" {...register("phone")} placeholder="(604) 555-1234" />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} placeholder="you@example.com" />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget Range</Label>
                <select
                  id="budget"
                  value={budgetValue || ""}
                  onChange={(e) =>
                    setValue("budget", e.target.value, { shouldValidate: true, shouldDirty: true })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="" disabled>Select range</option>
                  <option value="under-500k">Under $500K</option>
                  <option value="500k-750k">$500K - $750K</option>
                  <option value="750k-1m">$750K - $1M</option>
                  <option value="1m-1.5m">$1M - $1.5M</option>
                  <option value="1.5m+">$1.5M+</option>
                </select>
                {errors.budget && (
                  <p className="text-sm text-destructive">{errors.budget.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary text-primary-foreground font-semibold"
              disabled={isSendingOTP}
            >
              {isSendingOTP ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Continue & Verify Phone
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              We'll send a verification code to your phone. 
              By joining, you agree to receive exclusive updates.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};
