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
import { Loader2, ArrowLeft, CheckCircle2, Crown, Building2, Eye, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

const perks = [
  { icon: Building2, text: "Unlimited project & unit listings" },
  { icon: Eye, text: "Exposure to 12,000+ active buyers" },
  { icon: BarChart2, text: "Real-time views & analytics" },
  { icon: CheckCircle2, text: "Approved within 1–2 business days" },
];

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
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex flex-col justify-between bg-foreground text-background w-[440px] flex-shrink-0 p-10 relative overflow-hidden">
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.2),transparent_60%)]" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[radial-gradient(circle,hsl(var(--primary)/0.1),transparent_70%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>

        <div className="relative z-10">
          <div className="mb-10">
            <Logo size="sm" className="brightness-0 invert" />
          </div>
          <Badge variant="outline" className="mb-6 border-primary/40 text-primary bg-primary/10 text-xs">
            <Crown className="w-3 h-3 mr-1.5" />
            Free for Developers
          </Badge>
          <h2 className="text-3xl font-bold leading-snug mb-4">
            List your inventory.
            <span className="block text-gradient-gold">Reach buyers. Free.</span>
          </h2>
          <p className="text-background/50 leading-relaxed mb-10">
            Join developers across BC who use our platform to connect completed and near-completion units with thousands of active buyers and agents.
          </p>
          <div className="space-y-4">
            {perks.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-background/5 border border-background/10 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-background/80 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-background/30 mt-8">
          © {new Date().getFullYear()} Presale Properties Group
        </p>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Logo size="sm" />
          </div>

          <Link
            to="/developer-portal"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Developer Portal
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
            <p className="text-muted-foreground">Get your inventory in front of BC's top buyers — free</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input id="company_name" {...register("company_name")} placeholder="ABC Developments Inc." />
                {errors.company_name && <p className="text-destructive text-xs">{errors.company_name.message}</p>}
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="contact_name">Your Name *</Label>
                <Input id="contact_name" {...register("contact_name")} placeholder="John Smith" />
                {errors.contact_name && <p className="text-destructive text-xs">{errors.contact_name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register("email")} placeholder="john@company.com" />
                {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" type="tel" {...register("phone")} placeholder="604-555-0100" />
                {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" {...register("password")} placeholder="Minimum 8 characters" />
                {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="website_url">
                  Website <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input id="website_url" type="url" {...register("website_url")} placeholder="https://yourdevelopment.com" />
                {errors.website_url && <p className="text-destructive text-xs">{errors.website_url.message}</p>}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full font-bold py-3 text-base shadow-gold hover:shadow-gold-glow mt-2">
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
              <Link to="/privacy" className="underline">Privacy Policy</Link>.{" "}
              Your account will be reviewed within 1–2 business days.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
