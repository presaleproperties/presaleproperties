import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings,
  Loader2,
  Save,
  MessageCircle,
  Webhook,
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from "lucide-react";

interface AppSettings {
  listing_price: number;
  renewal_price: number;
  featured_price: number;
  whatsapp_number: string;
  zapier_project_leads_webhook: string;
  zapier_listing_leads_webhook: string;
  zapier_bookings_webhook: string;
  lofty_tracking_webhook: string;
  email_sender: string;
  email_domain_verified: boolean;
}

const DEFAULT_SENDER = "PresaleProperties <onboarding@resend.dev>";

export default function AdminSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    listing_price: 99,
    renewal_price: 49,
    featured_price: 29,
    whatsapp_number: "",
    zapier_project_leads_webhook: "",
    zapier_listing_leads_webhook: "",
    zapier_bookings_webhook: "",
    lofty_tracking_webhook: "",
    email_sender: DEFAULT_SENDER,
    email_domain_verified: false,
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
        if (item.key === "whatsapp_number") settingsMap.whatsapp_number = item.value as string;
        if (item.key === "zapier_project_leads_webhook") settingsMap.zapier_project_leads_webhook = item.value as string;
        if (item.key === "zapier_listing_leads_webhook") settingsMap.zapier_listing_leads_webhook = item.value as string;
        if (item.key === "zapier_bookings_webhook") settingsMap.zapier_bookings_webhook = item.value as string;
        if (item.key === "lofty_tracking_webhook") settingsMap.lofty_tracking_webhook = item.value as string;
        if (item.key === "email_sender") settingsMap.email_sender = item.value as string;
        if (item.key === "email_domain_verified") settingsMap.email_domain_verified = item.value as boolean;
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
        { key: "whatsapp_number", value: settings.whatsapp_number },
        { key: "zapier_project_leads_webhook", value: settings.zapier_project_leads_webhook },
        { key: "zapier_listing_leads_webhook", value: settings.zapier_listing_leads_webhook },
        { key: "zapier_bookings_webhook", value: settings.zapier_bookings_webhook },
        { key: "lofty_tracking_webhook", value: settings.lofty_tracking_webhook },
        { key: "email_sender", value: settings.email_sender },
        { key: "email_domain_verified", value: settings.email_domain_verified },
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
        description: "All settings have been updated",
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

  const isUsingCustomDomain = settings.email_sender !== DEFAULT_SENDER && !settings.email_sender.includes("resend.dev");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure platform settings and integrations</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Email Sender Configuration */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Sender Configuration
                </CardTitle>
                <CardDescription>
                  Configure the sender address for all outbound emails (leads, bookings, password resets)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Sender Email Input */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email_sender">Email Sender Address</Label>
                      <Input
                        id="email_sender"
                        type="text"
                        placeholder="Brand Name <noreply@yourdomain.com>"
                        value={settings.email_sender}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          email_sender: e.target.value 
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Format: <code className="bg-muted px-1 py-0.5 rounded">Brand Name &lt;email@domain.com&gt;</code>
                      </p>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      {isUsingCustomDomain ? (
                        settings.email_domain_verified ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        )
                      ) : (
                        <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <div className="text-sm">
                        {isUsingCustomDomain ? (
                          settings.email_domain_verified ? (
                            <p className="text-green-700 font-medium">Custom domain verified and active</p>
                          ) : (
                            <p className="text-amber-700">Custom domain not yet verified — emails may fail to send</p>
                          )
                        ) : (
                          <p className="text-muted-foreground">Using default Resend sender (recommended for testing)</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Domain Verification Checklist */}
                  <div className="space-y-4">
                    <Label className="text-base">Domain Verification Checklist</Label>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="step1"
                          checked={settings.email_domain_verified}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            email_domain_verified: !!checked
                          }))}
                        />
                        <label htmlFor="step1" className="leading-tight cursor-pointer">
                          <span className="font-medium">Domain added & verified in Resend</span>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            Add your domain at resend.com/domains and add the required DNS records
                          </p>
                        </label>
                      </div>

                      <div className="flex items-start gap-3">
                        <Checkbox id="step2" disabled />
                        <label htmlFor="step2" className="leading-tight text-muted-foreground">
                          <span className="font-medium">SPF record configured</span>
                          <p className="text-xs mt-0.5">Resend provides TXT record for SPF</p>
                        </label>
                      </div>

                      <div className="flex items-start gap-3">
                        <Checkbox id="step3" disabled />
                        <label htmlFor="step3" className="leading-tight text-muted-foreground">
                          <span className="font-medium">DKIM record configured</span>
                          <p className="text-xs mt-0.5">Resend provides CNAME records for DKIM</p>
                        </label>
                      </div>

                      <div className="flex items-start gap-3">
                        <Checkbox id="step4" disabled />
                        <label htmlFor="step4" className="leading-tight text-muted-foreground">
                          <span className="font-medium">DMARC record (optional)</span>
                          <p className="text-xs mt-0.5">Recommended for improved deliverability</p>
                        </label>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Resend Domains
                      </a>
                    </Button>
                  </div>
                </div>

                <Button onClick={saveSettings} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Email Settings
                </Button>
              </CardContent>
            </Card>

            {/* Zapier Integration */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Zapier / Lofty CRM Integration
                </CardTitle>
                <CardDescription>
                  Configure webhook URLs to send leads, bookings, and behavioral tracking to your CRM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Behavioral Tracking */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Behavioral Tracking</h4>
                  <div className="space-y-2">
                    <Label htmlFor="lofty_tracking_webhook">Page View Tracking Webhook</Label>
                    <Input
                      id="lofty_tracking_webhook"
                      type="url"
                      placeholder="https://hooks.zapier.com/..."
                      value={settings.lofty_tracking_webhook}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        lofty_tracking_webhook: e.target.value 
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tracks page views, property views, and visitor behavior. Includes visitor ID, session ID, page URL, and project details.
                    </p>
                  </div>
                </div>

                {/* Lead & Booking Webhooks */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Lead & Booking Webhooks</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="zapier_project_leads_webhook">Project Leads Webhook</Label>
                      <Input
                        id="zapier_project_leads_webhook"
                        type="url"
                        placeholder="https://hooks.zapier.com/..."
                        value={settings.zapier_project_leads_webhook}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          zapier_project_leads_webhook: e.target.value 
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Receives leads from presale project pages
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zapier_listing_leads_webhook">Listing Leads Webhook</Label>
                      <Input
                        id="zapier_listing_leads_webhook"
                        type="url"
                        placeholder="https://hooks.zapier.com/..."
                        value={settings.zapier_listing_leads_webhook}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          zapier_listing_leads_webhook: e.target.value 
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Receives leads from assignment listing pages
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zapier_bookings_webhook">Bookings Webhook</Label>
                      <Input
                        id="zapier_bookings_webhook"
                        type="url"
                        placeholder="https://hooks.zapier.com/..."
                        value={settings.zapier_bookings_webhook}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          zapier_bookings_webhook: e.target.value 
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Receives booking/appointment requests
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={saveSettings} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Webhook Settings
                </Button>
              </CardContent>
            </Card>

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

            {/* WhatsApp Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp Integration
                </CardTitle>
                <CardDescription>
                  Configure the WhatsApp number for lead follow-up
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number">WhatsApp Phone Number</Label>
                  <Input
                    id="whatsapp_number"
                    type="tel"
                    placeholder="16045551234"
                    value={settings.whatsapp_number}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      whatsapp_number: e.target.value.replace(/\D/g, '')
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter with country code, no spaces or dashes (e.g., 16045551234 for +1 604-555-1234)
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
