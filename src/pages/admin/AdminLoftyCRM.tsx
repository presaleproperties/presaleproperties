import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Users,
  Phone,
  Mail,
  Tag,
  FileText,
  Globe,
  BarChart3,
  Zap,
  ArrowRight,
  Copy,
  ExternalLink,
  Search,
  Clock,
  MapPin,
  User,
  Hash,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────
interface ProjectLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  lead_source: string | null;
  lead_score: number | null;
  lead_temperature: string | null;
  lofty_id: string | null;
  lofty_synced_at: string | null;
  form_type: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  pages_viewed: number | null;
  time_on_site: number | null;
  session_count: number | null;
  used_calculator: boolean | null;
  device_type: string | null;
  tracking_data: any | null;
  created_at: string;
  presale_projects: { name: string; city: string } | null;
}

// ─── Field Mapping Definition ────────────────────────────────────────
const FIELD_MAPPINGS = [
  {
    category: "Contact Identity",
    icon: User,
    color: "text-blue-500",
    fields: [
      { website: "firstName", lofty: "first_name", description: "Lead's first name", example: "John" },
      { website: "lastName", lofty: "last_name", description: "Lead's last name", example: "Smith" },
      { website: "email", lofty: "email", description: "Email address (primary key for dedup)", example: "john@email.com" },
      { website: "phone", lofty: "phone", description: "Phone number (verified via SMS OTP)", example: "+16045550000" },
    ],
  },
  {
    category: "Lead Source & Tags",
    icon: Tag,
    color: "text-emerald-500",
    fields: [
      { website: "formType / lead_source", lofty: "source", description: "Where the lead originated", example: "PresaleProperties.com" },
      { website: "projectName + projectCity", lofty: "tags[0-1]", description: "Project and city as searchable tags", example: "Eden, Langley" },
      { website: "leadTemperature", lofty: "tags[2]", description: "Hot / Warm / Cold classification", example: "hot" },
      { website: "formType", lofty: "tags[3]", description: "Form type as a tag", example: "project-inquiry" },
      { website: "usedCalculator", lofty: "tags[4]", description: "Calculator engagement tag", example: "used-calculator" },
      { website: "utmSource", lofty: "tags[5]", description: "Traffic source tag", example: "src-google" },
      { website: "sessionCount", lofty: "tags[6]", description: "New vs returning visitor", example: "returning-visitor" },
    ],
  },
  {
    category: "Lead Intelligence (Notes)",
    icon: FileText,
    color: "text-violet-500",
    fields: [
      { website: "leadScore", lofty: "note → Score", description: "0-10 behavioral score", example: "8/10 (HOT)" },
      { website: "leadTemperature", lofty: "note → Temperature", description: "Hot / Warm / Cold", example: "HOT" },
      { website: "deviceType", lofty: "note → Device", description: "mobile or desktop", example: "mobile" },
      { website: "userLanguage", lofty: "note → Language", description: "Browser language", example: "en-CA" },
      { website: "message", lofty: "note → Message", description: "Lead's free-text message", example: "Interested in 2-bed units" },
    ],
  },
  {
    category: "Traffic Attribution (Notes)",
    icon: Globe,
    color: "text-orange-500",
    fields: [
      { website: "utmSource", lofty: "note → UTM Source", description: "Traffic source", example: "google" },
      { website: "utmMedium", lofty: "note → UTM Medium", description: "Traffic medium", example: "cpc" },
      { website: "utmCampaign", lofty: "note → UTM Campaign", description: "Campaign name", example: "langley-presale-2025" },
      { website: "utmTerm", lofty: "note → UTM Term", description: "Paid keyword", example: "presale condos langley" },
      { website: "referrerUrl", lofty: "note → Referrer", description: "Previous page", example: "google.com" },
      { website: "landingPage", lofty: "note → Landing Page", description: "First page visited", example: "/presale-projects/eden" },
    ],
  },
  {
    category: "Behavioral Data (Notes)",
    icon: BarChart3,
    color: "text-teal-500",
    fields: [
      { website: "pagesViewed", lofty: "note → Pages Viewed", description: "Total pages in session", example: "7" },
      { website: "timeOnSite", lofty: "note → Time on Site", description: "Seconds spent on site", example: "342s" },
      { website: "sessionCount", lofty: "note → Visit Number", description: "How many sessions", example: "2" },
      { website: "firstVisitDate", lofty: "note → First Visit", description: "First ever visit date", example: "2025-03-10" },
      { website: "usedCalculator", lofty: "note → Used Calculator", description: "ROI calculator usage", example: "YES" },
      { website: "pagesVisited", lofty: "note → Pages Visited", description: "Array of page URLs", example: "[/projects/eden, /contact]" },
      { website: "calculatorData", lofty: "note → Calculator Data", description: "Calculator inputs/outputs", example: '{"price":600000,"rent":2400}' },
    ],
  },
];

