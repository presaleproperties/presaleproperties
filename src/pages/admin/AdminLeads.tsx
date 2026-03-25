import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, startOfDay } from "date-fns";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
  { label: string; color: string; dotColor: string; icon: React.ReactNode }
> = {
  new: {
    label: "New",
    color: "bg-secondary text-secondary-foreground border-secondary",
    dotColor: "bg-primary",
    icon: <Circle className="h-3 w-3" />,
  },
  contacted: {
    label: "Contacted",
    color: "bg-secondary text-foreground border-border",
    dotColor: "bg-foreground/50",
    icon: <PhoneCall className="h-3 w-3" />,
  },
  qualified: {
    label: "Qualified",
    color: "bg-primary/10 text-primary border-primary/20",
    dotColor: "bg-primary",
    icon: <Star className="h-3 w-3" />,
  },
  converted: {
    label: "Converted",
    color: "bg-primary/20 text-primary border-primary/30",
    dotColor: "bg-primary",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  dead: {
    label: "Dead",
    color: "bg-muted text-muted-foreground border-border",
    dotColor: "bg-muted-foreground",
    icon: <XCircle className="h-3 w-3" />,
  },
};

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

// ─── Lead Card ────────────────────────────────────────────────────────────────

function ProjectLeadCard({
  lead,
  onView,
  onStatusChange,
  onNoteSave,
}: {
  lead: ProjectLead;
  onView: () => void;
  onStatusChange: (id: string, status: LeadStatus, timestamps?: Record<string, string>) => void;
  onNoteSave: (id: string, notes: string) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(lead.admin_notes || "");

  const currentStatus = (lead.lead_status as LeadStatus) || "new";
  const cfg = STATUS_CONFIG[currentStatus];

  const handleStatusChange = (newStatus: LeadStatus) => {
    const timestamps: Record<string, string> = {};
    if (newStatus === "contacted" && !lead.contacted_at) {
      timestamps.contacted_at = new Date().toISOString();
    }
    if (newStatus === "converted" && !lead.converted_at) {
      timestamps.converted_at = new Date().toISOString();
    }
    onStatusChange(lead.id, newStatus, timestamps);
  };

  const phoneClean = lead.phone?.replace(/\D/g, "") ?? "";

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Left content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Row 1: intent dot + name + date */}
            <div className="flex items-center gap-2 flex-wrap">
              <IntentDot score={lead.intent_score} />
              <h3 className="font-semibold text-foreground">{lead.name}</h3>
              <span className="text-xs text-muted-foreground">
                {format(new Date(lead.created_at), "MMM d, yyyy · h:mm a")}
              </span>
              {lead.contacted_at && (
                <span className="text-xs text-muted-foreground">
                  · Contacted {format(new Date(lead.contacted_at), "MMM d")}
                </span>
              )}
              {lead.converted_at && (
                <span className="text-xs text-primary font-medium">
                  · Converted {format(new Date(lead.converted_at), "MMM d")}
                </span>
              )}
            </div>

            {/* Row 2: contact */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {lead.email}
              </span>
              {lead.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {lead.phone}
                </span>
              )}
            </div>

            {/* Row 3: badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {lead.presale_projects && (
                <Badge variant="outline" className="gap-1 font-normal text-xs">
                  <Building2 className="h-3 w-3" />
                  {lead.presale_projects.name} · {lead.presale_projects.city}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {getLeadSourceLabel(lead.lead_source)}
              </Badge>
              {lead.persona && (
                <Badge
                  variant={lead.persona === "investor" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {getPersonaLabel(lead.persona)}
                </Badge>
              )}
              {lead.home_size && (
                <Badge variant="outline" className="text-xs">
                  {getHomeSizeLabel(lead.home_size)}
                </Badge>
              )}
              <Badge
                variant={lead.agent_status === "i_am_realtor" ? "default" : "outline"}
                className="text-xs"
              >
                {getAgentLabel(lead.agent_status)}
              </Badge>
            </div>

            {/* Row 4: inline notes */}
            {noteOpen ? (
              <div className="flex items-end gap-2 pt-1">
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add admin notes..."
                  className="text-xs min-h-[60px] resize-none"
                  rows={2}
                />
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => {
                      onNoteSave(lead.id, noteText);
                      setNoteOpen(false);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2"
                    onClick={() => {
                      setNoteText(lead.admin_notes || "");
                      setNoteOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : lead.admin_notes ? (
              <p
                className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 cursor-pointer hover:bg-muted"
                onClick={() => setNoteOpen(true)}
                title="Click to edit note"
              >
                📝 {lead.admin_notes}
              </p>
            ) : null}
          </div>

          {/* Right: status dropdown + actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Status dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-7 text-xs gap-1.5 border ${cfg.color}`}
                >
                  <span className={`h-2 w-2 rounded-full ${cfg.dotColor}`} />
                  {cfg.label}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs">Set Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((s) => (
                  <DropdownMenuItem
                    key={s}
                    className="text-xs gap-2"
                    onClick={() => handleStatusChange(s)}
                  >
                    <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[s].dotColor}`} />
                    {STATUS_CONFIG[s].label}
                    {s === currentStatus && <CheckCircle2 className="h-3 w-3 ml-auto text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Action buttons */}
            <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onView} title="View details">
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setNoteOpen((v) => !v)}
                title="Add note"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Email">
                <a href={`mailto:${lead.email}`}>
                  <Mail className="h-3.5 w-3.5" />
                </a>
              </Button>
              {lead.phone && (
                <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="WhatsApp">
                  <a
                    href={`https://wa.me/${phoneClean}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                </Button>
              )}
              {lead.presale_projects && (
                <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="View project">
                  <a
                    href={`/presale-projects/${lead.presale_projects.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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

function ListingLeadCard({
  lead,
  onView,
}: {
  lead: ListingLead;
  onView: () => void;
}) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-foreground">{lead.name}</h3>
              <span className="text-xs text-muted-foreground">
                {format(new Date(lead.created_at), "MMM d, yyyy · h:mm a")}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {lead.email}
              </span>
              {lead.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {lead.phone}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {lead.listings && (
                <Badge variant="outline" className="gap-1 font-normal text-xs">
                  <Home className="h-3 w-3" />
                  {lead.listings.title}
                </Badge>
              )}
              {lead.message && (
                <span
                  className="text-xs text-muted-foreground truncate max-w-[200px]"
                  title={lead.message}
                >
                  "{lead.message}"
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={`mailto:${lead.email}`}>
                <Mail className="h-4 w-4" />
              </a>
            </Button>
            {lead.listings && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a
                  href={`/assignments/${lead.listing_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
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

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: projectLeads, isLoading: projectLoading } = useQuery({
    queryKey: ["admin-project-leads"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("project_leads")
        .select(`
          id, name, email, phone, message, persona, home_size, agent_status,
          lead_source, landing_page, created_at, project_id,
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
    link.setAttribute(
      "download",
      `${type}-leads-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
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

        {/* Stats + Pipeline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-primary/10 p-2">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{projectLeads?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Project Leads</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-secondary-foreground/30">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-secondary p-2">
                <Home className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold">{listingLeads?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Listing Leads</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary/40 sm:col-span-1 col-span-2">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Pipeline</p>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                    className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      statusFilter === s
                        ? STATUS_CONFIG[s].color + " font-semibold"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[s].dotColor}`} />
                    {STATUS_CONFIG[s].label}
                    <span className="font-bold">{pipelineCounts[s]}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary sm:col-span-1 col-span-2">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-primary/10 p-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{pipelineCounts.converted}</p>
                <p className="text-xs text-muted-foreground">Converted</p>
              </div>
            </CardContent>
          </Card>
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
              {/* Date filter */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[100px] h-9 text-sm">
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
                <>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[120px] h-9 text-sm">
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="floor_plan_request">Floor Plans</SelectItem>
                      <SelectItem value="scheduler">Tour Requests</SelectItem>
                      <SelectItem value="general_inquiry">General</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[110px] h-9 text-sm">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_CONFIG[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}

              <div className="relative flex-1 sm:max-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => exportToCSV(activeTab as "project" | "listing")}
              >
                <Download className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>

          {/* Project Leads */}
          <TabsContent value="project" className="space-y-2">
            {projectLoading ? (
              [...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-64" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredProjectLeads?.length === 0 ? (
              <EmptyState message="No project leads found" />
            ) : (
              filteredProjectLeads?.map((lead) => (
                <ProjectLeadCard
                  key={lead.id}
                  lead={lead}
                  onView={() => {
                    setSelectedLead(lead);
                    setModalOpen(true);
                  }}
                  onStatusChange={(id, status, timestamps) =>
                    updateStatusMutation.mutate({ id, status, timestamps })
                  }
                  onNoteSave={(id, notes) => updateNotesMutation.mutate({ id, notes })}
                />
              ))
            )}
          </TabsContent>

          {/* Listing Leads */}
          <TabsContent value="listing" className="space-y-2">
            {listingLoading ? (
              [...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredListingLeads?.length === 0 ? (
              <EmptyState message="No listing leads found" />
            ) : (
              filteredListingLeads?.map((lead) => (
                <ListingLeadCard
                  key={lead.id}
                  lead={lead}
                  onView={() => {
                    setSelectedLead(lead);
                    setModalOpen(true);
                  }}
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
