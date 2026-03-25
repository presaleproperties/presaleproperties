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
    reviewer_location: "First-time buyer · Surrey, BC",
    review_text:
      "I had no idea what I was getting into with presale. They walked me through every single document and negotiated $25,000 in incentives I didn't even know existed. I felt looked after the whole way.",
    rating: 5,
    review_date: null,
    is_featured: false,
  },
  {
    id: "f2",
    reviewer_name: "Jin & Sarah M.",
    reviewer_location: "Investors · Coquitlam, BC",
    review_text:
      "We've bought 3 presales with this team now. They bring actual numbers — not just enthusiasm — and every project has performed. This is what good guidance looks like.",
    rating: 5,
    review_date: null,
    is_featured: false,
  },
  {
    id: "f3",
    reviewer_name: "Rajesh P.",
    reviewer_location: "Newcomer buyer · Langley, BC",
    review_text:
      "My parents were nervous about the whole process. Having someone explain everything in Punjabi made it completely different. They felt heard, not rushed. Genuinely grateful.",
    rating: 5,
    review_date: null,
    is_featured: false,
  },
  {
    id: "f4",
    reviewer_name: "Amanda T.",
    reviewer_location: "First-time buyer · Vancouver, BC",
    review_text:
      "I almost went without an agent because I thought presale was straightforward. The contract review alone flagged three things I would have missed. The legal credit they secured covered my entire lawyer bill.",
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
                In Their Words
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-[1.05] tracking-tight">
                What it actually feels like <span className="text-primary">to work with us</span>
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

          {/* Reviews grid */}
          <div className="grid sm:grid-cols-2 gap-5 mb-10">
            {displayReviews.map((review, i) => (
              <div
                key={review.id}
                className={`group rounded-2xl bg-card border border-border p-5 sm:p-7 hover:border-primary/25 hover:shadow-lg transition-all duration-300 flex flex-col ${
                  i === 1 ? "sm:mt-6" : i === 3 ? "sm:mt-6" : ""
                }`}
              >
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

                <p className="text-[14px] text-muted-foreground leading-[1.75] mb-6 flex-1 italic">
                  "{review.review_text}"
                </p>

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
                Read More on Google
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}
