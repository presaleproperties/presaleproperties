/**
 * Rich tabbed Lead Detail Drawer.
 *
 * Surfaces the full pre/post-form journey for a lead:
 *  - Overview: contact, qualifiers, score, intent, lead status
 *  - Activity: chronological page/event timeline (from client_activity, joined by visitor_id)
 *  - Engagement: project & city interest, floor plans, downloads, calculator usage
 *  - Attribution: first/last UTM, referrer, landing page, device, IP
 *  - Email: sent/opened/clicked emails + deck visits (post-submission engagement)
 */
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  Mail,
  Phone,
  Building2,
  User,
  Home,
  UserCheck,
  MessageSquare,
  ExternalLink,
  Activity,
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Eye,
  Download as DownloadIcon,
  MousePointerClick,
  FileText,
  Calculator,
  Clock,
  Flame,
  Snowflake,
  Send,
  MailOpen,
  ChevronRight,
  BadgeCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { generateProjectUrl } from "@/lib/seoUrls";
import { cn } from "@/lib/utils";
import { List as VirtualList, type RowComponentProps } from "react-window";
import { LeadHubPanel } from "./LeadHubPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  persona: string | null;
  home_size: string | null;
  agent_status: string | null;
  created_at: string;
  project_id: string | null;
  // Extended tracking fields (all optional so legacy callers still work)
  visitor_id?: string | null;
  session_id?: string | null;
  lead_source?: string | null;
  lead_sources?: string[] | null;
  lead_status?: string | null;
  lead_score?: number | null;
  lead_temperature?: string | null;
  intent_score?: number | null;
  form_type?: string | null;
  pages_viewed?: number | null;
  time_on_site?: number | null;
  session_count?: number | null;
  used_calculator?: boolean | null;
  device_type?: string | null;
  user_agent?: string | null;
  ip_address?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  first_touch_utm_source?: string | null;
  first_touch_utm_medium?: string | null;
  first_touch_utm_campaign?: string | null;
  first_touch_at?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  city_interest?: unknown;
  project_interest?: unknown;
  tracking_data?: Record<string, unknown> | null;
  admin_notes?: string | null;
  contacted_at?: string | null;
  responded_at?: string | null;
  converted_at?: string | null;
  presale_projects: {
    name: string;
    slug: string;
    city: string;
    neighborhood: string | null;
    project_type: string | null;
  } | null;
}

interface ListingLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  created_at: string;
  listing_id: string;
  listings: {
    title: string;
    project_name: string;
    city: string;
  } | null;
}

