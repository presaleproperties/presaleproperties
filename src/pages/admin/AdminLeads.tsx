import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
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
  BarChart3
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LeadDetailsModal } from "@/components/admin/LeadDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export default function AdminLeads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("project");
  const [selectedLead, setSelectedLead] = useState<ProjectLead | ListingLead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch project leads (exclude newsletter signups)
  const { data: projectLeads, isLoading: projectLoading } = useQuery({
    queryKey: ["admin-project-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_leads")
        .select(`
          id,
          name,
          email,
          phone,
          message,
          persona,
          home_size,
          agent_status,
          created_at,
          project_id,
          presale_projects (
            name,
            slug,
            city
          )
        `)
        .neq("name", "Newsletter Signup")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectLead[];
    },
  });

  // Fetch listing leads
  const { data: listingLeads, isLoading: listingLoading } = useQuery({
    queryKey: ["admin-listing-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          id,
          name,
          email,
          phone,
          message,
          created_at,
          listing_id,
          listings (
            title,
            project_name,
            city
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ListingLead[];
    },
  });

  // Filter leads based on search
  const filteredProjectLeads = projectLeads?.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.presale_projects?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredListingLeads = listingLeads?.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.listings?.project_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Export to CSV
  const exportToCSV = (type: "project" | "listing") => {
    const leads = type === "project" ? filteredProjectLeads : filteredListingLeads;
    if (!leads || leads.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (type === "project") {
      csvContent += "Name,Email,Phone,Persona,Home Size,Agent Status,Project,City,Submitted At\n";
      leads.forEach((lead: any) => {
        const project = lead.presale_projects;
        const personaLabel = lead.persona === "first_time" ? "First-time Buyer" : lead.persona === "investor" ? "Investor" : lead.persona === "realtor" ? "Realtor" : lead.persona || "";
        const homeSizeLabel = lead.home_size === "1_bed" ? "1 Bed" : lead.home_size === "2_bed" ? "2 Bed" : lead.home_size === "3_bed_plus" ? "3 Bed+" : lead.home_size || "";
        const agentStatusLabel = lead.agent_status === "i_am_realtor" ? "Is Agent" : lead.agent_status === "yes" ? "Has Agent" : "No Agent";
        csvContent += `"${lead.name}","${lead.email}","${lead.phone || ""}","${personaLabel}","${homeSizeLabel}","${agentStatusLabel}","${project?.name || ""}","${project?.city || ""}","${format(new Date(lead.created_at), "yyyy-MM-dd HH:mm")}"\n`;
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Leads</h1>
            <p className="text-muted-foreground">
              Manage all leads from project and listing forms
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/admin/leads/analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </Button>
            <Badge variant="secondary" className="text-sm py-1 px-3">
              <Users className="h-4 w-4 mr-1.5" />
              {totalLeads} Total Leads
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{projectLeads?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Project Leads</p>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{listingLeads?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Listing Leads</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="project" className="gap-2">
                <Building2 className="h-4 w-4" />
                Project Leads
              </TabsTrigger>
              <TabsTrigger value="listing" className="gap-2">
                <Home className="h-4 w-4" />
                Listing Leads
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(activeTab as "project" | "listing")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Project Leads Tab */}
          <TabsContent value="project">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="hidden lg:table-cell">Persona</TableHead>
                    <TableHead className="hidden md:table-cell">Home Size</TableHead>
                    <TableHead className="hidden md:table-cell">Agent</TableHead>
                    <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredProjectLeads?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No project leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjectLeads?.map((lead) => {
                      const personaLabel = lead.persona === "first_time" ? "First-time" : lead.persona === "investor" ? "Investor" : lead.persona === "realtor" ? "Realtor" : lead.persona || "—";
                      const homeSizeLabel = lead.home_size === "1_bed" ? "1 Bed" : lead.home_size === "2_bed" ? "2 Bed" : lead.home_size === "3_bed_plus" ? "3 Bed+" : lead.home_size || "—";
                      const agentStatusLabel = lead.agent_status === "i_am_realtor" ? "Is Agent" : lead.agent_status === "yes" ? "Has Agent" : "No Agent";
                      
                      return (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{lead.name}</p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {lead.email}
                                </span>
                                {lead.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {lead.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.presale_projects ? (
                              <div>
                                <p className="font-medium">{lead.presale_projects.name}</p>
                                <p className="text-sm text-muted-foreground">{lead.presale_projects.city}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant={lead.persona === "investor" ? "default" : "secondary"}>
                              {personaLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">{homeSizeLabel}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant={agentStatusLabel === "Is Agent" ? "default" : agentStatusLabel === "Has Agent" ? "secondary" : "outline"}>
                              {agentStatusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {format(new Date(lead.created_at), "MMM d, yyyy")}
                            <br />
                            <span className="text-xs">{format(new Date(lead.created_at), "h:mm a")}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setModalOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" asChild>
                                <a href={`mailto:${lead.email}`}>
                                  <Mail className="h-4 w-4" />
                                </a>
                              </Button>
                              {lead.presale_projects && (
                                <Button variant="ghost" size="icon" asChild>
                                  <a 
                                    href={`/presale-projects/${lead.presale_projects.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Listing Leads Tab */}
          <TabsContent value="listing">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Listing</TableHead>
                    <TableHead className="hidden md:table-cell">Message</TableHead>
                    <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listingLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-40" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredListingLeads?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No listing leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredListingLeads?.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {lead.email}
                              </span>
                              {lead.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {lead.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.listings ? (
                            <div>
                              <p className="font-medium line-clamp-1">{lead.listings.title}</p>
                              <p className="text-sm text-muted-foreground">{lead.listings.project_name}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                            {lead.message || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {format(new Date(lead.created_at), "MMM d, yyyy")}
                          <br />
                          <span className="text-xs">{format(new Date(lead.created_at), "h:mm a")}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedLead(lead);
                                setModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <a href={`mailto:${lead.email}`}>
                                <Mail className="h-4 w-4" />
                              </a>
                            </Button>
                            {lead.listings && (
                              <Button variant="ghost" size="icon" asChild>
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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