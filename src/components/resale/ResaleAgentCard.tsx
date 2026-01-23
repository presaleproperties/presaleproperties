import { Building, Phone, Mail, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ResaleAgentCardProps {
  agent: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    office_name: string | null;
  } | null;
}

export function ResaleAgentCard({ agent }: ResaleAgentCardProps) {
  if (!agent || (!agent.full_name && !agent.office_name)) {
    return null;
  }

  const agentName = agent.full_name || "Listing Agent";
  const initials = agent.full_name
    ? agent.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "LA";

  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/30 shadow-sm overflow-hidden">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
      
      <div className="p-4">
        {/* Header text */}
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Listing Agent
        </p>

        {/* Agent info row */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {agentName}
            </h3>
            {agent.office_name && (
              <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                <Building className="h-3 w-3 flex-shrink-0" />
                <span className="text-xs truncate">{agent.office_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact buttons */}
        {(agent.phone || agent.email) && (
          <>
            <div className="h-px bg-border mb-3" />
            <div className="space-y-2">
              {agent.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  className="flex items-center gap-2.5 w-full p-2.5 rounded-lg border border-border bg-background hover:bg-muted hover:border-primary/30 transition-all group"
                >
                  <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-muted-foreground leading-none">Phone</p>
                    <p className="text-sm font-medium text-foreground">{agent.phone}</p>
                  </div>
                </a>
              )}
              {agent.email && (
                <a
                  href={`mailto:${agent.email}`}
                  className="flex items-center gap-2.5 w-full p-2.5 rounded-lg border border-border bg-background hover:bg-muted hover:border-primary/30 transition-all group"
                >
                  <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground leading-none">Email</p>
                    <p className="text-sm font-medium text-foreground truncate">{agent.email}</p>
                  </div>
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
