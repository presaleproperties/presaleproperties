import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AIProjectUploadWizard } from "@/components/admin/AIProjectUploadWizard";
import { 
  ArrowLeft,
  Loader2,
  Save,
  Eye,
  Plus,
  X,
  Upload,
  Sparkles,
  FolderOpen,
  Image
} from "lucide-react";

type ProjectFormData = {
  name: string;
  slug: string;
  status: "coming_soon" | "active" | "sold_out";
  city: string;
  neighborhood: string;
  address: string;
  developer_name: string;
  project_type: "condo" | "townhome" | "mixed";
  unit_mix: string;
  starting_price: string;
  deposit_structure: string;
  incentives: string;
  completion_month: string;
  completion_year: string;
  occupancy_estimate: string;
  short_description: string;
  full_description: string;
  highlights: string[];
  amenities: string[];
  faq: { question: string; answer: string }[];
  featured_image: string;
  gallery_images: string[];
  seo_title: string;
  seo_description: string;
  is_indexed: boolean;
  is_published: boolean;
  is_featured: boolean;
};

const defaultFormData: ProjectFormData = {
  name: "",
  slug: "",
  status: "coming_soon",
  city: "",
  neighborhood: "",
  address: "",
  developer_name: "",
  project_type: "condo",
  unit_mix: "",
  starting_price: "",
  deposit_structure: "",
  incentives: "",
  completion_month: "",
  completion_year: "",
  occupancy_estimate: "",
  short_description: "",
  full_description: "",
  highlights: [],
  amenities: [],
  faq: [],
  featured_image: "",
  gallery_images: [],
  seo_title: "",
  seo_description: "",
  is_indexed: true,
  is_published: false,
  is_featured: false,
};

