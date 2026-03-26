import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { Phone, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useBuyerAuth } from "@/hooks/useBuyerAuth";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";

type Step = "phone" | "verify" | "success";

const BuyerLogin = () => {
  const [step, setStep] = useState<Step>("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signInWithPhone, verifyOTP } = useBuyerAuth();

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handleSendCode = async () => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const phone = cleaned.startsWith("1") ? `+${cleaned}` : `+1${cleaned}`;
    setFormattedPhone(phone);

    const { error } = await signInWithPhone(phone);
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
      title: "Code sent!",
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
    const { error } = await verifyOTP(formattedPhone, otpCode);
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
    }, 1500);
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    const { error } = await signInWithPhone(formattedPhone);
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
        <title>Sign In | Presale Properties</title>
        <meta name="description" content="Sign in to your VIP account." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <ConversionHeader />

      <main className="min-h-screen bg-gradient-to-b from-muted/50 to-background py-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {step === "phone" && "Welcome Back"}
              {step === "verify" && "Enter Verification Code"}
              {step === "success" && "Signed In!"}
            </h1>
            <p className="text-muted-foreground">
              {step === "phone" && "Sign in with your phone number"}
              {step === "verify" && "Enter the 6-digit code sent to your phone"}
              {step === "success" && "Redirecting to your dashboard..."}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card border rounded-xl p-6 shadow-lg">
            {step === "phone" && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(604) 555-1234"
                      className="pl-10"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSendCode}
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
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
                    "Sign In"
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("phone")}
                    className="text-muted-foreground"
                  >
                    Change number
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
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
              </div>
            )}
          </div>

          {/* Signup Link */}
          {step === "phone" && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={() => navigate("/buyer/signup")}
              >
                Join VIP
              </Button>
            </p>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default BuyerLogin;
