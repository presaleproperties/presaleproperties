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
  ExternalLink,
  Zap,
  Palette,
  Download
} from "lucide-react";
import { generateBrandKitPdf } from "@/lib/generateBrandKitPdf";

interface AppSettings {
  listing_price: number;
  renewal_price: number;
  featured_price: number;
  whatsapp_number: string;
  zapier_project_leads_webhook: string;
  zapier_listing_leads_webhook: string;
  zapier_bookings_webhook: string;
  zapier_social_webhook: string;
  zapier_research_webhook: string;
  lofty_tracking_webhook: string;
  zapier_behavior_webhook: string;
  zapier_daily_digest_webhook: string;
  meta_pixel_id: string;
  ga4_measurement_id: string;
  email_sender: string;
  email_domain_verified: boolean;
  admin_notification_email: string;
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
    zapier_social_webhook: "",
    zapier_research_webhook: "",
    lofty_tracking_webhook: "",
    zapier_behavior_webhook: "",
    zapier_daily_digest_webhook: "",
    meta_pixel_id: "",
    ga4_measurement_id: "",
    email_sender: DEFAULT_SENDER,
    email_domain_verified: false,
    admin_notification_email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const { toast } = useToast();

  const testBehaviorWebhook = async () => {
    if (!settings.zapier_behavior_webhook) {
      toast({
        title: "No Webhook Configured",
        description: "Please enter and save your Behavior Events Webhook URL first",
        variant: "destructive",
      });
      return;
    }

    setTestingWebhook(true);
    try {
      const testPayload = {
        event_type: "test_connection",
        event_name: "webhook_test",
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        page_title: "Admin Settings - Test Connection",
        visitor_id: "test_" + Date.now(),
        session_id: "test_session_" + Date.now(),
        test: true,
        message: "This is a test event from PresaleProperties Admin Settings",
      };

      // Send via edge function to bypass CORS
      const { error } = await supabase.functions.invoke("send-behavior-event", {
        body: testPayload,
      });

      if (error) throw error;

      toast({
        title: "Test Event Sent! ✓",
        description: "Check your Zapier Zap History to confirm receipt",
      });
    } catch (error) {
      console.error("Error testing webhook:", error);
      toast({
        title: "Test Failed",
        description: "Could not send test event. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setTestingWebhook(false);
    }
  };

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
        if (item.key === "zapier_social_webhook") settingsMap.zapier_social_webhook = item.value as string;
        if (item.key === "zapier_research_webhook") settingsMap.zapier_research_webhook = item.value as string;
        if (item.key === "lofty_tracking_webhook") settingsMap.lofty_tracking_webhook = item.value as string;
        if (item.key === "zapier_behavior_webhook") settingsMap.zapier_behavior_webhook = item.value as string;
        if (item.key === "zapier_daily_digest_webhook") settingsMap.zapier_daily_digest_webhook = item.value as string;
        if (item.key === "meta_pixel_id") settingsMap.meta_pixel_id = item.value as string;
        if (item.key === "ga4_measurement_id") settingsMap.ga4_measurement_id = item.value as string;
        if (item.key === "email_sender") settingsMap.email_sender = item.value as string;
        if (item.key === "email_domain_verified") settingsMap.email_domain_verified = item.value as boolean;
        if (item.key === "admin_notification_email") settingsMap.admin_notification_email = item.value as string;
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
        { key: "zapier_social_webhook", value: settings.zapier_social_webhook },
        { key: "zapier_research_webhook", value: settings.zapier_research_webhook },
        { key: "lofty_tracking_webhook", value: settings.lofty_tracking_webhook },
        { key: "zapier_behavior_webhook", value: settings.zapier_behavior_webhook },
        { key: "zapier_daily_digest_webhook", value: settings.zapier_daily_digest_webhook },
        { key: "meta_pixel_id", value: settings.meta_pixel_id },
        { key: "ga4_measurement_id", value: settings.ga4_measurement_id },
        { key: "email_sender", value: settings.email_sender },
        { key: "email_domain_verified", value: settings.email_domain_verified },
        { key: "admin_notification_email", value: settings.admin_notification_email },
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
            {/* Email Configuration - Gmail SMTP */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Transactional emails are sent via Gmail SMTP through Google Workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-green-800 font-medium">Gmail SMTP Active</p>
                    <p className="text-green-700 mt-1">
                      All emails send from <code className="bg-green-100 px-1 py-0.5 rounded">info@presaleproperties.com</code> via Google Workspace.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Current Configuration</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Sender: <code className="bg-muted px-1 rounded">Presale Properties</code></li>
                      <li>• Email: <code className="bg-muted px-1 rounded">info@presaleproperties.com</code></li>
                      <li>• SMTP: Gmail (Port 465, TLS)</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Email Templates & Workflows</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Manage transactional email templates and automated workflows.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href="/admin/email-templates">
                          Email Templates
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/admin/email-workflows">
                          Workflows
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Admin Notifications */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium">Admin Notifications</h4>
                  <div className="space-y-2">
                    <Label htmlFor="admin_notification_email">Property Alert Notifications</Label>
                    <Input
                      id="admin_notification_email"
                      type="email"
                      placeholder="your@email.com"
                      value={settings.admin_notification_email}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        admin_notification_email: e.target.value 
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Receive a notification whenever property alerts are sent to clients
                    </p>
                  </div>
                </div>
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
                  <h4 className="font-medium text-sm">Behavioral Tracking (Optimized)</h4>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                    <p className="text-xs text-green-800">
                      <strong>✓ Optimized for Zapier credits:</strong> Only form submissions trigger real-time webhooks. All other events are stored locally and sent as a daily digest report (1 Zap per visitor per day instead of dozens).
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="zapier_behavior_webhook">Real-Time Form Submissions</Label>
                      <Input
                        id="zapier_behavior_webhook"
                        type="url"
                        placeholder="https://hooks.zapier.com/..."
                        value={settings.zapier_behavior_webhook}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          zapier_behavior_webhook: e.target.value 
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        <strong>Only form_submit events</strong> trigger this webhook immediately. Includes full contact info, intent score, and behavior summary.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zapier_daily_digest_webhook">Daily Visitor Digest (Recommended)</Label>
                      <Input
                        id="zapier_daily_digest_webhook"
                        type="url"
                        placeholder="https://hooks.zapier.com/..."
                        value={settings.zapier_daily_digest_webhook}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          zapier_daily_digest_webhook: e.target.value 
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        <strong>Daily report at 7 AM PST</strong> with all visitors, properties viewed, intent scores, and engagement metrics. One Zap per day.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Legacy Tracking */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Legacy Tracking</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="lofty_tracking_webhook" className="text-muted-foreground">Page View Tracking (Deprecated)</Label>
                      <Input
                        id="lofty_tracking_webhook"
                        type="url"
                        placeholder="https://hooks.zapier.com/..."
                        value={settings.lofty_tracking_webhook}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          lofty_tracking_webhook: e.target.value 
                        }))}
                        className="opacity-60"
                      />
                      <p className="text-xs text-muted-foreground">
                        Legacy page view tracking. Consider removing to save credits.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Meta Pixel */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Retargeting Pixels</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="meta_pixel_id">Meta Pixel ID</Label>
                      <Input
                        id="meta_pixel_id"
                        type="text"
                        placeholder="123456789012345"
                        value={settings.meta_pixel_id}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          meta_pixel_id: e.target.value 
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Facebook/Meta Pixel ID for retargeting. Find it in your Meta Events Manager.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ga4_measurement_id">Google Analytics 4 ID</Label>
                      <Input
                        id="ga4_measurement_id"
                        type="text"
                        placeholder="G-XXXXXXXXXX"
                        value={settings.ga4_measurement_id}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          ga4_measurement_id: e.target.value 
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        GA4 Measurement ID. Find it in Analytics → Admin → Data Streams.
                      </p>
                    </div>
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

                {/* Social Media Automation */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Social Media & Research Automation</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="zapier_social_webhook">New Project Notification Webhook</Label>
                      <Input
                        id="zapier_social_webhook"
                        type="url"
                        placeholder="https://hooks.zapier.com/..."
                        value={settings.zapier_social_webhook}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          zapier_social_webhook: e.target.value 
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        <strong>Social posting:</strong> When you publish a project, a formatted notification with ready-to-post Marketplace description, images, and hashtags is sent here.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zapier_research_webhook">Research Import Webhook</Label>
                      <Input
                        id="zapier_research_webhook"
                        type="url"
                        placeholder="https://hooks.zapier.com/..."
                        value={settings.zapier_research_webhook}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          zapier_research_webhook: e.target.value 
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        <strong>WhatsApp → Blog:</strong> Send MLA/Rennie research links via WhatsApp → Zapier webhook. Auto-generates blog drafts and updates market data.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={saveSettings} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Webhook Settings
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={testBehaviorWebhook} 
                    disabled={testingWebhook || !settings.zapier_behavior_webhook}
                  >
                    {testingWebhook ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                </div>
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

            {/* Brand Kit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Brand Kit
                </CardTitle>
                <CardDescription>
                  Download brand assets and guidelines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/10 to-transparent">
                  <h4 className="font-medium mb-2">Brand Identity Package</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete brand guidelines including colors, typography, logo usage, and UI specifications.
                  </p>
                  <Button 
                    onClick={() => generateBrandKitPdf()}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Brand Kit PDF
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Includes:</p>
                  <ul className="space-y-1">
                    <li>• Color palette with hex & HSL values</li>
                    <li>• Typography system</li>
                    <li>• Logo usage guidelines</li>
                    <li>• UI component specifications</li>
                    <li>• Brand voice & tone</li>
                  </ul>
                </div>
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
