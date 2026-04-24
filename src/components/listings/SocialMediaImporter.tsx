import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  MessageCircle,
  Image as ImageIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Facebook icon SVG
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

// WhatsApp icon SVG
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export type ExtractedSocialData = {
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
  assignment_price?: number;
  deposit_paid?: number;
  completion_month?: number;
  completion_year?: number;
  construction_status?: "pre_construction" | "under_construction" | "completed";
  has_parking?: boolean;
  parking_count?: number;
  has_storage?: boolean;
  description?: string;
};

type Props = {
  onDataExtracted: (data: ExtractedSocialData) => void;
  isOpen: boolean;
  onClose: () => void;
};

export function SocialMediaImporter({ onDataExtracted, isOpen, onClose }: Props) {
  const [activeSource, setActiveSource] = useState<"facebook" | "whatsapp">("facebook");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedSocialData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, etc.)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image too large. Maximum size is 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processContent = async () => {
    if (!description.trim() && !imagePreview) {
      setError("Please provide either a description or upload a screenshot");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setExtractedData(null);

    try {
      // Combine image analysis request if we have an image
      const imageData = imagePreview?.startsWith("data:") ? imagePreview : null;

      const { data, error: fnError } = await supabase.functions.invoke('parse-social-post', {
        body: {
          source: activeSource,
          description: description.trim(),
          imageBase64: imageData,
        }
      });

      if (fnError) {
        throw new Error(fnError.message || "Failed to process content");
      }

      if (!data?.success || !data?.data) {
        throw new Error(data?.error || "Could not extract data from content");
      }

      setExtractedData(data.data);
      toast({
        title: "Data Extracted",
        description: `Successfully extracted ${data.data.project_name || 'assignment'} details`,
      });

    } catch (err: any) {
      console.error("Error processing social content:", err);
      setError(err.message || "Failed to process content");
      toast({
        title: "Processing Failed",
        description: err.message || "Could not extract data",
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
        description: "The extracted data has been filled into the form.",
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setDescription("");
    setImagePreview(null);
    setExtractedData(null);
    setError(null);
    setActiveSource("facebook");
    onClose();
  };

  const clearImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatValue = (key: string, value: any) => {
    if (value === undefined || value === null) return null;
    if (key === "unit_type") {
      const map: Record<string, string> = {
        studio: "Studio", "1bed": "1 Bed", "1bed_den": "1 Bed + Den",
        "2bed": "2 Bed", "2bed_den": "2 Bed + Den", "3bed": "3 Bed", penthouse: "Penthouse"
      };
      return map[value] || value;
    }
    if (key.includes("price") || key === "deposit_paid") {
      return `$${Number(value).toLocaleString()}`;
    }
    if (key.includes("sqft")) return `${value.toLocaleString()} sqft`;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Import from Social Media
          </DialogTitle>
          <DialogDescription>
            Import your assignment listing from a Facebook post or WhatsApp group message
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!extractedData ? (
            <>
              {/* Source Selection */}
              <Tabs value={activeSource} onValueChange={(v) => setActiveSource(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-auto">
                  <TabsTrigger value="facebook" className="flex items-center gap-2 py-3 data-[state=active]:bg-info data-[state=active]:text-on-dark">
                    <FacebookIcon />
                    <span>Facebook Post</span>
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="flex items-center gap-2 py-3 data-[state=active]:bg-success data-[state=active]:text-on-dark">
                    <WhatsAppIcon />
                    <span>WhatsApp Message</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="facebook" className="mt-4 space-y-4">
                  <Card className="bg-gradient-to-br from-info-soft to-info-soft/50 dark:from-info-strong/20 dark:to-info-strong/10 border-info/30 dark:border-info">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">
                        Upload a screenshot of your Facebook post and/or paste the description text. Our AI will extract all the property details automatically.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="whatsapp" className="mt-4 space-y-4">
                  <Card className="bg-gradient-to-br from-success-soft to-success-soft/50 dark:from-success-strong/20 dark:to-success-strong/10 border-success/30 dark:border-success">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">
                        Upload your marketing graphic from WhatsApp and paste the message text. We'll parse the property information for you.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Screenshot / Marketing Graphic
                </Label>
                
                {!imagePreview ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      activeSource === "facebook" 
                        ? "border-info hover:border-info dark:border-info dark:hover:border-info"
                        : "border-success hover:border-success dark:border-success dark:hover:border-success"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Drop your screenshot here</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse (PNG, JPG up to 10MB)</p>
                  </div>
                ) : (
                  <div className="relative border rounded-lg overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Uploaded preview" 
                      className="w-full max-h-64 object-contain bg-muted"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={clearImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Post Description / Message Text
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={activeSource === "facebook" 
                    ? "Paste your Facebook post text here...\n\nExample:\n🏠 ASSIGNMENT SALE - The Arc by Concord Pacific\n📍 Downtown Vancouver\n🛏️ 2BR + Den | 2 Bath | 1,050 sqft\n💰 $850,000 (Originally $800K)\n📅 Completion: Q4 2025\n🅿️ 1 Parking + Storage included"
                    : "Paste your WhatsApp message here...\n\nExample:\n*ASSIGNMENT* 🏢\nProject: The Arc\nDeveloper: Concord Pacific\nLocation: Downtown Vancouver\n2 Bed + Den, 2 Bath\nSize: 1,050 sqft\nPrice: $850K\nOriginal: $800K\nCompletion: Oct 2025\nParking: ✅  Storage: ✅"
                  }
                  className="min-h-[160px] font-mono text-sm"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                onClick={processContent}
                disabled={isProcessing || (!description.trim() && !imagePreview)}
                className={`w-full ${activeSource === "facebook" ? "bg-info hover:bg-info" : "bg-success hover:bg-success"}`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting Data...
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
              {/* Success State */}
              <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                <div>
                  <p className="font-medium text-success-strong dark:text-success">Data Extracted Successfully!</p>
                  <p className="text-sm text-muted-foreground">Review the fields below, then apply to your form.</p>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Extracted Assignment Data</CardTitle>
                  <CardDescription>From {activeSource === "facebook" ? "Facebook" : "WhatsApp"} post</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {Object.entries(extractedData).map(([key, value]) => {
                    const formatted = formatValue(key, value);
                    if (!formatted) return null;
                    const label = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                    return (
                      <div key={key} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                        <span className="text-muted-foreground">{label}:</span>
                        <span className="font-medium text-right max-w-[60%]">{formatted}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setExtractedData(null)} className="flex-1">
                  Try Again
                </Button>
                <Button onClick={applyExtractedData} className="flex-1 bg-success hover:bg-success">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Apply to Form
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
