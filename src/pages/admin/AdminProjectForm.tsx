import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AIProjectUploadWizard } from "@/components/admin/AIProjectUploadWizard";
import { ClickableMapPreview } from "@/components/admin/ClickableMapPreview";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
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
  Image,
  FileText,
  MapPin,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

type ProjectFormData = {
  name: string;
  slug: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  city: string;
  neighborhood: string;
  address: string;
  developer_id: string;
  developer_name: string;
  project_type: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  unit_mix: string;
  starting_price: string;
  deposit_structure: string;
  deposit_percent: string;
  strata_fees: string;
  assignment_fees: string;
  assignment_allowed: string;
  rental_restrictions: string;
  incentives: string;
  incentives_available: boolean;
  near_skytrain: boolean;
  map_lat: string;
  map_lng: string;
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
  video_url: string;
  brochure_files: string[];
  floorplan_files: string[];
  pricing_sheets: string[];
  seo_title: string;
  seo_description: string;
  is_indexed: boolean;
  is_published: boolean;
  is_featured: boolean;
  show_in_hero: boolean;
};

const defaultFormData: ProjectFormData = {
  name: "",
  slug: "",
  status: "coming_soon",
  city: "",
  neighborhood: "",
  address: "",
  developer_id: "",
  developer_name: "",
  project_type: "condo",
  unit_mix: "",
  starting_price: "",
  deposit_structure: "",
  deposit_percent: "",
  strata_fees: "",
  assignment_fees: "",
  assignment_allowed: "Unknown",
  rental_restrictions: "Unknown",
  incentives: "",
  incentives_available: false,
  near_skytrain: false,
  map_lat: "",
  map_lng: "",
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
  video_url: "",
  brochure_files: [],
  floorplan_files: [],
  pricing_sheets: [],
  seo_title: "",
  seo_description: "",
  is_indexed: true,
  is_published: false,
  is_featured: false,
  show_in_hero: false,
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
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<{ description: string; placeId: string }[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [adjacentProjects, setAdjacentProjects] = useState<{ prev: string | null; next: string | null }>({ prev: null, next: null });
  const [isFormattingDescription, setIsFormattingDescription] = useState(false);
  const [isFormattingShortDescription, setIsFormattingShortDescription] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [isExtractingFromPdf, setIsExtractingFromPdf] = useState(false);
  const [extractedPreviewImages, setExtractedPreviewImages] = useState<{
    url: string;
    width: number;
    height: number;
    category: string;
    qualityScore: number;
    isPrimary: boolean;
    storyOrder: number;
    altText: string;
  }[]>([]);
  const [selectedPreviewImages, setSelectedPreviewImages] = useState<Set<number>>(new Set());
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  const [extractionSummary, setExtractionSummary] = useState<{ primaryReason?: string; categoryCounts?: Record<string, number> }>({});
  const [developers, setDevelopers] = useState<{ id: string; name: string }[]>([]);
  const [developerSearch, setDeveloperSearch] = useState("");
  const [showDeveloperDropdown, setShowDeveloperDropdown] = useState(false);
  const [isAddingDeveloper, setIsAddingDeveloper] = useState(false);
  const [isSortingGallery, setIsSortingGallery] = useState(false);
  const pdfForGalleryInputRef = useRef<HTMLInputElement>(null);
  const developerInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Geocode address using Google Maps API via edge function
  const geocodeAddressAsync = async (address: string, city: string, neighborhood: string): Promise<{ lat: string; lng: string } | null> => {
    if (!address && !city) return null;
    
    try {
      const searchParts = [address, neighborhood, city, "BC", "Canada"].filter(Boolean);
      const searchQuery = searchParts.join(", ");
      
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: searchQuery, action: 'geocode' },
      });
      
      if (error) throw new Error('Geocoding failed');
      
      return { lat: data.lat.toString(), lng: data.lng.toString() };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Fetch address suggestions from Google Places
  const fetchAddressSuggestions = async (input: string) => {
    if (input.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    
    setIsLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: input, action: 'autocomplete' },
      });
      
      if (!error && data) {
        setAddressSuggestions(data.predictions || []);
        setShowAddressSuggestions(true);
      } else {
        console.error('Address suggestions error:', error);
      }
    } catch (error) {
      console.error('Address suggestions error:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle selecting an address suggestion
  const handleSelectAddress = async (suggestion: { description: string; placeId: string }) => {
    setFormData(prev => ({ ...prev, address: suggestion.description }));
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
    
    // Use placeDetails for accurate coordinates from the selected place
    setIsGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: suggestion.description, action: 'placeDetails', placeId: suggestion.placeId },
      });
      
      if (!error && data && data.lat && data.lng) {
        setFormData(prev => ({
          ...prev,
          address: data.formattedAddress || suggestion.description,
          map_lat: data.lat.toString(),
          map_lng: data.lng.toString(),
          city: data.city || prev.city,
          neighborhood: data.neighborhood || prev.neighborhood,
        }));
        toast({
          title: "Address Found",
          description: `Coordinates: ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`,
        });
      } else {
        console.error('Place details error:', error);
        toast({
          title: "Could not get coordinates",
          description: "Try entering the address manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Geocoding selected address error:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Manual geocode with UI feedback
  const geocodeAddress = async (address: string, city: string, neighborhood: string) => {
    if (!address && !city) return;
    
    setIsGeocoding(true);
    try {
      const coords = await geocodeAddressAsync(address, city, neighborhood);
      
      if (coords) {
        setFormData(prev => ({
          ...prev,
          map_lat: coords.lat,
          map_lng: coords.lng,
        }));
        toast({
          title: "Coordinates Found",
          description: `Location: ${parseFloat(coords.lat).toFixed(4)}, ${parseFloat(coords.lng).toFixed(4)}`,
        });
      } else {
        toast({
          title: "No Results",
          description: "Could not find coordinates for this address. Try adding more details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Geocoding Failed",
        description: "Could not fetch coordinates. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const isEdit = !!id;

  // Fetch developers list
  const fetchDevelopers = async () => {
    try {
      const { data, error } = await supabase
        .from("developers")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      
      if (!error && data) {
        setDevelopers(data);
      }
    } catch (err) {
      console.error("Error fetching developers:", err);
    }
  };

  useEffect(() => {
    fetchDevelopers();
    if (id) {
      fetchProject();
      fetchAdjacentProjects();
    }
  }, [id]);

  // Filter developers based on search
  const filteredDevelopers = developers.filter(dev => 
    dev.name.toLowerCase().includes(developerSearch.toLowerCase())
  );

  // Check if search term is a new developer (not in list)
  const isNewDeveloper = developerSearch.trim() && 
    !developers.some(dev => dev.name.toLowerCase() === developerSearch.toLowerCase());

  // Add new developer
  const addNewDeveloper = async (name: string) => {
    if (!name.trim()) return;
    
    setIsAddingDeveloper(true);
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      
      const { data, error } = await supabase
        .from("developers")
        .insert({ name: name.trim(), slug, is_active: true })
        .select("id, name")
        .single();
      
      if (error) throw error;
      
      // Add to local list and select it
      setDevelopers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData(prev => ({ ...prev, developer_id: data.id, developer_name: data.name }));
      setDeveloperSearch("");
      setShowDeveloperDropdown(false);
      
      toast({
        title: "Developer Added",
        description: `"${data.name}" added to developers list`,
      });
    } catch (err: any) {
      console.error("Error adding developer:", err);
      toast({
        title: "Error",
        description: err.message || "Could not add developer",
        variant: "destructive",
      });
    } finally {
      setIsAddingDeveloper(false);
    }
  };

  // Select existing developer
  const selectDeveloper = (id: string, name: string) => {
    setFormData(prev => ({ ...prev, developer_id: id, developer_name: name }));
    setDeveloperSearch("");
    setShowDeveloperDropdown(false);
  };

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
        developer_id: data.developer_id || "",
        developer_name: data.developer_name || "",
        project_type: data.project_type || "condo",
        unit_mix: data.unit_mix || "",
        starting_price: data.starting_price?.toString() || "",
        deposit_structure: data.deposit_structure || "",
        deposit_percent: data.deposit_percent?.toString() || "",
        strata_fees: data.strata_fees || "",
        assignment_fees: data.assignment_fees || "",
        assignment_allowed: data.assignment_allowed || "Unknown",
        rental_restrictions: data.rental_restrictions || "Unknown",
        incentives: data.incentives || "",
        incentives_available: data.incentives_available || false,
        near_skytrain: data.near_skytrain || false,
        map_lat: data.map_lat?.toString() || "",
        map_lng: data.map_lng?.toString() || "",
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
        video_url: data.video_url || "",
        brochure_files: data.brochure_files || [],
        floorplan_files: data.floorplan_files || [],
        pricing_sheets: data.pricing_sheets || [],
        seo_title: data.seo_title || "",
        seo_description: data.seo_description || "",
        is_indexed: data.is_indexed ?? true,
        is_published: data.is_published || false,
        is_featured: data.is_featured || false,
        show_in_hero: (data as any).show_in_hero || false,
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

  // Fetch adjacent projects for navigation
  const fetchAdjacentProjects = async () => {
    if (!id) return;
    
    try {
      // Fetch all project IDs ordered by updated_at (same order as admin list)
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      
      const projectIds = data?.map(p => p.id) || [];
      const currentIndex = projectIds.indexOf(id);
      
      if (currentIndex !== -1) {
        setAdjacentProjects({
          prev: currentIndex > 0 ? projectIds[currentIndex - 1] : null,
          next: currentIndex < projectIds.length - 1 ? projectIds[currentIndex + 1] : null,
        });
      }
    } catch (error) {
      console.error("Error fetching adjacent projects:", error);
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
    const location = data.neighborhood || data.city || "";
    
    if (name && location) {
      let title = `${name} ${location} — Download Floor Plans & Pricing`;
      if (title.length > 60) title = `${name} ${location} — Floor Plans & Pricing`;
      if (title.length > 60) title = `${name} — Download Floor Plans & Pricing`;
      if (title.length > 60) title = `${name} — Floor Plans & Pricing`;
      return title;
    } else if (name) {
      return `${name} — Download Floor Plans & Pricing`;
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

  const generateSeoWithAI = async () => {
    if (!formData.name) {
      toast({ title: "Project name required", description: "Add a project name first to generate SEO content", variant: "destructive" });
      return;
    }
    
    setIsGeneratingSeo(true);
    try {
      const projectContext = `
Project Name: ${formData.name}
Type: ${formData.project_type || 'condo'}
City: ${formData.city || 'Vancouver'}
Neighborhood: ${formData.neighborhood || ''}
Starting Price: ${formData.starting_price ? `$${parseInt(formData.starting_price).toLocaleString()}` : 'TBD'}
Unit Mix: ${formData.unit_mix || ''}
Developer: ${formData.developer_name || ''}
Completion: ${formData.occupancy_estimate || (formData.completion_year ? `${formData.completion_month ? new Date(2000, Number(formData.completion_month) - 1).toLocaleString('default', { month: 'short' }) + ' ' : ''}${formData.completion_year}` : 'TBD')}
Highlights: ${formData.highlights.join(', ') || 'N/A'}
      `.trim();
      
      const { data, error } = await supabase.functions.invoke('format-description', {
        body: {
          description: projectContext,
          type: 'seo',
          projectName: formData.name,
          city: formData.city,
          neighborhood: formData.neighborhood,
        }
      });
      
      if (error) throw error;
      
      if (data?.seoTitle && data?.seoDescription) {
        setFormData(prev => ({
          ...prev,
          seo_title: data.seoTitle,
          seo_description: data.seoDescription,
        }));
        toast({ title: "SEO content generated", description: "Title and description have been updated" });
      } else {
        // Fallback to template-based generation
        const seoFields = updateSeoFields({});
        setFormData(prev => ({ ...prev, ...seoFields }));
        toast({ title: "SEO content generated", description: "Using template-based generation" });
      }
    } catch (error) {
      console.error('AI SEO generation error:', error);
      // Fallback to template-based generation
      const seoFields = updateSeoFields({});
      setFormData(prev => ({ ...prev, ...seoFields }));
      toast({ title: "SEO content generated", description: "Using template-based generation" });
    } finally {
      setIsGeneratingSeo(false);
    }
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

  // AI: Detect and extract pure image regions from a PDF page (no text)
  const extractImageRegionsFromPage = async (
    page: any, 
    pageNum: number,
    renderScale: number = 3.0
  ): Promise<{ blob: Blob; width: number; height: number; quality: number }[]> => {
    const extractedImages: { blob: Blob; width: number; height: number; quality: number }[] = [];
    
    try {
      const viewport = page.getViewport({ scale: renderScale });
      const textContent = await page.getTextContent();
      
      // Render the full page
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return extractedImages;
      
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      await page.render({ canvasContext: ctx, viewport }).promise;
      
      // Build text region mask - mark areas with text
      const textMask: boolean[][] = Array(Math.ceil(viewport.height / 10))
        .fill(null)
        .map(() => Array(Math.ceil(viewport.width / 10)).fill(false));
      
      const padding = 20 * renderScale; // Padding around text
      
      for (const item of textContent.items as any[]) {
        if (item.transform && item.width && item.height) {
          const [, , , , tx, ty] = item.transform;
          const x = tx * renderScale;
          const y = viewport.height - (ty * renderScale); // PDF Y is bottom-up
          const w = item.width * renderScale;
          const h = item.height * renderScale * 1.5; // Text height buffer
          
          // Mark text region in mask (with padding)
          const startX = Math.max(0, Math.floor((x - padding) / 10));
          const endX = Math.min(textMask[0].length - 1, Math.ceil((x + w + padding) / 10));
          const startY = Math.max(0, Math.floor((y - h - padding) / 10));
          const endY = Math.min(textMask.length - 1, Math.ceil((y + padding) / 10));
          
          for (let my = startY; my <= endY; my++) {
            for (let mx = startX; mx <= endX; mx++) {
              textMask[my][mx] = true;
            }
          }
        }
      }
      
      // Find large non-text rectangular regions (potential images)
      const minImageSize = 150 * renderScale; // Minimum 150px at base scale
      const regions: { x: number; y: number; w: number; h: number }[] = [];
      
      // Scan for contiguous non-text regions
      const visited: boolean[][] = Array(textMask.length)
        .fill(null)
        .map(() => Array(textMask[0].length).fill(false));
      
      for (let y = 0; y < textMask.length; y++) {
        for (let x = 0; x < textMask[0].length; x++) {
          if (!textMask[y][x] && !visited[y][x]) {
            // Flood fill to find region bounds
            let minX = x, maxX = x, minY = y, maxY = y;
            const queue: [number, number][] = [[x, y]];
            visited[y][x] = true;
            
            while (queue.length > 0) {
              const [cx, cy] = queue.shift()!;
              minX = Math.min(minX, cx);
              maxX = Math.max(maxX, cx);
              minY = Math.min(minY, cy);
              maxY = Math.max(maxY, cy);
              
              // Check neighbors
              for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
                const nx = cx + dx, ny = cy + dy;
                if (nx >= 0 && nx < textMask[0].length && ny >= 0 && ny < textMask.length) {
                  if (!textMask[ny][nx] && !visited[ny][nx]) {
                    visited[ny][nx] = true;
                    queue.push([nx, ny]);
                  }
                }
              }
            }
            
            // Convert mask coords to pixel coords
            const regionW = (maxX - minX + 1) * 10;
            const regionH = (maxY - minY + 1) * 10;
            
            // Only keep large enough regions
            if (regionW >= minImageSize && regionH >= minImageSize) {
              regions.push({
                x: minX * 10,
                y: minY * 10,
                w: regionW,
                h: regionH
              });
            }
          }
        }
      }
      
      // Extract each region as a separate image
      for (const region of regions) {
        // Analyze if region contains actual image content (not just white space)
        const regionCanvas = document.createElement("canvas");
        regionCanvas.width = region.w;
        regionCanvas.height = region.h;
        const regionCtx = regionCanvas.getContext("2d");
        if (!regionCtx) continue;
        
        regionCtx.drawImage(
          canvas,
          region.x, region.y, region.w, region.h,
          0, 0, region.w, region.h
        );
        
        // Check if region has meaningful content (not mostly white/blank)
        const imageData = regionCtx.getImageData(0, 0, region.w, region.h);
        const pixels = imageData.data;
        let colorVariance = 0;
        let nonWhitePixels = 0;
        
        // Sample pixels for analysis
        const sampleStep = Math.max(1, Math.floor(pixels.length / (4 * 1000)));
        for (let i = 0; i < pixels.length; i += 4 * sampleStep) {
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          const brightness = (r + g + b) / 3;
          
          // Count non-white pixels
          if (brightness < 250) nonWhitePixels++;
          
          // Measure color variance
          colorVariance += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
        }
        
        const sampledPixels = Math.floor(pixels.length / (4 * sampleStep));
        const nonWhiteRatio = nonWhitePixels / sampledPixels;
        const avgVariance = colorVariance / sampledPixels;
        
        // Skip if mostly white/blank or very low color variance (likely not a photo)
        if (nonWhiteRatio < 0.3 || avgVariance < 10) continue;
        
        // Calculate quality score based on size and color richness
        const quality = (region.w * region.h) / (1000 * 1000) + avgVariance / 100;
        
        const blob = await new Promise<Blob | null>((resolve) => {
          regionCanvas.toBlob(resolve, "image/jpeg", 0.95);
        });
        
        if (blob && blob.size > 30000) { // At least 30KB
          extractedImages.push({
            blob,
            width: Math.round(region.w / renderScale),
            height: Math.round(region.h / renderScale),
            quality
          });
        }
      }
      
      // If no regions found, check if page itself is mostly an image
      if (extractedImages.length === 0) {
        const textCoverage = textMask.flat().filter(Boolean).length / textMask.flat().length;
        
        // If less than 10% text, treat whole page as image
        if (textCoverage < 0.1) {
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/jpeg", 0.95);
          });
          
          if (blob && blob.size > 50000) {
            extractedImages.push({
              blob,
              width: Math.round(viewport.width / renderScale),
              height: Math.round(viewport.height / renderScale),
              quality: (viewport.width * viewport.height) / (1000 * 1000)
            });
          }
        }
      }
      
    } catch (err) {
      console.warn(`Error extracting images from page ${pageNum}:`, err);
    }
    
    return extractedImages;
  };

  // Extract HQ images from PDF (AI detects image regions, classifies, and sequences)
  const extractImagesFromPdfForGallery = async (file: File) => {
    setIsExtractingFromPdf(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const uploadedImages: { url: string; width: number; height: number; pageNum: number; index: number }[] = [];
      
      toast({
        title: "AI Scanning PDF",
        description: `Extracting images from ${pdf.numPages} pages...`,
      });
      
      // Process each page
      let imageIndex = 0;
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const images = await extractImageRegionsFromPage(page, pageNum, 3.0);
          
          for (const img of images) {
            // Upload to storage
            const fileName = `projects/${Date.now()}-${Math.random().toString(36).substring(7)}-p${pageNum}.jpg`;
            
            const { error: uploadError } = await supabase.storage
              .from("listing-photos")
              .upload(fileName, img.blob, { contentType: "image/jpeg" });
            
            if (uploadError) {
              console.error(`Upload failed:`, uploadError);
              continue;
            }
            
            const { data: { publicUrl } } = supabase.storage
              .from("listing-photos")
              .getPublicUrl(fileName);
            
            uploadedImages.push({
              url: publicUrl,
              width: img.width,
              height: img.height,
              pageNum,
              index: imageIndex++
            });
            
            console.log(`Extracted: ${img.width}x${img.height} from page ${pageNum}`);
          }
        } catch (pageErr) {
          console.error(`Error on page ${pageNum}:`, pageErr);
        }
      }
      
      if (uploadedImages.length > 0) {
        toast({
          title: "AI Analyzing Images",
          description: `Classifying ${uploadedImages.length} images...`,
        });
        
        // Call AI to analyze, classify, and sequence images
        try {
          const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('analyze-brochure-images', {
            body: { 
              images: uploadedImages.slice(0, 12), // Limit to 12 for AI
              projectName: formData.name 
            }
          });
          
          if (analysisError) throw analysisError;
          
          if (analysisResult?.images) {
            // Sort by story order and set preview
            const sortedImages = analysisResult.images.sort((a: any, b: any) => a.storyOrder - b.storyOrder);
            setExtractedPreviewImages(sortedImages.slice(0, 7)); // Max 7
            setSelectedPreviewImages(new Set(sortedImages.slice(0, 7).map((_: any, i: number) => i)));
            setExtractionSummary(analysisResult.summary || {});
            setShowImagePreviewModal(true);
            
            const primaryImg = sortedImages.find((img: any) => img.isPrimary);
            toast({
              title: "AI Analysis Complete",
              description: primaryImg 
                ? `Primary: ${primaryImg.altText || primaryImg.category}` 
                : `Found ${sortedImages.length} images`,
            });
          } else {
            throw new Error('No analysis result');
          }
        } catch (aiError) {
          console.warn("AI analysis failed, using basic extraction:", aiError);
          // Fallback: show images without AI classification
          const fallbackImages = uploadedImages.slice(0, 7).map((img, i) => ({
            url: img.url,
            width: img.width,
            height: img.height,
            category: 'other',
            qualityScore: 5,
            isPrimary: i === 0,
            storyOrder: i + 1,
            altText: `Image ${i + 1} (${img.width}x${img.height})`
          }));
          setExtractedPreviewImages(fallbackImages);
          setSelectedPreviewImages(new Set(fallbackImages.map((_, i) => i)));
          setShowImagePreviewModal(true);
          
          toast({
            title: "Images Extracted",
            description: `Found ${fallbackImages.length} images (basic mode)`,
          });
        }
      } else {
        toast({
          title: "No Images Found",
          description: "Could not detect image regions. Try uploading images directly.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("PDF extraction error:", error);
      toast({
        title: "Extraction Failed",
        description: error.message || "Could not extract images from PDF",
        variant: "destructive",
      });
    } finally {
      setIsExtractingFromPdf(false);
      if (pdfForGalleryInputRef.current) {
        pdfForGalleryInputRef.current.value = "";
      }
    }
  };

  // Toggle selection of a preview image
  const togglePreviewImageSelection = (index: number) => {
    setSelectedPreviewImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Add selected images to gallery
  const addSelectedImagesToGallery = () => {
    const selectedImages = extractedPreviewImages.filter((_, i) => selectedPreviewImages.has(i));
    
    if (selectedImages.length === 0) {
      toast({
        title: "No Images Selected",
        description: "Please select at least one image to add",
        variant: "destructive",
      });
      return;
    }
    
    // Extract URLs from selected images
    const selectedUrls = selectedImages.map(img => img.url);
    
    // Find the primary image (AI-selected) or use first
    const primaryImage = selectedImages.find(img => img.isPrimary) || selectedImages[0];
    
    // If no featured image, set primary as featured
    if (!formData.featured_image && primaryImage) {
      const otherUrls = selectedUrls.filter(url => url !== primaryImage.url);
      setFormData(prev => ({
        ...prev,
        featured_image: primaryImage.url,
        gallery_images: [...prev.gallery_images, ...otherUrls]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        gallery_images: [...prev.gallery_images, ...selectedUrls]
      }));
    }
    
    toast({
      title: "Images Added",
      description: `Added ${selectedImages.length} images${primaryImage?.isPrimary ? ' (AI-selected primary as hero)' : ''}`,
    });
    
    // Close modal and reset
    setShowImagePreviewModal(false);
    setExtractedPreviewImages([]);
    setSelectedPreviewImages(new Set());
    setExtractionSummary({});
  };

  const handlePdfForGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      extractImagesFromPdfForGallery(file);
    } else if (file) {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
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

  // Sort gallery images using AI (exterior → interior → amenities)
  const sortGalleryImages = async () => {
    if (formData.gallery_images.length < 2) {
      toast({
        title: "Not enough images",
        description: "Need at least 2 images to sort",
        variant: "destructive",
      });
      return;
    }

    setIsSortingGallery(true);
    try {
      toast({
        title: "Analyzing images...",
        description: "AI is classifying and sorting your gallery",
      });

      const { data, error } = await supabase.functions.invoke('sort-project-images', {
        body: { 
          imageUrls: formData.gallery_images,
          projectName: formData.name 
        }
      });

      if (error) throw error;

      if (data?.sortedImages && Array.isArray(data.sortedImages)) {
        const sortedUrls = data.sortedImages.map((img: any) => img.url);
        
        setFormData(prev => ({
          ...prev,
          gallery_images: sortedUrls
        }));

        toast({
          title: "Gallery Sorted",
          description: `Reordered ${sortedUrls.length} images: exterior → interior → amenities`,
        });
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error: any) {
      console.error("Sort gallery error:", error);
      toast({
        title: "Sort Failed",
        description: error.message || "Could not sort images",
        variant: "destructive",
      });
    } finally {
      setIsSortingGallery(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.city || !formData.neighborhood || !formData.address) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, City, Neighborhood, Address)",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    // Auto-geocode if coordinates are missing and we have location info
    let finalLat = formData.map_lat;
    let finalLng = formData.map_lng;
    
    if (!finalLat || !finalLng) {
      const hasLocationInfo = formData.address || formData.city || formData.neighborhood;
      if (hasLocationInfo) {
        toast({
          title: "Auto-geocoding",
          description: "Finding coordinates for this project...",
        });
        
        const coords = await geocodeAddressAsync(formData.address, formData.city, formData.neighborhood);
        if (coords) {
          finalLat = coords.lat;
          finalLng = coords.lng;
          toast({
            title: "Coordinates Found",
            description: `Auto-located: ${parseFloat(coords.lat).toFixed(4)}, ${parseFloat(coords.lng).toFixed(4)}`,
          });
        }
      }
    }

    try {
      const projectData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        status: formData.status,
        city: formData.city,
        neighborhood: formData.neighborhood,
        address: formData.address || null,
        developer_id: formData.developer_id || null,
        developer_name: formData.developer_name || null,
        project_type: formData.project_type,
        unit_mix: formData.unit_mix || null,
        starting_price: formData.starting_price ? parseFloat(formData.starting_price) : null,
        deposit_structure: formData.deposit_structure || null,
        deposit_percent: formData.deposit_percent ? parseInt(formData.deposit_percent) : null,
        strata_fees: formData.strata_fees || null,
        assignment_fees: formData.assignment_fees || null,
        assignment_allowed: formData.assignment_allowed || "Unknown",
        rental_restrictions: formData.rental_restrictions || "Unknown",
        incentives: formData.incentives || null,
        incentives_available: formData.incentives_available,
        near_skytrain: formData.near_skytrain,
        map_lat: finalLat ? parseFloat(finalLat) : null,
        map_lng: finalLng ? parseFloat(finalLng) : null,
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
        video_url: formData.video_url || null,
        brochure_files: formData.brochure_files.length > 0 ? formData.brochure_files : null,
        floorplan_files: formData.floorplan_files.length > 0 ? formData.floorplan_files : null,
        pricing_sheets: formData.pricing_sheets.length > 0 ? formData.pricing_sheets : null,
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
        is_indexed: formData.is_indexed,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        show_in_hero: formData.show_in_hero,
        published_at: formData.is_published && !isEdit ? new Date().toISOString() : undefined,
      };

      let projectId = id;
      
      if (isEdit) {
        const { error } = await supabase
          .from("presale_projects")
          .update(projectData)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data: insertedProject, error } = await supabase
          .from("presale_projects")
          .insert(projectData)
          .select("id")
          .single();
        if (error) throw error;
        projectId = insertedProject?.id;
      }

      // Send social notification if project is being published
      if (formData.is_published && projectId) {
        try {
          await supabase.functions.invoke("send-social-notification", {
            body: { projectId }
          });
          console.log("Social notification sent for project:", projectId);
        } catch (notifError) {
          console.warn("Social notification failed (non-blocking):", notifError);
        }
      }

      toast({
        title: isEdit ? "Project Updated" : "Project Created",
        description: `"${formData.name}" has been ${isEdit ? "updated" : "created"}`,
      });
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

  // AI Format Description
  const formatDescriptionWithAI = async () => {
    if (!formData.full_description || formData.full_description.trim().length < 20) {
      toast({
        title: "Not enough content",
        description: "Add more description text before formatting",
        variant: "destructive",
      });
      return;
    }

    setIsFormattingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke("format-description", {
        body: {
          description: formData.full_description,
          projectContext: {
            name: formData.name,
            city: formData.city,
            neighborhood: formData.neighborhood,
          },
        },
      });

      if (error) throw error;

      if (data?.formatted) {
        setFormData(prev => ({ ...prev, full_description: data.formatted }));
        toast({
          title: "Description Formatted",
          description: "Content optimized for easy reading",
        });
      }
    } catch (error: any) {
      console.error("Format error:", error);
      toast({
        title: "Formatting Failed",
        description: error.message || "Could not format description",
        variant: "destructive",
      });
    } finally {
      setIsFormattingDescription(false);
    }
  };

  const formatShortDescriptionWithAI = async () => {
    if (!formData.short_description || formData.short_description.trim().length < 10) {
      toast({
        title: "Not enough content",
        description: "Add more short description text before formatting",
        variant: "destructive",
      });
      return;
    }

    setIsFormattingShortDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke("format-description", {
        body: {
          description: formData.short_description,
          isShortDescription: true,
          projectContext: {
            name: formData.name,
            city: formData.city,
            neighborhood: formData.neighborhood,
          },
        },
      });

      if (error) throw error;

      if (data?.formatted) {
        setFormData(prev => ({ ...prev, short_description: data.formatted }));
        toast({
          title: "Short Description Formatted",
          description: "Content optimized for card display",
        });
      }
    } catch (error: any) {
      console.error("Format error:", error);
      toast({
        title: "Formatting Failed",
        description: error.message || "Could not format short description",
        variant: "destructive",
      });
    } finally {
      setIsFormattingShortDescription(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index),
    }));
  };

  const setGalleryImageAsPrimary = (index: number) => {
    const newFeatured = formData.gallery_images[index];
    const oldFeatured = formData.featured_image;
    
    setFormData(prev => ({
      ...prev,
      featured_image: newFeatured,
      gallery_images: oldFeatured 
        ? [oldFeatured, ...prev.gallery_images.filter((_, i) => i !== index)]
        : prev.gallery_images.filter((_, i) => i !== index),
    }));
    
    toast({
      title: "Primary Image Updated",
      description: "The selected image is now the featured image",
    });
  };

  const handleBrochureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `brochures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("listing-files")
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        brochure_files: [urlData.publicUrl],
      }));

      toast({
        title: "Upload Complete",
        description: "Brochure PDF uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading brochure:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload brochure",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeBrochure = () => {
    setFormData(prev => ({
      ...prev,
      brochure_files: [],
    }));
  };

  // Extract text from PDF URL and use AI to parse project details
  const extractDetailsFromBrochure = async () => {
    const brochureUrl = formData.brochure_files[0];
    if (!brochureUrl) {
      toast({
        title: "No Brochure",
        description: "Please upload a brochure PDF first",
        variant: "destructive",
      });
      return;
    }

    // Google Drive links can't be parsed directly
    if (brochureUrl.includes('drive.google.com') || brochureUrl.includes('docs.google.com')) {
      toast({
        title: "Google Drive Not Supported",
        description: "AI extraction only works with uploaded PDFs. Please upload the PDF directly instead of using a Google Drive link.",
        variant: "destructive",
      });
      return;
    }

    setIsExtractingFromPdf(true);
    try {
      // Fetch the PDF
      const response = await fetch(brochureUrl);
      if (!response.ok) throw new Error('Failed to fetch brochure PDF');
      
      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Extract text from all pages
      let fullText = '';
      for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 20); pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += `\n--- Page ${pageNum} ---\n${pageText}`;
      }

      if (fullText.trim().length < 100) {
        toast({
          title: "Low Text Content",
          description: "The brochure appears to be mostly images. AI may not extract much data.",
          variant: "destructive",
        });
      }

      // Call the parse-project-brochure edge function
      const { data, error } = await supabase.functions.invoke('parse-project-brochure', {
        body: {
          documentText: fullText,
          documentType: 'Brochure PDF',
        }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        handleBrochureDataExtracted(data.data);
        toast({
          title: "Details Extracted",
          description: "Project information has been updated from the brochure. Please review and save.",
        });
      } else {
        throw new Error(data?.error || 'Failed to extract project data');
      }
    } catch (error: any) {
      console.error('Error extracting from brochure:', error);
      toast({
        title: "Extraction Failed",
        description: error.message || "Could not extract details from the brochure",
        variant: "destructive",
      });
    } finally {
      setIsExtractingFromPdf(false);
    }
  };

  const handleFloorplanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `floorplans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("listing-files")
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        floorplan_files: [urlData.publicUrl],
      }));

      toast({
        title: "Upload Complete",
        description: "Floorplan PDF uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading floorplan:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload floorplan",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFloorplan = () => {
    setFormData(prev => ({
      ...prev,
      floorplan_files: [],
    }));
  };

  const handlePricingSheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `pricing-sheets/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("listing-files")
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        pricing_sheets: [urlData.publicUrl],
      }));

      toast({
        title: "Upload Complete",
        description: "Pricing sheet uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading pricing sheet:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload pricing sheet",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removePricingSheet = () => {
    setFormData(prev => ({
      ...prev,
      pricing_sheets: [],
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
      <form noValidate onSubmit={handleSubmit} className="space-y-6">
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
              <h1 className="text-2xl font-bold">Edit Project</h1>
              <p className="text-muted-foreground">Update project details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Project Navigation */}
            <div className="flex items-center border rounded-lg">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => adjacentProjects.prev && navigate(`/admin/projects/${adjacentProjects.prev}/edit`)}
                disabled={!adjacentProjects.prev}
                className="rounded-r-none"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <div className="w-px h-6 bg-border" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => adjacentProjects.next && navigate(`/admin/projects/${adjacentProjects.next}/edit`)}
                disabled={!adjacentProjects.next}
                className="rounded-l-none"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
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
              Save Changes
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
                <div className="space-y-2 relative">
                  <Label htmlFor="address">Address * <span className="text-xs text-muted-foreground">(Google Maps powered)</span></Label>
                  <div className="relative">
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, address: e.target.value }));
                        fetchAddressSuggestions(e.target.value);
                      }}
                      onFocus={() => {
                        if (addressSuggestions.length > 0) setShowAddressSuggestions(true);
                      }}
                      onBlur={() => {
                        // Delay hiding to allow click on suggestions
                        setTimeout(() => setShowAddressSuggestions(false), 200);
                      }}
                      placeholder="Start typing an address..."
                      required
                      autoComplete="off"
                    />
                    {isLoadingSuggestions && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                      {addressSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-b-0"
                          onClick={() => handleSelectAddress(suggestion)}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{suggestion.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Search for an address to auto-fill coordinates and location details
                  </p>
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
                        <SelectItem value="duplex">Duplex</SelectItem>
                        <SelectItem value="single_family">Single Family Home</SelectItem>
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
                  <div className="space-y-2 relative">
                    <Label htmlFor="developer_name">Developer Name</Label>
                    <div className="relative">
                      <Input
                        ref={developerInputRef}
                        id="developer_name"
                        value={showDeveloperDropdown ? developerSearch : formData.developer_name}
                        onChange={(e) => {
                          setDeveloperSearch(e.target.value);
                          if (!showDeveloperDropdown) setShowDeveloperDropdown(true);
                        }}
                        onFocus={() => {
                          setDeveloperSearch(formData.developer_name);
                          setShowDeveloperDropdown(true);
                        }}
                        onBlur={() => {
                          // Delay to allow click on dropdown items
                          setTimeout(() => setShowDeveloperDropdown(false), 200);
                        }}
                        placeholder="Search or add developer..."
                        autoComplete="off"
                      />
                      {formData.developer_name && !showDeveloperDropdown && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, developer_name: "" }));
                            developerInputRef.current?.focus();
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {showDeveloperDropdown && (
                      <div className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                        {filteredDevelopers.length > 0 ? (
                          filteredDevelopers.slice(0, 10).map((dev) => (
                            <button
                              key={dev.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-b-0 flex items-center justify-between"
                              onClick={() => selectDeveloper(dev.id, dev.name)}
                            >
                              <span>{dev.name}</span>
                              {formData.developer_id === dev.id && (
                                <span className="text-primary text-xs">Selected</span>
                              )}
                            </button>
                          ))
                        ) : !isNewDeveloper ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No developers found
                          </div>
                        ) : null}
                        
                        {isNewDeveloper && (
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2.5 hover:bg-primary/10 text-sm border-t bg-muted/50 flex items-center gap-2 text-primary font-medium"
                            onClick={() => addNewDeveloper(developerSearch)}
                            disabled={isAddingDeveloper}
                          >
                            {isAddingDeveloper ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                            Add "{developerSearch}" as new developer
                          </button>
                        )}
                      </div>
                    )}
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
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deposit_percent">Deposit %</Label>
                    <Input
                      id="deposit_percent"
                      type="number"
                      value={formData.deposit_percent}
                      onChange={(e) => setFormData(prev => ({ ...prev, deposit_percent: e.target.value }))}
                      placeholder="e.g., 20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="strata_fees">Strata Fees (Est.)</Label>
                    <Input
                      id="strata_fees"
                      value={formData.strata_fees}
                      onChange={(e) => setFormData(prev => ({ ...prev, strata_fees: e.target.value }))}
                      placeholder="e.g., $0.45/sqft"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignment_fees">Assignment Fees</Label>
                    <Input
                      id="assignment_fees"
                      value={formData.assignment_fees}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignment_fees: e.target.value }))}
                      placeholder="e.g., $5,000 + 1%"
                    />
                  </div>
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

            {/* Investor & Decision Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Investor & Decision Filters</CardTitle>
                <CardDescription>Key decision-making data for buyers and investors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignment_allowed">Assignment Allowed</Label>
                    <select
                      id="assignment_allowed"
                      value={formData.assignment_allowed}
                      onChange={(e) => setFormData((prev) => ({ ...prev, assignment_allowed: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Limited">Limited</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rental_restrictions">Rental Restrictions</Label>
                    <select
                      id="rental_restrictions"
                      value={formData.rental_restrictions}
                      onChange={(e) => setFormData((prev) => ({ ...prev, rental_restrictions: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="None">None (No Restrictions)</option>
                      <option value="Short-term only">Short-term Only</option>
                      <option value="Minimum rental period">Minimum Rental Period</option>
                      <option value="Owner occupancy required">Owner Occupancy Required</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Switch
                      id="near_skytrain"
                      checked={formData.near_skytrain}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, near_skytrain: checked }))}
                    />
                    <Label htmlFor="near_skytrain" className="cursor-pointer">Near SkyTrain</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Switch
                      id="incentives_available"
                      checked={formData.incentives_available}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, incentives_available: checked }))}
                    />
                    <Label htmlFor="incentives_available" className="cursor-pointer">Incentives Available</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Coordinates */}
            <Card>
              <CardHeader>
                <CardTitle>Map Location</CardTitle>
                <CardDescription>Latitude and longitude for the project map pin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Address Search */}
                <div className="space-y-2 relative">
                  <Label>Search Address</Label>
                  <div className="relative">
                    <Input
                      value={formData.address}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, address: e.target.value }));
                        fetchAddressSuggestions(e.target.value);
                      }}
                      onFocus={() => {
                        if (addressSuggestions.length > 0) setShowAddressSuggestions(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowAddressSuggestions(false), 200);
                      }}
                      placeholder="Type an address to search..."
                      autoComplete="off"
                    />
                    {isLoadingSuggestions && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                      {addressSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-b-0"
                          onClick={() => handleSelectAddress(suggestion)}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{suggestion.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Search for an address - coordinates, city, and neighborhood will auto-fill
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="map_lat">Latitude</Label>
                    <Input
                      id="map_lat"
                      type="number"
                      step="any"
                      value={formData.map_lat}
                      onChange={(e) => setFormData(prev => ({ ...prev, map_lat: e.target.value }))}
                      placeholder="e.g., 49.2827"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="map_lng">Longitude</Label>
                    <Input
                      id="map_lng"
                      type="number"
                      step="any"
                      value={formData.map_lng}
                      onChange={(e) => setFormData(prev => ({ ...prev, map_lng: e.target.value }))}
                      placeholder="e.g., -123.1207"
                    />
                  </div>
                </div>
                
                {/* Interactive Map Preview */}
                {formData.map_lat && formData.map_lng && (
                  <ClickableMapPreview
                    lat={parseFloat(formData.map_lat)}
                    lng={parseFloat(formData.map_lng)}
                    onLocationChange={(lat, lng) => {
                      setFormData(prev => ({
                        ...prev,
                        map_lat: lat.toString(),
                        map_lng: lng.toString(),
                      }));
                    }}
                  />
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => geocodeAddress(formData.address, formData.city, formData.neighborhood)}
                  disabled={isGeocoding || (!formData.address && !formData.city)}
                  className="w-full"
                >
                  {isGeocoding ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  {isGeocoding ? "Finding Coordinates..." : "Get Coordinates from Address"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Or click above to auto-fetch using the address fields.
                </p>
              </CardContent>
            </Card>

            {/* Completion */}
            <Card>
              <CardHeader>
                <CardTitle>Completion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="occupancy_season">Season</Label>
                    <select
                      id="occupancy_season"
                      value={formData.occupancy_estimate.match(/\b(Spring|Summer|Fall|Winter)\b/i)?.[1] || ""}
                      onChange={(e) => {
                        const season = e.target.value;
                        const yearMatch = formData.occupancy_estimate.match(/\b(\d{4})\b/);
                        const year = yearMatch ? yearMatch[1] : "";
                        setFormData((prev) => ({
                          ...prev,
                          occupancy_estimate: season && year ? `${season} ${year}` : season || year,
                        }));
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="" disabled>
                        Select season
                      </option>
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                      <option value="Fall">Fall</option>
                      <option value="Winter">Winter</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupancy_year">Year</Label>
                    <select
                      id="occupancy_year"
                      value={formData.occupancy_estimate.match(/\b(\d{4})\b/)?.[1] || ""}
                      onChange={(e) => {
                        const year = e.target.value;
                        const seasonMatch = formData.occupancy_estimate.match(/\b(Spring|Summer|Fall|Winter)\b/i);
                        const season = seasonMatch ? seasonMatch[1] : "";
                        setFormData((prev) => ({
                          ...prev,
                          occupancy_estimate: season && year ? `${season} ${year}` : season || year,
                        }));
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="" disabled>
                        Select year
                      </option>
                      {Array.from({ length: 12 }, (_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="short_description">Short Description (for cards)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={formatShortDescriptionWithAI}
                      disabled={isFormattingShortDescription || !formData.short_description}
                      className="gap-2"
                    >
                      {isFormattingShortDescription ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {isFormattingShortDescription ? "Formatting..." : "AI Format"}
                    </Button>
                  </div>
                  <Textarea
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                    placeholder="Brief description for listing cards..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="full_description">Full Description</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={formatDescriptionWithAI}
                      disabled={isFormattingDescription || !formData.full_description}
                      className="gap-2"
                    >
                      {isFormattingDescription ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {isFormattingDescription ? "Formatting..." : "AI Format"}
                    </Button>
                  </div>
                  <Textarea
                    id="full_description"
                    value={formData.full_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_description: e.target.value }))}
                    placeholder="Detailed project description... Use **bold** for emphasis and • for bullet points"
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports markdown: **bold**, • bullet points. Click "AI Format" to optimize for readability.
                  </p>
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
                  onClick={generateSeoWithAI}
                  disabled={isGeneratingSeo || !formData.name}
                  className="gap-2"
                >
                  {isGeneratingSeo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isGeneratingSeo ? "Generating..." : "AI Generate"}
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
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show in Hero Slider</Label>
                    <p className="text-sm text-muted-foreground">Display in homepage hero background slider</p>
                  </div>
                  <Switch
                    checked={formData.show_in_hero}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, show_in_hero: v }))}
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

                {/* Extract Images from PDF */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <FileText className="h-4 w-4" />
                    Extract Images from Brochure PDF
                  </div>
                  <p className="text-xs text-blue-600">
                    Extracts embedded photos & renders (no text) - up to 7 images
                  </p>
                  <label className={`flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors ${isExtractingFromPdf ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isExtractingFromPdf ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-blue-600">Extracting images...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-blue-600">Upload PDF for images</span>
                      </>
                    )}
                    <input
                      ref={pdfForGalleryInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handlePdfForGalleryUpload}
                      disabled={isExtractingFromPdf}
                    />
                  </label>
                </div>

                {/* Existing Images */}
                {formData.gallery_images.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {formData.gallery_images.length} images
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={sortGalleryImages}
                        disabled={isSortingGallery || formData.gallery_images.length < 2}
                        className="gap-2"
                      >
                        {isSortingGallery ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        {isSortingGallery ? "Sorting..." : "Sort by Story"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {formData.gallery_images.map((img, i) => (
                        <div key={i} className="relative aspect-square group">
                          <img
                            src={img}
                            alt={`Gallery ${i + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                            {i + 1}
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg" />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="absolute bottom-1 left-1 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setGalleryImageAsPrimary(i)}
                          >
                            Set Primary
                          </Button>
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

                {/* Video URL */}
                <div className="p-3 bg-muted/30 border rounded-lg space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Video Link (YouTube / Vimeo)
                  </Label>
                  <Input
                    type="url"
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    value={formData.video_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  />
                  {/* Video Preview */}
                  {formData.video_url && (() => {
                    const url = formData.video_url;
                    let embedUrl = "";
                    
                    // YouTube
                    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                    if (ytMatch) {
                      embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
                    }
                    
                    // Vimeo (supports private videos with hash: vimeo.com/123456789/abc123)
                    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?/);
                    if (vimeoMatch) {
                      const videoId = vimeoMatch[1];
                      const hash = vimeoMatch[2];
                      embedUrl = hash 
                        ? `https://player.vimeo.com/video/${videoId}?h=${hash}`
                        : `https://player.vimeo.com/video/${videoId}`;
                    }
                    
                    if (embedUrl) {
                      return (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                          <iframe
                            src={embedUrl}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      );
                    }
                    
                    return (
                      <p className="text-xs text-amber-600">
                        ⚠️ Could not parse video URL. Supported: YouTube, Vimeo
                      </p>
                    );
                  })()}
                  {!formData.video_url && (
                    <p className="text-xs text-muted-foreground">
                      Add a YouTube or Vimeo video to showcase the project
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Brochure PDF */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Brochure PDF
                </CardTitle>
                <CardDescription>
                  Upload a PDF brochure or paste a Google Drive link that leads can access after submitting the form
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.brochure_files.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium text-sm">
                            {formData.brochure_files[0].includes('drive.google.com') ? 'Google Drive link added' : 'Brochure uploaded'}
                          </p>
                          <a 
                            href={formData.brochure_files[0]} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {formData.brochure_files[0].includes('drive.google.com') ? 'Open in Google Drive' : 'View PDF'}
                          </a>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeBrochure}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* AI Extract Details Button */}
                    {!formData.brochure_files[0].includes('drive.google.com') && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={extractDetailsFromBrochure}
                        disabled={isExtractingFromPdf}
                      >
                        {isExtractingFromPdf ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Extracting Details...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            AI Extract Project Details
                          </>
                        )}
                      </Button>
                    )}
                    {formData.brochure_files[0].includes('drive.google.com') && (
                      <p className="text-xs text-muted-foreground text-center">
                        💡 Upload a PDF directly to enable AI extraction
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* PDF Upload Option */}
                    <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload PDF brochure</span>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleBrochureUpload}
                        disabled={uploading}
                      />
                    </label>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>

                    {/* Google Drive Link Option */}
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Google Drive Link
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="url"
                          placeholder="Paste public Google Drive link..."
                          id="brochure-drive-link"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const input = document.getElementById('brochure-drive-link') as HTMLInputElement;
                            const url = input?.value?.trim();
                            if (url && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
                              setFormData(prev => ({
                                ...prev,
                                brochure_files: [url],
                              }));
                              toast({
                                title: "Link Added",
                                description: "Google Drive link saved successfully",
                              });
                            } else {
                              toast({
                                title: "Invalid Link",
                                description: "Please enter a valid Google Drive link",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Add Link
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Make sure the link is set to "Anyone with the link can view"
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Floorplan PDF */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Floorplan PDF
                </CardTitle>
                <CardDescription>
                  Upload a PDF with all unit floorplans for verified agents to access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.floorplan_files.length > 0 ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium text-sm">
                          {formData.floorplan_files[0].includes('drive.google.com') ? 'Google Drive link added' : 'Floorplan uploaded'}
                        </p>
                        <a 
                          href={formData.floorplan_files[0]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          {formData.floorplan_files[0].includes('drive.google.com') ? 'Open in Google Drive' : 'View PDF'}
                        </a>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeFloorplan}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* PDF Upload Option */}
                    <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload floorplan PDF</span>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFloorplanUpload}
                        disabled={uploading}
                      />
                    </label>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>

                    {/* Google Drive Link Option */}
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Google Drive Link
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="url"
                          placeholder="Paste public Google Drive link..."
                          id="floorplan-drive-link"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const input = document.getElementById('floorplan-drive-link') as HTMLInputElement;
                            const url = input?.value?.trim();
                            if (url && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
                              setFormData(prev => ({
                                ...prev,
                                floorplan_files: [url],
                              }));
                              toast({
                                title: "Link Added",
                                description: "Google Drive link saved successfully",
                              });
                            } else {
                              toast({
                                title: "Invalid Link",
                                description: "Please enter a valid Google Drive link",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Add Link
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Make sure the link is set to "Anyone with the link can view"
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Sheet PDF */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Pricing Sheet PDF
                </CardTitle>
                <CardDescription>
                  Upload a PDF pricing sheet or paste a Google Drive link for agents to access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.pricing_sheets.length > 0 ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium text-sm">
                          {formData.pricing_sheets[0].includes('drive.google.com') ? 'Google Drive link added' : 'Pricing sheet uploaded'}
                        </p>
                        <a 
                          href={formData.pricing_sheets[0]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          {formData.pricing_sheets[0].includes('drive.google.com') ? 'Open in Google Drive' : 'View PDF'}
                        </a>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removePricingSheet}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* PDF Upload Option */}
                    <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload pricing sheet PDF</span>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handlePricingSheetUpload}
                        disabled={uploading}
                      />
                    </label>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>

                    {/* Google Drive Link Option */}
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Google Drive Link
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="url"
                          placeholder="Paste public Google Drive link..."
                          id="pricing-drive-link"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const input = document.getElementById('pricing-drive-link') as HTMLInputElement;
                            const url = input?.value?.trim();
                            if (url && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
                              setFormData(prev => ({
                                ...prev,
                                pricing_sheets: [url],
                              }));
                              toast({
                                title: "Link Added",
                                description: "Google Drive link saved successfully",
                              });
                            } else {
                              toast({
                                title: "Invalid Link",
                                description: "Please enter a valid Google Drive link",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Add Link
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Make sure the link is set to "Anyone with the link can view"
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
      <Dialog open={showImagePreviewModal} onOpenChange={setShowImagePreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Extracted & Classified Images
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] p-1">
            {extractionSummary.primaryReason && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-foreground">AI Primary Selection:</p>
                <p className="text-sm text-muted-foreground">{extractionSummary.primaryReason}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-4">
              {selectedPreviewImages.size} of {extractedPreviewImages.length} images selected. 
              <span className="font-medium text-foreground"> AI-selected primary becomes your hero image.</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {extractedPreviewImages.map((img, index) => (
                <div
                  key={index}
                  className={`relative aspect-[4/3] cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedPreviewImages.has(index) 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-muted hover:border-muted-foreground/50'
                  }`}
                  onClick={() => togglePreviewImageSelection(index)}
                >
                  <img
                    src={img.url}
                    alt={img.altText || `Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 transition-colors ${
                    selectedPreviewImages.has(index) ? 'bg-primary/10' : 'bg-black/0 hover:bg-black/10'
                  }`} />
                  <div className="absolute top-2 left-2">
                    <Checkbox
                      checked={selectedPreviewImages.has(index)}
                      onCheckedChange={() => togglePreviewImageSelection(index)}
                      className="h-5 w-5 bg-white/90 border-2"
                    />
                  </div>
                  {img.isPrimary && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Primary
                    </div>
                  )}
                  {/* Category badge */}
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded capitalize">
                    {img.category}
                  </div>
                  {/* Quality & size badge */}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {img.width}×{img.height} • Q{img.qualityScore}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowImagePreviewModal(false);
                setExtractedPreviewImages([]);
                setSelectedPreviewImages(new Set());
                setExtractionSummary({});
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (selectedPreviewImages.size === extractedPreviewImages.length) {
                  setSelectedPreviewImages(new Set());
                } else {
                  setSelectedPreviewImages(new Set(extractedPreviewImages.map((_, i) => i)));
                }
              }}
            >
              {selectedPreviewImages.size === extractedPreviewImages.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              type="button"
              onClick={addSelectedImagesToGallery}
              disabled={selectedPreviewImages.size === 0}
            >
              Add {selectedPreviewImages.size} Image{selectedPreviewImages.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
}