// ─── Sync Status Badge ───────────────────────────────────────────────
function SyncBadge({ loftyId, syncedAt }: { loftyId: string | null; syncedAt: string | null }) {
  if (loftyId) {
    return (
      <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" />
        Synced
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200 bg-amber-50">
      <AlertCircle className="h-3 w-3" />
      Pending
    </Badge>
  );
}

// ─── Temperature Badge ───────────────────────────────────────────────
function TempBadge({ temp, score }: { temp: string | null; score: number | null }) {
  if (!temp) return null;
  const cfg = {
    hot: "bg-red-500/10 text-red-600 border-red-200",
    warm: "bg-amber-500/10 text-amber-600 border-amber-200",
    cold: "bg-blue-500/10 text-blue-500 border-blue-200",
  }[temp] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge className={cn("gap-1 text-xs border", cfg)}>
      {temp.toUpperCase()} {score !== null ? `· ${score}/10` : ""}
    </Badge>
  );
}

// ─── Lead Row ────────────────────────────────────────────────────────
function LeadSyncRow({
  lead,
  onResync,
  syncing,
}: {
  lead: ProjectLead;
  onResync: (id: string) => void;
  syncing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const tracking = lead.tracking_data as Record<string, any> | null;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Main row */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0 grid grid-cols-[1fr_1fr_120px_80px_80px] gap-3 items-center">
          {/* Name + email */}
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{lead.name}</p>
            <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
          </div>
          {/* Project */}
          <div className="min-w-0">
            {lead.presale_projects ? (
              <p className="text-xs truncate">
                <span className="font-medium">{lead.presale_projects.name}</span>
                <span className="text-muted-foreground"> · {lead.presale_projects.city}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">—</p>
            )}
            <p className="text-xs text-muted-foreground">{format(new Date(lead.created_at), "MMM d, h:mm a")}</p>
          </div>
          {/* Temp + score */}
          <div>
            <TempBadge temp={lead.lead_temperature} score={lead.lead_score} />
          </div>
          {/* Lofty sync */}
          <div>
            <SyncBadge loftyId={lead.lofty_id} syncedAt={lead.lofty_synced_at} />
          </div>
          {/* Lofty ID */}
          <div className="text-xs text-muted-foreground font-mono truncate">
            {lead.lofty_id ? (
              <span title={lead.lofty_id}>#{lead.lofty_id.slice(0, 8)}…</span>
            ) : "—"}
          </div>
        </div>

        {/* Re-sync button */}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 shrink-0"
          disabled={syncing}
          onClick={(e) => {
            e.stopPropagation();
            onResync(lead.id);
          }}
        >
          <RefreshCw className={cn("h-3 w-3", syncing && "animate-spin")} />
          Re-sync
        </Button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t bg-muted/20 p-4 grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider">Fields Sent to Lofty</p>
            <FieldRow icon={User} label="Name" value={lead.name} />
            <FieldRow icon={Mail} label="Email" value={lead.email} />
            <FieldRow icon={Phone} label="Phone" value={lead.phone ?? "—"} />
            <FieldRow icon={Tag} label="Source" value="PresaleProperties.com" />
            <FieldRow icon={Tag} label="Form Type" value={lead.form_type ?? lead.lead_source ?? "—"} />
            <FieldRow icon={Globe} label="UTM Source" value={lead.utm_source ?? "direct"} />
            <FieldRow icon={Globe} label="UTM Campaign" value={lead.utm_campaign ?? "—"} />
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider">Behavioral Data</p>
            <FieldRow icon={BarChart3} label="Pages Viewed" value={String(lead.pages_viewed ?? 0)} />
            <FieldRow icon={Clock} label="Time on Site" value={`${lead.time_on_site ?? 0}s`} />
            <FieldRow icon={Hash} label="Sessions" value={String(lead.session_count ?? 1)} />
            <FieldRow icon={Zap} label="Used Calculator" value={lead.used_calculator ? "YES ✓" : "No"} />
            <FieldRow icon={BarChart3} label="Lead Score" value={lead.lead_score !== null ? `${lead.lead_score}/10` : "—"} />
            <FieldRow icon={BarChart3} label="Temperature" value={lead.lead_temperature?.toUpperCase() ?? "—"} />
            {tracking?.pagesVisited && (
              <FieldRow icon={Globe} label="Pages Visited" value={Array.isArray(tracking.pagesVisited) ? tracking.pagesVisited.join(", ") : "—"} />
            )}
          </div>
          {lead.lofty_id && (
            <div className="col-span-2 pt-2 border-t flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-muted-foreground">Lofty Contact ID:</span>
              <code className="font-mono text-foreground">{lead.lofty_id}</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  navigator.clipboard.writeText(lead.lofty_id!);
                  toast.success("Copied Lofty ID");
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="font-medium text-foreground break-all">{value}</span>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function AdminLoftyCRM() {
  const [search, setSearch] = useState("");
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testForm, setTestForm] = useState({
    firstName: "Test",
    lastName: "Lead",
    email: `test-${Date.now()}@presaleproperties.com`,
    phone: "+16045550001",
    projectName: "Eden",
    projectCity: "Langley",
    message: "This is a test lead from the Admin Lofty CRM portal",
  });

  // Fetch leads with Lofty sync data
  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ["lofty-leads"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("project_leads")
        .select(`
          id, name, email, phone, lead_source, lead_score, lead_temperature,
          lofty_id, lofty_synced_at, form_type, utm_source, utm_medium, utm_campaign,
          pages_viewed, time_on_site, session_count, used_calculator, device_type,
          tracking_data, created_at,
          presale_projects (name, city)
        `)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as ProjectLead[];
    },
  });

  // Stats
  const syncedCount = leads.filter((l) => l.lofty_id).length;
  const unsyncedCount = leads.filter((l) => !l.lofty_id).length;
  const hotLeads = leads.filter((l) => l.lead_temperature === "hot").length;
  const withTracking = leads.filter((l) => l.lead_score !== null).length;

  // Filtered leads
  const filtered = leads.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.name?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.presale_projects?.name?.toLowerCase().includes(q)
    );
  });

  // Re-sync a single lead to Lofty
  const handleResync = async (leadId: string) => {
    setSyncingId(leadId);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/sync-lead-to-lofty`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Synced to Lofty — ID: ${data.loftyId ?? "updated"}`);
        // Update lofty_id in DB
        if (data.loftyId) {
          await (supabase as any)
            .from("project_leads")
            .update({ lofty_id: data.loftyId, lofty_synced_at: new Date().toISOString() })
            .eq("id", leadId);
        }
        refetch();
      } else {
        toast.error(`Lofty sync failed: ${data.error ?? "Unknown error"}`);
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  // Send test lead
  const handleSendTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/sync-lead-to-lofty`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          leadData: {
            firstName: testForm.firstName,
            lastName: testForm.lastName,
            email: testForm.email,
            phone: testForm.phone,
            formType: "admin_test",
            projectName: testForm.projectName,
            projectCity: testForm.projectCity,
            projectUrl: "https://presaleproperties.com",
            message: testForm.message,
            leadScore: 8,
            leadTemperature: "hot",
            utmSource: "admin-test",
            utmMedium: "direct",
            utmCampaign: "crm-test",
            utmTerm: "",
            referrerUrl: "admin.presaleproperties.com",
            landingPage: "https://presaleproperties.com/admin/lofty-crm",
            currentPageUrl: "https://presaleproperties.com/admin/lofty-crm",
            currentPageTitle: "Admin Lofty CRM Test",
            pagesViewed: 5,
            pagesVisited: JSON.stringify(["/", "/presale-projects/eden", "/contact"]),
            timeOnSite: 180,
            sessionCount: 2,
            firstVisitDate: new Date().toISOString().split("T")[0],
            usedCalculator: true,
            calculatorData: JSON.stringify({ purchasePrice: 600000, downPayment: 120000, rentEstimate: 2400 }),
            deviceType: "desktop",
            userLanguage: "en-CA",
          },
        }),
      });
      const data = await res.json();
      setTestResult({ ...data, httpStatus: res.status, timestamp: new Date().toISOString() });
      if (data.success) {
        toast.success(`✅ Test lead sent! Lofty ${data.action}: ${data.loftyId ?? "contact updated"}`);
      } else {
        toast.error(`Test failed: ${data.error ?? data.details ?? "Unknown"}`);
      }
    } catch (e: any) {
      setTestResult({ success: false, error: e.message, timestamp: new Date().toISOString() });
      toast.error(`Error: ${e.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Lofty CRM Integration · Admin</title>
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lofty CRM Integration</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Direct API sync · Every lead from PresaleProperties.com → Lofty CRM
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => window.open("https://crm.lofty.com", "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
              Open Lofty CRM
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Leads", value: leads.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Synced to Lofty", value: syncedCount, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Pending Sync", value: unsyncedCount, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Hot Leads", value: hotLeads, icon: Zap, color: "text-red-500", bg: "bg-red-500/10" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="leads">
          <TabsList>
            <TabsTrigger value="leads">Lead Sync Log</TabsTrigger>
            <TabsTrigger value="fields">Field Mapping</TabsTrigger>
            <TabsTrigger value="test">Test Integration</TabsTrigger>
            <TabsTrigger value="flow">How It Works</TabsTrigger>
          </TabsList>

          {/* ── Lead Sync Log ── */}
          <TabsContent value="leads" className="space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, project…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Badge variant="outline" className="text-xs">
                {filtered.length} leads
              </Badge>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_1fr_120px_80px_80px] gap-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Lead</span>
              <span>Project</span>
              <span>Score</span>
              <span>Lofty</span>
              <span>Lofty ID</span>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 bg-muted/40 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No leads found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((lead) => (
                  <LeadSyncRow
                    key={lead.id}
                    lead={lead}
                    onResync={handleResync}
                    syncing={syncingId === lead.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Field Mapping ── */}
          <TabsContent value="fields" className="mt-4 space-y-4">
            <div className="text-sm text-muted-foreground">
              Every field captured on PresaleProperties.com and how it maps to Lofty CRM.
            </div>
            {FIELD_MAPPINGS.map((group) => (
              <Card key={group.category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <group.icon className={cn("h-4 w-4", group.color)} />
                    {group.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-0">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_1fr_2fr_1fr] gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 border-b">
                      <span>Website Field</span>
                      <span>Lofty Field</span>
                      <span>Description</span>
                      <span>Example Value</span>
                    </div>
                    {group.fields.map((field, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[1fr_1fr_2fr_1fr] gap-3 py-2.5 border-b last:border-0 text-sm hover:bg-muted/30 transition-colors rounded"
                      >
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-primary self-start">
                          {field.website}
                        </code>
                        <div className="flex items-center gap-1.5">
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono self-start">
                            {field.lofty}
                          </code>
                        </div>
                        <span className="text-xs text-muted-foreground">{field.description}</span>
                        <span className="text-xs text-muted-foreground font-mono truncate">{field.example}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ── Test Integration ── */}
          <TabsContent value="test" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" />
                    Send Test Lead to Lofty
                  </CardTitle>
                  <CardDescription>
                    Fires a real API call to Lofty with full tracking data. Check your Lofty CRM after sending.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "firstName", label: "First Name" },
                      { key: "lastName", label: "Last Name" },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">{label}</label>
                        <Input
                          value={(testForm as any)[key]}
                          onChange={(e) => setTestForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  {[
                    { key: "email", label: "Email" },
                    { key: "phone", label: "Phone" },
                    { key: "projectName", label: "Project Name" },
                    { key: "projectCity", label: "Project City" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{label}</label>
                      <Input
                        value={(testForm as any)[key]}
                        onChange={(e) => setTestForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Message</label>
                    <textarea
                      value={testForm.message}
                      onChange={(e) => setTestForm((f) => ({ ...f, message: e.target.value }))}
                      className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-input bg-background resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50"
                    />
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={handleSendTest}
                    disabled={testLoading}
                  >
                    {testLoading ? (
                      <><RefreshCw className="h-4 w-4 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="h-4 w-4" /> Send Test Lead to Lofty</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    This sends a real contact to Lofty CRM with score 8/10 + full behavioral data
                  </p>
                </CardContent>
              </Card>

              {/* Result */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    API Response
                  </CardTitle>
                  <CardDescription>
                    Raw response from the Lofty API after sending your test lead.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {testResult ? (
                    <div className="space-y-3">
                      <div className={cn(
                        "flex items-center gap-2 p-3 rounded-lg",
                        testResult.success ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"
                      )}>
                        {testResult.success ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-sm">
                            {testResult.success ? `✅ ${(testResult.action || "synced").toUpperCase()}` : "❌ Failed"}
                          </p>
                          <p className="text-xs opacity-80">
                            {testResult.timestamp ? format(new Date(testResult.timestamp), "h:mm:ss a") : ""}
                          </p>
                        </div>
                      </div>

                      {testResult.loftyId && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Lofty Contact ID:</span>
                          <code className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{testResult.loftyId}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              navigator.clipboard.writeText(testResult.loftyId);
                              toast.success("Copied");
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      <Separator />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Full Response</p>
                        <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64 font-mono whitespace-pre-wrap">
                          {JSON.stringify(testResult, null, 2)}
                        </pre>
                      </div>

                      {testResult.success && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => window.open("https://crm.lofty.com", "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                          View in Lofty CRM
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Send className="h-8 w-8 opacity-20" />
                      <p className="text-sm">Send a test to see the API response here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── How It Works ── */}
          <TabsContent value="flow" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Integration Architecture</CardTitle>
                <CardDescription>
                  How every lead flows from the website into Lofty CRM with full tracking data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      step: "1",
                      title: "Visitor lands on PresaleProperties.com",
                      detail: "App.tsx captures UTM params, landing page, referrer URL, and session data into sessionStorage & localStorage immediately.",
                      color: "bg-blue-500",
                    },
                    {
                      step: "2",
                      title: "Lead fills out any form on the site",
                      detail: "All 6 lead forms (project pages, modal, mobile CTA, exit popup, contact, calculator) use the unified useLeadSubmission() hook.",
                      color: "bg-violet-500",
                    },
                    {
                      step: "3",
                      title: "Phone number verified via SMS OTP",
                      detail: "Before submission completes, Twilio sends a 6-digit code to the phone number. Form is blocked until the code is verified.",
                      color: "bg-amber-500",
                    },
                    {
                      step: "4",
                      title: "Lead saved to database",
                      detail: "Lead is inserted into project_leads with all form fields + UTM attribution + behavioral scores. This always succeeds regardless of CRM sync.",
                      color: "bg-emerald-500",
                    },
                    {
                      step: "5",
                      title: "Behavioral data collected & scored",
                      detail: "collectTrackingData() reads all session/local storage. calculateLeadScore() computes a 0-10 score and Hot/Warm/Cold temperature.",
                      color: "bg-teal-500",
                    },
                    {
                      step: "6",
                      title: "sync-lead-to-lofty Edge Function fires",
                      detail: "Non-blocking fire-and-forget POST to the edge function. Checks if contact already exists in Lofty (dedup by email). Creates new or updates existing contact with merged tags and appended notes.",
                      color: "bg-primary",
                    },
                    {
                      step: "7",
                      title: "Contact appears in Lofty CRM",
                      detail: "Full contact with name, email, phone, tags (project, city, temperature, form type), and a detailed notes block containing all behavioral and attribution data.",
                      color: "bg-rose-500",
                    },
                    {
                      step: "8",
                      title: "Hot leads trigger immediate alert",
                      detail: "If leadScore ≥ 8, the send-lead-notification function is called to send a WhatsApp/Email alert to Uzair with the full lead details.",
                      color: "bg-orange-500",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5", item.color)}>
                        {item.step}
                      </div>
                      <div className="flex-1 pb-4 border-b last:border-0">
                        <p className="font-semibold text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Forms Connected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-2">
                  {[
                    { form: "Project Lead Form", path: "src/components/projects/ProjectLeadForm.tsx", type: "project_inquiry", status: "live" },
                    { form: "Mobile CTA Bar", path: "src/components/projects/ProjectMobileCTA.tsx", type: "project_inquiry", status: "live" },
                    { form: "Access Pack Modal", path: "src/components/conversion/AccessPackModal.tsx", type: "vip_access", status: "live" },
                    { form: "Exit Intent Popup", path: "src/components/conversion/ExitIntentPopup.tsx", type: "exit_popup", status: "live" },
                    { form: "Calculator Lead Capture", path: "src/components/conversion/CalculatorLeadCapture.tsx", type: "calculator", status: "live" },
                    { form: "Contact Page", path: "src/pages/Contact.tsx", type: "contact", status: "live" },
                  ].map((f) => (
                    <div key={f.form} className="flex items-center gap-3 p-2.5 rounded-lg border">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{f.form}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{f.type}</p>
                      </div>
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50 shrink-0">
                        Live
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
