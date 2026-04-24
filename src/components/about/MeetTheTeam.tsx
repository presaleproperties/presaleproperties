import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Linkedin, Instagram, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AboutContactForm } from "./AboutContactForm";

interface TeamMember {
  id: string;
  full_name: string;
  title: string;
  photo_url: string | null;
  bio: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  specializations: string[];
}

export function MeetTheTeam() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<{ id: string; name: string; photo: string | null } | null>(null);

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_team_members");
      if (error) throw error;
      return (data as unknown as TeamMember[]) || [];
    },
  });

  if (isLoading) {
    return (
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container px-4 sm:px-6">
          <div className="text-center mb-14">
            <Skeleton className="h-4 w-32 mx-auto mb-4" />
            <Skeleton className="h-10 w-64 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden border bg-card">
                <Skeleton className="aspect-[3/4] w-full" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (teamMembers.length === 0) return null;

  const handleWorkWithAgent = (agentId: string, agentName: string, agentPhoto: string | null) => {
    setSelectedAgent({ id: agentId, name: agentName, photo: agentPhoto });
    setFormOpen(true);
  };

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary block mb-4">Your Guides</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight mb-4">
              The people in <span className="text-primary">your corner</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Each of us has helped dozens of buyers just like you. Pick the person you feel most comfortable with — and start with a free conversation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="group rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/30 hover:shadow-xl transition-all duration-500"
              >
                {/* Photo */}
                <div className="aspect-[4/5] relative overflow-hidden">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.full_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-7xl font-black text-primary/25">
                        {member.full_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />

                  <div className="absolute bottom-5 left-5 right-5">
                    <h3 className="text-xl font-extrabold text-on-dark leading-tight">{member.full_name}</h3>
                    <p className="text-primary text-sm font-semibold mt-0.5">{member.title}</p>
                  </div>

                  {(member.linkedin_url || member.instagram_url) && (
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {member.linkedin_url && (
                        <a
                          href={member.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-card/90 backdrop-blur-sm rounded-full hover:bg-card transition-colors shadow-sm"
                          aria-label={`${member.full_name}'s LinkedIn`}
                        >
                          <Linkedin className="h-3.5 w-3.5 text-[#0077B5]" />
                        </a>
                      )}
                      {member.instagram_url && (
                        <a
                          href={member.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-card/90 backdrop-blur-sm rounded-full hover:bg-card transition-colors shadow-sm"
                          aria-label={`${member.full_name}'s Instagram`}
                        >
                          <Instagram className="h-3.5 w-3.5 text-[#E4405F]" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-6">
                  {member.bio && (
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-3">
                      {member.bio}
                    </p>
                  )}
                  {member.specializations && member.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {member.specializations.map((spec) => (
                        <Badge key={spec} variant="secondary" className="bg-primary/10 text-primary text-[11px]">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="w-full gap-2 h-10"
                    onClick={() => handleWorkWithAgent(member.id, member.full_name, member.photo_url)}
                  >
                    <Calendar className="h-4 w-4" />
                    Talk to {member.full_name.split(" ")[0]}
                  </Button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <AboutContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        selectedAgentId={selectedAgent?.id}
        selectedAgentName={selectedAgent?.name}
        selectedAgentPhoto={selectedAgent?.photo}
      />
    </section>
  );
}
