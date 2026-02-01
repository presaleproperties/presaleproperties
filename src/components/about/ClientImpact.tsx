import { TrendingUp, Home, BadgeDollarSign, Star } from "lucide-react";

const impactStats = [
  {
    icon: BadgeDollarSign,
    stat: "$20K–$30K+",
    label: "Avg. Incentives Negotiated",
  },
  {
    icon: Home,
    stat: "400+",
    label: "Homes Sold",
  },
  {
    icon: Star,
    stat: "$1,500",
    label: "Legal Credit for Buyers",
  },
  {
    icon: TrendingUp,
    stat: "5+ Years",
    label: "Presale Experience",
  },
];

const caseStudies = [
  {
    title: "First-Time Buyer Success",
    description: "We've helped hundreds of first-time buyers negotiate better terms, reduce deposit requirements by up to 5%, and gain the confidence to make one of the biggest decisions of their lives. Our step-by-step guidance transforms the intimidating presale process into a clear, manageable journey.",
    highlight: "Reduced deposits • Negotiated credits • Full contract protection",
  },
  {
    title: "Investor Portfolio Growth",
    description: "Our investor clients have scaled their portfolios with strategic presale purchases, leveraging our tenant placement services and assignment expertise. We help investors maximize returns while minimizing risk through careful deal structuring and market timing.",
    highlight: "Portfolio scaling • Tenant placement • Passive income generation",
  },
];

export function ClientImpact() {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Client Impact & Success
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-6 rounded-full" />
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Real results for real people — here's how we've made a difference for our clients.
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          {impactStats.map((item) => (
            <div
              key={item.label}
              className="bg-card rounded-xl p-4 sm:p-6 border shadow-sm text-center"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1">{item.stat}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
        
        {/* Case Studies */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {caseStudies.map((study) => (
            <div
              key={study.title}
              className="bg-gradient-to-br from-muted/50 to-muted/20 rounded-2xl p-6 sm:p-8 border"
            >
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">{study.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">{study.description}</p>
              <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary/10 rounded-full">
                <span className="text-xs sm:text-sm font-medium text-primary">{study.highlight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
