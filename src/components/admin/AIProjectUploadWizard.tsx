import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { 
  Upload, 
  FileText, 
  Loader2, 
  Sparkles, 
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  FolderOpen,
  Image,
  Globe,
  Link,
  MapPin,
  Download,
  ExternalLink
} from "lucide-react";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

type ExtractedProjectData = {
  name?: string;
  slug?: string;
  status?: "coming_soon" | "registering" | "active" | "sold_out";
  developer_name?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  project_type?: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  unit_mix?: string;
  starting_price?: number;
  deposit_structure?: string;
  deposit_percent?: number;
  strata_fees?: string;
  assignment_fees?: string;
  assignment_allowed?: string;
  rental_restrictions?: string;
  incentives?: string;
  incentives_available?: boolean;
  near_skytrain?: boolean;
  completion_month?: number;
  completion_year?: number;
  occupancy_estimate?: string;
  short_description?: string;
  full_description?: string;
  highlights?: string[];
  amenities?: string[];
  faq?: { question: string; answer: string }[];
  brochure_files?: string[];
  seo_title?: string;
  seo_description?: string;
  is_indexed?: boolean;
};

type UploadedFile = {
  name: string;
  text: string;
};

type WizardStep = "upload" | "processing" | "review" | "complete";

export function AIProjectUploadWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [step, setStep] = useState<WizardStep>("upload");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data for review/edit
  const [formData, setFormData] = useState<ExtractedProjectData>({
    status: "coming_soon",
    is_indexed: true,
    incentives_available: false,
    near_skytrain: false,
    assignment_allowed: "Unknown",
    rental_restrictions: "Unknown",
  });
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  
  // Photo upload state
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string>("");
  const [brochureFiles, setBrochureFiles] = useState<string[]>([]);
  const [floorplanFiles, setFloorplanFiles] = useState<string[]>([]);
  const [driveUrl, setDriveUrl] = useState("");
  const [isImportingDrive, setIsImportingDrive] = useState(false);
  const [isFormattingDescription, setIsFormattingDescription] = useState(false);
  const brochureFileInputRef = useRef<HTMLInputElement>(null);
  const floorplanFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [extractImagesFromPDFs, setExtractImagesFromPDFs] = useState(false);
  
  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<{ description: string; placeId: string }[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapLat, setMapLat] = useState<string>("");
  const [mapLng, setMapLng] = useState<string>("");
  const [pastedContent, setPastedContent] = useState("");

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
        setShowAddressSuggestions((data.predictions || []).length > 0);
        if (data.error) {
          console.warn('Address suggestions fallback:', data.error);
        }
      }
    } catch (error) {
      console.error('Address suggestions error:', error);
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle selecting an address suggestion
  const handleSelectAddress = async (suggestion: { description: string; placeId: string }) => {
    updateFormField("address", suggestion.description);
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
    
    if (!suggestion.placeId) {
      setIsGeocoding(true);
      try {
        const { data, error } = await supabase.functions.invoke('geocode-address', {
          body: { address: suggestion.description, action: 'geocode' },
        });

        if (!error && data?.lat && data?.lng) {
          setMapLat(data.lat.toString());
          setMapLng(data.lng.toString());
          if (data.city) updateFormField("city", data.city);
          if (data.neighborhood) updateFormField("neighborhood", data.neighborhood);
        }
      } finally {
        setIsGeocoding(false);
      }
      return;
    }
    
    setIsGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: suggestion.description, action: 'placeDetails', placeId: suggestion.placeId },
      });
      
      if (!error && data && data.lat && data.lng) {
        setMapLat(data.lat.toString());
        setMapLng(data.lng.toString());
        if (data.city) updateFormField("city", data.city);
        if (data.neighborhood) updateFormField("neighborhood", data.neighborhood);
        
        toast({
          title: "Address Found",
          description: `Coordinates: ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`,
        });
      }
    } catch (error) {
      console.error('Geocoding selected address error:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n\n";
    }
    
    return fullText.trim();
  };

  // Extract HQ page screenshots from PDF and upload to storage
  const extractImagesFromPDFFunc = async (file: File): Promise<string[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const uploadedUrls: string[] = [];
    
    // Render each page at high resolution (2x scale for HQ)
    const scale = 2.0;
    
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        
        // Create canvas for rendering
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        
        // Convert canvas to blob
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/jpeg", 0.92);
        });
        
        if (!blob) continue;
        
        // Upload to Supabase storage
        const fileName = `projects/${Date.now()}-${Math.random().toString(36).substring(7)}-page${i}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from("listing-photos")
          .upload(fileName, blob, { contentType: "image/jpeg" });
        
        if (uploadError) {
          console.error(`Failed to upload page ${i}:`, uploadError);
          continue;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from("listing-photos")
          .getPublicUrl(fileName);
        
        uploadedUrls.push(publicUrl);
        console.log(`Extracted and uploaded page ${i} from ${file.name}`);
      } catch (pageErr) {
        console.error(`Error processing page ${i}:`, pageErr);
      }
    }
    
    return uploadedUrls;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const newFiles: UploadedFile[] = [];
      let extractedImages: string[] = [];
      const uploadedBrochureUrls: string[] = [];
      
      for (const file of Array.from(files)) {
        if (file.type !== "application/pdf") {
          toast({
            title: "Invalid File",
            description: `${file.name} is not a PDF file`,
            variant: "destructive",
          });
          continue;
        }

        console.log("Processing PDF:", file.name);
        
        // Upload the PDF to storage as a brochure file
        const fileExt = file.name.split(".").pop();
        const fileName = `brochures/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("listing-files")
          .upload(fileName, file);
        
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("listing-files")
            .getPublicUrl(fileName);
          
          uploadedBrochureUrls.push(urlData.publicUrl);
          console.log(`Uploaded brochure PDF: ${urlData.publicUrl}`);
        } else {
          console.error("Failed to upload brochure:", uploadError);
        }
        
        // Extract text for AI processing
        const text = await extractTextFromPDF(file);
        
        newFiles.push({
          name: file.name,
          text,
        });
        
        console.log(`Extracted ${text.length} chars from ${file.name}`);
        
        // Extract HQ page screenshots and add to gallery (if enabled)
        if (extractImagesFromPDFs) {
          toast({
            title: "Extracting Images",
            description: `Capturing HQ screenshots from ${file.name}...`,
          });
          
          const pageImages = await extractImagesFromPDFFunc(file);
          extractedImages = [...extractedImages, ...pageImages];
          
          console.log(`Extracted ${pageImages.length} page images from ${file.name}`);
        }
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Add uploaded brochure PDFs to brochure files
      if (uploadedBrochureUrls.length > 0) {
        setBrochureFiles(prev => [...prev, ...uploadedBrochureUrls]);
      }
      
      // Add extracted images to gallery
      if (extractedImages.length > 0) {
        if (!featuredImage && extractedImages.length > 0) {
          setFeaturedImage(extractedImages[0]);
          setGalleryImages(prev => [...prev, ...extractedImages.slice(1)]);
        } else {
          setGalleryImages(prev => [...prev, ...extractedImages]);
        }
      }
      
      toast({
        title: "Files Processed",
        description: `Processed ${newFiles.length} PDF(s)${uploadedBrochureUrls.length > 0 ? ', saved as brochure' : ''}, extracted ${extractedImages.length} page image(s)`,
      });

    } catch (err: any) {
      console.error("Error processing PDFs:", err);
      setError(err.message || "Failed to process PDF files");
      toast({
        title: "Upload Failed",
        description: err.message || "Could not process PDF files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const syntheticEvent = {
        target: { files }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      await handleFileUpload(syntheticEvent);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };


  const processWithAI = async () => {
    if (uploadedFiles.length === 0 && !pastedContent.trim()) {
      setError("Please upload at least one PDF file or paste some content");
      return;
    }

    setStep("processing");
    setIsProcessing(true);
    setError(null);

    try {
      // Combine all text from uploaded files
      const pdfText = uploadedFiles.length > 0
        ? uploadedFiles.map(f => `--- ${f.name} ---\n${f.text}`).join("\n\n")
        : "";
      
      // Combine PDF text with pasted content
      const combinedText = [pdfText, pastedContent.trim()]
        .filter(Boolean)
        .join("\n\n--- Pasted Content ---\n");

      console.log("Sending to AI for extraction, total length:", combinedText.length);
      
      const { data, error: fnError } = await supabase.functions.invoke('parse-project-brochure', {
        body: { 
          documentText: combinedText,
          documentType: 'brochure, pricing sheet, and website content'
        }
      });

      if (fnError) throw new Error(fnError.message || "AI processing failed");
      if (!data?.success || !data?.data) throw new Error(data?.error || "No data extracted");

      console.log("AI extracted data:", data.data);
      
      // Limit highlights and amenities to 10 each
      const limitedData = {
        ...data.data,
        highlights: data.data.highlights?.slice(0, 10),
        amenities: data.data.amenities?.slice(0, 10),
      };
      
      setFormData(limitedData);
      setStep("review");

      toast({
        title: "AI Extraction Complete",
        description: `Extracted data for: ${data.data.name || 'New Project'}`,
      });

    } catch (err: any) {
      console.error("AI processing error:", err);
      setError(err.message || "Failed to process with AI");
      setStep("upload");
      toast({
        title: "Processing Failed",
        description: err.message || "AI could not extract project data",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Image upload handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `projects/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-photos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("listing-photos")
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      // Set first as featured if none, rest as gallery
      if (!featuredImage && uploadedUrls.length > 0) {
        setFeaturedImage(uploadedUrls[0]);
        setGalleryImages(prev => [...prev, ...uploadedUrls.slice(1)]);
      } else {
        setGalleryImages(prev => [...prev, ...uploadedUrls]);
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
      setIsUploadingImages(false);
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = "";
      }
    }
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

      // Set first as featured if none, rest as gallery
      if (!featuredImage && uploadedUrls.length > 0) {
        setFeaturedImage(uploadedUrls[0]);
        setGalleryImages(prev => [...prev, ...uploadedUrls.slice(1)]);
      } else {
        setGalleryImages(prev => [...prev, ...uploadedUrls]);
      }

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

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const setGalleryImageAsPrimary = (index: number) => {
    const newFeatured = galleryImages[index];
    const oldFeatured = featuredImage;
    
    setFeaturedImage(newFeatured);
    setGalleryImages(prev => 
      oldFeatured 
        ? [oldFeatured, ...prev.filter((_, i) => i !== index)]
        : prev.filter((_, i) => i !== index)
    );
    
    toast({
      title: "Primary Image Updated",
      description: "The selected image is now the featured image",
    });
  };

  const saveProject = async () => {
    if (!formData.name || !formData.city || !formData.neighborhood) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in project name, city, and neighborhood",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const projectData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name || ""),
        status: formData.status || "coming_soon",
        city: formData.city,
        neighborhood: formData.neighborhood,
        address: formData.address || null,
        developer_name: formData.developer_name || null,
        project_type: formData.project_type || "condo",
        unit_mix: formData.unit_mix || null,
        starting_price: formData.starting_price || null,
        deposit_structure: formData.deposit_structure || null,
        deposit_percent: formData.deposit_percent || null,
        strata_fees: formData.strata_fees || null,
        assignment_fees: formData.assignment_fees || null,
        assignment_allowed: formData.assignment_allowed || "Unknown",
        rental_restrictions: formData.rental_restrictions || "Unknown",
        incentives: formData.incentives || null,
        incentives_available: formData.incentives_available || false,
        near_skytrain: formData.near_skytrain || false,
        completion_month: formData.completion_month || null,
        completion_year: formData.completion_year || null,
        occupancy_estimate: formData.occupancy_estimate || null,
        short_description: formData.short_description || null,
        full_description: formData.full_description || null,
        highlights: formData.highlights || null,
        amenities: formData.amenities || null,
        faq: formData.faq || [],
        brochure_files: brochureFiles.length > 0 ? brochureFiles : null,
        floorplan_files: floorplanFiles.length > 0 ? floorplanFiles : null,
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
        is_indexed: formData.is_indexed ?? true,
        featured_image: featuredImage || null,
        gallery_images: galleryImages.length > 0 ? galleryImages : null,
        is_published: isPublished,
        is_featured: isFeatured,
        published_at: isPublished ? new Date().toISOString() : null,
        map_lat: mapLat ? parseFloat(mapLat) : null,
        map_lng: mapLng ? parseFloat(mapLng) : null,
      };

      const { error } = await supabase
        .from("presale_projects")
        .insert(projectData);

      if (error) throw error;

      setStep("complete");
      
      toast({
        title: "Project Created!",
        description: isPublished 
          ? `"${formData.name}" is now live`
          : `"${formData.name}" saved as draft`,
      });

      // Navigate to projects list
      setTimeout(() => {
        navigate("/admin/projects");
      }, 1500);

    } catch (err: any) {
      console.error("Save error:", err);
      toast({
        title: "Save Failed",
        description: err.message || "Could not save project",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormField = (field: keyof ExtractedProjectData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addHighlight = () => {
    setFormData(prev => ({
      ...prev,
      highlights: [...(prev.highlights || []), ""]
    }));
  };

  const updateHighlight = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights?.map((h, i) => i === index ? value : h)
    }));
  };

  const removeHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights?.filter((_, i) => i !== index)
    }));
  };

  const addAmenity = () => {
    setFormData(prev => ({
      ...prev,
      amenities: [...(prev.amenities || []), ""]
    }));
  };

  const updateAmenity = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities?.map((a, i) => i === index ? value : a)
    }));
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities?.filter((_, i) => i !== index)
    }));
  };

  const addFaq = () => {
    setFormData(prev => ({
      ...prev,
      faq: [...(prev.faq || []), { question: "", answer: "" }]
    }));
  };

  const updateFaq = (index: number, field: "question" | "answer", value: string) => {
    setFormData(prev => ({
      ...prev,
      faq: prev.faq?.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeFaq = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faq: prev.faq?.filter((_, i) => i !== index)
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
        updateFormField("full_description", data.formatted);
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

  // Brochure upload handler
  const handleBrochureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    try {
      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `brochures/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("listing-files")
        .getPublicUrl(fileName);

      setBrochureFiles([urlData.publicUrl]);

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
      setIsUploadingImages(false);
      if (brochureFileInputRef.current) {
        brochureFileInputRef.current.value = "";
      }
    }
  };

  const removeBrochure = () => {
    setBrochureFiles([]);
  };

  // Floorplan upload handler
  const handleFloorplanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    try {
      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `floorplans/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("listing-files")
        .getPublicUrl(fileName);

      setFloorplanFiles([urlData.publicUrl]);

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
      setIsUploadingImages(false);
      if (floorplanFileInputRef.current) {
        floorplanFileInputRef.current.value = "";
      }
    }
  };

  const removeFloorplan = () => {
    setFloorplanFiles([]);
  };

  // Render based on current step
  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          {["upload", "processing", "review", "complete"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step === s ? "bg-primary text-primary-foreground" : 
                  ["upload", "processing", "review", "complete"].indexOf(step) > i 
                    ? "bg-success text-on-dark" 
                    : "bg-muted text-muted-foreground"}
              `}>
                {["upload", "processing", "review", "complete"].indexOf(step) > i ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div className={`w-12 h-0.5 ${
                  ["upload", "processing", "review", "complete"].indexOf(step) > i 
                    ? "bg-success" 
                    : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          {step === "upload" && "Step 1: Upload Brochures"}
          {step === "processing" && "Step 2: AI Processing"}
          {step === "review" && "Step 3: Review & Save"}
          {step === "complete" && "Complete!"}
        </div>
      </div>

      {/* Step 1: Upload PDFs */}
      {step === "upload" && (
        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              AI-Powered Project Upload
            </CardTitle>
            <CardDescription className="text-base">
              Upload brochures and info sheets. AI will extract all project details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* PDF Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-primary/5"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              {isUploading ? (
                <div className="space-y-2">
                  <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                  <p className="text-sm font-medium">Processing PDFs...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto text-primary mb-3" />
                  <p className="text-lg font-medium">Drop PDF files here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload brochures, pricing sheets, and info documents
                  </p>
                </>
              )}
            </div>

            {/* Extract Images Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
              <div className="space-y-0.5">
                <Label htmlFor="extract-images" className="text-sm font-medium cursor-pointer">
                  Extract Images from PDFs
                </Label>
                <p className="text-xs text-muted-foreground">
                  Capture HQ page screenshots and add to gallery (slower processing)
                </p>
              </div>
              <Switch
                id="extract-images"
                checked={extractImagesFromPDFs}
                onCheckedChange={setExtractImagesFromPDFs}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Uploaded Documents</Label>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                    >
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.text.length.toLocaleString()} characters extracted
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Content Paste */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground px-2">OR paste content manually</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              
              <Textarea
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                placeholder="Paste project details from developer websites, emails, or other sources here..."
                className="min-h-[120px] resize-y"
              />
              
              {pastedContent.trim() && (
                <p className="text-xs text-muted-foreground">
                  {pastedContent.length.toLocaleString()} characters pasted
                </p>
              )}
            </div>

            {/* Action Button */}
            <Button 
              onClick={processWithAI}
              disabled={(uploadedFiles.length === 0 && !pastedContent.trim()) || isUploading}
              size="lg"
              className="w-full"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Extract Project Details with AI
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Processing */}
      {step === "processing" && (
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-6" />
            <h3 className="text-xl font-semibold mb-2">AI is analyzing your documents...</h3>
            <p className="text-muted-foreground">
              Extracting project name, pricing, amenities, and more
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === "review" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Review Extracted Data</h2>
              <p className="text-muted-foreground">
                Edit fields and add photos before saving
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setStep("upload")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content - Left 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Core Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Core Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Project Name *</Label>
                      <Input
                        value={formData.name || ""}
                        onChange={(e) => {
                          const name = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            name,
                            slug: prev.slug || generateSlug(name)
                          }));
                        }}
                        placeholder="e.g., The Park Residences"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL Slug</Label>
                      <Input
                        value={formData.slug || ""}
                        onChange={(e) => updateFormField("slug", e.target.value)}
                        placeholder="auto-generated-from-name"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Developer</Label>
                      <Input
                        value={formData.developer_name || ""}
                        onChange={(e) => updateFormField("developer_name", e.target.value)}
                        placeholder="e.g., Concord Pacific"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status || "coming_soon"}
                        onValueChange={(v) => updateFormField("status", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coming_soon">Coming Soon</SelectItem>
                          <SelectItem value="registering">Registering</SelectItem>
                          <SelectItem value="active">Selling Now</SelectItem>
                          <SelectItem value="sold_out">Sold Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City *</Label>
                      <Input
                        value={formData.city || ""}
                        onChange={(e) => updateFormField("city", e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Neighborhood *</Label>
                      <Input
                        value={formData.neighborhood || ""}
                        onChange={(e) => updateFormField("neighborhood", e.target.value)}
                        placeholder="Neighborhood"
                      />
                    </div>
                    <div className="space-y-2 relative">
                      <Label>Address <span className="text-xs text-muted-foreground">(Google Maps powered)</span></Label>
                      <div className="relative">
                        <Input
                          value={formData.address || ""}
                          onChange={(e) => {
                            updateFormField("address", e.target.value);
                            fetchAddressSuggestions(e.target.value);
                          }}
                          onFocus={() => {
                            if (addressSuggestions.length > 0) setShowAddressSuggestions(true);
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowAddressSuggestions(false), 200);
                          }}
                          placeholder="Start typing an address..."
                          autoComplete="off"
                        />
                        {(isLoadingSuggestions || isGeocoding) && (
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
                      {mapLat && mapLng && (
                        <p className="text-xs text-success">
                          ✓ Coordinates: {parseFloat(mapLat).toFixed(5)}, {parseFloat(mapLng).toFixed(5)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Project Type</Label>
                      <Select
                        value={formData.project_type || "condo"}
                        onValueChange={(v) => updateFormField("project_type", v)}
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
                    <div className="space-y-2">
                      <Label>Unit Mix</Label>
                      <Input
                        value={formData.unit_mix || ""}
                        onChange={(e) => updateFormField("unit_mix", e.target.value)}
                        placeholder="e.g., Studios to 3BR"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Deposits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Starting Price</Label>
                      <Input
                        type="number"
                        value={formData.starting_price || ""}
                        onChange={(e) => updateFormField("starting_price", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="e.g., 499000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Deposit %</Label>
                      <Input
                        type="number"
                        value={formData.deposit_percent || ""}
                        onChange={(e) => updateFormField("deposit_percent", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="e.g., 15"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Deposit Structure</Label>
                    <Textarea
                      value={formData.deposit_structure || ""}
                      onChange={(e) => updateFormField("deposit_structure", e.target.value)}
                      placeholder="e.g., 5% on signing, 5% in 90 days..."
                      rows={2}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Strata Fees</Label>
                      <Input
                        value={formData.strata_fees || ""}
                        onChange={(e) => updateFormField("strata_fees", e.target.value)}
                        placeholder="e.g., $0.45/sqft/month"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Assignment Fees</Label>
                      <Input
                        value={formData.assignment_fees || ""}
                        onChange={(e) => updateFormField("assignment_fees", e.target.value)}
                        placeholder="e.g., $5,000"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Assignment Allowed</Label>
                      <Select
                        value={formData.assignment_allowed || "Unknown"}
                        onValueChange={(v) => updateFormField("assignment_allowed", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Rental Restrictions</Label>
                      <Select
                        value={formData.rental_restrictions || "Unknown"}
                        onValueChange={(v) => updateFormField("rental_restrictions", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="None">No Restrictions</SelectItem>
                          <SelectItem value="1 Year">1 Year Minimum</SelectItem>
                          <SelectItem value="2 Years">2 Years Minimum</SelectItem>
                          <SelectItem value="No Rentals">No Rentals Allowed</SelectItem>
                          <SelectItem value="Unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Incentives</Label>
                    <Textarea
                      value={formData.incentives || ""}
                      onChange={(e) => updateFormField("incentives", e.target.value)}
                      placeholder="Current promotions or incentives"
                      rows={2}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-3 border rounded-lg p-3">
                      <Switch
                        checked={formData.incentives_available || false}
                        onCheckedChange={(v) => updateFormField("incentives_available", v)}
                      />
                      <Label className="cursor-pointer">Incentives Available</Label>
                    </div>
                    <div className="flex items-center gap-3 border rounded-lg p-3">
                      <Switch
                        checked={formData.near_skytrain || false}
                        onCheckedChange={(v) => updateFormField("near_skytrain", v)}
                      />
                      <Label className="cursor-pointer">Near SkyTrain</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Completion Month</Label>
                      <Select
                        value={formData.completion_month?.toString() || ""}
                        onValueChange={(v) => updateFormField("completion_month", v ? Number(v) : undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Completion Year</Label>
                      <Select
                        value={formData.completion_year?.toString() || ""}
                        onValueChange={(v) => updateFormField("completion_year", v ? Number(v) : undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => (
                            <SelectItem key={i} value={(2025 + i).toString()}>
                              {2025 + i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Occupancy Estimate</Label>
                      <Input
                        value={formData.occupancy_estimate || ""}
                        onChange={(e) => updateFormField("occupancy_estimate", e.target.value)}
                        placeholder="e.g., Fall 2027"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Descriptions */}
              <Card>
                <CardHeader>
                  <CardTitle>Descriptions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Textarea
                      value={formData.short_description || ""}
                      onChange={(e) => updateFormField("short_description", e.target.value)}
                      placeholder="Brief summary for cards and previews"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Full Description</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={formatDescriptionWithAI}
                        disabled={isFormattingDescription || !formData.full_description?.trim()}
                      >
                        {isFormattingDescription ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-1" />
                        )}
                        AI Format
                      </Button>
                    </div>
                    <Textarea
                      value={formData.full_description || ""}
                      onChange={(e) => updateFormField("full_description", e.target.value)}
                      placeholder="Detailed project description"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Highlights */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Highlights</CardTitle>
                  <Button size="sm" variant="outline" onClick={addHighlight}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </CardHeader>
                <CardContent>
                  {formData.highlights && formData.highlights.length > 0 ? (
                    <div className="space-y-2">
                      {formData.highlights.map((highlight, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={highlight}
                            onChange={(e) => updateHighlight(index, e.target.value)}
                            placeholder="Enter highlight"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeHighlight(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No highlights yet. Click "Add" to add one.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Amenities */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Amenities</CardTitle>
                  <Button size="sm" variant="outline" onClick={addAmenity}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </CardHeader>
                <CardContent>
                  {formData.amenities && formData.amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.amenities.map((amenity, index) => (
                        <Badge key={index} variant="secondary" className="gap-1 pr-1">
                          <Input
                            value={amenity}
                            onChange={(e) => updateAmenity(index, e.target.value)}
                            className="h-6 w-32 border-0 bg-transparent p-0 text-xs"
                            placeholder="Amenity"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 p-0"
                            onClick={() => removeAmenity(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No amenities yet. Click "Add" to add one.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>FAQ</CardTitle>
                  <Button size="sm" variant="outline" onClick={addFaq}>
                    <Plus className="h-4 w-4 mr-1" /> Add FAQ
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.faq && formData.faq.length > 0 ? (
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
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No FAQ items yet. Click "Add FAQ" to get started.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* SEO Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>SEO Title</Label>
                    <Input
                      value={formData.seo_title || ""}
                      onChange={(e) => updateFormField("seo_title", e.target.value)}
                      placeholder="Leave blank to use project name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SEO Description</Label>
                    <Textarea
                      value={formData.seo_description || ""}
                      onChange={(e) => updateFormField("seo_description", e.target.value)}
                      placeholder="Meta description for search engines..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Index in Search Engines</Label>
                      <p className="text-xs text-muted-foreground">Allow search engines to index this page</p>
                    </div>
                    <Switch
                      checked={formData.is_indexed ?? true}
                      onCheckedChange={(v) => updateFormField("is_indexed", v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Right column */}
            <div className="space-y-6">
              {/* Publishing Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Publishing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Publish Immediately</Label>
                      <p className="text-xs text-muted-foreground">Make visible on website</p>
                    </div>
                    <Switch
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Featured Project</Label>
                      <p className="text-xs text-muted-foreground">Show on homepage</p>
                    </div>
                    <Switch
                      checked={isFeatured}
                      onCheckedChange={setIsFeatured}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Featured Image */}
              <Card>
                <CardHeader>
                  <CardTitle>Featured Image</CardTitle>
                </CardHeader>
                <CardContent>
                  {featuredImage ? (
                    <div className="relative">
                      <img
                        src={featuredImage}
                        alt="Featured"
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setFeaturedImage("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Upload images below - first one becomes featured
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Gallery Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Gallery Images</CardTitle>
                  <CardDescription>
                    {galleryImages.length + (featuredImage ? 1 : 0)} images
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
                  {galleryImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {galleryImages.map((img, i) => (
                        <div key={i} className="relative aspect-square group">
                          <img
                            src={img}
                            alt={`Gallery ${i + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/40 transition-colors rounded-lg" />
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
                            className="absolute top-1 right-1 h-5 w-5"
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
                      {isUploadingImages ? "Uploading..." : "Drop or click to upload"}
                    </span>
                    <input
                      ref={imageFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploadingImages}
                    />
                  </label>
                </CardContent>
              </Card>

              {/* Brochure PDF */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Brochure PDF
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {brochureFiles.length > 0 ? (
                    <div className="space-y-2">
                      {brochureFiles.map((url, index) => {
                        const fileName = decodeURIComponent(url.split('/').pop() || 'brochure.pdf');
                        const displayName = fileName.length > 30 
                          ? fileName.substring(0, 27) + '...' + fileName.slice(-7) 
                          : fileName;
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="p-2 bg-primary/10 rounded">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate" title={fileName}>
                                  {displayName}
                                </p>
                                <p className="text-xs text-muted-foreground">PDF Brochure</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8"
                              >
                                <a href={url} target="_blank" rel="noopener noreferrer" title="Open in new tab">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8"
                              >
                                <a href={url} download title="Download">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={removeBrochure}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-sm text-muted-foreground">Upload brochure PDF</span>
                      <input
                        ref={brochureFileInputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleBrochureUpload}
                      />
                    </label>
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
                    Upload a PDF with all unit floorplans for verified agents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {floorplanFiles.length > 0 ? (
                    <div className="space-y-2">
                      {floorplanFiles.map((url, index) => {
                        const fileName = decodeURIComponent(url.split('/').pop() || 'floorplan.pdf');
                        const displayName = fileName.length > 30 
                          ? fileName.substring(0, 27) + '...' + fileName.slice(-7) 
                          : fileName;
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="p-2 bg-primary/10 rounded">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate" title={fileName}>
                                  {displayName}
                                </p>
                                <p className="text-xs text-muted-foreground">PDF Floorplan</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8"
                              >
                                <a href={url} target="_blank" rel="noopener noreferrer" title="Open in new tab">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8"
                              >
                                <a href={url} download title="Download">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={removeFloorplan}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-sm text-muted-foreground">Upload floorplan PDF</span>
                      <input
                        ref={floorplanFileInputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFloorplanUpload}
                      />
                    </label>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button 
                onClick={saveProject}
                disabled={isSaving || !formData.name || !formData.city || !formData.neighborhood}
                size="lg"
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Project
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-success mb-6" />
            <h3 className="text-xl font-semibold mb-2">Project Created!</h3>
            <p className="text-muted-foreground mb-6">
              Redirecting to projects list...
            </p>
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
