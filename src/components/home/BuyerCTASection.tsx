import { useState } from "react";
import { ArrowRight, Sparkles, Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function BuyerCTASection() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("project_leads").insert({
        email: email.trim(),
        name: "Newsletter Signup",
        message: "Signed up for new project alerts from homepage",
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("You're on the list!");
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-foreground text-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="container px-4 relative">
        <div className="max-w-3xl mx-auto text-center space-y-6 md:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Exclusive Access
          </div>

          {/* Heading */}
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Get Early Access to New Presales
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-background/70 max-w-2xl mx-auto px-4">
              Be the first to know about new developments. Get exclusive pricing, floor plans, and VIP access before the public.
            </p>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-6 text-sm md:text-base text-background/80">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>New project alerts</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Exclusive pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>VIP access</span>
            </div>
          </div>

          {/* Form or Success */}
          {isSubmitted ? (
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 md:p-8 max-w-md mx-auto animate-fade-in">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-background">You're on the list!</h3>
                <p className="text-background/70 text-sm">
                  We'll notify you when new presale projects launch.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="pt-2">
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 sm:h-14 text-base bg-background/10 border-background/20 text-background placeholder:text-background/50 focus-visible:ring-primary rounded-xl flex-1"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="h-12 sm:h-14 px-6 sm:px-8 text-base font-semibold rounded-xl whitespace-nowrap"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Joining...
                    </span>
                  ) : (
                    <>
                      Get Early Access
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-background/50 mt-3">
                Free forever. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
