/**
 * SubjectSuggestions
 * ─────────────────────────────────────────────────────────────────────────
 * Tiny "Suggest subject" button shown next to the Subject input.
 * Calls email-ai-assist (action: "subjects") and renders 3-5 chips.
 */
import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  body: string;
  currentSubject: string;
  onPick: (subject: string) => void;
}

export function SubjectSuggestions({ body, currentSubject, onPick }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generate = async () => {
    if (!body.trim()) {
      toast.error("Write the email body first — AI uses it to suggest subjects");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("email-ai-assist", {
        body: { action: "subjects", body },
      });
      if (error) throw error;
      const list = ((data as any)?.suggestions || []) as string[];
      if (!list.length) throw new Error("No suggestions returned");
      setSuggestions(list);
    } catch (err: any) {
      toast.error(err?.message || "Could not get suggestions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={generate}
          disabled={loading}
          className="h-6 gap-1 px-1.5 text-[10px] text-primary hover:bg-primary/10"
        >
          {loading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
          {loading ? "Thinking…" : suggestions.length ? "Re-generate" : "Suggest subject"}
        </Button>
        {suggestions.length > 0 && (
          <button
            type="button"
            onClick={() => setSuggestions([])}
            className="text-[10px] text-muted-foreground hover:text-foreground"
            title="Hide suggestions"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s, i) => {
            const active = s === currentSubject;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onPick(s)}
                className={
                  "inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors " +
                  (active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/5")
                }
              >
                <Sparkles className="h-2.5 w-2.5 shrink-0 opacity-60" />
                <span className="truncate">{s}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
