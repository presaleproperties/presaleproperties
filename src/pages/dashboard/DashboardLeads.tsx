import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadOnboardHub } from "@/components/leads/LeadOnboardHub";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Users,
  Mail,
  Phone,
  Calendar,
  Building2,
  Loader2,
  UserPlus,
  Presentation,
  ExternalLink,
  Check,
  Search,
  Flame,
  Thermometer,
  Snowflake,
  MoreVertical,
  Clock,
  TrendingUp,
  Filter,
  Tag,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  created_at: string;
  listing: {
    id: string;
    title: string;
    project_name: string;
  } | null;
}

interface OnboardedLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: string;
  notes: string;
  deck_url: string;
  zapier_synced: boolean;
  temperature: string;
  tags: string[];
  created_at: string;
  pitch_decks: { project_name: string; slug: string } | null;
}

const SOURCE_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  website: "Website",
  referral: "Referral",
};

const TEMP_CONFIG = {
  hot: { icon: Flame, label: "Hot", className: "text-red-500", bg: "bg-red-500/10 border-red-500/20", badgeCn: "bg-red-500/10 text-red-600 border-red-500/20" },
  warm: { icon: Thermometer, label: "Warm", className: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", badgeCn: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  cold: { icon: Snowflake, label: "Cold", className: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", badgeCn: "bg-blue-400/10 text-blue-500 border-blue-400/20" },
} as const;

const DATE_FILTERS = [
  { value: "all", label: "All Time" },
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
];

