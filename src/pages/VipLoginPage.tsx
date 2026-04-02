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
import { Lock, ArrowRight, CheckCircle, Loader2, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function VipLoginPage() {
  const navigate = useNavigate();
  const { loginVip, isVipLoggedIn, vipEmail, logoutVip } = useVipAuth();
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [email, setEmail] = useState("");
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
                You're logged in as <span className="font-semibold text-foreground">{vipEmail}</span>
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    // Check if email has any approved access
    const { data: accessData } = await supabase
      .from("off_market_access")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    if (!accessData) {
      toast.error("No approved VIP access found for this email. Please request access first.");
      setLoading(false);
      return;
    }

    // Send verification code via the existing edge function (it generates, stores, and emails the code)
    const { data: sendResult, error: sendError } = await supabase.functions.invoke("send-verification-code", {
      body: { email: email.toLowerCase().trim() },
    });

    if (sendError) {
      console.error("Verification send error:", sendError);
      toast.error("Failed to send verification code. Please try again.");
      setLoading(false);
      return;
    }

    toast.success("Verification code sent to your email!");
    setStep("code");
    setLoading(false);
  };

  const handleCodeVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);

    const { data: codeData } = await supabase
      .from("email_verification_codes")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("code", code)
      .is("verified_at", null)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!codeData) {
      toast.error("Invalid or expired code. Please try again.");
      setLoading(false);
      return;
    }

    // Mark code as verified
    await supabase
      .from("email_verification_codes")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", codeData.id);

    loginVip(email.toLowerCase().trim());
    setStep("success");
    setLoading(false);
    toast.success("VIP access activated!");

    // Redirect after brief delay
    setTimeout(() => navigate("/off-market"), 1500);
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
              {step === "email" && "Enter the email you used to request off-market access."}
              {step === "code" && "Enter the 6-digit code sent to your email."}
              {step === "success" && "Welcome back! Redirecting..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vip-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="vip-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
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
                  <p className="text-sm text-muted-foreground">Code sent to <span className="font-medium text-foreground">{email}</span></p>
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
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
                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => { setStep("email"); setCode(""); }}
                >
                  ← Use a different email
                </button>
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
