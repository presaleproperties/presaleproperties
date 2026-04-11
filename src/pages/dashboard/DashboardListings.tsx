import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Building2,
  MapPin,
  Bed,
  Bath,
  Edit,
  Eye,
  Loader2,
  Send,
  Pause,
  Play,
  RefreshCw,
  MoreHorizontal,
  Search,
  X,
  Upload,
  Sparkles,
  FileText,
  BookOpen,
  Wand2,
  Globe,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Listing {
  id: string;
  title: string;
  project_name: string;
  city: string;
  neighborhood: string | null;
  beds: number;
  baths: number;
  assignment_price: number;
  status: string;
  agent_id: string | null;
  expires_at: string | null;
  rejection_reason: string | null;
  [key: string]: any;
}

interface PresaleProject {
  id: string;
  name: string;
  city: string;
  neighborhood: string | null;
  address: string | null;
  developer_name: string | null;
  featured_image: string | null;
  gallery_images: string[] | null;
  completion_year: number | null;
  completion_month: number | null;
  brochure_files: string[] | null;
  slug: string;
}

interface AddListingForm {
  project_id: string;
  project_name: string;
  city: string;
  neighborhood: string;
  address: string;
  developer_name: string;
  featured_image: string;
  unit_number: string;
  unit_type: string;
  beds: string;
  baths: string;
  floor_level: string;
  interior_sqft: string;
  exterior_sqft: string;
  exposure: string;
  parking: string;
  has_locker: boolean;
  floor_plan_url: string;
  floor_plan_name: string;
  brochure_url: string;
  estimated_completion: string;
  assignment_price: string;
  original_price: string;
  deposit_to_lock: string;
  buyer_agent_commission: string;
  developer_approval_required: boolean;
  description: string;
  title: string;
}

const EMPTY_FORM: AddListingForm = {
  project_id: "", project_name: "", city: "", neighborhood: "", address: "",
  developer_name: "", featured_image: "",
  unit_number: "", unit_type: "", beds: "", baths: "", floor_level: "",
  interior_sqft: "", exterior_sqft: "", exposure: "", parking: "", has_locker: false,
  floor_plan_url: "", floor_plan_name: "",
  brochure_url: "",
  estimated_completion: "",
  assignment_price: "", original_price: "", deposit_to_lock: "", buyer_agent_commission: "",
  developer_approval_required: false,
  description: "", title: "",
};

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  pending_payment: { label: "Pending Payment", variant: "outline" },
  pending_approval: { label: "Pending Approval", variant: "outline" },
  published: { label: "Published", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  expired: { label: "Expired", variant: "secondary" },
  paused: { label: "Paused", variant: "secondary" },
};

