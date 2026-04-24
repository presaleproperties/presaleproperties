import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface GoogleReview {
  id: string;
  reviewer_name: string;
  reviewer_location: string | null;
  rating: number;
  review_text: string;
  review_date: string | null;
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return "Verified review";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Verified review";
  const months = Math.max(
    1,
    Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30)),
  );
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

function ReviewCard({ review }: { review: GoogleReview }) {
  return (
    <article className="snap-start shrink-0 w-[300px] sm:w-[340px] bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-lg transition-shadow flex flex-col">
      {/* Header: name + Google logo */}
      <header className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-foreground truncate">{review.reviewer_name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatRelative(review.review_date)}
          </p>
        </div>
        {/* Google "G" mark */}
        <svg
          className="h-6 w-6 shrink-0"
          viewBox="0 0 48 48"
          aria-label="Google review"
        >
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 8.5-20.5l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C41.4 36 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5z"
          />
        </svg>
      </header>

      {/* Stars + verified badge */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={
                i < review.rating
                  ? "h-4 w-4 fill-yellow-400 text-yellow-400"
                  : "h-4 w-4 text-muted-foreground/30"
              }
            />
          ))}
        </div>
        <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-500/10" />
      </div>

      {/* Review text */}
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-5 mb-4 flex-1">
        {review.review_text}
      </p>

      {review.review_text.length > 200 && (
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground self-start font-medium"
          onClick={(e) => {
            const p = e.currentTarget.previousElementSibling as HTMLElement;
            p.classList.toggle("line-clamp-5");
            e.currentTarget.textContent = p.classList.contains("line-clamp-5")
              ? "Read more"
              : "Show less";
          }}
        >
          Read more
        </button>
      )}
    </article>
  );
}

export function GoogleReviewsCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["google-reviews-homepage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_reviews")
        .select("id, reviewer_name, reviewer_location, rating, review_text, review_date")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as GoogleReview[]) || [];
    },
  });

  const scroll = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (!isLoading && reviews.length === 0) return null;

  return (
    <section className="py-20 md:py-24 bg-muted/30">
      <div className="container px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary block mb-3">
                Google Reviews
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
                The Trust We've Earned
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm font-bold text-foreground">5.0</span>
                <span className="text-sm text-muted-foreground">
                  ({reviews.length} reviews)
                </span>
              </div>
              <div className="hidden sm:flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scroll("left")}
                  aria-label="Previous reviews"
                  className="rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scroll("right")}
                  aria-label="Next reviews"
                  className="rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Carousel */}
          <div
            ref={scrollerRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: "thin" }}
          >
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="snap-start shrink-0 w-[300px] sm:w-[340px] h-64 rounded-2xl"
                  />
                ))
              : reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>

          {/* CTA */}
          <div className="text-center mt-10">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <a
                href="https://www.google.com/search?q=presale+properties+google+reviews"
                target="_blank"
                rel="noopener noreferrer"
              >
                See all reviews on Google
                <ChevronRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
