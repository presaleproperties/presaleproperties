import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
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
  const [selectedAgent, setSelectedAgent] = useState<{ id: string; name: string } | null>(null);

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, full_name, title, photo_url, bio, linkedin_url, instagram_url, specializations")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Meet the Team</h2>
            <div className="w-20 h-1 bg-primary mx-auto mb-6 rounded-full" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[3/4] w-full" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24 mb-4" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (teamMembers.length === 0) {
    return null;
  }

  const handleWorkWithAgent = (agentId: string, agentName: string) => {
    setSelectedAgent({ id: agentId, name: agentName });
    setFormOpen(true);
  };

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Meet the Team
          </h2>
          <div className="w-16 sm:w-20 h-1 bg-primary mx-auto mb-4 sm:mb-6 rounded-full" />
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Our dedicated specialists bring together decades of combined experience in presale real estate, 
            each focusing on what they do best.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {teamMembers.map((member) => (
            <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="aspect-[3/4] relative">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={member.full_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-5xl sm:text-6xl md:text-7xl font-bold text-primary/30">
                      {member.full_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white">{member.full_name}</h3>
                  <p className="text-primary font-medium text-sm sm:text-base">{member.title}</p>
                </div>
                {/* Social Links Overlay */}
                {(member.linkedin_url || member.instagram_url) && (
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {member.linkedin_url && (
                      <a
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 sm:p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md"
                        aria-label={`${member.full_name}'s LinkedIn`}
                      >
                        <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0077B5]" />
                      </a>
                    )}
                    {member.instagram_url && (
                      <a
                        href={member.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 sm:p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md"
                        aria-label={`${member.full_name}'s Instagram`}
                      >
                        <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#E4405F]" />
                      </a>
                    )}
                  </div>
                )}
              </div>
              <CardContent className="p-4 sm:p-5 md:p-6">
                {member.bio && (
                  <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed line-clamp-3">
                    {member.bio}
                  </p>
                )}
                {member.specializations && member.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    {member.specializations.map((spec) => (
                      <Badge
                        key={spec}
                        variant="secondary"
                        className="bg-primary/10 text-primary text-[10px] sm:text-xs"
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                )}
                <Button
                  size="sm"
                  className="w-full gap-2 text-xs sm:text-sm"
                  onClick={() => handleWorkWithAgent(member.id, member.full_name)}
                >
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Work with {member.full_name.split(" ")[0]}</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AboutContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        selectedAgentId={selectedAgent?.id}
        selectedAgentName={selectedAgent?.name}
      />
    </section>
  );
}