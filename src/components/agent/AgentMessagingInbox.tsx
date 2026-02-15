import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Send, 
  Inbox, 
  SendHorizontal, 
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  User
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const db = supabase as any;

interface Inquiry {
  id: string;
  listing_id: string;
  from_agent_id: string;
  to_agent_id: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  listing?: {
    title: string;
    project_name: string;
    assignment_price: number;
  };
  from_agent?: {
    full_name: string;
    email: string;
    brokerage_name: string;
  };
  to_agent?: {
    full_name: string;
    email: string;
    brokerage_name: string;
  };
}

export function AgentMessagingInbox() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [activeTab, setActiveTab] = useState("received");

  // Fetch received inquiries
  const { data: receivedInquiries, isLoading: loadingReceived } = useQuery({
    queryKey: ["agent-inquiries-received", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: inquiries, error } = await db
        .from("assignment_inquiries")
        .select("*")
        .eq("to_agent_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch related data
      const enrichedInquiries = await Promise.all(
        ((inquiries as any[]) || []).map(async (inquiry: any) => {
          const { data: listing } = await db
            .from("listings")
            .select("title, project_name, assignment_price")
            .eq("id", inquiry.listing_id)
            .single();

          const { data: fromProfile } = await db
            .from("profiles")
            .select("full_name, email")
            .eq("user_id", inquiry.from_agent_id)
            .single();

          const { data: fromAgent } = await db
            .from("agent_profiles")
            .select("brokerage_name")
            .eq("user_id", inquiry.from_agent_id)
            .single();

          return {
            ...inquiry,
            listing,
            from_agent: fromProfile ? { ...fromProfile, brokerage_name: fromAgent?.brokerage_name } : null
          };
        })
      );

      return enrichedInquiries as Inquiry[];
    },
    enabled: !!user?.id
  });

  // Fetch sent inquiries
  const { data: sentInquiries, isLoading: loadingSent } = useQuery({
    queryKey: ["agent-inquiries-sent", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: inquiries, error } = await db
        .from("assignment_inquiries")
        .select("*")
        .eq("from_agent_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enrichedInquiries = await Promise.all(
        ((inquiries as any[]) || []).map(async (inquiry: any) => {
          const { data: listing } = await db
            .from("listings")
            .select("title, project_name, assignment_price")
            .eq("id", inquiry.listing_id)
            .single();

          const { data: toProfile } = await db
            .from("profiles")
            .select("full_name, email")
            .eq("user_id", inquiry.to_agent_id)
            .single();

          const { data: toAgent } = await db
            .from("agent_profiles")
            .select("brokerage_name")
            .eq("user_id", inquiry.to_agent_id)
            .single();

          return {
            ...inquiry,
            listing,
            to_agent: toProfile ? { ...toProfile, brokerage_name: toAgent?.brokerage_name } : null
          };
        })
      );

      return enrichedInquiries as Inquiry[];
    },
    enabled: !!user?.id
  });

  // Update inquiry status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await db
        .from("assignment_inquiries")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-inquiries-received"] });
      toast.success("Inquiry updated");
    },
    onError: () => {
      toast.error("Failed to update inquiry");
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-warning border-warning"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "responded":
        return <Badge variant="outline" className="text-success border-success"><CheckCircle className="w-3 h-3 mr-1" /> Responded</Badge>;
      case "declined":
        return <Badge variant="outline" className="text-destructive border-destructive"><XCircle className="w-3 h-3 mr-1" /> Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD',
      maximumFractionDigits: 0 
    }).format(price);
  };

  const InquiryCard = ({ inquiry, type }: { inquiry: Inquiry; type: "received" | "sent" }) => {
    const agent = type === "received" ? inquiry.from_agent : inquiry.to_agent;
    const agentLabel = type === "received" ? "From" : "To";

    return (
      <Card 
        className="cursor-pointer hover:shadow-card-hover transition-shadow"
        onClick={() => setSelectedInquiry(inquiry)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {agent?.full_name?.split(' ').map(n => n[0]).join('') || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">{agentLabel}:</span>
                  <span className="font-medium text-sm truncate">{agent?.full_name || "Unknown Agent"}</span>
                </div>
                {inquiry.listing && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate">{inquiry.listing.project_name}</span>
                    <span className="text-primary font-medium">{formatPrice(inquiry.listing.assignment_price)}</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">{inquiry.message}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {getStatusBadge(inquiry.status)}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const pendingCount = receivedInquiries?.filter(i => i.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Agent Inbox
          </h2>
          <p className="text-muted-foreground">Manage your assignment inquiries</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-primary text-primary-foreground">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Received ({receivedInquiries?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <SendHorizontal className="h-4 w-4" />
            Sent ({sentInquiries?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          {loadingReceived ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : receivedInquiries?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No inquiries yet</h3>
                <p className="text-muted-foreground text-sm">
                  When agents inquire about your listings, they'll appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {receivedInquiries?.map(inquiry => (
                <InquiryCard key={inquiry.id} inquiry={inquiry} type="received" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          {loadingSent ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sentInquiries?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No sent inquiries</h3>
                <p className="text-muted-foreground text-sm">
                  Browse assignments and send inquiries to other agents.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sentInquiries?.map(inquiry => (
                <InquiryCard key={inquiry.id} inquiry={inquiry} type="sent" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Inquiry Detail Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
          </DialogHeader>
          
          {selectedInquiry && (
            <div className="space-y-4">
              {selectedInquiry.listing && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-medium">{selectedInquiry.listing.project_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedInquiry.listing.title}</p>
                    <p className="text-lg font-bold text-primary mt-2">
                      {formatPrice(selectedInquiry.listing.assignment_price)}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(selectedInquiry.from_agent?.full_name || selectedInquiry.to_agent?.full_name || "A")
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedInquiry.from_agent?.full_name || selectedInquiry.to_agent?.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedInquiry.from_agent?.brokerage_name || selectedInquiry.to_agent?.brokerage_name}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Message</h4>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  {selectedInquiry.message}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Sent {format(new Date(selectedInquiry.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                {getStatusBadge(selectedInquiry.status)}
              </div>

              {selectedInquiry.to_agent_id === user?.id && selectedInquiry.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      updateStatus.mutate({ id: selectedInquiry.id, status: "declined" });
                      setSelectedInquiry(null);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      updateStatus.mutate({ id: selectedInquiry.id, status: "responded" });
                      if (selectedInquiry.from_agent?.email) {
                        window.location.href = `mailto:${selectedInquiry.from_agent.email}?subject=RE: ${selectedInquiry.listing?.project_name || 'Assignment Inquiry'}`;
                      }
                      setSelectedInquiry(null);
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Respond via Email
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
