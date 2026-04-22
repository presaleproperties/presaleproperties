/**
 * useTemplatePerformance
 * ─────────────────────────────────────────────────────────────────────────────
 * Loads a single map of `subject → { sent, opens, clicks, lastSentAt }` plus
 * the most recent `email_audit_runs` entry, so the Marketing Hub grid can
 * render per-template performance + audit-status badges without N+1 queries.
 *
 * Subject is the join key because `campaign_templates` are saved-asset blobs
 * with no FK into `email_logs`. The displayed subject (subjectLine in
 * form_data) is what gets sent and recorded, so it's stable enough to surface
 * coarse engagement metrics in the card.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fromTable } from "@/integrations/supabase/db-helpers";

export type TemplateMetrics = {
  /** Number of email_logs rows whose subject matches the template subject */
  sent: number;
  opens: number;
  clicks: number;
  /** ISO timestamp of the most recent send for this subject */
  lastSentAt: string | null;
};

export type LatestAudit = {
  status: "ok" | "failed" | "error";
  ranAt: string;
  totalErrors: number;
  totalLinks: number;
} | null;

export type TemplatePerformance = {
  /** Map of normalized subject → metrics */
  bySubject: Map<string, TemplateMetrics>;
  /** Most recent recommendation-email audit (single row, applies to all) */
  latestAudit: LatestAudit;
  loading: boolean;
  refetch: () => Promise<void>;
};

const LOOKBACK_DAYS = 90;

function normalize(subject: string | null | undefined): string {
  return (subject ?? "").trim().toLowerCase();
}

export function useTemplatePerformance(): TemplatePerformance {
  const [bySubject, setBySubject] = useState<Map<string, TemplateMetrics>>(new Map());
  const [latestAudit, setLatestAudit] = useState<LatestAudit>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const sinceIso = new Date(
      Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [logsRes, auditRes] = await Promise.all([
      fromTable(supabase, "email_logs")
        .select("subject, open_count, click_count, sent_at")
        .gte("sent_at", sinceIso)
        .not("subject", "is", null)
        .limit(5000),
      fromTable(supabase, "email_audit_runs")
        .select("status, ran_at, total_errors, total_links")
        .order("ran_at", { ascending: false })
        .limit(1),
    ]);

    // Aggregate logs per normalized subject
    const map = new Map<string, TemplateMetrics>();
    for (const row of (logsRes.data ?? []) as Array<{
      subject: string;
      open_count: number | null;
      click_count: number | null;
      sent_at: string;
    }>) {
      const key = normalize(row.subject);
      if (!key) continue;
      const cur = map.get(key) ?? { sent: 0, opens: 0, clicks: 0, lastSentAt: null };
      cur.sent += 1;
      cur.opens += row.open_count ?? 0;
      cur.clicks += row.click_count ?? 0;
      if (!cur.lastSentAt || row.sent_at > cur.lastSentAt) cur.lastSentAt = row.sent_at;
      map.set(key, cur);
    }
    setBySubject(map);

    const auditRow = (auditRes.data?.[0] ?? null) as
      | { status: string; ran_at: string; total_errors: number; total_links: number }
      | null;
    setLatestAudit(
      auditRow
        ? {
            status: auditRow.status as "ok" | "failed" | "error",
            ranAt: auditRow.ran_at,
            totalErrors: auditRow.total_errors,
            totalLinks: auditRow.total_links,
          }
        : null,
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return { bySubject, latestAudit, loading, refetch: fetchAll };
}

/** Helper to extract the subject used by sends from a saved asset blob. */
export function getAssetSubject(asset: {
  name?: string;
  form_data?: {
    vars?: { subjectLine?: string };
    copy?: { subjectLine?: string };
  };
}): string {
  return (
    asset.form_data?.vars?.subjectLine ??
    asset.form_data?.copy?.subjectLine ??
    asset.name ??
    ""
  );
}

export function lookupMetrics(
  perf: TemplatePerformance,
  asset: Parameters<typeof getAssetSubject>[0],
): TemplateMetrics | null {
  const key = normalize(getAssetSubject(asset));
  if (!key) return null;
  return perf.bySubject.get(key) ?? null;
}
