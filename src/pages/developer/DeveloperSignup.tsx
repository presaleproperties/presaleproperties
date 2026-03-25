import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/Logo";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  company_name: z.string().min(2, "Company name is required"),
  contact_name: z.string().min(2, "Your name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  website_url: z.string().url("Enter a valid URL (include https://)").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export default function DeveloperSignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/developer`,
          data: { full_name: data.contact_name },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed — no user returned.");

      const { error: profileError } = await supabase
        .from("developer_profiles")
        .insert({
          user_id: authData.user.id,
          company_name: data.company_name,
          contact_name: data.contact_name,
          phone: data.phone,
          website_url: data.website_url || null,
          verification_status: "pending",
        });

      if (profileError) throw profileError;

      toast.success("Account created! Please check your email to confirm, then sign in.");
      navigate("/developer/login");
    } catch (err: any) {
      toast.error(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between bg-foreground text-background w-[420px] flex-shrink-0 p-10">
        <div>
          <Link to="/" className="block mb-12">
            <Logo className="h-8 w-auto brightness-0 invert" />
          </Link>
          <h2 className="text-3xl font-bold leading-snug mb-4">
            List your inventory.<br />
            <span className="text-primary">Reach buyers. Free.</span>
          </h2>
          <p className="text-background/50 leading-relaxed">
            Join developers across BC who use our platform to connect their completed and near-completion units with thousands of active buyers and agents.
          </p>
        </div>
        <div className="space-y-3">
          {[
            "Always free to list",
            "Approved within 1–2 business days",
            "Exposure to 12,000+ active buyers",
          ].map((t) => (
            <div key={t} className="flex items-center gap-2.5 text-sm text-background/60">
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/">
              <Logo className="h-7 w-auto" />
            </Link>
          </div>

          <Link to="/developer-portal" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Developer Portal
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
          <p className="text-muted-foreground mb-8">Get your inventory in front of BC's top buyers</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input id="company_name" {...register("company_name")} placeholder="ABC Developments Inc." className="mt-1.5" />
                {errors.company_name && <p className="text-destructive text-xs mt-1">{errors.company_name.message}</p>}
              </div>

              <div className="col-span-2">
                <Label htmlFor="contact_name">Your Name *</Label>
                <Input id="contact_name" {...register("contact_name")} placeholder="John Smith" className="mt-1.5" />
                {errors.contact_name && <p className="text-destructive text-xs mt-1">{errors.contact_name.message}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register("email")} placeholder="john@company.com" className="mt-1.5" />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" type="tel" {...register("phone")} placeholder="604-555-0100" className="mt-1.5" />
                {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
              </div>

              <div className="col-span-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" {...register("password")} placeholder="Minimum 8 characters" className="mt-1.5" />
                {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div className="col-span-2">
                <Label htmlFor="website_url">
                  Website <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input id="website_url" type="url" {...register("website_url")} placeholder="https://yourdevelopment.com" className="mt-1.5" />
                {errors.website_url && <p className="text-destructive text-xs mt-1">{errors.website_url.message}</p>}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full font-bold py-3 text-base">
              {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
              Create Developer Account
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/developer/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>

            <p className="text-center text-xs text-muted-foreground">
              By signing up, you agree to our{" "}
              <Link to="/privacy" className="underline">Privacy Policy</Link>. Your account will be reviewed within 1–2 business days.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
