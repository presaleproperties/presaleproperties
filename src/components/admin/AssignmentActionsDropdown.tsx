import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  MoreHorizontal,
  Eye,
  Pause,
  Play,
  Archive,
  Trash2,
  XCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
interface Listing {
  id: string;
  title: string;
  status: string;
  published_at: string | null;
  is_featured: boolean | null;
  [key: string]: any;
}

interface AssignmentActionsDropdownProps {
  listing: Listing;
  onRefresh: () => void;
  onPreview: () => void;
  showApprovalActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

export function AssignmentActionsDropdown({
  listing,
  onRefresh,
  onPreview,
  showApprovalActions = false,
  onApprove,
  onReject,
}: AssignmentActionsDropdownProps) {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"unpublish" | "delete" | "pause" | "republish" | null>(null);

  const handleStatusChange = async (newStatus: "draft" | "paused" | "expired" | "published") => {
    setProcessing(true);
    try {
      const updates: Record<string, any> = { status: newStatus };
      
      if (newStatus === "published") {
        updates.published_at = new Date().toISOString();
      }

      const { error } = await (supabase
        .from("listings" as any)
        .update(updates)
        .eq("id", listing.id) as any);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Assignment has been ${newStatus === "published" ? "republished" : newStatus}`,
      });
      onRefresh();
    } catch (error) {
      console.error("Error updating listing:", error);
      toast({
        title: "Error",
        description: "Failed to update assignment status",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setConfirmAction(null);
    }
  };

  const handleDelete = async () => {
    setProcessing(true);
    try {
      // Delete related records first
      await (supabase.from("listing_photos" as any).delete().eq("listing_id", listing.id) as any);
      await (supabase.from("listing_files" as any).delete().eq("listing_id", listing.id) as any);
      
      const { error } = await (supabase
        .from("listings" as any)
        .delete()
        .eq("id", listing.id) as any);

      if (error) throw error;

      toast({
        title: "Assignment Deleted",
        description: `"${listing.title}" has been permanently deleted`,
      });
      onRefresh();
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setConfirmAction(null);
    }
  };

  const getConfirmActionDetails = () => {
    switch (confirmAction) {
      case "unpublish":
        return {
          title: "Unpublish Assignment",
          description: `Are you sure you want to unpublish "${listing.title}"? It will be moved to draft status and hidden from public view.`,
          action: () => handleStatusChange("draft"),
          actionLabel: "Unpublish",
          variant: "outline" as const,
        };
      case "pause":
        return {
          title: "Pause Assignment",
          description: `Are you sure you want to pause "${listing.title}"? It will be temporarily hidden while maintaining its data.`,
          action: () => handleStatusChange("paused"),
          actionLabel: "Pause",
          variant: "outline" as const,
        };
      case "republish":
        return {
          title: "Republish Assignment",
          description: `Are you sure you want to republish "${listing.title}"? It will be visible to the public again.`,
          action: () => handleStatusChange("published"),
          actionLabel: "Republish",
          variant: "default" as const,
        };
      case "delete":
        return {
          title: "Delete Assignment",
          description: `Are you sure you want to permanently delete "${listing.title}"? This action cannot be undone.`,
          action: handleDelete,
          actionLabel: "Delete",
          variant: "destructive" as const,
        };
      default:
        return null;
    }
  };

  const confirmDetails = getConfirmActionDetails();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-50">
          <DropdownMenuItem onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </DropdownMenuItem>

          {showApprovalActions && onApprove && onReject && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onApprove} className="text-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve & Publish
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onReject} className="text-red-600">
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          {listing.status === "published" && (
            <>
              <DropdownMenuItem onClick={() => setConfirmAction("pause")}>
                <Pause className="h-4 w-4 mr-2" />
                Pause Listing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmAction("unpublish")}>
                <Archive className="h-4 w-4 mr-2" />
                Unpublish
              </DropdownMenuItem>
            </>
          )}

          {(listing.status === "paused" || listing.status === "draft" || listing.status === "expired") && (
            <DropdownMenuItem onClick={() => setConfirmAction("republish")}>
              <Play className="h-4 w-4 mr-2" />
              Republish
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setConfirmAction("delete")}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Permanently
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDetails?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDetails?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDetails?.action}
              disabled={processing}
              className={
                confirmDetails?.variant === "destructive"
                  ? "bg-red-600 hover:bg-red-700"
                  : confirmDetails?.variant === "default"
                  ? "bg-primary hover:bg-primary/90"
                  : ""
              }
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {confirmDetails?.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
