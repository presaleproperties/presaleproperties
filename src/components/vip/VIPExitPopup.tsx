import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Loader2, AlertTriangle, X } from "lucide-react";
import { getVisitorId } from "@/lib/tracking/identifiers";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type FormData = z.infer<typeof schema>;

export const VIPExitPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    // Only show on desktop
    if (window.innerWidth < 768) return;

    // Check if already shown this session
    const hasShown = sessionStorage.getItem("vip_exit_popup_shown");
    if (hasShown) return;

    let timeout: NodeJS.Timeout;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10) {
        timeout = setTimeout(() => {
          setIsOpen(true);
          sessionStorage.setItem("vip_exit_popup_shown", "true");
        }, 500);
      }
    };

    const handleMouseEnter = () => {
      if (timeout) clearTimeout(timeout);
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: data.email,
        source: "VIP Exit Popup",
        visitor_id: getVisitorId(),
      });

      if (error && !error.message.includes("duplicate")) throw error;

      setIsSubmitted(true);
      toast.success("You're in! Check your inbox for exclusive access.");
    } catch (error) {
      console.error("Popup form error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">You're In!</h3>
            <p className="text-muted-foreground">
              Watch your inbox for exclusive presale opportunities and your $1,500 credit details.
            </p>
          </div>
        ) : (
          <div className="p-8">
            <div className="text-center mb-6">
              <AlertTriangle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                WAIT - DON'T LEAVE WITHOUT YOUR $1,500 CREDIT
              </h3>
              <p className="text-muted-foreground">
                Join 400+ smart buyers getting:
              </p>
            </div>

            <ul className="space-y-2 mb-6">
              {[
                "$1,500 at closing (legal fees, tenant placement, or cash)",
                "Exclusive off-market inventory",
                "VIP pricing ($10K-$25K savings)",
                "Expert guidance (signing → completion)",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-foreground">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  {...register("email")}
                  className="h-12"
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary text-primary-foreground font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Claim My $1,500 Credit →"
                )}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" /> No cost
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" /> No catch
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" /> Instant access
              </span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="block w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4"
            >
              No thanks, I'll pay full price
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
