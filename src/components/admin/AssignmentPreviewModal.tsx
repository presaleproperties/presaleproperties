import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Compass,
  Download,
  BookOpen,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  project_name?: string;
  project_id?: string | null;
  city?: string;
  neighborhood?: string | null;
  address?: string | null;
  developer_name?: string | null;
  beds?: number;
  baths?: number;
  interior_sqft?: number | null;
  exterior_sqft?: number | null;
  floor_level?: number | null;
  exposure?: string | null;
  unit_number?: string | null;
  unit_type?: string | null;
  parking?: string | null;
  has_locker?: boolean;
  assignment_price?: number;
  original_price?: number | null;
  deposit_to_lock?: number | null;
  buyer_agent_commission?: string | null;
  developer_approval_required?: boolean;
  estimated_completion?: string | null;
  floor_plan_url?: string | null;
  floor_plan_name?: string | null;
  brochure_url?: string | null;
  featured_image?: string | null;
  photos?: string[] | null;
  description?: string | null;
  status?: string;
  is_featured?: boolean | null;
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
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    if (listing?.id && open) {
      fetchPhotosAndFiles();
    }
  }, [listing?.id, open]);

  useEffect(() => {
    setSelectedPhoto(0);
  }, [listing?.id]);

  const fetchPhotosAndFiles = async () => {
    if (!listing) return;
    setLoadingPhotos(true);
    try {
      const [photosRes, filesRes, projectRes] = await Promise.all([
        supabase
          .from("listing_photos" as any)
          .select("url")
          .eq("listing_id", listing.id)
          .order("sort_order"),
        supabase
          .from("listing_files" as any)
          .select("url, file_name, file_type")
          .eq("listing_id", listing.id),
        listing.project_id
          ? (supabase as any).from("presale_projects").select("featured_image, gallery_images").eq("id", listing.project_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const listingPhotos = (photosRes.data as any[])?.map((p: any) => p.url) || [];
      const listingOwnPhotos = [...(listing.photos || []), ...listingPhotos].filter(Boolean);
      const projectPhotos = [
        ...(projectRes.data?.gallery_images || []),
        ...(projectRes.data?.featured_image ? [projectRes.data.featured_image] : []),
      ].filter(Boolean);
      const featuredImg = listing.featured_image ? [listing.featured_image] : [];
      
      const allPhotos = [...new Set([...listingOwnPhotos, ...featuredImg, ...projectPhotos])];
      setPhotos(allPhotos);
      setFiles((filesRes.data as any[]) || []);
    } catch (error) {
      console.error("Error fetching photos/files:", error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(price);

  if (!listing) return null;

  const assignmentPremium = listing.original_price
    ? (listing.assignment_price || 0) - listing.original_price
    : null;

  const premiumPercent = listing.original_price && assignmentPremium !== null
    ? ((assignmentPremium / listing.original_price) * 100).toFixed(1)
    : null;

  const heroPhoto = photos[selectedPhoto] || null;

  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
    pending_approval: { label: "Pending Review", className: "bg-amber-100 text-amber-800 border-amber-300" },
    published: { label: "Published", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-300" },
    paused: { label: "Paused", className: "bg-muted text-muted-foreground" },
    expired: { label: "Expired", className: "bg-muted text-muted-foreground" },
  };

  const currentStatus = statusConfig[listing.status || "draft"] || statusConfig.draft;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden gap-0">
        {/* ── Hero Image Section ──────────────────────────────────── */}
        <div className="relative">
          {loadingPhotos ? (
            <div className="h-72 bg-muted flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : heroPhoto ? (
            <div className="relative h-72 sm:h-80 bg-muted overflow-hidden group">
              <img
                src={heroPhoto}
                alt={listing.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Navigation arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedPhoto((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedPhoto((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Photo counter */}
              {photos.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <ImageIcon className="h-3 w-3" />
                  {selectedPhoto + 1} / {photos.length}
                </div>
              )}

              {/* Hero overlay info */}
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${currentStatus.className} border text-xs`}>
                    {currentStatus.label}
                  </Badge>
                  {listing.visibility_mode === "restricted" ? (
                    <Badge variant="outline" className="bg-black/30 border-amber-400/50 text-amber-200 text-xs">
                      <Lock className="h-3 w-3 mr-1" /> Restricted
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-black/30 border-emerald-400/50 text-emerald-200 text-xs">
                      <Globe className="h-3 w-3 mr-1" /> Public
                    </Badge>
                  )}
                </div>
                <h2 className="text-2xl font-bold leading-tight mb-1 drop-shadow-lg">{listing.title}</h2>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{listing.project_name}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{listing.city}{listing.neighborhood ? `, ${listing.neighborhood}` : ""}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 bg-muted flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="h-10 w-10" />
              <span className="text-sm">No photos available</span>
            </div>
          )}

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="flex gap-1 p-2 bg-muted/50 overflow-x-auto scrollbar-hide">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPhoto(index)}
                  className={`flex-shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${
                    selectedPhoto === index
                      ? "border-primary ring-1 ring-primary/30"
                      : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img src={photo} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <ScrollArea className="max-h-[calc(95vh-420px)]">
          <div className="p-5 sm:p-6 space-y-5">

            {/* ── Price Highlight Bar ────────────────────────────────── */}
            <div className="flex flex-wrap items-stretch gap-3">
              <div className="flex-1 min-w-[140px] bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Assignment Price</p>
                <p className="text-2xl font-bold text-primary">{formatPrice(listing.assignment_price || 0)}</p>
              </div>
              {listing.original_price && (
                <div className="flex-1 min-w-[120px] bg-muted/50 rounded-xl p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Original Price</p>
                  <p className="text-xl font-bold">{formatPrice(listing.original_price)}</p>
                </div>
              )}
              {assignmentPremium !== null && (
                <div className={`flex-1 min-w-[120px] rounded-xl p-4 border ${
                  assignmentPremium > 0 
                    ? "bg-emerald-50 border-emerald-200" 
                    : assignmentPremium < 0 
                    ? "bg-red-50 border-red-200"
                    : "bg-muted/50 border-border"
                }`}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Premium</p>
                  <div className="flex items-center gap-1.5">
                    {assignmentPremium > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                    ) : assignmentPremium < 0 ? (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className={`text-xl font-bold ${
                      assignmentPremium > 0 ? "text-emerald-700" : assignmentPremium < 0 ? "text-red-700" : ""
                    }`}>
                      {assignmentPremium > 0 ? "+" : ""}{formatPrice(assignmentPremium)}
                    </p>
                    {premiumPercent && (
                      <span className={`text-xs font-medium ml-1 ${
                        assignmentPremium > 0 ? "text-emerald-600" : "text-red-600"
                      }`}>
                        ({assignmentPremium > 0 ? "+" : ""}{premiumPercent}%)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Quick Stats Row ────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {[
                { icon: Bed, label: "Beds", value: listing.beds ?? "–" },
                { icon: Bath, label: "Baths", value: listing.baths ?? "–" },
                { icon: Maximize, label: "Interior", value: listing.interior_sqft ? `${listing.interior_sqft} sf` : "–" },
                { icon: Building2, label: "Floor", value: listing.floor_level ?? "–" },
                { icon: Compass, label: "Exposure", value: listing.exposure || "–" },
                { icon: Calendar, label: "Completion", value: listing.estimated_completion || "TBD" },
              ].map((stat, i) => (
                <div key={i} className="bg-muted/40 rounded-lg p-3 text-center">
                  <stat.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
                  <p className="text-sm font-semibold truncate">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* ── Details Grid ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left: Features & Financial */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Unit Features</h4>
                  <div className="bg-muted/30 rounded-xl p-4 space-y-2.5">
                    {listing.unit_type && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium">{listing.unit_type}</span>
                      </div>
                    )}
                    {listing.unit_number && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Unit #</span>
                        <span className="font-medium">{listing.unit_number}</span>
                      </div>
                    )}
                    {listing.exterior_sqft && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Outdoor</span>
                        <span className="font-medium">{listing.exterior_sqft} sqft</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Parking</span>
                      <span className="font-medium">{listing.parking || "Not included"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Locker</span>
                      <span className="font-medium">{listing.has_locker ? "Yes" : "No"}</span>
                    </div>
                    {listing.developer_approval_required && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Dev. Approval</span>
                        <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs h-5">Required</Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial */}
                {(listing.deposit_to_lock || listing.buyer_agent_commission) && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Financial</h4>
                    <div className="bg-muted/30 rounded-xl p-4 space-y-2.5">
                      {listing.deposit_to_lock && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Deposit to Lock</span>
                          <span className="font-semibold">{formatPrice(listing.deposit_to_lock)}</span>
                        </div>
                      )}
                      {listing.buyer_agent_commission && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Buyer Agent Commission</span>
                          <span className="font-semibold">{listing.buyer_agent_commission}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Agent & Documents */}
              <div className="space-y-4">
                {/* Agent Card */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Listing Agent</h4>
                  {listing.agent_profile ? (
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{listing.agent_profile.full_name || "Unknown Agent"}</p>
                          <p className="text-xs text-muted-foreground">{listing.developer_name || "Agent"}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{listing.agent_profile.email}</span>
                        </div>
                        {listing.agent_profile.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{listing.agent_profile.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-xl p-4 text-center text-sm text-muted-foreground">
                      No agent info available
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Documents</h4>
                  <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                    {listing.floor_plan_url && (
                      <a href={listing.floor_plan_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Layers className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{listing.floor_plan_name || "Floor Plan"}</p>
                          <p className="text-xs text-muted-foreground">View / Download</p>
                        </div>
                        <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </a>
                    )}
                    {listing.brochure_url && (
                      <a href={listing.brochure_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">Project Brochure</p>
                          <p className="text-xs text-muted-foreground">View / Download</p>
                        </div>
                        <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </a>
                    )}
                    {files.map((file, index) => (
                      <a key={index} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.file_name || `Document ${index + 1}`}</p>
                          <p className="text-xs text-muted-foreground">{file.file_type}</p>
                        </div>
                        <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </a>
                    ))}
                    {!listing.floor_plan_url && !listing.brochure_url && files.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">No documents attached</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Description ─────────────────────────────────────── */}
            {listing.description && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Description</h4>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{listing.description}</p>
                </div>
              </div>
            )}

            {/* ── Address ──────────────────────────────────────────── */}
            {listing.address && (
              <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-4">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">{listing.address}</p>
                  {listing.city && (
                    <p className="text-xs text-muted-foreground">{listing.city}{listing.neighborhood ? `, ${listing.neighborhood}` : ""}</p>
                  )}
                </div>
                {listing.status === "published" && (
                  <a href={`/assignments/${listing.id}`} target="_blank" rel="noopener noreferrer" className="ml-auto">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <ExternalLink className="h-3.5 w-3.5" /> View Live
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ── Action Footer ───────────────────────────────────────── */}
        <div className="border-t p-4 bg-muted/20 flex items-center justify-between gap-3 shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              onClick={onReject}
              disabled={processing}
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Reject
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              onClick={onApprove}
              disabled={processing}
            >
              {processing && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Approve & Publish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
