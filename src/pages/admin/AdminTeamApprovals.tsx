import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Check, X, Loader2, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface TeamProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: "pending" | "approved" | "denied";
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
}

export default function AdminTeamApprovals() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<TeamProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "approved" | "denied">("pending");

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("team_member_profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setProfiles(data as TeamProfile[]);
    setLoading(false);
  }

  useEffect(() => { fetchProfiles(); }, []);

  async function handleApprove(p: TeamProfile) {
    setActing(p.id);
    // 1. Update profile status
    const { error: updErr } = await (supabase as any)
      .from("team_member_profiles")
      .update({ status: "approved", reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq("id", p.id);
    if (updErr) { toast.error(updErr.message); setActing(null); return; }

    // 2. Grant team_member role
    const { error: roleErr } = await (supabase as any)
      .from("user_roles")
      .upsert({ user_id: p.user_id, role: "team_member" }, { onConflict: "user_id,role" });
    if (roleErr) { toast.error("Approved but role grant failed: " + roleErr.message); setActing(null); fetchProfiles(); return; }

    toast.success(`${p.full_name} approved`);
    setActing(null);
    fetchProfiles();
  }

  async function handleDeny(p: TeamProfile) {
    setActing(p.id);
    const { error } = await (supabase as any)
      .from("team_member_profiles")
      .update({ status: "denied", reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else toast.success(`${p.full_name} denied`);
    // Also remove role if previously granted
    await (supabase as any).from("user_roles").delete().eq("user_id", p.user_id).eq("role", "team_member");
    setActing(null);
    fetchProfiles();
  }

  const filtered = profiles.filter(p => p.status === tab);

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Team Approvals</h1>
            <p className="text-sm text-muted-foreground">Review and approve internal team member access requests</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Pending ({profiles.filter(p => p.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({profiles.filter(p => p.status === "approved").length})</TabsTrigger>
            <TabsTrigger value="denied">Denied ({profiles.filter(p => p.status === "denied").length})</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <p className="text-sm text-muted-foreground">No {tab} requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{p.full_name}</span>
                        <Badge variant={p.status === "approved" ? "default" : p.status === "denied" ? "destructive" : "secondary"}>
                          {p.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{p.email}{p.phone ? ` · ${p.phone}` : ""}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1">
                        Requested {new Date(p.created_at).toLocaleString()}
                      </p>
                    </div>
                    {p.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleDeny(p)} disabled={acting === p.id}>
                          <X className="h-4 w-4 mr-1" /> Deny
                        </Button>
                        <Button size="sm" onClick={() => handleApprove(p)} disabled={acting === p.id}>
                          {acting === p.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                          Approve
                        </Button>
                      </div>
                    )}
                    {p.status === "approved" && (
                      <Button size="sm" variant="outline" onClick={() => handleDeny(p)} disabled={acting === p.id}>
                        Revoke
                      </Button>
                    )}
                    {p.status === "denied" && (
                      <Button size="sm" onClick={() => handleApprove(p)} disabled={acting === p.id}>
                        Approve
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
