import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Mail, Eye, TrendingUp } from "lucide-react";

interface DailyStats {
  newLeadsToday: number;
  emailsSentToday: number;
  emailsOpenedToday: number;
  totalLeads: number;
}

export function DailySummaryWidget() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DailyStats>({ newLeadsToday: 0, emailsSentToday: 0, emailsOpenedToday: 0, totalLeads: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const fetchStats = async () => {
      try {
        const [leadsRes, totalLeadsRes, emailsSentRes, emailsOpenedRes] = await Promise.all([
          // New leads today
          supabase.from("clients").select("id", { count: "exact", head: true })
            .eq("user_id", user.id).gte("created_at", todayISO),
          // Total leads
          supabase.from("clients").select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          // Emails sent today
          supabase.from("email_logs").select("id", { count: "exact", head: true })
            .eq("sent_by", user.id).gte("sent_at", todayISO),
          // Emails opened today
          supabase.from("email_logs").select("id", { count: "exact", head: true })
            .eq("sent_by", user.id).gte("opened_at", todayISO),
        ]);

        setStats({
          newLeadsToday: leadsRes.count || 0,
          totalLeads: totalLeadsRes.count || 0,
          emailsSentToday: emailsSentRes.count || 0,
          emailsOpenedToday: emailsOpenedRes.count || 0,
        });
      } catch (err) {
        console.error("[DailySummary] error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const items = [
    { label: "New Leads Today", value: stats.newLeadsToday, icon: Users, color: "text-blue-600 bg-blue-100" },
    { label: "Total Leads", value: stats.totalLeads, icon: TrendingUp, color: "text-emerald-600 bg-emerald-100" },
    { label: "Emails Sent Today", value: stats.emailsSentToday, icon: Mail, color: "text-violet-600 bg-violet-100" },
    { label: "Opens Today", value: stats.emailsOpenedToday, icon: Eye, color: "text-amber-600 bg-amber-100" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${item.color}`}>
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <p className={`text-xl font-bold ${loading ? "animate-pulse text-muted-foreground" : ""}`}>
                {loading ? "–" : item.value}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
