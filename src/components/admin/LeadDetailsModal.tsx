import { format } from "date-fns";
import { generateProjectUrl } from "@/lib/seoUrls";
import { 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  User,
  Home,
  UserCheck,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ProjectLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  persona: string | null;
  home_size: string | null;
  agent_status: string | null;
  created_at: string;
  project_id: string | null;
  presale_projects: {
    name: string;
    slug: string;
    city: string;
  } | null;
}

interface ListingLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  created_at: string;
  listing_id: string;
  listings: {
    title: string;
    project_name: string;
    city: string;
  } | null;
}

interface LeadDetailsModalProps {
  lead: ProjectLead | ListingLead | null;
  type: "project" | "listing";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailsModal({ lead, type, open, onOpenChange }: LeadDetailsModalProps) {
  if (!lead) return null;

  const isProjectLead = type === "project";
  const projectLead = lead as ProjectLead;
  const listingLead = lead as ListingLead;

  // Parse project lead fields
  const personaLabel = projectLead.persona === "first_time" 
    ? "First-time Buyer" 
    : projectLead.persona === "investor" 
    ? "Investor" 
    : projectLead.persona || "Not specified";

  const homeSizeLabel = projectLead.home_size === "1_bed" 
    ? "1 Bedroom" 
    : projectLead.home_size === "2_bed" 
    ? "2 Bedroom" 
    : projectLead.home_size === "3_bed_plus" 
    ? "3+ Bedrooms" 
    : projectLead.home_size || "Not specified";

  const agentStatusLabel = projectLead.agent_status === "i_am_realtor" 
    ? "I am a Realtor" 
    : projectLead.agent_status === "yes" 
    ? "Working with an agent" 
    : "No agent";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Lead Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{lead.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                  {lead.email}
                </a>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                    {lead.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Property Interest */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {isProjectLead ? "Project Interest" : "Listing Interest"}
            </h4>
            {isProjectLead && projectLead.presale_projects ? (
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{projectLead.presale_projects.name}</p>
                  <p className="text-sm text-muted-foreground">{projectLead.presale_projects.city}</p>
                  <Button variant="link" size="sm" className="h-auto p-0 mt-1" asChild>
                    <a 
                      href={`/presale-projects/${projectLead.presale_projects.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Project <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
            ) : !isProjectLead && listingLead.listings ? (
              <div className="flex items-start gap-3">
                <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{listingLead.listings.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {listingLead.listings.project_name} • {listingLead.listings.city}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No property linked</p>
            )}
          </div>

          {/* Lead Qualifiers (Project Leads Only) */}
          {isProjectLead && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Lead Qualifiers
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Buyer Type</p>
                    <Badge variant={projectLead.persona === "investor" ? "default" : "secondary"}>
                      {personaLabel}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Home Size Interest</p>
                    <Badge variant="outline">{homeSizeLabel}</Badge>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground">Agent Status</p>
                    <Badge variant={agentStatusLabel === "I am a Realtor" ? "default" : agentStatusLabel === "Working with an agent" ? "secondary" : "outline"}>
                      <UserCheck className="h-3 w-3 mr-1" />
                      {agentStatusLabel}
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Message */}
          {lead.message && !isProjectLead && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Message
                </h4>
                <p className="text-sm bg-muted p-3 rounded-lg">{lead.message}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Timestamp */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Submitted on {format(new Date(lead.created_at), "MMMM d, yyyy")} at {format(new Date(lead.created_at), "h:mm a")}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" asChild>
              <a href={`mailto:${lead.email}`}>
                <Mail className="h-4 w-4 mr-2" />
                Email Lead
              </a>
            </Button>
            {lead.phone && (
              <Button variant="outline" asChild>
                <a href={`tel:${lead.phone}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
