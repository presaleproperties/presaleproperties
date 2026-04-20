import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Mail, Sparkles, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export interface TemplateOption {
  /** Stored value: `system:<key>` or `campaign:<uuid>` */
  value: string;
  label: string;
  description?: string;
  group: "system" | "campaign" | "db";
  badge?: string;
}

/** Built-in auto-email templates fired by edge functions (send-lead-autoresponse etc.) */
const SYSTEM_TEMPLATES: TemplateOption[] = [
  { value: "system:auto_response_a", label: "Auto-Response · Template A (Has Agent)", description: "Sent to leads who already have a buyer's agent", group: "system", badge: "Auto" },
  { value: "system:auto_response_b", label: "Auto-Response · Template B (No Agent)", description: "Sent to leads without an agent — pitches our team", group: "system", badge: "Auto" },
  { value: "system:follow_up_1", label: "Follow-Up #1 · Day 2", description: "Soft check-in two days after initial inquiry", group: "system", badge: "Auto" },
  { value: "system:follow_up_2", label: "Follow-Up #2 · Day 5", description: "Value-add follow-up with additional resources", group: "system", badge: "Auto" },
  { value: "system:follow_up_3", label: "Follow-Up #3 · Day 10", description: "Final nudge before marking as cold", group: "system", badge: "Auto" },
  { value: "system:pitch_deck_unlock", label: "Pitch Deck Unlock", description: "Sent when a lead unlocks a pitch deck", group: "system", badge: "Auto" },
  { value: "system:booking_confirmation", label: "Booking Confirmation", description: "Sent after a consultation is booked", group: "system", badge: "Auto" },
];

interface EmailTemplatePickerProps {
  value: string;
  onChange: (value: string, option: TemplateOption) => void;
}

export function EmailTemplatePicker({ value, onChange }: EmailTemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const [campaignTemplates, setCampaignTemplates] = useState<TemplateOption[]>([]);
  const [dbTemplates, setDbTemplates] = useState<TemplateOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: campaigns }, { data: dbT }] = await Promise.all([
        (supabase as any)
          .from("campaign_templates")
          .select("id, name, project_name, tags")
          .order("updated_at", { ascending: false })
          .limit(200),
        (supabase as any)
          .from("email_templates")
          .select("id, name, template_key, template_type, audience_type")
          .eq("is_active", true)
          .order("name"),
      ]);
      if (cancelled) return;
      setCampaignTemplates(
        (campaigns || []).map((c: any) => ({
          value: `campaign:${c.id}`,
          label: c.name,
          description: c.project_name || undefined,
          group: "campaign" as const,
          badge: "Project",
        }))
      );
      setDbTemplates(
        (dbT || []).map((t: any) => ({
          value: `db:${t.id}`,
          label: t.name,
          description: t.template_type ? `${t.template_type}${t.audience_type ? ` · ${t.audience_type}` : ""}` : undefined,
          group: "db" as const,
          badge: "Saved",
        }))
      );
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const allOptions = useMemo(
    () => [...SYSTEM_TEMPLATES, ...dbTemplates, ...campaignTemplates],
    [dbTemplates, campaignTemplates]
  );

  // Back-compat: legacy stored values like "auto_response", "follow_up_1", "custom"
  const normalizedValue = useMemo(() => {
    if (!value) return "system:auto_response_a";
    if (value.includes(":")) return value;
    const legacyMap: Record<string, string> = {
      auto_response: "system:auto_response_a",
      follow_up_1: "system:follow_up_1",
      follow_up_2: "system:follow_up_2",
      custom: "",
    };
    return legacyMap[value] ?? value;
  }, [value]);

  const selected = allOptions.find((o) => o.value === normalizedValue);

  const handleSelect = (opt: TemplateOption) => {
    onChange(opt.value, opt);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 bg-white text-sm font-normal"
        >
          <span className="flex items-center gap-2 min-w-0 truncate">
            {selected?.group === "campaign" ? (
              <FileText className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            ) : selected?.group === "db" ? (
              <Mail className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            )}
            <span className="truncate">{selected?.label || "Select a template…"}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0 bg-white" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <CommandInput placeholder="Search templates…" className="h-10 border-0 focus:ring-0" />
          </div>
          <CommandList className="max-h-[340px]">
            <CommandEmpty>{loading ? "Loading templates…" : "No templates found."}</CommandEmpty>

            <CommandGroup heading="System Auto-Emails">
              {SYSTEM_TEMPLATES.map((opt) => (
                <TemplateRow key={opt.value} opt={opt} selected={normalizedValue === opt.value} onSelect={handleSelect} />
              ))}
            </CommandGroup>

            {dbTemplates.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Saved Email Templates">
                  {dbTemplates.map((opt) => (
                    <TemplateRow key={opt.value} opt={opt} selected={normalizedValue === opt.value} onSelect={handleSelect} />
                  ))}
                </CommandGroup>
              </>
            )}

            {campaignTemplates.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={`Project Templates (${campaignTemplates.length})`}>
                  {campaignTemplates.map((opt) => (
                    <TemplateRow key={opt.value} opt={opt} selected={normalizedValue === opt.value} onSelect={handleSelect} />
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function TemplateRow({
  opt, selected, onSelect,
}: { opt: TemplateOption; selected: boolean; onSelect: (o: TemplateOption) => void }) {
  const Icon = opt.group === "campaign" ? FileText : opt.group === "db" ? Mail : Sparkles;
  const iconColor =
    opt.group === "campaign" ? "text-amber-600" : opt.group === "db" ? "text-emerald-600" : "text-blue-600";
  return (
    <CommandItem
      value={`${opt.label} ${opt.description || ""} ${opt.value}`}
      onSelect={() => onSelect(opt)}
      className="flex items-start gap-2 py-2 cursor-pointer"
    >
      <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", iconColor)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{opt.label}</span>
          {opt.badge && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-normal">{opt.badge}</Badge>
          )}
        </div>
        {opt.description && (
          <p className="text-xs text-muted-foreground truncate">{opt.description}</p>
        )}
      </div>
      <Check className={cn("h-3.5 w-3.5 shrink-0", selected ? "opacity-100" : "opacity-0")} />
    </CommandItem>
  );
}
