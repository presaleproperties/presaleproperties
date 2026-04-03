import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { format } from "date-fns";

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
  created_at: string;
  pitch_decks: { project_name: string; slug: string } | null;
}

interface GroupedLeads {
  [listingId: string]: {
    listing: { id: string; title: string; project_name: string };
    leads: Lead[];
  };
}

const SOURCE_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  website: "Website",
  referral: "Referral",
};

export default function DashboardLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [onboardedLeads, setOnboardedLeads] = useState<OnboardedLead[]>([]);
  const [loading, setLoading] = useState(true);

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
          .select("id, first_name, last_name, email, phone, source, notes, deck_url, zapier_synced, created_at, pitch_decks(project_name, slug)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (listingLeads.data) {
        setLeads(
          listingLeads.data.map((item: any) => ({
            ...item,
            listing: item.listing as Lead["listing"],
          }))
        );
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

  const groupedLeads = leads.reduce<GroupedLeads>((acc, lead) => {
    const listingId = lead.listing?.id || "unknown";
    if (!acc[listingId]) {
      acc[listingId] = {
        listing: lead.listing || { id: "unknown", title: "Unknown Listing", project_name: "" },
        leads: [],
      };
    }
    acc[listingId].leads.push(lead);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            All your leads — onboarded clients and listing inquiries
          </p>
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
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 h-4">
                    {onboardedLeads.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Listing Inquiries
                {leads.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 h-4">
                    {leads.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Onboarded Leads Tab */}
            <TabsContent value="onboarded">
              {onboardedLeads.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <UserPlus className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No onboarded clients yet</h3>
                    <p className="text-muted-foreground text-sm">
                      Use the onboard form on the dashboard to add your first client.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {onboardedLeads.map((lead) => (
                    <Card key={lead.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="space-y-2 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">
                                {lead.first_name} {lead.last_name}
                              </p>
                              <Badge variant="outline" className="text-[10px]">
                                {SOURCE_LABELS[lead.source] || lead.source}
                              </Badge>
                              {lead.zapier_synced && (
                                <Badge className="text-[10px] bg-primary/10 text-primary border-0 gap-0.5">
                                  <Check className="h-2.5 w-2.5" />
                                  Synced
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <a
                                href={`mailto:${lead.email}`}
                                className="flex items-center gap-1 hover:text-primary transition-colors"
                              >
                                <Mail className="h-3 w-3" />
                                {lead.email}
                              </a>
                              {lead.phone && (
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  <Phone className="h-3 w-3" />
                                  {lead.phone}
                                </a>
                              )}
                            </div>
                            {lead.notes && (
                              <p className="text-sm text-muted-foreground bg-muted p-2 rounded border border-border">
                                {lead.notes}
                              </p>
                            )}
                            {lead.deck_url && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <Presentation className="h-3 w-3 text-primary" />
                                <a
                                  href={lead.deck_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline truncate"
                                >
                                  {(lead.pitch_decks as any)?.project_name || "Pitch Deck"}
                                  <ExternalLink className="h-2.5 w-2.5 inline ml-1" />
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(lead.created_at), "MMM d, yyyy")}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Listing Inquiries Tab */}
            <TabsContent value="inquiries">
              {leads.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No listing inquiries yet</h3>
                    <p className="text-muted-foreground text-sm">
                      When buyers submit inquiries on your listings, they'll appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedLeads).map(([listingId, { listing, leads: listingLeads }]) => (
                    <Card key={listingId}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-lg">{listing.title}</CardTitle>
                          <Badge variant="secondary">{listingLeads.length}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{listing.project_name}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {listingLeads.map((lead) => (
                          <div key={lead.id} className="p-4 rounded-lg border border-border bg-muted/30">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="space-y-2">
                                <p className="font-medium">{lead.name}</p>
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                                    <Mail className="h-3 w-3" />
                                    {lead.email}
                                  </a>
                                  {lead.phone && (
                                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                                      <Phone className="h-3 w-3" />
                                      {lead.phone}
                                    </a>
                                  )}
                                </div>
                                {lead.message && (
                                  <p className="text-sm text-muted-foreground bg-background p-2 rounded border border-border mt-2">
                                    "{lead.message}"
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(lead.created_at), "MMM d, yyyy 'at' h:mm a")}
                              </div>
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
