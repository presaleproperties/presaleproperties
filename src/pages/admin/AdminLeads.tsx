import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, startOfDay, isAfter } from "date-fns";
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
  BarChart3,
  Inbox,
  MessageSquare,
  MoreVertical,
  Trash2,
  Clock,
  TrendingUp,
  Filter,
  X,
  CheckSquare,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LeadDetailsModal } from "@/components/admin/LeadDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

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

const DATE_FILTERS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
];

function IntentDot({ score }: { score: number | null }) {
  if (score === null) return null;
  const color =
    score >= 8 ? "bg-green-500" : score >= 5 ? "bg-amber-500" : "bg-muted-foreground/40";
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full shrink-0 ${color}`}
      title={`Intent score: ${score}`}
    />
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminLeads() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("project");
  const [selectedLead, setSelectedLead] = useState<ProjectLead | ListingLead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [selectedListingIds, setSelectedListingIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const selectedIds = activeTab === "project" ? selectedProjectIds : selectedListingIds;
  const setSelectedIds = activeTab === "project" ? setSelectedProjectIds : setSelectedListingIds;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, [activeTab]);

  const toggleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) return new Set();
      return new Set(ids);
    });
  }, [activeTab]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

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

  const deleteProjectLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("project_leads")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-project-leads"] });
      toast.success("Lead deleted");
    },
    onError: () => toast.error("Failed to delete lead"),
  });

  const deleteListingLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("leads")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listing-leads"] });
      toast.success("Lead deleted");
    },
    onError: () => toast.error("Failed to delete lead"),
  });

  // ── Bulk Actions ──────────────────────────────────────────────────────────

  const bulkDeleteProjectLeads = async () => {
    if (selectedProjectIds.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedProjectIds);
    const { error } = await (supabase as any).from("project_leads").delete().in("id", ids);
    if (error) { toast.error("Failed to delete leads"); }
    else {
      toast.success(`${ids.length} lead(s) deleted`);
      queryClient.invalidateQueries({ queryKey: ["admin-project-leads"] });
      setSelectedProjectIds(new Set());
    }
    setBulkDeleting(false);
  };

  const bulkDeleteListingLeads = async () => {
    if (selectedListingIds.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedListingIds);
    const { error } = await (supabase as any).from("leads").delete().in("id", ids);
    if (error) { toast.error("Failed to delete leads"); }
    else {
      toast.success(`${ids.length} lead(s) deleted`);
      queryClient.invalidateQueries({ queryKey: ["admin-listing-leads"] });
      setSelectedListingIds(new Set());
    }
    setBulkDeleting(false);
  };

  const bulkEmailSelected = () => {
    const leads = activeTab === "project" ? projectLeads : listingLeads;
    if (!leads) return;
    const emails = leads.filter(l => selectedIds.has(l.id)).map(l => l.email);
    if (emails.length === 0) return;
    window.open(`mailto:${emails.join(",")}`, "_blank");
  };

  const bulkExportSelected = () => {
    const leads = activeTab === "project" ? filteredProjectLeads : filteredListingLeads;
    if (!leads) return;
    const selected = leads.filter(l => selectedIds.has(l.id));
    if (selected.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === "project") {
      csvContent += "Name,Email,Phone,Persona,Home Size,Source,Project,City,Notes,Submitted At\n";
      selected.forEach((lead: any) => {
        const project = lead.presale_projects;
        csvContent += `"${lead.name}","${lead.email}","${lead.phone || ""}","${getPersonaLabel(lead.persona)}","${getHomeSizeLabel(lead.home_size)}","${getLeadSourceLabel(lead.lead_source)}","${project?.name || ""}","${project?.city || ""}","${(lead.admin_notes || "").replace(/"/g, "'")}","${format(new Date(lead.created_at), "yyyy-MM-dd HH:mm")}"\n`;
      });
    } else {
      csvContent += "Name,Email,Phone,Message,Listing,Project,City,Submitted At\n";
      selected.forEach((lead: any) => {
        const listing = lead.listings;
        csvContent += `"${lead.name}","${lead.email}","${lead.phone || ""}","${lead.message || ""}","${listing?.title || ""}","${listing?.project_name || ""}","${listing?.city || ""}","${format(new Date(lead.created_at), "yyyy-MM-dd HH:mm")}"\n`;
      });
    }
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `selected-${activeTab}-leads-${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Filtering ─────────────────────────────────────────────────────────────

  const getDateCutoff = () => {
    if (dateFilter === "today") return startOfDay(new Date());
    if (dateFilter === "7") return subDays(new Date(), 7);
    if (dateFilter === "30") return subDays(new Date(), 30);
    return null;
  };

  const filteredProjectLeads = useMemo(() => {
    return projectLeads?.filter((lead) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.presale_projects?.name.toLowerCase().includes(q);
      const matchesSource =
        sourceFilter === "all" ||
        (sourceFilter === "floor_plan_request" &&
          (lead.lead_source === "floor_plan_request" || !lead.lead_source)) ||
        lead.lead_source === sourceFilter;
      const cutoff = getDateCutoff();
      const matchesDate = !cutoff || new Date(lead.created_at) >= cutoff;
      return matchesSearch && matchesSource && matchesDate;
    });
  }, [projectLeads, searchQuery, sourceFilter, dateFilter]);

  const filteredListingLeads = useMemo(() => {
    return listingLeads?.filter((lead) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.listings?.project_name.toLowerCase().includes(q);
      const cutoff = getDateCutoff();
      const matchesDate = !cutoff || new Date(lead.created_at) >= cutoff;
      return matchesSearch && matchesDate;
    });
  }, [listingLeads, searchQuery, dateFilter]);

  // ── CSV Export ────────────────────────────────────────────────────────────

  const exportToCSV = (type: "project" | "listing") => {
    const leads = type === "project" ? filteredProjectLeads : filteredListingLeads;
    if (!leads || leads.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    if (type === "project") {
      csvContent +=
        "Name,Email,Phone,Persona,Home Size,Source,Project,City,Notes,Submitted At\n";
      leads.forEach((lead: any) => {
        const project = lead.presale_projects;
        csvContent += `"${lead.name}","${lead.email}","${lead.phone || ""}","${getPersonaLabel(lead.persona)}","${getHomeSizeLabel(lead.home_size)}","${getLeadSourceLabel(lead.lead_source)}","${project?.name || ""}","${project?.city || ""}","${(lead.admin_notes || "").replace(/"/g, "'")}","${format(new Date(lead.created_at), "yyyy-MM-dd HH:mm")}"\n`;
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
    link.setAttribute(
      "download",
      `${type}-leads-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalLeads = (projectLeads?.length || 0) + (listingLeads?.length || 0);
  const recentLeads = [...(projectLeads || []), ...(listingLeads || [])].filter((l) =>
    isAfter(new Date(l.created_at), subDays(new Date(), 7))
  ).length;

  const hasActiveFilters = searchQuery || sourceFilter !== "all" || dateFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSourceFilter("all");
    setDateFilter("all");
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Leads | Admin</title>
      </Helmet>

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
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

        {/* Compact Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold leading-none">{projectLeads?.length || 0}</p>
              <p className="text-[11px] text-muted-foreground">Project</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <Home className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold leading-none">{listingLeads?.length || 0}</p>
              <p className="text-[11px] text-muted-foreground">Listing</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <p className="text-lg font-bold leading-none">{recentLeads}</p>
              <p className="text-[11px] text-muted-foreground">This Week</p>
            </div>
          </div>
        </div>

        {/* Tabs + Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="project" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Projects
              {projectLeads && projectLeads.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 h-4">{projectLeads.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="listing" className="gap-1.5">
              <Home className="h-3.5 w-3.5" />
              Listings
              {listingLeads && listingLeads.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 h-4">{listingLeads.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm h-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[110px] text-sm h-9">
                  <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeTab === "project" && (
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[120px] text-sm h-9">
                    <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="floor_plan_request">Floor Plans</SelectItem>
                    <SelectItem value="scheduler">Tour Requests</SelectItem>
                    <SelectItem value="general_inquiry">General</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => exportToCSV(activeTab as "project" | "listing")}
              >
                <Download className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-9 px-2">
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>

          {/* Project Leads Table */}
          <TabsContent value="project" className="mt-0">
            {projectLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : !filteredProjectLeads?.length ? (
              <EmptyState message="No project leads found" />
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  {selectedProjectIds.size > 0 ? `${selectedProjectIds.size} selected · ` : ""}{filteredProjectLeads.length} of {projectLeads?.length || 0} leads
                </p>

                {/* Desktop Table */}
                <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-3 py-2.5 w-8">
                            <Checkbox
                              checked={filteredProjectLeads.length > 0 && filteredProjectLeads.every(l => selectedProjectIds.has(l.id))}
                              onCheckedChange={() => toggleSelectAll(filteredProjectLeads.map(l => l.id))}
                            />
                          </th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Name</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Phone</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Email</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Project</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Source</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Details</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Date</th>
                          <th className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjectLeads.map((lead) => {
                          const sources = lead.lead_sources && lead.lead_sources.length > 0
                            ? lead.lead_sources
                            : lead.lead_source ? [lead.lead_source] : [];
                          const primarySource = getLeadSourceLabel(sources[0] || null);
                          const extraCount = Math.max(0, sources.length - 1);

                          return (
                            <tr
                              key={lead.id}
                              className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                            >
                              {/* Name */}
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <IntentDot score={lead.intent_score} />
                                  <p className="font-medium truncate max-w-[160px]">{lead.name}</p>
                                </div>
                              </td>

                              {/* Phone */}
                              <td className="px-3 py-2.5">
                                {lead.phone ? (
                                  <a href={`tel:${lead.phone}`} className="text-muted-foreground hover:text-primary transition-colors text-xs">
                                    {lead.phone}
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground/40 text-xs">—</span>
                                )}
                              </td>

                              {/* Email */}
                              <td className="px-3 py-2.5">
                                <a href={`mailto:${lead.email}`} className="text-muted-foreground hover:text-primary transition-colors text-xs truncate block max-w-[180px]">
                                  {lead.email}
                                </a>
                              </td>

                              {/* Project */}
                              <td className="px-3 py-2.5">
                                {lead.presale_projects ? (
                                  <span className="text-xs truncate block max-w-[140px]" title={`${lead.presale_projects.name} · ${lead.presale_projects.city}`}>
                                    {lead.presale_projects.name}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/40 text-xs">—</span>
                                )}
                              </td>

                              {/* Source */}
                              <td className="px-3 py-2.5">
                                <span className="inline-flex items-center gap-1 text-[10px] h-5 px-1.5 rounded border border-border bg-background">
                                  {primarySource}
                                  {extraCount > 0 && (
                                    <span className="text-primary font-semibold">+{extraCount}</span>
                                  )}
                                </span>
                              </td>

                              {/* Details */}
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1 flex-wrap">
                                  {lead.persona && (
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                      {getPersonaLabel(lead.persona)}
                                    </Badge>
                                  )}
                                  {lead.home_size && (
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                                      {getHomeSizeLabel(lead.home_size)}
                                    </Badge>
                                  )}
                                </div>
                              </td>

                              {/* Date */}
                              <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(lead.created_at), "MMM d")}
                              </td>

                              {/* Actions */}
                              <td className="px-3 py-2.5 text-right">
                                <DropdownMenu modal={false}>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedLead(lead);
                                        setModalOpen(true);
                                      }}
                                    >
                                      <MessageSquare className="h-3.5 w-3.5 mr-2" /> View Details
                                    </DropdownMenuItem>
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
                                    {lead.presale_projects && (
                                      <DropdownMenuItem asChild>
                                        <a
                                          href={generateProjectUrl({
                                            slug: lead.presale_projects.slug,
                                            neighborhood: lead.presale_projects.neighborhood || lead.presale_projects.city,
                                            projectType: (lead.presale_projects.project_type || "condo") as any,
                                          })}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <ExternalLink className="h-3.5 w-3.5 mr-2" /> View Project
                                        </a>
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => deleteProjectLeadMutation.mutate(lead.id)}
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

                {/* Mobile Cards */}
                <div className="md:hidden space-y-2">
                  {filteredProjectLeads.map((lead) => {
                    const primarySource = getLeadSourceLabel(lead.lead_source);
                    return (
                      <div
                        key={lead.id}
                        className="p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <IntentDot score={lead.intent_score} />
                                <p className="font-medium text-sm">{lead.name}</p>
                              </div>
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedLead(lead);
                                      setModalOpen(true);
                                    }}
                                  >
                                    <MessageSquare className="h-3.5 w-3.5 mr-2" /> View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <a href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5 mr-2" /> Email</a>
                                  </DropdownMenuItem>
                                  {lead.phone && (
                                    <DropdownMenuItem asChild>
                                      <a href={`tel:${lead.phone}`}><Phone className="h-3.5 w-3.5 mr-2" /> Call</a>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => deleteProjectLeadMutation.mutate(lead.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="mt-1 space-y-1">
                              <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                              {lead.phone && <p className="text-xs text-muted-foreground">{lead.phone}</p>}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {lead.presale_projects && (
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal gap-1">
                                  <Building2 className="h-2.5 w-2.5" />
                                  {lead.presale_projects.name}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                {primarySource}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                {format(new Date(lead.created_at), "MMM d")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Listing Leads Table */}
          <TabsContent value="listing" className="mt-0">
            {listingLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : !filteredListingLeads?.length ? (
              <EmptyState message="No listing leads found" />
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  {filteredListingLeads.length} of {listingLeads?.length || 0} leads
                </p>

                {/* Desktop Table */}
                <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Name</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Phone</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Email</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Listing</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Message</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Date</th>
                          <th className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredListingLeads.map((lead) => (
                          <tr
                            key={lead.id}
                            className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-3 py-2.5">
                              <p className="font-medium truncate max-w-[160px]">{lead.name}</p>
                            </td>
                            <td className="px-3 py-2.5">
                              {lead.phone ? (
                                <a href={`tel:${lead.phone}`} className="text-muted-foreground hover:text-primary transition-colors text-xs">
                                  {lead.phone}
                                </a>
                              ) : (
                                <span className="text-muted-foreground/40 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <a href={`mailto:${lead.email}`} className="text-muted-foreground hover:text-primary transition-colors text-xs truncate block max-w-[180px]">
                                {lead.email}
                              </a>
                            </td>
                            <td className="px-3 py-2.5">
                              {lead.listings ? (
                                <span className="text-xs truncate block max-w-[140px]" title={lead.listings.title}>
                                  {lead.listings.title}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {lead.message ? (
                                <span className="text-xs text-muted-foreground truncate block max-w-[150px]" title={lead.message}>
                                  {lead.message}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(lead.created_at), "MMM d")}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedLead(lead);
                                      setModalOpen(true);
                                    }}
                                  >
                                    <MessageSquare className="h-3.5 w-3.5 mr-2" /> View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <a href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5 mr-2" /> Email</a>
                                  </DropdownMenuItem>
                                  {lead.phone && (
                                    <DropdownMenuItem asChild>
                                      <a href={`tel:${lead.phone}`}><Phone className="h-3.5 w-3.5 mr-2" /> Call</a>
                                    </DropdownMenuItem>
                                  )}
                                  {lead.listings && (
                                    <DropdownMenuItem asChild>
                                      <a href={`/assignments/${lead.listing_id}`} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3.5 w-3.5 mr-2" /> View Listing
                                      </a>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => deleteListingLeadMutation.mutate(lead.id)}
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

                {/* Mobile Cards */}
                <div className="md:hidden space-y-2">
                  {filteredListingLeads.map((lead) => (
                    <div key={lead.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{lead.name}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.email}</p>
                          {lead.phone && <p className="text-xs text-muted-foreground">{lead.phone}</p>}
                          <div className="flex items-center gap-1.5 mt-2">
                            {lead.listings && (
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal gap-1">
                                <Home className="h-2.5 w-2.5" />
                                {lead.listings.title}
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {format(new Date(lead.created_at), "MMM d")}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedLead(lead);
                                setModalOpen(true);
                              }}
                            >
                              <MessageSquare className="h-3.5 w-3.5 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5 mr-2" /> Email</a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteListingLeadMutation.mutate(lead.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
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
