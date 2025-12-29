import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Loader2, Shield, CheckCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
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

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
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
    navigate("/dashboard");
  };

  const handleSignup = async (data: SignupFormData) => {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ConversionHeader />
      
      <main className="flex-1 py-12 md:py-20">
        <div className="container max-w-lg">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Agent Portal</CardTitle>
              <CardDescription>
                Sign in or create an account to manage your assignment listings
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Register</TabsTrigger>
                </TabsList>
                
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
                  
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={signupForm.control}
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
                          control={signupForm.control}
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
                        control={signupForm.control}
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
                          control={signupForm.control}
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
                          control={signupForm.control}
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
                          control={signupForm.control}
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
                            control={signupForm.control}
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
                            control={signupForm.control}
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
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
