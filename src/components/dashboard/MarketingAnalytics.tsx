import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Eye, MousePointer, Users, TrendingUp, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  color: string;
}

export function MarketingAnalytics() {
  const [timeRange, setTimeRange] = useState("30");
  const [loading, setLoading] = useState(true);
  const [emailStats, setEmailStats] = useState({ sent: 0, opened: 0, clicked: 0 });
  const [deckStats, setDeckStats] = useState({ totalVisits: 0, uniqueVisitors: 0 });
  const [leadStats, setLeadStats] = useState({ total: 0, thisMonth: 0 });
  const [topProjects, setTopProjects] = useState<{ name: string; views: number; leads: number }[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
    const since = daysAgo.toISOString();

    // Parallel queries
    const [emailRes, deckRes, leadRes, activityRes] = await Promise.all([
      (supabase as any).from("email_logs").select("status, opened_at, clicked_at").gte("sent_at", since),
      supabase.from("deck_visits").select("id, visitor_id, project_name").gte("created_at", since),
      supabase.from("project_leads").select("id, created_at, project_name").gte("created_at", since),
      supabase.from("client_activity").select("project_name, activity_type").gte("created_at", since).in("activity_type", ["property_view", "cta_click", "form_submit"]),
    ]);

    // Email stats
    const emails = emailRes.data || [];
    setEmailStats({
      sent: emails.length,
      opened: emails.filter((e: any) => e.opened_at).length,
      clicked: emails.filter((e: any) => e.clicked_at).length,
    });

    // Deck stats
    const decks = deckRes.data || [];
    const uniqueVisitorIds = new Set(decks.map((d: any) => d.visitor_id).filter(Boolean));
    setDeckStats({
      totalVisits: decks.length,
      uniqueVisitors: uniqueVisitorIds.size,
    });

    // Lead stats
    const leads = leadRes.data || [];
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    setLeadStats({
      total: leads.length,
      thisMonth: leads.filter((l: any) => new Date(l.created_at) >= thisMonthStart).length,
    });

    // Top projects by activity
    const activities = activityRes.data || [];
    const projectMap = new Map<string, { views: number; leads: number }>();
    activities.forEach((a: any) => {
      if (!a.project_name) return;
      const existing = projectMap.get(a.project_name) || { views: 0, leads: 0 };
      if (a.activity_type === "property_view") existing.views++;
      if (a.activity_type === "form_submit") existing.leads++;
      projectMap.set(a.project_name, existing);
    });
    const sorted = Array.from(projectMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);
    setTopProjects(sorted);

    setLoading(false);
  };

  const openRate = emailStats.sent > 0 ? Math.round((emailStats.opened / emailStats.sent) * 100) : 0;
  const clickRate = emailStats.sent > 0 ? Math.round((emailStats.clicked / emailStats.sent) * 100) : 0;

  const stats: StatCard[] = [
    { label: "Emails Sent", value: emailStats.sent, icon: <Mail className="h-4 w-4" />, change: `${openRate}% open rate`, color: "text-info" },
    { label: "Deck Views", value: deckStats.totalVisits, icon: <Eye className="h-4 w-4" />, change: `${deckStats.uniqueVisitors} unique`, color: "text-primary" },
    { label: "Leads Captured", value: leadStats.total, icon: <Users className="h-4 w-4" />, change: `${leadStats.thisMonth} this month`, color: "text-success" },
    { label: "Click Rate", value: `${clickRate}%`, icon: <MousePointer className="h-4 w-4" />, change: `${emailStats.clicked} clicks`, color: "text-warning" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Marketing Analytics</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Performance across emails, decks & lead generation</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className={cn("p-2 rounded-lg bg-muted/50", stat.color)}>{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{stat.label}</p>
            {stat.change && (
              <p className="text-[10px] text-muted-foreground/60 mt-1">{stat.change}</p>
            )}
          </div>
        ))}
      </div>

      {/* Top Projects */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground">Top Projects by Engagement</p>
        </div>
        {topProjects.length === 0 ? (
          <div className="p-8 text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No engagement data for this period</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {topProjects.map((project, i) => {
              const maxViews = topProjects[0]?.views || 1;
              const barWidth = Math.max((project.views / maxViews) * 100, 4);
              return (
                <div key={project.name} className="flex items-center gap-4 px-4 py-3">
                  <span className="text-[10px] font-bold text-muted-foreground/40 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{project.name}</p>
                    <div className="mt-1.5 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-bold">{project.views}</p>
                      <p className="text-[9px] text-muted-foreground">views</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">{project.leads}</p>
                      <p className="text-[9px] text-muted-foreground">leads</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Email Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Email Funnel</p>
          <div className="space-y-2.5">
            {[
              { label: "Sent", value: emailStats.sent, pct: 100 },
              { label: "Opened", value: emailStats.opened, pct: openRate },
              { label: "Clicked", value: emailStats.clicked, pct: clickRate },
            ].map(step => (
              <div key={step.label} className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-14">{step.label}</span>
                <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/50 rounded-full" style={{ width: `${step.pct}%` }} />
                </div>
                <span className="text-[10px] font-bold w-8 text-right">{step.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Pitch Decks</p>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold">{deckStats.totalVisits}</p>
              <p className="text-[10px] text-muted-foreground">Total views</p>
            </div>
            <div>
              <p className="text-lg font-bold">{deckStats.uniqueVisitors}</p>
              <p className="text-[10px] text-muted-foreground">Unique visitors</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Lead Generation</p>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold">{leadStats.total}</p>
              <p className="text-[10px] text-muted-foreground">Total leads ({timeRange}d)</p>
            </div>
            <div>
              <p className="text-lg font-bold">{leadStats.thisMonth}</p>
              <p className="text-[10px] text-muted-foreground">This month</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
