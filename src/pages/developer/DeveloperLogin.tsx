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
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

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
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between bg-foreground text-background w-[420px] flex-shrink-0 p-10">
        <div>
          <Logo size="sm" className="brightness-0 invert mb-12" />
          <h2 className="text-3xl font-bold leading-snug mb-4">
            Welcome back.<br />
            <span className="text-primary">Your inventory awaits.</span>
          </h2>
          <p className="text-background/50 leading-relaxed">
            Sign in to manage your projects, upload new units, and track buyer interest across your inventory.
          </p>
        </div>
        <div className="space-y-3">
          {[
            "Manage all your projects",
            "Track views and interest",
            "Respond to tour requests",
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
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Link to="/">
              <Logo className="h-7 w-auto" />
            </Link>
          </div>

          <Link to="/developer-portal" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Developer Portal
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-1">Sign in</h1>
          <p className="text-muted-foreground mb-8">Access your developer dashboard</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} placeholder="john@company.com" className="mt-1.5" />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} placeholder="Your password" className="mt-1.5" />
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full font-bold py-3 text-base">
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
