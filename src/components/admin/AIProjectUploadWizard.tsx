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
  Trash2
} from "lucide-react";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

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
};

type WizardStep = "upload" | "processing" | "review" | "complete";

export function AIProjectUploadWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [step, setStep] = useState<WizardStep>("upload");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form data for review/edit
  const [formData, setFormData] = useState<ExtractedProjectData>({});
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

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
        const text = await extractTextFromPDF(file);
        
        newFiles.push({
          name: file.name,
          text,
        });
        
        console.log(`Extracted ${text.length} chars from ${file.name}`);
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
        is_published: isPublished,
        is_featured: isFeatured,
        published_at: isPublished ? new Date().toISOString() : null,
      };

      const { data: insertedProject, error } = await supabase
        .from("presale_projects")
        .insert(projectData)
        .select()
        .single();

      if (error) throw error;

      setStep("complete");
      
      toast({
        title: "Project Created!",
        description: `"${formData.name}" saved. Now add photos on the next page.`,
      });

      // Navigate to edit page to add photos
      setTimeout(() => {
        navigate(`/admin/projects/${insertedProject.id}`);
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

            {/* Action Button */}
            <Button 
              onClick={processWithAI}
              disabled={uploadedFiles.length === 0 || isUploading}
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
                Edit any fields, then save. You'll add photos on the next page.
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
                    onChange={(e) => updateFormField("name", e.target.value)}
                    placeholder="Project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Developer</Label>
                  <Input
                    value={formData.developer_name || ""}
                    onChange={(e) => updateFormField("developer_name", e.target.value)}
                    placeholder="Developer name"
                  />
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
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address || ""}
                    onChange={(e) => updateFormField("address", e.target.value)}
                    placeholder="Street address"
                  />
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
                  <Label>Price Range</Label>
                  <Input
                    value={formData.price_range || ""}
                    onChange={(e) => updateFormField("price_range", e.target.value)}
                    placeholder="e.g., $499K - $899K"
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

              <div className="space-y-2">
                <Label>Incentives</Label>
                <Textarea
                  value={formData.incentives || ""}
                  onChange={(e) => updateFormField("incentives", e.target.value)}
                  placeholder="Current promotions or incentives"
                  rows={2}
                />
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
                <Label>Full Description</Label>
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

          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Publish Immediately</Label>
                  <p className="text-sm text-muted-foreground">Make visible on the website</p>
                </div>
                <Switch
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Featured Project</Label>
                  <p className="text-sm text-muted-foreground">Show on homepage</p>
                </div>
                <Switch
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
              </div>
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
                Save Project & Add Photos
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-6" />
            <h3 className="text-xl font-semibold mb-2">Project Created!</h3>
            <p className="text-muted-foreground mb-6">
              Redirecting to add photos...
            </p>
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
