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

/**
 * Built-in auto-email templates fired by edge functions.
 * Keys map to actual templateType values used inside send-lead-autoresponse,
 * send-booking-notification, send-buyer-welcome, etc.
 */
const SYSTEM_TEMPLATES: TemplateOption[] = [
  // send-lead-autoresponse — branching by lead persona
  { value: "system:auto_response_a", label: "Project Inquiry · Has Agent (Template A)", description: "Lead already has a buyer's agent — sends floor plans & details", group: "system", badge: "Auto" },
  { value: "system:auto_response_b", label: "Project Inquiry · No Agent (Template B)", description: "Lead has no agent — pitches our team, 'we'll be in touch shortly'", group: "system", badge: "Auto" },
  // Lead magnet
  { value: "system:lead_magnet_guide", label: "7 Costly Mistakes Guide Delivery", description: "Sent on exit-intent popup, 7 Mistakes form, or newsletter signup w/o project", group: "system", badge: "Lead Magnet" },
  // Other transactional triggers (DB-backed but invoked automatically)
  { value: "system:booking_confirmation", label: "Booking Confirmation", description: "Sent after a consultation/showing is booked", group: "system", badge: "Auto" },
  { value: "system:buyer_welcome", label: "Buyer Welcome Email", description: "Sent when a new buyer account is created", group: "system", badge: "Auto" },
  { value: "system:buyer_welcome_premium", label: "Premium Buyer Welcome", description: "Welcome email for VIP / premium buyers", group: "system", badge: "Auto" },
  { value: "system:project_welcome", label: "Project Welcome Email", description: "Generic project signup welcome", group: "system", badge: "Auto" },
  { value: "system:project_info_package", label: "Project Info Package", description: "Delivers the requested project information package", group: "system", badge: "Auto" },
  { value: "system:buyer_recommendations", label: "Property Recommendations", description: "Tailored property matches based on buyer preferences", group: "system", badge: "Auto" },
  { value: "system:agent_welcome", label: "Agent Welcome Email", description: "Sent when a new agent account is approved", group: "system", badge: "Auto" },
  { value: "system:agent_request_received", label: "Agent Request Received", description: "Confirmation of a new agent inquiry/request", group: "system", badge: "Auto" },
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
          className="w-full justify-between h-9 bg-card text-sm font-normal"
        >
          <span className="flex items-center gap-2 min-w-0 truncate">
            {selected?.group === "campaign" ? (
              <FileText className="h-3.5 w-3.5 text-warning shrink-0" />
            ) : selected?.group === "db" ? (
              <Mail className="h-3.5 w-3.5 text-success shrink-0" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-info shrink-0" />
            )}
            <span className="truncate">{selected?.label || "Select a template…"}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0 bg-card" align="start">
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
    opt.group === "campaign" ? "text-warning" : opt.group === "db" ? "text-success" : "text-info";
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
