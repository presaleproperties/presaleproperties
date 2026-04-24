/**
 * PhoneActionsPopover
 * ─────────────────────────────────────────────────────────────────────────
 * Single phone button with a popover offering Call, SMS, WhatsApp, Copy.
 * Replaces the bare `tel:` link so reps can pick the channel that fits.
 */
import { Phone, MessageSquare, MessageCircle, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  phone: string;
  leadName?: string;
  className?: string;
  size?: "icon" | "sm";
}

function digitsOnly(p: string): string {
  return (p || "").replace(/\D/g, "");
}

function toE164NA(p: string): string {
  // Best-effort: assume North America if 10 digits
  const d = digitsOnly(p);
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return d.startsWith("+") ? p : `+${d}`;
}

export function PhoneActionsPopover({ phone, leadName, className }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const e164 = toE164NA(phone);
  const waLink = `https://wa.me/${e164.replace(/\D/g, "")}`;
  const smsBody = leadName
    ? `Hi ${leadName.split(" ")[0]}, this is the team at Presale Properties — `
    : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      toast.success("Phone number copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-success hover:bg-success/10 hover:text-success-strong",
            className,
          )}
          title="Phone actions"
        >
          <Phone className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {phone}
        </div>
        <a
          href={`tel:${e164}`}
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
        >
          <Phone className="h-3.5 w-3.5 text-success" />
          <span className="font-medium">Call</span>
        </a>
        <a
          href={`sms:${e164}${smsBody ? `?&body=${encodeURIComponent(smsBody)}` : ""}`}
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
        >
          <MessageSquare className="h-3.5 w-3.5 text-info" />
          <span className="font-medium">Send SMS</span>
        </a>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
        >
          <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
          <span className="font-medium">WhatsApp</span>
        </a>
        <button
          type="button"
          onClick={copy}
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="font-medium">{copied ? "Copied" : "Copy number"}</span>
        </button>
      </PopoverContent>
    </Popover>
  );
}
