import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Loader2, Shield, CheckCircle, Building2, Users } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const agentSignupSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  full_name: z.string().trim().min(2, "Please enter your full name").max(100),
  phone: z.string().trim().optional(),
  license_number: z.string().trim().min(3, "Please enter your real estate license number").max(50),
  brokerage_name: z.string().trim().min(2, "Please enter your brokerage name").max(100),
  brokerage_address: z.string().trim().max(200).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const developerSignupSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  company_name: z.string().trim().min(2, "Please enter your company name").max(100),
  contact_name: z.string().trim().min(2, "Please enter your name").max(100),
  phone: z.string().trim().optional(),
  website_url: z.string().trim().url("Please enter a valid URL").optional().or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type AgentSignupFormData = z.infer<typeof agentSignupSchema>;
type DeveloperSignupFormData = z.infer<typeof developerSignupSchema>;

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const initialType = searchParams.get("type") === "developer" ? "developer" : "agent";
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);
  const [userType, setUserType] = useState<"agent" | "developer">(initialType);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();

  useEffect(() => {
    if (user) {
      // Check user role and redirect accordingly
      checkUserRoleAndRedirect();
    }
  }, [user]);

  const checkUserRoleAndRedirect = async () => {
    if (!user) return;
    
    // Check if developer
    const { data: devProfile } = await supabase
      .from("developer_profiles")
      .select("verification_status")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (devProfile) {
      navigate("/developer");
      return;
    }
    
    // Check if agent
    const { data: agentProfile } = await (supabase as any)
      .from("agent_profiles")
      .select("verification_status")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (agentProfile) {
      navigate("/dashboard");
      return;
    }
    
    // Default to dashboard
    navigate("/dashboard");
  };

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const agentSignupForm = useForm<AgentSignupFormData>({
    resolver: zodResolver(agentSignupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      full_name: "",
      phone: "",
      license_number: "",
      brokerage_name: "",
      brokerage_address: "",
    },
  });

  const developerSignupForm = useForm<DeveloperSignupFormData>({
    resolver: zodResolver(developerSignupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      company_name: "",
      contact_name: "",
      phone: "",
      website_url: "",
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

    toast({
      title: "Welcome back!",
      description: "You have successfully logged in.",
    });
  };

  const handleAgentSignup = async (data: AgentSignupFormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, {
      full_name: data.full_name,
      phone: data.phone,
      license_number: data.license_number,
      brokerage_name: data.brokerage_name,
      brokerage_address: data.brokerage_address,
    });
    setIsLoading(false);

    if (error) {
      let message = error.message;
      if (message.includes("already registered")) {
        message = "This email is already registered. Please log in instead.";
      }
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Registration successful!",
      description: "Your account has been created. You can now access your dashboard.",
    });
    navigate("/dashboard");
  };

  const handleDeveloperSignup = async (data: DeveloperSignupFormData) => {
    setIsLoading(true);
    
    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: data.contact_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create account");

      // Create developer profile
      const { error: profileError } = await supabase
        .from("developer_profiles")
        .insert({
          user_id: authData.user.id,
          company_name: data.company_name,
          contact_name: data.contact_name,
          phone: data.phone || null,
          website_url: data.website_url || null,
          verification_status: "pending",
        });

      if (profileError) throw profileError;

      // Add developer role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "developer",
        });

      if (roleError) throw roleError;

      setIsLoading(false);
      toast({
        title: "Request submitted!",
        description: "Your developer account is pending approval. We'll review it within 1-2 business days.",
      });
      navigate("/developer");
    } catch (error: any) {
      setIsLoading(false);
      let message = error.message;
      if (message.includes("already registered")) {
        message = "This email is already registered. Please log in instead.";
      }
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ConversionHeader />
      
      <main className="flex-1 py-12 md:py-20">
        <div className="container max-w-lg">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">
                {userType === "agent" ? "Agent Portal" : "Developer Portal"}
              </CardTitle>
              <CardDescription>
                {userType === "agent" 
                  ? "Sign in or create an account to access project info"
                  : "Sign in or request access to share your projects"
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* User Type Toggle */}
              <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setUserType("agent")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    userType === "agent" 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  I'm an Agent
                </button>
                <button
                  onClick={() => setUserType("developer")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    userType === "developer" 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  I'm a Developer
                </button>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">
                    {userType === "agent" ? "Register" : "Request Access"}
                  </TabsTrigger>
                </TabsList>
                
                {/* Login Tab - Same for both */}
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
                              <Input placeholder="you@example.com" type="email" {...field} />
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
                </TabsContent>
                
                {/* Agent Signup */}
                {userType === "agent" && (
                  <TabsContent value="signup">
                    <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Agent Verification Required</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your license will be verified by our team before you can publish listings.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Form {...agentSignupForm}>
                      <form onSubmit={agentSignupForm.handleSubmit(handleAgentSignup)} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField
                            control={agentSignupForm.control}
                            name="full_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Sarah Chen" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={agentSignupForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input placeholder="(604) 555-0123" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={agentSignupForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input placeholder="you@example.com" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField
                            control={agentSignupForm.control}
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
                            control={agentSignupForm.control}
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
                        
                        <div className="pt-4 border-t border-border">
                          <p className="text-sm font-medium mb-4 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            License Information
                          </p>
                          
                          <FormField
                            control={agentSignupForm.control}
                            name="license_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Real Estate License Number *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. 12345678" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid sm:grid-cols-2 gap-4 mt-4">
                            <FormField
                              control={agentSignupForm.control}
                              name="brokerage_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Brokerage Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. RE/MAX" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={agentSignupForm.control}
                              name="brokerage_address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Brokerage Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Optional" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Create Agent Account
                        </Button>
                        
                        <p className="text-xs text-muted-foreground text-center mt-4">
                          By registering, you agree to our Terms of Service and Privacy Policy
                        </p>
                      </form>
                    </Form>
                  </TabsContent>
                )}
                
                {/* Developer Signup */}
                {userType === "developer" && (
                  <TabsContent value="signup">
                    <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Approval Required</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            We'll review your request within 1-2 business days.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Form {...developerSignupForm}>
                      <form onSubmit={developerSignupForm.handleSubmit(handleDeveloperSignup)} className="space-y-4">
                        <FormField
                          control={developerSignupForm.control}
                          name="company_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. ABC Developments" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField
                            control={developerSignupForm.control}
                            name="contact_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Your Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Smith" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={developerSignupForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input placeholder="(604) 555-0123" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={developerSignupForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input placeholder="you@company.com" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={developerSignupForm.control}
                          name="website_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://yourcompany.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField
                            control={developerSignupForm.control}
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
                            control={developerSignupForm.control}
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
                        
                        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Request Developer Access
                        </Button>
                        
                        <p className="text-xs text-muted-foreground text-center mt-4">
                          By registering, you agree to our Terms of Service and Privacy Policy
                        </p>
                      </form>
                    </Form>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
