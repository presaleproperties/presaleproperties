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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { MetaTags } from "@/components/seo/MetaTags";
import { lovable } from "@/integrations/lovable";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const redirectParam = searchParams.get("redirect");

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signOut } = useAuth();

  useEffect(() => {
    if (user) checkUserRoleAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkUserRoleAndRedirect = async () => {
    if (!user) return;
    setIsLoading(true);

    // Developers have their own portal
    const { data: devProfile } = await supabase
      .from("developer_profiles")
      .select("verification_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (devProfile) {
      setIsLoading(false);
      navigate("/developer");
      return;
    }

    // Roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roleNames = (roles || []).map((r: any) => r.role);
    const hasFullAccess = roleNames.includes("admin") || roleNames.includes("agent");
    const isTeamMember = roleNames.includes("team_member");

    if (!hasFullAccess && !isTeamMember) {
      // Unknown user — must be invited by an admin
      await signOut();
      setIsLoading(false);
      toast({
        title: "Access denied",
        description: "Please try again with an invited Agent Portal account.",
        variant: "destructive",
      });
      return;
    }

    // First-login flow — force password change if flagged
    const mustChange = (user.user_metadata as any)?.must_change_password;
    if (mustChange) {
      setIsLoading(false);
      navigate("/change-password");
      return;
    }

    setIsLoading(false);
    if (isTeamMember && !roleNames.includes("admin")) {
      const teamRedirect = redirectParam?.startsWith("/team")
        ? redirectParam
        : redirectParam?.startsWith("/dashboard")
          ? redirectParam.replace(/^\/dashboard/, "/team")
          : "/team";
      navigate(teamRedirect);
      return;
    }
    navigate(redirectParam?.startsWith("/dashboard") ? redirectParam : "/dashboard");
  };

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
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

    if (result.redirected) return;
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
                Sign in with your Presale Properties team account
              </CardDescription>
            </CardHeader>

            <CardContent>
              {statusParam === "pending" && (
                <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border text-sm">
                  Your account is pending admin approval.
                </div>
              )}
              {statusParam === "access-denied" && (
                <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  Please sign in with an invited Agent Portal account to continue.
                </div>
              )}

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
                Access is by invitation only. Contact your admin if you need a login.
              </p>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Are you a developer?{" "}
                <Link to="/developer/login" className="text-primary underline">
                  Developer portal
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1s2.69-6.1 6-6.1c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.86 3.4 14.66 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12s4.26 9.5 9.5 9.5c5.48 0 9.1-3.85 9.1-9.27 0-.62-.07-1.1-.16-1.53H12z"/>
      <path fill="#4285F4" d="M21.1 12.23c0-.62-.07-1.1-.16-1.53H12v3.9h5.5c-.11.66-.71 1.97-2.04 2.85l-.02.13 2.96 2.29.21.02c1.88-1.74 2.49-4.27 2.49-7.66z"/>
      <path fill="#FBBC05" d="M6 14.36c-.2-.6-.32-1.24-.32-1.86s.12-1.26.31-1.86l-.01-.13-3-2.33-.1.05A9.46 9.46 0 0 0 2.5 12c0 1.55.37 3.01 1.04 4.31L6 14.36z"/>
      <path fill="#34A853" d="M12 21.5c2.7 0 4.97-.89 6.62-2.42l-3.16-2.44c-.84.59-1.97 1-3.46 1-2.66 0-4.92-1.74-5.72-4.16l-.12.01-3.05 2.36-.04.11C4.7 19.34 8.07 21.5 12 21.5z"/>
    </svg>
  );
}
