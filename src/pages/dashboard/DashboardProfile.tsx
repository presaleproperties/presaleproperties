import { useEffect, useState, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Shield, 
  Camera,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(100),
  phone: z.string().trim().max(20).optional(),
});

const agentSchema = z.object({
  license_number: z.string().trim().min(3, "License number is required").max(50),
  brokerage_name: z.string().trim().min(2, "Brokerage name is required").max(100),
  brokerage_address: z.string().trim().max(200).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type AgentFormData = z.infer<typeof agentSchema>;

interface AgentProfile {
  license_number: string;
  brokerage_name: string;
  brokerage_address: string | null;
  verification_status: string;
  verification_notes: string | null;
}

export default function DashboardProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      phone: "",
    },
  });

  const agentForm = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      license_number: "",
      brokerage_name: "",
      brokerage_address: "",
    },
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, avatar_url")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        profileForm.reset({
          full_name: profile.full_name || "",
          phone: profile.phone || "",
        });
        setAvatarUrl(profile.avatar_url);
      }

      // Fetch agent profile
      const { data: agent } = await (supabase as any)
        .from("agent_profiles")
        .select("license_number, brokerage_name, brokerage_address, verification_status, verification_notes")
        .eq("user_id", user.id)
        .single();

      if (agent) {
        setAgentProfile(agent);
        agentForm.reset({
          license_number: agent.license_number,
          brokerage_name: agent.brokerage_name,
          brokerage_address: agent.brokerage_address || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAgentSubmit = async (data: AgentFormData) => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await (supabase as any)
        .from("agent_profiles")
        .update({
          license_number: data.license_number,
          brokerage_name: data.brokerage_name,
          brokerage_address: data.brokerage_address || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Agent profile updated",
        description: "Your license information has been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update agent profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingPhoto(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getVerificationIcon = () => {
    switch (agentProfile?.verification_status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
    }
  };

  const getVerificationBadge = () => {
    switch (agentProfile?.verification_status) {
      case "verified":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account and license information</p>
        </div>

        {/* Verification Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {getVerificationIcon()}
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  Verification Status
                  {getVerificationBadge()}
                </CardTitle>
                <CardDescription>
                  {agentProfile?.verification_status === "verified"
                    ? "Your license has been verified. You can publish listings."
                    : agentProfile?.verification_status === "rejected"
                    ? "Your verification was rejected. Please update your information."
                    : "Your license is being reviewed by our team."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {agentProfile?.verification_notes && (
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <strong>Admin notes:</strong> {agentProfile.verification_notes}
              </p>
            </CardContent>
          )}
        </Card>

        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Profile Photo
            </CardTitle>
            <CardDescription>
              This photo will appear on your listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || undefined} alt="Profile photo" />
                  <AvatarFallback className="text-xl bg-muted">
                    {profileForm.watch("full_name")?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "AG"}
                  </AvatarFallback>
                </Avatar>
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Photo"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG up to 5MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Email: {user?.email}
                  </p>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* License Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-4 w-4" />
              License Information
            </CardTitle>
            <CardDescription>
              Your real estate license details for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...agentForm}>
              <form onSubmit={agentForm.handleSubmit(handleAgentSubmit)} className="space-y-4">
                <FormField
                  control={agentForm.control}
                  name="license_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={agentForm.control}
                  name="brokerage_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brokerage Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={agentForm.control}
                  name="brokerage_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brokerage Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save License Info
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
