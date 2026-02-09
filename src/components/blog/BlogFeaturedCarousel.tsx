import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Calendar, ArrowRight, Star, FileText } from "lucide-react";

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

interface BlogFeaturedCarouselProps {
  posts: BlogPost[];
  formatDate: (date: string) => string;
}

export function BlogFeaturedCarousel({ posts, formatDate }: BlogFeaturedCarouselProps) {
  if (posts.length === 0) return null;

  return (
    <section className="relative">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="h-7 md:h-8 w-1 rounded-full bg-primary" />
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Featured Stories</h2>
        </div>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: posts.length > 1,
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-3 md:-ml-4">
          {posts.map((post) => (
            <CarouselItem key={post.id} className="pl-3 md:pl-4 basis-[90%] sm:basis-[80%] md:basis-1/2">
              <Link to={`/blog/${post.slug}`} className="block h-full group">
                <article className="relative h-full overflow-hidden rounded-xl md:rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-xl transition-all duration-500">
                  {/* Image */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {post.featured_image ? (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <FileText className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/40" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    
                    {/* Featured badge */}
                    <div className="absolute top-3 left-3 md:top-4 md:left-4">
                      <Badge className="bg-primary text-primary-foreground font-semibold text-[10px] md:text-xs px-2.5 py-0.5 md:px-3 md:py-1 shadow-lg">
                        <Star className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1 fill-current" />
                        Featured
                      </Badge>
                    </div>

                    {/* Title overlay on image */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                      {post.category && (
                        <Badge variant="secondary" className="mb-2 bg-white/20 text-white backdrop-blur-sm border-white/20 text-[10px] md:text-xs">
                          {post.category}
                        </Badge>
                      )}
                      <h3 className="font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-white leading-tight line-clamp-2 group-hover:underline decoration-primary decoration-2 underline-offset-4 transition-all">
                        {post.title}
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 md:p-5">
                    {post.excerpt && (
                      <p className="text-muted-foreground line-clamp-2 mb-3 md:mb-4 text-xs sm:text-sm leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {post.publish_date && (
                        <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground font-medium">
                          <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          {formatDate(post.publish_date)}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                        Read More
                        <ArrowRight className="h-3 w-3 md:h-3.5 md:w-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>

        {posts.length > 2 && (
          <>
            <CarouselPrevious className="hidden md:flex -left-5 h-10 w-10 border-border/50 bg-card shadow-md hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors" />
            <CarouselNext className="hidden md:flex -right-5 h-10 w-10 border-border/50 bg-card shadow-md hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors" />
          </>
        )}
      </Carousel>
    </section>
  );
}
