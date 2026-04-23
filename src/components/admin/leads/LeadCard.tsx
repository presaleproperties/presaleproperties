/**
 * LeadCard
 * ─────────────────────────────────────────────────────────────────────────
 * Visual parity with the AdminClients card grid: same spacing, hover ring,
 * intent badge tone, criteria rows, muted activity strip, status badges,
 * and 3-button quick-action footer.
 */
import { formatDistanceToNow } from "date-fns";
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Home,
  Clock,
  ChevronRight,
  MoreVertical,
  Eye,
  Trash2,
  ExternalLink,
  Flame,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PhoneActionsPopover } from "@/components/admin/PhoneActionsPopover";

export interface LeadCardData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  /** Header sub-label (persona + size, or listing title) */
  subtitle?: string | null;
  /** Project / listing context line */
  contextLabel?: string | null;
  /** City / neighborhood under context line */
  contextCity?: string | null;
  /** Optional external URL (project page) — opens new tab in dropdown */
  contextUrl?: string | null;
  /** 0–10 intent score */
  intentScore?: number | null;
  /** Lead status pill (new / contacted / converted / lost) */
  status?: string | null;
  /** Source badge text (Floor Plans, City: Vancouver, …) */
  sourceLabel?: string | null;
  /** Extra source count beyond the primary one */
  extraSourceCount?: number;
}

export interface LeadCardProps {
  lead: LeadCardData;
  selected?: boolean;
  onToggleSelect?: () => void;
  onOpenDetails: () => void;
  onComposeEmail: () => void;
  onDelete?: () => void;
}

/** Match the Clients page intent palette exactly. */
function getIntentColor(score: number) {
  if (score >= 8) return "bg-destructive text-destructive-foreground";
  if (score >= 5) return "bg-amber-500 text-white";
  if (score >= 3) return "bg-blue-500 text-white";
  return "bg-secondary text-secondary-foreground";
}

export function LeadCard({
  lead,
  selected = false,
  onToggleSelect,
  onOpenDetails,
  onComposeEmail,
  onDelete,
}: LeadCardProps) {
  const isHot = (lead.intentScore ?? 0) >= 8;
  const displayName = lead.name?.trim() || "Unnamed Lead";
  const isListing = lead.contextLabel?.toLowerCase().includes("listing");

  return (
    <Card
      onClick={onOpenDetails}
      className={cn(
        "hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-primary/20",
        selected && "border-primary/40 bg-primary/[0.02]",
      )}
    >
      <CardContent className="p-4">
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 flex items-start gap-2">
            {onToggleSelect && (
              <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{displayName}</h3>
                {typeof lead.intentScore === "number" && (
                  <Badge className={cn("shrink-0 text-xs", getIntentColor(lead.intentScore))}>
                    {lead.intentScore}
                  </Badge>
                )}
                {isHot && <Flame className="h-3.5 w-3.5 shrink-0 text-destructive" />}
              </div>
              <p className="text-sm text-muted-foreground truncate">{lead.email}</p>
              {lead.phone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails();
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onComposeEmail();
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Compose Email
              </DropdownMenuItem>
              {lead.contextUrl && (
                <DropdownMenuItem asChild>
                  <a
                    href={lead.contextUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in new tab
                  </a>
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Criteria (project / listing context) ──────────────── */}
        {(lead.contextLabel || lead.contextCity || lead.subtitle) && (
          <div className="space-y-2 mb-3">
            {lead.contextLabel && (
              <div className="flex items-center gap-1.5 text-sm">
                {isListing ? (
                  <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{lead.contextLabel}</span>
              </div>
            )}
            {lead.contextCity && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{lead.contextCity}</span>
              </div>
            )}
            {lead.subtitle && (
              <p className="text-xs text-muted-foreground truncate">{lead.subtitle}</p>
            )}
          </div>
        )}

        {/* ── Activity strip (relative time, mirrors Clients) ───── */}
        <div className="flex items-center gap-4 py-2 px-3 rounded-lg bg-muted/50 text-sm">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </div>
        </div>

        {/* ── Status / source badges ────────────────────────────── */}
        {(lead.status || lead.sourceLabel) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {lead.status && (
              <Badge
                variant={lead.status.toLowerCase() === "new" ? "default" : "secondary"}
                className="text-xs capitalize"
              >
                {lead.status}
              </Badge>
            )}
            {lead.sourceLabel && (
              <Badge variant="outline" className="text-xs">
                {lead.sourceLabel}
                {(lead.extraSourceCount ?? 0) > 0 && (
                  <span className="ml-1 font-semibold text-primary">
                    +{lead.extraSourceCount}
                  </span>
                )}
              </Badge>
            )}
          </div>
        )}

        {/* ── Quick actions footer ──────────────────────────────── */}
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8"
            onClick={(e) => {
              e.stopPropagation();
              onComposeEmail();
            }}
          >
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            Email
          </Button>
          {lead.phone ? (
            <div onClick={(e) => e.stopPropagation()} className="contents">
              <PhoneActionsPopover phone={lead.phone} leadName={lead.name} />
            </div>
          ) : (
            <Button size="sm" variant="outline" className="flex-1 h-8" disabled>
              <Phone className="h-3.5 w-3.5 mr-1.5" />
              No phone
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
