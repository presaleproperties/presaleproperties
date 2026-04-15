import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Plus, MoreVertical, Eye, Pencil, Trash2, Copy,
  ExternalLink, Loader2, Presentation, Mail, Lock, Unlock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PitchDeck {
  id: string;
  slug: string;
  project_name: string;
  city: string | null;
  is_published: boolean;
  created_at: string;
  hero_image_url: string | null;
  gate_enabled: boolean;
}

const DRAFT_KEY = "ai-email-builder-draft";

export function PitchDecksList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState<PitchDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [emailLoadingId, setEmailLoadingId] = useState<string | null>(null);

  const fetchDecks = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("pitch_decks")
      .select("id, slug, project_name, city, is_published, created_at, hero_image_url, gate_enabled")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load decks");
    else setDecks(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDecks(); }, [user]);

  const handleDelete = async (deck: PitchDeck) => {
    if (!confirm(`Delete "${deck.project_name}"? This cannot be undone.`)) return;
    setDeletingId(deck.id);
    const { error } = await (supabase as any).from("pitch_decks").delete().eq("id", deck.id);
    if (error) toast.error("Failed to delete deck");
    else { toast.success("Deck deleted"); setDecks(prev => prev.filter(d => d.id !== deck.id)); }
    setDeletingId(null);
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`https://presaleproperties.com/deck/${slug}`);
    toast.success("Public link copied!");
  };

  const handleSendEmail = async (deck: PitchDeck) => {
    setEmailLoadingId(deck.id);
    try {
      const { data: deckData, error } = await (supabase as any)
        .from("pitch_decks")
        .select(`id, slug, project_name, city, developer_name, hero_image_url, tagline, completion_year, assignment_fee, included_items, next_price_increase, units_remaining, deposit_steps, highlights, description, amenities, floor_plans, gallery, linked_project_id`)
        .eq("id", deck.id)
        .single();
      if (error || !deckData) { toast.error("Could not load deck data"); return; }

      const rawFloorPlans: any[] = Array.isArray(deckData.floor_plans) ? deckData.floor_plans : (typeof deckData.floor_plans === "string" ? JSON.parse(deckData.floor_plans || "[]") : []);
      const floorPlanEntries = rawFloorPlans.filter((fp: any) => fp.image_url).slice(0, 6).map((fp: any) => {
        const beds = fp.beds != null ? fp.beds : null;
        const baths = fp.baths != null ? fp.baths : null;
        let label = fp.unit_type || "";
        if (beds != null && baths != null) label = `${beds} Bed${beds !== 1 ? "" : ""} + ${baths} Bath${baths !== 1 ? "" : ""}`;
        return { id: fp.id || String(Math.random()), url: fp.image_url || "", label, sqft: fp.size_range || "", price: fp.price_from || "", exclusive_credit: fp.exclusive_credit || "" };
      });

      const firstPricedPlan = rawFloorPlans.find((fp: any) => fp.price_from);
      const startingPrice = firstPricedPlan?.price_from || "";
      const depositSteps: any[] = Array.isArray(deckData.deposit_steps) ? deckData.deposit_steps : [];
      const depositStr = depositSteps.length > 0 ? depositSteps.map((s: any) => `${s.percent}% ${s.label}`).join(" · ") : "";
      const includedItemsList: string[] = Array.isArray(deckData.included_items) ? deckData.included_items : [];
      const incentiveText = includedItemsList.map((i: string) => `✦ ${i}`).join("\n");
      const highlights: string[] = Array.isArray(deckData.highlights) ? deckData.highlights : [];
      const highlightBullets = highlights.slice(0, 5).map((h: string) => `• ${h}`).join("\n");
      const completionStr = deckData.completion_year ? `${deckData.completion_year}` : "";

      const bodyCopy = [
        `Hi {$name},`, ``,
        `I wanted to personally reach out with the full details on ${deckData.project_name}${deckData.city ? ` in ${deckData.city}` : ""}.`,
        highlightBullets ? `\n${highlightBullets}` : "",
        `\nBelow you'll find the floor plans, pricing, and deposit structure. I work exclusively with buyers — my job is to make sure you have everything you need to make the right call.`,
        `\nGive me a call or reply whenever you're ready.`,
      ].filter(Boolean).join("\n");

      const subjectLine = `${deckData.project_name}${deckData.city ? ` · ${deckData.city}` : ""} — Exclusive Presale Details`;
      const previewText = startingPrice ? `Starting from ${startingPrice} · floor plans + pricing inside` : `Floor plans, pricing & deposit structure inside`;
      const headline = deckData.tagline || `Exclusive Access — ${deckData.project_name}`;
      const deckPublicUrl = `https://presaleproperties.lovable.app/deck/${deck.slug}`;

      const draft = {
        _savedAt: new Date().toISOString(), _source: "deck", _deckId: deck.id, _deckUrl: deckPublicUrl,
        _deckParking: "1 Parking Stall Included", _deckLocker: "1 Storage Locker Included",
        prompt: `Write a concise project intro email for ${deckData.project_name} in ${deckData.city || "BC"}.`,
        templateType: "project-intro", selProjectId: deckData.linked_project_id || "none",
        activeVersion: "A", aiResult: null, projectName: deckData.project_name || "",
        developerName: deckData.developer_name || "", showProjectName: true,
        showDeveloperName: !!deckData.developer_name, customHeader: "", city: deckData.city || "",
        neighborhood: "", startingPrice, deposit: depositStr, completion: completionStr,
        infoRows: [
          deckData.assignment_fee ? `Assignment Fee|${deckData.assignment_fee}` : "",
          deckData.next_price_increase ? `Next Price Increase|${deckData.next_price_increase}` : "",
          deckData.units_remaining ? `Units Remaining|${deckData.units_remaining}` : "",
        ].filter(Boolean),
        subjectLine, previewText, headline, bodyCopy, incentiveText,
        heroImage: deckData.hero_image_url || "", floorPlans: floorPlanEntries,
        fpHeading: "Available Floor Plans",
        fpSubheading: floorPlanEntries.length > 0 ? `${floorPlanEntries.length} unit type${floorPlanEntries.length > 1 ? "s" : ""} available — exclusive pricing inside` : "Contact us for available floor plans",
        imageCards: [],
        loopSlides: (() => {
          const slides: string[] = [];
          if (deckData.hero_image_url) slides.push(deckData.hero_image_url);
          try {
            const galleryItems = Array.isArray(deckData.gallery) ? deckData.gallery : (typeof deckData.gallery === "string" ? JSON.parse(deckData.gallery || "[]") : []);
            for (const item of galleryItems) {
              const url = typeof item === "string" ? item : item?.url;
              if (url && !slides.includes(url) && slides.length < 8) slides.push(url);
            }
          } catch { /* ignore */ }
          return slides;
        })(),
        selectedAssetId: "none", directCtaUrl: deckPublicUrl, selAgent: "Uzair Muhammad",
        fontId: "jakarta-jakarta", layoutVersion: "pitch-deck",
      };

      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      toast.success(`Email pre-loaded for ${deck.project_name} — opening builder…`);
      navigate(`/dashboard/email-builder?source=deck&t=${Date.now()}`);
    } catch (err) {
      console.error("handleSendEmail error:", err);
      toast.error("Failed to prepare email");
    } finally {
      setEmailLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl text-center">
        <Presentation className="h-10 w-10 text-muted-foreground/20 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No pitch decks yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1 mb-4 max-w-xs">
          Create your first shareable investor deck for a presale project
        </p>
        <Button onClick={() => navigate("/dashboard/decks/new")} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Create Deck
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => navigate("/dashboard/decks/new")} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Deck
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((deck) => (
          <Card key={deck.id} className="group overflow-hidden">
            {deck.hero_image_url ? (
              <div className="w-full h-32 bg-muted overflow-hidden">
                <img src={deck.hero_image_url} alt={deck.project_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            ) : (
              <div className="w-full h-32 bg-muted/50 flex items-center justify-center">
                <Presentation className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{deck.project_name || "Untitled"}</h3>
                  <p className="text-sm text-muted-foreground">{deck.city || "—"}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      {deletingId === deck.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSendEmail(deck)} disabled={emailLoadingId === deck.id}>
                      {emailLoadingId === deck.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                      Send Email Campaign
                    </DropdownMenuItem>
                    {deck.is_published && (
                      <DropdownMenuItem asChild>
                        <a href={`/deck/${deck.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" /> View Public Page
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => copyLink(deck.slug)}>
                      <Copy className="h-4 w-4 mr-2" /> Copy Share Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/dashboard/decks/${deck.id}/edit`)}>
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(deck)} className="text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge variant={deck.is_published ? "default" : "secondary"} className={deck.is_published ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}>
                  {deck.is_published ? "Published" : "Draft"}
                </Badge>
                <Badge variant="outline" className={deck.gate_enabled !== false ? "bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1" : "bg-muted text-muted-foreground border-border gap-1"}>
                  {deck.gate_enabled !== false ? <><Lock className="h-3 w-3" /> Gated</> : <><Unlock className="h-3 w-3" /> Open</>}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(deck.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                <span className="text-xs text-muted-foreground flex-1 truncate font-mono">presaleproperties.com/deck/{deck.slug}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyLink(deck.slug)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => navigate(`/dashboard/decks/${deck.id}/edit`)}>
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button size="sm" className="flex-1 text-xs" onClick={() => handleSendEmail(deck)} disabled={emailLoadingId === deck.id}>
                  {emailLoadingId === deck.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Mail className="h-3 w-3 mr-1" />}
                  Send Email
                </Button>
                {deck.is_published && (
                  <Button variant="outline" size="sm" className="text-xs px-3" asChild>
                    <a href={`/deck/${deck.slug}`} target="_blank" rel="noopener noreferrer"><Eye className="h-3 w-3" /></a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
