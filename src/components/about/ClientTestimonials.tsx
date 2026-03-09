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
    id: "f1",
    reviewer_name: "Harpreet K.",
    reviewer_location: "Surrey, BC",
    review_text:
      "As first-time buyers, we were nervous about the presale process. The team at Presale Properties made everything crystal clear. They negotiated $25,000 in incentives and walked us through every single document.",
    rating: 5,
    review_date: null,
    is_featured: false,
  },
  {
    id: "f2",
    reviewer_name: "Jin & Sarah M.",
    reviewer_location: "Coquitlam, BC",
    review_text:
      "We've bought 3 presales with this team now. Their knowledge of the market and developer relationships is unmatched. They've helped us build a portfolio that generates solid passive income.",
    rating: 5,
    review_date: null,
    is_featured: false,
  },
  {
    id: "f3",
    reviewer_name: "Rajesh P.",
    reviewer_location: "Langley, BC",
    review_text:
      "The multilingual support was a game-changer for my parents. Everything was explained in Punjabi, and they felt comfortable throughout. Professional, patient, and genuinely caring team.",
    rating: 5,
    review_date: null,
    is_featured: false,
  },
  {
    id: "f4",
    reviewer_name: "Amanda T.",
    reviewer_location: "Vancouver, BC",
    review_text:
      "I thought I didn't need a realtor for presale — I was wrong. The contract review alone saved me from potential issues. Plus the legal credit they secured covered my lawyer fees entirely.",
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

          {/* Header */}
          <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-end mb-14">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary block mb-4">
                Client Stories
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-[1.05] tracking-tight">
                What Our Clients <span className="text-primary">Say</span>
              </h2>
            </div>
            {/* Rating pill */}
            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary/8 border border-primary/20 w-fit">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <span className="text-sm font-bold text-foreground ml-1">5.0</span>
              <span className="text-xs text-muted-foreground">on Google</span>
            </div>
          </div>

          {/* Reviews grid — masonry-feel with offset */}
          <div className="grid sm:grid-cols-2 gap-5 mb-10">
            {displayReviews.map((review, i) => (
              <div
                key={review.id}
                className={`group rounded-2xl bg-card border border-border p-7 hover:border-primary/25 hover:shadow-lg transition-all duration-300 flex flex-col ${
                  i === 1 ? "sm:mt-6" : i === 3 ? "sm:mt-6" : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/15 transition-colors">
                    <Quote className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                </div>

                {/* Quote */}
                <p className="text-[14px] text-muted-foreground leading-[1.75] mb-6 flex-1 italic">
                  "{review.review_text}"
                </p>

                {/* Attribution */}
                <div className="flex items-center gap-3 pt-5 border-t border-border/50 mt-auto">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-black text-primary">{review.reviewer_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-foreground">{review.reviewer_name}</p>
                    {review.reviewer_location && (
                      <p className="text-[12px] text-muted-foreground">{review.reviewer_location}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button variant="outline" size="lg" className="gap-2 h-12 px-8 rounded-xl font-semibold" asChild>
              <a href="https://share.google/CjsNKmTbLTlarIIN1" target="_blank" rel="noopener noreferrer">
                See All Reviews on Google
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}
