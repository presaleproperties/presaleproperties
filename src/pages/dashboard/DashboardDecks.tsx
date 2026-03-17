import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  Loader2,
  Presentation,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PitchDeck {
  id: string;
  slug: string;
  project_name: string;
  city: string | null;
  is_published: boolean;
  created_at: string;
}

export default function DashboardDecks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState<PitchDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDecks = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("pitch_decks")
      .select("id, slug, project_name, city, is_published, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load decks");
    } else {
      setDecks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDecks();
  }, [user]);

  const handleDelete = async (deck: PitchDeck) => {
    if (!confirm(`Delete "${deck.project_name}"? This cannot be undone.`)) return;
    setDeletingId(deck.id);
    const { error } = await (supabase as any)
      .from("pitch_decks")
      .delete()
      .eq("id", deck.id);
    if (error) {
      toast.error("Failed to delete deck");
    } else {
      toast.success("Deck deleted");
      setDecks((prev) => prev.filter((d) => d.id !== deck.id));
    }
    setDeletingId(null);
  };

  const copyLink = (slug: string) => {
    const url = `https://presaleproperties.com/deck/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pitch Decks</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create and share investor-ready project presentations
            </p>
          </div>
          <Button onClick={() => navigate("/dashboard/decks/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Deck
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : decks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-4">
              <Presentation className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <div>
                <p className="font-semibold text-foreground">No pitch decks yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first shareable investor deck for a presale project
                </p>
              </div>
              <Button onClick={() => navigate("/dashboard/decks/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Deck
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <Card key={deck.id} className="group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground truncate">{deck.project_name || "Untitled"}</h3>
                      <p className="text-sm text-muted-foreground">{deck.city || "—"}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          {deletingId === deck.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {deck.is_published && (
                          <DropdownMenuItem asChild>
                            <a
                              href={`/deck/${deck.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Public Page
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => copyLink(deck.slug)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Share Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/decks/${deck.id}/edit`)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(deck)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Badge
                      variant={deck.is_published ? "default" : "secondary"}
                      className={
                        deck.is_published
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : ""
                      }
                    >
                      {deck.is_published ? "Published" : "Draft"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(deck.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Share URL */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                    <span className="text-xs text-muted-foreground flex-1 truncate font-mono">
                      /deck/{deck.slug}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => copyLink(deck.slug)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => navigate(`/dashboard/decks/${deck.id}/edit`)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {deck.is_published && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        asChild
                      >
                        <a href={`/deck/${deck.slug}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
