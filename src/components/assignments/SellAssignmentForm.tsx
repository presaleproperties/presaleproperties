import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { upsertProjectLead } from "@/lib/upsertProjectLead";
import { useLeadSubmission } from "@/hooks/useLeadSubmission";
import { useAppSetting } from "@/hooks/useAppSetting";
import { collectTrackingData } from "@/lib/collectTrackingData";

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const SellSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  phone: z.string().trim().min(14, "Enter a valid phone number").max(20),
  email: z.string().trim().email("Enter a valid email").max(255),
  projectName: z.string().trim().min(1, "Project / building name is required").max(200),
  unitType: z.enum(["Condo", "Townhouse", "Detached"], { required_error: "Choose unit type" }),
  contractPrice: z.coerce.number({ invalid_type_error: "Enter a number" }).positive("Must be > 0").max(50_000_000),
  completionDate: z.string().trim().min(1, "Expected completion is required"),
  reason: z.string().trim().max(2000).optional(),
  contactMethod: z.enum(["Call", "Text", "WhatsApp", "Email"], { required_error: "Pick a contact method" }),
});

type SellFormValues = z.infer<typeof SellSchema>;

export function SellAssignmentForm() {
  const { toast } = useToast();
  const { submitLead } = useLeadSubmission();
  const { data: whatsappSetting } = useAppSetting("whatsapp_number");
  const whatsappNumber = whatsappSetting ? String(whatsappSetting).replace(/"/g, "") : "16722581100";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<SellFormValues>({
    resolver: zodResolver(SellSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      projectName: "",
      contractPrice: undefined as any,
      completionDate: "",
      reason: "",
    },
  });

  const onSubmit = async (data: SellFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const tracking = collectTrackingData();
      const noteLines = [
        `Project / Building: ${data.projectName}`,
        `Unit type: ${data.unitType}`,
        `Contract price: $${data.contractPrice.toLocaleString()}`,
        `Expected completion: ${data.completionDate}`,
        `Best contact: ${data.contactMethod}`,
        data.reason ? `Reason for selling: ${data.reason}` : null,
      ].filter(Boolean).join("\n");

      const leadId = await upsertProjectLead({
        name: data.fullName,
        email: data.email.trim().toLowerCase(),
        phone: data.phone,
        message: noteLines,
        form_type: "sell_assignment",
        lead_source: "sell_assignment_page",
        persona: "assignment_seller",
        project_name: data.projectName,
        visitor_id: (() => { try { return localStorage.getItem("visitor_id"); } catch { return null; } })(),
        session_id: (() => { try { return sessionStorage.getItem("session_id"); } catch { return null; } })(),
        landing_page: tracking.landingPage,
        referrer: tracking.referrerUrl ?? null,
        utm_source: tracking.utmSource ?? null,
        utm_medium: tracking.utmMedium ?? null,
        utm_campaign: tracking.utmCampaign ?? null,
      });

      await submitLead({
        leadId,
        firstName: data.fullName.split(" ")[0],
        lastName: data.fullName.split(" ").slice(1).join(" "),
        email: data.email.trim().toLowerCase(),
        phone: data.phone,
        formType: "sell_assignment",
        projectName: data.projectName,
        message: noteLines,
        persona: "assignment_seller",
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error("[SellAssignmentForm]", err);
      setSubmitError(err?.message ?? "Something went wrong");
      toast({
        title: "Submission failed",
        description: "Please try again or text Uzair directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-5">
          <CheckCircle2 className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-3">Got it.</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Uzair will call you within 24 hours. Check your phone.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" {...form.register("fullName")} placeholder="Jane Smith" />
          {form.formState.errors.fullName && <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="(604) 555-1234"
            value={form.watch("phone") || ""}
            onChange={(e) => form.setValue("phone", formatPhone(e.target.value), { shouldValidate: true })}
          />
          {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register("email")} placeholder="you@email.com" />
          {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectName">Project / building name</Label>
          <Input id="projectName" {...form.register("projectName")} placeholder="e.g. Rail District, Eden" />
          {form.formState.errors.projectName && <p className="text-xs text-destructive">{form.formState.errors.projectName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitType">Unit type</Label>
          <Select onValueChange={(v) => form.setValue("unitType", v as any, { shouldValidate: true })} value={form.watch("unitType")}>
            <SelectTrigger id="unitType"><SelectValue placeholder="Choose unit type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Condo">Condo</SelectItem>
              <SelectItem value="Townhouse">Townhouse</SelectItem>
              <SelectItem value="Detached">Detached</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.unitType && <p className="text-xs text-destructive">{form.formState.errors.unitType.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractPrice">Contract purchase price (CAD)</Label>
          <Input
            id="contractPrice"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            {...form.register("contractPrice", { valueAsNumber: true })}
            placeholder="650000"
          />
          {form.formState.errors.contractPrice && <p className="text-xs text-destructive">{form.formState.errors.contractPrice.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="completionDate">Expected completion (month / year)</Label>
          <Input id="completionDate" type="month" {...form.register("completionDate")} />
          {form.formState.errors.completionDate && <p className="text-xs text-destructive">{form.formState.errors.completionDate.message}</p>}
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="reason">Why are you selling? <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Textarea id="reason" rows={3} {...form.register("reason")} placeholder="A short note helps us prepare." />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label>Best way to reach you?</Label>
          <RadioGroup
            value={form.watch("contactMethod")}
            onValueChange={(v) => form.setValue("contactMethod", v as any, { shouldValidate: true })}
            className="flex flex-wrap gap-4"
          >
            {(["Call", "Text", "WhatsApp", "Email"] as const).map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem id={`cm-${opt}`} value={opt} />
                <Label htmlFor={`cm-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
          {form.formState.errors.contactMethod && <p className="text-xs text-destructive">{form.formState.errors.contactMethod.message}</p>}
        </div>
      </div>

      {submitError && (
        <p className="text-sm text-destructive">
          Something went wrong — text Uzair directly at{" "}
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi Uzair — I'd like to sell my presale assignment.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold inline-flex items-center gap-1"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>.
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto font-semibold">
        {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</> : "Send — Get My Free Valuation"}
      </Button>
      <p className="text-xs text-muted-foreground">
        By submitting, you agree to be contacted about your assignment. No spam — single point of contact.
      </p>
    </form>
  );
}
