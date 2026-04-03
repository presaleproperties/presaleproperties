import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Server, Database, Cloud, Mail, Map, Globe, Search, BarChart3,
  Shield, Image, FileText, Clock, Webhook, Bot, Megaphone,
  CreditCard, Users, Key, HardDrive, Zap, ExternalLink, Info,
  Layers, Code2, Palette, MonitorSmartphone,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

/* ── Helpers ─────────────────────────────────────────────────── */

interface SystemItem {
  name: string;
  description: string;
  role: string;
  status?: "active" | "configured" | "dormant" | "issue";
  link?: string;
}

interface SecretItem {
  name: string;
  purpose: string;
  usedBy: string;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
  configured: "bg-blue-500/15 text-blue-700 border-blue-200",
  dormant: "bg-amber-500/15 text-amber-700 border-amber-200",
  issue: "bg-destructive/15 text-destructive border-destructive/20",
};

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <Badge variant="outline" className={`text-[10px] ${statusColors[status] || ""}`}>
      {status}
    </Badge>
  );
}

function SystemCard({ icon: Icon, title, description, items, iconColor }: {
  icon: any; title: string; description: string;
  items: SystemItem[]; iconColor: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.name} className="rounded-lg border bg-muted/20 p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {item.name}
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </p>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1 italic">Role: {item.role}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Data ─────────────────────────────────────────────────────── */

const hostingPlatform: SystemItem[] = [
  { name: "Lovable Cloud", description: "Full-stack hosting platform that runs our frontend, backend functions, database, and file storage. Built on Supabase's open-source foundation.", role: "Primary hosting & deployment", status: "active", link: "https://lovable.dev" },
  { name: "React + Vite + TypeScript", description: "Our frontend framework. React handles the UI, Vite provides fast builds, TypeScript adds type safety.", role: "Frontend application framework", status: "active" },
  { name: "Tailwind CSS + shadcn/ui", description: "Utility-first CSS framework with a pre-built component library. Powers all our design tokens, layouts, and UI components.", role: "Styling & design system", status: "active" },
];

const databaseSystems: SystemItem[] = [
  { name: "PostgreSQL Database", description: "Our main database stores all projects, listings, leads, bookings, clients, blog posts, market data, and user accounts. Row Level Security (RLS) protects all data.", role: "Primary data store", status: "active" },
  { name: "Row Level Security (RLS)", description: "Every table has security policies that control who can read/write data. Admins get full access, public users only see published content.", role: "Data access control", status: "active" },
  { name: "Database Functions (RPCs)", description: "Server-side functions for complex operations like engagement analytics, role checking, and view counting. Run inside the database for performance.", role: "Business logic & analytics", status: "active" },
];

const fileStorage: SystemItem[] = [
  { name: "listing-photos", description: "Agent-uploaded listing images for assignment sales.", role: "Listing image storage", status: "active" },
  { name: "listing-files", description: "Listing documents like floor plans and brochures.", role: "Listing document storage", status: "active" },
  { name: "blog-images", description: "Featured images and media for blog posts / guides.", role: "Blog media storage", status: "active" },
  { name: "avatars", description: "User profile photos for agents and buyers.", role: "Profile image storage", status: "active" },
  { name: "email-assets", description: "Logos and images used in email templates.", role: "Email branding assets", status: "active" },
  { name: "branding", description: "Site-wide branding assets (logos, favicons, OG images).", role: "Brand asset storage", status: "active" },
];

const externalAPIs: SystemItem[] = [
  { name: "CREA DDF API", description: "Canadian Real Estate Association Data Distribution Facility. Feeds 39,000+ MLS listings into our database daily. Uses DDF_USERNAME, DDF_PASSWORD, DDF_FEED_URL.", role: "MLS listing data source", status: "active" },
  { name: "Google Maps API", description: "Geocodes property addresses to lat/lng coordinates for map display. Uses GOOGLE_MAPS_API_KEY. Runs 3x daily in batches of 100.", role: "Address geocoding", status: "active" },
  { name: "Mapbox", description: "Powers our interactive property map search experience. Uses MAPBOX_ACCESS_TOKEN for map tiles and search.", role: "Map display & search UI", status: "active" },
  { name: "Resend", description: "Transactional email delivery service. Sends all system emails (lead notifications, welcome emails, drip campaigns, booking confirmations). Uses RESEND_API_KEY.", role: "Email delivery", status: "active", link: "https://resend.com" },
  { name: "Gmail SMTP", description: "Backup/alternative email sending via Gmail. Uses GMAIL_SMTP_USER and GMAIL_SMTP_PASSWORD.", role: "Backup email delivery", status: "configured" },
  { name: "Lofty CRM API", description: "Direct API integration with Lofty (formerly Chime) CRM for contact search and lead enrichment. Uses LOFTY_API_KEY.", role: "CRM data lookup", status: "active", link: "https://www.lofty.com" },
  { name: "Meta Conversions API", description: "Server-side Facebook/Instagram event tracking for ad attribution. Sends lead and conversion events. Uses META_ACCESS_TOKEN.", role: "Ad conversion tracking", status: "active" },
  { name: "Firecrawl", description: "Web scraping service used to extract project information from developer websites. Uses FIRECRAWL_API_KEY.", role: "Developer site scraping", status: "configured", link: "https://firecrawl.dev" },
  { name: "Lovable AI", description: "Built-in AI models (Gemini, GPT) for content generation, project descriptions, SEO optimization, and blog image generation. Uses LOVABLE_API_KEY.", role: "AI content generation", status: "active" },
];

const zapierIntegrations: SystemItem[] = [
  { name: "Project Lead → Lofty", description: "When a new lead is captured, it's sent via ZAPIER_PROJECT_LEADS_WEBHOOK to create/update a contact in Lofty CRM with tags, notes, and attribution data.", role: "CRM lead sync (primary)", status: "active" },
  { name: "Listing Lead → Lofty", description: "Assignment listing inquiries are sent via ZAPIER_LISTING_LEADS_WEBHOOK to Lofty CRM with listing-specific context.", role: "CRM listing inquiry sync", status: "active" },
  { name: "Social Post Automation", description: "When a new project is published, formatted listing data is sent to Zapier for distribution to Facebook Marketplace and social channels.", role: "Social media automation", status: "configured" },
];

const cronJobs = [
  { id: 1, name: "Expiring Listings Check", schedule: "Daily 9:00 AM UTC", description: "Scans assignment listings nearing expiration and sends notifications." },
  { id: 2, name: "MLS Listing Sync (Primary)", schedule: "Daily 6:00 AM UTC", description: "Full sync of new construction listings from CREA DDF. Processes up to 40K+ records." },
  { id: 3, name: "MLS Listing Sync (Secondary)", schedule: "Daily 11:00 AM UTC", description: "Second daily sync for Metro Vancouver residential listings." },
  { id: 4, name: "MLS Agent Sync", schedule: "Daily 12:00 PM UTC", description: "Syncs listing agent and office data from DDF for attribution." },
  { id: 5, name: "Geocoding Batch 1", schedule: "Daily 1:00 PM UTC", description: "Geocodes 100 listings missing coordinates via Google Maps API." },
  { id: 6, name: "Geocoding Batch 2", schedule: "Daily 1:30 PM UTC", description: "Second geocoding batch for any remaining un-geocoded listings." },
  { id: 7, name: "Geocoding Batch 3", schedule: "Daily 2:00 PM UTC", description: "Third and final daily geocoding batch." },
  { id: 8, name: "Daily Property Alerts", schedule: "Daily 5:00 PM UTC", description: "Sends personalized new listing alerts to buyers with daily frequency preference." },
  { id: 9, name: "Weekly Property Alerts", schedule: "Mondays 5:00 PM UTC", description: "Sends weekly digest of new listings matching buyer preferences." },
  { id: 10, name: "Daily Visitor Digest", schedule: "Daily 3:00 PM UTC", description: "Emails admin a summary of top viewed projects and visitor activity." },
  { id: 16, name: "SEO Health Check", schedule: "Mondays 2:00 PM UTC", description: "Automated sitemap audit, indexation check, and content quality analysis." },
  { id: 19, name: "Expired Listings Processor", schedule: "Daily 12:00 AM UTC", description: "Marks expired assignment listings and handles cleanup." },
];

const edgeFunctions = [
  { category: "MLS & Data", functions: [
    { name: "sync-mls-data", desc: "Pulls listings from CREA DDF API into database" },
    { name: "sync-mls-agents", desc: "Syncs agent/office data from DDF" },
    { name: "geocode-mls-listings", desc: "Batch geocodes addresses via Google Maps" },
    { name: "geocode-address", desc: "Single address geocoding" },
    { name: "calculate-price-sqft", desc: "Calculates verified price/sqft from MLS data" },
    { name: "check-expiring-listings", desc: "Finds soon-to-expire assignment listings" },
    { name: "process-expired-listings", desc: "Handles expired listing cleanup" },
  ]},
  { category: "Email System", functions: [
    { name: "process-email-queue", desc: "Processes queued emails via Resend" },
    { name: "send-lead-notification", desc: "Admin alert when new lead arrives" },
    { name: "send-project-lead", desc: "Sends lead to Zapier/CRM with tags" },
    { name: "send-booking-notification", desc: "Booking confirmation to admin" },
    { name: "send-booking-status-update", desc: "Status change email to client" },
    { name: "send-welcome-email", desc: "Welcome email to new users" },
    { name: "send-buyer-welcome", desc: "VIP buyer welcome sequence" },
    { name: "send-verification-code", desc: "Email OTP verification" },
    { name: "send-drip-email", desc: "Automated nurture drip emails" },
    { name: "send-property-alerts", desc: "Personalized new listing alerts" },
    { name: "send-daily-visitor-digest", desc: "Admin daily traffic summary" },
    { name: "send-campaign-email", desc: "Bulk campaign email sender" },
    { name: "send-contact-email", desc: "Contact form handler" },
    { name: "send-property-email", desc: "Property inquiry email" },
    { name: "send-inquiry-notification", desc: "Agent inquiry notification" },
    { name: "send-test-email", desc: "Email template testing" },
    { name: "send-admin-reset", desc: "Admin password reset email" },
    { name: "send-blog-draft-notification", desc: "Blog draft ready notification" },
    { name: "send-social-notification", desc: "Social post automation via Zapier" },
    { name: "process-buyer-drip", desc: "Buyer drip sequence processor" },
    { name: "trigger-workflow", desc: "Email workflow trigger dispatcher" },
    { name: "track-email-open", desc: "Tracks email open events" },
  ]},
  { category: "AI & Content", functions: [
    { name: "ai-project-search", desc: "AI-powered natural language project search" },
    { name: "ai-recommendations", desc: "Personalized project recommendations" },
    { name: "generate-blog-images", desc: "AI-generated featured images for blogs" },
    { name: "generate-market-blog", desc: "AI-generated market analysis articles" },
    { name: "generate-project-seo", desc: "AI-generated SEO titles & descriptions" },
    { name: "enrich-project-content", desc: "AI content enrichment for projects" },
    { name: "format-description", desc: "AI formatting for project descriptions" },
    { name: "parse-social-post", desc: "Formats project data for social posts" },
  ]},
  { category: "SEO & Sitemap", functions: [
    { name: "generate-sitemap", desc: "Dynamic sitemap generation for 1000+ pages" },
    { name: "generate-image-sitemap", desc: "Image sitemap for visual search" },
    { name: "seo-health-check", desc: "Automated weekly SEO audit" },
    { name: "og-property-meta", desc: "Dynamic Open Graph meta for property shares" },
  ]},
  { category: "Scraping & Import", functions: [
    { name: "scrape-project-website", desc: "Extracts project info from developer sites" },
    { name: "scrape-research-report", desc: "Parses market research documents" },
    { name: "parse-project-brochure", desc: "Extracts data from project PDFs" },
    { name: "parse-assignment-brochure", desc: "Parses assignment sale brochures" },
    { name: "parse-market-stats", desc: "Extracts market stats from reports" },
    { name: "parse-snapstats-pdf", desc: "Parses SnapStats market PDFs" },
    { name: "analyze-brochure-images", desc: "AI analysis of brochure visuals" },
    { name: "fetch-developer-logo", desc: "Auto-fetches developer brand logos" },
    { name: "fetch-drive-folder", desc: "Google Drive folder import" },
    { name: "import-drive-files", desc: "Imports files from Google Drive" },
    { name: "sort-project-images", desc: "AI-sorts project gallery images" },
    { name: "remove-floorplan-images", desc: "Removes floorplan images from gallery" },
    { name: "process-research-webhook", desc: "Processes incoming research data" },
  ]},
  { category: "Tracking & Analytics", functions: [
    { name: "send-behavior-event", desc: "Tracks user behavior (views, clicks, searches)" },
    { name: "track-client-activity", desc: "Server-side activity tracking + Lofty/Zapier sync" },
    { name: "meta-conversions-api", desc: "Facebook server-side conversion tracking" },
    { name: "search-lofty-contacts", desc: "Search Lofty CRM contacts" },
    { name: "sync-lead-to-lofty", desc: "Direct lead sync to Lofty" },
    { name: "verify-email-code", desc: "OTP email verification" },
  ]},
];

const databaseTables = [
  { category: "Core Content", tables: ["presale_projects", "blog_posts", "developers", "google_reviews"] },
  { category: "MLS Data", tables: ["mls_listings (39K+)", "mls_agents", "mls_offices", "mls_price_history", "mls_sync_logs"] },
  { category: "Leads & CRM", tables: ["project_leads", "bookings", "clients", "client_activity (29K+)", "newsletter_subscribers", "buyer_profiles", "saved_projects", "saved_listings"] },
  { category: "Email System", tables: ["email_templates", "email_workflows", "email_workflow_steps", "email_jobs", "email_logs", "email_campaigns", "buyer_drip_emails", "email_verification_codes"] },
  { category: "Market Intelligence", tables: ["city_market_stats", "market_data", "cmhc_rental_data"] },
  { category: "Operations", tables: ["admin_tasks", "app_settings", "user_roles", "support_tickets", "seo_health_checks", "geocoding_logs", "scheduler_settings", "scheduler_availability", "scheduler_blocked_dates"] },
  { category: "Agent Portal", tables: ["listings*", "listing_photos*", "listing_files*", "agent_profiles*", "assignment_inquiries*", "payments*"] },
];

const secrets: SecretItem[] = [
  { name: "DDF_USERNAME / DDF_PASSWORD / DDF_FEED_URL", purpose: "CREA DDF API access for MLS data", usedBy: "sync-mls-data, sync-mls-agents" },
  { name: "GOOGLE_MAPS_API_KEY", purpose: "Address geocoding", usedBy: "geocode-mls-listings, geocode-address" },
  { name: "MAPBOX_ACCESS_TOKEN", purpose: "Interactive map tiles & search", usedBy: "Frontend map components" },
  { name: "RESEND_API_KEY", purpose: "Transactional email delivery", usedBy: "All send-* edge functions" },
  { name: "GMAIL_SMTP_USER / GMAIL_SMTP_PASSWORD", purpose: "Backup email via Gmail SMTP", usedBy: "Email fallback" },
  { name: "LOFTY_API_KEY", purpose: "CRM contact search & sync", usedBy: "search-lofty-contacts, sync-lead-to-lofty" },
  { name: "META_ACCESS_TOKEN", purpose: "Facebook/Instagram conversion tracking", usedBy: "meta-conversions-api" },
  { name: "FIRECRAWL_API_KEY", purpose: "Web scraping for project data", usedBy: "scrape-project-website" },
  { name: "LOVABLE_API_KEY", purpose: "AI model access (Gemini, GPT)", usedBy: "AI content generation functions" },
  { name: "ZAPIER_PROJECT_LEADS_WEBHOOK", purpose: "Lead → Lofty CRM automation", usedBy: "send-project-lead" },
  { name: "ZAPIER_LISTING_LEADS_WEBHOOK", purpose: "Listing inquiry → CRM", usedBy: "send-inquiry-notification" },
];

/* ── Component ────────────────────────────────────────────────── */

export default function AdminTechStack() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Tech Stack & Systems</h1>
          <p className="text-sm text-muted-foreground">
            Everything that powers PresaleProperties.ca — platforms, APIs, databases, scheduled jobs, and backend functions.
          </p>
        </div>

        {/* Quick Summary */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { label: "Edge Functions", value: "63", icon: Zap },
                { label: "Database Tables", value: "40+", icon: Database },
                { label: "Scheduled Jobs", value: "12", icon: Clock },
                { label: "External APIs", value: "9", icon: Globe },
                { label: "Storage Buckets", value: "6", icon: HardDrive },
                { label: "API Secrets", value: "14", icon: Key },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Core Platform */}
        <SystemCard
          icon={MonitorSmartphone}
          title="Hosting & Frontend"
          description="Where our site lives and how it's built"
          iconColor="bg-blue-500/15 text-blue-600"
          items={hostingPlatform}
        />

        {/* External APIs */}
        <SystemCard
          icon={Globe}
          title="External APIs & Services"
          description="Third-party services our backend connects to"
          iconColor="bg-violet-500/15 text-violet-600"
          items={externalAPIs}
        />

        {/* Zapier */}
        <SystemCard
          icon={Webhook}
          title="Zapier Automations"
          description="Webhook-based automations connecting our site to Lofty CRM and social channels"
          iconColor="bg-orange-500/15 text-orange-600"
          items={zapierIntegrations}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Database */}
          <SystemCard
            icon={Database}
            title="Database"
            description="PostgreSQL with Row Level Security"
            iconColor="bg-emerald-500/15 text-emerald-600"
            items={databaseSystems}
          />

          {/* File Storage */}
          <SystemCard
            icon={HardDrive}
            title="File Storage Buckets"
            description="Cloud storage for images, documents, and brand assets"
            iconColor="bg-cyan-500/15 text-cyan-600"
            items={fileStorage}
          />
        </div>

        {/* Scheduled Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-amber-500/15 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
              Scheduled Jobs (Cron)
            </CardTitle>
            <CardDescription className="text-xs">
              Automated tasks that run on a schedule via pg_cron. All times are UTC.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cronJobs.map((job) => (
                <div key={job.id} className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
                  <div className="h-6 w-6 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-amber-700">#{job.id}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{job.name}</p>
                      <Badge variant="outline" className="text-[10px] shrink-0 bg-muted/50">{job.schedule}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{job.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edge Functions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-purple-500/15 text-purple-600">
                <Zap className="h-4 w-4" />
              </div>
              Backend Functions ({edgeFunctions.reduce((a, c) => a + c.functions.length, 0)} total)
            </CardTitle>
            <CardDescription className="text-xs">
              Serverless functions that handle business logic, API integrations, email, AI, and data processing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {edgeFunctions.map((group) => (
                <AccordionItem key={group.category} value={group.category}>
                  <AccordionTrigger className="text-sm py-3 hover:no-underline">
                    <span className="flex items-center gap-2">
                      {group.category}
                      <Badge variant="secondary" className="text-[10px]">{group.functions.length}</Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1.5 pt-1">
                      {group.functions.map((fn) => (
                        <div key={fn.name} className="flex items-start gap-2 text-xs py-1.5 px-2 rounded hover:bg-muted/40">
                          <code className="font-mono text-primary bg-primary/8 px-1.5 py-0.5 rounded text-[11px] shrink-0">{fn.name}</code>
                          <span className="text-muted-foreground">{fn.desc}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Database Tables */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-500/15 text-emerald-600">
                <Layers className="h-4 w-4" />
              </div>
              Database Tables
            </CardTitle>
            <CardDescription className="text-xs">
              All tables in the database grouped by system. Tables marked with * are not in auto-generated types and use manual type casting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {databaseTables.map((group) => (
                <div key={group.category} className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs font-semibold text-foreground mb-2">{group.category}</p>
                  <div className="space-y-1">
                    {group.tables.map((table) => (
                      <div key={table} className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/50 shrink-0" />
                        <span className={`text-[11px] font-mono ${table.includes("*") ? "text-amber-600" : "text-muted-foreground"}`}>
                          {table}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* API Keys & Secrets */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-rose-500/15 text-rose-600">
                <Key className="h-4 w-4" />
              </div>
              API Keys & Secrets
            </CardTitle>
            <CardDescription className="text-xs">
              Encrypted secrets stored in the backend. Values are never exposed — only names and purposes are shown.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {secrets.map((secret) => (
                <div key={secret.name} className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs font-semibold text-foreground font-mono">{secret.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{secret.purpose}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Used by: {secret.usedBy}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Architecture Note */}
        <Card className="border-muted">
          <CardContent className="pt-5">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground">Architecture Notes</p>
                <p>• All data flows through <strong>Lovable Cloud</strong> (PostgreSQL + Edge Functions + File Storage).</p>
                <p>• CRM sync goes exclusively through <strong>Zapier → Lofty</strong> to avoid duplicate contacts.</p>
                <p>• Market data uses a tiered priority: <strong>User Benchmarks → SnapStats → CMHC → MLS-derived</strong>.</p>
                <p>• SEO infrastructure supports <strong>1,000+ programmatic pages</strong> via city × property type × price combinations.</p>
                <p>• Frontend tracking events are sent server-side via <strong>send-behavior-event</strong> and stored in <strong>client_activity</strong> (29K+ events).</p>
                <p>• Sensitive MLS agent data is filtered through <strong>secure public views</strong> to prevent PII exposure.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
