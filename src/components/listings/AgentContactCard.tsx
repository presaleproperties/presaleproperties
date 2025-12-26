import { Building, Phone, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Assignment listed by a licensed real estate agent. Use the form above to request more details.
          </p>
        </CardContent>
      </Card>
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
    <Card className="shadow-card overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-muted/50 px-5 py-3 border-b border-border">
          <p className="text-sm text-muted-foreground">
            Assignment listed and marketed by
          </p>
          <p className="font-semibold text-foreground">{agentName}</p>
        </div>

        {/* Agent Info */}
        <div className="p-5 space-y-4">
          {/* Avatar & Brokerage */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={agent.avatar_url || undefined} alt={agentName} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">{agent.brokerage_name}</span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 pt-2">
            {agent.phone && (
              <a
                href={`tel:${agent.phone}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="p-2 bg-primary/10 rounded-full">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">{agent.phone}</span>
              </a>
            )}
            <a
              href={`mailto:${agent.email}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="p-2 bg-primary/10 rounded-full">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-foreground break-all">{agent.email}</span>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
