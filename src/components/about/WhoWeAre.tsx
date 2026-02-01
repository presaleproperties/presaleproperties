import { Building2, Globe, Users, TrendingUp } from "lucide-react";

const highlights = [
  {
    icon: Building2,
    title: "100% New Construction",
    description: "We focus exclusively on presale and move-in ready homes — no resale properties.",
  },
  {
    icon: TrendingUp,
    title: "80%+ Presale Business",
    description: "The majority of our transactions are presale, making us true specialists in this space.",
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
          <p className="text-lg text-muted-foreground leading-relaxed">
            Presale Properties Group is a team of licensed REALTORS® focused 100% on new construction homes in Metro Vancouver. 
            With over <span className="font-semibold text-foreground">400+ presale homes sold</span> and more than{" "}
            <span className="font-semibold text-foreground">$150 million in transactions</span>, we bring deep expertise 
            and dedication to every client we serve.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
