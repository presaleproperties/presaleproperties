import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Sparkles } from "lucide-react";

interface OffMarketBannerProps {
  projectSlug: string;
}

export function OffMarketBanner({ projectSlug }: OffMarketBannerProps) {
  const navigate = useNavigate();
  const [listing, setListing] = useState<{ available_units: number; linked_project_slug: string } | null>(null);

  useEffect(() => {
    supabase
      .from("off_market_listings")
      .select("available_units, linked_project_slug")
      .eq("linked_project_slug", projectSlug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setListing(data as any);
      });
  }, [projectSlug]);

  if (!listing) return null;

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 p-5 space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">VIP Off-Market Units Available</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        {listing.available_units} exclusive unit{listing.available_units !== 1 ? "s" : ""} with special pricing & incentives
      </p>
      <Button
        size="sm"
        onClick={() => navigate(`/off-market?unlock=${projectSlug}`)}
      >
        <Lock className="h-4 w-4 mr-1" /> Unlock Off-Market Details
      </Button>
    </div>
  );
}
