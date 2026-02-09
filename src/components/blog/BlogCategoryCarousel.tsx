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
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <div className="flex items-center gap-3">
          <div className="h-6 md:h-7 w-1 rounded-full bg-primary/60" />
          <h2 className="text-lg md:text-xl font-bold tracking-tight">{category}</h2>
          <Badge variant="secondary" className="text-[10px] md:text-xs font-medium">
            {posts.length} {posts.length === 1 ? "article" : "articles"}
          </Badge>
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
        <CarouselContent className="-ml-3 md:-ml-4">
          {posts.map((post) => (
            <CarouselItem key={post.id} className="pl-3 md:pl-4 basis-[78%] sm:basis-[48%] lg:basis-1/3">
              <Link to={`/blog/${post.slug}`} className="block h-full group">
                <div className="relative h-full overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-500">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {post.featured_image ? (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <FileText className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 md:p-4">
                    <h3 className="font-semibold text-sm leading-snug mb-1.5 md:mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2 md:mb-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {post.publish_date && (
                        <span className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                          <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
                          {formatDate(post.publish_date)}
                        </span>
                      )}
                      <ArrowRight className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>

        {posts.length > 3 && (
          <>
            <CarouselPrevious className="hidden md:flex -left-5 h-9 w-9 border-border/50 bg-card shadow-md hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors" />
            <CarouselNext className="hidden md:flex -right-5 h-9 w-9 border-border/50 bg-card shadow-md hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors" />
          </>
        )}
      </Carousel>
    </section>
  );
}
