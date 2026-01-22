import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, ArrowRight, Loader2, Mail, Shield } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const schema = z.object({
  buyerType: z.string().min(1, "Please select your situation"),
  timeline: z.string().min(1, "Please select your timeline"),
  name: z.string().min(2, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email").max(255, "Email must be less than 255 characters"),
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

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const budgetValue = watch("budget");

  const sendVerificationCode = async (data: FormData) => {
    setIsSendingOTP(true);
    try {
      const { data: response, error } = await supabase.functions.invoke("send-verification-code", {
        body: {
          email: data.email,
          name: data.name,
        },
      });

      if (error) {
        throw error;
      }

      if (response?.error) {
        throw new Error(response.error);
      }

      setFormData(data);
      setStep("verify");
      toast.success("Verification code sent to your email!");
    } catch (error: any) {
      console.error("Send code error:", error);
      if (error.message?.includes("rate limit")) {
        toast.error("Too many attempts. Please wait a minute and try again.");
      } else {
        toast.error(error.message || "Failed to send verification code. Please try again.");
      }
    } finally {
      setIsSendingOTP(false);
    }
  };

  const verifyCode = async () => {
    if (otpCode.length !== 6 || !formData) return;
    
    setIsSubmitting(true);
    try {
      const { data: response, error } = await supabase.functions.invoke("verify-email-code", {
        body: {
          email: formData.email,
          code: otpCode,
          userData: {
            name: formData.name,
            phone: formData.phone,
            buyerType: formData.buyerType,
            timeline: formData.timeline,
            budget: formData.budget,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (response?.error) {
        if (response.error.includes("expired") || response.error.includes("Invalid")) {
          toast.error(response.error);
          return;
        }
        throw new Error(response.error);
      }

      setStep("success");
      toast.success("Welcome to VIP! Your email has been verified.");
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || "Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendCode = async () => {
    if (!formData) return;
    setIsSendingOTP(true);
    try {
      const { data: response, error } = await supabase.functions.invoke("send-verification-code", {
        body: {
          email: formData.email,
          name: formData.name,
        },
      });

      if (error || response?.error) {
        throw new Error(response?.error || error?.message);
      }

      toast.success("New code sent to your email!");
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
            Your email has been verified. We'll review your profile and reach out within 24 hours 
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
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Verify Your Email
            </h2>
            <p className="text-muted-foreground">
              We sent a 6-digit code to <span className="font-medium text-foreground">{formData?.email}</span>
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
                onClick={verifyCode}
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
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={resendCode}
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
          <form onSubmit={handleSubmit(sendVerificationCode)} className="space-y-6">
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
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" {...register("phone")} placeholder="(604) 555-1234" />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Email (for verification)
                </Label>
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
              className="w-full"
              disabled={isSendingOTP}
            >
              {isSendingOTP ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Continue & Verify Email
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              We'll send a verification code to your email. 
              By joining, you agree to receive exclusive updates.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};
