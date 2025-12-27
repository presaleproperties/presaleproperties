import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  FileIcon,
  ImageIcon,
  ArrowRight,
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  Link,
  FolderOpen,
  Wand2,
  GripVertical
} from "lucide-react";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

type ExtractedImage = {
  dataUrl: string;
  width: number;
  height: number;
};

type ExtractedProjectData = {
  name?: string;
  developer_name?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  project_type?: "condo" | "townhome" | "mixed";
  unit_mix?: string;
  starting_price?: number;
  price_range?: string;
  deposit_structure?: string;
  incentives?: string;
  completion_month?: number;
  completion_year?: number;
  occupancy_estimate?: string;
  short_description?: string;
  full_description?: string;
  highlights?: string[];
  amenities?: string[];
  faq?: { question: string; answer: string }[];
};

type UploadedFile = {
  name: string;
  text: string;
  images: ExtractedImage[];
};

type WizardStep = "upload" | "processing" | "review" | "complete";

export function AIProjectUploadWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isSortingImages, setIsSortingImages] = useState(false);
  const [isAddingDriveUrl, setIsAddingDriveUrl] = useState(false);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // State
  const [step, setStep] = useState<WizardStep>("upload");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedProjectData | null>(null);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Form data for review/edit
  const [formData, setFormData] = useState<ExtractedProjectData>({});
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  const extractTextFromPDF = async (file: File): Promise<{ text: string; images: ExtractedImage[] }> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = "";
    const images: ExtractedImage[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      
      // Extract text
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n\n";
      
      // Extract images from page
      try {
        const ops = await page.getOperatorList();
        const imgKeys = ops.fnArray
          .map((fn: number, idx: number) => fn === pdfjsLib.OPS.paintImageXObject ? ops.argsArray[idx][0] : null)
          .filter(Boolean);
        
        for (const imgKey of imgKeys) {
          try {
            const img = await page.objs.get(imgKey);
            if (img && img.data && img.width > 100 && img.height > 100) {
              // Create canvas to render image
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              
              if (ctx && img.data) {
                const imgData = ctx.createImageData(img.width, img.height);
                
                // Handle different image formats
                if (img.data.length === img.width * img.height * 4) {
                  imgData.data.set(img.data);
                } else if (img.data.length === img.width * img.height * 3) {
                  // RGB to RGBA
                  for (let j = 0; j < img.width * img.height; j++) {
                    imgData.data[j * 4] = img.data[j * 3];
                    imgData.data[j * 4 + 1] = img.data[j * 3 + 1];
                    imgData.data[j * 4 + 2] = img.data[j * 3 + 2];
                    imgData.data[j * 4 + 3] = 255;
                  }
                }
                
                ctx.putImageData(imgData, 0, 0);
                images.push({
                  dataUrl: canvas.toDataURL("image/jpeg", 0.85),
                  width: img.width,
                  height: img.height,
                });
              }
            }
          } catch (imgErr) {
            // Skip problematic images
            console.warn("Could not extract image:", imgErr);
          }
        }
      } catch (opsErr) {
        console.warn("Could not get operator list for page", i, opsErr);
      }
    }
    
    return { text: fullText.trim(), images };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const newFiles: UploadedFile[] = [];
      
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
        const { text, images } = await extractTextFromPDF(file);
        
        newFiles.push({
          name: file.name,
          text,
          images,
        });
        
        console.log(`Extracted ${text.length} chars and ${images.length} images from ${file.name}`);
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      toast({
        title: "Files Uploaded",
        description: `Processed ${newFiles.length} PDF file(s)`,
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
    if (uploadedFiles.length === 0) {
      setError("Please upload at least one PDF file");
      return;
    }

    setStep("processing");
    setIsProcessing(true);
    setError(null);

    try {
      // Combine all text from uploaded files
      const combinedText = uploadedFiles
        .map(f => `--- ${f.name} ---\n${f.text}`)
        .join("\n\n");
      
      // Collect all images
      const allImages = uploadedFiles.flatMap(f => f.images.map(img => img.dataUrl));
      setExtractedImages(allImages);
      setSelectedImages(allImages.slice(0, 10)); // Pre-select first 10

      console.log("Sending to AI for extraction, text length:", combinedText.length);
      
      const { data, error: fnError } = await supabase.functions.invoke('parse-project-brochure', {
        body: { 
          documentText: combinedText,
          documentType: 'brochure and pricing sheet'
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
      
      setExtractedData(limitedData);
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

  const uploadImagesToStorage = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < selectedImages.length; i++) {
      const dataUrl = selectedImages[i];
      
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const fileName = `projects/${Date.now()}-${i}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from("listing-photos")
        .upload(fileName, blob, { contentType: "image/jpeg" });
      
      if (uploadError) {
        console.error("Image upload error:", uploadError);
        continue;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from("listing-photos")
        .getPublicUrl(fileName);
      
      uploadedUrls.push(publicUrl);
    }
    
    return uploadedUrls;
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
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
      // Upload selected images to storage
      console.log("Uploading images to storage...");
      const imageUrls = await uploadImagesToStorage();
      console.log("Uploaded", imageUrls.length, "images");

      const projectData = {
        name: formData.name,
        slug: generateSlug(formData.name || ""),
        status: "coming_soon" as const,
        city: formData.city,
        neighborhood: formData.neighborhood,
        address: formData.address || null,
        developer_name: formData.developer_name || null,
        project_type: formData.project_type || "condo",
        unit_mix: formData.unit_mix || null,
        starting_price: formData.starting_price || null,
        price_range: formData.price_range || null,
        deposit_structure: formData.deposit_structure || null,
        incentives: formData.incentives || null,
        completion_month: formData.completion_month || null,
        completion_year: formData.completion_year || null,
        occupancy_estimate: formData.occupancy_estimate || null,
        short_description: formData.short_description || null,
        full_description: formData.full_description || null,
        highlights: formData.highlights || null,
        amenities: formData.amenities || null,
        faq: formData.faq || [],
        featured_image: imageUrls[0] || null,
        gallery_images: imageUrls.length > 1 ? imageUrls.slice(1) : null,
        is_published: isPublished,
        is_featured: isFeatured,
        published_at: isPublished ? new Date().toISOString() : null,
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

  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages(prev => 
      prev.includes(imageUrl)
        ? prev.filter(url => url !== imageUrl)
        : [...prev, imageUrl]
    );
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    
    // Validate URL
    try {
      new URL(imageUrlInput);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive",
      });
      return;
    }

    // Add to both extracted and selected images
    setExtractedImages(prev => [...prev, imageUrlInput]);
    setSelectedImages(prev => [...prev, imageUrlInput]);
    setImageUrlInput("");
    setIsAddingUrl(false);
    
    toast({
      title: "Image Added",
      description: "Image URL added to gallery",
    });
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: `${file.name} is not an image`,
          variant: "destructive",
        });
        continue;
      }

      // Convert to data URL
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setExtractedImages(prev => [...prev, dataUrl]);
        setSelectedImages(prev => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    }

    toast({
      title: "Images Added",
      description: `Added ${files.length} image(s) to gallery`,
    });

    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = "";
    }
  };

  const removeImage = (imageUrl: string) => {
    setExtractedImages(prev => prev.filter(url => url !== imageUrl));
    setSelectedImages(prev => prev.filter(url => url !== imageUrl));
  };

  const extractDriveFileId = (url: string): string | null => {
    // Handle various Google Drive URL formats
    const patterns = [
      /\/d\/([a-zA-Z0-9_-]+)/,  // /d/FILE_ID
      /id=([a-zA-Z0-9_-]+)/,    // id=FILE_ID
      /\/folders\/([a-zA-Z0-9_-]+)/, // /folders/FOLDER_ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleAddDriveImages = async () => {
    if (!driveUrl.trim()) return;

    const fileId = extractDriveFileId(driveUrl);
    if (!fileId) {
      toast({
        title: "Invalid Drive URL",
        description: "Please enter a valid Google Drive share link",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingDrive(true);

    try {
      // For publicly shared images, construct direct URL
      // This works for images shared with "Anyone with the link"
      const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      
      // Test if it's accessible
      const testResponse = await fetch(directUrl, { method: 'HEAD', mode: 'no-cors' });
      
      // Add to images
      setExtractedImages(prev => [...prev, directUrl]);
      setSelectedImages(prev => [...prev, directUrl]);
      setDriveUrl("");
      setIsAddingDriveUrl(false);

      toast({
        title: "Image Added",
        description: "Google Drive image added to gallery",
      });
    } catch (err) {
      toast({
        title: "Could not load image",
        description: "Make sure the file is publicly shared",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleAISortImages = async () => {
    if (selectedImages.length < 2) {
      toast({
        title: "Not enough images",
        description: "Add at least 2 images to sort",
        variant: "destructive",
      });
      return;
    }

    setIsSortingImages(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('sort-project-images', {
        body: { 
          imageUrls: selectedImages,
          projectName: formData.name
        }
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to sort images');

      // Reorder selected images based on AI sorting
      const sortedUrls = data.sortedImages.map((img: any) => img.url);
      setSelectedImages(sortedUrls);

      toast({
        title: "Images Sorted",
        description: `AI organized ${sortedUrls.length} images. Best hero image is now first.`,
      });

    } catch (err: any) {
      console.error('AI sort error:', err);
      toast({
        title: "Sort Failed",
        description: err.message || "Could not sort images with AI",
        variant: "destructive",
      });
    } finally {
      setIsSortingImages(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, imageUrl: string) => {
    setDraggedImage(imageUrl);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', imageUrl);
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
    setDragOverIndex(null);
  };

  const handleDragOverImage = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDropOnImage = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedImage) return;
    
    const draggedIndex = selectedImages.indexOf(draggedImage);
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedImage(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder the selected images
    const newSelectedImages = [...selectedImages];
    newSelectedImages.splice(draggedIndex, 1);
    newSelectedImages.splice(targetIndex, 0, draggedImage);
    setSelectedImages(newSelectedImages);

    setDraggedImage(null);
    setDragOverIndex(null);
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
                    ? "bg-green-500 text-white" 
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
                    ? "bg-green-500" 
                    : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          {step === "upload" && "Step 1: Upload Documents"}
          {step === "processing" && "Step 2: AI Processing"}
          {step === "review" && "Step 3: Review & Approve"}
          {step === "complete" && "Complete!"}
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Powered Project Upload
            </CardTitle>
            <CardDescription>
              Upload your project brochure and pricing sheet. AI will extract all details and images automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
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
                <div className="space-y-3">
                  <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                  <p className="font-medium">Processing PDFs...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Drop PDF files here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload brochure, pricing sheet, or any project documents
                  </p>
                </>
              )}
            </div>

            {/* Uploaded files list */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <Label>Uploaded Documents ({uploadedFiles.length})</Label>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.text.length.toLocaleString()} chars • {file.images.length} images
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button 
              onClick={processWithAI}
              disabled={uploadedFiles.length === 0 || isUploading}
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Extract Data with AI
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Processing */}
      {step === "processing" && (
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-6" />
            <h2 className="text-xl font-semibold mb-2">AI is Analyzing Your Documents</h2>
            <p className="text-muted-foreground">
              Extracting project details, pricing, amenities, and images...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === "review" && formData && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Review and edit the AI-extracted information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project Name *</Label>
                    <Input
                      value={formData.name || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Developer</Label>
                    <Input
                      value={formData.developer_name || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, developer_name: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input
                      value={formData.city || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Neighborhood *</Label>
                    <Input
                      value={formData.neighborhood || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project Type</Label>
                    <Select
                      value={formData.project_type || "condo"}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, project_type: v as any }))}
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
                  <div className="space-y-2">
                    <Label>Unit Mix</Label>
                    <Input
                      value={formData.unit_mix || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit_mix: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Starting Price</Label>
                    <Input
                      type="number"
                      value={formData.starting_price || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, starting_price: parseFloat(e.target.value) || undefined }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price Range</Label>
                    <Input
                      value={formData.price_range || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_range: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Completion Year</Label>
                    <Input
                      type="number"
                      value={formData.completion_year || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, completion_year: parseInt(e.target.value) || undefined }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Deposit Structure</Label>
                    <Input
                      value={formData.deposit_structure || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, deposit_structure: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Incentives</Label>
                  <Textarea
                    value={formData.incentives || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, incentives: e.target.value }))}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Short Description</Label>
                  <Textarea
                    value={formData.short_description || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Full Description</Label>
                  <Textarea
                    value={formData.full_description || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_description: e.target.value }))}
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Highlights & Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Highlights</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.highlights?.map((h, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {h}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            highlights: prev.highlights?.filter((_, idx) => idx !== i)
                          }))}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Amenities</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities?.map((a, i) => (
                      <Badge key={i} variant="outline" className="gap-1">
                        {a}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            amenities: prev.amenities?.filter((_, idx) => idx !== i)
                          }))}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Gallery Images
                </CardTitle>
                <CardDescription>
                  Select images to include ({selectedImages.length} selected)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Image Options */}
                <div className="space-y-2">
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                  
                  {isAddingUrl ? (
                    <div className="flex gap-2">
                      <Input
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        onKeyDown={(e) => e.key === "Enter" && handleAddImageUrl()}
                      />
                      <Button size="icon" onClick={handleAddImageUrl}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { setIsAddingUrl(false); setImageUrlInput(""); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : isAddingDriveUrl ? (
                    <div className="flex gap-2">
                      <Input
                        value={driveUrl}
                        onChange={(e) => setDriveUrl(e.target.value)}
                        placeholder="Google Drive share link..."
                        onKeyDown={(e) => e.key === "Enter" && handleAddDriveImages()}
                        disabled={isLoadingDrive}
                      />
                      <Button size="icon" onClick={handleAddDriveImages} disabled={isLoadingDrive}>
                        {isLoadingDrive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { setIsAddingDriveUrl(false); setDriveUrl(""); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => imageFileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setIsAddingUrl(true)}
                        >
                          <Link className="h-4 w-4 mr-1" />
                          URL
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setIsAddingDriveUrl(true)}
                        >
                          <FolderOpen className="h-4 w-4 mr-1" />
                          Drive
                        </Button>
                      </div>
                      {selectedImages.length >= 2 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={handleAISortImages}
                          disabled={isSortingImages}
                        >
                          {isSortingImages ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Wand2 className="h-4 w-4 mr-1" />
                          )}
                          AI Sort & Organize
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected images - draggable order */}
                {selectedImages.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Selected Order (drag to reorder)</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedImages.map((img, i) => (
                        <div
                          key={`selected-${i}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, img)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOverImage(e, i)}
                          onDrop={(e) => handleDropOnImage(e, i)}
                          className={`relative w-14 h-14 rounded-md overflow-hidden cursor-grab active:cursor-grabbing border-2 transition-all ${
                            draggedImage === img ? "opacity-50 scale-95" : ""
                          } ${dragOverIndex === i && draggedImage !== img ? "border-primary ring-2 ring-primary/30" : "border-muted"}`}
                        >
                          <img src={img} alt={`Order ${i + 1}`} className="w-full h-full object-cover" />
                          {i === 0 && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-primary-foreground bg-primary/90 px-1 rounded">Hero</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 right-0 bg-background/80 text-[10px] px-1 font-medium">
                            {i + 1}
                          </div>
                          <GripVertical className="absolute top-0.5 left-0.5 h-3 w-3 text-white drop-shadow-md" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <ScrollArea className="h-[280px]">
                  <Label className="text-xs text-muted-foreground mb-2 block">All Images (click to select)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {extractedImages.map((img, i) => (
                      <div 
                        key={i}
                        className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImages.includes(img) 
                            ? "border-primary ring-2 ring-primary/20" 
                            : "border-transparent hover:border-muted-foreground/25"
                        }`}
                        onClick={() => toggleImageSelection(img)}
                      >
                        <img 
                          src={img} 
                          alt={`Image ${i + 1}`}
                          className="w-full aspect-square object-cover"
                        />
                        {selectedImages.includes(img) && (
                          <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}
                        {selectedImages.indexOf(img) === 0 && selectedImages.includes(img) && (
                          <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground text-xs text-center py-0.5">
                            Featured
                          </div>
                        )}
                        <button
                          type="button"
                          className="absolute top-1 left-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); removeImage(img); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Publish Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Publish Immediately</Label>
                    <p className="text-xs text-muted-foreground">Make visible on site</p>
                  </div>
                  <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Featured Project</Label>
                    <p className="text-xs text-muted-foreground">Show on homepage</p>
                  </div>
                  <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button 
                onClick={saveProject}
                disabled={isSaving}
                className="w-full"
                size="lg"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                {isPublished ? "Approve & Publish" : "Save as Draft"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setStep("upload")}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Upload
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-6" />
            <h2 className="text-2xl font-semibold mb-2">Project Created Successfully!</h2>
            <p className="text-muted-foreground mb-6">
              {isPublished 
                ? `"${formData.name}" is now live on your site.`
                : `"${formData.name}" has been saved as a draft.`}
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => navigate("/admin/projects")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
              {isPublished && formData.name && (
                <Button 
                  variant="outline"
                  onClick={() => window.open(`/presale-projects/${generateSlug(formData.name || "")}`, "_blank")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Project
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setUploadedFiles([]);
                  setExtractedData(null);
                  setFormData({});
                  setExtractedImages([]);
                  setSelectedImages([]);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
