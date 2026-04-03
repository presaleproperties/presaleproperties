import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import {
  Presentation,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Loader2,
  Mail,
  Send,
  UserPlus,
  Pencil,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PitchDeck {
  id: string;
  project_name: string;
  slug: string;
  hero_image_url: string | null;
  city: string | null;
  is_published: boolean;
}

interface OnboardedLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: string;
  notes: string;
  deck_url: string;
  zapier_synced: boolean;
  created_at: string;
  pitch_decks: { project_name: string; slug: string } | null;
}

const SOURCE_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  website: "Website",
  referral: "Referral",
};

const SOURCES = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
];

const formSchema = z.object({
  first_name: z.string().min(1, "Required").max(100),
  last_name: z.string().max(100).default(""),
  email: z.string().email("Valid email required").max(255),
  phone: z.string().max(30).default(""),
  source: z.string().min(1, "Required"),
  notes: z.string().max(2000).default(""),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agentName, setAgentName] = useState("");
  const [decks, setDecks] = useState<PitchDeck[]>([]);
  const [leads, setLeads] = useState<OnboardedLead[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null);
  const [emailSentFor, setEmailSentFor] = useState<Set<string>>(new Set());
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [leadsLoading, setLeadsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { first_name: "", last_name: "", email: "", phone: "", source: "referral", notes: "" },
  });

  // Fetch all data in parallel
  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
      supabase.from("pitch_decks").select("id, project_name, slug, hero_image_url, city, is_published")
        .eq("is_published", true).order("updated_at", { ascending: false }).limit(10),
      supabase.from("onboarded_leads")
        .select("id, first_name, last_name, email, phone, source, notes, deck_url, zapier_synced, created_at, pitch_decks(project_name, slug)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15),
    ]).then(([profileRes, decksRes, leadsRes]) => {
      if (profileRes.data?.full_name) setAgentName(profileRes.data.full_name.split(" ")[0]);
      if (decksRes.data) setDecks(decksRes.data);
      if (leadsRes.data) setLeads(leadsRes.data as unknown as OnboardedLead[]);
      setLeadsLoading(false);
    });
  }, [user]);

  const handleCopy = async (slug: string) => {
    await navigator.clipboard.writeText(`https://presaleproperties.com/deck/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const selectedDeck = decks.find((d) => d.id === selectedDeckId);
      const deckUrl = selectedDeck ? `https://presaleproperties.com/deck/${selectedDeck.slug}` : "";

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
        .select("id, first_name, last_name, email, phone, source, notes, deck_url, zapier_synced, created_at, pitch_decks(project_name, slug)")
        .single();

      if (insertError) throw insertError;

      // Fire Zapier sync (non-blocking)
      supabase.functions.invoke("sync-onboarded-lead", { body: { leadId: lead.id } }).catch(console.error);

      // Add to leads list at top
      setLeads((prev) => [lead as unknown as OnboardedLead, ...prev]);

      toast({ title: "Client onboarded!", description: `${values.first_name} has been saved and synced.` });
      form.reset();
      setSelectedDeckId(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to onboard client", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendDeckEmail = async (leadId: string, leadName: string) => {
    setSendingEmailFor(leadId);
    try {
      const { error } = await supabase.functions.invoke("send-deck-email", { body: { leadId } });
      if (error) throw error;
      setEmailSentFor((prev) => new Set(prev).add(leadId));
      toast({ title: "Email sent!", description: `Pitch deck email sent to ${leadName}.` });
    } catch (err: any) {
      toast({ title: "Failed to send email", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSendingEmailFor(null);
    }
  };

  const selectedDeck = decks.find((d) => d.id === selectedDeckId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {agentName ? `Hey ${agentName}` : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your command centre — onboard, send, manage.</p>
        </div>

        {/* ─── 3-Panel Grid ──────────────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr] xl:grid-cols-[400px_1fr_320px]">

          {/* ─── PANEL 1: Quick Onboard ─────────────────────────── */}
          <Card className="lg:col-span-1 xl:col-span-1 border-primary/20">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
                Onboard Client
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  {/* Name row */}
                  <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="first_name" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="First Name *" {...field} className="h-9 text-sm" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="last_name" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Last Name" {...field} className="h-9 text-sm" />
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>

                  {/* Email + Phone row */}
                  <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Email *" type="email" {...field} className="h-9 text-sm" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Phone" {...field} className="h-9 text-sm" />
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>

                  {/* Source + Deck row */}
                  <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="source" render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SOURCES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                    <Select
                      value={selectedDeckId || ""}
                      onValueChange={(val) => setSelectedDeckId(val || null)}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Attach Deck" />
                      </SelectTrigger>
                      <SelectContent>
                        {decks.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            <div className="flex items-center gap-2">
                              {d.hero_image_url && (
                                <img src={d.hero_image_url} alt="" className="w-5 h-5 rounded object-cover" />
                              )}
                              <span className="truncate">{d.project_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Notes (optional)" {...field} rows={2} className="text-sm resize-none" />
                      </FormControl>
                    </FormItem>
                  )} />

                  {/* Submit */}
                  <Button type="submit" size="sm" className="w-full h-9 text-sm font-semibold" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-2" />}
                    Save & Sync to Lofty
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* ─── PANEL 2: Recent Leads ───────────────────────────── */}
          <Card className="lg:col-span-1 xl:col-span-1">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-muted">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  Recent Leads
                  {leads.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5">{leads.length}</Badge>
                  )}
                </CardTitle>
                <Link to="/dashboard/leads">
                  <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground">
                    All <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {leadsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No leads yet — onboard your first client</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                  {leads.map((lead) => {
                    const isExpanded = expandedLead === lead.id;
                    const deckName = (lead.pitch_decks as any)?.project_name;
                    return (
                      <div key={lead.id} className="rounded-lg border border-border hover:border-border/80 transition-colors">
                        {/* Main row */}
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <button
                            onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                            className="flex items-center gap-2 flex-1 min-w-0 text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium truncate">
                                  {lead.first_name} {lead.last_name}
                                </span>
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0">
                                  {SOURCE_LABELS[lead.source] || lead.source}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {deckName && (
                                  <span className="text-[11px] text-primary truncate">{deckName}</span>
                                )}
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  {format(new Date(lead.created_at), "MMM d")}
                                </span>
                              </div>
                            </div>
                            {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />}
                          </button>

                          {/* Quick actions */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            {lead.deck_url && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  title="Copy deck link"
                                  onClick={() => handleCopy((lead.pitch_decks as any)?.slug)}
                                >
                                  {copiedSlug === (lead.pitch_decks as any)?.slug ? (
                                    <Check className="h-3 w-3 text-primary" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn("h-7 w-7", emailSentFor.has(lead.id) && "text-primary")}
                                  title={emailSentFor.has(lead.id) ? "Email sent" : "Send deck email"}
                                  disabled={sendingEmailFor === lead.id || emailSentFor.has(lead.id)}
                                  onClick={() => handleSendDeckEmail(lead.id, `${lead.first_name} ${lead.last_name}`)}
                                >
                                  {sendingEmailFor === lead.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : emailSentFor.has(lead.id) ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Mail className="h-3 w-3" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-3 pb-2.5 pt-0 border-t border-border/50 space-y-1.5">
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground pt-1.5">
                              <a href={`mailto:${lead.email}`} className="hover:text-primary transition-colors">{lead.email}</a>
                              {lead.phone && <a href={`tel:${lead.phone}`} className="hover:text-primary transition-colors">{lead.phone}</a>}
                            </div>
                            {lead.notes && (
                              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">{lead.notes}</p>
                            )}
                            {lead.deck_url && (
                              <a
                                href={lead.deck_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <Presentation className="h-3 w-3" />
                                Open Deck
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── PANEL 3: Your Decks ─────────────────────────────── */}
          <Card className="lg:col-span-2 xl:col-span-1">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-muted">
                    <Presentation className="h-4 w-4 text-muted-foreground" />
                  </div>
                  Pitch Decks
                </CardTitle>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => navigate("/dashboard/decks/new")}
                >
                  <Plus className="h-3 w-3" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {decks.length === 0 ? (
                <div className="text-center py-8">
                  <Presentation className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No decks yet</p>
                  <Button size="sm" variant="outline" className="mt-3 text-xs" onClick={() => navigate("/dashboard/decks/new")}>
                    Create Your First Deck
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {decks.map((deck) => (
                    <div
                      key={deck.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary/20 transition-colors group"
                    >
                      {deck.hero_image_url ? (
                        <img src={deck.hero_image_url} alt="" className="w-12 h-9 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-9 rounded bg-muted flex items-center justify-center shrink-0">
                          <Presentation className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{deck.project_name}</p>
                        {deck.city && <p className="text-[11px] text-muted-foreground">{deck.city}</p>}
                      </div>
                      <div className="flex gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Copy link"
                          onClick={() => handleCopy(deck.slug)}
                        >
                          {copiedSlug === deck.slug ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Edit deck"
                          onClick={() => navigate(`/dashboard/decks/${deck.id}`)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <a href={`https://presaleproperties.com/deck/${deck.slug}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Open deck">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                  <Link to="/dashboard/decks" className="block">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground h-8 mt-1">
                      Manage All Decks <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
