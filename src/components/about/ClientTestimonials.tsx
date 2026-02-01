import { Star, Quote, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Harpreet K.",
    location: "Surrey, BC",
    text: "As first-time buyers, we were nervous about the presale process. The team at Presale Properties made everything crystal clear. They negotiated $25,000 in incentives for us and walked us through every document. Couldn't have asked for better guidance!",
    rating: 5,
  },
  {
    name: "Jin & Sarah M.",
    location: "Coquitlam, BC",
    text: "We've bought 3 presales with this team now. Their knowledge of the market and relationships with developers is unmatched. They've helped us build a portfolio that generates solid passive income. Highly recommend for investors!",
    rating: 5,
  },
  {
    name: "Rajesh P.",
    location: "Langley, BC",
    text: "The multilingual support was a game-changer for my parents who were helping with the purchase. Everything was explained in Punjabi, and they felt comfortable and included throughout. Professional, patient, and truly caring team.",
    rating: 5,
  },
  {
    name: "Amanda T.",
    location: "Vancouver, BC",
    text: "I initially thought I didn't need a realtor for presale — I was wrong. The contract review alone saved me from potential issues with my assignment clause. Plus, the legal credit they secured covered my lawyer fees. Free expert help is a no-brainer!",
    rating: 5,
  },
];

export function ClientTestimonials() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our Clients Say
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-6 rounded-full" />
          <div className="flex items-center justify-center gap-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-primary text-primary" />
            ))}
          </div>
          <p className="text-lg text-muted-foreground">
            Over <span className="font-semibold text-foreground">80+ five-star reviews</span> from happy homeowners and investors
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow"
            >
              <Quote className="h-8 w-8 text-primary/30 mb-4" />
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Button variant="outline" size="lg" className="gap-2" asChild>
            <a
              href="https://www.google.com/maps/place/Presale+Properties+Group"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read 80+ 5-Star Reviews on Google
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
