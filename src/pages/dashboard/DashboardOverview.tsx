import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LeadOnboardHub } from "@/components/leads/LeadOnboardHub";
import {
  Presentation,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
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
  const [agentName, setAgentName] = useState("");
  const [decks, setDecks] = useState<PitchDeck[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("user_id", user.id).single()
      .then(({ data }) => { if (data?.full_name) setAgentName(data.full_name.split(" ")[0]); });
    supabase.from("pitch_decks").select("id, project_name, slug, hero_image_url, city, is_published")
      .eq("is_published", true).order("updated_at", { ascending: false }).limit(6)
      .then(({ data }) => { if (data) setDecks(data); });
  }, [user]);

  const handleCopy = async (slug: string) => {
    await navigator.clipboard.writeText(`https://presaleproperties.com/deck/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Greeting */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          {agentName ? `Hey ${agentName}` : "Welcome back"}
        </h1>

        {/* PRIMARY: Onboard Form */}
        <LeadOnboardHub />

        {/* SECONDARY: Quick Deck Links */}
        {decks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Your Decks</h2>
              <Link to="/dashboard/decks">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground h-7">
                  All Decks <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                >
                  {deck.hero_image_url ? (
                    <img src={deck.hero_image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                      <Presentation className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{deck.project_name}</p>
                    {deck.city && <p className="text-xs text-muted-foreground">{deck.city}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(deck.slug)}>
                      {copiedSlug === deck.slug ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <a href={`https://presaleproperties.com/deck/${deck.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
