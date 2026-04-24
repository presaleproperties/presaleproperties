/**
 * Shared status → tone registry.
 *
 * Whenever a string status (e.g. "pending", "approved", "sold_out", "running")
 * needs to be rendered as a badge, look it up here so success/warning/info/danger
 * colors stay consistent sitewide.
 *
 * Add new statuses below — never reach for raw `bg-success-soft` etc. in pages.
 */

export type StatusTone =
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "neutral"
  | "success-soft"
  | "warning-soft"
  | "info-soft"
  | "danger-soft"
  | "neutral-soft";

export interface StatusEntry {
  tone: StatusTone;
  label: string;
}

/**
 * Canonical map. Keys are normalized to lowercase. Aliases live alongside the
 * canonical entry — both resolve to the same tone & label.
 */
const REGISTRY: Record<string, StatusEntry> = {
  // ─── Generic lifecycle ─────────────────────────────────────────
  pending: { tone: "warning-soft", label: "Pending" },
  queued: { tone: "neutral-soft", label: "Queued" },
  processing: { tone: "info-soft", label: "Processing" },
  running: { tone: "info-soft", label: "Running" },
  sending: { tone: "warning-soft", label: "Sending" },
  completed: { tone: "success-soft", label: "Completed" },
  completed_with_errors: { tone: "warning-soft", label: "With Errors" },
  sent: { tone: "success-soft", label: "Sent" },
  delivered: { tone: "success-soft", label: "Delivered" },
  success: { tone: "success-soft", label: "Success" },
  failed: { tone: "danger-soft", label: "Failed" },
  error: { tone: "danger-soft", label: "Error" },
  cancelled: { tone: "danger-soft", label: "Cancelled" },
  canceled: { tone: "danger-soft", label: "Cancelled" },

  // ─── Verification / approval ───────────────────────────────────
  approved: { tone: "success-soft", label: "Approved" },
  verified: { tone: "success-soft", label: "Verified" },
  confirmed: { tone: "success-soft", label: "Confirmed" },
  rejected: { tone: "danger-soft", label: "Rejected" },
  declined: { tone: "danger-soft", label: "Declined" },

  // ─── Inbox / messaging ─────────────────────────────────────────
  responded: { tone: "success-soft", label: "Responded" },

  // ─── Project lifecycle ─────────────────────────────────────────
  coming_soon: { tone: "info-soft", label: "Coming Soon" },
  registering: { tone: "warning-soft", label: "Registering" },
  active: { tone: "success-soft", label: "Active" },
  now_selling: { tone: "success-soft", label: "Now Selling" },
  sold_out: { tone: "neutral-soft", label: "Sold Out" },

  // ─── Tech stack / integrations ─────────────────────────────────
  configured: { tone: "info-soft", label: "Configured" },
  dormant: { tone: "warning-soft", label: "Dormant" },
  issue: { tone: "danger-soft", label: "Issue" },

  // ─── Publishing ────────────────────────────────────────────────
  published: { tone: "success-soft", label: "Published" },
  draft: { tone: "neutral-soft", label: "Draft" },
};

/** Title-case fallback for unknown statuses. */
function titleCase(input: string): string {
  return input.replace(/[_-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Resolve a status string to its tone + display label. Unknown statuses fall
 * back to a neutral-soft tone with a title-cased label so nothing is unstyled.
 */
export function resolveStatus(status: string | null | undefined): StatusEntry {
  if (!status) return { tone: "neutral-soft", label: "—" };
  const key = String(status).toLowerCase();
  return REGISTRY[key] ?? { tone: "neutral-soft", label: titleCase(status) };
}
