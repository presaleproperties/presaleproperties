import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, startOfDay, isAfter, formatDistanceToNow } from "date-fns";
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
  Flame,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Target,
  Activity,
  Columns3,
  Bookmark,
  BookmarkPlus,
  Star,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LeadDetailsModal } from "@/components/admin/LeadDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
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

const INTENT_FILTERS = [
  { value: "all", label: "Any intent" },
  { value: "hot", label: "Hot · 8+" },
  { value: "warm", label: "Warm · 5-7" },
  { value: "cold", label: "Cold · 0-4" },
];

const STATUS_FILTERS = [
  { value: "all", label: "Any status" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
];

const PERSONA_FILTERS = [
  { value: "all", label: "All personas" },
  { value: "first_time", label: "First-time" },
  { value: "investor", label: "Investor" },
  { value: "realtor", label: "Realtor" },
];

type SortKey = "created_at" | "name" | "intent_score" | "project";
type SortDir = "asc" | "desc";

// ─── Visual atoms (Precision Control style) ───────────────────────────────────

function IntentBadge({ score }: { score: number | null }) {
  const s = score ?? 0;
  const tone =
    s >= 8
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : s >= 5
        ? "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400"
        : "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums tracking-tight",
        tone,
      )}
      title={`Intent score: ${s}/10`}
    >
      {s >= 8 && <Flame className="h-2.5 w-2.5" />}
      {s}/10
    </span>
  );
}

