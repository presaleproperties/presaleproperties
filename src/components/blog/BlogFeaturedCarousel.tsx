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
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="h-8 md:h-9 w-1.5 rounded-full bg-gradient-to-b from-primary to-primary-deep" />
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tightest">Featured Stories</h2>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: posts.length > 1,
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4 md:-ml-6">
          {posts.map((post) => (
            <CarouselItem key={post.id} className="pl-4 md:pl-6 basis-[92%] sm:basis-[80%] md:basis-[55%] lg:basis-1/2">
              <Link to={`/blog/${post.slug}`} className="block h-full group">
                <article className="relative h-full overflow-hidden rounded-2xl md:rounded-3xl bg-card border border-border/40 shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1">
                  {/* Image */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {post.featured_image ? (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                        <FileText className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/20" />
                      </div>
                    )}
                    {/* Cinematic gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-neutral-900/20 to-transparent" />
                    
                    {/* Featured badge */}
                    <div className="absolute top-3 left-3 md:top-4 md:left-4">
                      <Badge className="bg-primary text-primary-foreground font-bold text-[10px] md:text-xs px-3 py-1 shadow-gold border-0">
                        <Star className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1.5 fill-current" />
                        Featured
                      </Badge>
                    </div>

                    {/* Title overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                      {post.category && (
                        <span className="inline-block mb-2.5 text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-dark/70">
                          {post.category}
                        </span>
                      )}
                      <h3 className="font-extrabold text-lg sm:text-xl md:text-2xl lg:text-3xl text-on-dark leading-tight line-clamp-2 tracking-tight">
                        {post.title}
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 md:p-7">
                    {post.excerpt && (
                      <p className="text-muted-foreground line-clamp-2 mb-4 text-sm md:text-base leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {post.publish_date && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.publish_date)}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-xs font-bold text-primary group-hover:gap-2.5 transition-all duration-300">
                        Read Story
                        <ArrowRight className="h-3.5 w-3.5" />
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
            <CarouselPrevious className="hidden md:flex -left-5 h-10 w-10 border-border/40 bg-card shadow-elevated hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-200" />
            <CarouselNext className="hidden md:flex -right-5 h-10 w-10 border-border/40 bg-card shadow-elevated hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-200" />
          </>
        )}
      </Carousel>
    </section>
  );
}
