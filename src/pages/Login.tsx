import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, Users } from "lucide-react";
import { MetaTags } from "@/components/seo/MetaTags";
import { formatPhoneNumber } from "@/lib/formatPhone";
import { lovable } from "@/integrations/lovable";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const teamSignupSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type TeamSignupFormData = z.infer<typeof teamSignupSchema>;

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const statusParam = searchParams.get("status");

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signOut } = useAuth();

  useEffect(() => {
    if (user) checkUserRoleAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkUserRoleAndRedirect = async () => {
    if (!user) return;

    // Developers have their own portal
    const { data: devProfile } = await supabase
      .from("developer_profiles")
      .select("verification_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (devProfile) {
      navigate("/developer");
      return;
    }

    // Check team member status — block pending/rejected
    let { data: teamProfile } = await (supabase as any)
      .from("team_member_profiles")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();

    // Check if they have an admin or agent role (full access bypasses approval)
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roleNames = (roles || []).map((r: any) => r.role);
    const hasFullAccess = roleNames.includes("admin") || roleNames.includes("agent");

    // First-time Google sign-up: auto-create a pending team_member_profile
    if (!teamProfile && !hasFullAccess) {
      const fullName =
        (user.user_metadata as any)?.full_name ||
        (user.user_metadata as any)?.name ||
        user.email?.split("@")[0] ||
        "Team Member";
      await (supabase as any).from("team_member_profiles").insert({
        user_id: user.id,
        full_name: fullName,
        email: user.email,
        status: "pending",
      });
      teamProfile = { status: "pending" };
    }

    if (teamProfile && teamProfile.status !== "approved" && !hasFullAccess) {
      await signOut();
      toast({
        title: teamProfile.status === "rejected" ? "Access denied" : "Pending approval",
        description:
          teamProfile.status === "rejected"
            ? "Your team access request was not approved. Please contact an administrator."
            : "Your account is awaiting admin approval. We'll notify you once you're approved.",
        variant: teamProfile.status === "rejected" ? "destructive" : "default",
      });
      return;
    }

    navigate("/dashboard");
  };

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const teamSignupForm = useForm<TeamSignupFormData>({
    resolver: zodResolver(teamSignupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Welcome back!", description: "You have successfully logged in." });
  };

  const handleTeamSignup = async (data: TeamSignupFormData) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/login`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: data.full_name.trim() },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create account");

      // Create pending team_member_profile
      const { error: profileError } = await (supabase as any)
        .from("team_member_profiles")
        .insert({
          user_id: authData.user.id,
          full_name: data.full_name.trim(),
          email: data.email.trim(),
          phone: data.phone || null,
          status: "pending",
        });
      if (profileError) throw profileError;

      // Sign out so they can't enter the dashboard until approved
      await signOut();

      setIsLoading(false);
      toast({
        title: "Request submitted!",
        description: "Your account is pending admin approval. You'll be notified once approved.",
      });
      teamSignupForm.reset();
      setActiveTab("login");
    } catch (error: any) {
      setIsLoading(false);
      let message = error.message;
      if (message?.includes("already registered")) {
        message = "This email is already registered. Please log in instead.";
      }
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/login`,
    });

    if (result.error) {
      setIsLoading(false);
      toast({
        title: "Google sign-in failed",
        description: result.error.message || "Please try again or use email/password.",
        variant: "destructive",
      });
      return;
    }

    if (result.redirected) {
      // Browser is redirecting to Google
      return;
    }
    // Tokens received — useEffect will pick up the user and route
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MetaTags
        title="Agent Portal Login | Presale Properties"
        description="Sign in to the Presale Properties agent portal — for internal team members only."
        url="https://presaleproperties.com/login"
        type="website"
      />
      <ConversionHeader />

      <main className="flex-1 py-12 md:py-20">
        <div className="container max-w-lg">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Agent Portal</CardTitle>
              <CardDescription>
                Internal portal for the Presale Properties team
              </CardDescription>
            </CardHeader>

            <CardContent>
              {statusParam === "pending" && (
                <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border text-sm">
                  Your account is pending admin approval.
                </div>
              )}

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">
                    <Users className="h-4 w-4 mr-2" />
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup">Join the Team</TabsTrigger>
                </TabsList>

                {/* Login */}
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="you@presaleproperties.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input placeholder="••••••••" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                      </Button>
                    </form>
                  </Form>

                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Continue with Google
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-6">
                    Are you a developer?{" "}
                    <Link to="/developer/login" className="text-primary underline">
                      Developer portal
                    </Link>
                  </p>
                </TabsContent>

                {/* Team self-signup */}
                <TabsContent value="signup">
                  <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Internal Team Access</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This portal is for Presale Properties team members. After signing up,
                          an admin will review and approve your access.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Form {...teamSignupForm}>
                    <form onSubmit={teamSignupForm.handleSubmit(handleTeamSignup)} className="space-y-4">
                      <FormField
                        control={teamSignupForm.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Sarb Singh" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={teamSignupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work Email *</FormLabel>
                            <FormControl>
                              <Input placeholder="you@presaleproperties.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={teamSignupForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="(604) 555-0123"
                                type="tel"
                                value={field.value}
                                onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={teamSignupForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password *</FormLabel>
                              <FormControl>
                                <Input placeholder="••••••••" type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={teamSignupForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password *</FormLabel>
                              <FormControl>
                                <Input placeholder="••••••••" type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Request Access
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        By requesting access, you agree to our Terms of Service and Privacy Policy.
                      </p>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