interface LeadDetailsModalProps {
  lead: ProjectLead | ListingLead | null;
  type: "project" | "listing";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "overview" | "activity" | "engagement" | "attribution" | "email" | "hub";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const personaLabel = (p: string | null | undefined) => {
  if (p === "first_time") return "First-time Buyer";
  if (p === "investor") return "Investor";
  if (p === "realtor") return "Realtor";
  return p || "Not specified";
};

const homeSizeLabel = (s: string | null | undefined) => {
  if (s === "1_bed") return "1 Bedroom";
  if (s === "2_bed") return "2 Bedroom";
  if (s === "3_bed_plus") return "3+ Bedrooms";
  return s || "Not specified";
};

const agentLabel = (a: string | null | undefined) => {
  if (a === "i_am_realtor") return "I am a Realtor";
  if (a === "yes") return "Working with an agent";
  if (a === "no") return "No agent";
  return a || "—";
};

const sourceLabel = (s: string | null | undefined) => {
  if (!s) return "—";
  if (s.startsWith("city_list_")) {
    const city = s.replace("city_list_", "").replace(/_/g, " ");
    return `City: ${city.charAt(0).toUpperCase() + city.slice(1)}`;
  }
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatSeconds = (s: number | null | undefined): string => {
  if (!s) return "0s";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};

const DeviceIcon = ({ device }: { device?: string | null }) => {
  if (device === "mobile") return <Smartphone className="h-3.5 w-3.5" />;
  if (device === "tablet") return <Tablet className="h-3.5 w-3.5" />;
  return <Monitor className="h-3.5 w-3.5" />;
};

const eventLabels: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  page_view: { label: "Page view", icon: Eye, color: "text-muted-foreground" },
  property_view: { label: "Project viewed", icon: Building2, color: "text-blue-600" },
  floorplan_view: { label: "Floor plan viewed", icon: FileText, color: "text-indigo-600" },
  floorplan_download: { label: "Floor plan downloaded", icon: DownloadIcon, color: "text-emerald-600" },
  favorite_add: { label: "Added to favorites", icon: TrendingUp, color: "text-pink-600" },
  cta_click: { label: "CTA clicked", icon: MousePointerClick, color: "text-amber-600" },
  city_cta_click: { label: "City CTA clicked", icon: MapPin, color: "text-amber-600" },
  search: { label: "Search performed", icon: Globe, color: "text-muted-foreground" },
  form_start: { label: "Form started", icon: FileText, color: "text-orange-600" },
  form_submit: { label: "Form submitted", icon: BadgeCheck, color: "text-emerald-700" },
  contact_form: { label: "Contact form", icon: Mail, color: "text-emerald-700" },
  return_visit: { label: "Return visit", icon: TrendingUp, color: "text-purple-600" },
  deck_section_view: { label: "Pitch deck section viewed", icon: FileText, color: "text-violet-600" },
  property_email_sent: { label: "Property email sent", icon: Send, color: "text-sky-600" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function LeadDetailsModal({ lead, type, open, onOpenChange, initialTab = "overview" }: LeadDetailsModalProps) {
  const [tab, setTab] = useState<string>(initialTab);

  // Reset tab whenever the drawer opens with a different initialTab.
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  const isProjectLead = type === "project";
  const projectLead = (lead ?? {}) as ProjectLead;
  const listingLead = (lead ?? {}) as ListingLead;
  const visitorId = isProjectLead ? projectLead.visitor_id ?? null : null;
  const submittedAt = lead?.created_at ?? new Date().toISOString();

  // Pull all activity for this visitor (pre & post submission)
  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["lead-activity", visitorId],
    queryFn: async () => {
      if (!visitorId) return [];
      const { data, error } = await supabase
        .from("client_activity")
        .select(
          "id, activity_type, project_name, project_id, city, listing_key, page_url, page_title, duration_seconds, device_type, referrer, utm_source, utm_medium, utm_campaign, ip_address, created_at"
        )
        .eq("visitor_id", visitorId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!visitorId,
  });

  // Pull email engagement for this lead
  const { data: emailLogs, isLoading: emailLoading } = useQuery({
    queryKey: ["lead-emails", projectLead.id, projectLead.email],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("email_logs")
        .select("id, subject, sent_at, opened_at, open_count, clicked_at, click_count, status, template_type")
        .or(`lead_id.eq.${projectLead.id},email_to.eq.${projectLead.email}`)
        .order("sent_at", { ascending: false })
        .limit(50);
      if (error) return [];
      return data || [];
    },
    enabled: open && isProjectLead,
  });

  // Pull pitch deck visits (post-submission warmth signal)
  const { data: deckVisits } = useQuery({
    queryKey: ["lead-deck-visits", visitorId, projectLead.email],
    queryFn: async () => {
      if (!visitorId && !projectLead.email) return [];
      const filters = [];
      if (visitorId) filters.push(`visitor_id.eq.${visitorId}`);
      if (projectLead.email) filters.push(`lead_email.eq.${projectLead.email}`);
      const { data, error } = await (supabase as any)
        .from("deck_visits")
        .select("id, project_name, slug, visit_number, device_type, referrer, created_at")
        .or(filters.join(","))
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) return [];
      return data || [];
    },
    enabled: open && isProjectLead && (!!visitorId || !!projectLead.email),
  });

  // Split activity into pre-submission and post-submission for the timeline
  const { preSubmit, postSubmit } = useMemo(() => {
    if (!activity) return { preSubmit: [], postSubmit: [] };
    const subTime = new Date(submittedAt).getTime();
    const pre: typeof activity = [];
    const post: typeof activity = [];
    activity.forEach((a) => {
      if (new Date(a.created_at).getTime() <= subTime) pre.push(a);
      else post.push(a);
    });
    return { preSubmit: pre, postSubmit: post };
  }, [activity, submittedAt]);

  // Derive engagement summaries from activity
  const projectsViewed = useMemo(() => {
    if (!activity) return [];
    const map = new Map<string, { project_name: string; project_id: string | null; views: number; last_viewed: string }>();
    activity
      .filter((a) => a.activity_type === "property_view" && a.project_name)
      .forEach((a) => {
        const key = a.project_id || a.project_name!;
        const existing = map.get(key);
        if (existing) {
          existing.views += 1;
          if (a.created_at > existing.last_viewed) existing.last_viewed = a.created_at;
        } else {
          map.set(key, {
            project_name: a.project_name!,
            project_id: a.project_id,
            views: 1,
            last_viewed: a.created_at,
          });
        }
      });
    return Array.from(map.values()).sort((a, b) => b.views - a.views).slice(0, 10);
  }, [activity]);

  const citiesViewed = useMemo(() => {
    if (!activity) return [];
    const map = new Map<string, number>();
    activity
      .filter((a) => a.city)
      .forEach((a) => map.set(a.city!, (map.get(a.city!) || 0) + 1));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([city, count]) => ({ city, count }));
  }, [activity]);

