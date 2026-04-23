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
  MessageSquare,
  Activity,
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

/**
 * LeadCard — visual parity with AdminClients card grid.
 * Header → criteria rows → activity strip → status badges → quick actions footer.
 */
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
  /** Lead status pill text (new / contacted / converted / …) */
  status?: string | null;
  /** Source badge text (Floor Plans, City: Vancouver, …) */
  sourceLabel?: string | null;
  /** Extra source count beyond the primary one */
  extraSourceCount?: number;
  /** Optional engagement counters (matches client card "views / visits") */
  emailCount?: number;
  touchCount?: number;
}

export interface LeadCardProps {
  lead: LeadCardData;
  selected?: boolean;
  onToggleSelect?: () => void;
  onOpenDetails: () => void;
  onComposeEmail: () => void;
  onDelete?: () => void;
}

/** Match the Clients page intent palette (default / amber / red). */
function intentColor(score: number) {
  if (score >= 8) return "bg-destructive text-destructive-foreground";
  if (score >= 5) return "bg-amber-500 text-white";
  return "bg-secondary text-secondary-foreground";
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  const s = status.toLowerCase();
  if (s === "converted" || s === "new") return "default";
  if (s === "lost") return "secondary";
  return "outline";
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
        "group cursor-pointer border-2 border-transparent transition-all hover:border-primary/20 hover:shadow-lg",
        selected && "border-primary/40 bg-primary/[0.02]",
      )}
    >
      <CardContent className="p-4">
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            {onToggleSelect && (
              <div onClick={(e) => e.stopPropagation()} className="pt-1">
                <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="truncate font-semibold">{displayName}</h3>
                {typeof lead.intentScore === "number" && (
                  <Badge className={cn("shrink-0 text-xs", intentColor(lead.intentScore))}>
                    {lead.intentScore}
                  </Badge>
                )}
                {isHot && <Flame className="h-3.5 w-3.5 shrink-0 text-destructive" />}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onComposeEmail();
                }}
                className="block max-w-full truncate text-left text-sm text-muted-foreground hover:text-primary"
                title="Compose email"
              >
                {lead.email}
              </button>
              {lead.phone && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
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
                <Eye className="mr-2 h-4 w-4" /> View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onComposeEmail();
                }}
              >
                <Mail className="mr-2 h-4 w-4" /> Compose email
              </DropdownMenuItem>
              {lead.contextUrl && (
                <DropdownMenuItem asChild>
                  <a
                    href={lead.contextUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> Open in new tab
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
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Criteria (project / listing context) ───────────────── */}
        {(lead.contextLabel || lead.contextCity || lead.subtitle) && (
          <div className="mb-3 space-y-2">
            {lead.contextLabel && (
              <div className="flex items-center gap-1.5 text-sm">
                {isListing ? (
                  <Home className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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
              <p className="truncate text-xs text-muted-foreground">{lead.subtitle}</p>
            )}
          </div>
        )}

        {/* ── Activity strip (mirrors Clients views/visits) ──────── */}
        <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <div className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-blue-500" />
            <span className="font-medium">{lead.emailCount ?? 0}</span>
            <span className="text-xs text-muted-foreground">emails</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-medium">{lead.touchCount ?? 1}</span>
            <span className="text-xs text-muted-foreground">touches</span>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </div>
        </div>

        {/* ── Status / source badges ────────────────────────────── */}
        {(lead.status || lead.sourceLabel) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {lead.status && (
              <Badge variant={statusVariant(lead.status)} className="text-xs capitalize">
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
        <div className="mt-3 flex gap-2 border-t pt-3">
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onComposeEmail();
            }}
          >
            <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
          </Button>
          {lead.phone ? (
            <div onClick={(e) => e.stopPropagation()} className="contents">
              <PhoneActionsPopover phone={lead.phone} leadName={lead.name} />
            </div>
          ) : (
            <Button size="sm" variant="outline" className="h-8 flex-1" disabled>
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> No phone
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
