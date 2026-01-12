import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Home, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid phone number required"),
  preferredCity: z.string().optional(),
  budgetRange: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const cities = [
  "Vancouver",
  "Burnaby",
  "Surrey",
  "Coquitlam",
  "Langley",
  "Delta",
  "Richmond",
  "Abbotsford",
  "Chilliwack",
  "Any Location"
];

const budgetRanges = [
  "Under $500K",
  "$500K - $750K",
  "$750K - $1M",
  "$1M - $1.5M",
  "$1.5M - $2M",
  "Over $2M"
];

interface NewHomesLeadCaptureProps {
  isOpen?: boolean;
}

export function NewHomesLeadCapture({ isOpen }: NewHomesLeadCaptureProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Get tracking data from localStorage/sessionStorage
      const visitorId = localStorage.getItem("pp_vid") || undefined;
      const sessionId = sessionStorage.getItem("pp_sid") || undefined;

      // Insert lead
      const { error } = await supabase.from("project_leads").insert({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        lead_source: "new_homes_page",
        landing_page: "/resale",
        message: `Preferred City: ${data.preferredCity || 'Any'}, Budget: ${data.budgetRange || 'Not specified'}`,
        visitor_id: visitorId,
        session_id: sessionId,
        persona: "buyer",
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("You're on the list! We'll be in touch soon.");
    } catch (error) {
      console.error("Lead submission error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section className="py-16 md:py-24 bg-foreground text-background">
        <div className="container px-4">
          <div className="max-w-xl mx-auto text-center">
            <div className="p-4 bg-primary/20 rounded-full w-fit mx-auto mb-6">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              You're on the List!
            </h2>
            <p className="text-background/80">
              We'll send you curated new home listings that match your preferences. Expect to hear from us within 24 hours.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="lead-capture" className="py-16 md:py-24 bg-foreground text-background">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left - Copy */}
            <div className="text-center md:text-left">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">
                Get Priority Access
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
                Get Access to All New Move-In-Ready Homes
              </h2>
              <p className="text-background/80 mb-6">
                Be the first to see new inventory before it hits the public market. Our team monitors developer releases daily.
              </p>
              
              <div className="space-y-3 text-sm text-background/70">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Curated listings matching your criteria</span>
                </div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Early access to new releases</span>
                </div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Expert guidance from a new-construction specialist</span>
                </div>
              </div>
            </div>

            {/* Right - Form */}
            <div className="bg-background text-foreground rounded-2xl p-6 md:p-8 shadow-xl">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      {...register("firstName")}
                      className="mt-1.5"
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      {...register("lastName")}
                      className="mt-1.5"
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    className="mt-1.5"
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...register("phone")}
                    className="mt-1.5"
                    placeholder="(604) 555-1234"
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium">Preferred Location</Label>
                  <Select onValueChange={(value) => setValue("preferredCity", value)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Budget Range</Label>
                  <Select onValueChange={(value) => setValue("budgetRange", value)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetRanges.map((range) => (
                        <SelectItem key={range} value={range}>
                          {range}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 bg-foreground text-background hover:bg-foreground/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Get Access"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By submitting, you agree to our{" "}
                  <a href="/privacy" className="underline hover:text-foreground">
                    Privacy Policy
                  </a>
                  . We respect your privacy and will never spam.
                </p>
              </form>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="mt-10 text-center">
            <p className="text-background/70 text-sm mb-3">
              Ready to start your search now?
            </p>
            <Button
              variant="outline"
              size="lg"
              className="border-background/30 text-background hover:bg-background/10"
              asChild
            >
              <a href="#book-call">
                <Calendar className="mr-2 h-4 w-4" />
                Book a New Home Strategy Call
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
