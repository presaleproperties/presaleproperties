import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Calendar, ArrowRight, FileText } from "lucide-react";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  category: string | null;
  is_featured: boolean;
  publish_date: string | null;
};

interface BlogCategoryCarouselProps {
  category: string;
  posts: BlogPost[];
  formatDate: (date: string) => string;
}

export function BlogCategoryCarousel({ category, posts, formatDate }: BlogCategoryCarouselProps) {
  if (posts.length === 0) return null;

  return (
    <section className="relative">
      <div className="flex items-center justify-between mb-5 md:mb-7">
        <div className="flex items-center gap-3">
          <div className="h-7 md:h-8 w-1.5 rounded-full bg-gradient-to-b from-primary to-primary-deep" />
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tightest">{category}</h2>
          <span className="text-xs md:text-sm font-semibold text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">
            {posts.length}
          </span>
        </div>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: false,
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4 md:-ml-5">
          {posts.map((post) => (
            <CarouselItem key={post.id} className="pl-4 md:pl-5 basis-[80%] sm:basis-[48%] lg:basis-1/3">
              <Link to={`/blog/${post.slug}`} className="block h-full group">
                <div className="relative h-full overflow-hidden rounded-2xl border border-border/40 bg-card shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {post.featured_image ? (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                        <FileText className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <div className="p-4 md:p-5 flex flex-col gap-2">
                    <h3 className="font-bold text-sm md:text-base leading-snug group-hover:text-primary transition-colors duration-300 line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      {post.publish_date && (
                        <span className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground font-medium">
                          <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
                          {formatDate(post.publish_date)}
                        </span>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>

        {posts.length > 3 && (
          <>
            <CarouselPrevious className="hidden md:flex -left-5 h-9 w-9 border-border/40 bg-card shadow-elevated hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-200" />
            <CarouselNext className="hidden md:flex -right-5 h-9 w-9 border-border/40 bg-card shadow-elevated hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-200" />
          </>
        )}
      </Carousel>
    </section>
  );
}
