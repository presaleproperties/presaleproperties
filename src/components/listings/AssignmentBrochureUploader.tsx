import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  File as FileIcon,
  Wand2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
try {
  pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(pdfjsWorkerUrl, { type: "module" });
} catch {
  // Fallback to workerSrc only
}

export type ExtractedAssignmentData = {
  project_name?: string;
  developer_name?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  property_type?: "condo" | "townhouse" | "other";
  unit_type?: "studio" | "1bed" | "1bed_den" | "2bed" | "2bed_den" | "3bed" | "penthouse";
  beds?: number;
  baths?: number;
  interior_sqft?: number;
  exterior_sqft?: number;
  floor_level?: number;
  exposure?: string;
  original_price?: number;
  completion_month?: number;
  completion_year?: number;
  construction_status?: "pre_construction" | "under_construction" | "completed";
  has_parking?: boolean;
  parking_count?: number;
  has_storage?: boolean;
  description?: string;
};

type Props = {
  onDataExtracted: (data: ExtractedAssignmentData) => void;
  isOpen: boolean;
  onClose: () => void;
};

export function AssignmentBrochureUploader({ onDataExtracted, isOpen, onClose }: Props) {
  const [documentText, setDocumentText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedAssignmentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleTextPaste = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDocumentText(e.target.value);
    setError(null);
  }, []);

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
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      toast({
        title: "Invalid File Type",
        description: "Only PDF files are supported",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("File too large. Maximum size is 20MB");
      toast({
        title: "File Too Large",
        description: "Maximum file size is 20MB",
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);
    setError(null);
    setUploadedFileName(file.name);

    try {
      console.log("Extracting text from PDF:", file.name);
      const text = await extractTextFromPDF(file);
      
      if (!text || text.length < 50) {
        throw new Error("Could not extract enough text from PDF. The file may be image-based or empty.");
      }

      console.log("Extracted text length:", text.length);
      setDocumentText(text);
      
      toast({
        title: "PDF Processed",
        description: `Extracted ${text.length.toLocaleString()} characters from ${file.name}`,
      });

    } catch (err: any) {
      console.error("Error parsing PDF:", err);
      setError(err.message || "Failed to parse PDF");
      setUploadedFileName(null);
      toast({
        title: "PDF Parsing Failed",
        description: err.message || "Could not extract text from the PDF",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const syntheticEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      await handleFileUpload(syntheticEvent);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processDocument = async () => {
    if (!documentText.trim()) {
      setError("Please upload a PDF or paste brochure text");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setExtractedData(null);

    try {
      console.log("Sending document for AI processing...");
      
      const { data, error: fnError } = await supabase.functions.invoke('parse-assignment-brochure', {
        body: { 
          documentText: documentText.trim()
        }
      });

      if (fnError) {
        console.error("Function error:", fnError);
        throw new Error(fnError.message || "Failed to process document");
      }

      if (!data?.success || !data?.data) {
        throw new Error(data?.error || "No data extracted from document");
      }

      console.log("Extracted data:", data.data);
      setExtractedData(data.data);

      toast({
        title: "Data Extracted Successfully",
        description: `Found: ${data.data.project_name || 'Assignment'} - Review and apply the extracted data.`,
      });

    } catch (err: any) {
      console.error("Error processing document:", err);
      setError(err.message || "Failed to process document");
      toast({
        title: "Processing Failed",
        description: err.message || "Could not extract data from the document",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const applyExtractedData = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
      toast({
        title: "Data Applied",
        description: "The extracted data has been filled into the form. Review and save.",
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setDocumentText("");
    setExtractedData(null);
    setError(null);
    setUploadedFileName(null);
    setActiveTab("upload");
    onClose();
  };

  const clearUpload = () => {
    setDocumentText("");
    setUploadedFileName(null);
    setError(null);
  };

  const formatUnitType = (type: string | undefined) => {
    if (!type) return null;
    const map: Record<string, string> = {
      studio: "Studio",
      "1bed": "1 Bedroom",
      "1bed_den": "1 Bed + Den",
      "2bed": "2 Bedroom",
      "2bed_den": "2 Bed + Den",
      "3bed": "3 Bedroom",
      penthouse: "Penthouse"
    };
    return map[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            AI Assignment Data Extractor
          </DialogTitle>
          <DialogDescription>
            Upload a project brochure or floorplan PDF to auto-fill assignment details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!extractedData ? (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload PDF
                  </TabsTrigger>
                  <TabsTrigger value="paste" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Paste Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4 mt-4">
                  {!uploadedFileName ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {isParsing ? (
                        <div className="space-y-3">
                          <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
                          <p className="text-sm text-muted-foreground">Extracting text from PDF...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          <p className="font-medium">Drop your brochure or floorplan PDF here</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            We'll extract project details, unit info, and pricing automatically
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{uploadedFileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {documentText.length.toLocaleString()} characters extracted
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={clearUpload}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="mt-3 p-3 bg-muted/50 rounded text-xs font-mono max-h-32 overflow-y-auto">
                        {documentText.substring(0, 500)}
                        {documentText.length > 500 && "..."}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="paste" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="brochure-text">
                      Paste Brochure / Floorplan Content
                    </Label>
                    <Textarea
                      id="brochure-text"
                      value={documentText}
                      onChange={handleTextPaste}
                      placeholder="Paste text from your project brochure or floorplan...

Include details like:
• Project name and developer
• Unit type (1BR, 2BR, etc.)
• Square footage
• Floor level
• Completion date
• Original purchase price"
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button 
                onClick={processDocument} 
                disabled={isProcessing || isParsing || !documentText.trim()}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting Assignment Data...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Extract Assignment Details
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                <div>
                  <p className="font-medium text-success-strong">Data Extracted Successfully!</p>
                  <p className="text-sm text-muted-foreground">Review the extracted fields below, then apply to your form.</p>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Extracted Assignment Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {extractedData.project_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Project Name:</span>
                      <span className="font-medium">{extractedData.project_name}</span>
                    </div>
                  )}
                  {extractedData.developer_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Developer:</span>
                      <span className="font-medium">{extractedData.developer_name}</span>
                    </div>
                  )}
                  {extractedData.city && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">
                        {extractedData.neighborhood ? `${extractedData.neighborhood}, ` : ''}{extractedData.city}
                      </span>
                    </div>
                  )}
                  {extractedData.unit_type && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unit Type:</span>
                      <span className="font-medium">{formatUnitType(extractedData.unit_type)}</span>
                    </div>
                  )}
                  {(extractedData.beds !== undefined || extractedData.baths !== undefined) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Beds/Baths:</span>
                      <span className="font-medium">
                        {extractedData.beds ?? '-'} Bed / {extractedData.baths ?? '-'} Bath
                      </span>
                    </div>
                  )}
                  {extractedData.interior_sqft && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interior:</span>
                      <span className="font-medium">{extractedData.interior_sqft.toLocaleString()} sq ft</span>
                    </div>
                  )}
                  {extractedData.exterior_sqft && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exterior:</span>
                      <span className="font-medium">{extractedData.exterior_sqft.toLocaleString()} sq ft</span>
                    </div>
                  )}
                  {extractedData.floor_level && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Floor:</span>
                      <span className="font-medium">Level {extractedData.floor_level}</span>
                    </div>
                  )}
                  {extractedData.exposure && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exposure:</span>
                      <span className="font-medium">{extractedData.exposure}</span>
                    </div>
                  )}
                  {extractedData.original_price && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Original Price:</span>
                      <span className="font-medium">${extractedData.original_price.toLocaleString()}</span>
                    </div>
                  )}
                  {extractedData.completion_year && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completion:</span>
                      <span className="font-medium">
                        {extractedData.completion_month ? `Month ${extractedData.completion_month}, ` : ''}
                        {extractedData.completion_year}
                      </span>
                    </div>
                  )}
                  {extractedData.has_parking !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parking:</span>
                      <span className="font-medium">
                        {extractedData.has_parking ? `Yes (${extractedData.parking_count || 1})` : 'No'}
                      </span>
                    </div>
                  )}
                  {extractedData.has_storage !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Storage:</span>
                      <span className="font-medium">{extractedData.has_storage ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setExtractedData(null)} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={applyExtractedData} className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Apply to Form
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="sm:justify-start">
          <p className="text-xs text-muted-foreground">
            Powered by AI • PDFs are processed locally in your browser
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
