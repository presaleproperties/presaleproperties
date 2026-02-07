import { AlertTriangle, FileWarning, BadgeDollarSign, Clock } from "lucide-react";

const painPoints = [
  {
    icon: FileWarning,
    problem: "Contracts you can't decode",
    solution: "We review every clause — assignment rights, deposit schedules, completion conditions — so you understand exactly what you're signing.",
  },
  {
    icon: BadgeDollarSign,
    problem: "Missed incentives & credits",
    solution: "Developers offer thousands in incentives that buyers don't know to ask for. We negotiate deposit structures, legal credits, and upgrade packages on your behalf.",
  },
  {
    icon: AlertTriangle,
    problem: "Choosing the wrong project",
    solution: "Not every presale is a good deal. We vet builders, analyse floor plans, and compare projects so you don't discover problems after your deposit is locked in.",
  },
  {
    icon: Clock,
    problem: "No support after signing",
    solution: "From completion walkthroughs to deficiency lists and move-in coordination — we stay with you long after the sales centre closes.",
  },
];

export function WhyItMatters() {
  return (
    <section className="py-12 sm:py-16 md:py-24">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
          <p className="text-xs sm:text-sm font-semibold text-primary tracking-widest uppercase mb-2 sm:mb-3">
            The Risk
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Buying Presale Without Representation
          </h2>
          <div className="w-16 sm:w-20 h-1 bg-primary mx-auto mb-4 sm:mb-6 rounded-full" />
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
            Presales aren't like buying resale. The process, contracts, and risks are completely different — and most agents treat them the same.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {painPoints.map((item) => (
            <div
              key={item.problem}
              className="bg-card rounded-xl p-5 sm:p-6 md:p-8 border shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base md:text-lg mb-1.5 sm:mb-2">
                    {item.problem}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {item.solution}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-sm sm:text-base text-muted-foreground">
            The best part? <span className="text-primary font-semibold">Our service costs you nothing.</span> Developer pays our fee.
          </p>
        </div>
      </div>
    </section>
  );
}
