/**
 * SentEmailsList
 * ─────────────────────────────────────────────────────────────────────────
 * Compact list of past emails to a given recipient. Pulls from email_logs.
 * Shown inside the composer's collapsible "Conversation" section so reps
 * can see what's already been sent before drafting a new email.
 */
import { useQuery } from "@tanstack/react-query";
import { Mail, Eye, MousePointerClick, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Props {
  email: string;
}

interface SentEmail {
  id: string;
  subject: string;
  sent_at: string;
  status: string;
  open_count: number;
  click_count: number;
  template_type: string | null;
  last_opened_at: string | null;
}

export function SentEmailsList({ email }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["compose-sent-history", email],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("email_logs")
        .select("id, subject, sent_at, status, open_count, click_count, template_type, last_opened_at")
        .eq("email_to", email)
        .order("sent_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data || []) as SentEmail[];
    },
    enabled: !!email,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-3 py-4 text-center">
        <Mail className="mx-auto h-4 w-4 text-muted-foreground" />
        <p className="mt-1.5 text-[11px] text-muted-foreground">No prior emails to this lead</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {data.map((e) => {
        const opened = (e.open_count || 0) > 0;
        const clicked = (e.click_count || 0) > 0;
        return (
          <div
            key={e.id}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px]"
          >
            <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{e.subject}</div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDistanceToNow(new Date(e.sent_at), { addSuffix: true })}
                </span>
                {e.template_type && <span className="opacity-60">· {e.template_type}</span>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {opened && (
                <Badge
                  variant="secondary"
                  className="h-4 gap-0.5 px-1 text-[9px] font-normal text-success"
                  title={`Opened ${e.open_count}× ${e.last_opened_at ? `· last ${formatDistanceToNow(new Date(e.last_opened_at), { addSuffix: true })}` : ""}`}
                >
                  <Eye className="h-2.5 w-2.5" />
                  {e.open_count}
                </Badge>
              )}
              {clicked && (
                <Badge
                  variant="secondary"
                  className="h-4 gap-0.5 px-1 text-[9px] font-normal text-info"
                  title={`Clicked ${e.click_count}×`}
                >
                  <MousePointerClick className="h-2.5 w-2.5" />
                  {e.click_count}
                </Badge>
              )}
              {!opened && !clicked && (
                <Badge variant="outline" className="h-4 px-1 text-[9px] font-normal text-muted-foreground">
                  {e.status === "sent" ? "Delivered" : e.status}
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
