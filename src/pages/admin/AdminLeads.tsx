import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, startOfDay } from "date-fns";
import { Link } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { generateProjectUrl } from "@/lib/seoUrls";
import {
  Users,
  Building2,
  Home,
  Search,
  Download,
  ExternalLink,
  Mail,
  Phone,
  Eye,
  BarChart3,
  Inbox,
  MessageSquare,
  ChevronDown,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Star,
  Circle,
  MoreVertical,
  Trash2,
  Plus,
  X,
  Flame,
  Thermometer,
  Snowflake,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LeadDetailsModal } from "@/components/admin/LeadDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  lead_sources: string[] | null;
  landing_page: string | null;
  created_at: string;
  project_id: string | null;
  lead_status: string | null;
  admin_notes: string | null;
  contacted_at: string | null;
  converted_at: string | null;
  intent_score: number | null;
  presale_projects: {
    name: string;
    slug: string;
    city: string;
    neighborhood: string | null;
    project_type: string | null;
  } | null;
}

interface ListingLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  created_at: string;
  listing_id: string;
  listings: {
    title: string;
    project_name: string;
    city: string;
  } | null;
}

// ─── Label helpers ────────────────────────────────────────────────────────────

const getLeadSourceLabel = (source: string | null): string => {
  if (!source) return "Floor Plans";
  if (source.startsWith("city_list_")) {
    const city = source.replace("city_list_", "").replace(/_/g, " ");
    return `City: ${city.charAt(0).toUpperCase() + city.slice(1)}`;
  }
  const sourceMap: Record<string, string> = {
    floor_plan_request: "Floor Plans",
    scheduler: "Tour Request",
    general_inquiry: "General",
    callback_request: "Callback",
    sticky_bar: "Sticky Bar",
    header_inquiry: "Header",
    vip_membership: "VIP",
    newsletter: "Newsletter",
    roi_calculator: "ROI Calc",
    mortgage_calculator: "Mortgage Calc",
  };
  return sourceMap[source] || source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const getPersonaLabel = (persona: string | null) => {
  if (persona === "first_time") return "First-time";
  if (persona === "investor") return "Investor";
  if (persona === "realtor") return "Realtor";
  return persona || "—";
};

const getHomeSizeLabel = (size: string | null) => {
  if (size === "1_bed") return "1 Bed";
  if (size === "2_bed") return "2 Bed";
  if (size === "3_bed_plus") return "3 Bed+";
  return size || "—";
};

const getAgentLabel = (status: string | null) => {
  if (status === "i_am_realtor") return "Is Agent";
  if (status === "yes") return "Has Agent";
  return "No Agent";
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; dotColor: string; badgeCn: string }
> = {
  new: {
    label: "New",
    color: "bg-secondary text-secondary-foreground border-secondary",
    dotColor: "bg-primary",
    badgeCn: "border-border bg-secondary text-secondary-foreground",
  },
  contacted: {
    label: "Contacted",
    color: "bg-secondary text-foreground border-border",
    dotColor: "bg-foreground/50",
    badgeCn: "border-border bg-muted text-foreground",
  },
  qualified: {
    label: "Qualified",
    color: "bg-primary/10 text-primary border-primary/20",
    dotColor: "bg-primary",
    badgeCn: "border-primary/20 bg-primary/10 text-primary",
  },
  converted: {
    label: "Converted",
    color: "bg-primary/20 text-primary border-primary/30",
    dotColor: "bg-primary",
    badgeCn: "border-primary/30 bg-primary/20 text-primary",
  },
  dead: {
    label: "Dead",
    color: "bg-muted text-muted-foreground border-border",
    dotColor: "bg-muted-foreground",
    badgeCn: "border-border bg-muted text-muted-foreground",
  },
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminLeads() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("project");
  const [selectedLead, setSelectedLead] = useState<ProjectLead | ListingLead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Inline editing
  const [editingCell, setEditingCell] = useState<{ leadId: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: projectLeads, isLoading: projectLoading } = useQuery({
    queryKey: ["admin-project-leads"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("project_leads")
        .select(`
          id, name, email, phone, message, persona, home_size, agent_status,
          lead_source, lead_sources, landing_page, created_at, project_id,
          lead_status, admin_notes, contacted_at, converted_at, intent_score,
          presale_projects (name, slug, city, neighborhood, project_type)
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
        .select(`
          id, name, email, phone, message, created_at, listing_id,
          listings (title, project_name, city)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ListingLead[];
    },
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      timestamps,
    }: {
      id: string;
      status: LeadStatus;
      timestamps?: Record<string, string>;
    }) => {
      const { error } = await (supabase as any)
        .from("project_leads")
        .update({ lead_status: status, ...timestamps })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-project-leads"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await (supabase as any)
        .from("project_leads")
        .update({ admin_notes: notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-project-leads"] });
      toast.success("Note saved");
    },
    onError: () => toast.error("Failed to save note"),
  });

  // ── Inline edit handler ─────────────────────────────────────────────────

  const handleInlineEdit = async (leadId: string, field: string, value: string, table: "project_leads" | "leads") => {
    setEditingCell(null);
    const trimmed = value.trim();
    const updatePayload: Record<string, any> = { [field]: trimmed };

    const { error } = await (supabase as any)
      .from(table)
      .update(updatePayload)
      .eq("id", leadId);
    if (error) {
      toast.error("Failed to update");
    } else {
      queryClient.invalidateQueries({ queryKey: table === "project_leads" ? ["admin-project-leads"] : ["admin-listing-leads"] });
    }
  };

  const handleDeleteLead = async (leadId: string, table: "project_leads" | "leads") => {
    const { error } = await (supabase as any).from(table).delete().eq("id", leadId);
    if (error) {
      toast.error("Failed to delete lead");
    } else {
      queryClient.invalidateQueries({ queryKey: table === "project_leads" ? ["admin-project-leads"] : ["admin-listing-leads"] });
      toast.success("Lead deleted");
    }
  };

  const startEditing = (leadId: string, field: string, currentValue: string) => {
    setEditingCell({ leadId, field });
    setEditingValue(currentValue);
  };

  // ── Filtering ─────────────────────────────────────────────────────────────

  const getDateCutoff = () => {
    if (dateFilter === "today") return startOfDay(new Date());
    if (dateFilter === "7d") return subDays(new Date(), 7);
    if (dateFilter === "30d") return subDays(new Date(), 30);
    return null;
  };

  const filteredProjectLeads = projectLeads?.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.presale_projects?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource =
      sourceFilter === "all" ||
      (sourceFilter === "floor_plan_request" &&
        (lead.lead_source === "floor_plan_request" || !lead.lead_source)) ||
      lead.lead_source === sourceFilter;
    const matchesStatus =
      statusFilter === "all" || (lead.lead_status || "new") === statusFilter;
    const cutoff = getDateCutoff();
    const matchesDate = !cutoff || new Date(lead.created_at) >= cutoff;
    return matchesSearch && matchesSource && matchesStatus && matchesDate;
  });

  const filteredListingLeads = listingLeads?.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.listings?.project_name.toLowerCase().includes(searchQuery.toLowerCase());
    const cutoff = getDateCutoff();
    const matchesDate = !cutoff || new Date(lead.created_at) >= cutoff;
    return matchesSearch && matchesDate;
  });

  // ── CSV Export ────────────────────────────────────────────────────────────

  const exportToCSV = (type: "project" | "listing") => {
    const leads = type === "project" ? filteredProjectLeads : filteredListingLeads;
    if (!leads || leads.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    if (type === "project") {
      csvContent +=
        "Name,Email,Phone,Status,Persona,Home Size,Agent Status,Source,Project,City,Notes,Contacted At,Converted At,Submitted At\n";
      leads.forEach((lead: any) => {
        const project = lead.presale_projects;
        csvContent += `"${lead.name}","${lead.email}","${lead.phone || ""}","${lead.lead_status || "new"}","${getPersonaLabel(lead.persona)}","${getHomeSizeLabel(lead.home_size)}","${getAgentLabel(lead.agent_status)}","${getLeadSourceLabel(lead.lead_source)}","${project?.name || ""}","${project?.city || ""}","${(lead.admin_notes || "").replace(/"/g, "'")}","${lead.contacted_at ? format(new Date(lead.contacted_at), "yyyy-MM-dd") : ""}","${lead.converted_at ? format(new Date(lead.converted_at), "yyyy-MM-dd") : ""}","${format(new Date(lead.created_at), "yyyy-MM-dd HH:mm")}"\n`;
      });
    } else {
      csvContent += "Name,Email,Phone,Message,Listing,Project,City,Submitted At\n";
      leads.forEach((lead: any) => {
        const listing = lead.listings;
        csvContent += `"${lead.name}","${lead.email}","${lead.phone || ""}","${lead.message || ""}","${listing?.title || ""}","${listing?.project_name || ""}","${listing?.city || ""}","${format(new Date(lead.created_at), "yyyy-MM-dd HH:mm")}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}-leads-${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Status pipeline counts ────────────────────────────────────────────────

  const pipelineCounts = (Object.keys(STATUS_CONFIG) as LeadStatus[]).reduce(
    (acc, s) => {
      acc[s] = projectLeads?.filter((l) => (l.lead_status || "new") === s).length || 0;
      return acc;
    },
    {} as Record<LeadStatus, number>
  );

  const totalLeads = (projectLeads?.length || 0) + (listingLeads?.length || 0);

  // ── Inline editable cell helper ──────────────────────────────────────────

  const EditableCell = ({ leadId, field, value, table, className: cls }: {
    leadId: string; field: string; value: string; table: "project_leads" | "leads"; className?: string;
  }) => {
    if (editingCell?.leadId === leadId && editingCell.field === field) {
      return (
        <Input
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          className="h-7 text-xs px-1.5 w-full"
          autoFocus
          onBlur={() => handleInlineEdit(leadId, field, editingValue, table)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleInlineEdit(leadId, field, editingValue, table);
            if (e.key === "Escape") setEditingCell(null);
          }}
        />
      );
    }
    return (
      <span
        className={cn("cursor-pointer hover:text-primary transition-colors", cls)}
        onClick={() => startEditing(leadId, field, value)}
      >
        {value || <span className="text-muted-foreground/40">Add {field}</span>}
      </span>
    );
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Leads | Admin</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leads</h1>
            <p className="text-sm text-muted-foreground">
              {totalLeads} total leads from all sources
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/leads/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-lg font-bold leading-none">{projectLeads?.length || 0}</p>
              <p className="text-[11px] text-muted-foreground">Project Leads</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <Home className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-lg font-bold leading-none">{listingLeads?.length || 0}</p>
              <p className="text-[11px] text-muted-foreground">Listing Leads</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-lg font-bold leading-none text-primary">{pipelineCounts.converted}</p>
              <p className="text-[11px] text-muted-foreground">Converted</p>
            </div>
          </div>
        </div>

        {/* Pipeline filter pills */}
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={cn(
                "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors",
                statusFilter === s
                  ? STATUS_CONFIG[s].badgeCn + " font-semibold"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_CONFIG[s].dotColor)} />
              {STATUS_CONFIG[s].label}
              <span className="font-bold">{pipelineCounts[s]}</span>
            </button>
          ))}
        </div>

        {/* Tabs + Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <TabsList>
              <TabsTrigger value="project" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="listing" className="gap-1.5">
                <Home className="h-3.5 w-3.5" />
                Listings
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 flex-1 sm:justify-end flex-wrap">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[100px] h-8 text-xs">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>

              {activeTab === "project" && (
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="floor_plan_request">Floor Plans</SelectItem>
                    <SelectItem value="scheduler">Tour Requests</SelectItem>
                    <SelectItem value="general_inquiry">General</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <div className="relative flex-1 sm:max-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-xs"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => exportToCSV(activeTab as "project" | "listing")}
              >
                <Download className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>

          {/* ─── Project Leads Table ───────────────────────────────────── */}
          <TabsContent value="project" className="mt-0">
            {projectLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !filteredProjectLeads?.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No project leads found</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Name</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Phone</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Email</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Source</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Project</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Date</th>
                        <th className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjectLeads.map((lead) => {
                        const currentStatus = (lead.lead_status as LeadStatus) || "new";
                        const cfg = STATUS_CONFIG[currentStatus];
                        const allSources = lead.lead_sources?.length
                          ? lead.lead_sources
                          : lead.lead_source ? [lead.lead_source] : [];
                        const primarySource = getLeadSourceLabel(allSources[0] || null);
                        const extraSourceCount = Math.max(0, allSources.length - 1);

                        return (
                          <tr
                            key={lead.id}
                            className={cn(
                              "border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30",
                              currentStatus === "converted" && "bg-primary/[0.02]"
                            )}
                          >
                            {/* Status */}
                            <td className="px-3 py-2.5">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className={cn(
                                      "inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10px] font-medium border transition-all hover:scale-105",
                                      cfg.badgeCn
                                    )}
                                  >
                                    <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dotColor)} />
                                    {cfg.label}
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-36">
                                  <DropdownMenuLabel className="text-xs">Set Status</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((s) => {
                                    const timestamps: Record<string, string> = {};
                                    if (s === "contacted" && !lead.contacted_at) timestamps.contacted_at = new Date().toISOString();
                                    if (s === "converted" && !lead.converted_at) timestamps.converted_at = new Date().toISOString();
                                    return (
                                      <DropdownMenuItem
                                        key={s}
                                        className="text-xs gap-2"
                                        onClick={() => updateStatusMutation.mutate({ id: lead.id, status: s, timestamps })}
                                      >
                                        <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_CONFIG[s].dotColor)} />
                                        {STATUS_CONFIG[s].label}
                                        {s === currentStatus && <CheckCircle2 className="h-3 w-3 ml-auto text-primary" />}
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>

                            {/* Name — inline editable */}
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1.5">
                                {lead.intent_score !== null && lead.intent_score >= 5 && (
                                  <span
                                    className={cn(
                                      "inline-block h-2 w-2 rounded-full shrink-0",
                                      lead.intent_score >= 8 ? "bg-green-500" : "bg-amber-500"
                                    )}
                                    title={`Intent: ${lead.intent_score}`}
                                  />
                                )}
                                <EditableCell
                                  leadId={lead.id}
                                  field="name"
                                  value={lead.name}
                                  table="project_leads"
                                  className="font-medium truncate max-w-[160px] text-sm"
                                />
                              </div>
                            </td>

                            {/* Phone */}
                            <td className="px-3 py-2.5">
                              <EditableCell
                                leadId={lead.id}
                                field="phone"
                                value={lead.phone || ""}
                                table="project_leads"
                                className="text-xs text-muted-foreground"
                              />
                            </td>

                            {/* Email */}
                            <td className="px-3 py-2.5">
                              <EditableCell
                                leadId={lead.id}
                                field="email"
                                value={lead.email}
                                table="project_leads"
                                className="text-xs text-muted-foreground truncate block max-w-[180px]"
                              />
                            </td>

                            {/* Source — condensed */}
                            <td className="px-3 py-2.5">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="inline-flex items-center gap-1 text-[10px] h-5 px-1.5 rounded border border-border bg-background hover:bg-muted transition-colors">
                                    {primarySource}
                                    {extraSourceCount > 0 && (
                                      <span className="text-primary font-semibold">+{extraSourceCount}</span>
                                    )}
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-44">
                                  <DropdownMenuLabel className="text-xs">Lead Sources</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {allSources.map((src) => (
                                    <DropdownMenuItem key={src} className="text-xs">
                                      {getLeadSourceLabel(src)}
                                    </DropdownMenuItem>
                                  ))}
                                  {lead.persona && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-xs" disabled>
                                        Persona: {getPersonaLabel(lead.persona)}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>

                            {/* Project */}
                            <td className="px-3 py-2.5">
                              {lead.presale_projects ? (
                                <a
                                  href={generateProjectUrl({
                                    slug: lead.presale_projects.slug,
                                    neighborhood: lead.presale_projects.neighborhood || lead.presale_projects.city,
                                    projectType: (lead.presale_projects.project_type || "condo") as any,
                                  })}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] h-5 px-1.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                                >
                                  <Building2 className="h-2.5 w-2.5" />
                                  {lead.presale_projects.name}
                                </a>
                              ) : (
                                <span className="text-muted-foreground/40 text-xs">—</span>
                              )}
                            </td>

                            {/* Date */}
                            <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(lead.created_at), "MMM d")}
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-2.5 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem onClick={() => { setSelectedLead(lead); setModalOpen(true); }}>
                                    <Eye className="h-3.5 w-3.5 mr-2" /> View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const note = prompt("Admin note:", lead.admin_notes || "");
                                      if (note !== null) updateNotesMutation.mutate({ id: lead.id, notes: note });
                                    }}
                                  >
                                    <MessageSquare className="h-3.5 w-3.5 mr-2" /> {lead.admin_notes ? "Edit Note" : "Add Note"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <a href={`mailto:${lead.email}`}>
                                      <Mail className="h-3.5 w-3.5 mr-2" /> Email
                                    </a>
                                  </DropdownMenuItem>
                                  {lead.phone && (
                                    <DropdownMenuItem asChild>
                                      <a href={`tel:${lead.phone}`}>
                                        <Phone className="h-3.5 w-3.5 mr-2" /> Call
                                      </a>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteLead(lead.id, "project_leads")}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─── Listing Leads Table ──────────────────────────────────── */}
          <TabsContent value="listing" className="mt-0">
            {listingLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !filteredListingLeads?.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No listing leads found</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Name</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Phone</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Email</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Listing</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Date</th>
                        <th className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredListingLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30"
                        >
                          {/* Name */}
                          <td className="px-3 py-2.5">
                            <EditableCell
                              leadId={lead.id}
                              field="name"
                              value={lead.name}
                              table="leads"
                              className="font-medium truncate max-w-[160px] text-sm"
                            />
                          </td>

                          {/* Phone */}
                          <td className="px-3 py-2.5">
                            <EditableCell
                              leadId={lead.id}
                              field="phone"
                              value={lead.phone || ""}
                              table="leads"
                              className="text-xs text-muted-foreground"
                            />
                          </td>

                          {/* Email */}
                          <td className="px-3 py-2.5">
                            <EditableCell
                              leadId={lead.id}
                              field="email"
                              value={lead.email}
                              table="leads"
                              className="text-xs text-muted-foreground truncate block max-w-[180px]"
                            />
                          </td>

                          {/* Listing */}
                          <td className="px-3 py-2.5">
                            {lead.listings ? (
                              <a
                                href={`/assignments/${lead.listing_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] h-5 px-1.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                              >
                                <Home className="h-2.5 w-2.5" />
                                {lead.listings.title}
                              </a>
                            ) : (
                              <span className="text-muted-foreground/40 text-xs">—</span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(lead.created_at), "MMM d")}
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-2.5 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => { setSelectedLead(lead); setModalOpen(true); }}>
                                  <Eye className="h-3.5 w-3.5 mr-2" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <a href={`mailto:${lead.email}`}>
                                    <Mail className="h-3.5 w-3.5 mr-2" /> Email
                                  </a>
                                </DropdownMenuItem>
                                {lead.phone && (
                                  <DropdownMenuItem asChild>
                                    <a href={`tel:${lead.phone}`}>
                                      <Phone className="h-3.5 w-3.5 mr-2" /> Call
                                    </a>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteLead(lead.id, "leads")}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
