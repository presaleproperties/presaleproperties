import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-[#F9F8F5] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[#1A1A2E] text-white w-[420px] flex-shrink-0 p-10">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <Building2 className="h-6 w-6 text-[#C8A951]" />
            <span className="font-semibold text-lg">Developer Portal</span>
          </div>
          <h2 className="text-3xl font-bold leading-snug mb-4">
            Welcome back.<br />
            <span className="text-[#C8A951]">Your inventory awaits.</span>
          </h2>
          <p className="text-white/50 leading-relaxed">
            Sign in to manage your projects, upload new units, and track buyer interest across your inventory.
          </p>
        </div>
        <div className="space-y-3 text-sm text-white/40">
          <p>✓ Manage all your projects</p>
          <p>✓ Track views and interest</p>
          <p>✓ Respond to tour requests</p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Building2 className="h-5 w-5 text-[#C8A951]" />
            <span className="font-semibold text-[#1A1A2E]">Developer Portal</span>
          </div>

          <Link to="/developer-portal" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1F2937] mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <h1 className="text-2xl font-bold text-[#1F2937] mb-1">Sign in</h1>
          <p className="text-[#6B7280] mb-8">Access your developer dashboard</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-[#1F2937]">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="john@company.com"
                className="mt-1.5"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password" className="text-[#1F2937]">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Your password"
                className="mt-1.5"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C8A951] hover:bg-[#b8993f] text-[#1A1A2E] font-bold py-3 rounded-lg text-base"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              Sign In
            </Button>

            <p className="text-center text-sm text-[#6B7280]">
              Don't have an account?{" "}
              <Link to="/developer/signup" className="text-[#C8A951] font-medium hover:underline">
                Create one free
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
