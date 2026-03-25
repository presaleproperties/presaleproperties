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
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Crown, Building2, Eye, BarChart2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

const perks = [
  { icon: Building2, text: "Manage all your projects" },
  { icon: Eye, text: "Track views and buyer interest" },
  { icon: BarChart2, text: "See analytics in real-time" },
  { icon: CheckCircle2, text: "Respond to tour requests" },
];

export default function DeveloperLogin() {
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
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      navigate("/developer");
    } catch (err: any) {
      toast.error(err.message || "Login failed. Please check your credentials.");
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
            Developer Portal
          </Badge>
          <h2 className="text-3xl font-bold leading-snug mb-4">
            Welcome back.
            <span className="block text-gradient-gold">Your inventory awaits.</span>
          </h2>
          <p className="text-background/50 leading-relaxed mb-10">
            Sign in to manage your projects, upload new units, and track buyer interest across your inventory.
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
        <div className="w-full max-w-sm">
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
            <h1 className="text-2xl font-bold text-foreground mb-1">Sign in</h1>
            <p className="text-muted-foreground">Access your developer dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} placeholder="john@company.com" />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} placeholder="Your password" />
              {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3 text-base shadow-gold hover:shadow-gold-glow mt-2"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
              Sign In
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/developer/signup" className="text-primary font-medium hover:underline">
                Create one free
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
