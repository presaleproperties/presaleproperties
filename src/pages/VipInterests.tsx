import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { VipHeader } from "@/components/vip/VipHeader";
import { useVipAuth } from "@/hooks/useVipAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Building2, ArrowRight, Clock, CheckCircle2, MessageCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30", icon: <Clock className="h-3 w-3" /> },
  contacted: { label: "Contacted", color: "bg-primary/10 text-primary border-primary/30", icon: <MessageCircle className="h-3 w-3" /> },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground border-border", icon: <CheckCircle2 className="h-3 w-3" /> },
};

export default function VipInterests() {
  const navigate = useNavigate();
  const { vipUser, isVipLoggedIn, loading: authLoading } = useVipAuth();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isVipLoggedIn) navigate("/vip-login");
  }, [authLoading, isVipLoggedIn, navigate]);

  useEffect(() => {
    if (vipUser) loadInquiries();
  }, [vipUser]);

  async function loadInquiries() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("off_market_inquiries")
      .select("*")
      .eq("user_id", vipUser!.id)
      .order("created_at", { ascending: false });
    setInquiries(data || []);
    setLoading(false);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Interests | VIP Portal</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <VipHeader />

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            My Interests
          </h1>
          <p className="text-muted-foreground mt-1">
            Track units you've expressed interest in.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : inquiries.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-border rounded-2xl">
            <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">No interests yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Browse projects and click "I'm Interested" on any unit.
            </p>
            <Button onClick={() => navigate("/vip")}>
              <Building2 className="h-4 w-4 mr-2" />
              Browse Projects
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inq: any) => {
              const cfg = STATUS_CONFIG[inq.status] || STATUS_CONFIG.pending;
              return (
                <div
                  key={inq.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{inq.project_name || "Unknown Project"}</p>
                      <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
                        {cfg.icon}
                        <span className="ml-1">{cfg.label}</span>
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {inq.unit_name || "General Interest"} · {new Date(inq.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    {inq.message && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">"{inq.message}"</p>
                    )}
                  </div>
                  {inq.project_name && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 hidden sm:flex"
                      onClick={() => {
                        // Find the listing slug from project name - navigate to detail
                        navigate("/vip");
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
