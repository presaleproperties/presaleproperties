import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { 
  Upload, 
  FileText, 
  Loader2, 
  Sparkles, 
  CheckCircle2,
  AlertCircle,
  X,
  File
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Set up PDF.js worker using local bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

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

type Props = {
  onDataExtracted: (data: ExtractedProjectData) => void;
  isOpen: boolean;
  onClose: () => void;
};

export function BrochureUploadAssistant({ onDataExtracted, isOpen, onClose }: Props) {
  const [documentText, setDocumentText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedProjectData | null>(null);
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
      // Reset file input
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
      // Create a synthetic event
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
      
      const { data, error: fnError } = await supabase.functions.invoke('parse-project-brochure', {
        body: { 
          documentText: documentText.trim(),
          documentType: 'brochure'
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
        description: `Found: ${data.data.name || 'Project'} - Review and apply the extracted data.`,
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Brochure Upload Assistant
          </DialogTitle>
          <DialogDescription>
            Upload a PDF brochure or paste text to extract project details automatically.
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
                          <p className="font-medium">Drop your PDF here or click to browse</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Supports PDF files up to 20MB
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <File className="h-5 w-5 text-primary" />
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
                      Paste Brochure / Info Sheet Content
                    </Label>
                    <Textarea
                      id="brochure-text"
                      value={documentText}
                      onChange={handleTextPaste}
                      placeholder="Copy and paste the text content from your project brochure, information sheet, or sales materials here...

Include details like:
• Project name and developer
• Location (city, neighborhood, address)
• Unit types and pricing
• Amenities and features
• Completion timeline
• Deposit structure"
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
                    Extracting Data with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Extract Project Data
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-700">Data Extracted Successfully!</p>
                  <p className="text-sm text-muted-foreground">Review the extracted fields below.</p>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Extracted Data Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {extractedData.name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Project Name:</span>
                      <span className="font-medium">{extractedData.name}</span>
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
                  {extractedData.project_type && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium capitalize">{extractedData.project_type}</span>
                    </div>
                  )}
                  {extractedData.starting_price && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Starting Price:</span>
                      <span className="font-medium">
                        ${extractedData.starting_price.toLocaleString()}
                      </span>
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
                  {extractedData.highlights && extractedData.highlights.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Highlights:</span>
                      <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
                        {extractedData.highlights.slice(0, 5).map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                        {extractedData.highlights.length > 5 && (
                          <li className="text-muted-foreground">
                            +{extractedData.highlights.length - 5} more...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  {extractedData.amenities && extractedData.amenities.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Amenities:</span>
                      <p className="mt-1 text-xs">
                        {extractedData.amenities.slice(0, 6).join(", ")}
                        {extractedData.amenities.length > 6 && ` +${extractedData.amenities.length - 6} more`}
                      </p>
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