export default function AdminProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProjectFormData>(defaultFormData);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [newHighlight, setNewHighlight] = useState("");
  const [newAmenity, setNewAmenity] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUploadAssistant, setShowUploadAssistant] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [isImportingDrive, setIsImportingDrive] = useState(false);
  const { toast } = useToast();

  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || "",
        slug: data.slug || "",
        status: data.status || "coming_soon",
        city: data.city || "",
        neighborhood: data.neighborhood || "",
        address: data.address || "",
        developer_name: data.developer_name || "",
        project_type: data.project_type || "condo",
        unit_mix: data.unit_mix || "",
        starting_price: data.starting_price?.toString() || "",
        
        deposit_structure: data.deposit_structure || "",
        incentives: data.incentives || "",
        completion_month: data.completion_month?.toString() || "",
        completion_year: data.completion_year?.toString() || "",
        occupancy_estimate: data.occupancy_estimate || "",
        short_description: data.short_description || "",
        full_description: data.full_description || "",
        highlights: data.highlights || [],
        amenities: data.amenities || [],
        faq: (Array.isArray(data.faq) ? data.faq : []) as { question: string; answer: string }[],
        featured_image: data.featured_image || "",
        gallery_images: data.gallery_images || [],
        seo_title: data.seo_title || "",
        seo_description: data.seo_description || "",
        is_indexed: data.is_indexed ?? true,
        is_published: data.is_published || false,
        is_featured: data.is_featured || false,
      });
    } catch (error) {
      console.error("Error fetching project:", error);
      toast({
        title: "Error",
        description: "Failed to load project",
        variant: "destructive",
      });
      navigate("/admin/projects");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const getProjectTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      condo: "Condos",
      townhome: "Townhomes",
      mixed: "Homes",
    };
    return labels[type] || "Homes";
  };

  const generateSeoTitle = (data: Partial<ProjectFormData>) => {
    const name = data.name || "";
    const typeLabel = getProjectTypeLabel(data.project_type || "condo");
    const price = data.starting_price ? `Starting from $${parseInt(data.starting_price).toLocaleString()}` : "";
    
    if (name && price) {
      return `${name} - ${typeLabel} ${price}`;
    } else if (name) {
      return `${name} - ${typeLabel}`;
    }
    return "";
  };

  const generateSeoDescription = (data: Partial<ProjectFormData>) => {
    const typeLabel = getProjectTypeLabel(data.project_type || "condo");
    const city = data.city || "";
    const neighborhood = data.neighborhood || "";
    const unitMix = data.unit_mix || "";
    
    if (city && neighborhood && unitMix) {
      return `Discover new ${typeLabel.toLowerCase()} in ${neighborhood}, ${city}. ${unitMix} available.`;
    } else if (city && neighborhood) {
      return `Discover new ${typeLabel.toLowerCase()} in ${neighborhood}, ${city}.`;
    } else if (city) {
      return `New ${typeLabel.toLowerCase()} development in ${city}.`;
    }
    return "";
  };

  const updateSeoFields = (updates: Partial<ProjectFormData>) => {
    const mergedData = { ...formData, ...updates };
    return {
      seo_title: generateSeoTitle(mergedData),
      seo_description: generateSeoDescription(mergedData),
    };
  };

  const getSeasonFromMonth = (month: number) => {
    if (month >= 3 && month <= 5) return "Spring";
    if (month >= 6 && month <= 8) return "Summer";
    if (month >= 9 && month <= 11) return "Fall";
    return "Winter";
  };

  const generateOccupancyEstimate = (month: string | number | undefined, year: string | number | undefined) => {
    const monthNum = typeof month === 'string' ? parseInt(month) : month;
    const yearNum = typeof year === 'string' ? parseInt(year) : year;
    
    if (monthNum && yearNum) {
      return `${getSeasonFromMonth(monthNum)} ${yearNum}`;
    } else if (yearNum) {
      return `${yearNum}`;
    }
    return "";
  };

  const handleBrochureDataExtracted = (data: any) => {
    const mergedData = {
      name: data.name || formData.name,
      project_type: data.project_type || formData.project_type,
      starting_price: data.starting_price?.toString() || formData.starting_price,
      short_description: data.short_description || formData.short_description,
      city: data.city || formData.city,
      neighborhood: data.neighborhood || formData.neighborhood,
    };

    const completionMonth = data.completion_month?.toString() || formData.completion_month;
    const completionYear = data.completion_year?.toString() || formData.completion_year;

    setFormData(prev => ({
      ...prev,
      name: data.name || prev.name,
      slug: data.name ? generateSlug(data.name) : prev.slug,
      developer_name: data.developer_name || prev.developer_name,
      city: data.city || prev.city,
      neighborhood: data.neighborhood || prev.neighborhood,
      address: data.address || prev.address,
      project_type: data.project_type || prev.project_type,
      unit_mix: data.unit_mix || prev.unit_mix,
      starting_price: data.starting_price?.toString() || prev.starting_price,
      
      deposit_structure: data.deposit_structure || prev.deposit_structure,
      incentives: data.incentives || prev.incentives,
      completion_month: completionMonth,
      completion_year: completionYear,
      occupancy_estimate: generateOccupancyEstimate(completionMonth, completionYear),
      short_description: data.short_description || prev.short_description,
      full_description: data.full_description || prev.full_description,
      highlights: data.highlights?.length > 0 ? data.highlights : prev.highlights,
      amenities: data.amenities?.length > 0 ? data.amenities : prev.amenities,
      faq: data.faq?.length > 0 ? data.faq : prev.faq,
      seo_title: generateSeoTitle(mergedData),
      seo_description: generateSeoDescription(mergedData),
    }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const updates = { name };
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
      ...updateSeoFields(updates),
    }));
  };

  const handleSeoRelevantFieldChange = (field: keyof ProjectFormData, value: string) => {
    const updates = { [field]: value } as Partial<ProjectFormData>;
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...updateSeoFields(updates),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.city || !formData.neighborhood) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const projectData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        status: formData.status,
        city: formData.city,
        neighborhood: formData.neighborhood,
        address: formData.address || null,
        developer_name: formData.developer_name || null,
        project_type: formData.project_type,
        unit_mix: formData.unit_mix || null,
        starting_price: formData.starting_price ? parseFloat(formData.starting_price) : null,
        
        deposit_structure: formData.deposit_structure || null,
        incentives: formData.incentives || null,
        completion_month: formData.completion_month ? parseInt(formData.completion_month) : null,
        completion_year: formData.completion_year ? parseInt(formData.completion_year) : null,
        occupancy_estimate: formData.occupancy_estimate || null,
        short_description: formData.short_description || null,
        full_description: formData.full_description || null,
        highlights: formData.highlights.length > 0 ? formData.highlights : null,
        amenities: formData.amenities.length > 0 ? formData.amenities : null,
        faq: formData.faq.length > 0 ? formData.faq : [],
        featured_image: formData.featured_image || null,
        gallery_images: formData.gallery_images.length > 0 ? formData.gallery_images : null,
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
        is_indexed: formData.is_indexed,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        published_at: formData.is_published && !isEdit ? new Date().toISOString() : undefined,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("presale_projects")
          .update(projectData)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("presale_projects")
          .insert(projectData);
        if (error) throw error;
      }

      toast({
        title: isEdit ? "Project Updated" : "Project Created",
        description: `"${formData.name}" has been ${isEdit ? "updated" : "created"}`,
      });
      navigate("/admin/projects");
    } catch (error: any) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save project",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "featured" | "gallery") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `projects/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-photos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("listing-photos")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      if (type === "featured") {
        setFormData(prev => ({ ...prev, featured_image: uploadedUrls[0] }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          gallery_images: [...prev.gallery_images, ...uploadedUrls] 
        }));
      }

      toast({
        title: "Upload Complete",
        description: `${uploadedUrls.length} image(s) uploaded`,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const addHighlight = () => {
    if (newHighlight.trim()) {
      setFormData(prev => ({
        ...prev,
        highlights: [...prev.highlights, newHighlight.trim()],
      }));
      setNewHighlight("");
    }
  };

  const removeHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  };

  const addAmenity = () => {
    if (newAmenity.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()],
      }));
      setNewAmenity("");
    }
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
  };

  const addFaq = () => {
    setFormData(prev => ({
      ...prev,
      faq: [...prev.faq, { question: "", answer: "" }],
    }));
  };

  const updateFaq = (index: number, field: "question" | "answer", value: string) => {
    setFormData(prev => ({
      ...prev,
      faq: prev.faq.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeFaq = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index),
    }));
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index),
    }));
  };

  const handleImportFromDrive = async () => {
    if (!driveUrl.trim()) return;

    if (!driveUrl.includes('/folders/')) {
      toast({
        title: "Not a Folder URL",
        description: "Please enter a Google Drive folder share link",
        variant: "destructive",
      });
      return;
    }

    setIsImportingDrive(true);

    try {
      // Fetch folder contents
      const { data, error: fnError } = await supabase.functions.invoke('fetch-drive-folder', {
        body: { folderUrl: driveUrl }
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch folder');

      const imageUrls = (data.images as string[]) || [];

      if (imageUrls.length === 0) {
        throw new Error('No images found in the folder');
      }

      // Upload images to storage
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < imageUrls.length; i++) {
        try {
          // Fetch the image
          const imgResponse = await fetch(imageUrls[i]);
          if (!imgResponse.ok) continue;
          
          const blob = await imgResponse.blob();
          const fileName = `projects/${Date.now()}-${i}.jpg`;
          
          const { error: uploadError } = await supabase.storage
            .from("listing-photos")
            .upload(fileName, blob, { contentType: blob.type || "image/jpeg" });
          
          if (uploadError) {
            console.warn("Upload error:", uploadError);
            continue;
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from("listing-photos")
            .getPublicUrl(fileName);
          
          uploadedUrls.push(publicUrl);
        } catch (imgErr) {
          console.warn("Could not process image:", imgErr);
        }
      }

      if (uploadedUrls.length === 0) {
        throw new Error('Could not import any images. Make sure the folder is publicly shared.');
      }

      // Add to gallery (set first as featured if none exists)
      setFormData(prev => ({
        ...prev,
        featured_image: prev.featured_image || uploadedUrls[0],
        gallery_images: [...prev.gallery_images, ...(prev.featured_image ? uploadedUrls : uploadedUrls.slice(1))],
      }));

      setDriveUrl("");

      toast({
        title: "Images Imported",
        description: `Added ${uploadedUrls.length} images from Google Drive`,
      });

    } catch (err: any) {
      console.error('Drive import error:', err);
      toast({
        title: "Import Failed",
        description: err.message || "Could not import images. Make sure the folder is publicly shared.",
        variant: "destructive",
      });
    } finally {
      setIsImportingDrive(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // For new projects, show the AI Upload Wizard
  if (!isEdit) {
    return (
      <AdminLayout>
        <AIProjectUploadWizard />
      </AdminLayout>
    );
  }

  // For editing existing projects, show the full form
  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/projects")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isEdit ? "Edit Project" : "Create Project"}
              </h1>
              <p className="text-muted-foreground">
                {isEdit ? "Update project details" : "Add a new presale project"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploadAssistant(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Import
              </Button>
            )}
            {formData.slug && (
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(`/presale-projects/${formData.slug}?preview=true`, "_blank")}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? "Save Changes" : "Create Project"}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Core Info */}
            <Card>
              <CardHeader>
                <CardTitle>Core Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleNameChange}
                      placeholder="e.g., The Park Residences"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="auto-generated-from-name"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleSeoRelevantFieldChange("city", e.target.value)}
                      placeholder="e.g., Vancouver"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Neighborhood *</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => handleSeoRelevantFieldChange("neighborhood", e.target.value)}
                      placeholder="e.g., Downtown"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address (optional)</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g., 123 Main Street"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coming_soon">Coming Soon</SelectItem>
                        <SelectItem value="active">Selling Now</SelectItem>
                        <SelectItem value="sold_out">Sold Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project_type">Project Type</Label>
                    <Select
                      value={formData.project_type}
                      onValueChange={(v) => handleSeoRelevantFieldChange("project_type", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="townhome">Townhome</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Developer & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Developer & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="developer_name">Developer Name</Label>
                    <Input
                      id="developer_name"
                      value={formData.developer_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, developer_name: e.target.value }))}
                      placeholder="e.g., Concord Pacific"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_mix">Unit Mix</Label>
                    <Input
                      id="unit_mix"
                      value={formData.unit_mix}
                      onChange={(e) => handleSeoRelevantFieldChange("unit_mix", e.target.value)}
                      placeholder="e.g., 1-3 bedrooms"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="starting_price">Starting Price</Label>
                  <Input
                    id="starting_price"
                    type="number"
                    value={formData.starting_price}
                    onChange={(e) => handleSeoRelevantFieldChange("starting_price", e.target.value)}
                    placeholder="e.g., 599000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit_structure">Deposit Structure</Label>
                  <Textarea
                    id="deposit_structure"
                    value={formData.deposit_structure}
                    onChange={(e) => setFormData(prev => ({ ...prev, deposit_structure: e.target.value }))}
                    placeholder="e.g., 5% on signing, 5% in 90 days, 5% in 180 days..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incentives">Incentives</Label>
                  <Textarea
                    id="incentives"
                    value={formData.incentives}
                    onChange={(e) => setFormData(prev => ({ ...prev, incentives: e.target.value }))}
                    placeholder="Current promotions or incentives..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Occupancy Estimate */}
            <Card>
              <CardHeader>
                <CardTitle>Occupancy Estimate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="occupancy_season">Season</Label>
                    <Select
                      value={formData.occupancy_estimate.split(" ")[0] || ""}
                      onValueChange={(season) => {
                        const year = formData.occupancy_estimate.split(" ")[1] || "";
                        setFormData(prev => ({ 
                          ...prev, 
                          occupancy_estimate: year ? `${season} ${year}` : season 
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select season" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Spring">Spring</SelectItem>
                        <SelectItem value="Summer">Summer</SelectItem>
                        <SelectItem value="Fall">Fall</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupancy_year">Year</Label>
                    <Select
                      value={formData.occupancy_estimate.split(" ")[1] || ""}
                      onValueChange={(year) => {
                        const season = formData.occupancy_estimate.split(" ")[0] || "";
                        setFormData(prev => ({ 
                          ...prev, 
                          occupancy_estimate: season ? `${season} ${year}` : year 
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="short_description">Short Description (for cards)</Label>
                  <Textarea
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                    placeholder="Brief description for listing cards..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_description">Full Description</Label>
                  <Textarea
                    id="full_description"
                    value={formData.full_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_description: e.target.value }))}
                    placeholder="Detailed project description..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Highlights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Highlights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    placeholder="Add a highlight..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHighlight())}
                  />
                  <Button type="button" onClick={addHighlight} variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-1 bg-secondary px-3 py-1.5 rounded-full text-sm">
                      {h}
                      <button type="button" onClick={() => removeHighlight(i)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    placeholder="Add an amenity..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())}
                  />
                  <Button type="button" onClick={addAmenity} variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((a, i) => (
                    <div key={i} className="flex items-center gap-1 bg-secondary px-3 py-1.5 rounded-full text-sm">
                      {a}
                      <button type="button" onClick={() => removeAmenity(i)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>FAQ</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addFaq}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add FAQ
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.faq.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No FAQ items yet. Click "Add FAQ" to get started.
                  </p>
                ) : (
                  formData.faq.map((item, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={item.question}
                            onChange={(e) => updateFaq(i, "question", e.target.value)}
                            placeholder="Question"
                          />
                          <Textarea
                            value={item.answer}
                            onChange={(e) => updateFaq(i, "answer", e.target.value)}
                            placeholder="Answer"
                            rows={2}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFaq(i)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* SEO */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>SEO Settings</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const seoFields = updateSeoFields({});
                    setFormData(prev => ({ ...prev, ...seoFields }));
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={formData.seo_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                    placeholder="Leave blank to use project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    value={formData.seo_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                    placeholder="Meta description for search engines..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Index in Search Engines</Label>
                    <p className="text-sm text-muted-foreground">Allow search engines to index this page</p>
                  </div>
                  <Switch
                    checked={formData.is_indexed}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_indexed: v }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing */}
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Published</Label>
                    <p className="text-sm text-muted-foreground">Make visible to public</p>
                  </div>
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_published: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Featured</Label>
                    <p className="text-sm text-muted-foreground">Show in featured section</p>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_featured: v }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.featured_image ? (
                  <div className="relative">
                    <img
                      src={formData.featured_image}
                      alt="Featured"
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData(prev => ({ ...prev, featured_image: "" }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, "featured")}
                      disabled={uploading}
                    />
                  </label>
                )}
              </CardContent>
            </Card>

            {/* Gallery */}
            <Card>
              <CardHeader>
                <CardTitle>Gallery Images</CardTitle>
                <CardDescription>
                  {formData.gallery_images.length} images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Google Drive Import */}
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <FolderOpen className="h-4 w-4" />
                    Import from Google Drive
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                      placeholder="Paste folder link..."
                      disabled={isImportingDrive}
                      className="text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleImportFromDrive}
                      disabled={isImportingDrive || !driveUrl.includes('/folders/')}
                    >
                      {isImportingDrive ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Image className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Existing Images */}
                {formData.gallery_images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {formData.gallery_images.map((img, i) => (
                      <div key={i} className="relative aspect-square">
                        <img
                          src={img}
                          alt={`Gallery ${i + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removeGalleryImage(i)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Manual Upload */}
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? "Uploading..." : "Drop or click to upload"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "gallery")}
                    disabled={uploading}
                  />
                </label>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

    </AdminLayout>
  );
}