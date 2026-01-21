import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "The $1,500 tenant placement credit alone paid for itself. But the real value was the exclusive inventory access—I got a corner unit that was never publicly listed. Uzair called me on a Wednesday, I saw it Thursday, signed Friday. Public launch was the following week and it would've been $22K more expensive.",
    author: "Ravi P., Surrey",
    subtitle: "(Investor, 4 units)",
  },
  {
    quote: "I saved $1,500 on legal fees, but that's not why I'm a VIP Elite member. It's the peace of mind. Uzair caught issues in the disclosure statement my lawyer missed. He attended my deficiency walkthrough and found problems I never would've noticed. Worth every penny—except I didn't pay a penny.",
    author: "Sarah K., First-Time Buyer",
    subtitle: "",
  },
  {
    quote: "I was ready to sign on a project downtown. Uzair ran the numbers and showed me I was overpaying by $48K compared to similar projects. We walked away and found better value in Burnaby. That's the difference between someone protecting your interests vs. someone chasing a commission.",
    author: "Michael T., Investor",
    subtitle: "",
  },
];

export const VIPTestimonials = () => {
  return (
    <section className="py-20 md:py-28 px-4 bg-background">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-center mb-16">
          What VIP Elite Members Say
        </h2>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 md:p-8 border shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <Quote className="w-10 h-10 text-primary/30 mb-4" />
              <blockquote className="text-foreground leading-relaxed mb-6">
                "{testimonial.quote}"
              </blockquote>
              <div className="border-t border-border pt-4">
                <p className="font-semibold text-foreground">{testimonial.author}</p>
                {testimonial.subtitle && (
                  <p className="text-sm text-muted-foreground">{testimonial.subtitle}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
