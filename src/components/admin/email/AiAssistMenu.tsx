/**
 * AiAssistMenu
 * ─────────────────────────────────────────────────────────────────────────
 * Inline "Improve with AI" button that rewrites the current draft body
 * via the `email-ai-assist` edge function. Renders next to the editor.
 */
import { useState } from "react";
import { Loader2, Wand2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tone = "shorter" | "friendlier" | "professional" | "punchier";

interface Props {
  body: string;
  /** Called with the rewritten body (HTML-safe paragraphs). */
  onRewrite: (newBody: string) => void;
  /** Called with raw plain text — caller decides how to inject. */
  mode: "rich" | "plain" | "html" | "template";
  disabled?: boolean;
}

const TONES: { key: Tone; label: string; hint: string }[] = [
  { key: "shorter", label: "Make it shorter", hint: "Trim ~40%, same intent" },
  { key: "friendlier", label: "Friendlier tone", hint: "Warmer, more personal" },
  { key: "professional", label: "More professional", hint: "Polished, still human" },
  { key: "punchier", label: "Punchier", hint: "Strong opener, no filler" },
];

function plainToParagraphs(text: string): string {
  // Convert plain text paragraphs into HTML <p> blocks for rich/html modes.
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export function AiAssistMenu({ body, onRewrite, mode, disabled }: Props) {
  const [busy, setBusy] = useState<Tone | null>(null);

  const run = async (tone: Tone) => {
    if (!body.trim()) {
      toast.error("Write something first, then ask AI to improve it");
      return;
    }
    setBusy(tone);
    try {
      const { data, error } = await supabase.functions.invoke("email-ai-assist", {
        body: { action: "rewrite", body, tone },
      });
      if (error) throw error;
      const result = (data as any)?.result;
      if (!result) throw new Error("No rewrite returned");
      // For rich/html, convert plain paragraphs → HTML; for plain mode keep raw.
      const next = mode === "plain" ? result : plainToParagraphs(result);
      onRewrite(next);
      toast.success("Rewrite applied — undo with the editor's undo button");
    } catch (err: any) {
      toast.error(err?.message || "AI rewrite failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !!busy}
          className="h-7 gap-1 text-[11px] border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
          {busy ? "Rewriting…" : "Improve with AI"}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Rewrite tone
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TONES.map((t) => (
          <DropdownMenuItem
            key={t.key}
            onClick={() => run(t.key)}
            disabled={!!busy}
            className="flex flex-col items-start gap-0.5 py-1.5"
          >
            <span className="text-xs font-medium">{t.label}</span>
            <span className="text-[10px] text-muted-foreground">{t.hint}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
