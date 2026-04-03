import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Check, Copy, Loader2, Mail, Send, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().max(100).default(""),
  email: z.string().email("Valid email required").max(255),
  phone: z.string().max(30).default(""),
  source: z.string().min(1, "Source is required"),
  notes: z.string().max(2000).default(""),
});

type FormValues = z.infer<typeof formSchema>;

const SOURCES = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
];

interface PitchDeck {
  id: string;
  project_name: string;
  slug: string;
  hero_image_url: string | null;
  city: string | null;
  is_published: boolean;
}

export function LeadOnboardHub() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<PitchDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ deckUrl: string; leadName: string; leadId: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      source: "referral",
      notes: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("pitch_decks")
      .select("id, project_name, slug, hero_image_url, city, is_published")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        if (data) setDecks(data);
      });
  }, [user]);

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setSubmitting(true);

    try {
      const selectedDeck = decks.find((d) => d.id === selectedDeckId);
      const deckUrl = selectedDeck
        ? `https://presaleproperties.com/deck/${selectedDeck.slug}`
        : "";

      // 1. Insert into onboarded_leads
      const { data: lead, error: insertError } = await supabase
        .from("onboarded_leads")
        .insert({
          user_id: user.id,
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          email: values.email.trim().toLowerCase(),
          phone: values.phone.trim(),
          source: values.source,
          notes: values.notes.trim(),
          deck_id: selectedDeckId,
          deck_url: deckUrl,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // 2. Fire edge function to sync to Zapier/Lofty
      const { error: syncError } = await supabase.functions.invoke(
        "sync-onboarded-lead",
        { body: { leadId: lead.id } }
      );

      if (syncError) {
        console.error("Zapier sync error (non-blocking):", syncError);
      }

      setSuccessData({ deckUrl, leadName: `${values.first_name} ${values.last_name}`.trim(), leadId: lead.id });
      form.reset();
      setSelectedDeckId(null);
      setEmailSent(false);

      toast({
        title: "Client onboarded!",
        description: `${values.first_name} has been saved and synced to Lofty.`,
      });
    } catch (err: any) {
      console.error("Onboard error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to onboard client",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewLead = () => {
    setSuccessData(null);
    setEmailSent(false);
  };

  const handleSendDeckEmail = async () => {
    if (!successData?.leadId) return;
    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke("send-deck-email", {
        body: { leadId: successData.leadId },
      });
      if (error) throw error;
      setEmailSent(true);
      toast({ title: "Email sent!", description: `Pitch deck email sent to ${successData.leadName}.` });
    } catch (err: any) {
      console.error("Send deck email error:", err);
      toast({ title: "Failed to send email", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  // Success state
  if (successData) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Client Onboarded</h2>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{successData.leadName}</span> has been saved and synced to Lofty.
            </p>

            {successData.deckUrl && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Deck Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={successData.deckUrl}
                    className="text-sm"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleCopy(successData.deckUrl)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {successData.deckUrl && (
              <Button
                onClick={handleSendDeckEmail}
                variant={emailSent ? "outline" : "secondary"}
                className="w-full"
                disabled={sendingEmail || emailSent}
              >
                {sendingEmail ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : emailSent ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                {emailSent ? "Email Sent" : "Send Deck Email"}
              </Button>
            )}

            <Button onClick={handleNewLead} className="mt-4 w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              Onboard Another Client
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Onboard New Client</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add a client, pick a deck, and sync to Lofty — all in one step.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="604-555-1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Source *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SOURCES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any context about this lead..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Deck Selector */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">
                Select Pitch Deck{" "}
                <span className="text-muted-foreground font-normal text-sm">(optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {decks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No published decks yet. Create one in the Decks tab.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {decks.map((deck) => (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() =>
                        setSelectedDeckId(selectedDeckId === deck.id ? null : deck.id)
                      }
                      className={cn(
                        "relative rounded-lg border-2 p-3 text-left transition-all hover:shadow-md",
                        selectedDeckId === deck.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      {deck.hero_image_url && (
                        <img
                          src={deck.hero_image_url}
                          alt={deck.project_name}
                          className="w-full h-16 sm:h-20 object-cover rounded mb-2"
                        />
                      )}
                      <p className="font-medium text-sm truncate">{deck.project_name}</p>
                      {deck.city && (
                        <p className="text-xs text-muted-foreground truncate">{deck.city}</p>
                      )}
                      {selectedDeckId === deck.id && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Save & Sync to Lofty
          </Button>
        </form>
      </Form>
    </div>
  );
}