export default function DashboardLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [onboardedLeads, setOnboardedLeads] = useState<OnboardedLead[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [tempFilter, setTempFilter] = useState("all");

  // Tag editing state
  const [editingTagLeadId, setEditingTagLeadId] = useState<string | null>(null);
  const [newTagValue, setNewTagValue] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [showAddLead, setShowAddLead] = useState(false);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [listingLeads, onboarded] = await Promise.all([
        (supabase as any)
          .from("leads")
          .select("id, name, email, phone, message, created_at, listing:listings(id, title, project_name)")
          .eq("agent_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("onboarded_leads")
          .select("id, first_name, last_name, email, phone, source, notes, deck_url, zapier_synced, temperature, tags, created_at, pitch_decks(project_name, slug)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (listingLeads.data) {
        setLeads(listingLeads.data.map((item: any) => ({ ...item, listing: item.listing as Lead["listing"] })));
      }
      if (onboarded.data) {
        setOnboardedLeads(onboarded.data as unknown as OnboardedLead[]);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetTemperature = async (leadId: string, temp: string) => {
    const prev = [...onboardedLeads];
    setOnboardedLeads((leads) =>
      leads.map((l) => (l.id === leadId ? { ...l, temperature: temp } : l))
    );
    const { error } = await supabase
      .from("onboarded_leads")
      .update({ temperature: temp } as any)
      .eq("id", leadId);
    if (error) {
      setOnboardedLeads(prev);
      toast.error("Failed to update lead temperature");
    } else {
      toast.success(`Marked as ${temp}`);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    
    const prev = [...onboardedLeads];
    setOnboardedLeads((leads) => leads.filter((l) => l.id !== leadId));
    const { error } = await supabase
      .from("onboarded_leads")
      .delete()
      .eq("id", leadId);
    if (error) {
      setOnboardedLeads(prev);
      toast.error("Failed to delete lead");
    } else {
      toast.success("Lead deleted");
    }
  };

  const handleAddTag = async (leadId: string, tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    const lead = onboardedLeads.find((l) => l.id === leadId);
    if (!lead || lead.tags?.includes(trimmed)) return;

    const newTags = [...(lead.tags || []), trimmed];
    const prev = [...onboardedLeads];
    setOnboardedLeads((leads) =>
      leads.map((l) => (l.id === leadId ? { ...l, tags: newTags } : l))
    );
    const { error } = await supabase
      .from("onboarded_leads")
      .update({ tags: newTags } as any)
      .eq("id", leadId);
    if (error) {
      setOnboardedLeads(prev);
      toast.error("Failed to add tag");
    }
    setNewTagValue("");
  };

  const handleRemoveTag = async (leadId: string, tagToRemove: string) => {
    const lead = onboardedLeads.find((l) => l.id === leadId);
    if (!lead) return;

    const newTags = (lead.tags || []).filter((t) => t !== tagToRemove);
    const prev = [...onboardedLeads];
    setOnboardedLeads((leads) =>
      leads.map((l) => (l.id === leadId ? { ...l, tags: newTags } : l))
    );
    const { error } = await supabase
      .from("onboarded_leads")
      .update({ tags: newTags } as any)
      .eq("id", leadId);
    if (error) {
      setOnboardedLeads(prev);
      toast.error("Failed to remove tag");
    }
  };

  const filteredOnboarded = useMemo(() => {
    return onboardedLeads.filter((lead) => {
      const fullName = `${lead.first_name} ${lead.last_name}`.toLowerCase();
      const q = searchQuery.toLowerCase();
      if (q && !fullName.includes(q) && !lead.email.toLowerCase().includes(q) && !lead.phone?.includes(q)) return false;
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      if (tempFilter !== "all" && lead.temperature !== tempFilter) return false;
      if (dateFilter !== "all") {
        const cutoff = subDays(new Date(), parseInt(dateFilter));
        if (!isAfter(new Date(lead.created_at), cutoff)) return false;
      }
      return true;
    });
  }, [onboardedLeads, searchQuery, sourceFilter, dateFilter, tempFilter]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = searchQuery.toLowerCase();
      if (q && !lead.name.toLowerCase().includes(q) && !lead.email.toLowerCase().includes(q)) return false;
      if (dateFilter !== "all") {
        const cutoff = subDays(new Date(), parseInt(dateFilter));
        if (!isAfter(new Date(lead.created_at), cutoff)) return false;
      }
      return true;
    });
  }, [leads, searchQuery, dateFilter]);

  const groupedLeads = filteredLeads.reduce<Record<string, { listing: Lead["listing"] & {}; leads: Lead[] }>>((acc, lead) => {
    const listingId = lead.listing?.id || "unknown";
    if (!acc[listingId]) {
      acc[listingId] = { listing: lead.listing || { id: "unknown", title: "Unknown Listing", project_name: "" }, leads: [] };
    }
    acc[listingId].leads.push(lead);
    return acc;
  }, {});

  // Stats
  const totalLeads = onboardedLeads.length + leads.length;
  const hotCount = onboardedLeads.filter((l) => l.temperature === "hot").length;
  const recentLeads = [...onboardedLeads, ...leads].filter((l) =>
    isAfter(new Date(l.created_at), subDays(new Date(), 7))
  ).length;

  const availableSources = useMemo(() => {
    return Array.from(new Set(onboardedLeads.map((l) => l.source)));
  }, [onboardedLeads]);

  const clearFilters = () => {
    setSearchQuery("");
    setSourceFilter("all");
    setDateFilter("all");
    setTempFilter("all");
  };

  const hasActiveFilters = searchQuery || sourceFilter !== "all" || dateFilter !== "all" || tempFilter !== "all";

  // Sort: hot first, then warm, then cold, then by date
  const sortedOnboarded = useMemo(() => {
    const order: Record<string, number> = { hot: 0, warm: 1, cold: 2 };
    return [...filteredOnboarded].sort((a, b) => {
      const ta = order[a.temperature] ?? 2;
      const tb = order[b.temperature] ?? 2;
      if (ta !== tb) return ta - tb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredOnboarded]);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">Manage clients &amp; mark priority leads</p>
        </div>

        {/* Compact Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold leading-none">{totalLeads}</p>
              <p className="text-[11px] text-muted-foreground">Total</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <Flame className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-lg font-bold leading-none">{hotCount}</p>
              <p className="text-[11px] text-muted-foreground">Hot</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <p className="text-lg font-bold leading-none">{recentLeads}</p>
              <p className="text-[11px] text-muted-foreground">This Week</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="onboarded" className="space-y-4">
            <TabsList>
              <TabsTrigger value="onboarded" className="gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Onboarded
                {onboardedLeads.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 h-4">{onboardedLeads.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Inquiries
                {leads.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 h-4">{leads.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm h-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={tempFilter} onValueChange={setTempFilter}>
                  <SelectTrigger className="w-[110px] text-sm h-9">
                    <Flame className="h-3 w-3 mr-1 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Temps</SelectItem>
                    <SelectItem value="hot">🔥 Hot</SelectItem>
                    <SelectItem value="warm">🟠 Warm</SelectItem>
                    <SelectItem value="cold">❄️ Cold</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[110px] text-sm h-9">
                    <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {availableSources.map((src) => (
                      <SelectItem key={src} value={src}>{SOURCE_LABELS[src] || src}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[110px] text-sm h-9">
                    <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FILTERS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-9 px-2">Clear</Button>
                )}
              </div>
            </div>

            {/* Onboarded Tab — Table Layout */}
            <TabsContent value="onboarded" className="mt-0">
              {sortedOnboarded.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <UserPlus className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-medium">{hasActiveFilters ? "No leads match filters" : "No onboarded clients yet"}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hasActiveFilters ? "Try adjusting your search." : "Use the onboard form on the dashboard."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">
                    {filteredOnboarded.length} of {onboardedLeads.length} leads
                  </p>

                  {/* Desktop Table */}
                  <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Name</th>
                            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Phone</th>
                            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Email</th>
                            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Source</th>
                            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Tags</th>
                            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Date</th>
                            <th className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedOnboarded.map((lead) => {
                            const temp = (TEMP_CONFIG as any)[lead.temperature] || TEMP_CONFIG.cold;
                            const TempIcon = temp.icon;
                            const projectTag = lead.pitch_decks?.project_name;
                            // Tags = project names + custom tags only (NOT lead sources)
                            const allTags = [
                              ...(projectTag ? [projectTag] : []),
                              ...(lead.tags || []),
                            ];
                            // Source display: show primary + count of extras from tags that match sources
                            const primarySource = SOURCE_LABELS[lead.source] || lead.source;
                            const extraSourceCount = (lead.tags || []).filter(t => Object.keys(SOURCE_LABELS).includes(t) && t !== lead.source).length;
                            // Filter tags to exclude source-type tags for display
                            const displayTags = allTags.filter(t => !Object.keys(SOURCE_LABELS).includes(t));

                            return (
                              <tr
                                key={lead.id}
                                className={cn(
                                  "border-b border-border/50 last:border-0 transition-colors",
                                  lead.temperature === "hot" ? "bg-red-500/[0.03]" : "hover:bg-muted/30"
                                )}
                              >
                                {/* Status — single temperature indicator */}
                                <td className="px-3 py-2.5">
                                  <button
                                    onClick={() => {
                                      const cycle = lead.temperature === "cold" ? "warm" : lead.temperature === "warm" ? "hot" : "cold";
                                      handleSetTemperature(lead.id, cycle);
                                    }}
                                    className={cn(
                                      "inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10px] font-medium border transition-all hover:scale-105",
                                      temp.badgeCn
                                    )}
                                    title={`Click to cycle: ${temp.label}`}
                                  >
                                    <TempIcon className={cn("h-3 w-3", temp.className)} />
                                    {temp.label}
                                  </button>
                                </td>

                                {/* Name */}
                                <td className="px-3 py-2.5">
                                  <p className="font-medium truncate max-w-[160px]">
                                    {lead.first_name} {lead.last_name}
                                  </p>
                                </td>

                                {/* Phone */}
                                <td className="px-3 py-2.5">
                                  {lead.phone ? (
                                    <a href={`tel:${lead.phone}`} className="text-muted-foreground hover:text-primary transition-colors text-xs">
                                      {lead.phone}
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground/40 text-xs">—</span>
                                  )}
                                </td>

                                {/* Email */}
                                <td className="px-3 py-2.5">
                                  <a href={`mailto:${lead.email}`} className="text-muted-foreground hover:text-primary transition-colors text-xs truncate block max-w-[180px]">
                                    {lead.email}
                                  </a>
                                </td>

                                {/* Source — condensed with expandable */}
                                <td className="px-3 py-2.5">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="inline-flex items-center gap-1 text-[10px] h-5 px-1.5 rounded border border-border bg-background hover:bg-muted transition-colors">
                                        {primarySource}
                                        {extraSourceCount > 0 && (
                                          <span className="text-primary font-semibold">+{extraSourceCount}</span>
                                        )}
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-36">
                                      <DropdownMenuItem className="text-xs font-medium" disabled>
                                        Lead Sources
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-xs">{primarySource}</DropdownMenuItem>
                                      {(lead.tags || []).filter(t => Object.keys(SOURCE_LABELS).includes(t) && t !== lead.source).map(src => (
                                        <DropdownMenuItem key={src} className="text-xs">{SOURCE_LABELS[src] || src}</DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>

                                {/* Tags — project names + custom only */}
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                                    {displayTags.map((tag, i) => (
                                      <Badge
                                        key={`${tag}-${i}`}
                                        variant="secondary"
                                        className={cn(
                                          "text-[10px] h-5 px-1.5 gap-0.5 font-normal",
                                          tag === projectTag ? "bg-primary/10 text-primary border-primary/20" : ""
                                        )}
                                      >
                                        {tag === projectTag && <Presentation className="h-2.5 w-2.5" />}
                                        {tag}
                                        {tag !== projectTag && (
                                          <button
                                            onClick={() => handleRemoveTag(lead.id, tag)}
                                            className="ml-0.5 hover:text-destructive"
                                          >
                                            <X className="h-2.5 w-2.5" />
                                          </button>
                                        )}
                                      </Badge>
                                    ))}
                                    {editingTagLeadId === lead.id ? (
                                      <form
                                        onSubmit={(e) => {
                                          e.preventDefault();
                                          handleAddTag(lead.id, newTagValue);
                                          setEditingTagLeadId(null);
                                        }}
                                        className="inline-flex"
                                      >
                                        <Input
                                          ref={tagInputRef}
                                          value={newTagValue}
                                          onChange={(e) => setNewTagValue(e.target.value)}
                                          placeholder="Tag..."
                                          className="h-5 w-20 text-[10px] px-1.5"
                                          autoFocus
                                          onBlur={() => {
                                            if (newTagValue.trim()) handleAddTag(lead.id, newTagValue);
                                            setEditingTagLeadId(null);
                                            setNewTagValue("");
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === "Escape") {
                                              setEditingTagLeadId(null);
                                              setNewTagValue("");
                                            }
                                          }}
                                        />
                                      </form>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setEditingTagLeadId(lead.id);
                                          setNewTagValue("");
                                        }}
                                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                                        title="Add tag"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                </td>

                                {/* Date */}
                                <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                                  {format(new Date(lead.created_at), "MMM d")}
                                </td>

                                {/* Actions */}
                                <td className="px-3 py-2.5 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <MoreVertical className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                      <DropdownMenuItem onClick={() => handleSetTemperature(lead.id, "hot")}>
                                        <Flame className="h-3.5 w-3.5 mr-2 text-red-500" /> Mark Hot
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleSetTemperature(lead.id, "warm")}>
                                        <Thermometer className="h-3.5 w-3.5 mr-2 text-amber-500" /> Mark Warm
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleSetTemperature(lead.id, "cold")}>
                                        <Snowflake className="h-3.5 w-3.5 mr-2 text-blue-400" /> Mark Cold
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem asChild>
                                        <a href={`mailto:${lead.email}`}>
                                          <Mail className="h-3.5 w-3.5 mr-2" /> Email
                                        </a>
                                      </DropdownMenuItem>
                                      {lead.phone && (
                                        <DropdownMenuItem asChild>
                                          <a href={`tel:${lead.phone}`}>
                                            <Phone className="h-3.5 w-3.5 mr-2" /> Call
                                          </a>
                                        </DropdownMenuItem>
                                      )}
                                      {lead.deck_url && (
                                        <DropdownMenuItem asChild>
                                          <a href={lead.deck_url} target="_blank" rel="noopener noreferrer">
                                            <Presentation className="h-3.5 w-3.5 mr-2" /> View Deck
                                          </a>
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteLead(lead.id)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-2">
                    {sortedOnboarded.map((lead) => {
                      const temp = (TEMP_CONFIG as any)[lead.temperature] || TEMP_CONFIG.cold;
                      const TempIcon = temp.icon;
                      const projectTag = lead.pitch_decks?.project_name;
                      const displayTags = [
                        ...(projectTag ? [projectTag] : []),
                        ...(lead.tags || []),
                      ].filter(t => !Object.keys(SOURCE_LABELS).includes(t));
                      const primarySource = SOURCE_LABELS[lead.source] || lead.source;
                      const extraSourceCount = (lead.tags || []).filter(t => Object.keys(SOURCE_LABELS).includes(t) && t !== lead.source).length;

                      return (
                        <div
                          key={lead.id}
                          className={cn(
                            "p-3 rounded-lg border transition-colors",
                            lead.temperature === "hot" ? temp.bg : "border-border"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => {
                                const cycle = lead.temperature === "cold" ? "warm" : lead.temperature === "warm" ? "hot" : "cold";
                                handleSetTemperature(lead.id, cycle);
                              }}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 h-6 rounded-full text-[10px] font-medium border shrink-0 mt-0.5",
                                temp.badgeCn
                              )}
                            >
                              <TempIcon className={cn("h-3 w-3", temp.className)} />
                              {temp.label}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">{lead.first_name} {lead.last_name}</p>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem onClick={() => handleSetTemperature(lead.id, "hot")}>
                                      <Flame className="h-3.5 w-3.5 mr-2 text-red-500" /> Mark Hot
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSetTemperature(lead.id, "warm")}>
                                      <Thermometer className="h-3.5 w-3.5 mr-2 text-amber-500" /> Mark Warm
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSetTemperature(lead.id, "cold")}>
                                      <Snowflake className="h-3.5 w-3.5 mr-2 text-blue-400" /> Mark Cold
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                      <a href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5 mr-2" /> Email</a>
                                    </DropdownMenuItem>
                                    {lead.phone && (
                                      <DropdownMenuItem asChild>
                                        <a href={`tel:${lead.phone}`}><Phone className="h-3.5 w-3.5 mr-2" /> Call</a>
                                      </DropdownMenuItem>
                                    )}
                                    {lead.deck_url && (
                                      <DropdownMenuItem asChild>
                                        <a href={lead.deck_url} target="_blank" rel="noopener noreferrer">
                                          <Presentation className="h-3.5 w-3.5 mr-2" /> View Deck
                                        </a>
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteLead(lead.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              {/* Contact row */}
                              <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                                <a href={`tel:${lead.phone}`} className="hover:text-primary flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {lead.phone || "—"}
                                </a>
                                <span className="text-border">|</span>
                                <a href={`mailto:${lead.email}`} className="hover:text-primary truncate">
                                  {lead.email}
                                </a>
                              </div>
                              {/* Source + date row */}
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                                  {primarySource}
                                  {extraSourceCount > 0 && (
                                    <span className="text-primary font-semibold ml-1">+{extraSourceCount}</span>
                                  )}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground ml-auto">
                                  {format(new Date(lead.created_at), "MMM d")}
                                </span>
                              </div>
                              {/* Tags — project names + custom only */}
                              {(displayTags.length > 0) && (
                                <div className="flex items-center gap-1 mt-2 flex-wrap">
                                  {displayTags.map((tag, i) => (
                                    <Badge
                                      key={`${tag}-${i}`}
                                      variant="secondary"
                                      className={cn(
                                        "text-[10px] h-5 px-1.5 gap-0.5 font-normal",
                                        tag === projectTag ? "bg-primary/10 text-primary border-primary/20" : ""
                                      )}
                                    >
                                      {tag === projectTag && <Presentation className="h-2.5 w-2.5" />}
                                      {tag}
                                      {tag !== projectTag && (
                                        <button onClick={() => handleRemoveTag(lead.id, tag)} className="ml-0.5 hover:text-destructive">
                                          <X className="h-2.5 w-2.5" />
                                        </button>
                                      )}
                                    </Badge>
                                  ))}
                                  <button
                                    onClick={() => {
                                      const tag = prompt("Add tag:");
                                      if (tag) handleAddTag(lead.id, tag);
                                    }}
                                    className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Listing Inquiries Tab */}
            <TabsContent value="inquiries" className="mt-0">
              {filteredLeads.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-medium">{hasActiveFilters ? "No leads match filters" : "No listing inquiries yet"}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hasActiveFilters ? "Try adjusting your search." : "Buyer inquiries on your listings appear here."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <p className="text-[11px] text-muted-foreground">
                    {filteredLeads.length} of {leads.length} inquiries
                  </p>
                  {Object.entries(groupedLeads).map(([listingId, { listing, leads: listingLeads }]) => (
                    <Card key={listingId}>
                      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="font-medium text-sm truncate">{listing?.title}</p>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{listingLeads.length}</Badge>
                      </div>
                      <CardContent className="space-y-2 pt-0">
                        {listingLeads.map((lead) => (
                          <div key={lead.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{lead.name}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <a href={`mailto:${lead.email}`} className="text-xs text-muted-foreground hover:text-primary transition-colors truncate">
                                  {lead.email}
                                </a>
                                {lead.phone && (
                                  <a href={`tel:${lead.phone}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                    {lead.phone}
                                  </a>
                                )}
                              </div>
                              {lead.message && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">"{lead.message}"</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                                {format(new Date(lead.created_at), "MMM d")}
                              </span>
                              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                <a href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5" /></a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
