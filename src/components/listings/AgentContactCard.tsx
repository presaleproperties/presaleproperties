import { Building, Phone, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AgentContactCardProps {
  agent: {
    full_name: string | null;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    brokerage_name: string;
    license_number: string;
    is_verified: boolean;
  } | null;
}

export function AgentContactCard({ agent }: AgentContactCardProps) {
  if (!agent) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <p className="text-sm text-muted-foreground text-center">
          Assignment listed by a licensed real estate agent.
        </p>
      </div>
    );
  }

  const agentName = agent.full_name || "Real Estate Agent";
  const initials = agent.full_name
    ? agent.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AG";

  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/30 shadow-card overflow-hidden">
      {/* Gold accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-primary to-primary/60" />
      
      <div className="p-5">
        {/* Header text */}
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
          Assignment listed and marketed by
        </p>

        {/* Agent info row */}
        <div className="flex items-center gap-4 mb-5">
          <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            <AvatarImage src={agent.avatar_url || undefined} alt={agentName} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate">
              {agentName}
            </h3>
            <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
              <Building className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-sm truncate">{agent.brokerage_name}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-4" />

        {/* Contact buttons */}
        <div className="space-y-2">
          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              className="flex items-center gap-3 w-full p-3 rounded-lg border border-border bg-background hover:bg-muted hover:border-primary/30 transition-all group"
            >
              <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">{agent.phone}</p>
              </div>
            </a>
          )}
          <a
            href={`mailto:${agent.email}`}
            className="flex items-center gap-3 w-full p-3 rounded-lg border border-border bg-background hover:bg-muted hover:border-primary/30 transition-all group"
          >
            <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium text-foreground truncate">{agent.email}</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
