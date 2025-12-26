import { User, Building, Phone, Mail, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Listing Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Agent information not available. Use the form above to request more details.
          </p>
        </CardContent>
      </Card>
    );
  }

  const initials = agent.full_name
    ? agent.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AG";

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Listing Agent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agent Avatar & Name */}
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={agent.avatar_url || undefined} alt={agent.full_name || "Agent"} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">
                {agent.full_name || "Real Estate Agent"}
              </p>
              {agent.is_verified && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              License: {agent.license_number}
            </p>
          </div>
        </div>

        {/* Brokerage */}
        <div className="flex items-start gap-3 pt-2 border-t border-border">
          <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">Brokerage</p>
            <p className="font-medium text-foreground">{agent.brokerage_name}</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              className="flex items-center gap-3 text-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{agent.phone}</span>
            </a>
          )}
          <a
            href={`mailto:${agent.email}`}
            className="flex items-center gap-3 text-foreground hover:text-primary transition-colors break-all"
          >
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{agent.email}</span>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
