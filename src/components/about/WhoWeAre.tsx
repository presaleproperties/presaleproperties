import { Building2, Globe, Users, Award } from "lucide-react";

const highlights = [
  {
    icon: Building2,
    title: "New Construction Specialists",
    description: "80%+ of our business is presale and move-in ready homes — it's what we know best.",
  },
  {
    icon: Award,
    title: "Proven Track Record",
    description: "400+ new construction homes sold and $200M+ in total transactions.",
  },
  {
    icon: Globe,
    title: "Multilingual Service",
    description: "We serve diverse communities in English, Hindi, Punjabi, Urdu, Arabic, Korean, and more.",
  },
  {
    icon: Users,
    title: "Culturally Aware",
    description: "We understand the unique needs and concerns of first-generation homebuyers.",
  },
];

export function WhoWeAre() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Who We Are
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-6 rounded-full" />
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Presale Properties Group is a team of licensed REALTORS® specializing in new construction homes across Metro Vancouver. 
            With <span className="font-semibold text-foreground">400+ new construction homes sold</span> and more than{" "}
            <span className="font-semibold text-foreground">$200 million in transactions</span>, we bring deep expertise 
            and dedication to every client we serve.
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="bg-card rounded-xl p-4 sm:p-6 border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-base">{item.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
