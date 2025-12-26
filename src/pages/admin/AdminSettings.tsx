import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings,
  Loader2,
  Save
} from "lucide-react";

interface AppSettings {
  listing_price: number;
  renewal_price: number;
  featured_price: number;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    listing_price: 99,
    renewal_price: 49,
    featured_price: 29,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value");

      if (error) throw error;

      const settingsMap: Partial<AppSettings> = {};
      data?.forEach((item) => {
        if (item.key === "listing_price") settingsMap.listing_price = item.value as number;
        if (item.key === "renewal_price") settingsMap.renewal_price = item.value as number;
        if (item.key === "featured_price") settingsMap.featured_price = item.value as number;
      });

      setSettings(prev => ({ ...prev, ...settingsMap }));
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsToSave = [
        { key: "listing_price", value: settings.listing_price },
        { key: "renewal_price", value: settings.renewal_price },
        { key: "featured_price", value: settings.featured_price },
      ];

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from("app_settings")
          .upsert(
            { key: setting.key, value: setting.value, updated_at: new Date().toISOString() },
            { onConflict: "key" }
          );

        if (error) throw error;
      }

      toast({
        title: "Settings Saved",
        description: "Pricing settings have been updated",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure platform settings and pricing</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pricing Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Pricing
                </CardTitle>
                <CardDescription>
                  Set the prices for listing publication and features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="listing_price">Listing Publication Price (CAD)</Label>
                  <Input
                    id="listing_price"
                    type="number"
                    min="0"
                    step="1"
                    value={settings.listing_price}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      listing_price: Number(e.target.value) 
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Price agents pay to publish a new listing
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="renewal_price">Renewal Price (CAD)</Label>
                  <Input
                    id="renewal_price"
                    type="number"
                    min="0"
                    step="1"
                    value={settings.renewal_price}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      renewal_price: Number(e.target.value) 
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Price agents pay to renew an expired listing
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="featured_price">Featured Listing Price (CAD)</Label>
                  <Input
                    id="featured_price"
                    type="number"
                    min="0"
                    step="1"
                    value={settings.featured_price}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      featured_price: Number(e.target.value) 
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Additional price for featuring a listing
                  </p>
                </div>

                <Button onClick={saveSettings} disabled={saving} className="w-full">
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Settings
                </Button>
              </CardContent>
            </Card>

            {/* Platform Info */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Information</CardTitle>
                <CardDescription>
                  Current platform statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Listing Duration</p>
                    <p className="font-medium">365 days</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Currency</p>
                    <p className="font-medium">CAD</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Publishing Requirements</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Agent must be verified</li>
                    <li>• Payment must be completed</li>
                    <li>• Admin must approve listing</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