function StatusPill({ status }: { status: string | null }) {
  const s = (status || "new").toLowerCase();
  const map: Record<string, string> = {
    new: "bg-muted text-foreground border-border",
    contacted: "bg-primary/10 text-primary border-primary/20",
    qualified: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    converted: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
    lost: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
        map[s] || map.new,
      )}
    >
      {s}
    </span>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "hot" | "primary" | "success";
  icon: typeof Users;
}) {
  const valueClass =
    tone === "hot"
      ? "text-destructive"
      : tone === "primary"
        ? "text-primary"
        : tone === "success"
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-foreground";
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={cn("text-2xl font-bold leading-none tabular-nums", valueClass)}>{value}</p>
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/50 transition-colors group-hover:border-primary/30 group-hover:bg-primary/5",
          )}
        >
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
        </div>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  field,
  sort,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  field?: SortKey;
  sort: { key: SortKey; dir: SortDir };
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = field && sort.key === field;
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
        align === "right" ? "text-right" : "text-left",
        field && "cursor-pointer select-none hover:text-foreground",
        className,
      )}
      onClick={field ? () => onSort(field) : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {field &&
          (active ? (
            sort.dir === "asc" ? (
              <ArrowUp className="h-3 w-3 text-primary" />
            ) : (
              <ArrowDown className="h-3 w-3 text-primary" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-30" />
          ))}
      </span>
    </th>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-20 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
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
  const [intentFilter, setIntentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [personaFilter, setPersonaFilter] = useState<string>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "created_at", dir: "desc" });
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [selectedListingIds, setSelectedListingIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // ── Column visibility (persisted) ─────────────────────────────────────────
  type ColumnDef = { key: string; label: string; required?: boolean };
  const PROJECT_COLUMNS: ColumnDef[] = [
    { key: "name", label: "Name", required: true },
    { key: "contact", label: "Contact" },
    { key: "project", label: "Project" },
    { key: "intent", label: "Intent" },
    { key: "source", label: "Source" },
    { key: "status", label: "Status" },
    { key: "activity", label: "Last Activity" },
  ];
  const LISTING_COLUMNS: ColumnDef[] = [
    { key: "name", label: "Name", required: true },
    { key: "contact", label: "Contact" },
    { key: "listing", label: "Listing" },
    { key: "message", label: "Message" },
    { key: "submitted", label: "Submitted" },
  ];

  const [projectColumns, setProjectColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("admin_leads_project_cols");
      if (saved) return JSON.parse(saved);
    } catch {}
    return Object.fromEntries(PROJECT_COLUMNS.map((c) => [c.key, true]));
  });
  const [listingColumns, setListingColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("admin_leads_listing_cols");
      if (saved) return JSON.parse(saved);
    } catch {}
    return Object.fromEntries(LISTING_COLUMNS.map((c) => [c.key, true]));
  });

  const toggleProjectColumn = (key: string) => {
    setProjectColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("admin_leads_project_cols", JSON.stringify(next));
      } catch {}
      return next;
    });
  };
  const toggleListingColumn = (key: string) => {
    setListingColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("admin_leads_listing_cols", JSON.stringify(next));
      } catch {}
      return next;
    });
  };
  const resetProjectColumns = () => {
    const all = Object.fromEntries(PROJECT_COLUMNS.map((c) => [c.key, true]));
    setProjectColumns(all);
    try {
      localStorage.setItem("admin_leads_project_cols", JSON.stringify(all));
    } catch {}
  };
  const resetListingColumns = () => {
    const all = Object.fromEntries(LISTING_COLUMNS.map((c) => [c.key, true]));
    setListingColumns(all);
    try {
      localStorage.setItem("admin_leads_listing_cols", JSON.stringify(all));
    } catch {}
  };

  const selectedIds = activeTab === "project" ? selectedProjectIds : selectedListingIds;
  const setSelectedIds = activeTab === "project" ? setSelectedProjectIds : setSelectedListingIds;

  const toggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTab],
  );

  const toggleSelectAll = useCallback(
    (ids: string[]) => {
      setSelectedIds((prev) => {
        const allSelected = ids.every((id) => prev.has(id));
        if (allSelected) return new Set();
        return new Set(ids);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTab],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const onSort = useCallback((key: SortKey) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  }, []);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: projectLeads, isLoading: projectLoading } = useQuery({
    queryKey: ["admin-project-leads"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("project_leads")
        .select(`
          id, name, email, phone, message, persona, home_size, agent_status,
          lead_source, lead_sources, landing_page, created_at, project_id,
          lead_status, admin_notes, contacted_at, converted_at, responded_at,
          intent_score, lead_score, lead_temperature, form_type,
          visitor_id, session_id, pages_viewed, time_on_site, session_count,
          used_calculator, device_type, user_agent, ip_address, tracking_data,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer,
          first_touch_utm_source, first_touch_utm_medium, first_touch_utm_campaign,
          first_touch_at, city_interest, project_interest,
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

  const deleteProjectLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("project_leads").delete().eq("id", id);
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
      const { error } = await (supabase as any).from("leads").delete().eq("id", id);
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
    if (error) {
      toast.error("Failed to delete leads");
    } else {
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
    if (error) {
      toast.error("Failed to delete leads");
    } else {
      toast.success(`${ids.length} lead(s) deleted`);
      queryClient.invalidateQueries({ queryKey: ["admin-listing-leads"] });
      setSelectedListingIds(new Set());
    }
    setBulkDeleting(false);
  };

  const bulkEmailSelected = () => {
    const leads = activeTab === "project" ? projectLeads : listingLeads;
    if (!leads) return;
    const emails = leads.filter((l) => selectedIds.has(l.id)).map((l) => l.email);
    if (emails.length === 0) return;
    window.open(`mailto:${emails.join(",")}`, "_blank");
  };

  const bulkExportSelected = () => {
    const leads = activeTab === "project" ? filteredProjectLeads : filteredListingLeads;
    if (!leads) return;
    const selected = leads.filter((l) => selectedIds.has(l.id));
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

  // ── Filtering & sorting ───────────────────────────────────────────────────

  const getDateCutoff = () => {
    if (dateFilter === "today") return startOfDay(new Date());
    if (dateFilter === "7") return subDays(new Date(), 7);
    if (dateFilter === "30") return subDays(new Date(), 30);
    return null;
  };

  const filteredProjectLeads = useMemo(() => {
    const cutoff = getDateCutoff();
    const list = (projectLeads || []).filter((lead) => {
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
      const matchesDate = !cutoff || new Date(lead.created_at) >= cutoff;
      const score = lead.intent_score ?? 0;
      const matchesIntent =
        intentFilter === "all" ||
        (intentFilter === "hot" && score >= 8) ||
        (intentFilter === "warm" && score >= 5 && score < 8) ||
        (intentFilter === "cold" && score < 5);
      const matchesStatus = statusFilter === "all" || (lead.lead_status || "new") === statusFilter;
      const matchesPersona = personaFilter === "all" || lead.persona === personaFilter;
      return matchesSearch && matchesSource && matchesDate && matchesIntent && matchesStatus && matchesPersona;
    });

    const sorted = [...list].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "name") return a.name.localeCompare(b.name) * dir;
      if (sort.key === "intent_score") return ((a.intent_score ?? 0) - (b.intent_score ?? 0)) * dir;
      if (sort.key === "project") {
        return (a.presale_projects?.name || "").localeCompare(b.presale_projects?.name || "") * dir;
      }
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
    });
    return sorted;
  }, [projectLeads, searchQuery, sourceFilter, dateFilter, intentFilter, statusFilter, personaFilter, sort]);

  const filteredListingLeads = useMemo(() => {
    const cutoff = getDateCutoff();
    const list = (listingLeads || []).filter((lead) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.listings?.project_name.toLowerCase().includes(q);
      const matchesDate = !cutoff || new Date(lead.created_at) >= cutoff;
      return matchesSearch && matchesDate;
    });
    const sorted = [...list].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "name") return a.name.localeCompare(b.name) * dir;
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
    });
    return sorted;
  }, [listingLeads, searchQuery, dateFilter, sort]);

  // ── CSV Export ────────────────────────────────────────────────────────────

  const exportToCSV = (type: "project" | "listing") => {
    const leads = type === "project" ? filteredProjectLeads : filteredListingLeads;
    if (!leads || leads.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    if (type === "project") {
      csvContent += "Name,Email,Phone,Persona,Home Size,Source,Project,City,Notes,Submitted At\n";
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
    link.setAttribute("download", `${type}-leads-${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const allProject = projectLeads || [];
    const totalLeads = allProject.length + (listingLeads?.length || 0);
    const recentLeads = [...(projectLeads || []), ...(listingLeads || [])].filter((l) =>
      isAfter(new Date(l.created_at), subDays(new Date(), 7)),
    ).length;
    const hotLeads = allProject.filter((l) => (l.intent_score ?? 0) >= 8).length;
    const converted = allProject.filter((l) => l.converted_at).length;
    const conversion = allProject.length ? ((converted / allProject.length) * 100).toFixed(1) : "0.0";
    const scored = allProject.filter((l) => l.intent_score != null);
    const avgIntent = scored.length
      ? (scored.reduce((s, l) => s + (l.intent_score ?? 0), 0) / scored.length).toFixed(1)
      : "—";
    return { totalLeads, recentLeads, hotLeads, conversion, avgIntent };
  }, [projectLeads, listingLeads]);

  const hasActiveFilters =
    !!searchQuery ||
    sourceFilter !== "all" ||
    dateFilter !== "all" ||
    intentFilter !== "all" ||
    statusFilter !== "all" ||
    personaFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSourceFilter("all");
    setDateFilter("all");
    setIntentFilter("all");
    setStatusFilter("all");
    setPersonaFilter("all");
    setActivePresetId(null);
  };

  // ── Filter Presets ────────────────────────────────────────────────────────
  type FilterState = {
    search: string;
    source: string;
    date: string;
    intent: string;
    status: string;
    persona: string;
  };
  type FilterPreset = { id: string; name: string; icon?: string; filters: FilterState; builtIn?: boolean };

  const BUILT_IN_PRESETS: FilterPreset[] = [
    {
      id: "hot-new",
      name: "Hot · New",
      icon: "flame",
      builtIn: true,
      filters: { search: "", source: "all", date: "all", intent: "hot", status: "new", persona: "all" },
    },
    {
      id: "warm-contacted",
      name: "Warm · Contacted",
      icon: "activity",
      builtIn: true,
      filters: { search: "", source: "all", date: "all", intent: "warm", status: "contacted", persona: "all" },
    },
    {
      id: "this-week",
      name: "This Week",
      icon: "clock",
      builtIn: true,
      filters: { search: "", source: "all", date: "7", intent: "all", status: "all", persona: "all" },
    },
    {
      id: "investors",
      name: "Investors",
      icon: "target",
      builtIn: true,
      filters: { search: "", source: "all", date: "all", intent: "all", status: "all", persona: "investor" },
    },
    {
      id: "today-hot",
      name: "Today · Hot",
      icon: "sparkles",
      builtIn: true,
      filters: { search: "", source: "all", date: "today", intent: "hot", status: "all", persona: "all" },
    },
  ];

  const [customPresets, setCustomPresets] = useState<FilterPreset[]>(() => {
    try {
      const saved = localStorage.getItem("admin_leads_filter_presets");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const persistPresets = (presets: FilterPreset[]) => {
    try {
      localStorage.setItem("admin_leads_filter_presets", JSON.stringify(presets));
    } catch {}
  };

  const applyPreset = (preset: FilterPreset) => {
    setSearchQuery(preset.filters.search);
    setSourceFilter(preset.filters.source);
    setDateFilter(preset.filters.date);
    setIntentFilter(preset.filters.intent);
    setStatusFilter(preset.filters.status);
    setPersonaFilter(preset.filters.persona);
    setActivePresetId(preset.id);
  };

  const saveCurrentAsPreset = () => {
    const name = window.prompt("Name this preset (e.g. 'VIPs Last 30 Days')");
    if (!name?.trim()) return;
    const preset: FilterPreset = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      filters: {
        search: searchQuery,
        source: sourceFilter,
        date: dateFilter,
        intent: intentFilter,
        status: statusFilter,
        persona: personaFilter,
      },
    };
    const next = [...customPresets, preset];
    setCustomPresets(next);
    persistPresets(next);
    setActivePresetId(preset.id);
    toast.success(`Preset "${preset.name}" saved`);
  };

  const deletePreset = (id: string) => {
    const next = customPresets.filter((p) => p.id !== id);
    setCustomPresets(next);
    persistPresets(next);
    if (activePresetId === id) setActivePresetId(null);
    toast.success("Preset removed");
  };

  const presetIcon = (icon?: string) => {
    switch (icon) {
      case "flame":
        return <Flame className="h-3 w-3" />;
      case "activity":
        return <Activity className="h-3 w-3" />;
      case "clock":
        return <Clock className="h-3 w-3" />;
      case "target":
        return <Target className="h-3 w-3" />;
      case "sparkles":
        return <Sparkles className="h-3 w-3" />;
      default:
        return <Bookmark className="h-3 w-3" />;
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Leads | Admin</title>
      </Helmet>

      <div className="space-y-6">
        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Pipeline Command Center</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {kpis.totalLeads.toLocaleString()} leads across all sources · {kpis.recentLeads} this week
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/leads/analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => exportToCSV(activeTab as "project" | "listing")}
              disabled={
                (activeTab === "project" ? filteredProjectLeads.length : filteredListingLeads.length) === 0
              }
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* ── KPI Strip ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Total Leads"
            value={kpis.totalLeads.toLocaleString()}
            hint={`${kpis.recentLeads} new this week`}
            icon={Users}
          />
          <KpiCard
            label="Hot Leads"
            value={kpis.hotLeads}
            hint="Intent score 8+"
            tone="hot"
            icon={Flame}
          />
          <KpiCard
            label="Conversion"
            value={`${kpis.conversion}%`}
            hint="Lifetime project leads"
            tone="success"
            icon={Target}
          />
          <KpiCard
            label="Avg Intent"
            value={kpis.avgIntent}
            hint="Across scored leads"
            tone="primary"
            icon={Sparkles}
          />
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="project" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Projects
                {projectLeads && projectLeads.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                    {projectLeads.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="listing" className="gap-1.5">
                <Home className="h-3.5 w-3.5" />
                Listings
                {listingLeads && listingLeads.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                    {listingLeads.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
                  <X className="mr-1 h-3 w-3" /> Clear filters
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs">
                    <Columns3 className="h-3.5 w-3.5" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Visible Columns
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {activeTab === "project"
                    ? PROJECT_COLUMNS.map((col) => (
                        <DropdownMenuCheckboxItem
                          key={col.key}
                          checked={col.required ? true : !!projectColumns[col.key]}
                          disabled={col.required}
                          onCheckedChange={() => !col.required && toggleProjectColumn(col.key)}
                          onSelect={(e) => e.preventDefault()}
                          className="text-xs"
                        >
                          {col.label}
                          {col.required && (
                            <span className="ml-auto text-[9px] uppercase text-muted-foreground">Pinned</span>
                          )}
                        </DropdownMenuCheckboxItem>
                      ))
                    : LISTING_COLUMNS.map((col) => (
                        <DropdownMenuCheckboxItem
                          key={col.key}
                          checked={col.required ? true : !!listingColumns[col.key]}
                          disabled={col.required}
                          onCheckedChange={() => !col.required && toggleListingColumn(col.key)}
                          onSelect={(e) => e.preventDefault()}
                          className="text-xs"
                        >
                          {col.label}
                          {col.required && (
                            <span className="ml-auto text-[9px] uppercase text-muted-foreground">Pinned</span>
                          )}
                        </DropdownMenuCheckboxItem>
                      ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-xs"
                    onClick={() =>
                      activeTab === "project" ? resetProjectColumns() : resetListingColumns()
                    }
                  >
                    Reset to default
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* ── Filter Presets ─────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Bookmark className="h-3 w-3" /> Presets
            </span>
            {BUILT_IN_PRESETS.map((p) => {
              const active = activePresetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition-all",
                    active
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {presetIcon(p.icon)}
                  {p.name}
                </button>
              );
            })}
            {customPresets.map((p) => {
              const active = activePresetId === p.id;
              return (
                <div key={p.id} className="group relative inline-flex items-center">
                  <button
                    onClick={() => applyPreset(p)}
                    className={cn(
                      "inline-flex h-7 items-center gap-1.5 rounded-full border pl-2.5 pr-6 text-[11px] font-medium transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <Star className="h-3 w-3" />
                    {p.name}
                  </button>
                  <button
                    onClick={() => deletePreset(p.id)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    title="Delete preset"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            {hasActiveFilters && (
              <button
                onClick={saveCurrentAsPreset}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-border bg-transparent px-2.5 text-[11px] font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary"
              >
                <BookmarkPlus className="h-3 w-3" />
                Save current
              </button>
            )}
          </div>

          {/* ── Filter bar ─────────────────────────────────────── */}
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, project…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-nowrap">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="h-9 w-full text-sm lg:w-[140px]">
                    <Clock className="mr-1.5 h-3 w-3 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FILTERS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeTab === "project" && (
                  <>
                    <Select value={intentFilter} onValueChange={setIntentFilter}>
                      <SelectTrigger className="h-9 w-full text-sm lg:w-[130px]">
                        <Flame className="mr-1.5 h-3 w-3 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTENT_FILTERS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-9 w-full text-sm lg:w-[130px]">
                        <Activity className="mr-1.5 h-3 w-3 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_FILTERS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={personaFilter} onValueChange={setPersonaFilter}>
                      <SelectTrigger className="h-9 w-full text-sm lg:w-[140px]">
                        <Users className="mr-1.5 h-3 w-3 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERSONA_FILTERS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="h-9 w-full text-sm lg:w-[140px]">
                        <Filter className="mr-1.5 h-3 w-3 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="floor_plan_request">Floor Plans</SelectItem>
                        <SelectItem value="scheduler">Tour Requests</SelectItem>
                        <SelectItem value="general_inquiry">General</SelectItem>
                        <SelectItem value="vip_membership">VIP</SelectItem>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Project Leads ──────────────────────────────────── */}
          <TabsContent value="project" className="mt-0">
            {projectLoading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : !filteredProjectLeads.length ? (
              <EmptyState message="No project leads match your filters" />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {selectedProjectIds.size > 0 ? `${selectedProjectIds.size} selected · ` : ""}
                    {filteredProjectLeads.length} of {projectLeads?.length || 0} leads
                  </span>
                </div>

                {/* Desktop Table */}
                <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="w-8 px-3 py-2.5">
                            <Checkbox
                              checked={
                                filteredProjectLeads.length > 0 &&
                                filteredProjectLeads.every((l) => selectedProjectIds.has(l.id))
                              }
                              onCheckedChange={() => toggleSelectAll(filteredProjectLeads.map((l) => l.id))}
                            />
                          </th>
                          <SortHeader label="Name" field="name" sort={sort} onSort={onSort} />
                          {projectColumns.contact && <SortHeader label="Contact" sort={sort} onSort={onSort} />}
                          {projectColumns.project && (
                            <SortHeader label="Project" field="project" sort={sort} onSort={onSort} />
                          )}
                          {projectColumns.intent && (
                            <SortHeader label="Intent" field="intent_score" sort={sort} onSort={onSort} />
                          )}
                          {projectColumns.source && <SortHeader label="Source" sort={sort} onSort={onSort} />}
                          {projectColumns.status && <SortHeader label="Status" sort={sort} onSort={onSort} />}
                          {projectColumns.activity && (
                            <SortHeader label="Last activity" field="created_at" sort={sort} onSort={onSort} />
                          )}
                          <th className="w-10 px-3 py-2.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjectLeads.map((lead) => {
                          const sources =
                            lead.lead_sources && lead.lead_sources.length > 0
                              ? lead.lead_sources
                              : lead.lead_source
                                ? [lead.lead_source]
                                : [];
                          const primarySource = getLeadSourceLabel(sources[0] || null);
                          const extraCount = Math.max(0, sources.length - 1);
                          const isHot = (lead.intent_score ?? 0) >= 8;
                          const isSelected = selectedProjectIds.has(lead.id);

                          return (
                            <tr
                              key={lead.id}
                              onClick={() => {
                                setSelectedLead(lead);
                                setModalOpen(true);
                              }}
                              className={cn(
                                "group cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40",
                                isSelected && "bg-primary/5",
                                isHot && !isSelected && "border-l-2 border-l-destructive/60",
                              )}
                            >
                              <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleSelect(lead.id)}
                                />
                              </td>
                              {/* Name */}
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                                    {lead.name
                                      .split(" ")
                                      .map((p) => p[0])
                                      .slice(0, 2)
                                      .join("")
                                      .toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="max-w-[180px] truncate font-medium text-foreground">
                                      {lead.name}
                                    </p>
                                    {lead.persona && (
                                      <p className="text-[10px] text-muted-foreground">
                                        {getPersonaLabel(lead.persona)}
                                        {lead.home_size && ` · ${getHomeSizeLabel(lead.home_size)}`}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {/* Contact */}
                              {projectColumns.contact && (
                                <td className="px-3 py-3">
                                  <div className="flex flex-col gap-0.5">
                                    <a
                                      href={`mailto:${lead.email}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="block max-w-[180px] truncate text-xs text-muted-foreground transition-colors hover:text-primary"
                                    >
                                      {lead.email}
                                    </a>
                                    {lead.phone ? (
                                      <a
                                        href={`tel:${lead.phone}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs text-muted-foreground transition-colors hover:text-primary"
                                      >
                                        {lead.phone}
                                      </a>
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground/40">no phone</span>
                                    )}
                                  </div>
                                </td>
                              )}
                              {/* Project */}
                              {projectColumns.project && (
                                <td className="px-3 py-3">
                                  {lead.presale_projects ? (
                                    <div className="min-w-0">
                                      <p
                                        className="max-w-[160px] truncate text-xs font-medium"
                                        title={lead.presale_projects.name}
                                      >
                                        {lead.presale_projects.name}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {lead.presale_projects.city}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground/40">—</span>
                                  )}
                                </td>
                              )}
                              {/* Intent */}
                              {projectColumns.intent && (
                                <td className="px-3 py-3">
                                  <IntentBadge score={lead.intent_score} />
                                </td>
                              )}
                              {/* Source */}
                              {projectColumns.source && (
                                <td className="px-3 py-3">
                                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px]">
                                    {primarySource}
                                    {extraCount > 0 && (
                                      <span className="font-semibold text-primary">+{extraCount}</span>
                                    )}
                                  </span>
                                </td>
                              )}
                              {/* Status */}
                              {projectColumns.status && (
                                <td className="px-3 py-3">
                                  <StatusPill status={lead.lead_status} />
                                </td>
                              )}
                              {/* Last activity */}
                              {projectColumns.activity && (
                                <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                                  <div className="flex flex-col">
                                    <span>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
                                    <span className="text-[10px] text-muted-foreground/60">
                                      {format(new Date(lead.created_at), "MMM d, h:mm a")}
                                    </span>
                                  </div>
                                </td>
                              )}
                              {/* Quick Actions */}
                              <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  {lead.phone && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                                      asChild
                                      title="Call"
                                    >
                                      <a href={`tel:${lead.phone}`}>
                                        <Phone className="h-4 w-4" />
                                      </a>
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary hover:bg-primary/10"
                                    asChild
                                    title="Email"
                                  >
                                    <a href={`mailto:${lead.email}`}>
                                      <Mail className="h-4 w-4" />
                                    </a>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setSelectedLead(lead);
                                      setModalOpen(true);
                                    }}
                                    title="View Details"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                  <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                      {lead.presale_projects && (
                                        <DropdownMenuItem asChild>
                                          <a
                                            href={generateProjectUrl({
                                              slug: lead.presale_projects.slug,
                                              neighborhood:
                                                lead.presale_projects.neighborhood ||
                                                lead.presale_projects.city,
                                              projectType: (lead.presale_projects.project_type ||
                                                "condo") as any,
                                            })}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Project
                                          </a>
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => deleteProjectLeadMutation.mutate(lead.id)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-2 md:hidden">
                  {filteredProjectLeads.map((lead) => {
                    const primarySource = getLeadSourceLabel(lead.lead_source);
                    const isHot = (lead.intent_score ?? 0) >= 8;
                    return (
                      <div
                        key={lead.id}
                        onClick={() => {
                          setSelectedLead(lead);
                          setModalOpen(true);
                        }}
                        className={cn(
                          "rounded-xl border border-border bg-card p-3 transition-colors",
                          selectedProjectIds.has(lead.id) && "border-primary/30 bg-primary/5",
                          isHot && "border-l-4 border-l-destructive",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedProjectIds.has(lead.id)}
                            onCheckedChange={() => toggleSelect(lead.id)}
                            className="mt-1"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-medium">{lead.name}</p>
                              <IntentBadge score={lead.intent_score} />
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{lead.email}</p>
                            {lead.phone && (
                              <p className="text-xs text-muted-foreground">{lead.phone}</p>
                            )}
                            {/* Quick Actions Row */}
                            <div className="mt-3 flex items-center gap-1.5">
                              {lead.phone && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg border-border/50 text-emerald-600 hover:border-emerald-500/30 hover:bg-emerald-500/10"
                                  asChild
                                >
                                  <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}>
                                    <Phone className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-border/50 hover:border-primary/30 hover:bg-primary/10"
                                asChild
                              >
                                <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()}>
                                  <Mail className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-border/50 hover:border-primary/30 hover:bg-primary/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLead(lead);
                                  setModalOpen(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              <span className="ml-auto text-[11px] text-muted-foreground">
                                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            {/* Tags Row */}
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              {lead.presale_projects && (
                                <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[10px] font-normal">
                                  <Building2 className="h-2.5 w-2.5" />
                                  {lead.presale_projects.name}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                                {primarySource}
                              </Badge>
                              <StatusPill status={lead.lead_status} />
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

          {/* ── Listing Leads ──────────────────────────────────── */}
          <TabsContent value="listing" className="mt-0">
            {listingLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : !filteredListingLeads.length ? (
              <EmptyState message="No listing leads match your filters" />
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  {selectedListingIds.size > 0 ? `${selectedListingIds.size} selected · ` : ""}
                  {filteredListingLeads.length} of {listingLeads?.length || 0} leads
                </p>

                <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="w-8 px-3 py-2.5">
                            <Checkbox
                              checked={
                                filteredListingLeads.length > 0 &&
                                filteredListingLeads.every((l) => selectedListingIds.has(l.id))
                              }
                              onCheckedChange={() => toggleSelectAll(filteredListingLeads.map((l) => l.id))}
                            />
                          </th>
                          <SortHeader label="Name" field="name" sort={sort} onSort={onSort} />
                          {listingColumns.contact && <SortHeader label="Contact" sort={sort} onSort={onSort} />}
                          {listingColumns.listing && <SortHeader label="Listing" sort={sort} onSort={onSort} />}
                          {listingColumns.message && <SortHeader label="Message" sort={sort} onSort={onSort} />}
                          {listingColumns.submitted && (
                            <SortHeader label="Submitted" field="created_at" sort={sort} onSort={onSort} />
                          )}
                          <th className="w-10 px-3 py-2.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredListingLeads.map((lead) => (
                          <tr
                            key={lead.id}
                            onClick={() => {
                              setSelectedLead(lead);
                              setModalOpen(true);
                            }}
                            className={cn(
                              "cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40",
                              selectedListingIds.has(lead.id) && "bg-primary/5",
                            )}
                          >
                            <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedListingIds.has(lead.id)}
                                onCheckedChange={() => toggleSelect(lead.id)}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <p className="max-w-[180px] truncate font-medium">{lead.name}</p>
                            </td>
                            {listingColumns.contact && (
                              <td className="px-3 py-3">
                                <div className="flex flex-col gap-0.5">
                                  <a
                                    href={`mailto:${lead.email}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="block max-w-[180px] truncate text-xs text-muted-foreground hover:text-primary"
                                  >
                                    {lead.email}
                                  </a>
                                  {lead.phone && (
                                    <a
                                      href={`tel:${lead.phone}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-xs text-muted-foreground hover:text-primary"
                                    >
                                      {lead.phone}
                                    </a>
                                  )}
                                </div>
                              </td>
                            )}
                            {listingColumns.listing && (
                              <td className="px-3 py-3">
                                {lead.listings ? (
                                  <span
                                    className="block max-w-[160px] truncate text-xs"
                                    title={lead.listings.title}
                                  >
                                    {lead.listings.title}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground/40">—</span>
                                )}
                              </td>
                            )}
                            {listingColumns.message && (
                              <td className="px-3 py-3">
                                {lead.message ? (
                                  <span
                                    className="block max-w-[200px] truncate text-xs text-muted-foreground"
                                    title={lead.message}
                                  >
                                    {lead.message}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground/40">—</span>
                                )}
                              </td>
                            )}
                            {listingColumns.submitted && (
                              <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                              </td>
                            )}
                            {/* Quick Actions */}
                            <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                {lead.phone && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                                    asChild
                                    title="Call"
                                  >
                                    <a href={`tel:${lead.phone}`}>
                                      <Phone className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-primary hover:bg-primary/10"
                                  asChild
                                  title="Email"
                                >
                                  <a href={`mailto:${lead.email}`}>
                                    <Mail className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    setModalOpen(true);
                                  }}
                                  title="View Details"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                <DropdownMenu modal={false}>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    {lead.listings && (
                                      <DropdownMenuItem asChild>
                                        <a
                                          href={`/assignments/${lead.listing_id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Listing
                                        </a>
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => deleteListingLeadMutation.mutate(lead.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile cards */}
                <div className="space-y-2 md:hidden">
                  {filteredListingLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => {
                        setSelectedLead(lead);
                        setModalOpen(true);
                      }}
                      className={cn(
                        "rounded-xl border border-border bg-card p-3",
                        selectedListingIds.has(lead.id) && "border-primary/30 bg-primary/5",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedListingIds.has(lead.id)}
                          onCheckedChange={() => toggleSelect(lead.id)}
                          className="mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{lead.name}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{lead.email}</p>
                          {lead.phone && <p className="text-xs text-muted-foreground">{lead.phone}</p>}
                            {/* Quick Actions */}
                            <div className="mt-3 flex items-center gap-1.5">
                              {lead.phone && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg border-border/50 text-emerald-600 hover:border-emerald-500/30 hover:bg-emerald-500/10"
                                  asChild
                                >
                                  <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}>
                                    <Phone className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-border/50 hover:border-primary/30 hover:bg-primary/10"
                                asChild
                              >
                                <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()}>
                                  <Mail className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-border/50 hover:border-primary/30 hover:bg-primary/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLead(lead);
                                  setModalOpen(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              <span className="ml-auto text-[11px] text-muted-foreground">
                                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            {/* Tags */}
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              {lead.listings && (
                                <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[10px] font-normal">
                                  <Home className="h-2.5 w-2.5" />
                                  {lead.listings.title}
                                </Badge>
                              )}
                            </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ── Floating Bulk Action Bar ──────────────────────────── */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 animate-in slide-in-from-bottom-4 items-center gap-3 rounded-xl bg-foreground px-5 py-3 text-background shadow-2xl duration-200">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="text-sm font-semibold">{selectedIds.size} selected</span>
            </div>
            <div className="h-5 w-px bg-background/20" />
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-xs text-background hover:bg-background/10 hover:text-background"
              onClick={bulkEmailSelected}
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-xs text-background hover:bg-background/10 hover:text-background"
              onClick={bulkExportSelected}
            >
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={bulkDeleting}
              onClick={() => {
                if (confirm(`Delete ${selectedIds.size} lead(s)? This cannot be undone.`)) {
                  activeTab === "project" ? bulkDeleteProjectLeads() : bulkDeleteListingLeads();
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
            <div className="h-5 w-px bg-background/20" />
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-background/60 hover:bg-background/10 hover:text-background"
              onClick={clearSelection}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

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
