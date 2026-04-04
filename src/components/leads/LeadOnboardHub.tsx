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
import { Check, Copy, Eye, Loader2, Mail, Send, UserPlus, FileText, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmailTemplatePreviewDialog } from "./EmailTemplatePreviewDialog";

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

interface EmailTemplate {
  id: string;
  name: string;
  project_name: string;
  thumbnail_url: string | null;
  form_data: any;
}

/** Use subject line from form_data as the display name (matches Marketing Hub), fall back to DB name */
function getTemplateName(tpl: EmailTemplate): string {
  return tpl.form_data?.copy?.subjectLine || tpl.name;
}

export function LeadOnboardHub() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [decks, setDecks] = useState<PitchDeck[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Success state
  const [successData, setSuccessData] = useState<{
    deckUrl: string;
    leadName: string;
    leadId: string;
    leadEmail: string;
    templateId: string | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingTemplate, setSendingTemplate] = useState(false);
  const [templateSent, setTemplateSent] = useState(false);

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

  const fetchTemplates = async () => {
    const { data } = await (supabase as any)
      .from("campaign_templates")
      .select("id, name, project_name, thumbnail_url, form_data")
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) setTemplates(data);
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from("pitch_decks")
      .select("id, project_name, slug, hero_image_url, city, is_published")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .then(({ data }) => { if (data) setDecks(data); });
    fetchTemplates();

    const channel = supabase
      .channel("campaign_templates_changes")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "campaign_templates" },
        () => { fetchTemplates(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const getTemplatePreview = (t: EmailTemplate): string | null => {
    return t.thumbnail_url || t.form_data?.heroImage || null;
  };

  const selectedTemplate = templates.find(t => t.id === (successData?.templateId ?? selectedTemplateId));

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
          template_id: selectedTemplateId,
        } as any)
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Sync to Zapier/Lofty (non-blocking)
      const { error: syncError } = await supabase.functions.invoke(
        "sync-onboarded-lead",
        { body: { leadId: lead.id } }
      );
      if (syncError) console.error("Zapier sync error (non-blocking):", syncError);

      setSuccessData({
        deckUrl,
        leadName: `${values.first_name} ${values.last_name}`.trim(),
        leadId: lead.id,
        leadEmail: values.email.trim().toLowerCase(),
        templateId: selectedTemplateId,
      });
      form.reset();
      setSelectedDeckId(null);
      setSelectedTemplateId(null);
      setEmailSent(false);
      setTemplateSent(false);

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
    setTemplateSent(false);
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
      toast({ title: "Failed to send email", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendTemplateEmail = async () => {
    if (!successData?.leadId || !successData?.templateId) return;
    setSendingTemplate(true);
    try {
      const { error } = await supabase.functions.invoke("send-template-email", {
        body: { leadId: successData.leadId, templateId: successData.templateId },
      });
      if (error) throw error;
      setTemplateSent(true);
      setPreviewOpen(false);
      toast({ title: "Email sent!", description: `Template email sent to ${successData.leadName}.` });
    } catch (err: any) {
      toast({ title: "Failed to send email", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSendingTemplate(false);
    }
  };

  // ── Shared template card renderer ──
  const renderTemplateCard = (tpl: EmailTemplate, currentSelectedId: string | null, onSelect: (id: string | null) => void) => {
    const preview = getTemplatePreview(tpl);
    const isSelected = currentSelectedId === tpl.id;
    const displayName = getTemplateName(tpl);
    return (
      <button
        key={tpl.id}
        type="button"
        onClick={() => onSelect(isSelected ? null : tpl.id)}
        className={cn(
          "relative rounded-lg border-2 p-2.5 text-left transition-all hover:shadow-md",
          isMobile ? "flex items-center gap-3" : "flex flex-col",
          isSelected
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border hover:border-muted-foreground/30"
        )}
      >
        {preview ? (
          <img
            src={preview}
            alt={displayName}
            className={cn(
              "object-cover rounded",
              isMobile ? "w-14 h-14 shrink-0" : "w-full h-16"
            )}
          />
        ) : (
          <div className={cn(
            "rounded bg-muted flex items-center justify-center",
            isMobile ? "w-14 h-14 shrink-0" : "w-full h-16"
          )}>
            <FileText className="h-5 w-5 text-muted-foreground/40" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-xs sm:text-sm truncate">{displayName}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{tpl.project_name}</p>
        </div>
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
      </button>
    );
  };

  // ══════════════════════════════════════
  // ── SUCCESS STATE ──
  // ══════════════════════════════════════
  if (successData) {
    const successTemplate = successData.templateId
      ? templates.find(t => t.id === successData.templateId)
      : null;

    return (
      <div className="max-w-lg mx-auto space-y-4 sm:space-y-6 px-1">
        <Card>
          <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold">Client Onboarded</h2>
            <p className="text-muted-foreground text-sm">
              <span className="font-medium text-foreground">{successData.leadName}</span> has been saved and synced to Lofty.
            </p>

            {/* Deck link + send */}
            {successData.deckUrl && (
              <>
                <div className="space-y-2 text-left">
                  <Label className="text-xs sm:text-sm text-muted-foreground">Deck Link</Label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={successData.deckUrl} className="text-xs sm:text-sm" />
                    <Button size="icon" variant="outline" onClick={() => handleCopy(successData.deckUrl)} className="shrink-0">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleSendDeckEmail}
                  variant={emailSent ? "outline" : "secondary"}
                  className="w-full text-sm"
                  disabled={sendingEmail || emailSent}
                >
                  {sendingEmail ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : emailSent ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Presentation className="h-4 w-4 mr-2" />
                  )}
                  {emailSent ? "Deck Email Sent" : "Send Deck Email"}
                </Button>
              </>
            )}

            {/* Template email actions — only if a template was selected in the form */}
            {successTemplate && (
              <div className="space-y-3 text-left">
                <Label className="text-xs sm:text-sm text-muted-foreground">Email Template</Label>
                <div className={cn(
                  "rounded-lg border-2 border-primary bg-primary/5 p-3",
                  isMobile ? "flex items-center gap-3" : "flex items-center gap-3"
                )}>
                  {getTemplatePreview(successTemplate) ? (
                    <img
                      src={getTemplatePreview(successTemplate)!}
                      alt={successTemplate.name}
                      className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs sm:text-sm truncate">{successTemplate.name}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{successTemplate.project_name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPreviewOpen(true)}
                    variant="outline"
                    className="flex-1 text-sm"
                    size={isMobile ? "sm" : "default"}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    onClick={handleSendTemplateEmail}
                    variant={templateSent ? "outline" : "default"}
                    className="flex-1 text-sm"
                    disabled={sendingTemplate || templateSent}
                    size={isMobile ? "sm" : "default"}
                  >
                    {sendingTemplate ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : templateSent ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    {templateSent ? "Email Sent" : `Send to ${successData.leadName.split(" ")[0]}`}
                  </Button>
                </div>
              </div>
            )}

            <Button onClick={handleNewLead} variant="outline" className="mt-4 w-full text-sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Onboard Another Client
            </Button>
          </CardContent>
        </Card>

        {successTemplate && (
          <EmailTemplatePreviewDialog
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            templateName={successTemplate.name}
            formData={successTemplate.form_data}
            onSend={handleSendTemplateEmail}
            sending={sendingTemplate}
            sent={templateSent}
            recipientName={successData.leadName.split(" ")[0]}
          />
        )}
      </div>
    );
  }

  // ══════════════════════════════════════
  // ── FORM STATE ──
  // ══════════════════════════════════════
  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-1">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Onboard New Client</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
          Add a client, pick a deck &amp; email template, and sync to Lofty — all in one step.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* ── Contact Info ── */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">First Name *</FormLabel>
                      <FormControl><Input placeholder="John" className="text-[16px] sm:text-sm" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Last Name</FormLabel>
                      <FormControl><Input placeholder="Smith" className="text-[16px] sm:text-sm" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Email *</FormLabel>
                      <FormControl><Input type="email" placeholder="john@email.com" className="text-[16px] sm:text-sm" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Phone</FormLabel>
                      <FormControl><Input type="tel" placeholder="604-555-1234" className="text-[16px] sm:text-sm" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Lead Source *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-[16px] sm:text-sm"><SelectValue placeholder="Select source" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SOURCES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
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
                    <FormLabel className="text-xs sm:text-sm">Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any context about this lead..." rows={3} className="text-[16px] sm:text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── Deck Selector ── */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base">
                Pitch Deck <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {decks.length === 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground">No published decks yet.</p>
              ) : (
                <div className={cn(
                  "grid gap-2 sm:gap-3",
                  isMobile ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
                )}>
                  {decks.map((deck) => (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => setSelectedDeckId(selectedDeckId === deck.id ? null : deck.id)}
                      className={cn(
                        "relative rounded-lg border-2 p-2.5 sm:p-3 text-left transition-all hover:shadow-md",
                        isMobile ? "flex items-center gap-3" : "",
                        selectedDeckId === deck.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      {deck.hero_image_url && (
                        <img
                          src={deck.hero_image_url}
                          alt={deck.project_name}
                          className={cn(
                            "object-cover rounded",
                            isMobile ? "w-14 h-14 shrink-0" : "w-full h-16 sm:h-20 mb-2"
                          )}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{deck.project_name}</p>
                        {deck.city && <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{deck.city}</p>}
                      </div>
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

          {/* ── Email Template Selector (IN THE FORM) ── */}
          {templates.length > 0 && (
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-sm sm:text-base">
                  Email Template <span className="text-muted-foreground font-normal text-xs">(optional — sends after save)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={cn(
                  "grid gap-2 sm:gap-3",
                  isMobile ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
                )}>
                  {templates.map((tpl) => renderTemplateCard(tpl, selectedTemplateId, setSelectedTemplateId))}
                </div>

                {/* Inline preview button when a template is selected */}
                {selectedTemplateId && selectedTemplate && (
                  <Button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    variant="outline"
                    className="w-full text-sm"
                    size={isMobile ? "sm" : "default"}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview "{selectedTemplate.name}"
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Submit ── */}
          <div
            className="sticky bottom-0 bg-background/95 backdrop-blur-sm pb-4 pt-2 -mx-1 px-1 sm:static sm:bg-transparent sm:backdrop-blur-none sm:pb-0 sm:pt-0 sm:mx-0 sm:px-0"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <Button type="submit" size="lg" className="w-full text-sm sm:text-base" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {selectedTemplateId ? "Save & Send Email" : "Save & Sync to Lofty"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Preview dialog (usable from form state — preview only, no send) */}
      {selectedTemplate && (
        <EmailTemplatePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          templateName={selectedTemplate.name}
          formData={selectedTemplate.form_data}
          onSend={() => {}}
          sending={false}
          sent={false}
          showSendButton={false}
          recipientName={form.getValues("first_name") || undefined}
        />
      )}
    </div>
  );
}
