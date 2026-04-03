import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LeadOnboardHub } from "@/components/leads/LeadOnboardHub";
import {
  Sparkles,
  Presentation,
  ArrowRight,
  Eye,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PitchDeck {
  id: string;
  project_name: string;
  slug: string;
  hero_image_url: string | null;
  city: string | null;
  is_published: boolean;
  updated_at: string;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [agentName, setAgentName] = useState("");
  const [decks, setDecks] = useState<PitchDeck[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch profile name and decks in parallel
    supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) setAgentName(data.full_name.split(" ")[0]);
      });

    supabase
      .from("pitch_decks")
      .select("id, project_name, slug, hero_image_url, city, is_published, updated_at")
      .order("updated_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setDecks(data);
      });
  }, [user]);

  const handleCopyLink = async (slug: string) => {
    const url = `https://presaleproperties.com/deck/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Compact Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Agent Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {agentName ? `Hey ${agentName}` : "Welcome back"}
            </h1>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/decks/new">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Presentation className="h-4 w-4" />
                New Deck
              </Button>
            </Link>
          </div>
        </div>

        {/* PRIMARY: Lead Onboard Form */}
        <LeadOnboardHub />

        {/* SECONDARY: Pitch Decks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Presentation className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Your Pitch Decks</h2>
            </div>
            <Link to="/dashboard/decks">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {decks.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Presentation className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No pitch decks yet.{" "}
                  <Link to="/dashboard/decks/new" className="text-primary hover:underline">
                    Create your first deck
                  </Link>
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {decks.map((deck) => (
                <Card
                  key={deck.id}
                  className="group overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="relative h-32 bg-muted">
                    {deck.hero_image_url ? (
                      <img
                        src={deck.hero_image_url}
                        alt={deck.project_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Presentation className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <Badge
                      className={cn(
                        "absolute top-2 right-2 text-[10px]",
                        deck.is_published
                          ? "bg-primary/90 text-primary-foreground"
                          : "bg-muted-foreground/80 text-background"
                      )}
                    >
                      {deck.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <p className="font-medium text-sm truncate">
                        {deck.project_name || "Untitled Deck"}
                      </p>
                      {deck.city && (
                        <p className="text-xs text-muted-foreground">{deck.city}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/dashboard/decks/${deck.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                          Edit
                        </Button>
                      </Link>
                      {deck.is_published && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs px-2"
                            onClick={() => handleCopyLink(deck.slug)}
                          >
                            {copiedSlug === deck.slug ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <a
                            href={`https://presaleproperties.com/deck/${deck.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs px-2"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
