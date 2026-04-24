import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGuestFavorites } from "@/hooks/useGuestFavorites";
import { cn } from "@/lib/utils";

interface SaveButtonProps {
  listingId: string;
  variant?: "icon" | "full";
  className?: string;
}

export function SaveButton({ listingId, variant = "icon", className }: SaveButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useGuestFavorites();
  const [isSavedDb, setIsSavedDb] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // For logged in users, check database
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

    setIsSavedDb(!!data);
  };

  // Determine if saved (DB for logged in users, localStorage for guests)
  const isSaved = user ? isSavedDb : isFavorite(listingId);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // For guests, use localStorage
    if (!user) {
      toggleFavorite(listingId);
      toast({
        title: isFavorite(listingId) ? "Removed from favorites" : "Saved to favorites!",
        description: isFavorite(listingId) 
          ? "Listing removed from your favorites." 
          : "Listing added to your favorites. Sign in to save permanently.",
      });
      return;
    }

    // For logged in users, use database
    setIsLoading(true);

    try {
      if (isSavedDb) {
        const { error } = await supabase
          .from("saved_listings")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);

        if (error) throw error;

        setIsSavedDb(false);
        toast({
          title: "Removed from saved",
          description: "Listing removed from your saved list.",
        });
      } else {
        const { error } = await supabase
          .from("saved_listings")
          .insert({ user_id: user.id, listing_id: listingId });

        if (error) throw error;

        setIsSavedDb(true);
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
        "flex items-center justify-center w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm shadow-md transition-all duration-200 hover:scale-110",
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
