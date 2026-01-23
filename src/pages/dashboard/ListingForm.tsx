import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Upload, 
  X, 
  Image as ImageIcon,
  FileText,
  Save,
  ArrowLeft,
  Wand2
} from "lucide-react";
import { Link } from "react-router-dom";
import { AssignmentBrochureUploader, ExtractedAssignmentData } from "@/components/listings/AssignmentBrochureUploader";

const CITIES = [
  "Vancouver",
  "Burnaby",
  "Richmond",
  "Surrey",
  "Coquitlam",
  "North Vancouver",
  "West Vancouver",
  "New Westminster",
  "Port Coquitlam",
  "Port Moody",
  "Langley",
  "Delta",
  "White Rock",
];

const PROPERTY_TYPES = [
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "other", label: "Other" },
];

const UNIT_TYPES = [
  { value: "studio", label: "Studio" },
  { value: "1bed", label: "1 Bedroom" },
  { value: "1bed_den", label: "1 Bedroom + Den" },
  { value: "2bed", label: "2 Bedroom" },
  { value: "2bed_den", label: "2 Bedroom + Den" },
  { value: "3bed", label: "3 Bedroom" },
  { value: "penthouse", label: "Penthouse" },
];

const CONSTRUCTION_STATUS = [
  { value: "pre_construction", label: "Pre-Construction" },
  { value: "under_construction", label: "Under Construction" },
  { value: "completed", label: "Completed" },
];

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const VISIBILITY_MODES = [
  { value: "public", label: "Public Assignment", description: "All details visible to everyone" },
  { value: "restricted", label: "Restricted Assignment", description: "Developer-compliant mode - project/developer details hidden" },
];

const listingSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(100),
  project_name: z.string().trim().min(2, "Project name is required").max(100),
  developer_name: z.string().trim().max(100).optional(),
  city: z.string().min(1, "City is required"),
  neighborhood: z.string().trim().max(100).optional(),
  address: z.string().trim().max(200).optional(),
  property_type: z.enum(["condo", "townhouse", "other"]),
  unit_type: z.enum(["studio", "1bed", "1bed_den", "2bed", "2bed_den", "3bed", "penthouse"]),
  beds: z.coerce.number().min(0).max(10),
  baths: z.coerce.number().min(1).max(10),
  interior_sqft: z.coerce.number().min(0).max(10000).optional(),
  exterior_sqft: z.coerce.number().min(0).max(5000).optional(),
  floor_level: z.coerce.number().min(1).max(100).optional(),
  exposure: z.string().trim().max(50).optional(),
  assignment_price: z.coerce.number().min(1, "Assignment price is required"),
  original_price: z.coerce.number().min(0).optional(),
  deposit_paid: z.coerce.number().min(0).optional(),
  assignment_fee: z.coerce.number().min(0).optional(),
  completion_month: z.coerce.number().min(1).max(12).optional(),
  completion_year: z.coerce.number().min(2024).max(2035).optional(),
  construction_status: z.enum(["pre_construction", "under_construction", "completed"]),
  has_parking: z.boolean(),
  parking_count: z.coerce.number().min(0).max(5).optional(),
  has_storage: z.boolean(),
  description: z.string().trim().max(5000).optional(),
  visibility_mode: z.enum(["public", "restricted"]),
});

type ListingFormData = z.infer<typeof listingSchema>;

interface UploadedFile {
  id?: string;
  url: string;
  name: string;
  isNew?: boolean;
}

