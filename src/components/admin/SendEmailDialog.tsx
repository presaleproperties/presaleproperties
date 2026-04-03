import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Send,
  Search,
  X,
  Loader2,
  CheckCircle2,
  Plus,
  User,
  Mail,
  AlertCircle,
} from "lucide-react";

interface LeadResult {
  id: string;
  name: string;
  email: string;
  source: string; // "lead" | "client"
  phone?: string;
}

interface Recipient {
  email: string;
  name: string;
  source: string;
}

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  html: string;
  fromName?: string;
}

export function SendEmailDialog({
  open,
  onOpenChange,
  subject,
  html,
  fromName,
}: SendEmailDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LeadResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);
  const [manualEmail, setManualEmail] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchLeads(query), 300);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setRecipients([]);
      setSendResult(null);
      setManualEmail("");
    }
  }, [open]);

  const searchLeads = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const term = `%${q}%`;

      // Search project_leads and clients in parallel
      const [leadsRes, clientsRes] = await Promise.all([
        supabase
          .from("project_leads")
          .select("id, name, email, phone")
          .or(`name.ilike.${term},email.ilike.${term}`)
          .limit(10),
        supabase
          .from("clients")
          .select("id, first_name, last_name, email, phone")
          .or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`)
          .limit(10),
      ]);

      const mapped: LeadResult[] = [];
      const seen = new Set<string>();

      if (leadsRes.data) {
        for (const l of leadsRes.data) {
          if (!seen.has(l.email)) {
            seen.add(l.email);
            mapped.push({ id: l.id, name: l.name, email: l.email, source: "lead", phone: l.phone ?? undefined });
          }
        }
      }
      if (clientsRes.data) {
        for (const c of clientsRes.data) {
          if (!seen.has(c.email)) {
            seen.add(c.email);
            const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
            mapped.push({ id: c.id, name, email: c.email, source: "client", phone: c.phone ?? undefined });
          }
        }
      }

      setResults(mapped);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  }, []);

  const addRecipient = (lead: LeadResult) => {
    if (recipients.some((r) => r.email === lead.email)) return;
    setRecipients((prev) => [...prev, { email: lead.email, name: lead.name, source: lead.source }]);
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  const addManualRecipient = () => {
    const email = manualEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (recipients.some((r) => r.email === email)) {
      toast.error("Already added");
      return;
    }
    setRecipients((prev) => [...prev, { email, name: email.split("@")[0], source: "manual" }]);
    setManualEmail("");
  };

  const removeRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((r) => r.email !== email));
  };

  const handleSend = async () => {
    if (!recipients.length) {
      toast.error("Add at least one recipient");
      return;
    }
    if (!subject) {
      toast.error("Email has no subject line — set it in the builder first");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-builder-email", {
        body: {
          subject,
          html,
          recipients: recipients.map((r) => ({ email: r.email, name: r.name })),
          fromName,
        },
      });

      if (error) throw error;

      setSendResult({ sent: data.sent, failed: data.failed });
      if (data.sent > 0 && data.failed === 0) {
        toast.success(`Email sent to ${data.sent} recipient${data.sent > 1 ? "s" : ""}`);
      } else if (data.sent > 0 && data.failed > 0) {
        toast.warning(`Sent ${data.sent}, failed ${data.failed}`);
      } else {
        toast.error("All sends failed");
      }
    } catch (err: any) {
      console.error("Send error:", err);
      toast.error(err.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const sourceLabel = (s: string) => {
    if (s === "lead") return "Lead";
    if (s === "client") return "Client";
    return "Manual";
  };

  const sourceColor = (s: string) => {
    if (s === "lead") return "bg-blue-500/10 text-blue-600 border-blue-200";
    if (s === "client") return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            Send Email
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {subject ? (
              <>Subject: <span className="font-medium text-foreground">{subject.slice(0, 60)}{subject.length > 60 ? "…" : ""}</span></>
            ) : (
              <span className="text-amber-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> No subject line set</span>
            )}
          </p>
        </DialogHeader>

        {sendResult ? (
          <div className="px-5 pb-6 pt-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-lg">
              {sendResult.failed === 0 ? "All emails sent!" : `${sendResult.sent} sent, ${sendResult.failed} failed`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {sendResult.sent} of {recipients.length} delivered successfully
            </p>
            <Button className="mt-4" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : (
          <>
            {/* Search input */}
            <div className="px-5 pb-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search leads by name or email…"
                  className="pl-9 h-9 text-sm"
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              </div>

              {/* Search results dropdown */}
              {results.length > 0 && (
                <div className="border border-border rounded-lg max-h-[180px] overflow-y-auto divide-y divide-border bg-background shadow-sm">
                  {results.map((r) => {
                    const alreadyAdded = recipients.some((rec) => rec.email === r.email);
                    return (
                      <button
                        key={r.id}
                        onClick={() => addRecipient(r)}
                        disabled={alreadyAdded}
                        className={cn(
                          "w-full text-left px-3 py-2 flex items-center gap-3 text-sm transition-colors",
                          alreadyAdded ? "opacity-40 cursor-not-allowed" : "hover:bg-muted/50"
                        )}
                      >
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs truncate">{r.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{r.email}</p>
                        </div>
                        <Badge variant="outline" className={cn("text-[9px] shrink-0", sourceColor(r.source))}>
                          {sourceLabel(r.source)}
                        </Badge>
                        {alreadyAdded && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {query.length >= 2 && !searching && results.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No leads found for "{query}"</p>
              )}

              {/* Manual email entry */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addManualRecipient()}
                    placeholder="Or type an email address…"
                    className="pl-9 h-8 text-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1"
                  onClick={addManualRecipient}
                >
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
            </div>

            {/* Recipients list */}
            {recipients.length > 0 && (
              <div className="px-5 pb-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Recipients ({recipients.length})
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                  {recipients.map((r) => (
                    <Badge
                      key={r.email}
                      variant="secondary"
                      className="gap-1 pr-1 text-xs font-normal"
                    >
                      <span className="truncate max-w-[160px]">{r.name}</span>
                      <button
                        onClick={() => removeRecipient(r.email)}
                        className="ml-0.5 h-4 w-4 rounded-full hover:bg-destructive/20 flex items-center justify-center transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Send button */}
            <div className="px-5 pb-5 pt-2 border-t border-border">
              <Button
                className="w-full h-10 gap-2 font-semibold"
                onClick={handleSend}
                disabled={sending || !recipients.length || !subject}
              >
                {sending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                ) : (
                  <><Send className="h-4 w-4" /> Send to {recipients.length} Recipient{recipients.length !== 1 ? "s" : ""}</>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
