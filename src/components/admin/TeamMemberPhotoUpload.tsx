import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";

interface TeamMemberPhotoUploadProps {
  currentPhotoUrl: string | null;
  onPhotoChange: (url: string | null) => void;
  memberName?: string;
}

export function TeamMemberPhotoUpload({
  currentPhotoUrl,
  onPhotoChange,
  memberName = "Team Member",
}: TeamMemberPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `team/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { 
          contentType: file.type,
          upsert: false 
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      onPhotoChange(publicUrl);
      toast.success("Photo uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = () => {
    onPhotoChange(null);
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div className="flex items-center gap-4">
        {currentPhotoUrl ? (
          <div className="relative">
            <img
              src={currentPhotoUrl}
              alt={memberName}
              className="w-20 h-20 rounded-full object-cover border-2 border-border"
            />
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
            <span className="text-2xl font-medium text-muted-foreground">
              {memberName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="team-photo-upload"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {currentPhotoUrl ? "Change Photo" : "Upload Photo"}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG or WebP. Max 5MB.
          </p>
        </div>
      </div>
    </div>
  );
}
