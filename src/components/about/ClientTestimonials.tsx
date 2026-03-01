import { Star, Quote, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GoogleReview {
  id: string;
  reviewer_name: string;
  reviewer_location: string | null;
  rating: number;
  review_text: string;
  review_date: string | null;
  is_featured: boolean;
}

const fallbackTestimonials = [
  {
    id: "fallback-1",
    reviewer_name: "Harpreet K.",
    reviewer_location: "Surrey, BC",
    review_text: "As first-time buyers, we were nervous about the presale process. The team at Presale Properties made everything crystal clear. They negotiated $25,000 in incentives for us and walked us through every document.",
    rating: 5,
    review_date: null,
    is_featured: false,
  },
  {
    id: "fallback-2",
    reviewer_name: "Jin & Sarah M.",
    reviewer_location: "Coquitlam, BC",
    review_text: "We've bought 3 presales with this team now. Their knowledge of the market and relationships with developers is unmatched. They've helped us build a portfolio that generates solid passive income.",
    rating: 5,
    review_date: null,
    is_featured: false,
  },
  {
    id: "fallback-3",
    reviewer_name: "Rajesh P.",
    reviewer_location: "Langley, BC",
    review_text: "The multilingual support was a game-changer for my parents who were helping with the purchase. Everything was explained in Punjabi, and they felt comfortable throughout. Professional, patient, and truly caring team.",
    rating: 5,
    review_date: null,
    is_featured: false,
  },
  {
    id: "fallback-4",
    reviewer_name: "Amanda T.",
    reviewer_location: "Vancouver, BC",
    review_text: "I initially thought I didn't need a realtor for presale — I was wrong. The contract review alone saved me from potential issues. Plus, the legal credit they secured covered my lawyer fees. Free expert help is a no-brainer!",
    rating: 5,
    review_date: null,
    is_featured: false,
  },
];

export function ClientTestimonials() {
  const { data: reviews } = useQuery({
    queryKey: ["google-reviews-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_reviews")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data as GoogleReview[];
    },
  });

  const displayReviews = reviews && reviews.length > 0 ? reviews : fallbackTestimonials;

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary block mb-4">Client Stories</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight mb-4">
              What Our Clients <span className="text-primary">Say</span>
            </h2>
            <div className="flex items-center gap-1.5 justify-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-primary text-primary" />
              ))}
              <span className="ml-2 text-sm font-semibold text-foreground">5.0 on Google</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mb-10">
            {displayReviews.map((review, i) => (
              <div
                key={review.id}
                className={`rounded-2xl p-7 border transition-all duration-300 hover:shadow-lg hover:border-primary/25 ${
                  i === 0 ? "sm:col-span-2 lg:col-span-1" : ""
                } bg-card`}
              >
                {/* Gold quote icon */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="p-2 bg-primary/10 rounded-xl shrink-0 mt-0.5">
                    <Quote className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">
                  "{review.review_text}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">{review.reviewer_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{review.reviewer_name}</p>
                    {review.reviewer_location && (
                      <p className="text-xs text-muted-foreground">{review.reviewer_location}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" size="lg" className="gap-2 h-12 px-7" asChild>
              <a href="https://share.google/CjsNKmTbLTlarIIN1" target="_blank" rel="noopener noreferrer">
                <span>See All Reviews on Google</span>
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
              </a>
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}
