import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useVipAuth } from "@/hooks/useVipAuth";
import { Lock, ArrowRight, CheckCircle, Loader2, ShieldCheck, Mail, Eye, EyeOff, User, Phone } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPhoneNumber } from "@/lib/formatPhone";

export default function VipLoginPage() {
  const navigate = useNavigate();
  const { loginVip, signUpVip, isVipLoggedIn, vipEmail, logoutVip } = useVipAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Signup extra fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasAgent, setHasAgent] = useState("no");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");

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
              <Button className="w-full" onClick={() => navigate("/vip")}>
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);

    const result = await loginVip(email.trim(), password);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Welcome back!");
      navigate("/off-market");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !password) return;
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);

    const result = await signUpVip(email.trim(), password, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      hasAgent: hasAgent === "yes",
      budgetRange: budget || null,
      timeline: timeline || null,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Account created! Welcome to VIP access.");
      navigate("/off-market");
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
              Access exclusive off-market pre-construction inventory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email or Phone</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="text"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 text-[16px]"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10 text-[16px]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Don't have access?{" "}
                    <a href="/off-market" className="text-primary font-medium hover:underline">
                      Request it here
                    </a>
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-first">First Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-first"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="pl-10 text-[16px]"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-last">Last Name *</Label>
                      <Input
                        id="signup-last"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="text-[16px]"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 text-[16px]"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Must match the email used in your VIP access request.</p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-phone">Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-phone"
                        inputMode="numeric"
                        placeholder="(604) 555-1234"
                        value={phone}
                        onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                        className="pl-10 text-[16px]"
                        required
                      />
                    </div>
                  </div>

                  {/* Realtor question */}
                  <div className="space-y-1.5">
                    <Label>Are you currently working with a realtor?</Label>
                    <RadioGroup value={hasAgent} onValueChange={setHasAgent} className="flex gap-6 mt-1">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="yes" id="agent-yes" />
                        <Label htmlFor="agent-yes" className="cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="no" id="agent-no" />
                        <Label htmlFor="agent-no" className="cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Budget */}
                  <div className="space-y-1.5">
                    <Label>Budget Range</Label>
                    <Select value={budget} onValueChange={setBudget}>
                      <SelectTrigger className="h-11 text-[16px]"><SelectValue placeholder="Select budget" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Under $400K">Under $400K</SelectItem>
                        <SelectItem value="$400K-$500K">$400K - $500K</SelectItem>
                        <SelectItem value="$500K-$750K">$500K - $750K</SelectItem>
                        <SelectItem value="$750K-$1M">$750K - $1M</SelectItem>
                        <SelectItem value="$1M-$1.5M">$1M - $1.5M</SelectItem>
                        <SelectItem value="$1.5M+">$1.5M+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-1.5">
                    <Label>Timeline</Label>
                    <Select value={timeline} onValueChange={setTimeline}>
                      <SelectTrigger className="h-11 text-[16px]"><SelectValue placeholder="Select timeline" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ready now">Ready now</SelectItem>
                        <SelectItem value="3-6 months">3-6 months</SelectItem>
                        <SelectItem value="6-12 months">6-12 months</SelectItem>
                        <SelectItem value="Just exploring">Just exploring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">Create Password *</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10 text-[16px]"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Account
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Only approved VIP members can create an account.{" "}
                    <a href="/off-market" className="text-primary font-medium hover:underline">
                      Request access
                    </a>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}
