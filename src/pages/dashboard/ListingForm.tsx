import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
import { CurrencyInput } from "@/components/ui/currency-input";
import { 
  Loader2, 
  Upload, 
  X, 
  Image as ImageIcon,
  FileText,
  ArrowLeft,
  Wand2,
  MapPin,
  CheckCircle2,
  Sparkles,
  Globe,
  Lock,
  Zap,
  Save,
} from "lucide-react";
import { AssignmentBrochureUploader, ExtractedAssignmentData } from "@/components/listings/AssignmentBrochureUploader";
import { SocialMediaImporter, ExtractedSocialData } from "@/components/listings/SocialMediaImporter";
import { InteractiveMapPicker } from "@/components/listings/InteractiveMapPicker";

interface AddressSuggestion {
  description: string;
  placeId: string;
}

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
  { 
    value: "public", 
    label: "Public Assignment", 
    description: "Visible to everyone on the website and map",
    icon: Globe,
    detail: "Use this when you have developer approval to market publicly. All details will be visible to buyers, agents, and the public."
  },
  { 
    value: "restricted", 
    label: "Restricted (REALTOR® Only)", 
    description: "Only visible to verified agents",
    icon: Lock,
    detail: "Only verified real estate agents logged into the portal can view this listing. Perfect for assignments without public marketing approval."
  },
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
  const [socialImporterOpen, setSocialImporterOpen] = useState(false);
  const [brochureContent, setBrochureContent] = useState<string>("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  
  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapLat, setMapLat] = useState<number | null>(null);
  const [mapLng, setMapLng] = useState<number | null>(null);
  const [addressInputValue, setAddressInputValue] = useState("");

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
      
      // Load existing coordinates and address
      if (listing.address) {
        setAddressInputValue(listing.address);
      }
      if (listing.map_lat && listing.map_lng) {
        setMapLat(Number(listing.map_lat));
        setMapLng(Number(listing.map_lng));
      }

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

  // Debounced address autocomplete
  const debounceTimeoutRef = useCallback(() => {
    let timeout: NodeJS.Timeout | null = null;
    return (fn: () => void, delay: number) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(fn, delay);
    };
  }, [])();

  const handleAddressInputChange = async (value: string) => {
    setAddressInputValue(value);
    form.setValue("address", value);
    
    if (value.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    debounceTimeoutRef(async () => {
      setIsLoadingSuggestions(true);
      try {
        const { data, error } = await supabase.functions.invoke('geocode-address', {
          body: { address: value, action: 'autocomplete' }
        });
        
        if (!error && data?.predictions) {
          setAddressSuggestions(data.predictions);
          setShowAddressSuggestions(data.predictions.length > 0);
        }
      } catch (err) {
        console.error('Address autocomplete error:', err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);
  };

  const handleAddressSuggestionClick = async (suggestion: AddressSuggestion) => {
    setAddressInputValue(suggestion.description);
    form.setValue("address", suggestion.description);
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
    
    // Geocode the selected address
    setIsGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: suggestion.description, action: 'geocode' }
      });
      
      if (!error && data?.lat && data?.lng) {
        setMapLat(data.lat);
        setMapLng(data.lng);
        
        // Auto-fill city and neighborhood if available and fields are empty
        const currentCity = form.getValues("city");
        const currentNeighborhood = form.getValues("neighborhood");
        
        if (data.city && !currentCity) {
          // Check if the city matches our list
          const matchedCity = CITIES.find(c => 
            c.toLowerCase() === data.city.toLowerCase() ||
            data.city.toLowerCase().includes(c.toLowerCase())
          );
          if (matchedCity) {
            form.setValue("city", matchedCity);
          }
        }
        if (data.neighborhood && !currentNeighborhood) {
          form.setValue("neighborhood", data.neighborhood);
        }
        
        toast({
          title: "Location Found",
          description: `Coordinates saved for map display`,
        });
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      toast({
        title: "Geocoding Failed",
        description: "Could not get coordinates for this address",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
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
    
    // Store brochure content for AI description generation
    if (data.description) {
      setBrochureContent(data.description);
    }
  };

  // Handle data from social media import
  const handleSocialDataExtracted = (data: ExtractedSocialData) => {
    const currentValues = form.getValues();
    
    // Apply all extracted fields
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
      setAddressInputValue(data.address);
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
    if (data.assignment_price) {
      form.setValue("assignment_price", data.assignment_price);
    }
    if (data.original_price) {
      form.setValue("original_price", data.original_price);
    }
    if (data.deposit_paid) {
      form.setValue("deposit_paid", data.deposit_paid);
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
      setBrochureContent(data.description);
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

  // AI Description Generator
  const handleGenerateDescription = async () => {
    const values = form.getValues();
    
    // Validate we have minimum data
    if (!values.project_name) {
      toast({
        title: "Missing Information",
        description: "Please enter a project name before generating a description.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingDescription(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('format-description', {
        body: {
          type: 'generate_assignment',
          listingData: {
            project_name: values.project_name,
            developer_name: values.developer_name,
            city: values.city,
            neighborhood: values.neighborhood,
            address: values.address,
            unit_type: UNIT_TYPES.find(u => u.value === values.unit_type)?.label || values.unit_type,
            beds: values.beds,
            baths: values.baths,
            interior_sqft: values.interior_sqft,
            exterior_sqft: values.exterior_sqft,
            floor_level: values.floor_level,
            exposure: values.exposure,
            has_parking: values.has_parking,
            parking_count: values.parking_count,
            has_storage: values.has_storage,
            assignment_price: values.assignment_price,
            original_price: values.original_price,
            completion_month: values.completion_month,
            completion_year: values.completion_year,
            construction_status: values.construction_status,
          },
          brochureContent: brochureContent || undefined,
        }
      });
      
      if (error) throw error;
      
      if (data?.formatted) {
        form.setValue("description", data.formatted);
        toast({
          title: "Description Generated",
          description: "AI-generated description applied. Feel free to edit it.",
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("AI generation error:", err);
      toast({
        title: "Generation Failed",
        description: err instanceof Error ? err.message : "Could not generate description",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDescription(false);
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
        map_lat: mapLat,
        map_lng: mapLng,
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              <p className="text-muted-foreground text-sm">
                {isEditing ? "Update your assignment" : "Upload under 5 minutes with AI auto-fill"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Import Section - Only show for new listings */}
        {!isEditing && (
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" />
                Quick Import
              </CardTitle>
              <CardDescription>
                Import your listing data automatically from existing marketing materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSocialImporterOpen(true)}
                  className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold">Facebook / WhatsApp</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Upload screenshot & paste description
                  </span>
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBrochureUploaderOpen(true)}
                  className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="font-semibold">PDF Brochure</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Extract from developer floorplan PDF
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Import Modals */}
        <AssignmentBrochureUploader
          isOpen={brochureUploaderOpen}
          onClose={() => setBrochureUploaderOpen(false)}
          onDataExtracted={handleBrochureDataExtracted}
        />
        <SocialMediaImporter
          isOpen={socialImporterOpen}
          onClose={() => setSocialImporterOpen(false)}
          onDataExtracted={handleSocialDataExtracted}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Visibility Mode */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Assignment Visibility
                </CardTitle>
                <CardDescription>
                  Choose who can see this assignment listing
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="visibility_mode"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {VISIBILITY_MODES.map((mode) => {
                          const Icon = mode.icon;
                          const isSelected = field.value === mode.value;
                          return (
                            <button
                              key={mode.value}
                              type="button"
                              onClick={() => field.onChange(mode.value)}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                isSelected
                                  ? mode.value === "public"
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                    : "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20"
                                  : "border-border hover:border-muted-foreground/30"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  mode.value === "public"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                }`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{mode.label}</span>
                                    {isSelected && (
                                      <CheckCircle2 className={`h-4 w-4 ${
                                        mode.value === "public" ? "text-primary" : "text-amber-500"
                                      }`} />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {mode.description}
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-3 pl-13">
                                {mode.detail}
                              </p>
                            </button>
                          );
                        })}
                      </div>
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
                      <FormLabel className="flex items-center gap-2">
                        Address
                        {mapLat && mapLng && (
                          <span className="inline-flex items-center gap-1 text-xs text-primary font-normal">
                            <CheckCircle2 className="h-3 w-3" />
                            Geocoded
                          </span>
                        )}
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="Start typing to search address..."
                              className="pl-9 pr-9"
                              value={addressInputValue || field.value || ""}
                              onChange={(e) => handleAddressInputChange(e.target.value)}
                              onFocus={() => addressSuggestions.length > 0 && setShowAddressSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                              autoComplete="off"
                            />
                            {(isLoadingSuggestions || isGeocoding) && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        
                        {/* Address suggestions dropdown */}
                        {showAddressSuggestions && addressSuggestions.length > 0 && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {addressSuggestions.map((suggestion, idx) => (
                              <button
                                key={suggestion.placeId || idx}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-start gap-2"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleAddressSuggestionClick(suggestion);
                                }}
                              >
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <span className="line-clamp-2">{suggestion.description}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormDescription className="text-xs">
                        Search for the building address to enable map pin placement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Interactive Map for Pin Adjustment */}
                {(mapLat && mapLng) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Adjust Pin Location
                    </label>
                    <InteractiveMapPicker
                      lat={mapLat}
                      lng={mapLng}
                      onLocationChange={(lat, lng) => {
                        setMapLat(lat);
                        setMapLng(lng);
                      }}
                      className="h-[250px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Drag the pin to fine-tune the exact building location for accurate map display
                    </p>
                  </div>
                )}
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
                          <CurrencyInput 
                            value={field.value} 
                            onChange={field.onChange}
                            placeholder="$0"
                          />
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
                          <CurrencyInput 
                            value={field.value} 
                            onChange={field.onChange}
                            placeholder="$0"
                          />
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
                          <CurrencyInput 
                            value={field.value} 
                            onChange={field.onChange}
                            placeholder="$0"
                          />
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
                          <CurrencyInput 
                            value={field.value} 
                            onChange={field.onChange}
                            placeholder="$0"
                          />
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
                      <FormControl>
                        <select
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {CONSTRUCTION_STATUS.map(status => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                          ))}
                        </select>
                      </FormControl>
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
                        <FormControl>
                          <select
                            value={field.value?.toString() || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select month</option>
                            {MONTHS.map(month => (
                              <option key={month.value} value={month.value.toString()}>{month.label}</option>
                            ))}
                          </select>
                        </FormControl>
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
                        <FormControl>
                          <select
                            value={field.value?.toString() || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select year</option>
                            {Array.from({ length: 12 }, (_, i) => 2024 + i).map(year => (
                              <option key={year} value={year.toString()}>{year}</option>
                            ))}
                          </select>
                        </FormControl>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Description</CardTitle>
                    <CardDescription>Detailed description of the property</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDescription}
                    className="gap-2"
                  >
                    {isGeneratingDescription ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {isGeneratingDescription ? "Generating..." : "AI Generate"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
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
                {brochureContent && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    Brochure content available for AI generation
                  </p>
                )}
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
