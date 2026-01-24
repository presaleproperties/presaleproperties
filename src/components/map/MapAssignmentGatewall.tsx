import { Link } from "react-router-dom";
import { Lock, Shield, Bell, MessageSquare, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapAssignmentGatewallProps {
  className?: string;
}

export function MapAssignmentGatewall({ className }: MapAssignmentGatewallProps) {
  return (
    <div className={`absolute inset-0 z-[1001] flex items-center justify-center ${className}`}>
      {/* Blurred map background overlay */}
      <div className="absolute inset-0 backdrop-blur-md bg-background/60" />
      
      {/* Content overlay */}
      <div className="relative z-10 max-w-lg mx-auto px-4 text-center">
        {/* Lock Icon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-4">
          <Lock className="h-4 w-4" />
          <span className="text-sm font-medium">Agent-Exclusive</span>
        </div>
        
        {/* Main Heading */}
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
          Assignment Listings
        </h2>
        
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Access pre-construction assignments exclusively available to verified real estate agents.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button size="lg" asChild className="text-base px-6">
            <Link to="/login?mode=signup&role=agent">
              Register as Agent
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base">
            <Link to="/login">
              Log In
            </Link>
          </Button>
        </div>

        {/* Compact Benefits Row */}
        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>Early Access</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-primary" />
            <span>Alerts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>Direct Messaging</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary" />
            <span>Verified Network</span>
          </div>
        </div>
      </div>
    </div>
  );
}
