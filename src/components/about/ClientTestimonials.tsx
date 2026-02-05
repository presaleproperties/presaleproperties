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

// Fallback reviews if database is empty
const fallbackTestimonials = [
  {
    id: "fallback-1",
    reviewer_name: "Harpreet K.",
    reviewer_location: "Surrey, BC",
    review_text: "As first-time buyers, we were nervous about the presale process. The team at Presale Properties made everything crystal clear. They negotiated $25,000 in incentives for us and walked us through every document. Couldn't have asked for better guidance!",
    rating: 5,
    review_date: null,
    is_featured: false,
  },
  {
    id: "fallback-2",
    reviewer_name: "Jin & Sarah M.",
    reviewer_location: "Coquitlam, BC",
    review_text: "We've bought 3 presales with this team now. Their knowledge of the market and relationships with developers is unmatched. They've helped us build a portfolio that generates solid passive income. Highly recommend for investors!",
    rating: 5,
    review_date: null,
    is_featured: false,
  },
  {
    id: "fallback-3",
    reviewer_name: "Rajesh P.",
    reviewer_location: "Langley, BC",
    review_text: "The multilingual support was a game-changer for my parents who were helping with the purchase. Everything was explained in Punjabi, and they felt comfortable and included throughout. Professional, patient, and truly caring team.",
    rating: 5,
    review_date: null,
    is_featured: false,
  },
  {
    id: "fallback-4",
    reviewer_name: "Amanda T.",
    reviewer_location: "Vancouver, BC",
    review_text: "I initially thought I didn't need a realtor for presale — I was wrong. The contract review alone saved me from potential issues with my assignment clause. Plus, the legal credit they secured covered my lawyer fees. Free expert help is a no-brainer!",
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

  // Use database reviews if available, otherwise fallback
  const displayReviews = reviews && reviews.length > 0 ? reviews : fallbackTestimonials;

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-left md:text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            What Our Clients Say
          </h2>
          <div className="w-16 sm:w-20 h-1 bg-primary md:mx-auto mb-4 sm:mb-6 rounded-full" />
          <div className="flex items-center gap-1 sm:gap-1.5 mb-2 sm:mb-3 md:justify-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 fill-primary text-primary" />
            ))}
          </div>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            Five-star reviews from happy homeowners and investors
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-10">
          {displayReviews.map((review) => (
            <div
              key={review.id}
              className="bg-card rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <Quote className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary/30 mb-2 sm:mb-3 md:mb-4" />
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-3 sm:mb-4 md:mb-6 leading-relaxed line-clamp-4">
                "{review.review_text}"
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground text-xs sm:text-sm md:text-base">{review.reviewer_name}</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">{review.reviewer_location}</p>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 fill-primary text-primary" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-left md:text-center">
          <Button variant="outline" size="lg" className="gap-2 text-xs sm:text-sm md:text-base px-4 sm:px-6 py-2.5 h-auto" asChild>
            <a
              href="https://share.google/CjsNKmTbLTlarIIN1"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>See All Reviews on Google</span>
              <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
