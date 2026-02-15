import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  Building2,
  Calendar,
  DollarSign,
  Car,
  Box,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Image as ImageIcon,
  FileText,
  Globe,
  Lock,
  Compass
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  project_name?: string;
  city?: string;
  neighborhood?: string | null;
  beds?: number;
  baths?: number;
  interior_sqft?: number | null;
  exterior_sqft?: number | null;
  assignment_price?: number;
  original_price?: number | null;
  deposit_paid?: number | null;
  status?: string;
  is_featured?: boolean | null;
  visibility_mode?: string | null;
  unit_type?: string;
  construction_status?: string;
  completion_month?: number | null;
  completion_year?: number | null;
  has_parking?: boolean | null;
  parking_count?: number | null;
  has_storage?: boolean | null;
  floor_level?: string | null;
  exposure?: string | null;
  description?: string | null;
  address?: string | null;
  map_lat?: number | null;
  map_lng?: number | null;
  agent_profile?: {
    full_name: string | null;
    email: string;
    phone?: string | null;
  };
  [key: string]: any;
}

interface AssignmentPreviewModalProps {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  processing?: boolean;
}

export function AssignmentPreviewModal({
  listing,
  open,
  onOpenChange,
  onApprove,
  onReject,
  processing = false,
}: AssignmentPreviewModalProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [files, setFiles] = useState<{ url: string; file_name: string | null; file_type: string }[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  useEffect(() => {
    if (listing?.id && open) {
      fetchPhotosAndFiles();
    }
  }, [listing?.id, open]);

  const fetchPhotosAndFiles = async () => {
    if (!listing) return;
    
    setLoadingPhotos(true);
    try {
      const [photosRes, filesRes] = await Promise.all([
        supabase
          .from("listing_photos" as any)
          .select("url")
          .eq("listing_id", listing.id)
          .order("sort_order"),
        supabase
          .from("listing_files" as any)
          .select("url, file_name, file_type")
          .eq("listing_id", listing.id),
      ]);

      setPhotos((photosRes.data as any[])?.map((p: any) => p.url) || []);
      setFiles((filesRes.data as any[]) || []);
    } catch (error) {
      console.error("Error fetching photos/files:", error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getCompletionDate = () => {
    if (listing?.completion_month && listing?.completion_year) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[listing.completion_month - 1]} ${listing.completion_year}`;
    }
    if (listing?.completion_year) return listing.completion_year.toString();
    return "TBD";
  };

  const getUnitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      studio: "Studio",
      "1bed": "1 Bedroom",
      "1bed_den": "1 Bed + Den",
      "2bed": "2 Bedroom",
      "2bed_den": "2 Bed + Den",
      "3bed": "3 Bedroom",
      penthouse: "Penthouse",
    };
    return labels[type] || type;
  };

  if (!listing) return null;

  const assignmentPremium = listing.original_price 
    ? listing.assignment_price - listing.original_price 
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold">{listing.title}</DialogTitle>
              <p className="text-muted-foreground mt-1">{listing.project_name}</p>
            </div>
            <div className="flex items-center gap-2">
              {listing.visibility_mode === "restricted" ? (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  <Lock className="h-3 w-3 mr-1" />
                  Restricted
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* Photo Gallery */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Photos ({photos.length})
              </h3>
              {loadingPhotos ? (
                <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {photos.slice(0, 8).map((photo, index) => (
                    <div key={index} className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {photos.length > 8 && (
                    <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground font-medium">
                        +{photos.length - 8} more
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 bg-muted rounded-lg text-muted-foreground">
                  No photos uploaded
                </div>
              )}
            </div>

            <Separator />

            {/* Key Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <MapPin className="h-4 w-4" />
                  Location
                </div>
                <p className="font-medium">{listing.city}</p>
                {listing.neighborhood && (
                  <p className="text-sm text-muted-foreground">{listing.neighborhood}</p>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Bed className="h-4 w-4" />
                  Unit Type
                </div>
                <p className="font-medium">{getUnitTypeLabel(listing.unit_type)}</p>
                <p className="text-sm text-muted-foreground">
                  {listing.beds} bed, {listing.baths} bath
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Maximize className="h-4 w-4" />
                  Size
                </div>
                <p className="font-medium">
                  {listing.interior_sqft ? `${listing.interior_sqft} sqft` : "N/A"}
                </p>
                {listing.exterior_sqft && (
                  <p className="text-sm text-muted-foreground">
                    +{listing.exterior_sqft} sqft outdoor
                  </p>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Calendar className="h-4 w-4" />
                  Completion
                </div>
                <p className="font-medium">{getCompletionDate()}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {listing.construction_status.replace("_", " ")}
                </p>
              </div>
            </div>

            <Separator />

            {/* Pricing Section */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Assignment Price</p>
                  <p className="text-xl font-bold text-primary">
                    {formatPrice(listing.assignment_price)}
                  </p>
                </div>

                {listing.original_price && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Original Price</p>
                    <p className="text-lg font-semibold">{formatPrice(listing.original_price)}</p>
                  </div>
                )}

                {assignmentPremium !== null && (
                  <div className={`rounded-lg p-4 ${assignmentPremium > 0 ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
                    <p className="text-sm text-muted-foreground mb-1">Premium/Discount</p>
                    <p className={`text-lg font-semibold ${assignmentPremium > 0 ? "text-green-600" : "text-amber-600"}`}>
                      {assignmentPremium > 0 ? "+" : ""}{formatPrice(assignmentPremium)}
                    </p>
                  </div>
                )}

                {listing.deposit_paid && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Deposit Paid</p>
                    <p className="text-lg font-semibold">{formatPrice(listing.deposit_paid)}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Features</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Parking: {listing.has_parking ? `Yes (${listing.parking_count || 1})` : "No"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-muted-foreground" />
                    <span>Storage: {listing.has_storage ? "Yes" : "No"}</span>
                  </div>
                  {listing.floor_level && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>Floor: {listing.floor_level}</span>
                    </div>
                  )}
                  {listing.exposure && (
                    <div className="flex items-center gap-2">
                      <Compass className="h-4 w-4 text-muted-foreground" />
                      <span>Exposure: {listing.exposure}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Agent Information</h3>
                {listing.agent_profile ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{listing.agent_profile.full_name || "Unknown Agent"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{listing.agent_profile.email}</span>
                    </div>
                    {listing.agent_profile.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{listing.agent_profile.phone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Agent info not available</p>
                )}
              </div>
            </div>

            {/* Documents */}
            {files.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents ({files.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {files.map((file, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => window.open(file.url, "_blank")}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        {file.file_name || `Document ${index + 1}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Description */}
            {listing.description && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </div>
              </>
            )}

            {/* Address & Coordinates */}
            {listing.address && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Full Address</h3>
                  <p className="text-sm">{listing.address}</p>
                  {listing.map_lat && listing.map_lng && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Coordinates: {listing.map_lat}, {listing.map_lng}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Action Footer */}
        <div className="border-t p-4 bg-muted/30 flex items-center justify-between gap-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={onReject}
              disabled={processing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={onApprove}
              disabled={processing}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve & Publish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
