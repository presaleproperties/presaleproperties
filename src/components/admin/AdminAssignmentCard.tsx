import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AssignmentActionsDropdown } from "./AssignmentActionsDropdown";
import { format, differenceInDays, isPast } from "date-fns";
import {
  MapPin,
  Bed,
  Bath,
  User,
  Eye,
  Lock,
  Globe,
  Star,
  Calendar,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  project_name: string;
  city: string;
  neighborhood: string | null;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  exterior_sqft: number | null;
  assignment_price: number;
  original_price: number | null;
  deposit_paid: number | null;
  status: string;
  is_featured: boolean | null;
  visibility_mode: string | null;
  expires_at: string | null;
  published_at: string | null;
  unit_type: string;
  construction_status: string;
  completion_month: number | null;
  completion_year: number | null;
  has_parking: boolean | null;
  parking_count: number | null;
  has_storage: boolean | null;
  floor_level: string | null;
  exposure: string | null;
  description: string | null;
  address: string | null;
  map_lat: number | null;
  map_lng: number | null;
  agent_id: string | null;
  agent_profile?: {
    full_name: string | null;
    email: string;
    phone?: string | null;
  };
  [key: string]: any;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  pending_payment: { label: "Pending Payment", variant: "outline" },
  pending_approval: { label: "Pending Approval", variant: "outline" },
  published: { label: "Published", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  expired: { label: "Expired", variant: "secondary" },
  paused: { label: "Paused", variant: "secondary" },
};

interface AdminAssignmentCardProps {
  listing: Listing;
  showApprovalActions?: boolean;
  onRefresh: () => void;
  onPreview: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onToggleFeatured?: () => void;
  isUpdatingFeatured?: boolean;
}

export function AdminAssignmentCard({
  listing,
  showApprovalActions = false,
  onRefresh,
  onPreview,
  onApprove,
  onReject,
  onToggleFeatured,
  isUpdatingFeatured = false,
}: AdminAssignmentCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getExpiryInfo = () => {
    if (!listing.expires_at) return null;
    
    const expiryDate = new Date(listing.expires_at);
    const daysUntilExpiry = differenceInDays(expiryDate, new Date());
    const isExpired = isPast(expiryDate);

    if (isExpired) {
      return {
        label: "Expired",
        date: format(expiryDate, "MMM d, yyyy"),
        variant: "destructive" as const,
        icon: AlertTriangle,
      };
    } else if (daysUntilExpiry <= 7) {
      return {
        label: `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`,
        date: format(expiryDate, "MMM d, yyyy"),
        variant: "warning" as const,
        icon: Clock,
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        label: `Expires ${format(expiryDate, "MMM d")}`,
        date: format(expiryDate, "MMM d, yyyy"),
        variant: "outline" as const,
        icon: Calendar,
      };
    }
    
    return {
      label: format(expiryDate, "MMM d, yyyy"),
      date: format(expiryDate, "MMM d, yyyy"),
      variant: "outline" as const,
      icon: Calendar,
    };
  };

  const expiryInfo = getExpiryInfo();

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          {/* Main Content */}
          <div className="flex-1 space-y-3 min-w-0">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h3 className="font-semibold text-base sm:text-lg truncate max-w-[300px]">
                  {listing.title}
                </h3>
                <Badge variant={statusLabels[listing.status]?.variant || "secondary"}>
                  {statusLabels[listing.status]?.label || listing.status}
                </Badge>
              </div>
              
              <AssignmentActionsDropdown
                listing={listing}
                onRefresh={onRefresh}
                onPreview={onPreview}
                showApprovalActions={showApprovalActions}
                onApprove={onApprove}
                onReject={onReject}
              />
            </div>

            {/* Badges Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {listing.is_featured && (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Featured
                </Badge>
              )}
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
              {expiryInfo && (
                <Badge 
                  variant={expiryInfo.variant === "warning" ? "outline" : expiryInfo.variant}
                  className={
                    expiryInfo.variant === "warning" 
                      ? "text-amber-600 border-amber-500 bg-amber-50" 
                      : expiryInfo.variant === "destructive"
                      ? "bg-red-100 text-red-700 border-red-300"
                      : ""
                  }
                >
                  <expiryInfo.icon className="h-3 w-3 mr-1" />
                  {expiryInfo.label}
                </Badge>
              )}
            </div>
            
            {/* Project Name */}
            <p className="text-muted-foreground text-sm">{listing.project_name}</p>
            
            {/* Details Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {listing.city}
                {listing.neighborhood && `, ${listing.neighborhood}`}
              </span>
              <span className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                {listing.beds} bed
              </span>
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" />
                {listing.baths} bath
              </span>
            </div>

            {/* Agent Info */}
            {listing.agent_profile && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-foreground">
                  {listing.agent_profile.full_name || "Unknown Agent"}
                </span>
                <span className="text-muted-foreground">
                  ({listing.agent_profile.email})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="text-lg font-bold text-primary">
              {formatPrice(listing.assignment_price)}
            </div>
          </div>

          {/* Actions Column */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 shrink-0">
            {showApprovalActions && (
              <Button
                variant="default"
                className="bg-primary hover:bg-primary/90"
                onClick={onPreview}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview & Review
              </Button>
            )}
            
            {listing.status === "published" && !showApprovalActions && onToggleFeatured && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Featured</span>
                <Switch
                  checked={listing.is_featured || false}
                  onCheckedChange={onToggleFeatured}
                  disabled={isUpdatingFeatured}
                />
              </div>
            )}
            
            {!showApprovalActions && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onPreview}
                className="text-muted-foreground hover:text-foreground"
              >
                <Eye className="h-4 w-4 mr-2" />
                Quick View
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
