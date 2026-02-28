import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, startOfDay } from "date-fns";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Users, Building2, Home, Search, Download, ExternalLink,
  Mail, Phone, Eye, BarChart3, Inbox, MessageSquare, CheckCircle2,
  XCircle, Star, TrendingUp, ChevronDown, Pencil, Save, X,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LeadDetailsModal } from "@/components/admin/LeadDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "dead";

interface ProjectLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  persona: string | null;
  home_size: string | null;
  agent_status: string | null;
  lead_source: string | null;
  landing_page: string | null;
  created_at: string;
  project_id: string | null;
  intent_score: number | null;
  lead_status: LeadStatus;
  admin_notes: string | null;
  contacted_at: string | null;
  converted_at: string | null;
  timeline: string | null;
  budget: string | null;
  presale_projects: { name: string; slug: string; city: string } | null;
}

interface ListingLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  created_at: string;
  listing_id: string;
  listings: { title: string; project_name: string; city: string } | null;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  new:       { label: "New",       color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",   icon: <Star className="h-3 w-3" /> },
  contacted: { label: "Contacted", color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",  icon: <Phone className="h-3 w-3" /> },
  qualified: { label: "Qualified", color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200", icon: <TrendingUp className="h-3 w-3" /> },
  converted: { label: "Converted", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",icon: <CheckCircle2 className="h-3 w-3" /> },
  dead:      { label: "Dead",      color: "text-slate-500",   bg: "bg-slate-50",   border: "border-slate-200",  icon: <XCircle className="h-3 w-3" /> },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getLeadSourceLabel = (source: string | null) => {
  if (!source) return "Floor Plans";
  if (source.startsWith("city_list_")) {
    const city = source.replace("city_list_", "").replace(/_/g, " ");
    return `City: ${city.charAt(0).toUpperCase() + city.slice(1)}`;
  }
  const map: Record<string, string> = {
    floor_plan_request: "Floor Plans", scheduler: "Tour Request",
    general_inquiry: "General", callback_request: "Callback",
    sticky_bar: "Sticky Bar", header_inquiry: "Header",
    vip_membership: "VIP", newsletter: "Newsletter",
    roi_calculator: "ROI Calc", mortgage_calculator: "Mortgage Calc",
  };
  return map[source] || source.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};

const getPersonaLabel = (p: string | null) => ({
  first_time: "First-time", investor: "Investor", realtor: "Realtor",
}[p ?? ""] ?? p ?? "—");

const getHomeSizeLabel = (s: string | null) => ({
  "1_bed": "1 Bed", "2_bed": "2 Bed", "3_bed_plus": "3 Bed+",
}[s ?? ""] ?? s ?? "—");

const getAgentLabel = (s: string | null) => ({
  i_am_realtor: "Is Agent", yes: "Has Agent",
}[s ?? ""] ?? "No Agent");

function IntentDot({ score }: { score: number | null }) {
  if (!score) return null;
  const color = score >= 8 ? "bg-emerald-500" : score >= 5 ? "bg-amber-500" : "bg-slate-300";
  return (
    <span title={`Intent score: ${score}/10`} className="flex items-center gap-1 text-xs text-muted-foreground">
      <span className={cn("inline-block h-2 w-2 rounded-full", color)} />
      {score}/10
    </span>
  );
}

// ── Inline notes editor ───────────────────────────────────────────────────────
function InlineNotes({ lead, onSave }: { lead: ProjectLead; onSave: (id: string, notes: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(lead.admin_notes ?? "");

  const handleSave = () => {
    onSave(lead.id, value);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
      >
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        {lead.admin_notes ? (
          <span className="italic truncate max-w-[260px]">{lead.admin_notes}</span>
        ) : (
          <span className="opacity-0 group-hover:opacity-60">Add note…</span>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-start gap-2 pt-1">
      <Textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        className="h-16 text-xs resize-none"
        placeholder="Internal note…"
        autoFocus
      />
      <div className="flex flex-col gap-1">
        <Button size="icon" variant="default" className="h-7 w-7" onClick={handleSave}>
          <Save className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setValue(lead.admin_notes ?? ""); setEditing(false); }}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ── Lead card ─────────────────────────────────────────────────────────────────
function LeadCard({
  lead, type, onView, onStatusChange, onSaveNotes,
}: {
  lead: ProjectLead | ListingLead;
  type: "project" | "listing";
  onView: () => void;
  onStatusChange?: (id: string, status: LeadStatus) => void;
  onSaveNotes?: (id: string, notes: string) => void;
}) {
  const isProject = type === "project";
  const pLead = lead as ProjectLead;
  const lLead = lead as ListingLead;
  const status: LeadStatus = isProject ? (pLead.lead_status ?? "new") : "new";
  const cfg = STATUS_CONFIG[status];
  const waNumber = pLead.phone?.replace(/\D/g, "");

  return (
    <Card className={cn(
      "group hover:shadow-md transition-all duration-150",
      status === "converted" && "border-l-4 border-l-emerald-500",
      status === "dead" && "opacity-60",
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Row 1: Name + date + intent */}
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-foreground">{lead.name}</h3>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(lead.created_at), "MMM d, yyyy · h:mm a")}
              </span>
              {isProject && <IntentDot score={pLead.intent_score} />}
            </div>

            {/* Row 2: Contact */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" />{lead.email}
              </span>
              {lead.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />{lead.phone}
                </span>
              )}
            </div>

            {/* Row 3: Project + badges */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              {isProject && pLead.presale_projects ? (
                <Badge variant="outline" className="gap-1 font-normal text-xs">
                  <Building2 className="h-3 w-3" />
                  {pLead.presale_projects.name} · {pLead.presale_projects.city}
                </Badge>
              ) : !isProject && lLead.listings ? (
                <Badge variant="outline" className="gap-1 font-normal text-xs">
                  <Home className="h-3 w-3" />{lLead.listings.title}
                </Badge>
              ) : null}

              {isProject && (
                <>
                  <Badge variant="secondary" className="text-xs">
                    {getLeadSourceLabel(pLead.lead_source)}
                  </Badge>
                  {pLead.persona && (
                    <Badge variant={pLead.persona === "investor" ? "default" : "secondary"} className="text-xs">
                      {getPersonaLabel(pLead.persona)}
                    </Badge>
                  )}
                  {pLead.home_size && (
                    <Badge variant="outline" className="text-xs">{getHomeSizeLabel(pLead.home_size)}</Badge>
                  )}
                </>
              )}
            </div>

            {/* Row 4: Notes (project leads only) */}
            {isProject && onSaveNotes && (
              <InlineNotes lead={pLead} onSave={onSaveNotes} />
            )}
          </div>

          {/* Right: status + actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Status dropdown (project only) */}
            {isProject && onStatusChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80",
                      cfg.bg, cfg.color, cfg.border
                    )}
                  >
                    {cfg.icon}{cfg.label}<ChevronDown className="h-2.5 w-2.5 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {(Object.entries(STATUS_CONFIG) as [LeadStatus, typeof STATUS_CONFIG[LeadStatus]][]).map(([s, c]) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => onStatusChange(pLead.id, s)}
                      className={cn("gap-2 text-xs", s === status && "font-semibold")}
                    >
                      <span className={cn("flex items-center gap-1", c.color)}>{c.icon}</span>
                      {c.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onView} title="View details">
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Email">
                <a href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5" /></a>
              </Button>
              {lead.phone && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="WhatsApp">
                  <a
                    href={`https://wa.me/${waNumber || lead.phone.replace(/\D/g, "")}?text=Hi+${encodeURIComponent(lead.name)}%2C+this+is+Uzair+from+Presale+Properties.`}
                    target="_blank" rel="noopener noreferrer"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                  </a>
                </Button>
              )}
              {isProject && pLead.presale_projects && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="View project">
                  <a href={`/presale-projects/${pLead.presale_projects.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border", color)}>
      <span className="font-bold">{count}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminLeads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("project");
  const [selectedLead, setSelectedLead] = useState<ProjectLead | ListingLead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: projectLeads, isLoading: projectLoading } = useQuery({
    queryKey: ["admin-project-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_leads")
        .select(`
          id, name, email, phone, message, persona, home_size, agent_status,
          lead_source, landing_page, created_at, project_id, intent_score,
          lead_status, admin_notes, contacted_at, converted_at, timeline, budget,
          presale_projects (name, slug, city)
        `)
        .neq("name", "Newsletter Signup")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectLead[];
    },
  });

  const { data: listingLeads, isLoading: listingLoading } = useQuery({
    queryKey: ["admin-listing-leads"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leads")
        .select(`id, name, email, phone, message, created_at, listing_id, listings (title, project_name, city)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ListingLead[];
    },
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const updates: Record<string, unknown> = { lead_status: status };
      if (status === "contacted") updates.contacted_at = new Date().toISOString();
      if (status === "converted") updates.converted_at = new Date().toISOString();
      const { error } = await supabase.from("project_leads").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-project-leads"] });
      toast({ title: `Lead marked as ${STATUS_CONFIG[status].label}`, duration: 2000 });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const updateNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from("project_leads").update({ admin_notes: notes }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-project-leads"] });
      toast({ title: "Note saved", duration: 1500 });
    },
    onError: () => toast({ title: "Failed to save note", variant: "destructive" }),
  });

  // ── Filtering ──────────────────────────────────────────────────────────────
  const getDateCutoff = useCallback(() => {
    if (dateFilter === "today") return startOfDay(new Date()).toISOString();
    if (dateFilter === "7d") return subDays(new Date(), 7).toISOString();
    if (dateFilter === "30d") return subDays(new Date(), 30).toISOString();
    return null;
  }, [dateFilter]);

  const filteredProjectLeads = projectLeads?.filter(lead => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      lead.name.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      (lead.presale_projects?.name.toLowerCase().includes(q) ?? false) ||
      (lead.admin_notes?.toLowerCase().includes(q) ?? false);
    const matchesSource = sourceFilter === "all" ||
      (sourceFilter === "floor_plan_request" && (!lead.lead_source || lead.lead_source === "floor_plan_request")) ||
      lead.lead_source === sourceFilter;
    const matchesStatus = statusFilter === "all" || lead.lead_status === statusFilter;
    const cutoff = getDateCutoff();
    const matchesDate = !cutoff || new Date(lead.created_at) >= new Date(cutoff);
    return matchesSearch && matchesSource && matchesStatus && matchesDate;
  });

  const filteredListingLeads = listingLeads?.filter(lead => {
    const q = searchQuery.toLowerCase();
    const cutoff = getDateCutoff();
    const matchesDate = !cutoff || new Date(lead.created_at) >= new Date(cutoff);
    return matchesDate && (!q ||
      lead.name.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      (lead.listings?.project_name.toLowerCase().includes(q) ?? false));
  });

  // ── Status counts ──────────────────────────────────────────────────────────
  const statusCounts = projectLeads?.reduce((acc, l) => {
    acc[l.lead_status] = (acc[l.lead_status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const exportToCSV = (type: "project" | "listing") => {
    const leads = type === "project" ? filteredProjectLeads : filteredListingLeads;
    if (!leads?.length) return;

    let csv = "data:text/csv;charset=utf-8,";
    if (type === "project") {
      csv += "Name,Email,Phone,Status,Intent,Persona,Home Size,Agent Status,Project,City,Source,Timeline,Notes,Submitted At\n";
      leads.forEach((lead: any) => {
        const p = lead.presale_projects;
        csv += `"${lead.name}","${lead.email}","${lead.phone ?? ""}","${lead.lead_status ?? "new"}","${lead.intent_score ?? ""}","${getPersonaLabel(lead.persona)}","${getHomeSizeLabel(lead.home_size)}","${getAgentLabel(lead.agent_status)}","${p?.name ?? ""}","${p?.city ?? ""}","${getLeadSourceLabel(lead.lead_source)}","${lead.timeline ?? ""}","${(lead.admin_notes ?? "").replace(/"/g, "'")}","${format(new Date(lead.created_at), "yyyy-MM-dd HH:mm")}"\n`;
      });
    } else {
      csv += "Name,Email,Phone,Message,Listing,Project,City,Submitted At\n";
      leads.forEach((lead: any) => {
        const l = lead.listings;
        csv += `"${lead.name}","${lead.email}","${lead.phone ?? ""}","${lead.message ?? ""}","${l?.title ?? ""}","${l?.project_name ?? ""}","${l?.city ?? ""}","${format(new Date(lead.created_at), "yyyy-MM-dd HH:mm")}"\n`;
      });
    }

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `${type}-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalLeads = (projectLeads?.length ?? 0) + (listingLeads?.length ?? 0);

  return (
    <AdminLayout>
      <Helmet><title>Leads | Admin</title></Helmet>

      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leads</h1>
            <p className="text-sm text-muted-foreground">{totalLeads} total leads across all sources</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/leads/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />Analytics
            </Link>
          </Button>
        </div>

        {/* Status summary pipeline */}
        <div className="flex flex-wrap gap-2">
          <StatBadge label="New" count={statusCounts.new ?? 0} color="text-blue-700 bg-blue-50 border-blue-200" />
          <StatBadge label="Contacted" count={statusCounts.contacted ?? 0} color="text-amber-700 bg-amber-50 border-amber-200" />
          <StatBadge label="Qualified" count={statusCounts.qualified ?? 0} color="text-purple-700 bg-purple-50 border-purple-200" />
          <StatBadge label="Converted" count={statusCounts.converted ?? 0} color="text-emerald-700 bg-emerald-50 border-emerald-200" />
          <StatBadge label="Dead" count={statusCounts.dead ?? 0} color="text-slate-500 bg-slate-50 border-slate-200" />
          <div className="ml-auto">
            <StatBadge label="Listing" count={listingLeads?.length ?? 0} color="text-violet-700 bg-violet-50 border-violet-200" />
          </div>
        </div>

        {/* Tabs + Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <TabsList>
                <TabsTrigger value="project" className="gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Projects ({projectLeads?.length ?? 0})
                </TabsTrigger>
                <TabsTrigger value="listing" className="gap-1.5">
                  <Home className="h-3.5 w-3.5" />
                  Listings ({listingLeads?.length ?? 0})
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2 flex-1 flex-wrap">
                {/* Search */}
                <div className="relative min-w-[180px] flex-1 max-w-[260px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, email, project…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                {/* Date */}
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[110px] h-9 text-sm">
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status filter (project only) */}
                {activeTab === "project" && (
                  <Select value={statusFilter} onValueChange={v => setStatusFilter(v as LeadStatus | "all")}>
                    <SelectTrigger className="w-[120px] h-9 text-sm">
                      <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      {(Object.entries(STATUS_CONFIG) as [LeadStatus, typeof STATUS_CONFIG[LeadStatus]][]).map(([s, c]) => (
                        <SelectItem key={s} value={s}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Source filter */}
                {activeTab === "project" && (
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[130px] h-9 text-sm">
                      <SelectValue placeholder="All sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sources</SelectItem>
                      <SelectItem value="floor_plan_request">Floor Plans</SelectItem>
                      <SelectItem value="scheduler">Tour Requests</SelectItem>
                      <SelectItem value="vip_membership">VIP</SelectItem>
                      <SelectItem value="general_inquiry">General</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Button variant="outline" size="sm" className="h-9 ml-auto"
                  onClick={() => exportToCSV(activeTab as "project" | "listing")}>
                  <Download className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Project Leads */}
          <TabsContent value="project" className="mt-4 space-y-2">
            {projectLoading ? (
              [...Array(4)].map((_, i) => (
                <Card key={i}><CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-64" />
                  <div className="flex gap-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-5 w-20" /></div>
                </CardContent></Card>
              ))
            ) : !filteredProjectLeads?.length ? (
              <EmptyState message={searchQuery || statusFilter !== "all" || sourceFilter !== "all" ? "No leads match your filters" : "No project leads yet"} />
            ) : (
              filteredProjectLeads.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  type="project"
                  onView={() => { setSelectedLead(lead); setModalOpen(true); }}
                  onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
                  onSaveNotes={(id, notes) => updateNotes.mutate({ id, notes })}
                />
              ))
            )}
          </TabsContent>

          {/* Listing Leads */}
          <TabsContent value="listing" className="mt-4 space-y-2">
            {listingLoading ? (
              [...Array(4)].map((_, i) => (
                <Card key={i}><CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-64" />
                </CardContent></Card>
              ))
            ) : !filteredListingLeads?.length ? (
              <EmptyState message="No listing leads found" />
            ) : (
              filteredListingLeads.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  type="listing"
                  onView={() => { setSelectedLead(lead); setModalOpen(true); }}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        <LeadDetailsModal
          lead={selectedLead}
          type={activeTab as "project" | "listing"}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      </div>
    </AdminLayout>
  );
}
