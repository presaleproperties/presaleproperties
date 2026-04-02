import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useVipAuth } from "@/hooks/useVipAuth";
import { Lock, ArrowRight, CheckCircle, Loader2, ShieldCheck, Phone, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  const d = digits.startsWith("1") && digits.length > 10 ? digits.slice(1) : digits;
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

export default function VipLoginPage() {
  const navigate = useNavigate();
  const { loginVip, isVipLoggedIn, vipPhone, logoutVip } = useVipAuth();
  const [step, setStep] = useState<"phone" | "code" | "success">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in
  if (isVipLoggedIn) {
    return (
      <>
        <Helmet>
          <title>VIP Access | Off-Market Inventory</title>
        </Helmet>
        <ConversionHeader />
        <main className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">VIP Access Active</CardTitle>
              <CardDescription>
                You're logged in as <span className="font-semibold text-foreground">{vipPhone}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => navigate("/off-market")}>
                Browse Off-Market Inventory
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="outline" className="w-full" onClick={() => { logoutVip(); toast.success("Logged out"); }}>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);

    // Normalize for lookup
    const normalized = digits.length === 10 ? `+1${digits}` : `+${digits}`;
    const d = digits.length >= 10 ? (digits.startsWith("1") ? digits.slice(1) : digits) : digits;
    const formatted = `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`;

    // Check if phone has any approved access (check multiple formats)
    const { data: accessData } = await supabase
      .from("off_market_access")
      .select("id")
      .eq("status", "approved")
      .in("phone", [normalized, digits, formatted, d])
      .limit(1)
      .maybeSingle();

    if (!accessData) {
      toast.error("No approved VIP access found for this phone number. Please request access first.");
      setLoading(false);
      return;
    }

    // Send SMS verification code via existing edge function
    const { error: sendError } = await supabase.functions.invoke("send-sms-otp", {
      body: { phone: normalized },
    });

    if (sendError) {
      console.error("SMS send error:", sendError);
      toast.error("Failed to send verification code. Please try again.");
      setLoading(false);
      return;
    }

    toast.success("Verification code sent via SMS!");
    setStep("code");
    setLoading(false);
  };

  const handleCodeVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);

    const digits = phone.replace(/\D/g, "");
    const normalized = digits.length === 10 ? `+1${digits}` : `+${digits}`;

    const { data, error } = await supabase.functions.invoke("verify-sms-otp", {
      body: { phone: normalized, code },
    });

    if (error || data?.error) {
      toast.error(data?.error || "Invalid or expired code. Please try again.");
      setCode("");
      setLoading(false);
      return;
    }

    loginVip(normalized);
    setStep("success");
    setLoading(false);
    toast.success("VIP access activated!");

    setTimeout(() => navigate("/off-market"), 1500);
  };

  const handleResend = async () => {
    const digits = phone.replace(/\D/g, "");
    const normalized = digits.length === 10 ? `+1${digits}` : `+${digits}`;
    setLoading(true);
    const { error } = await supabase.functions.invoke("send-sms-otp", {
      body: { phone: normalized },
    });
    if (error) {
      toast.error("Failed to resend code.");
    } else {
      toast.success("New code sent!");
      setCode("");
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>VIP Login | Off-Market Inventory</title>
        <meta name="description" content="Access exclusive off-market pre-construction inventory with your VIP credentials." />
      </Helmet>
      <ConversionHeader />
      <main className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">VIP Login</CardTitle>
            <CardDescription>
              {step === "phone" && "Enter the phone number you used to request off-market access."}
              {step === "code" && "Enter the 6-digit code sent to your phone."}
              {step === "success" && "Welcome back! Redirecting..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "phone" && (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vip-phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="vip-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(604) 555-0123"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
                      className="pl-10 text-[16px]"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Don't have access?{" "}
                  <a href="/off-market" className="text-primary font-medium hover:underline">
                    Request it here
                  </a>
                </p>
              </form>
            )}

            {step === "code" && (
              <div className="space-y-5">
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-muted-foreground">Code sent to <span className="font-medium text-foreground">{phone}</span></p>
                  <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
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
                <Button className="w-full" disabled={code.length !== 6 || loading} onClick={handleCodeVerify}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Verify & Login
                </Button>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => { setStep("phone"); setCode(""); }}
                  >
                    ← Change number
                  </button>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={handleResend}
                    disabled={loading}
                  >
                    <RefreshCw className="h-3 w-3" /> Resend
                  </button>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle className="h-12 w-12 text-emerald-500" />
                <p className="text-lg font-semibold">Access Granted!</p>
                <p className="text-sm text-muted-foreground">Redirecting to off-market inventory...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}
