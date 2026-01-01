import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck, Lock, ArrowLeft, Mail, KeyRound } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const resetRequestSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});

const newPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type ResetRequestFormData = z.infer<typeof resetRequestSchema>;
type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

type ViewMode = "login" | "forgot" | "reset";

export default function AdminLogin() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const resetRequestForm = useForm<ResetRequestFormData>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: "" },
  });

  const newPasswordForm = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const type = searchParams.get("type");

    // Password reset callback
    if (type === "recovery") {
      setViewMode("reset");

      const initRecoverySession = async () => {
        try {
          // 1) PKCE flow (code in query)
          const url = new URL(window.location.href);
          const code = url.searchParams.get("code");
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
            if (error) throw error;
          }

          // 2) Implicit flow (tokens in hash)
          const hash = window.location.hash?.replace(/^#/, "") ?? "";
          const hashParams = new URLSearchParams(hash);
          const access_token = hashParams.get("access_token");
          const refresh_token = hashParams.get("refresh_token");
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
          }

          // Verify we actually have a session before allowing password update
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error("Reset link is invalid or expired. Please request a new one.");
          }
        } catch (err: any) {
          toast({
            title: "Reset link error",
            description: err?.message || "Reset link is invalid or expired. Please request a new one.",
            variant: "destructive",
          });
          setViewMode("forgot");
        } finally {
          setCheckingAuth(false);
        }
      };

      initRecoverySession();
      return;
    }

    // Check if already logged in as admin
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleData) {
          navigate("/admin");
          return;
        }
      }
      setCheckingAuth(false);
    };

    checkExistingSession();
  }, [navigate, searchParams, toast]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw new Error(authError.message || "Invalid email or password");
      }

      if (!authData.user) {
        throw new Error("Authentication failed");
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) {
        await supabase.auth.signOut();
        throw new Error("Failed to verify admin access");
      }

      if (!roleData) {
        await supabase.auth.signOut();
        throw new Error("Access denied. Admin privileges required.");
      }

      toast({
        title: "Welcome, Admin",
        description: "You have successfully logged in.",
      });
      
      navigate("/admin");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRequest = async (data: ResetRequestFormData) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/admin/login?type=recovery`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: "Reset email sent",
        description: "Check your inbox for the password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPassword = async (data: NewPasswordFormData) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully reset.",
      });
      
      setViewMode("login");
      // Clear the URL params
      navigate("/admin/login", { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Secure access for administrators only
          </p>
        </div>

        <Card className="shadow-xl border-border/50">
          {/* Login View */}
          {viewMode === "login" && (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl flex items-center justify-center gap-2">
                  <Lock className="h-5 w-5" />
                  Admin Login
                </CardTitle>
                <CardDescription>
                  Enter your admin credentials to continue
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="admin@example.com" 
                              type="email" 
                              autoComplete="email"
                              {...field} 
                            />
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
                          <div className="flex items-center justify-between">
                            <FormLabel>Password</FormLabel>
                            <Button
                              type="button"
                              variant="link"
                              className="px-0 h-auto text-xs text-muted-foreground"
                              onClick={() => setViewMode("forgot")}
                            >
                              Forgot password?
                            </Button>
                          </div>
                          <FormControl>
                            <Input 
                              placeholder="••••••••" 
                              type="password" 
                              autoComplete="current-password"
                              {...field} 
                            />
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

                <div className="mt-6 pt-6 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    This portal is restricted to authorized administrators.
                    <br />
                    Unauthorized access attempts are logged.
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* Forgot Password View */}
          {viewMode === "forgot" && (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl flex items-center justify-center gap-2">
                  <Mail className="h-5 w-5" />
                  Reset Password
                </CardTitle>
                <CardDescription>
                  {resetEmailSent 
                    ? "Check your email for the reset link"
                    : "Enter your email to receive a reset link"
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {resetEmailSent ? (
                  <div className="text-center space-y-4">
                    <div className="p-4 rounded-lg bg-primary/10">
                      <Mail className="h-12 w-12 mx-auto text-primary mb-3" />
                      <p className="text-sm">
                        We've sent a password reset link to your email.
                        Click the link to set a new password.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setViewMode("login");
                        setResetEmailSent(false);
                        resetRequestForm.reset();
                      }}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </div>
                ) : (
                  <Form {...resetRequestForm}>
                    <form onSubmit={resetRequestForm.handleSubmit(handleResetRequest)} className="space-y-4">
                      <FormField
                        control={resetRequestForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="admin@example.com" 
                                type="email" 
                                autoComplete="email"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Reset Link
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => setViewMode("login")}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </>
          )}

          {/* Set New Password View */}
          {viewMode === "reset" && (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl flex items-center justify-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  Set New Password
                </CardTitle>
                <CardDescription>
                  Enter your new password below
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...newPasswordForm}>
                  <form onSubmit={newPasswordForm.handleSubmit(handleNewPassword)} className="space-y-4">
                    <FormField
                      control={newPasswordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="••••••••" 
                              type="password" 
                              autoComplete="new-password"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newPasswordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="••••••••" 
                              type="password" 
                              autoComplete="new-password"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Password
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Looking for the agent portal?{" "}
          <a href="/login" className="text-primary hover:underline">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}