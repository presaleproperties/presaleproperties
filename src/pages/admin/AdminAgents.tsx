import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Building2,
  FileText,
  Loader2
} from "lucide-react";

interface AgentProfile {
  id: string;
  user_id: string;
  license_number: string;
  brokerage_name: string;
  brokerage_address: string | null;
  verification_status: string;
  verification_notes: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string;
    phone: string | null;
  };
}

export default function AdminAgents() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [actionType, setActionType] = useState<"verify" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data: agentProfiles, error } = await supabase
        .from("agent_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each agent
      const agentsWithProfiles = await Promise.all(
        (agentProfiles || []).map(async (agent) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, phone")
            .eq("user_id", agent.user_id)
            .single();
          
          return { ...agent, profile: profile || undefined };
        })
      );

      setAgents(agentsWithProfiles);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast({
        title: "Error",
        description: "Failed to load agents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (agent: AgentProfile, action: "verify" | "reject") => {
    setSelectedAgent(agent);
    setActionType(action);
    setNotes("");
  };

  const confirmAction = async () => {
    if (!selectedAgent || !actionType) return;

    setProcessing(true);
    try {
      const newStatus = actionType === "verify" ? "verified" : "rejected";
      
      const { error } = await supabase
        .from("agent_profiles")
        .update({
          verification_status: newStatus,
          verification_notes: notes || null,
          verified_at: actionType === "verify" ? new Date().toISOString() : null,
        })
        .eq("id", selectedAgent.id);

      if (error) throw error;

      toast({
        title: actionType === "verify" ? "Agent Verified" : "Agent Rejected",
        description: `${selectedAgent.profile?.full_name || "Agent"} has been ${newStatus}`,
      });

      // Refresh the list
      fetchAgents();
    } catch (error) {
      console.error("Error updating agent:", error);
      toast({
        title: "Error",
        description: "Failed to update agent status",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setSelectedAgent(null);
      setActionType(null);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    if (activeTab === "pending") return agent.verification_status === "unverified";
    if (activeTab === "verified") return agent.verification_status === "verified";
    if (activeTab === "rejected") return agent.verification_status === "rejected";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Agent Verification</h1>
          <p className="text-muted-foreground">Review and verify agent license information</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({agents.filter(a => a.verification_status === "unverified").length})
            </TabsTrigger>
            <TabsTrigger value="verified" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Verified ({agents.filter(a => a.verification_status === "verified").length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4" />
              Rejected ({agents.filter(a => a.verification_status === "rejected").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAgents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No agents found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === "pending" 
                      ? "No agents pending verification"
                      : `No ${activeTab} agents`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAgents.map((agent) => (
                  <Card key={agent.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              {agent.profile?.full_name || "Unknown Agent"}
                            </h3>
                            {getStatusBadge(agent.verification_status)}
                          </div>
                          
                          <div className="grid gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{agent.profile?.email}</span>
                              {agent.profile?.phone && (
                                <span className="text-muted-foreground">• {agent.profile.phone}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>License: <strong>{agent.license_number}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{agent.brokerage_name}</span>
                              {agent.brokerage_address && (
                                <span className="text-muted-foreground">• {agent.brokerage_address}</span>
                              )}
                            </div>
                          </div>

                          {agent.verification_notes && (
                            <div className="text-sm bg-muted/50 p-3 rounded-md">
                              <strong>Notes:</strong> {agent.verification_notes}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {agent.verification_status === "unverified" && (
                            <>
                              <Button
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleAction(agent, "verify")}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Verify
                              </Button>
                              <Button
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleAction(agent, "reject")}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                          {agent.verification_status === "rejected" && (
                            <Button
                              variant="outline"
                              onClick={() => handleAction(agent, "verify")}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Verify
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedAgent && !!actionType} onOpenChange={() => { setSelectedAgent(null); setActionType(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "verify" ? "Verify Agent" : "Reject Agent"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "verify" 
                ? `Confirm verification for ${selectedAgent?.profile?.full_name || "this agent"}?`
                : `Reject ${selectedAgent?.profile?.full_name || "this agent"}? Please provide a reason.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {actionType === "verify" ? "Notes (optional)" : "Rejection Reason"}
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={actionType === "verify" 
                  ? "Add any verification notes..."
                  : "Explain why the verification was rejected..."}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedAgent(null); setActionType(null); }}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={processing || (actionType === "reject" && !notes.trim())}
              className={actionType === "verify" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === "verify" ? "Confirm Verification" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
