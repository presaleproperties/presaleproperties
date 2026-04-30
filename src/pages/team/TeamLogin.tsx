import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { formatPhoneNumber } from "@/lib/formatPhone";

export default function TeamLogin() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // If already logged in, redirect
  useEffect(() => {
    if (user) navigate("/team", { replace: true });
  }, [user, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(loginEmail.trim(), loginPassword);
    setLoading(false);
    if (error) {
      toast.error(error.message || "Login failed");
      return;
    }
    navigate("/team", { replace: true });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    const redirectUrl = `${window.location.origin}/team/login`;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName.trim() },
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message || "Signup failed");
      return;
    }

    // Create pending team_member_profile (RLS allows insert by self)
    if (data.user) {
      await (supabase as any).from("team_member_profiles").insert({
        user_id: data.user.id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone || null,
        status: "pending",
      });
    }

    setLoading(false);
    toast.success("Account created! An admin will review your request shortly.");
    setMode("login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              Team<span className="text-primary">Hub</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Internal portal for Presale Properties team members</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 mb-5">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Request Access</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="login-pass">Password</Label>
                  <Input id="login-pass" type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-3">
                <div>
                  <Label htmlFor="su-name">Full name *</Label>
                  <Input id="su-name" required value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="su-email">Email *</Label>
                  <Input id="su-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="su-phone">Phone</Label>
                  <Input id="su-phone" type="tel" value={phone} onChange={e => setPhone(formatPhoneNumber(e.target.value))} placeholder="(604) 555-1234" />
                </div>
                <div>
                  <Label htmlFor="su-pass">Password *</Label>
                  <Input id="su-pass" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Your account will be reviewed by an admin before activation.
                </p>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Request Access
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
