import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Loader2, CheckCircle } from "lucide-react";
import { getUtmDataForSubmission } from "@/hooks/useUtmTracking";

const CITIES = [
  "Any City",
  "Vancouver",
  "Burnaby",
  "Richmond",
  "Surrey",
  "Coquitlam",
  "North Vancouver",
  "Langley",
  "Delta",
  "Abbotsford",
];

const PRICE_RANGES = [
  { value: "any", label: "Any Budget" },
  { value: "under-500k", label: "Under $500K" },
  { value: "500k-750k", label: "$500K - $750K" },
  { value: "750k-1m", label: "$750K - $1M" },
  { value: "1m-1.5m", label: "$1M - $1.5M" },
  { value: "over-1.5m", label: "$1.5M+" },
];

const formSchema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255),
  city: z.string().optional(),
  priceRange: z.string().optional(),
  wantsAssignments: z.boolean().default(true),
  wantsProjects: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface NewsletterSignupProps {
  variant?: "inline" | "card";
  source?: string;
}

export function NewsletterSignup({ variant = "card", source = "homepage" }: NewsletterSignupProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      city: "Any City",
      priceRange: "any",
      wantsAssignments: true,
      wantsProjects: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Get UTM tracking data
      const utmData = getUtmDataForSubmission();

      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: data.email,
        preferred_city: data.city === "Any City" ? null : data.city,
        price_range: data.priceRange === "any" ? null : data.priceRange,
        wants_assignments: data.wantsAssignments,
        wants_projects: data.wantsProjects,
        source,
        utm_source: utmData.utm_source,
        utm_medium: utmData.utm_medium,
        utm_campaign: utmData.utm_campaign,
        referrer: utmData.referrer,
        landing_page: utmData.landing_page,
      });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation - email already exists
          toast({
            title: "Already subscribed",
            description: "This email is already on our list. We'll keep you updated!",
          });
          setIsSubmitted(true);
          return;
        }
        throw error;
      }

      // Also send to Zapier/Lofty CRM via project_lead
      const leadId = crypto.randomUUID();
      await supabase.from("project_leads").insert({
        id: leadId,
        name: "Newsletter Subscriber",
        email: data.email,
        lead_source: source === "homepage" ? "newsletter_homepage" : `newsletter_${source}`,
        message: `Newsletter signup${data.city && data.city !== "Any City" ? ` — preferred city: ${data.city}` : ""}${data.priceRange && data.priceRange !== "any" ? `, budget: ${data.priceRange}` : ""}`,
        utm_source: utmData.utm_source,
        utm_medium: utmData.utm_medium,
        utm_campaign: utmData.utm_campaign,
        referrer: utmData.referrer,
        landing_page: utmData.landing_page,
      });
      // Fire and forget — don't block the success state
      supabase.functions.invoke("send-project-lead", { body: { leadId } }).catch(console.error);

      setIsSubmitted(true);
      toast({
        title: "You're subscribed!",
        description: "We'll notify you about new presale projects matching your preferences.",
      });
    } catch (error) {
      console.error("Error subscribing:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className={`${variant === "card" ? "bg-primary/5 border border-primary/20 rounded-xl p-6 md:p-8" : ""} text-center`}>
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">You're on the list!</h3>
        <p className="text-muted-foreground text-sm">
          We'll email you when new presale projects match your preferences.
        </p>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          className="flex-1"
          {...register("email")}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Alerts"}
        </Button>
      </form>
    );
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Get New Project Alerts</h3>
          <p className="text-sm text-muted-foreground">Be first to know about new presale projects</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Your email address"
            className="w-full"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            value={watch("city")}
            onValueChange={(v) => setValue("city", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={watch("priceRange")}
            onValueChange={(v) => setValue("priceRange", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Budget" />
            </SelectTrigger>
            <SelectContent>
              {PRICE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={watch("wantsProjects")}
              onCheckedChange={(checked) => setValue("wantsProjects", !!checked)}
            />
            <span className="text-sm">New presale projects</span>
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Subscribing...
            </>
          ) : (
            "Subscribe to Alerts"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Unsubscribe anytime. We respect your privacy.
        </p>
      </form>
    </div>
  );
}
