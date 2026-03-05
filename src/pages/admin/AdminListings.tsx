import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AdminAssignmentCard } from "@/components/admin/AdminAssignmentCard";
import { AssignmentPreviewModal } from "@/components/admin/AssignmentPreviewModal";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Building2,
  Loader2,
  Star,
  AlertTriangle,
  Search,
  Pause,
  FileX,
  Plus,
  Upload,
  X,
  Layers,
  Sparkles,
  FileText,
  BookOpen,
  Download,
} from "lucide-react";

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
  is_featured: boolean | null;
  agent_id: string | null;
  expires_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  agent_profile?: {
    full_name: string | null;
    email: string;
    phone?: string | null;
  };
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
  starting_price: number | null;
  deposit_percent: number | null;
  deposit_structure: string | null;
  brochure_files: string[] | null;
  highlights: string[] | null;
  amenities: string[] | null;
  near_skytrain: boolean | null;
  rental_restrictions: string | null;
  strata_fees: string | null;
  slug: string;
}

interface AddListingForm {
  project_id: string;
  // Auto-filled from project
  project_name: string;
  city: string;
  neighborhood: string;
  address: string;
  developer_name: string;
  featured_image: string;
  // Unit details
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
  // Floor plan
  floor_plan_url: string;
  floor_plan_name: string;
  // Brochure
  brochure_url: string;
  // Dates / completion
  estimated_completion: string;
  // Pricing
  assignment_price: string;
  original_price: string;
  deposit_to_lock: string;
  buyer_agent_commission: string;
  // Flags
  developer_approval_required: boolean;
  // Content
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

export default function AdminListings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "pending");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [updatingFeatured, setUpdatingFeatured] = useState<string | null>(null);
  const [previewListing, setPreviewListing] = useState<Listing | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

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
    fetchListings();
    fetchProjects();
  }, []);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab]);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("presale_projects")
      .select("id, name, city, neighborhood, address, developer_name, featured_image, gallery_images, completion_year, completion_month, starting_price, deposit_percent, deposit_structure, brochure_files, highlights, amenities, near_skytrain, rental_restrictions, strata_fees, slug")
      .eq("is_published", true)
      .order("name");
    if (data) setProjects(data as PresaleProject[]);
  };

  const fetchListings = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Batch-fetch all agent profiles in one query (fixes N+1)
      const agentIds = [...new Set((data || []).map((l: any) => l.agent_id).filter(Boolean))];
      let profileMap: Record<string, any> = {};
      if (agentIds.length > 0) {
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("user_id, full_name, email, phone")
          .in("user_id", agentIds);
        profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
      }

      const listingsWithAgents = (data || []).map((listing: any) => ({
        ...listing,
        agent_profile: profileMap[listing.agent_id] || undefined,
      }));

      setListings(listingsWithAgents);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (listing: Listing, action: "approve" | "reject") => {
    setSelectedListing(listing);
    setActionType(action);
    setNotes("");
  };

  const confirmAction = async () => {
    if (!selectedListing || !actionType) return;

    setProcessing(true);
    try {
      const newStatus = actionType === "approve" ? "published" : "rejected";
      const updates: {
        status: "published" | "rejected";
        rejection_reason?: string | null;
        published_at?: string | null;
        expires_at?: string | null
      } = { status: newStatus };

      if (actionType === "approve") {
        updates.published_at = new Date().toISOString();
        if (!selectedListing.expires_at) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 365);
          updates.expires_at = expiresAt.toISOString();
        }
      } else {
        updates.rejection_reason = notes || null;
      }

      const { error } = await (supabase as any)
        .from("listings")
        .update(updates)
        .eq("id", selectedListing.id);

      if (error) throw error;

      toast({
        title: actionType === "approve" ? "Assignment Approved" : "Assignment Rejected",
        description: `"${selectedListing.title}" has been ${actionType === "approve" ? "published" : "rejected"}`,
      });

      fetchListings();
    } catch (error) {
      console.error("Error updating listing:", error);
      toast({
        title: "Error",
        description: "Failed to update assignment status",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setSelectedListing(null);
      setActionType(null);
    }
  };

  const toggleFeatured = async (listing: Listing) => {
    setUpdatingFeatured(listing.id);
    try {
      const { error } = await (supabase as any)
        .from("listings")
        .update({ is_featured: !listing.is_featured })
        .eq("id", listing.id);

      if (error) throw error;

      setListings(prev =>
        prev.map(l => l.id === listing.id ? { ...l, is_featured: !l.is_featured } : l)
      );

      toast({
        title: listing.is_featured ? "Removed from Featured" : "Added to Featured",
        description: `"${listing.title}" has been ${listing.is_featured ? "unfeatured" : "featured"}`,
      });
    } catch (error) {
      console.error("Error updating featured status:", error);
      toast({ title: "Error", description: "Failed to update featured status", variant: "destructive" });
    } finally {
      setUpdatingFeatured(null);
    }
  };

  // ── Project picker for add dialog ────────────────────────────────────────
  const handleProjectSelect = (project: PresaleProject) => {
    const completion = project.completion_month && project.completion_year
      ? `${MONTHS[project.completion_month]} ${project.completion_year}`
      : project.completion_year ? `${project.completion_year}` : "";

    // Pull first brochure from project if available
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
      };

      const { error } = await (supabase as any).from("listings").insert(payload);
      if (error) throw error;

      toast({ title: "Assignment listing created", description: `"${title}" is pending approval` });
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

  // ── Filter helpers ───────────────────────────────────────────────────────
  const filterBySearch = (list: Listing[]) => {
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(l =>
      l.title?.toLowerCase().includes(query) ||
      l.project_name?.toLowerCase().includes(query) ||
      l.city?.toLowerCase().includes(query) ||
      l.unit_number?.toLowerCase().includes(query) ||
      l.agent_profile?.full_name?.toLowerCase().includes(query) ||
      l.agent_profile?.email?.toLowerCase().includes(query)
    );
  };

  const pendingListings = listings.filter(l => l.status === "pending_approval");
  const publishedListings = listings.filter(l => l.status === "published");
  const featuredListings = listings.filter(l => l.is_featured);
  const pausedListings = listings.filter(l => l.status === "paused");
  const expiredListings = listings.filter(l => l.status === "expired");

  const getFilteredListings = () => {
    switch (activeTab) {
      case "pending": return filterBySearch(pendingListings);
      case "published": return filterBySearch(publishedListings);
      case "featured": return filterBySearch(featuredListings);
      case "paused": return filterBySearch(pausedListings);
      case "expired": return filterBySearch(expiredListings);
      default: return filterBySearch(listings);
    }
  };

  const filteredListings = getFilteredListings();

  const renderEmptyState = (icon: React.ReactNode, title: string, description?: string) => (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="mx-auto mb-4 text-muted-foreground">{icon}</div>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        {description && <p className="text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );

  // ── Filtered project list for dropdown ──────────────────────────────────
  const filteredProjects = projects
    .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
    .slice(0, 10);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Assignment Management</h1>
            <p className="text-muted-foreground">Manage, approve, and monitor all assignments</p>
          </div>

          <div className="flex items-center gap-3">
            {pendingListings.length > 0 && (
              <Badge variant="destructive" className="px-3 py-1">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                {pendingListings.length} Pending Review
              </Badge>
            )}
            {expiredListings.length > 0 && (
              <Badge variant="secondary" className="px-3 py-1">
                <FileX className="h-3.5 w-3.5 mr-1" />
                {expiredListings.length} Expired
              </Badge>
            )}
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Listing
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, project, city, unit, or agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto lg:inline-flex">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingListings.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5">{pendingListings.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="published">Published ({publishedListings.length})</TabsTrigger>
            <TabsTrigger value="featured">
              <Star className="h-4 w-4 mr-1" />Featured ({featuredListings.length})
            </TabsTrigger>
            <TabsTrigger value="paused">
              <Pause className="h-4 w-4 mr-1" />Paused ({pausedListings.length})
            </TabsTrigger>
            <TabsTrigger value="expired">
              <FileX className="h-4 w-4 mr-1" />Expired ({expiredListings.length})
            </TabsTrigger>
            <TabsTrigger value="all">All ({listings.length})</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="pending" className="mt-6">
                {filteredListings.length === 0
                  ? renderEmptyState(<CheckCircle className="h-12 w-12 text-green-500" />, "All caught up!", "No assignments pending approval")
                  : <div className="space-y-4">{filteredListings.map(l => (
                    <AdminAssignmentCard key={l.id} listing={l} showApprovalActions onRefresh={fetchListings}
                      onPreview={() => setPreviewListing(l)}
                      onApprove={() => handleAction(l, "approve")}
                      onReject={() => handleAction(l, "reject")} />
                  ))}</div>}
              </TabsContent>

              <TabsContent value="published" className="mt-6">
                {filteredListings.length === 0
                  ? renderEmptyState(<Building2 className="h-12 w-12 text-muted-foreground" />, "No published assignments")
                  : <div className="space-y-4">{filteredListings.map(l => (
                    <AdminAssignmentCard key={l.id} listing={l} onRefresh={fetchListings}
                      onPreview={() => setPreviewListing(l)}
                      onToggleFeatured={() => toggleFeatured(l)}
                      isUpdatingFeatured={updatingFeatured === l.id} />
                  ))}</div>}
              </TabsContent>

              <TabsContent value="featured" className="mt-6">
                {filteredListings.length === 0
                  ? renderEmptyState(<Star className="h-12 w-12 text-muted-foreground" />, "No featured assignments", "Feature assignments from the Published tab")
                  : <div className="space-y-4">{filteredListings.map(l => (
                    <AdminAssignmentCard key={l.id} listing={l} onRefresh={fetchListings}
                      onPreview={() => setPreviewListing(l)}
                      onToggleFeatured={() => toggleFeatured(l)}
                      isUpdatingFeatured={updatingFeatured === l.id} />
                  ))}</div>}
              </TabsContent>

              <TabsContent value="paused" className="mt-6">
                {filteredListings.length === 0
                  ? renderEmptyState(<Pause className="h-12 w-12 text-muted-foreground" />, "No paused assignments")
                  : <div className="space-y-4">{filteredListings.map(l => (
                    <AdminAssignmentCard key={l.id} listing={l} onRefresh={fetchListings} onPreview={() => setPreviewListing(l)} />
                  ))}</div>}
              </TabsContent>

              <TabsContent value="expired" className="mt-6">
                {filteredListings.length === 0
                  ? renderEmptyState(<FileX className="h-12 w-12 text-muted-foreground" />, "No expired assignments")
                  : <div className="space-y-4">{filteredListings.map(l => (
                    <AdminAssignmentCard key={l.id} listing={l} onRefresh={fetchListings} onPreview={() => setPreviewListing(l)} />
                  ))}</div>}
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                {filteredListings.length === 0
                  ? renderEmptyState(<Building2 className="h-12 w-12 text-muted-foreground" />, searchQuery ? "No matching assignments" : "No assignments yet")
                  : <div className="space-y-4">{filteredListings.map(l => (
                    <AdminAssignmentCard key={l.id} listing={l}
                      showApprovalActions={l.status === "pending_approval"}
                      onRefresh={fetchListings}
                      onPreview={() => setPreviewListing(l)}
                      onApprove={() => handleAction(l, "approve")}
                      onReject={() => handleAction(l, "reject")}
                      onToggleFeatured={l.status === "published" ? () => toggleFeatured(l) : undefined}
                      isUpdatingFeatured={updatingFeatured === l.id} />
                  ))}</div>}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* ── Approve / Reject Dialog ─────────────────────────────────────────── */}
      <Dialog open={!!selectedListing && !!actionType} onOpenChange={() => { setSelectedListing(null); setActionType(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "approve" ? "Approve Assignment" : "Reject Assignment"}</DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? `Approve "${selectedListing?.title}"? It will be published immediately.`
                : `Reject "${selectedListing?.title}"? Please provide a reason.`}
            </DialogDescription>
          </DialogHeader>
          {actionType === "reject" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rejection Reason</label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Explain why the assignment was rejected..." className="mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedListing(null); setActionType(null); }}>Cancel</Button>
            <Button
              onClick={confirmAction}
              disabled={processing || (actionType === "reject" && !notes.trim())}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Assignment Listing Dialog ───────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={open => { setAddOpen(open); if (!open) { setAddForm(EMPTY_FORM); setProjectSearch(""); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Add Assignment Listing
            </DialogTitle>
            <DialogDescription>
              Select a presale project and fill in unit-specific details. The listing will be created as "Pending Approval".
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

              {/* ── Floor Plan Upload (FIRST STEP after project) ── */}
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
                        <p className="text-xs text-muted-foreground/60">
                          {addForm.project_id ? "Project brochure will auto-load when you select a project" : "Select a project above to auto-load its brochure"} • PDF or image
                        </p>
                      </>
                    }
                  </label>
                )}
              </div>


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
              {addSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {addSaving ? "Creating…" : "Create Listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assignment Preview Modal ─────────────────────────────────────────── */}
      <AssignmentPreviewModal
        listing={previewListing}
        open={!!previewListing}
        onOpenChange={open => !open && setPreviewListing(null)}
        onApprove={() => {
          if (previewListing) {
            setSelectedListing(previewListing);
            setActionType("approve");
            setPreviewListing(null);
          }
        }}
        onReject={() => {
          if (previewListing) {
            setSelectedListing(previewListing);
            setActionType("reject");
            setPreviewListing(null);
          }
        }}
        processing={processing}
      />
    </AdminLayout>
  );
}