  const floorplansViewed = (activity || []).filter((a) => a.activity_type === "floorplan_view").length;
  const downloads = (activity || []).filter((a) => a.activity_type === "floorplan_download").length;
  const ctaClicks = (activity || []).filter((a) => a.activity_type === "cta_click" || a.activity_type === "city_cta_click").length;

  const intent = projectLead.intent_score ?? 0;
  const score = projectLead.lead_score ?? 0;
  const tempColor =
    projectLead.lead_temperature === "hot"
      ? "bg-red-500/10 text-red-700 border-red-200"
      : projectLead.lead_temperature === "warm"
      ? "bg-amber-500/10 text-amber-700 border-amber-200"
      : "bg-sky-500/10 text-sky-700 border-sky-200";

  if (!lead) return null;

  const initials = lead.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border bg-gradient-to-b from-muted/40 to-transparent space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/20">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg leading-tight truncate">{lead.name}</SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                Submitted {formatDistanceToNow(new Date(submittedAt), { addSuffix: true })}
                {" · "}
                {format(new Date(submittedAt), "MMM d, yyyy 'at' h:mm a")}
              </SheetDescription>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {isProjectLead && projectLead.lead_temperature && (
                  <Badge variant="outline" className={cn("gap-1 text-[10px]", tempColor)}>
                    {projectLead.lead_temperature === "hot" ? <Flame className="h-3 w-3" /> : <Snowflake className="h-3 w-3" />}
                    {projectLead.lead_temperature.toUpperCase()}
                  </Badge>
                )}
                {isProjectLead && projectLead.lead_status && (
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {projectLead.lead_status}
                  </Badge>
                )}
                {isProjectLead && projectLead.persona && (
                  <Badge variant="outline" className="text-[10px]">
                    {personaLabel(projectLead.persona)}
                  </Badge>
                )}
              </div>
            </div>
            {isProjectLead && (intent > 0 || score > 0) && (
              <div className="flex flex-col items-end gap-1 shrink-0">
                {intent > 0 && (
                  <div className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Intent</div>
                    <div className="text-base font-bold tabular-nums text-foreground">{intent}<span className="text-[10px] font-normal text-muted-foreground">/10</span></div>
                  </div>
                )}
                {score > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    Score <strong className="text-foreground tabular-nums">{score}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick contact actions */}
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-8" asChild>
              <a href={`mailto:${lead.email}`}>
                <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
              </a>
            </Button>
            {lead.phone && (
              <Button size="sm" variant="outline" className="flex-1 h-8" asChild>
                <a href={`tel:${lead.phone}`}>
                  <Phone className="h-3.5 w-3.5 mr-1.5" /> {lead.phone}
                </a>
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 grid grid-cols-6 h-9">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">
              Timeline
              {activity && activity.length > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">({activity.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="engagement" className="text-xs">Engage</TabsTrigger>
            <TabsTrigger value="attribution" className="text-xs">Source</TabsTrigger>
            <TabsTrigger value="email" className="text-xs">
              Email
              {emailLogs && emailLogs.length > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">({emailLogs.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="hub" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              Hub
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="px-6 py-5">
              {/* ───── OVERVIEW ───── */}
              <TabsContent value="overview" className="m-0 space-y-5">
                <Section title="Contact">
                  <Row icon={Mail} label="Email">
                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline truncate">{lead.email}</a>
                  </Row>
                  {lead.phone && (
                    <Row icon={Phone} label="Phone">
                      <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a>
                    </Row>
                  )}
                </Section>

                <Section title={isProjectLead ? "Project of Interest" : "Listing of Interest"}>
                  {isProjectLead && projectLead.presale_projects ? (
                    <Row icon={Building2} label="Project">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{projectLead.presale_projects.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {projectLead.presale_projects.city}
                          {projectLead.presale_projects.neighborhood && ` · ${projectLead.presale_projects.neighborhood}`}
                        </span>
                        <a
                          href={generateProjectUrl({
                            slug: projectLead.presale_projects.slug,
                            neighborhood: projectLead.presale_projects.neighborhood || projectLead.presale_projects.city,
                            projectType: (projectLead.presale_projects.project_type || "condo") as any,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          View project page <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </Row>
                  ) : !isProjectLead && listingLead.listings ? (
                    <Row icon={Home} label="Listing">
                      <div className="flex flex-col">
                        <span className="font-medium">{listingLead.listings.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {listingLead.listings.project_name} · {listingLead.listings.city}
                        </span>
                      </div>
                    </Row>
                  ) : (
                    <p className="text-xs text-muted-foreground">No property linked</p>
                  )}
                </Section>

                {isProjectLead && (projectLead.persona || projectLead.home_size || projectLead.agent_status) && (
                  <Section title="Qualifiers">
                    <div className="grid grid-cols-2 gap-3">
                      {projectLead.persona && (
                        <Stat label="Buyer Type">
                          <Badge variant={projectLead.persona === "investor" ? "default" : "secondary"}>
                            {personaLabel(projectLead.persona)}
                          </Badge>
                        </Stat>
                      )}
                      {projectLead.home_size && (
                        <Stat label="Home Size">
                          <Badge variant="outline">{homeSizeLabel(projectLead.home_size)}</Badge>
                        </Stat>
                      )}
                      {projectLead.agent_status && (
                        <Stat label="Agent Status">
                          <Badge variant="outline" className="gap-1">
                            <UserCheck className="h-3 w-3" />
                            {agentLabel(projectLead.agent_status)}
                          </Badge>
                        </Stat>
                      )}
                      {projectLead.form_type && (
                        <Stat label="Form Type">
                          <Badge variant="outline">{sourceLabel(projectLead.form_type)}</Badge>
                        </Stat>
                      )}
                    </div>
                  </Section>
                )}

                {isProjectLead && projectLead.lead_sources && projectLead.lead_sources.length > 0 && (
                  <Section title="Lead Sources">
                    <div className="flex flex-wrap gap-1.5">
                      {projectLead.lead_sources.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">{sourceLabel(s)}</Badge>
                      ))}
                    </div>
                  </Section>
                )}

                {lead.message && (
                  <Section title="Message" icon={MessageSquare}>
                    <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">{lead.message}</p>
                  </Section>
                )}

                {isProjectLead && (
                  <Section title="Status">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Stat label="Status">
                        <Badge variant="outline">{projectLead.lead_status || "new"}</Badge>
                      </Stat>
                      {projectLead.contacted_at && (
                        <Stat label="Contacted">
                          {format(new Date(projectLead.contacted_at), "MMM d, yyyy")}
                        </Stat>
                      )}
                      {projectLead.responded_at && (
                        <Stat label="Responded">
                          {format(new Date(projectLead.responded_at), "MMM d, yyyy")}
                        </Stat>
                      )}
                      {projectLead.converted_at && (
                        <Stat label="Converted">
                          {format(new Date(projectLead.converted_at), "MMM d, yyyy")}
                        </Stat>
                      )}
                    </div>
                  </Section>
                )}

                {isProjectLead && (intent > 0 || (projectLead.pages_viewed ?? 0) > 0 || (projectLead.session_count ?? 0) > 1) && (
                  <Section title="Intent score breakdown" icon={TrendingUp}>
                    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Composite intent</span>
                        <span className="font-bold tabular-nums text-foreground">{intent}/10</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            intent >= 7 ? "bg-destructive" : intent >= 4 ? "bg-amber-500" : "bg-sky-500",
                          )}
                          style={{ width: `${Math.min(100, intent * 10)}%` }}
                        />
                      </div>
                      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground pt-1">
                        <li className="flex items-center justify-between">
                          <span>Pages viewed</span>
                          <span className="font-medium tabular-nums text-foreground">{projectLead.pages_viewed ?? 0}</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Sessions</span>
                          <span className="font-medium tabular-nums text-foreground">{projectLead.session_count ?? 1}</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Time on site</span>
                          <span className="font-medium tabular-nums text-foreground">{formatSeconds(projectLead.time_on_site)}</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Calculator</span>
                          <span className="font-medium text-foreground">{projectLead.used_calculator ? "Yes" : "No"}</span>
                        </li>
                        {deckVisits && deckVisits.length > 0 && (
                          <li className="flex items-center justify-between col-span-2">
                            <span>Pitch deck visits</span>
                            <span className="font-medium tabular-nums text-foreground">{deckVisits.length}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </Section>
                )}
              </TabsContent>

              {/* ───── TIMELINE ───── */}
              <TabsContent value="activity" className="m-0 space-y-4">
                {!visitorId ? (
                  <EmptyMsg icon={Activity}>
                    No visitor ID stored on this lead — pre/post-submission tracking unavailable.
                  </EmptyMsg>
                ) : activityLoading ? (
                  <div className="space-y-2">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                  </div>
                ) : !activity || activity.length === 0 ? (
                  <EmptyMsg icon={Activity}>No activity logged for this visitor yet.</EmptyMsg>
                ) : (
                  <>
                    {postSubmit.length > 0 && (
                      <TimelineGroup
                        title="After form submission"
                        subtitle={`${postSubmit.length} event(s) since they submitted`}
                        accent="success"
                        events={postSubmit}
                      />
                    )}
                    <TimelineGroup
                      title="Before form submission"
                      subtitle={`${preSubmit.length} event(s) leading up to submission`}
                      accent="muted"
                      events={preSubmit}
                      submitMarker={preSubmit.length > 0}
                    />
                  </>
                )}
              </TabsContent>

              {/* ───── ENGAGEMENT ───── */}
              <TabsContent value="engagement" className="m-0 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <MetricCard icon={Eye} label="Pages" value={projectLead.pages_viewed ?? 0} />
                  <MetricCard icon={Clock} label="Time on Site" value={formatSeconds(projectLead.time_on_site)} />
                  <MetricCard icon={TrendingUp} label="Sessions" value={projectLead.session_count ?? 1} />
                  <MetricCard icon={Calculator} label="Calculator" value={projectLead.used_calculator ? "Yes" : "No"} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <MetricCard icon={Building2} label="Projects" value={projectsViewed.length} />
                  <MetricCard icon={FileText} label="Floor Plans" value={floorplansViewed} />
                  <MetricCard icon={DownloadIcon} label="Downloads" value={downloads} />
                  <MetricCard icon={MousePointerClick} label="CTA Clicks" value={ctaClicks} />
                </div>

                {projectsViewed.length > 0 && (
                  <Section title="Top projects viewed">
                    <ul className="space-y-1.5">
                      {projectsViewed.map((p) => (
                        <li key={p.project_id || p.project_name} className="flex items-center justify-between text-sm py-1.5 px-2.5 rounded-md hover:bg-muted/50">
                          <span className="truncate">{p.project_name}</span>
                          <Badge variant="secondary" className="text-[10px] ml-2 shrink-0">{p.views} {p.views === 1 ? "view" : "views"}</Badge>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {citiesViewed.length > 0 && (
                  <Section title="Cities of interest">
                    <div className="flex flex-wrap gap-1.5">
                      {citiesViewed.map((c) => (
                        <Badge key={c.city} variant="outline" className="text-[10px] gap-1">
                          <MapPin className="h-3 w-3" /> {c.city} <span className="text-muted-foreground">({c.count})</span>
                        </Badge>
                      ))}
                    </div>
                  </Section>
                )}

                {deckVisits && deckVisits.length > 0 && (
                  <Section title="Pitch deck visits (post-submission warmth)">
                    <ul className="space-y-1.5">
                      {deckVisits.map((d: any) => (
                        <li key={d.id} className="flex items-center justify-between text-sm py-1.5 px-2.5 rounded-md hover:bg-muted/50">
                          <div className="min-w-0">
                            <p className="truncate">{d.project_name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Visit #{d.visit_number} · {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <DeviceIcon device={d.device_type} />
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}
              </TabsContent>

              {/* ───── ATTRIBUTION ───── */}
              <TabsContent value="attribution" className="m-0 space-y-5">
                {(projectLead.first_touch_utm_source || projectLead.first_touch_at) && (
                  <Section title="First touch (acquisition)">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {projectLead.first_touch_utm_source && <Stat label="Source">{projectLead.first_touch_utm_source}</Stat>}
                      {projectLead.first_touch_utm_medium && <Stat label="Medium">{projectLead.first_touch_utm_medium}</Stat>}
                      {projectLead.first_touch_utm_campaign && <Stat label="Campaign" wide>{projectLead.first_touch_utm_campaign}</Stat>}
                      {projectLead.first_touch_at && (
                        <Stat label="First seen" wide>
                          {format(new Date(projectLead.first_touch_at), "MMM d, yyyy 'at' h:mm a")}
                        </Stat>
                      )}
                    </div>
                  </Section>
                )}

                <Section title="Last touch (this submission)">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Stat label="Source">{projectLead.utm_source || "direct"}</Stat>
                    <Stat label="Medium">{projectLead.utm_medium || "—"}</Stat>
                    {projectLead.utm_campaign && <Stat label="Campaign" wide>{projectLead.utm_campaign}</Stat>}
                    {projectLead.utm_content && <Stat label="Content" wide>{projectLead.utm_content}</Stat>}
                    {projectLead.utm_term && <Stat label="Term" wide>{projectLead.utm_term}</Stat>}
                  </div>
                </Section>

                <Section title="Path to conversion">
                  {projectLead.referrer && (
                    <Row icon={Globe} label="Referrer">
                      <span className="truncate text-xs">{projectLead.referrer}</span>
                    </Row>
                  )}
                  {projectLead.landing_page && (
                    <Row icon={ChevronRight} label="Landing">
                      <span className="truncate text-xs">{projectLead.landing_page}</span>
                    </Row>
                  )}
                  {projectLead.lead_source && (
                    <Row icon={Send} label="Form">
                      <Badge variant="outline" className="text-[10px]">{sourceLabel(projectLead.lead_source)}</Badge>
                    </Row>
                  )}
                </Section>

                <Section title="Device & environment">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Stat label="Device">
                      <span className="inline-flex items-center gap-1.5">
                        <DeviceIcon device={projectLead.device_type} />
                        {projectLead.device_type || "—"}
                      </span>
                    </Stat>
                    {projectLead.ip_address && <Stat label="IP">{projectLead.ip_address}</Stat>}
                    {projectLead.visitor_id && (
                      <Stat label="Visitor ID" wide>
                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{projectLead.visitor_id}</code>
                      </Stat>
                    )}
                  </div>
                </Section>
              </TabsContent>

              {/* ───── EMAIL ───── */}
              <TabsContent value="email" className="m-0 space-y-3">
                {emailLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                  </div>
                ) : !emailLogs || emailLogs.length === 0 ? (
                  <EmptyMsg icon={Mail}>
                    No emails sent to this lead yet — try the <strong>Hub</strong> tab to send a template.
                  </EmptyMsg>
                ) : (
                  <ul className="space-y-2">
                    {emailLogs.map((e: any) => (
                      <li key={e.id} className="border border-border rounded-lg p-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium truncate flex-1">{e.subject}</p>
                          <Badge variant={e.opened_at ? "default" : "outline"} className="text-[10px] shrink-0">
                            {e.opened_at ? "Opened" : e.status || "Sent"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Send className="h-3 w-3" /> {format(new Date(e.sent_at), "MMM d, h:mm a")}
                          </span>
                          {e.opened_at && (
                            <span className="inline-flex items-center gap-1">
                              <MailOpen className="h-3 w-3" /> {e.open_count}× opened
                            </span>
                          )}
                          {e.click_count > 0 && (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <MousePointerClick className="h-3 w-3" /> {e.click_count} click(s)
                            </span>
                          )}
                          {e.template_type && <Badge variant="secondary" className="text-[9px]">{e.template_type}</Badge>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              {/* ───── HUB (Marketing + Email Hub integration) ───── */}
              <TabsContent value="hub" className="m-0">
                {isProjectLead ? (
                  <LeadHubPanel
                    leadId={projectLead.id}
                    leadEmail={lead.email}
                    leadName={lead.name}
                  />
                ) : (
                  <EmptyMsg icon={Sparkles}>
                    Hub actions are available for project leads only.
                  </EmptyMsg>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon?: typeof Eye; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}
        {title}
      </h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ icon: Icon, label, children }: { icon: typeof Eye; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm py-1">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</div>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

function Stat({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("space-y-0.5", wide && "col-span-2")}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="text-xs font-medium break-words">{children}</div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string | number }) {
  return (
    <div className="border border-border rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        <Icon className="h-3 w-3" />
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-base font-semibold leading-none">{value}</p>
    </div>
  );
}

function EmptyMsg({ icon: Icon, children }: { icon: typeof Eye; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-10 text-muted-foreground">
      <Icon className="h-8 w-8 mb-2 opacity-40" />
      <p className="text-xs max-w-[300px]">{children}</p>
    </div>
  );
}

type TimelineEvent = {
  id: string;
  activity_type: string;
  project_name: string | null;
  city: string | null;
  page_url: string | null;
  page_title: string | null;
  duration_seconds: number | null;
  created_at: string;
};

type TimelineRow =
  | { kind: "submit" }
  | { kind: "day"; label: string; count: number }
  | { kind: "event"; event: TimelineEvent };

function buildRows(events: TimelineEvent[], submitMarker: boolean): TimelineRow[] {
  const rows: TimelineRow[] = [];
  if (submitMarker) rows.push({ kind: "submit" });

  // Group by calendar day, preserving the existing order (newest-first).
  let currentDay = "";
  let dayCount = 0;
  let dayIdx = -1;
  events.forEach((e) => {
    const day = format(new Date(e.created_at), "EEEE, MMM d, yyyy");
    if (day !== currentDay) {
      currentDay = day;
      dayCount = 0;
      rows.push({ kind: "day", label: day, count: 0 });
      dayIdx = rows.length - 1;
    }
    dayCount += 1;
    (rows[dayIdx] as { kind: "day"; label: string; count: number }).count = dayCount;
    rows.push({ kind: "event", event: e });
  });
  return rows;
}

function rowKey(row: TimelineRow, i: number): string {
  if (row.kind === "event") return row.event.id;
  if (row.kind === "day") return `day-${row.label}-${i}`;
  return `submit-${i}`;
}

function TimelineGroup({
  title,
  subtitle,
  events,
  accent,
  submitMarker = false,
}: {
  title: string;
  subtitle: string;
  events: TimelineEvent[];
  accent: "success" | "muted";
  submitMarker?: boolean;
}) {
  const rows = useMemo(() => buildRows(events, submitMarker), [events, submitMarker]);

  if (events.length === 0 && !submitMarker) return null;

  // Virtualize only when the list is large enough to matter for scroll perf.
  const VIRTUALIZE_THRESHOLD = 60;
  const shouldVirtualize = rows.length > VIRTUALIZE_THRESHOLD;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h4
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wider",
            accent === "success" ? "text-success" : "text-muted-foreground",
          )}
        >
          {title}
        </h4>
        <span className="text-[10px] text-muted-foreground">{subtitle}</span>
      </div>

      <div className="relative ml-2 pl-4 border-l-2 border-border">
        {shouldVirtualize ? (
          <VirtualTimeline rows={rows} accent={accent} />
        ) : (
          <ol className="space-y-2">
            {rows.map((row, i) => (
              <li key={rowKey(row, i)}>
                <TimelineRowItem row={row} accent={accent} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function VirtualTimeline({
  rows,
  accent,
}: {
  rows: TimelineRow[];
  accent: "success" | "muted";
}) {
  // Uniform row height keeps scroll math trivial and is visually fine —
  // shorter rows (day headers, submit marker) just get a little extra padding.
  const itemSize = 64;
  const height = Math.min(560, Math.max(itemSize, rows.length * itemSize));

  return (
    <VirtualList
      style={{ height, width: "100%" }}
      rowCount={rows.length}
      rowHeight={itemSize}
      overscanCount={8}
      rowProps={{ rows, accent }}
      rowComponent={TimelineVirtualRow}
    />
  );
}

function TimelineVirtualRow({
  index,
  style,
  rows,
  accent,
}: RowComponentProps<{ rows: TimelineRow[]; accent: "success" | "muted" }>) {
  return (
    <div style={style}>
      <TimelineRowItem row={rows[index]} accent={accent} />
    </div>
  );
}

function TimelineRowItem({
  row,
  accent,
}: {
  row: TimelineRow;
  accent: "success" | "muted";
}) {
  if (row.kind === "submit") {
    return (
      <div className="relative py-1">
        <span className="absolute -left-[22px] top-2.5 h-3 w-3 rounded-full bg-success ring-2 ring-background" />
        <div className="text-xs font-medium text-success bg-success/10 border border-success/20 px-2.5 py-1.5 rounded-md inline-block">
          ✓ Form submitted
        </div>
      </div>
    );
  }

  if (row.kind === "day") {
    return (
      <div className="flex items-center justify-between pt-1.5 pb-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {row.label}
        </span>
        <span className="text-[10px] text-muted-foreground/70">
          {row.count} {row.count === 1 ? "event" : "events"}
        </span>
      </div>
    );
  }

  const e = row.event;
  const meta =
    eventLabels[e.activity_type] || {
      label: e.activity_type,
      icon: Activity,
      color: "text-muted-foreground",
    };
  const Icon = meta.icon;
  const eventDate = new Date(e.created_at);

  return (
    <div className="relative py-1">
      <span
        className={cn(
          "absolute -left-[20px] top-2.5 h-2 w-2 rounded-full ring-2 ring-background",
          accent === "success" ? "bg-success/70" : "bg-muted-foreground/40",
        )}
      />
      <div className="flex items-start gap-2 text-xs">
        <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", meta.color)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium truncate">{meta.label}</span>
            <span
              className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap tabular-nums"
              title={format(eventDate, "PPpp")}
            >
              {format(eventDate, "h:mm a")}
              <span className="text-muted-foreground/60">
                {" · "}
                {formatDistanceToNow(eventDate, { addSuffix: true })}
              </span>
            </span>
          </div>
          {(e.project_name || e.page_title || e.page_url) && (
            <p className="text-[11px] text-muted-foreground truncate">
              {e.project_name || e.page_title || e.page_url}
              {e.city && e.project_name ? ` · ${e.city}` : ""}
            </p>
          )}
          {e.duration_seconds ? (
            <p className="text-[10px] text-muted-foreground/70">
              {formatSeconds(e.duration_seconds)} on page
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
