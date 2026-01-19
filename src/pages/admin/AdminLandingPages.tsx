import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Plus, 
  Copy, 
  ExternalLink, 
  Pencil, 
  Trash2, 
  Eye, 
  Megaphone,
  Link2,
  Loader2
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  slug: string;
  project_id: string | null;
  headline: string | null;
  subheadline: string | null;
  selling_points: string[] | null;
  urgency_badge: string | null;
  urgency_text: string | null;
  cta_text: string | null;
  location_teaser: string | null;
  video_url: string | null;
  incentive_savings: string | null;
  incentive_deposit: string | null;
  incentive_bonus: string | null;
  monthly_1br: string | null;
  monthly_2br: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  city: string;
}

const defaultCampaign: Partial<Campaign> = {
  urgency_badge: "Limited Time Offer",
  urgency_text: "Pre-construction pricing available for a limited time",
  cta_text: "Get Floor Plans & Pricing",
  incentive_savings: "$50K",
  incentive_deposit: "5%",
  incentive_bonus: "Free A/C",
  monthly_1br: "~$1,950",
  monthly_2br: "~$2,600",
  is_active: true,
};

export default function AdminLandingPages() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<Partial<Campaign>>(defaultCampaign);

  // Fetch campaigns
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["landing-page-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_page_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
  });

  // Fetch projects for dropdown
  const { data: projects } = useQuery({
    queryKey: ["projects-for-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city")
        .eq("is_published", true)
        .order("name");
      if (error) throw error;
      return data as Project[];
    },
  });

  // Save campaign mutation
  const saveCampaign = useMutation({
    mutationFn: async (data: Partial<Campaign>) => {
      if (editingCampaign) {
        const { error } = await supabase
          .from("landing_page_campaigns")
          .update(data as any)
          .eq("id", editingCampaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("landing_page_campaigns")
          .insert(data as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-page-campaigns"] });
      toast.success(editingCampaign ? "Campaign updated" : "Campaign created");
      closeDialog();
    },
    onError: (error) => {
      toast.error("Error saving campaign: " + error.message);
    },
  });

  // Delete campaign mutation
  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("landing_page_campaigns")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-page-campaigns"] });
      toast.success("Campaign deleted");
    },
    onError: (error) => {
      toast.error("Error deleting campaign: " + error.message);
    },
  });

  // Duplicate campaign
  const duplicateCampaign = useMutation({
    mutationFn: async (campaign: Campaign) => {
      const newSlug = `${campaign.slug}-copy-${Date.now()}`;
      const { id, created_at, updated_at, ...rest } = campaign;
      const { error } = await supabase
        .from("landing_page_campaigns")
        .insert({ ...rest, name: `${campaign.name} (Copy)`, slug: newSlug });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-page-campaigns"] });
      toast.success("Campaign duplicated");
    },
    onError: (error) => {
      toast.error("Error duplicating campaign: " + error.message);
    },
  });

  const openCreateDialog = () => {
    setEditingCampaign(null);
    setFormData(defaultCampaign);
    setIsDialogOpen(true);
  };

  const openEditDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData(campaign);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCampaign(null);
    setFormData(defaultCampaign);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.slug) {
      toast.error("Name and slug are required");
      return;
    }
    saveCampaign.mutate(formData);
  };

  const getPreviewUrl = (campaign: Campaign) => {
    const project = projects?.find(p => p.id === campaign.project_id);
    const projectSlug = project?.slug || "jericho-park";
    return `/exclusive-offer?p=${projectSlug}&c=${campaign.slug}`;
  };

  const copyUrl = (campaign: Campaign) => {
    const url = `${window.location.origin}${getPreviewUrl(campaign)}`;
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-primary" />
              Landing Page Campaigns
            </h1>
            <p className="text-muted-foreground">
              Create and manage ad landing pages for paid campaigns
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
              <p className="text-muted-foreground text-sm">Total Campaigns</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {campaigns?.filter(c => c.is_active).length || 0}
              </div>
              <p className="text-muted-foreground text-sm">Active Campaigns</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-muted-foreground">
                {campaigns?.filter(c => !c.is_active).length || 0}
              </div>
              <p className="text-muted-foreground text-sm">Inactive Campaigns</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : campaigns?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first landing page campaign to get started
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {campaigns?.map((campaign) => {
              const project = projects?.find(p => p.id === campaign.project_id);
              return (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{campaign.name}</h3>
                          <Badge variant={campaign.is_active ? "default" : "secondary"}>
                            {campaign.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Link2 className="h-3 w-3" />
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            /exclusive-offer?p={project?.slug || "..."}&c={campaign.slug}
                          </code>
                        </div>
                        {project && (
                          <p className="text-sm text-muted-foreground">
                            Project: <span className="font-medium text-foreground">{project.name}</span>
                            <span className="text-muted-foreground"> • {project.city}</span>
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => window.open(getPreviewUrl(campaign), "_blank")}
                          className="gap-1.5"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyUrl(campaign)}
                          title="Copy URL"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => duplicateCampaign.mutate(campaign)}
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(campaign)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this campaign?")) {
                              deleteCampaign.mutate(campaign.id);
                            }
                          }}
                          title="Delete"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign ? "Edit Campaign" : "Create New Campaign"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Campaign Name *</Label>
                  <Input
                    placeholder="e.g., Jericho Park - January 2026"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug *</Label>
                  <Input
                    placeholder="e.g., jericho-jan-2026"
                    value={formData.slug || ""}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  />
                </div>
              </div>

              {/* Project Selection */}
              <div className="space-y-2">
                <Label>Linked Project</Label>
                <Select
                  value={formData.project_id || ""}
                  onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} - {project.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Messaging */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Messaging</h4>
                
                <div className="space-y-2">
                  <Label>Headline Override</Label>
                  <Input
                    placeholder="Leave empty to use project data"
                    value={formData.headline || ""}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location Teaser</Label>
                  <Input
                    placeholder="e.g., Prime Langley Location"
                    value={formData.location_teaser || ""}
                    onChange={(e) => setFormData({ ...formData, location_teaser: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Urgency Badge</Label>
                    <Input
                      value={formData.urgency_badge || ""}
                      onChange={(e) => setFormData({ ...formData, urgency_badge: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Button Text</Label>
                    <Input
                      value={formData.cta_text || ""}
                      onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Incentives */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Incentives Display</h4>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Savings Amount</Label>
                    <Input
                      placeholder="$50K"
                      value={formData.incentive_savings || ""}
                      onChange={(e) => setFormData({ ...formData, incentive_savings: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Deposit %</Label>
                    <Input
                      placeholder="5%"
                      value={formData.incentive_deposit || ""}
                      onChange={(e) => setFormData({ ...formData, incentive_deposit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bonus Item</Label>
                    <Input
                      placeholder="Free A/C"
                      value={formData.incentive_bonus || ""}
                      onChange={(e) => setFormData({ ...formData, incentive_bonus: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Monthly Costs */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Monthly Cost Display</h4>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>1 Bed + Den Monthly</Label>
                    <Input
                      placeholder="~$1,950"
                      value={formData.monthly_1br || ""}
                      onChange={(e) => setFormData({ ...formData, monthly_1br: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>2 Bed 2 Bath Monthly</Label>
                    <Input
                      placeholder="~$2,600"
                      value={formData.monthly_2br || ""}
                      onChange={(e) => setFormData({ ...formData, monthly_2br: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Video */}
              <div className="space-y-2">
                <Label>Video URL (Optional)</Label>
                <Input
                  placeholder="YouTube or MP4 URL"
                  value={formData.video_url || ""}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Campaign is active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saveCampaign.isPending}>
                {saveCampaign.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCampaign ? "Save Changes" : "Create Campaign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
