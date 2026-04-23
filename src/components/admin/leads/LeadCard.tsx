import { format, formatDistanceToNow } from "date-fns";
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
 * Common shape — narrow enough that both project & listing leads can use it.
 * Match the AdminClients.tsx card visual language: avatar-less header,
 * intent badge top-right, criteria rows with icons, status pills,
 * quick actions footer with border-top.
 */
export interface LeadCardData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  /** Header sub-label: persona + size for project leads; listing title for listing leads */
  subtitle?: string | null;
  /** Project / listing context line */
  contextLabel?: string | null;
  /** City under context line */
  contextCity?: string | null;
  /** Optional external URL (e.g. project page) — opens new tab in dropdown */
  contextUrl?: string | null;
  /** 0–10 intent score; omitted = no badge */
  intentScore?: number | null;
  /** Lead status pill text (new / contacted / converted / …) */
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

function intentTone(score: number) {
  if (score >= 8) return "bg-destructive/10 text-destructive border-destructive/30";
  if (score >= 5) return "bg-amber-500/10 text-amber-700 border-amber-500/30";
  return "bg-muted text-muted-foreground border-border";
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s === "converted") return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
  if (s === "contacted") return "bg-blue-500/10 text-blue-700 border-blue-500/30";
  if (s === "lost") return "bg-muted text-muted-foreground";
  return "bg-primary/10 text-primary border-primary/30"; // new / default
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

  return (
    <Card
      onClick={onOpenDetails}
      className={cn(
        "group cursor-pointer border-2 border-transparent transition-all hover:shadow-lg hover:border-primary/20",
        selected && "border-primary/40 bg-primary/[0.02]",
        isHot && !selected && "border-l-destructive/60",
      )}
    >
      <CardContent className="p-4">
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            {onToggleSelect && (
              <div onClick={(e) => e.stopPropagation()} className="pt-1">
                <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold">{lead.name}</h3>
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
                <a
                  href={`tel:${lead.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </a>
              )}
              {lead.subtitle && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">{lead.subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-start gap-1">
            {typeof lead.intentScore === "number" && (
              <Badge variant="outline" className={cn("text-xs", intentTone(lead.intentScore))}>
                {lead.intentScore}
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
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
        </div>

        {/* ── Context (project / listing) ────────────────────────── */}
        {lead.contextLabel && (
          <div className="mb-3 space-y-1">
            <div className="flex items-center gap-1.5 text-sm">
              {lead.contextLabel.toLowerCase().includes("listing") ? (
                <Home className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">{lead.contextLabel}</span>
            </div>
            {lead.contextCity && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.contextCity}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Activity strip ────────────────────────────────────── */}
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
          </div>
          <div className="ml-auto text-[10px] text-muted-foreground/70">
            {format(new Date(lead.created_at), "MMM d")}
          </div>
        </div>

        {/* ── Status / source badges ────────────────────────────── */}
        {(lead.status || lead.sourceLabel) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {lead.status && (
              <Badge variant="outline" className={cn("text-xs", statusTone(lead.status))}>
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
              <Phone className="mr-1.5 h-3.5 w-3.5" /> No phone
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
