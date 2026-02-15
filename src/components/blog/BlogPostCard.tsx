import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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

interface BlogPostCardProps {
  post: BlogPost;
  formatDate: (date: string) => string;
}

export function BlogPostCard({ post, formatDate }: BlogPostCardProps) {
  return (
    <article className="group">
      <Link to={`/blog/${post.slug}`} className="block h-full">
        <div className="relative h-full overflow-hidden rounded-2xl border border-border/40 bg-card shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1">
          {/* Image */}
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
                <FileText className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/20" />
              </div>
            )}
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Content */}
          <div className="p-4 md:p-5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              {post.category && (
                <Badge variant="secondary" className="text-[10px] md:text-xs font-semibold tracking-wide uppercase bg-primary/8 text-primary border-0 px-2.5 py-0.5">
                  {post.category}
                </Badge>
              )}
              {post.publish_date && (
                <span className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground font-medium">
                  <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  {formatDate(post.publish_date)}
                </span>
              )}
            </div>
            
            <h3 className="font-bold text-sm md:text-base leading-snug group-hover:text-primary transition-colors duration-300 line-clamp-2">
              {post.title}
            </h3>
            
            {post.excerpt && (
              <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {post.excerpt}
              </p>
            )}
            
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary mt-auto pt-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
              Read Guide
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
