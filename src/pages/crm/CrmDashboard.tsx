import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns";
import { RefreshCw, Phone, MessageSquare, Mail, ExternalLink, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type CrmLead = {
  id: string;
  created_at: string;
  name: string;
  email: string | null;
  phone: string | null;
  buyer_type: string | null;
  source: string | null;
  pipeline_status: string;
  temperature: string;
  tags: string[] | null;
  assigned_agent: string | null;
  budget_min: number | null;
  budget_max: number | null;
  last_contacted_at: string | null;
  next_followup_at: string | null;
};

const CHART_COLORS = [
  "hsl(40, 65%, 55%)",   // gold
  "hsl(199, 89%, 48%)",  // info blue
  "hsl(142, 76%, 36%)",  // success green
  "hsl(0, 84%, 60%)",    // destructive red
  "hsl(262, 52%, 47%)",  // purple
  "hsl(25, 95%, 53%)",   // orange
  "hsl(340, 75%, 55%)",  // pink
  "hsl(172, 66%, 50%)",  // teal
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatCurrency(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

export default function CrmDashboard() {
  const [calMonth, setCalMonth] = useState(new Date());

  const { data: leads = [], refetch, isRefetching } = useQuery({
    queryKey: ["crm-dashboard-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as CrmLead[]) || [];
    },
  });

  // Metrics
  const activeLeads = leads.filter((l) => !["Closed", "Lost"].includes(l.pipeline_status));
  const pipelineValue = activeLeads.reduce((sum, l) => sum + (l.budget_max || 0), 0);
  const hotCount = leads.filter((l) => l.temperature === "hot").length;
  const unreadCount = leads.filter((l) => !l.last_contacted_at).length;

  // Needs Attention
  const fourDaysAgo = subDays(new Date(), 4);
  const needsAttention = leads
    .filter((l) => {
      if (["Closed", "Lost"].includes(l.pipeline_status)) return false;
      if (!l.last_contacted_at) return true;
      return new Date(l.last_contacted_at) < fourDaysAgo;
    })
    .sort((a, b) => {
      const order = { hot: 0, warm: 1, cold: 2 };
      return (order[a.temperature as keyof typeof order] ?? 1) - (order[b.temperature as keyof typeof order] ?? 1);
    })
    .slice(0, 8);

  // Chart data
  const sourceData = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => { map[l.source || "Unknown"] = (map[l.source || "Unknown"] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [leads]);

  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => { map[l.pipeline_status] = (map[l.pipeline_status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [leads]);

  // Calendar
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);
  const today = new Date();

  const tempBadge = (temp: string) => {
    const cfg: Record<string, { emoji: string; label: string; cls: string }> = {
      hot: { emoji: "🔥", label: "Hot", cls: "bg-red-50 text-red-700 border-red-200" },
      warm: { emoji: "☀️", label: "Warm", cls: "bg-amber-50 text-amber-700 border-amber-200" },
      cold: { emoji: "❄️", label: "Cold", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    };
    const c = cfg[temp] || cfg.warm;
    return (
      <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", c.cls)}>
        {c.emoji} {c.label}
      </span>
    );
  };

  const metrics = [
    { label: "Pipeline", value: formatCurrency(pipelineValue), sub: `${activeLeads.length} active leads`, color: "from-primary to-primary-deep" },
    { label: "Active", value: activeLeads.length.toString(), sub: "In pipeline", color: "from-[hsl(199,89%,48%)] to-[hsl(199,89%,38%)]" },
    { label: "Hot", value: hotCount.toString(), sub: "High intent", color: "from-[hsl(0,84%,60%)] to-[hsl(0,84%,50%)]" },
    { label: "Unread", value: unreadCount.toString(), sub: "Never contacted", color: "from-[hsl(262,52%,47%)] to-[hsl(262,52%,37%)]" },
  ];

  const renderLabel = ({ name, percent }: { name: string; percent: number }) =>
    percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : "";

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getGreeting()}, Uzair</h1>
          <p className="text-sm text-muted-foreground">{format(today, "EEEE, MMMM d, yyyy · h:mm a")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", isRefetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
            <div className={cn("absolute top-0 left-0 w-1 h-full bg-gradient-to-b", m.color)} />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{m.label}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{m.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* LEFT — Needs Attention */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Needs Attention</h2>
            <span className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-0.5 rounded-full">
              {needsAttention.length}
            </span>
          </div>

          {needsAttention.length === 0 ? (
            <div className="border rounded-xl bg-card p-8 text-center text-muted-foreground text-sm">
              🎉 All leads are up to date!
            </div>
          ) : (
            <div className="space-y-2">
              {needsAttention.map((lead) => (
                <div key={lead.id} className="border rounded-xl bg-card p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground truncate">{lead.name}</span>
                      {tempBadge(lead.temperature)}
                      {lead.source && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {lead.source}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {lead.budget_max && <span>{formatCurrency(lead.budget_max)}</span>}
                      <span>Added {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Call">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </a>
                    )}
                    {lead.phone && (
                      <a href={`sms:${lead.phone}`} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Text">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Email">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </a>
                    )}
                    <Link to="/crm/leads" className="p-2 rounded-lg hover:bg-muted transition-colors" title="View">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link to="/crm/leads" className="text-sm font-medium text-primary hover:underline inline-block">
            View all leads →
          </Link>
        </div>

        {/* RIGHT Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Today's Focus */}
          <div className="border rounded-xl bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Today&apos;s Focus</h3>
            <p className="text-xs text-muted-foreground mb-3">{format(today, "EEEE, MMMM d")}</p>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <button
                  key={i}
                  className="w-full text-left border border-dashed border-border rounded-lg px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  + Add priority #{i}
                </button>
              ))}
            </div>
          </div>

          {/* Mini Calendar */}
          <div className="border rounded-xl bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" /> Calendar
              </h3>
              <div className="flex items-center gap-1">
                <button onClick={() => setCalMonth(new Date())} className="text-[10px] font-medium text-primary hover:underline mr-1">Today</button>
                <button onClick={() => setCalMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-1 rounded hover:bg-muted"><ChevronLeft className="h-3.5 w-3.5" /></button>
                <span className="text-xs font-medium text-foreground min-w-[100px] text-center">{format(calMonth, "MMMM yyyy")}</span>
                <button onClick={() => setCalMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-1 rounded hover:bg-muted"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-0 text-center text-[10px] font-medium text-muted-foreground mb-1">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <div key={d} className="py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0 text-center">
              {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} />)}
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "py-1.5 text-xs rounded-md",
                    isSameDay(day, today)
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-foreground hover:bg-muted cursor-pointer"
                  )}
                >
                  {format(day, "d")}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
              Connect Google Calendar
            </Button>
          </div>

          {/* Pipeline Insights */}
          <div className="border rounded-xl bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Pipeline Insights</h3>
            <Tabs defaultValue="sources">
              <TabsList className="w-full">
                <TabsTrigger value="sources" className="flex-1 text-xs">Sources</TabsTrigger>
                <TabsTrigger value="status" className="flex-1 text-xs">By Status</TabsTrigger>
              </TabsList>
              <TabsContent value="sources">
                <ChartView data={sourceData} />
              </TabsContent>
              <TabsContent value="status">
                <ChartView data={statusData} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartView({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">No data yet</p>;
  }

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value} (${((value / total) * 100).toFixed(0)}%)`, "Leads"]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(30,10%,90%)" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
        {data.slice(0, 6).map((d, i) => (
          <div key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
            {d.name} ({((d.value / total) * 100).toFixed(0)}%)
          </div>
        ))}
      </div>
    </div>
  );
}
