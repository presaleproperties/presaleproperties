/**
 * BulkEmailDialog
 * ─────────────────────────────────────────────────────────────────────────
 * Thin compatibility wrapper around `LeadComposeDialog` so existing
 * imports keep working while bulk + single send share the same UX.
 */
import { LeadComposeDialog, type ComposeRecipient } from "./email/LeadComposeDialog";

interface Recipient {
  id: string;
  email: string;
  name?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: Recipient[];
  campaignName?: string;
}

export function BulkEmailDialog({ open, onOpenChange, recipients, campaignName }: Props) {
  const mapped: ComposeRecipient[] = recipients.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name ?? null,
    leadId: r.id,
  }));
  return (
    <LeadComposeDialog
      open={open}
      onOpenChange={onOpenChange}
      recipients={mapped}
      allowAddRecipients
      campaignName={campaignName || "admin_bulk_email"}
    />
  );
}
