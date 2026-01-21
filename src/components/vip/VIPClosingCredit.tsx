import { FileText, Home, Banknote } from "lucide-react";

const creditOptions = [
  {
    icon: FileText,
    title: "Complimentary Legal Fees",
    description: "Cover your real estate lawyer fees including contract review, title transfer, and closing documents",
    tag: "Popular with first-time buyers",
  },
  {
    icon: Home,
    title: "Complimentary Tenant Placement",
    description: "Professional tenant screening, lease agreement, and move-in coordination through our property management partner",
    tag: "Popular with investors",
  },
  {
    icon: Banknote,
    title: "$1,500 Cash Rebate",
    description: "Receive $1,500 cash at closing to use however you choose—furniture, upgrades, or savings",
    tag: null,
  },
];

export const VIPClosingCredit = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-background">
      <div className="max-w-[1000px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Your $1,500 Closing Credit
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            When you purchase a presale through us, choose how you'd like to use your credit. 
            Applied at closing with no strings attached.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {creditOptions.map((option) => (
            <div
              key={option.title}
              className="bg-card border rounded-xl p-6 text-center hover:shadow-card-hover transition-all duration-300"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <option.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{option.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
              {option.tag && (
                <span className="inline-block text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                  {option.tag}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
