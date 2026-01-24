import { Link } from "react-router-dom";
import { Lock, Shield, Bell, MessageSquare, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AssignmentGatewall() {
  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-background via-muted/30 to-background py-16 md:py-24">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">Agent-Exclusive Portal</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Access Exclusive Assignment Listings
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our verified agent network to browse pre-construction assignments, 
              connect with sellers, and close deals before properties hit the public market.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base px-8">
                <Link to="/login?mode=signup&role=agent">
                  Register as an Agent
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link to="/login">
                  Already have an account? Log In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Blurred Map Preview */}
      <section className="relative bg-muted/50 py-12">
        <div className="container px-4">
          <div className="relative rounded-xl overflow-hidden border border-border shadow-lg">
            {/* Placeholder map background */}
            <div className="h-[300px] md:h-[400px] bg-gradient-to-br from-muted via-muted/80 to-muted relative">
              {/* Grid pattern to simulate map */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                    linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px'
                }}
              />
              
              {/* Simulated pins */}
              <div className="absolute top-1/4 left-1/3 w-3 h-3 rounded-full bg-primary/40 blur-sm" />
              <div className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full bg-primary/50 blur-sm" />
              <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-primary/40 blur-sm" />
              <div className="absolute bottom-1/3 left-1/4 w-3 h-3 rounded-full bg-primary/30 blur-sm" />
              <div className="absolute top-2/3 right-1/3 w-4 h-4 rounded-full bg-primary/40 blur-sm" />
              
              {/* Blur overlay */}
              <div className="absolute inset-0 backdrop-blur-md bg-background/30" />
              
              {/* Centered lock message */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-lg font-semibold text-foreground mb-2">
                    Login to View Assignment Locations
                  </p>
                  <p className="text-sm text-muted-foreground">
                    See exact addresses and connect with listing agents
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Why Join Our Agent Network?
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <BenefitCard 
              icon={TrendingUp}
              title="Early Access"
              description="Browse assignments before they hit public platforms. Get first look at new listings."
            />
            <BenefitCard 
              icon={Bell}
              title="Custom Alerts"
              description="Set up saved searches and get notified when matching assignments are listed."
            />
            <BenefitCard 
              icon={MessageSquare}
              title="Direct Messaging"
              description="Connect directly with listing agents through our secure messaging system."
            />
            <BenefitCard 
              icon={Shield}
              title="Verified Network"
              description="All agents are license-verified. Deal with confidence in our professional network."
            />
          </div>
        </div>
      </section>

      {/* Trust Signal / Stats */}
      <section className="py-12 bg-muted/30 border-t border-border">
        <div className="container px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-center">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div className="text-left">
                <p className="text-2xl font-bold text-foreground">500+</p>
                <p className="text-sm text-muted-foreground">Verified Agents</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border" />
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" />
              <div className="text-left">
                <p className="text-2xl font-bold text-foreground">Active</p>
                <p className="text-sm text-muted-foreground">Assignment Listings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 bg-background">
        <div className="container px-4 text-center">
          <p className="text-muted-foreground mb-4">
            Ready to access exclusive assignment listings?
          </p>
          <Button size="lg" asChild>
            <Link to="/login?mode=signup&role=agent">
              Get Started Free
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function BenefitCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
