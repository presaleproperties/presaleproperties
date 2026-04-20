/**
 * AdminCampaignROI — Cost-per-Lead, Conversion Rate, Geo, Hour-of-Day.
 * The action layer above AdminPaidAdsDashboard: pair $ spend with leads
 * to surface real CPL and conversion rates per source/campaign.
 */
import { useState } from "react";
import { format, subDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { DollarSign, Target, MapPin, Clock, Plus, TrendingUp } from "lucide-react";

type Range = 7 | 30 | 90;

interface AdSpendRow {
  id: string;
  spend_date: string;
  utm_source: string;
  utm_campaign: string | null;
  amount: number;
  currency: string;
  notes: string | null;
}

function useROI(days: Range) {
  const since = subDays(new Date(), days).toISOString();
  const sinceDate = format(subDays(new Date(), days), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["campaign-roi", days],
    queryFn: async () => {
      const [leadsRes, spendRes, activityRes] = await Promise.all([
        supabase
          .from("project_leads")
          .select("utm_source, utm_campaign, lead_temperature, created_at, ip_address, form_type, city_interest")
          .gte("created_at", since),
        supabase
          .from("ad_spend")
          .select("*")
          .gte("spend_date", sinceDate),
        supabase
          .from("client_activity")
          .select("page_url, created_at")
          .gte("created_at", since)
          .eq("activity_type", "page_view"),
      ]);

      const leads = leadsRes.data || [];
      const spend = (spendRes.data || []) as AdSpendRow[];
      const activity = activityRes.data || [];

      // ── CPL by source/campaign ──────────────────────────────────────
      const spendBySource = new Map<string, number>();
      spend.forEach(s => {
        const k = `${s.utm_source}::${s.utm_campaign || ""}`;
        spendBySource.set(k, (spendBySource.get(k) || 0) + Number(s.amount));
      });
      const leadsBySource = new Map<string, { total: number; hot: number }>();
      leads.forEach(l => {
        const k = `${l.utm_source || "(direct)"}::${l.utm_campaign || ""}`;
        const existing = leadsBySource.get(k) || { total: 0, hot: 0 };
        existing.total++;
        if (l.lead_temperature === "hot") existing.hot++;
        leadsBySource.set(k, existing);
      });
      const cplRows = Array.from(new Set([...spendBySource.keys(), ...leadsBySource.keys()])).map(k => {
        const [src, camp] = k.split("::");
        const sp = spendBySource.get(k) || 0;
        const lc = leadsBySource.get(k) || { total: 0, hot: 0 };
        return {
          source: src,
          campaign: camp || "—",
          spend: sp,
          leads: lc.total,
          hot: lc.hot,
          cpl: lc.total > 0 ? sp / lc.total : 0,
          cphl: lc.hot > 0 ? sp / lc.hot : 0,
        };
      }).sort((a, b) => b.spend - a.spend);

      // ── Conversion rate by form/page ────────────────────────────────
      const lpViews = activity.filter(a => a.page_url?.includes("/lp/")).length;
      const organicViews = activity.filter(a => a.page_url?.includes("-presale-")).length;
      const lpLeads = leads.filter(l => l.form_type?.includes("_lp")).length;
      const organicLeads = leads.filter(l => !l.form_type?.includes("_lp") && l.form_type?.includes("project_inquiry")).length;
      const funnel = [
        { name: "Landing Pages (/lp/)", views: lpViews, leads: lpLeads, rate: lpViews > 0 ? (lpLeads / lpViews) * 100 : 0 },
        { name: "Organic project pages", views: organicViews, leads: organicLeads, rate: organicViews > 0 ? (organicLeads / organicViews) * 100 : 0 },
      ];

      // ── Geo (city of lead — uses project_city as proxy) ─────────────
      const geo = new Map<string, number>();
      leads.forEach(l => {
        const c = (Array.isArray(l.city_interest) ? l.city_interest[0] : l.city_interest) || "Unknown";
        geo.set(String(c), (geo.get(String(c)) || 0) + 1);
      });
      const geoRows = Array.from(geo.entries())
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // ── Hour-of-day heatmap ─────────────────────────────────────────
      const hourCounts = Array.from({ length: 24 }, (_, h) => ({ hour: h, leads: 0 }));
      leads.forEach(l => {
        const h = new Date(l.created_at).getHours();
        hourCounts[h].leads++;
      });

      // Totals
      const totalSpend = spend.reduce((s, r) => s + Number(r.amount), 0);
      const totalLeads = leads.length;
      const totalHot = leads.filter(l => l.lead_temperature === "hot").length;

      return {
        cplRows, funnel, geoRows, hourCounts,
        totalSpend, totalLeads, totalHot,
        avgCPL: totalLeads > 0 ? totalSpend / totalLeads : 0,
        avgCPHL: totalHot > 0 ? totalSpend / totalHot : 0,
      };
    },
    staleTime: 60_000,
  });
}

function AddSpendDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [source, setSource] = useState("meta");
  const [campaign, setCampaign] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a spend amount");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("ad_spend").insert({
      spend_date: date,
      utm_source: source,
      utm_campaign: campaign || null,
      amount: Number(amount),
      notes: notes || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Could not save", { description: error.message });
    } else {
      toast.success("Ad spend recorded");
      setOpen(false); setAmount(""); setCampaign(""); setNotes("");
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Log spend</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log ad spend</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div>
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta">Meta (FB/IG)</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Campaign (optional)</Label><Input value={campaign} onChange={e => setCampaign(e.target.value)} placeholder="spring_2026_burnaby" /></div>
          <div><Label>Amount (CAD)</Label><Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></div>
          <div><Label>Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCampaignROI() {
  const [range, setRange] = useState<Range>(30);
  const { data, isLoading, refetch } = useROI(range);

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Campaign ROI</h1>
            <p className="text-muted-foreground">Cost-per-lead, conversion rates, geographic + time patterns.</p>
          </div>
          <div className="flex items-center gap-2">
            {[7, 30, 90].map(d => (
              <Button key={d} variant={range === d ? "default" : "outline"} size="sm" onClick={() => setRange(d as Range)}>
                {d}d
              </Button>
            ))}
            <AddSpendDialog onSaved={() => refetch()} />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1"><DollarSign className="h-3 w-3" />Total spend</CardDescription><CardTitle className="text-2xl">${data?.totalSpend.toFixed(0)}</CardTitle></CardHeader></Card>
              <Card><CardHeader className="pb-2"><CardDescription>Total leads</CardDescription><CardTitle className="text-2xl">{data?.totalLeads}</CardTitle></CardHeader></Card>
              <Card><CardHeader className="pb-2"><CardDescription>Avg CPL</CardDescription><CardTitle className="text-2xl">${data?.avgCPL.toFixed(2)}</CardTitle></CardHeader></Card>
              <Card><CardHeader className="pb-2"><CardDescription>Cost per hot lead</CardDescription><CardTitle className="text-2xl">${data?.avgCPHL.toFixed(2)}</CardTitle></CardHeader></Card>
            </div>

            <Tabs defaultValue="cpl">
              <TabsList>
                <TabsTrigger value="cpl"><Target className="h-4 w-4 mr-2" />CPL by source</TabsTrigger>
                <TabsTrigger value="funnel"><TrendingUp className="h-4 w-4 mr-2" />Funnel</TabsTrigger>
                <TabsTrigger value="geo"><MapPin className="h-4 w-4 mr-2" />Geography</TabsTrigger>
                <TabsTrigger value="hours"><Clock className="h-4 w-4 mr-2" />Hour of day</TabsTrigger>
              </TabsList>

              <TabsContent value="cpl">
                <Card>
                  <CardHeader><CardTitle>Cost-per-lead by source / campaign</CardTitle><CardDescription>Spend ÷ leads. Lower is better.</CardDescription></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader><TableRow><TableHead>Source</TableHead><TableHead>Campaign</TableHead><TableHead className="text-right">Spend</TableHead><TableHead className="text-right">Leads</TableHead><TableHead className="text-right">Hot</TableHead><TableHead className="text-right">CPL</TableHead><TableHead className="text-right">Cost / hot</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {data?.cplRows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Log some ad spend to see CPL.</TableCell></TableRow>}
                        {data?.cplRows.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell><Badge variant="outline">{r.source}</Badge></TableCell>
                            <TableCell>{r.campaign}</TableCell>
                            <TableCell className="text-right">${r.spend.toFixed(0)}</TableCell>
                            <TableCell className="text-right">{r.leads}</TableCell>
                            <TableCell className="text-right">{r.hot}</TableCell>
                            <TableCell className="text-right font-semibold">{r.cpl > 0 ? `$${r.cpl.toFixed(2)}` : "—"}</TableCell>
                            <TableCell className="text-right">{r.cphl > 0 ? `$${r.cphl.toFixed(2)}` : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="funnel">
                <Card>
                  <CardHeader><CardTitle>Form conversion rate</CardTitle><CardDescription>Leads ÷ page views per surface.</CardDescription></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader><TableRow><TableHead>Surface</TableHead><TableHead className="text-right">Views</TableHead><TableHead className="text-right">Leads</TableHead><TableHead className="text-right">Conv. rate</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {data?.funnel.map((f, i) => (
                          <TableRow key={i}>
                            <TableCell>{f.name}</TableCell>
                            <TableCell className="text-right">{f.views}</TableCell>
                            <TableCell className="text-right">{f.leads}</TableCell>
                            <TableCell className="text-right font-semibold">{f.rate.toFixed(2)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="geo">
                <Card>
                  <CardHeader><CardTitle>Top cities by lead volume</CardTitle></CardHeader>
                  <CardContent>
                    <ChartContainer className="h-[300px]" config={{ count: { label: "Leads", color: "hsl(var(--primary))" } }}>
                      <ResponsiveContainer><BarChart data={data?.geoRows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="city" /><YAxis /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hours">
                <Card>
                  <CardHeader><CardTitle>Leads by hour of day</CardTitle><CardDescription>When to schedule ad budget for max conversion.</CardDescription></CardHeader>
                  <CardContent>
                    <ChartContainer className="h-[300px]" config={{ leads: { label: "Leads", color: "hsl(var(--primary))" } }}>
                      <ResponsiveContainer><BarChart data={data?.hourCounts}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="hour" /><YAxis /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
