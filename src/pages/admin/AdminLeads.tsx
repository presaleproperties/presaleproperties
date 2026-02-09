import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
  Inbox
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
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

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
  presale_projects: {
    name: string;
    slug: string;
    city: string;
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
  return sourceMap[source] || source.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
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

function LeadCard({ lead, type, onView }: { lead: ProjectLead | ListingLead; type: "project" | "listing"; onView: () => void }) {
  const isProject = type === "project";
  const pLead = lead as ProjectLead;
  const lLead = lead as ListingLead;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Contact + Property */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Name + Date */}
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">{lead.name}</h3>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(lead.created_at), "MMM d, yyyy · h:mm a")}
              </span>
            </div>

            {/* Contact row */}
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

            {/* Property + Badges */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {isProject && pLead.presale_projects ? (
                <Badge variant="outline" className="gap-1 font-normal">
                  <Building2 className="h-3 w-3" />
                  {pLead.presale_projects.name} · {pLead.presale_projects.city}
                </Badge>
              ) : !isProject && lLead.listings ? (
                <Badge variant="outline" className="gap-1 font-normal">
                  <Home className="h-3 w-3" />
                  {lLead.listings.title}
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
                    <Badge variant="outline" className="text-xs">
                      {getHomeSizeLabel(pLead.home_size)}
                    </Badge>
                  )}
                  <Badge 
                    variant={pLead.agent_status === "i_am_realtor" ? "default" : "outline"} 
                    className="text-xs"
                  >
                    {getAgentLabel(pLead.agent_status)}
                  </Badge>
                </>
              )}

              {!isProject && lLead.message && (
                <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={lLead.message}>
                  "{lLead.message}"
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={`mailto:${lead.email}`}>
                <Mail className="h-4 w-4" />
              </a>
            </Button>
            {isProject && pLead.presale_projects && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={`/presale-projects/${pLead.presale_projects.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            {!isProject && lLead.listings && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={`/assignments/${lLead.listing_id}`} target="_blank" rel="noopener noreferrer">
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

export default function AdminLeads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("project");
  const [selectedLead, setSelectedLead] = useState<ProjectLead | ListingLead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const { data: projectLeads, isLoading: projectLoading } = useQuery({
    queryKey: ["admin-project-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_leads")
        .select(`
          id, name, email, phone, message, persona, home_size, agent_status,
          lead_source, landing_page, created_at, project_id,
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
      const { data, error } = await supabase
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

  const filteredProjectLeads = projectLeads?.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.presale_projects?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource =
      sourceFilter === "all" ||
      (sourceFilter === "floor_plan_request" && (lead.lead_source === "floor_plan_request" || !lead.lead_source)) ||
      lead.lead_source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const filteredListingLeads = listingLeads?.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.listings?.project_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToCSV = (type: "project" | "listing") => {
    const leads = type === "project" ? filteredProjectLeads : filteredListingLeads;
    if (!leads || leads.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    if (type === "project") {
      csvContent += "Name,Email,Phone,Persona,Home Size,Agent Status,Project,City,Submitted At\n";
      leads.forEach((lead: any) => {
        const project = lead.presale_projects;
        csvContent += `"${lead.name}","${lead.email}","${lead.phone || ""}","${getPersonaLabel(lead.persona)}","${getHomeSizeLabel(lead.home_size)}","${getAgentLabel(lead.agent_status)}","${project?.name || ""}","${project?.city || ""}","${format(new Date(lead.created_at), "yyyy-MM-dd HH:mm")}"\n`;
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

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projectLeads?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Project Leads</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{listingLeads?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Listing Leads</p>
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

            <div className="flex items-center gap-2 flex-1 sm:justify-end">
              {activeTab === "project" && (
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[130px] h-9 text-sm">
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
              <div className="relative flex-1 sm:max-w-[240px]">
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
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  type="project"
                  onView={() => { setSelectedLead(lead); setModalOpen(true); }}
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
