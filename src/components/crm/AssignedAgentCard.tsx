/**
 * AssignedAgentCard — shows the CRM-assigned agent (photo, name, phone,
 * Calendly) when the current visitor is known and has an agent.
 *
 * Renders nothing for anonymous visitors or unassigned leads — safe to
 * drop into any sidebar without a placeholder check.
 */

import { Phone, Calendar, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCrmIdentity } from "@/hooks/useCrmIdentity";
import { trackCTAClick } from "@/lib/tracking";

interface AssignedAgentCardProps {
  /** Project context for the WhatsApp prefilled message. */
  projectName?: string;
  className?: string;
}

function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AssignedAgentCard({ projectName, className }: AssignedAgentCardProps) {
  const { identity, loading } = useCrmIdentity();

  if (loading || !identity?.known || !identity.assigned_agent) return null;

  const agent = identity.assigned_agent;
  const firstName = agent.name.split(" ")[0];
  const waMessage = projectName
    ? `Hi ${firstName}, I'd like to chat about ${projectName}.`
    : `Hi ${firstName}, I have a question about a presale.`;

  return (
    <Card className={`p-6 bg-gradient-to-br from-primary/5 to-background border-primary/20 ${className ?? ""}`}>
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-16 w-16 ring-2 ring-primary/30">
          {agent.photo_url ? <AvatarImage src={agent.photo_url} alt={agent.name} /> : null}
          <AvatarFallback className="bg-primary/15 text-primary font-bold">
            {initials(agent.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-0.5">
            Your dedicated advisor
          </p>
          <p className="text-lg font-bold text-foreground truncate">{agent.name}</p>
          <p className="text-xs text-muted-foreground">Presale Properties</p>
        </div>
      </div>

      <div className="space-y-2">
        {agent.phone ? (
          <Button
            asChild
            className="w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold"
            onClick={() =>
              trackCTAClick({
                cta_name: "assigned_agent_whatsapp",
                cta_location: "assigned_agent_card",
                destination_url: agent.phone!,
              })
            }
          >
            <a
              href={buildWhatsAppUrl(agent.phone, waMessage)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp {firstName}
            </a>
          </Button>
        ) : null}

        {agent.calendly_url ? (
          <Button
            asChild
            variant="outline"
            className="w-full font-semibold"
            onClick={() =>
              trackCTAClick({
                cta_name: "assigned_agent_calendly",
                cta_location: "assigned_agent_card",
                destination_url: agent.calendly_url!,
              })
            }
          >
            <a href={agent.calendly_url} target="_blank" rel="noopener noreferrer">
              <Calendar className="h-4 w-4 mr-2" />
              Book a private call
            </a>
          </Button>
        ) : null}

        <div className="flex gap-2 pt-1">
          {agent.phone ? (
            <Button asChild variant="ghost" size="sm" className="flex-1 text-xs">
              <a href={`tel:${agent.phone}`}>
                <Phone className="h-3.5 w-3.5 mr-1.5" />
                Call
              </a>
            </Button>
          ) : null}
          {agent.email ? (
            <Button asChild variant="ghost" size="sm" className="flex-1 text-xs">
              <a href={`mailto:${agent.email}`}>
                <Mail className="h-3.5 w-3.5 mr-1.5" />
                Email
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
