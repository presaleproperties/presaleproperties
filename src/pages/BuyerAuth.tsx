import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Crown, Phone, ArrowRight, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useBuyerAuth } from "@/hooks/useBuyerAuth";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";

const signupSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  buyerType: z.enum(["first_time", "investor", "upgrader", "downsizer"]),
});

type SignupFormData = z.infer<typeof signupSchema>;

type Step = "signup" | "verify" | "success";

const BuyerAuth = () => {
  const [step, setStep] = useState<Step>("signup");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUpWithPhone, verifyOTP, signInWithPhone } = useBuyerAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      buyerType: "first_time",
    },
  });

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    
    // Format phone for Supabase (needs +1 for North American numbers)
    const cleanPhone = data.phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("1") ? `+${cleanPhone}` : `+1${cleanPhone}`;
    setPhoneNumber(formattedPhone);

    const { error } = await signUpWithPhone(
      formattedPhone,
      data.email,
      data.fullName,
      data.buyerType
    );

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Verification code sent!",
      description: "Check your phone for the 6-digit code.",
    });
    setStep("verify");
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await verifyOTP(phoneNumber, otpCode);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setStep("success");
    
    // Redirect after success
    setTimeout(() => {
      navigate("/buyer");
    }, 2000);
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    const { error } = await signInWithPhone(phoneNumber);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Code resent!",
      description: "Check your phone for the new code.",
    });
  };

  return (
    <>
      <Helmet>
        <title>Join VIP | Presale Properties</title>
        <meta
          name="description"
          content="Create your VIP account to access exclusive presale projects, save favorites, and receive personalized alerts."
        />
        <meta name="robots" content="noindex" />
      </Helmet>

      <ConversionHeader />

      <main className="min-h-screen bg-gradient-to-b from-muted/50 to-background py-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Crown className="w-4 h-4" />
              VIP Membership
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {step === "signup" && "Create Your VIP Account"}
              {step === "verify" && "Verify Your Phone"}
              {step === "success" && "Welcome to VIP!"}
            </h1>
            <p className="text-muted-foreground">
              {step === "signup" && "Get exclusive access to presales and your $1,500 closing credit"}
              {step === "verify" && "Enter the 6-digit code sent to your phone"}
              {step === "success" && "Your account has been created successfully"}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card border rounded-xl p-6 shadow-lg">
            {step === "signup" && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Full Name */}
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="John Smith"
                    {...register("fullName")}
                    className="mt-1.5"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...register("email")}
                    className="mt-1.5"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(604) 555-1234"
                      className="pl-10"
                      {...register("phone")}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setValue("phone", formatted);
                      }}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll send a verification code to this number
                  </p>
                </div>

                {/* Buyer Type */}
                <div>
                  <Label>I'm looking to...</Label>
                  <RadioGroup
                    defaultValue="first_time"
                    onValueChange={(val) => setValue("buyerType", val as SignupFormData["buyerType"])}
                    className="mt-2 grid grid-cols-2 gap-3"
                  >
                    {[
                      { value: "first_time", label: "Buy my first home" },
                      { value: "investor", label: "Build a portfolio" },
                      { value: "upgrader", label: "Upgrade my home" },
                      { value: "downsizer", label: "Downsize" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center">
                        <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                        <Label
                          htmlFor={option.value}
                          className="flex-1 cursor-pointer rounded-lg border-2 border-muted bg-popover p-3 text-center text-sm font-medium hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary transition-colors"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By continuing, you agree to receive SMS verification and marketing messages.
                </p>
              </form>
            )}

            {step === "verify" && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
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
                  onClick={handleVerifyOTP}
                  className="w-full"
                  size="lg"
                  disabled={isLoading || otpCode.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Create Account"
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("signup")}
                    className="text-muted-foreground"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-primary"
                  >
                    Resend code
                  </Button>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-lg font-semibold mb-2">You're a VIP now!</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Redirecting you to your dashboard...
                </p>
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
              </div>
            )}
          </div>

          {/* Login Link */}
          {step === "signup" && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={() => navigate("/buyer/login")}
              >
                Sign in
              </Button>
            </p>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default BuyerAuth;
