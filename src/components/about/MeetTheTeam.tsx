import { Card, CardContent } from "@/components/ui/card";
import { Linkedin, Mail } from "lucide-react";

const teamMembers = [
  {
    name: "Sunny Parmar",
    title: "Founder & Lead Advisor",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=987&auto=format&fit=crop",
    bio: "Expert in negotiation, deal structuring, and investor strategy. Sunny has helped hundreds of clients build wealth through strategic presale investments.",
    specialties: ["Negotiation", "Investor Strategy", "Deal Structuring"],
  },
  {
    name: "Priya Sharma",
    title: "First-Time Buyer Specialist",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=988&auto=format&fit=crop",
    bio: "Focused on education, contract clarity, and emotional support. Priya guides first-time buyers through every step with patience and expertise.",
    specialties: ["Buyer Education", "Contract Review", "First-Time Buyers"],
  },
  {
    name: "Kevin Lee",
    title: "Investor Relations & Leasing Expert",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1170&auto=format&fit=crop",
    bio: "Handles assignment coordination, tenant placement, and legal liaison. Kevin helps investors maximize returns from purchase to rental.",
    specialties: ["Assignments", "Tenant Placement", "Leasing"],
  },
];

export function MeetTheTeam() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meet the Team
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-6 rounded-full" />
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our dedicated specialists bring together decades of combined experience in presale real estate, 
            each focusing on what they do best.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <Card key={member.name} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[3/4] relative">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white">{member.name}</h3>
                  <p className="text-primary font-medium">{member.title}</p>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {member.bio}
                </p>
                <div className="flex flex-wrap gap-2">
                  {member.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
