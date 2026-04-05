import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LeadOnboardHub } from "@/components/leads/LeadOnboardHub";
import {
  Presentation,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Users,
  Mail,
  Megaphone,
  Plus,
  Eye,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PitchDeck {
  id: string;
  project_name: string;
  slug: string;
  hero_image_url: string | null;
  city: string | null;
  is_published: boolean;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agentName, setAgentName] = useState("");
  const [decks, setDecks] = useState<PitchDeck[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [stats, setStats] = useState({ leads: 0, emails: 0, decks: 0 });

  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
      (supabase as any).from("pitch_decks")
        .select("id, project_name, slug, hero_image_url, city, is_published")
        .eq("user_id", user.id)
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(6),
      supabase.from("onboarded_leads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("email_logs").select("id", { count: "exact", head: true }).eq("sent_by", user.id),
    ]).then(([profileRes, decksRes, leadsRes, emailsRes]) => {
      if (profileRes.data?.full_name) setAgentName(profileRes.data.full_name);
      if (decksRes.data) setDecks(decksRes.data);
      setStats({
        leads: leadsRes.count || 0,
        emails: emailsRes.count || 0,
        decks: decksRes.data?.length || 0,
      });
    });
  }, [user]);

  const handleCopy = async (slug: string) => {
    await navigator.clipboard.writeText(`https://presaleproperties.com/deck/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {agentName ? `${greeting()}, ${agentName.split(" ")[0]}` : greeting()}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening with your pipeline today.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Leads", value: stats.leads, icon: Users, href: "/dashboard/leads", color: "text-blue-600 bg-blue-50" },
            { label: "Emails Sent", value: stats.emails, icon: Mail, href: "/dashboard/emails", color: "text-emerald-600 bg-emerald-50" },
            { label: "Active Decks", value: stats.decks, icon: Presentation, href: "/dashboard/decks", color: "text-amber-600 bg-amber-50" },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() => navigate(stat.href)}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5 text-left transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className={cn("inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg mb-3", stat.color)}>
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{stat.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              <ArrowRight className="absolute top-4 right-4 h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all" />
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/dashboard/decks/new")}
            className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">New Pitch Deck</p>
              <p className="text-xs text-muted-foreground">Create & share</p>
            </div>
          </button>
          <button
            onClick={() => navigate("/dashboard/email-builder?template=project-email")}
            className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
              <Megaphone className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">New Campaign</p>
              <p className="text-xs text-muted-foreground">Build & send email</p>
            </div>
          </button>
        </div>

        {/* Lead Onboard Hub */}
        <LeadOnboardHub />

        {/* Deck Links — show most recent, rest in expandable */}
        {decks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Latest Deck</h2>
              <Link to="/dashboard/decks">
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground h-7 hover:text-foreground">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* Most recent deck — always visible */}
            {(() => {
              const deck = decks[0];
              return (
                <div className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-sm hover:border-primary/20 transition-all">
                  {deck.hero_image_url ? (
                    <img src={deck.hero_image_url} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Presentation className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-foreground">{deck.project_name}</p>
                    {deck.city && <p className="text-xs text-muted-foreground">{deck.city}</p>}
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleCopy(deck.slug)}>
                      {copiedSlug === deck.slug ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <a href={`https://presaleproperties.com/deck/${deck.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })()}

            {/* Remaining decks — collapsible */}
            {decks.length > 1 && (
              <>
                <button
                  onClick={() => setShowAllDecks(!showAllDecks)}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-1"
                >
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAllDecks && "rotate-180")} />
                  {showAllDecks ? "Hide" : `Show ${decks.length - 1} more deck${decks.length - 1 > 1 ? "s" : ""}`}
                </button>
                {showAllDecks && (
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {decks.slice(1).map((deck) => (
                      <div
                        key={deck.id}
                        className="group flex items-center gap-3 p-2.5 rounded-xl border border-border bg-card hover:shadow-sm hover:border-primary/20 transition-all"
                      >
                        {deck.hero_image_url ? (
                          <img src={deck.hero_image_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Presentation className="h-3.5 w-3.5 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-foreground">{deck.project_name}</p>
                          {deck.city && <p className="text-[11px] text-muted-foreground">{deck.city}</p>}
                        </div>
                        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleCopy(deck.slug)}>
                            {copiedSlug === deck.slug ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                          <a href={`https://presaleproperties.com/deck/${deck.slug}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
