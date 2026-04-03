import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, CheckCircle, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email").max(255),
  brokerage_name: z.string().min(1, "Brokerage is required").max(200),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AgentWaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentWaitlistModal({ open, onOpenChange }: AgentWaitlistModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", brokerage_name: "", phone: "" },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("agent_waitlist").insert({
        name: data.name.trim(),
        email: data.email.trim(),
        brokerage_name: data.brokerage_name.trim(),
        phone: data.phone?.trim() || null,
      });

      if (error) {
        if (error.message.includes("duplicate")) {
          toast({ title: "You're already on the list!", description: "We'll be in touch soon." });
          setIsSubmitted(true);
          return;
        }
        throw error;
      }

      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Waitlist error:", err);
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    if (isSubmitted) {
      setTimeout(() => {
        setIsSubmitted(false);
        form.reset();
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 overflow-hidden border-0 shadow-2xl w-[calc(100%-2rem)] max-w-[480px] rounded-2xl">
        <VisuallyHidden>
          <DialogTitle>Join the Agent Waitlist</DialogTitle>
        </VisuallyHidden>

        {!isSubmitted ? (
          <div className="flex flex-col">
            {/* Header */}
            <div className="relative bg-foreground overflow-hidden px-6 pt-7 pb-6">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              <div className="inline-flex items-center gap-1.5 bg-primary/15 border border-primary/30 rounded-full px-3 py-1 mb-4">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Early Access</span>
              </div>
              <h2 className="text-[22px] sm:text-2xl font-extrabold text-background leading-[1.2] mb-2">
                Join the Agent Waitlist
              </h2>
              <p className="text-background/60 text-sm leading-relaxed">
                Be first to access floor plans, assignments, and exclusive tools when we launch.
              </p>
            </div>

            {/* Form */}
            <div className="px-6 py-5 bg-background">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <Input type="text" placeholder="Full Name" autoComplete="name" {...form.register("name")} className="h-11" />
                  {form.formState.errors.name && <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>}
                </div>
                <div>
                  <Input type="email" placeholder="Email Address" autoComplete="email" {...form.register("email")} className="h-11" />
                  {form.formState.errors.email && <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>}
                </div>
                <div>
                  <Input type="text" placeholder="Brokerage Name" autoComplete="organization" {...form.register("brokerage_name")} className="h-11" />
                  {form.formState.errors.brokerage_name && <p className="text-xs text-destructive mt-1">{form.formState.errors.brokerage_name.message}</p>}
                </div>
                <div>
                  <Input type="tel" placeholder="Phone (optional)" autoComplete="tel" {...form.register("phone")} className="h-11" />
                </div>
                <Button type="submit" className="w-full h-11 font-bold text-sm gap-2" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting…" : (
                    <>
                      Join the Waitlist
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
              <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Shield className="h-3 w-3 shrink-0" />
                <span>No spam. We'll notify you when we launch.</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="bg-foreground px-6 pt-7 pb-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/15 rounded-full mb-3">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-extrabold text-background mb-1">You're on the List! 🎉</h2>
                <p className="text-background/60 text-sm">We'll reach out as soon as early access opens.</p>
              </div>
            </div>
            <div className="px-6 py-5 bg-background text-center">
              <Button className="w-full" onClick={handleClose}>
                Continue Browsing
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
