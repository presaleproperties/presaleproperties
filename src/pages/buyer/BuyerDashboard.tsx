import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Crown, Heart, Bell, Settings, LogOut, Building2, MapPin, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBuyerAuth, BuyerProfile } from "@/hooks/useBuyerAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { generateProjectUrl } from "@/lib/seoUrls";

interface SavedProject {
  id: string;
  project_id: string;
  notes: string | null;
  created_at: string;
  project: {
    id: string;
    name: string;
    city: string;
    neighborhood: string | null;
    main_image_url: string | null;
    price_from: number | null;
    status: string;
    slug: string;
    project_type: string | null;
  };
}

const BuyerDashboard = () => {
  const { user, buyerProfile, loading, isVIP, signOut, updateProfile } = useBuyerAuth();
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/buyer/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchSavedProjects = async () => {
      if (!buyerProfile) return;

      const { data, error } = await supabase
        .from("saved_projects")
        .select(`
          id,
          project_id,
          notes,
          created_at,
          project:presale_projects(
            id,
            name,
            city,
            neighborhood,
            main_image_url,
            price_from,
            status,
            slug,
            project_type
          )
        `)
        .eq("buyer_id", buyerProfile.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSavedProjects(data as unknown as SavedProject[]);
      }
      setLoadingProjects(false);
    };

    fetchSavedProjects();
  }, [buyerProfile]);

  const handleToggleAlerts = async (enabled: boolean) => {
    const { error } = await updateProfile({ alerts_enabled: enabled });
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update alert preferences.",
        variant: "destructive",
      });
    } else {
      toast({
        title: enabled ? "Alerts enabled" : "Alerts disabled",
        description: enabled
          ? "You'll receive notifications about new projects."
          : "You won't receive project notifications.",
      });
    }
  };

  const handleRemoveSaved = async (savedId: string) => {
    const { error } = await supabase
      .from("saved_projects")
      .delete()
      .eq("id", savedId);

    if (!error) {
      setSavedProjects((prev) => prev.filter((p) => p.id !== savedId));
      toast({
        title: "Removed",
        description: "Project removed from your saved list.",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !buyerProfile) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>My Dashboard | Presale Properties</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <ConversionHeader />

      <main className="min-h-screen bg-muted/30 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                Welcome, {buyerProfile.full_name?.split(" ")[0] || "VIP Member"}
                {isVIP && <Crown className="w-6 h-6 text-primary" />}
              </h1>
              <p className="text-muted-foreground">
                Manage your saved projects and preferences
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Crown className="w-3 h-3 mr-1" />
                VIP Member
              </Badge>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{savedProjects.length}</p>
                    <p className="text-sm text-muted-foreground">Saved Projects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <Crown className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">$1,500</p>
                    <p className="text-sm text-muted-foreground">Closing Credit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                    <Bell className="w-6 h-6 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {buyerProfile.alerts_enabled ? "On" : "Off"}
                    </p>
                    <p className="text-sm text-muted-foreground">Project Alerts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Saved Projects */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Saved Projects
                  </CardTitle>
                  <Button asChild size="sm">
                    <Link to="/presale-projects">
                      <Plus className="w-4 h-4 mr-1" />
                      Browse Projects
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingProjects ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : savedProjects.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground mb-4">
                        You haven't saved any projects yet.
                      </p>
                      <Button asChild>
                        <Link to="/presale-projects">Browse Projects</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {savedProjects.map((saved) => (
                        <div
                          key={saved.id}
                          className="flex gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <img
                            src={saved.project.main_image_url || "/placeholder.svg"}
                            alt={saved.project.name}
                            className="w-24 h-20 object-cover rounded-md"
                          />
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/presale-projects/${saved.project.slug}`}
                              className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                            >
                              {saved.project.name}
                            </Link>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {saved.project.neighborhood || saved.project.city}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {saved.project.status}
                              </Badge>
                              {saved.project.price_from && (
                                <span className="text-sm font-medium text-primary">
                                  From ${(saved.project.price_from / 1000).toFixed(0)}K
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveSaved(saved.id)}
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Settings Sidebar */}
            <div className="space-y-6">
              {/* Alert Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="w-4 h-4" />
                    Alert Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="alerts" className="flex-1">
                      Project Alerts
                      <p className="text-xs text-muted-foreground font-normal">
                        Get notified about new projects
                      </p>
                    </Label>
                    <Switch
                      id="alerts"
                      checked={buyerProfile.alerts_enabled}
                      onCheckedChange={handleToggleAlerts}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Profile Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="w-4 h-4" />
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{buyerProfile.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{buyerProfile.phone || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Buyer Type</span>
                    <span className="font-medium capitalize">
                      {buyerProfile.buyer_type?.replace("_", " ") || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VIP Since</span>
                    <span className="font-medium">
                      {buyerProfile.vip_joined_at
                        ? new Date(buyerProfile.vip_joined_at).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* VIP Benefits */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-primary">
                    <Crown className="w-4 h-4" />
                    Your VIP Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Early access to new presales
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Exclusive VIP pricing
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      $1,500 closing credit
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Priority project notifications
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default BuyerDashboard;
