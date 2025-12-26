import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar,
  Building2,
  Loader2
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

interface GroupedLeads {
  [listingId: string]: {
    listing: { id: string; title: string; project_name: string };
    leads: Lead[];
  };
}

export default function DashboardLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  const fetchLeads = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          id,
          name,
          email,
          phone,
          message,
          created_at,
          listing:listings(id, title, project_name)
        `)
        .eq("agent_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Type assertion for the joined data
      const typedData = (data || []).map(item => ({
        ...item,
        listing: item.listing as { id: string; title: string; project_name: string } | null
      }));
      
      setLeads(typedData);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group leads by listing
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Inquiries from potential buyers ({leads.length} total)
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No leads yet</h3>
              <p className="text-muted-foreground">
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
                    <div
                      key={lead.id}
                      className="p-4 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-2">
                          <p className="font-medium">{lead.name}</p>
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
      </div>
    </DashboardLayout>
  );
}
