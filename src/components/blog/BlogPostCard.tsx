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
    <article>
      <Link to={`/blog/${post.slug}`} className="block h-full group">
        <div className="relative h-full overflow-hidden rounded-xl md:rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-500">
          {/* Image */}
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
                <FileText className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 md:p-5">
            {post.category && (
              <Badge variant="secondary" className="mb-2 md:mb-3 text-[10px] md:text-xs font-medium">
                {post.category}
              </Badge>
            )}
            <h3 className="font-semibold text-sm md:text-base leading-snug mb-1.5 md:mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-3 md:mb-4 leading-relaxed">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center justify-between pt-2.5 md:pt-3 border-t border-border/50">
              {post.publish_date && (
                <span className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground">
                  <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  {formatDate(post.publish_date)}
                </span>
              )}
              <span className="flex items-center gap-1 text-[10px] md:text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300">
                Read
                <ArrowRight className="h-2.5 w-2.5 md:h-3 md:w-3" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
