import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Send, Clock, Mail, BarChart3, Eye, MousePointer, Users, ArrowLeft, ArrowRight, Bold, Italic, Link, Image, Copy, Pencil, Trash2, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const PIPELINE_GROUPS = [
  { value: "All Leads", label: "All Leads" },
  { value: "New Lead", label: "New Leads" },
  { value: "Pre-Sale", label: "Pre-Sale 🔥" },
  { value: "Re-Sale", label: "Re-Sale 🔥" },
  { value: "Commercial", label: "Commercial" },
  { value: "Showing Booked", label: "Showing Booked" },
  { value: "Offer Made", label: "Offer Made" },
  { value: "Nurturing", label: "Nurturing" },
  { value: "Closed", label: "Closed" },
  { value: "Lost", label: "Lost/Cold" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-700",
  sending: "bg-yellow-100 text-yellow-700",
  sent: "bg-green-100 text-green-700",
};

const CHART_COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

export default function CrmEmailCenter() {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [composeStep, setComposeStep] = useState(1);
  const [draft, setDraft] = useState({ name: "", subject: "", html_content: "", recipients_group: "All Leads" });
  const queryClient = useQueryClient();

  const { data: campaigns = [] } = useQuery({
    queryKey: ["crm-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_email_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["crm-leads-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_leads").select("id, name, email, pipeline_status");
      if (error) throw error;
      return data;
    },
  });

  const recipientCount = useMemo(() => {
    if (draft.recipients_group === "All Leads") return leads.length;
    return leads.filter((l) => l.pipeline_status === draft.recipients_group).length;
  }, [leads, draft.recipients_group]);

  const createCampaign = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("crm_email_campaigns").insert({
        name: draft.name,
        subject: draft.subject,
        html_content: draft.html_content,
        status,
        recipients_group: draft.recipients_group,
        recipients_count: recipientCount,
        ...(status === "sent" ? { sent_at: new Date().toISOString() } : {}),
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["crm-campaigns"] });
      toast.success(status === "draft" ? "Campaign saved as draft" : "Campaign sent!");
      setDraft({ name: "", subject: "", html_content: "", recipients_group: "All Leads" });
      setComposeStep(1);
      setActiveTab("campaigns");
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_email_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-campaigns"] });
      toast.success("Campaign deleted");
    },
  });

  const duplicateCampaign = useMutation({
    mutationFn: async (c: any) => {
      const { error } = await supabase.from("crm_email_campaigns").insert({
        name: c.name + " (Copy)",
        subject: c.subject,
        html_content: c.html_content,
        status: "draft",
        recipients_group: c.recipients_group,
        recipients_count: 0,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-campaigns"] });
      toast.success("Campaign duplicated");
    },
  });

  // Analytics data
  const sentCampaigns = campaigns.filter((c) => c.status === "sent");
  const totalSent = sentCampaigns.reduce((s, c) => s + (c.recipients_count || 0), 0);
  const avgOpen = sentCampaigns.length ? sentCampaigns.reduce((s, c) => s + (c.recipients_count ? ((c.open_count || 0) / c.recipients_count) * 100 : 0), 0) / sentCampaigns.length : 0;
  const avgClick = sentCampaigns.length ? sentCampaigns.reduce((s, c) => s + (c.recipients_count ? ((c.click_count || 0) / c.recipients_count) * 100 : 0), 0) / sentCampaigns.length : 0;

  const previewHtml = draft.html_content
    .replace(/\{\{first_name\}\}/g, "Sarah")
    .replace(/\{\{project_name\}\}/g, "The Grand on King")
    .replace(/\{\{agent_name\}\}/g, "Uzair Muhammad");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Email Center</h1>
        <p className="text-muted-foreground text-sm">Create, send, and track email campaigns to your leads</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="campaigns" className="gap-1.5"><Mail className="h-4 w-4" />Campaigns</TabsTrigger>
          <TabsTrigger value="compose" className="gap-1.5"><Pencil className="h-4 w-4" />Compose</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
        </TabsList>

        {/* CAMPAIGNS TAB */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setActiveTab("compose"); setComposeStep(1); }} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />New Campaign
            </Button>
          </div>

          {campaigns.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Mail className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No campaigns yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Create your first campaign to reach your leads.</p>
                <Button onClick={() => setActiveTab("compose")} className="bg-primary hover:bg-primary/90">Create Campaign</Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Open Rate</TableHead>
                    <TableHead>Click Rate</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => {
                    const openRate = c.recipients_count ? ((c.open_count || 0) / c.recipients_count * 100).toFixed(1) : "—";
                    const clickRate = c.recipients_count ? ((c.click_count || 0) / c.recipients_count * 100).toFixed(1) : "—";
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>
                          <Badge className={`${STATUS_COLORS[c.status] || STATUS_COLORS.draft} capitalize`}>{c.status}</Badge>
                        </TableCell>
                        <TableCell>{c.recipients_count || 0}</TableCell>
                        <TableCell>{openRate === "—" ? "—" : `${openRate}%`}</TableCell>
                        <TableCell>{clickRate === "—" ? "—" : `${clickRate}%`}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateCampaign.mutate(c)}><Copy className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteCampaign.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* COMPOSE TAB */}
        <TabsContent value="compose" className="space-y-4">
          {/* Step indicators */}
          <div className="flex items-center gap-2 text-sm">
            {["Details", "Recipients", "Content", "Preview", "Send"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <button
                  onClick={() => setComposeStep(i + 1)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    composeStep === i + 1 ? "bg-primary text-primary-foreground" : composeStep > i + 1 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-current">{i + 1}</span>
                  {label}
                </button>
                {i < 4 && <div className="w-6 h-px bg-border" />}
              </div>
            ))}
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              {composeStep === 1 && (
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Campaign Name</label>
                    <Input placeholder="e.g. March Pre-Sale Newsletter" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Subject Line</label>
                    <Input placeholder="e.g. New Pre-Sale Units Just Released 🏗️" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
                  </div>
                </div>
              )}

              {composeStep === 2 && (
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Select Recipient Group</label>
                    <Select value={draft.recipients_group} onValueChange={(v) => setDraft({ ...draft, recipients_group: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PIPELINE_GROUPS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{recipientCount} lead{recipientCount !== 1 ? "s" : ""} will receive this campaign</span>
                  </div>
                </div>
              )}

              {composeStep === 3 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground block">Email Body</label>
                  <div className="flex gap-1 border-b pb-2">
                    <Button variant="ghost" size="sm" className="h-8 px-2"><Bold className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2"><Italic className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2"><Link className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2"><Image className="h-4 w-4" /></Button>
                  </div>
                  <Textarea
                    className="min-h-[300px] font-mono text-sm"
                    placeholder={"Hi {{first_name}},\n\nExciting new presale units just dropped...\n\nBest,\n{{agent_name}}"}
                    value={draft.html_content}
                    onChange={(e) => setDraft({ ...draft, html_content: e.target.value })}
                  />
                  <div className="flex gap-2 flex-wrap">
                    {["{{first_name}}", "{{project_name}}", "{{agent_name}}"].map((tag) => (
                      <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setDraft({ ...draft, html_content: draft.html_content + tag })}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {composeStep === 4 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Preview</h3>
                  <div className="border rounded-lg p-4 max-w-2xl bg-white">
                    <div className="text-xs text-muted-foreground mb-2">Subject: <span className="font-medium text-foreground">{draft.subject || "(no subject)"}</span></div>
                    <div className="text-xs text-muted-foreground mb-4">To: {recipientCount} recipients ({draft.recipients_group})</div>
                    <div className="border-t pt-4 whitespace-pre-wrap text-sm text-foreground">{previewHtml || "(empty body)"}</div>
                  </div>
                </div>
              )}

              {composeStep === 5 && (
                <div className="space-y-4 max-w-lg">
                  <h3 className="text-sm font-medium text-foreground">Ready to send?</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Campaign:</strong> {draft.name || "Untitled"}</p>
                    <p><strong>Subject:</strong> {draft.subject || "(no subject)"}</p>
                    <p><strong>Recipients:</strong> {recipientCount} leads ({draft.recipients_group})</p>
                  </div>
                  <div className="flex gap-3">
                    <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => createCampaign.mutate("sent")} disabled={!draft.name || !draft.subject}>
                      <Send className="h-4 w-4" />Send Now
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => createCampaign.mutate("draft")}>
                      <Clock className="h-4 w-4" />Save as Draft
                    </Button>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t">
                <Button variant="ghost" disabled={composeStep === 1} onClick={() => setComposeStep((s) => s - 1)} className="gap-1">
                  <ArrowLeft className="h-4 w-4" />Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => createCampaign.mutate("draft")} disabled={!draft.name}>Save Draft</Button>
                  {composeStep < 5 && (
                    <Button onClick={() => setComposeStep((s) => s + 1)} className="gap-1 bg-primary hover:bg-primary/90">
                      Next<ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Sent", value: totalSent, icon: Send, color: "text-primary" },
              { label: "Avg Open Rate", value: `${avgOpen.toFixed(1)}%`, icon: MailOpen, color: "text-green-600" },
              { label: "Avg Click Rate", value: `${avgClick.toFixed(1)}%`, icon: MousePointer, color: "text-blue-600" },
              { label: "Campaigns", value: sentCampaigns.length, icon: Mail, color: "text-amber-600" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</span>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Sends Over Time</CardTitle></CardHeader>
              <CardContent>
                {sentCampaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No sent campaigns yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={sentCampaigns.map((c) => ({ name: format(new Date(c.sent_at || c.created_at), "MMM d"), sent: c.recipients_count || 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Line type="monotone" dataKey="sent" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Open Rate by Campaign</CardTitle></CardHeader>
              <CardContent>
                {sentCampaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sentCampaigns.slice(0, 8).map((c) => ({ name: c.name.slice(0, 15), rate: c.recipients_count ? +((c.open_count || 0) / c.recipients_count * 100).toFixed(1) : 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                        {sentCampaigns.slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {sentCampaigns.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Top Performing Campaigns</CardTitle></CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Opens</TableHead>
                    <TableHead>Open Rate</TableHead>
                    <TableHead>Clicks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sentCampaigns.sort((a, b) => (b.open_count || 0) - (a.open_count || 0)).slice(0, 5).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.recipients_count}</TableCell>
                      <TableCell>{c.open_count || 0}</TableCell>
                      <TableCell>{c.recipients_count ? ((c.open_count || 0) / c.recipients_count * 100).toFixed(1) + "%" : "—"}</TableCell>
                      <TableCell>{c.click_count || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