export default function ListingForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<UploadedFile[]>([]);
  const [floorplans, setFloorplans] = useState<UploadedFile[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingFloorplans, setUploadingFloorplans] = useState(false);
  const [brochureUploaderOpen, setBrochureUploaderOpen] = useState(false);

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      project_name: "",
      developer_name: "",
      city: "",
      neighborhood: "",
      address: "",
      property_type: "condo",
      unit_type: "1bed",
      beds: 1,
      baths: 1,
      interior_sqft: undefined,
      exterior_sqft: undefined,
      floor_level: undefined,
      exposure: "",
      assignment_price: undefined,
      original_price: undefined,
      deposit_paid: undefined,
      assignment_fee: undefined,
      completion_month: undefined,
      completion_year: undefined,
      construction_status: "under_construction",
      has_parking: false,
      parking_count: 0,
      has_storage: false,
      description: "",
      visibility_mode: "public",
    },
  });

  useEffect(() => {
    if (isEditing && id) {
      fetchListing(id);
    }
  }, [id, isEditing]);

  const fetchListing = async (listingId: string) => {
    setLoading(true);
    try {
      const { data: listing, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .single();

      if (error) throw error;

      if (listing.agent_id !== user?.id) {
        toast({
          title: "Access denied",
          description: "You can only edit your own assignments.",
          variant: "destructive",
        });
        navigate("/dashboard/listings");
        return;
      }

      form.reset({
        title: listing.title,
        project_name: listing.project_name,
        developer_name: listing.developer_name || "",
        city: listing.city,
        neighborhood: listing.neighborhood || "",
        address: listing.address || "",
        property_type: listing.property_type,
        unit_type: listing.unit_type,
        beds: listing.beds,
        baths: listing.baths,
        interior_sqft: listing.interior_sqft || undefined,
        exterior_sqft: listing.exterior_sqft || undefined,
        floor_level: listing.floor_level || undefined,
        exposure: listing.exposure || "",
        assignment_price: listing.assignment_price,
        original_price: listing.original_price || undefined,
        deposit_paid: listing.deposit_paid || undefined,
        assignment_fee: listing.assignment_fee || undefined,
        completion_month: listing.completion_month || undefined,
        completion_year: listing.completion_year || undefined,
        construction_status: listing.construction_status,
        has_parking: listing.has_parking || false,
        parking_count: listing.parking_count || 0,
        has_storage: listing.has_storage || false,
        description: listing.description || "",
        visibility_mode: (listing as any).visibility_mode || "public",
      });

      // Fetch photos
      const { data: photoData } = await supabase
        .from("listing_photos")
        .select("id, url")
        .eq("listing_id", listingId)
        .order("sort_order");

      if (photoData) {
        setPhotos(photoData.map(p => ({ id: p.id, url: p.url, name: p.url.split("/").pop() || "photo" })));
      }

      // Fetch floorplans
      const { data: fileData } = await supabase
        .from("listing_files")
        .select("id, url, file_name")
        .eq("listing_id", listingId)
        .eq("file_type", "floorplan");

      if (fileData) {
        setFloorplans(fileData.map(f => ({ id: f.id, url: f.url, name: f.file_name || "floorplan" })));
      }
    } catch (error) {
      console.error("Error fetching listing:", error);
      toast({
        title: "Error",
        description: "Failed to load assignment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    const newPhotos: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      
      const url = await uploadFile(file, "listing-photos");
      if (url) {
        newPhotos.push({ url, name: file.name, isNew: true });
      }
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    setUploadingPhotos(false);
    e.target.value = "";
  };

  const handleFloorplanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFloorplans(true);
    const newFloorplans: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      const url = await uploadFile(file, "listing-files");
      if (url) {
        newFloorplans.push({ url, name: file.name, isNew: true });
      }
    }

    setFloorplans(prev => [...prev, ...newFloorplans]);
    setUploadingFloorplans(false);
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeFloorplan = (index: number) => {
    setFloorplans(prev => prev.filter((_, i) => i !== index));
  };

  // Handle data extracted from brochure AI
  const handleBrochureDataExtracted = (data: ExtractedAssignmentData) => {
    const currentValues = form.getValues();
    
    // Only update fields that are empty or have default values
    if (data.project_name && !currentValues.project_name) {
      form.setValue("project_name", data.project_name);
    }
    if (data.developer_name && !currentValues.developer_name) {
      form.setValue("developer_name", data.developer_name);
    }
    if (data.city && !currentValues.city) {
      form.setValue("city", data.city);
    }
    if (data.neighborhood && !currentValues.neighborhood) {
      form.setValue("neighborhood", data.neighborhood);
    }
    if (data.address && !currentValues.address) {
      form.setValue("address", data.address);
    }
    if (data.property_type) {
      form.setValue("property_type", data.property_type);
    }
    if (data.unit_type) {
      form.setValue("unit_type", data.unit_type);
    }
    if (data.beds !== undefined) {
      form.setValue("beds", data.beds);
    }
    if (data.baths !== undefined) {
      form.setValue("baths", data.baths);
    }
    if (data.interior_sqft) {
      form.setValue("interior_sqft", data.interior_sqft);
    }
    if (data.exterior_sqft) {
      form.setValue("exterior_sqft", data.exterior_sqft);
    }
    if (data.floor_level) {
      form.setValue("floor_level", data.floor_level);
    }
    if (data.exposure && !currentValues.exposure) {
      form.setValue("exposure", data.exposure);
    }
    if (data.original_price) {
      form.setValue("original_price", data.original_price);
    }
    if (data.completion_month) {
      form.setValue("completion_month", data.completion_month);
    }
    if (data.completion_year) {
      form.setValue("completion_year", data.completion_year);
    }
    if (data.construction_status) {
      form.setValue("construction_status", data.construction_status);
    }
    if (data.has_parking !== undefined) {
      form.setValue("has_parking", data.has_parking);
      if (data.parking_count) {
        form.setValue("parking_count", data.parking_count);
      }
    }
    if (data.has_storage !== undefined) {
      form.setValue("has_storage", data.has_storage);
    }
    if (data.description && !currentValues.description) {
      form.setValue("description", data.description);
    }
    
    // Auto-generate title if empty
    if (!currentValues.title && data.project_name && data.unit_type) {
      const unitLabel = data.unit_type === "studio" ? "Studio" : 
                       data.unit_type === "1bed" ? "1BR" :
                       data.unit_type === "1bed_den" ? "1BR+Den" :
                       data.unit_type === "2bed" ? "2BR" :
                       data.unit_type === "2bed_den" ? "2BR+Den" :
                       data.unit_type === "3bed" ? "3BR" : "Penthouse";
      const floorText = data.floor_level ? ` Floor ${data.floor_level}` : "";
      form.setValue("title", `${unitLabel}${floorText} at ${data.project_name}`);
    }
  };

  const handleSubmit = async (data: ListingFormData) => {
    if (!user) return;
    setSaving(true);

    try {
      const listingData = {
        agent_id: user.id,
        title: data.title,
        project_name: data.project_name,
        developer_name: data.developer_name || null,
        city: data.city,
        neighborhood: data.neighborhood || null,
        address: data.address || null,
        property_type: data.property_type,
        unit_type: data.unit_type,
        beds: data.beds,
        baths: data.baths,
        interior_sqft: data.interior_sqft || null,
        exterior_sqft: data.exterior_sqft || null,
        floor_level: data.floor_level || null,
        exposure: data.exposure || null,
        assignment_price: data.assignment_price,
        original_price: data.original_price || null,
        deposit_paid: data.deposit_paid || null,
        assignment_fee: data.assignment_fee || null,
        completion_month: data.completion_month || null,
        completion_year: data.completion_year || null,
        construction_status: data.construction_status,
        has_parking: data.has_parking,
        parking_count: data.has_parking ? (data.parking_count || 1) : 0,
        has_storage: data.has_storage,
        description: data.description || null,
        visibility_mode: data.visibility_mode,
      };

      let listingId = id;

      if (isEditing && id) {
        const { error } = await supabase
          .from("listings")
          .update(listingData)
          .eq("id", id);
        
        if (error) throw error;
      } else {
        const { data: newListing, error } = await supabase
          .from("listings")
          .insert({ ...listingData, status: "draft" })
          .select("id")
          .single();
        
        if (error) throw error;
        listingId = newListing.id;
      }

      // Save new photos
      const newPhotos = photos.filter(p => p.isNew);
      if (newPhotos.length > 0 && listingId) {
        await supabase.from("listing_photos").insert(
          newPhotos.map((photo, idx) => ({
            listing_id: listingId,
            url: photo.url,
            sort_order: photos.indexOf(photo),
          }))
        );
      }

      // Save new floorplans
      const newFloorplans = floorplans.filter(f => f.isNew);
      if (newFloorplans.length > 0 && listingId) {
        await supabase.from("listing_files").insert(
          newFloorplans.map(fp => ({
            listing_id: listingId,
            url: fp.url,
            file_name: fp.name,
            file_type: "floorplan",
          }))
        );
      }

      toast({
        title: isEditing ? "Assignment updated" : "Assignment created",
        description: isEditing 
          ? "Your changes have been saved."
          : "Your assignment has been saved as a draft.",
      });

      navigate("/dashboard/listings");
    } catch (error) {
      console.error("Error saving listing:", error);
      toast({
        title: "Error",
        description: "Failed to save assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard/listings">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">
                {isEditing ? "Edit Assignment" : "Create New Assignment"}
              </h1>
              <p className="text-muted-foreground">
                {isEditing ? "Update your assignment" : "Add a new assignment to the marketplace"}
              </p>
            </div>
          </div>
          
          {!isEditing && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setBrochureUploaderOpen(true)}
              className="gap-2"
            >
              <Wand2 className="h-4 w-4" />
              <span className="hidden sm:inline">Auto-Fill from Brochure</span>
              <span className="sm:hidden">Auto-Fill</span>
            </Button>
          )}
        </div>

        {/* AI Brochure Uploader Modal */}
        <AssignmentBrochureUploader
          isOpen={brochureUploaderOpen}
          onClose={() => setBrochureUploaderOpen(false)}
          onDataExtracted={handleBrochureDataExtracted}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Visibility Mode */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle>Assignment Visibility</CardTitle>
                <CardDescription>
                  Choose how this assignment will be displayed publicly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="visibility_mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility Mode *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VISIBILITY_MODES.map(mode => (
                            <SelectItem key={mode.value} value={mode.value}>
                              <div>
                                <span className="font-medium">{mode.label}</span>
                                <span className="text-muted-foreground ml-2 text-xs">— {mode.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-sm">
                        If the developer restricts public marketing, select <strong>Restricted Listing</strong> to remain compliant. Project and developer details will be shared only after buyer inquiry.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>General details about the property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Bright 2BR Corner Unit at The Arc" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="project_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. The Arc" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="developer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Developer</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Concord Pacific" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CITIES.map(city => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Neighborhood</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Yaletown" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional - building address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>Unit specifications and features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="property_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROPERTY_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UNIT_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="beds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beds *</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={10} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="baths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Baths *</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={10} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interior_sqft"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interior (sqft)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 650" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exterior_sqft"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exterior (sqft)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="floor_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Floor Level</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 15" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exposure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exposure</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. South, NE Corner" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="has_parking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Parking Included</FormLabel>
                          <FormDescription>Does this unit include parking?</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("has_parking") && (
                    <FormField
                      control={form.control}
                      name="parking_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Parking Spots</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} max={5} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="has_storage"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Storage Included</FormLabel>
                        <FormDescription>Does this unit include a storage locker?</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>Assignment pricing and deposit information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assignment_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignment Price (CAD) *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 650000" {...field} />
                        </FormControl>
                        <FormDescription>Total price the buyer will pay</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="original_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Original Purchase Price</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 600000" {...field} />
                        </FormControl>
                        <FormDescription>What you paid the developer</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deposit_paid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit Paid</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 120000" {...field} />
                        </FormControl>
                        <FormDescription>Amount paid to developer so far</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignment_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignment Fee</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 50000" {...field} />
                        </FormControl>
                        <FormDescription>Premium over original price</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Completion & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Completion & Timeline</CardTitle>
                <CardDescription>Construction status and expected completion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="construction_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Construction Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CONSTRUCTION_STATUS.map(status => (
                            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="completion_month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Completion Month</FormLabel>
                        <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MONTHS.map(month => (
                              <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="completion_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Completion Year</FormLabel>
                        <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => 2024 + i).map(year => (
                              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
                <CardDescription>Detailed description of the property</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the property, views, amenities, and any special features..."
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Photos */}
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>Upload photos of the unit and building</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                      <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhotos}
                    />
                    {uploadingPhotos ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImageIcon className="h-6 w-6 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">Add Photos</span>
                      </>
                    )}
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Floorplans */}
            <Card>
              <CardHeader>
                <CardTitle>Floor Plans</CardTitle>
                <CardDescription>Upload floor plan documents or images</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {floorplans.map((fp, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <span className="text-sm flex-1 truncate">{fp.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFloorplan(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    onChange={handleFloorplanUpload}
                    className="hidden"
                    disabled={uploadingFloorplans}
                  />
                  {uploadingFloorplans ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Upload floor plan (PDF or image)</span>
                    </>
                  )}
                </label>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Save Changes" : "Save as Draft"}
              </Button>
              <Link to="/dashboard/listings" className="flex-1 sm:flex-none">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
