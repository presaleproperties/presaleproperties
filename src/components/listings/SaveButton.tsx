import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SaveButtonProps {
  listingId: string;
  variant?: "icon" | "full";
  className?: string;
}

export function SaveButton({ listingId, variant = "icon", className }: SaveButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkIfSaved();
    }
  }, [user, listingId]);

  const checkIfSaved = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("saved_listings")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .maybeSingle();

    setIsSaved(!!data);
  };

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to save listings.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isSaved) {
        const { error } = await supabase
          .from("saved_listings")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);

        if (error) throw error;

        setIsSaved(false);
        toast({
          title: "Removed from saved",
          description: "Listing removed from your saved list.",
        });
      } else {
        const { error } = await supabase
          .from("saved_listings")
          .insert({ user_id: user.id, listing_id: listingId });

        if (error) throw error;

        setIsSaved(true);
        toast({
          title: "Saved!",
          description: "Listing added to your saved list.",
        });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "full") {
    return (
      <Button
        variant={isSaved ? "default" : "outline"}
        size="sm"
        onClick={handleToggleSave}
        disabled={isLoading}
        className={cn("gap-2", className)}
      >
        <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
        {isSaved ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <button
      onClick={handleToggleSave}
      disabled={isLoading}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all duration-200 hover:scale-110",
        isSaved && "bg-primary text-primary-foreground",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={isSaved ? "Remove from saved" : "Save listing"}
    >
      <Heart className={cn("h-4 w-4", isSaved ? "fill-current" : "text-muted-foreground")} />
    </button>
  );
}