export default function DashboardListings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add listing dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddListingForm>(EMPTY_FORM);
  const [addSaving, setAddSaving] = useState(false);
  const [projects, setProjects] = useState<PresaleProject[]>([]);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectSearchFocused, setProjectSearchFocused] = useState(false);
  const [floorPlanUploading, setFloorPlanUploading] = useState(false);
  const [floorPlanExtracting, setFloorPlanExtracting] = useState(false);
  const [brochureUploading, setBrochureUploading] = useState(false);
  const [floorPlanDragOver, setFloorPlanDragOver] = useState(false);
  const [brochureDragOver, setBrochureDragOver] = useState(false);

  useEffect(() => {
    if (user) {
      fetchListings();
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("presale_projects")
      .select("id, name, city, neighborhood, address, developer_name, featured_image, gallery_images, completion_year, completion_month, brochure_files, slug")
      .eq("is_published", true)
      .order("name");
    if (data) setProjects(data as PresaleProject[]);
  };

  const fetchListings = async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from("listings")
        .select("*")
        .eq("agent_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Project picker ─────────────────────────────────────────────────────
  const handleProjectSelect = (project: PresaleProject) => {
    const completion = project.completion_month && project.completion_year
      ? `${MONTHS[project.completion_month]} ${project.completion_year}`
      : project.completion_year ? `${project.completion_year}` : "";
    const projectBrochure = project.brochure_files?.[0] || null;

    setAddForm(f => ({
      ...f,
      project_id: project.id,
      project_name: project.name,
      city: project.city,
      neighborhood: project.neighborhood || "",
      address: project.address || "",
      developer_name: project.developer_name || "",
      featured_image: project.featured_image || "",
      estimated_completion: f.estimated_completion || completion,
      brochure_url: f.brochure_url || projectBrochure || "",
      title: f.unit_number ? `${project.name} – Unit ${f.unit_number}` : project.name,
    }));
    setProjectSearch(project.name);
    setProjectSearchFocused(false);
  };

  // ── Upload + AI-extract floor plan ──────────────────────────────────────
  const uploadAndExtractFloorPlan = async (file: File) => {
    setFloorPlanUploading(true);
    let publicUrl = "";
    try {
      const ext = file.name.split(".").pop();
      const path = `floor-plans/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("listing-files")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("listing-files").getPublicUrl(path);
      publicUrl = urlData.publicUrl;
      setAddForm(f => ({
        ...f,
        floor_plan_url: publicUrl,
        floor_plan_name: f.floor_plan_name || file.name.replace(/\.[^/.]+$/, ""),
      }));
      toast({ title: "Floor plan uploaded ✓", description: "Extracting details with AI…" });
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
      setFloorPlanUploading(false);
      return;
    }
    setFloorPlanUploading(false);

    // AI extraction
    setFloorPlanExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-floor-plan", {
        body: { fileUrl: publicUrl, fileName: file.name },
      });
      if (error) throw error;
      if (data?.data) {
        const d = data.data;
        setAddForm(f => ({
          ...f,
          unit_number: d.unit_number || f.unit_number,
          unit_type: d.unit_type || f.unit_type,
          beds: d.beds != null ? String(d.beds) : f.beds,
          baths: d.baths != null ? String(d.baths) : f.baths,
          floor_level: d.floor_level != null ? String(d.floor_level) : f.floor_level,
          interior_sqft: d.interior_sqft != null ? String(d.interior_sqft) : f.interior_sqft,
          exterior_sqft: d.exterior_sqft != null ? String(d.exterior_sqft) : f.exterior_sqft,
          exposure: d.exposure || f.exposure,
          floor_plan_name: d.floor_plan_name || f.floor_plan_name,
          title: f.project_name && (d.unit_number || f.unit_number)
            ? `${f.project_name} – Unit ${d.unit_number || f.unit_number}`
            : f.title,
        }));
        toast({ title: "AI extracted unit details ✓", description: "Review and adjust as needed" });
      }
    } catch (err) {
      toast({ title: "AI extraction skipped", description: "Fill in unit details manually", variant: "default" });
    } finally {
      setFloorPlanExtracting(false);
    }
  };

  const handleFloorPlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAndExtractFloorPlan(file);
  };

  const handleFloorPlanDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setFloorPlanDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadAndExtractFloorPlan(file);
  };

  // ── Brochure upload ──────────────────────────────────────────────────────
  const uploadBrochure = async (file: File) => {
    setBrochureUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `brochures/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("listing-files")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("listing-files").getPublicUrl(path);
      setAddForm(f => ({ ...f, brochure_url: urlData.publicUrl }));
      toast({ title: "Brochure uploaded ✓" });
    } catch (err) {
      toast({ title: "Brochure upload failed", description: String(err), variant: "destructive" });
    } finally {
      setBrochureUploading(false);
    }
  };

  const handleBrochureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadBrochure(file);
  };

  const handleBrochureDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setBrochureDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadBrochure(file);
  };

  // ── Save new listing ──────────────────────────────────────────────────────
  const handleAddListing = async () => {
    if (!user) return;
    if (!addForm.project_id) {
      toast({ title: "Select a project first", variant: "destructive" });
      return;
    }
    if (!addForm.unit_number) {
      toast({ title: "Unit number is required", variant: "destructive" });
      return;
    }

    setAddSaving(true);
    try {
      const title = addForm.title || `${addForm.project_name} – Unit ${addForm.unit_number}`;

      const payload: Record<string, any> = {
        project_id: addForm.project_id,
        agent_id: user.id,
        title,
        project_name: addForm.project_name,
        city: addForm.city,
        neighborhood: addForm.neighborhood || null,
        address: addForm.address || null,
        developer_name: addForm.developer_name || null,
        featured_image: addForm.featured_image || null,
        unit_number: addForm.unit_number,
        unit_type: addForm.unit_type || null,
        beds: parseFloat(addForm.beds) || 0,
        baths: parseFloat(addForm.baths) || 0,
        floor_level: addForm.floor_level ? parseInt(addForm.floor_level) : null,
        interior_sqft: addForm.interior_sqft ? parseInt(addForm.interior_sqft) : null,
        exterior_sqft: addForm.exterior_sqft ? parseInt(addForm.exterior_sqft) : null,
        exposure: addForm.exposure || null,
        parking: addForm.parking || null,
        has_locker: addForm.has_locker,
        floor_plan_url: addForm.floor_plan_url || null,
        floor_plan_name: addForm.floor_plan_name || null,
        brochure_url: addForm.brochure_url || null,
        estimated_completion: addForm.estimated_completion || null,
        assignment_price: parseFloat(String(addForm.assignment_price).replace(/[^0-9.]/g, "")) || 0,
        original_price: addForm.original_price ? parseFloat(String(addForm.original_price).replace(/[^0-9.]/g, "")) : null,
        deposit_to_lock: addForm.deposit_to_lock ? parseFloat(String(addForm.deposit_to_lock).replace(/[^0-9.]/g, "")) : null,
        buyer_agent_commission: addForm.buyer_agent_commission || null,
        developer_approval_required: addForm.developer_approval_required,
        description: addForm.description || null,
        status: "pending_approval",
        listing_type: "assignment",
      };

      const { error } = await (supabase as any).from("listings").insert(payload);
      if (error) throw error;

      toast({ title: "Assignment submitted ✓", description: `"${title}" is pending admin approval` });
      setAddOpen(false);
      setAddForm(EMPTY_FORM);
      setProjectSearch("");
      fetchListings();
    } catch (err) {
      console.error(err);
      toast({ title: "Error creating listing", description: String(err), variant: "destructive" });
    } finally {
      setAddSaving(false);
    }
  };

  // ── Listing actions ──────────────────────────────────────────────────────
  const handleSubmitForApproval = async (listing: Listing) => {
    if (!user) return;
    setActionLoading(listing.id);
    try {
      const { error } = await (supabase as any)
        .from("listings")
        .update({ status: "pending_approval" })
        .eq("id", listing.id);
      if (error) throw error;
      toast({ title: "Submitted for Approval", description: "Your assignment is now pending admin review." });
      fetchListings();
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit listing.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseListing = async (listing: Listing) => {
    setActionLoading(listing.id);
    try {
      const { error } = await (supabase as any).from("listings").update({ status: "paused" }).eq("id", listing.id);
      if (error) throw error;
      toast({ title: "Assignment Paused" });
      fetchListings();
    } catch (error) {
      toast({ title: "Error", description: "Failed to pause assignment.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeListing = async (listing: Listing) => {
    setActionLoading(listing.id);
    try {
      const { error } = await (supabase as any).from("listings").update({ status: "published" }).eq("id", listing.id);
      if (error) throw error;
      toast({ title: "Assignment Resumed" });
      fetchListings();
    } catch (error) {
      toast({ title: "Error", description: "Failed to resume assignment.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenewListing = async (listing: Listing) => {
    setActionLoading(listing.id);
    try {
      const newExpiresAt = new Date();
      newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);
      const { error } = await (supabase as any)
        .from("listings")
        .update({ status: "published", expires_at: newExpiresAt.toISOString(), published_at: new Date().toISOString() })
        .eq("id", listing.id);
      if (error) throw error;
      toast({ title: "Assignment Renewed", description: "Renewed for another 365 days." });
      fetchListings();
    } catch (error) {
      toast({ title: "Error", description: "Failed to renew assignment.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredListings = listings.filter((listing) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return listing.status === "published";
    if (activeTab === "pending") return listing.status === "pending_approval" || listing.status === "pending_payment";
    if (activeTab === "drafts") return listing.status === "draft";
    return true;
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(price);

  const filteredProjects = projects
    .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
    .slice(0, 10);

  const renderListingActions = (listing: Listing) => {
    const isLoading = actionLoading === listing.id;
    return (
      <div className="flex gap-2">
        <Link to={`/dashboard/listings/${listing.id}/edit`}>
          <Button variant="outline" size="sm" disabled={isLoading}><Edit className="h-4 w-4" /></Button>
        </Link>
        {listing.status === "published" && (
          <Link to={`/assignments/${listing.id}`} target="_blank">
            <Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button>
          </Link>
        )}
        {listing.status === "draft" && (
          <Button size="sm" onClick={() => handleSubmitForApproval(listing)} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" />Submit</>}
          </Button>
        )}
        {(listing.status === "published" || listing.status === "paused" || listing.status === "expired") && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {listing.status === "published" && (
                <DropdownMenuItem onClick={() => handlePauseListing(listing)}><Pause className="h-4 w-4 mr-2" />Pause</DropdownMenuItem>
              )}
              {listing.status === "paused" && (
                <DropdownMenuItem onClick={() => handleResumeListing(listing)}><Play className="h-4 w-4 mr-2" />Resume</DropdownMenuItem>
              )}
              {listing.status === "expired" && (
                <DropdownMenuItem onClick={() => handleRenewListing(listing)}><RefreshCw className="h-4 w-4 mr-2" />Renew</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Assignments</h1>
            <p className="text-muted-foreground">Manage your assignment listings</p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/listings/new">
              <Button variant="outline" className="gap-2">
                <Wand2 className="h-4 w-4" />
                Import from Brochure
              </Button>
            </Link>
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Assignment
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({listings.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({listings.filter(l => l.status === "published").length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({listings.filter(l => l.status === "pending_approval" || l.status === "pending_payment").length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({listings.filter(l => l.status === "draft").length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredListings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No assignments found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === "all" ? "Create your first assignment to get started" : `No ${activeTab} assignments`}
                  </p>
                  <Button onClick={() => setAddOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Create Assignment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredListings.map((listing) => {
                  const thumbUrl = listing.featured_image || listing.floor_plan_url || null;
                  return (
                    <Card key={listing.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex gap-4">
                          {/* Thumbnail */}
                          <div className="hidden sm:block shrink-0">
                            {thumbUrl ? (
                              <img src={thumbUrl} alt={listing.title} className="h-24 w-32 rounded-lg object-cover bg-muted" />
                            ) : (
                              <div className="h-24 w-32 rounded-lg bg-muted flex items-center justify-center">
                                <Building2 className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <h3 className="font-semibold text-base truncate max-w-[300px]">{listing.title}</h3>
                                <Badge variant={statusLabels[listing.status]?.variant || "secondary"}>
                                  {statusLabels[listing.status]?.label || listing.status}
                                </Badge>
                              </div>
                              <p className="text-lg font-bold text-primary shrink-0">{formatPrice(listing.assignment_price)}</p>
                            </div>

                            <p className="text-sm text-muted-foreground">{listing.project_name}</p>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{listing.city}{listing.neighborhood ? `, ${listing.neighborhood}` : ""}</span>
                              <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{listing.beds} bed</span>
                              <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{listing.baths} bath</span>
                            </div>

                            {listing.rejection_reason && listing.status === "rejected" && (
                              <p className="text-sm text-destructive">Rejection reason: {listing.rejection_reason}</p>
                            )}
                            {listing.expires_at && (listing.status === "published" || listing.status === "expired") && (
                              <p className={`text-sm ${listing.status === "expired" ? "text-destructive" : "text-muted-foreground"}`}>
                                {listing.status === "expired" ? "Expired: " : "Expires: "}
                                {new Date(listing.expires_at).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })}
                              </p>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <Link to={`/dashboard/listings/${listing.id}/edit`}>
                                <Button variant="outline" size="sm" className="gap-1.5">
                                  <Edit className="h-3.5 w-3.5" /> Edit
                                </Button>
                              </Link>

                              {listing.status === "published" && (
                                <a href={`/assignments/${listing.id}`} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="gap-1.5">
                                    <Globe className="h-3.5 w-3.5" /> View Live
                                  </Button>
                                </a>
                              )}

                              {listing.status === "draft" && (
                                <Button size="sm" onClick={() => handleSubmitForApproval(listing)} disabled={actionLoading === listing.id} className="gap-1.5">
                                  {actionLoading === listing.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Send className="h-3.5 w-3.5" />Submit for Approval</>}
                                </Button>
                              )}

                              {(listing.status === "published" || listing.status === "paused" || listing.status === "expired") && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={actionLoading === listing.id}>
                                      {actionLoading === listing.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                                    <DropdownMenuItem onClick={() => window.open(`/assignments/${listing.id}`, '_blank')}>
                                      <Eye className="h-4 w-4 mr-2" /> Preview
                                    </DropdownMenuItem>
                                    {listing.status === "published" && (
                                      <DropdownMenuItem onClick={() => handlePauseListing(listing)}>
                                        <Pause className="h-4 w-4 mr-2" /> Pause
                                      </DropdownMenuItem>
                                    )}
                                    {listing.status === "paused" && (
                                      <DropdownMenuItem onClick={() => handleResumeListing(listing)}>
                                        <Play className="h-4 w-4 mr-2" /> Resume
                                      </DropdownMenuItem>
                                    )}
                                    {listing.status === "expired" && (
                                      <DropdownMenuItem onClick={() => handleRenewListing(listing)}>
                                        <RefreshCw className="h-4 w-4 mr-2" /> Renew
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Add Assignment Dialog (Same as Admin) ─────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={open => { setAddOpen(open); if (!open) { setAddForm(EMPTY_FORM); setProjectSearch(""); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              New Assignment Listing
            </DialogTitle>
            <DialogDescription>
              Select a presale project, upload a floor plan, and fill in unit details. Your listing will be submitted for admin approval.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-auto">
            <div className="px-6 py-5 space-y-6">

              {/* ── Project Selector ── */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Presale Project <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search project name…"
                    value={projectSearch}
                    onChange={e => { setProjectSearch(e.target.value); if (!e.target.value) setAddForm(f => ({ ...f, project_id: "" })); }}
                    onFocus={() => setProjectSearchFocused(true)}
                    onBlur={() => setTimeout(() => setProjectSearchFocused(false), 150)}
                    className="pl-9"
                  />
                  {addForm.project_id && (
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => { setAddForm(f => ({ ...f, project_id: "" })); setProjectSearch(""); }}
                    ><X className="h-4 w-4" /></button>
                  )}
                  {projectSearchFocused && projectSearch && !addForm.project_id && (
                    <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-lg shadow-xl overflow-hidden">
                      {filteredProjects.length === 0
                        ? <div className="px-3 py-3 text-sm text-muted-foreground">No projects found</div>
                        : filteredProjects.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={() => handleProjectSelect(p)}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border last:border-0 flex items-center gap-3"
                          >
                            {p.featured_image
                              ? <img src={p.featured_image} alt="" className="h-9 w-12 rounded object-cover shrink-0" />
                              : <div className="h-9 w-12 rounded bg-muted shrink-0 flex items-center justify-center"><Building2 className="h-4 w-4 text-muted-foreground" /></div>}
                            <div>
                              <div className="font-medium">{p.name}</div>
                              <div className="text-xs text-muted-foreground">{p.city}{p.neighborhood ? ` · ${p.neighborhood}` : ""}</div>
                            </div>
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
                {addForm.project_id && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                    {addForm.featured_image && <img src={addForm.featured_image} alt="" className="h-8 w-10 rounded object-cover shrink-0" />}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{addForm.project_name}</div>
                      <div className="text-xs text-muted-foreground">{addForm.city}{addForm.developer_name ? ` · ${addForm.developer_name}` : ""}</div>
                    </div>
                    <Badge className="ml-auto text-[10px] shrink-0 bg-primary text-primary-foreground">Selected</Badge>
                  </div>
                )}
              </div>

              {/* ── Floor Plan Upload ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Floor Plan</p>
                  {floorPlanExtracting && (
                    <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      AI extracting details…
                    </span>
                  )}
                </div>
                {addForm.floor_plan_url ? (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 overflow-hidden">
                    {addForm.floor_plan_url.match(/\.(jpg|jpeg|png|webp|gif)$/i)
                      ? <img src={addForm.floor_plan_url} alt="Floor plan" className="w-full max-h-48 object-contain bg-white" />
                      : <div className="flex items-center gap-3 px-4 py-3">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-sm text-primary font-medium flex-1 truncate">Floor plan uploaded</span>
                        <a href={addForm.floor_plan_url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline shrink-0">View</a>
                      </div>
                    }
                    <div className="px-3 pb-3 pt-2 flex items-center gap-2">
                      <Input
                        value={addForm.floor_plan_name}
                        onChange={e => setAddForm(f => ({ ...f, floor_plan_name: e.target.value }))}
                        placeholder="Plan name (e.g. Plan B – 2 Bed)"
                        className="h-8 text-xs"
                      />
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive" onClick={() => setAddForm(f => ({ ...f, floor_plan_url: "", floor_plan_name: "" }))}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors ${floorPlanDragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 bg-muted/20"}`}
                    onDragOver={e => { e.preventDefault(); setFloorPlanDragOver(true); }}
                    onDragLeave={() => setFloorPlanDragOver(false)}
                    onDrop={handleFloorPlanDrop}
                  >
                    <input type="file" accept=".pdf,image/*" onChange={handleFloorPlanUpload} className="hidden" />
                    {floorPlanUploading
                      ? <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      : <>
                        <div className="flex items-center gap-2">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Drop or click to upload floor plan</p>
                        <p className="text-xs text-muted-foreground/60">PDF or image • AI will auto-fill unit details below</p>
                      </>
                    }
                  </label>
                )}
              </div>

              {/* ── Unit Details ── */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">Unit Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Unit Number <span className="text-destructive">*</span></Label>
                    <Input
                      value={addForm.unit_number}
                      onChange={e => setAddForm(f => ({
                        ...f,
                        unit_number: e.target.value,
                        title: f.project_name ? `${f.project_name} – Unit ${e.target.value}` : f.title,
                      }))}
                      placeholder="e.g. 1204"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Unit Type</Label>
                    <Input value={addForm.unit_type} onChange={e => setAddForm(f => ({ ...f, unit_type: e.target.value }))} placeholder="e.g. 2 Bed + Den" className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Bedrooms</Label>
                    <Input value={addForm.beds} onChange={e => setAddForm(f => ({ ...f, beds: e.target.value }))} placeholder="2" className="h-9" type="number" min="0" step="0.5" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Bathrooms</Label>
                    <Input value={addForm.baths} onChange={e => setAddForm(f => ({ ...f, baths: e.target.value }))} placeholder="2" className="h-9" type="number" min="0" step="0.5" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Floor Level</Label>
                    <Input value={addForm.floor_level} onChange={e => setAddForm(f => ({ ...f, floor_level: e.target.value }))} placeholder="12" className="h-9" type="number" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Exposure</Label>
                    <Input value={addForm.exposure} onChange={e => setAddForm(f => ({ ...f, exposure: e.target.value }))} placeholder="e.g. South-West" className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Interior sqft</Label>
                    <Input value={addForm.interior_sqft} onChange={e => setAddForm(f => ({ ...f, interior_sqft: e.target.value }))} placeholder="850" className="h-9" type="number" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Balcony sqft</Label>
                    <Input value={addForm.exterior_sqft} onChange={e => setAddForm(f => ({ ...f, exterior_sqft: e.target.value }))} placeholder="80" className="h-9" type="number" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Parking</Label>
                    <Input value={addForm.parking} onChange={e => setAddForm(f => ({ ...f, parking: e.target.value }))} placeholder="1 Underground" className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Est. Completion</Label>
                    <Input value={addForm.estimated_completion} onChange={e => setAddForm(f => ({ ...f, estimated_completion: e.target.value }))} placeholder="Q3 2026" className="h-9" />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-4 pt-1">
                  {([
                    ["has_locker", "Locker Included"],
                    ["developer_approval_required", "Dev. Approval Required"],
                  ] as [keyof AddListingForm, string][]).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                      <button
                        type="button"
                        onClick={() => setAddForm(f => ({ ...f, [key]: !f[key] }))}
                        className={`h-5 w-9 rounded-full transition-colors relative ${addForm[key] ? "bg-primary" : "bg-muted"}`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${addForm[key] ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ── Brochure ── */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">Project Brochure</p>
                {addForm.brochure_url ? (
                  <div className="rounded-lg border border-border bg-muted/30 flex items-center gap-3 px-4 py-3">
                    <BookOpen className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Brochure attached</p>
                      <a href={addForm.brochure_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Preview</a>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive shrink-0" onClick={() => setAddForm(f => ({ ...f, brochure_url: "" }))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors ${brochureDragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 bg-muted/20"}`}
                    onDragOver={e => { e.preventDefault(); setBrochureDragOver(true); }}
                    onDragLeave={() => setBrochureDragOver(false)}
                    onDrop={handleBrochureDrop}
                  >
                    <input type="file" accept=".pdf,image/*" onChange={handleBrochureUpload} className="hidden" />
                    {brochureUploading
                      ? <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      : <>
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground font-medium">Drop or click to upload brochure</p>
                        <p className="text-xs text-muted-foreground/60">PDF or image</p>
                      </>
                    }
                  </label>
                )}
              </div>

              {/* ── Pricing ── */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">Pricing</p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["assignment_price", "Asking / Assignment Price", "$899,000"],
                    ["original_price", "Original Purchase Price", "$780,000"],
                    ["deposit_to_lock", "Deposit to Lock", "$50,000"],
                    ["buyer_agent_commission", "Buyer's Agent Commission", "3%"],
                  ] as [keyof AddListingForm, string, string][]).map(([key, label, ph]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{label}</Label>
                      <Input value={String(addForm[key] ?? "")} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} className="h-9" />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Listing Info ── */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">Listing Info</p>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Listing Title</Label>
                  <Input value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. The Smith – Unit 1204" className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Optional notes about this unit or the assignment opportunity…" className="resize-none text-sm" />
                </div>
              </div>

            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={() => { setAddOpen(false); setAddForm(EMPTY_FORM); setProjectSearch(""); }}>
              Cancel
            </Button>
            <Button onClick={handleAddListing} disabled={addSaving || !addForm.project_id || !addForm.unit_number} className="gap-2">
              {addSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {addSaving ? "Submitting…" : "Submit for Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
