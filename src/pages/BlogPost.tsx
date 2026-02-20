import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ArticleSchema } from "@/components/seo/ArticleSchema";
import { supabase } from "@/integrations/supabase/client";
import { 
  ChevronLeft,
  Calendar,
  Clock,
  FileText,
  Loader2,
  ArrowRight,
  Tag,
  BookOpen,
  Share2
} from "lucide-react";

// Configure marked for proper rendering
marked.setOptions({
  gfm: true,
  breaks: false,
});

// Calculate reading time based on word count (average 200 wpm)
function getReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const wordCount = text.split(' ').filter(word => word.length > 0).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

type BlogPostType = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  category: string | null;
  tags: string[] | null;
  publish_date: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

type RelatedPost = {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  category: string | null;
  publish_date: string | null;
};

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      setPost(data);

      // Fetch related posts
      if (data) {
        const { data: related } = await supabase
          .from("blog_posts")
          .select("id, title, slug, featured_image, category, publish_date")
          .eq("is_published", true)
          .neq("id", data.id)
          .limit(3);
        
        setRelatedPosts(related || []);
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Parse content - supports both HTML and Markdown with XSS protection
  const parsedContent = useMemo(() => {
    if (!post?.content) return null;
    
    const isHtml = /<[a-z][\s\S]*>/i.test(post.content);
    const rawHtml = isHtml ? post.content : marked.parse(post.content) as string;
    
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'blockquote', 'code', 'pre', 'hr'],
      ALLOWED_ATTR: ['href', 'class', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height', 'id'],
      ADD_ATTR: ['target'],
      FORCE_BODY: true
    });
  }, [post?.content]);

  if (loading) {
    return (
      <>
        <ConversionHeader />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </>
    );
  }

  if (!post) {
    if (typeof window !== "undefined") {
      (window as any).prerenderReady = true;
      (window as any).prerenderStatusCode = 404;
    }
    
    return (
      <>
        <Helmet>
          <title>Article Not Found | PresaleProperties.com</title>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="prerender-status-code" content="404" />
        </Helmet>
        <ConversionHeader />
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The article you're looking for doesn't exist or is no longer available.
          </p>
          <Link to="/blog">
            <Button>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Guides
            </Button>
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const canonicalUrl = `https://presaleproperties.com/blog/${post.slug}`;
  const readingTime = post.content ? getReadingTime(post.content) : 0;

  return (
    <>
      <Helmet>
        <title>{post.seo_title || `${post.title} | PresaleProperties.com`}</title>
        <meta name="description" content={post.seo_description || post.excerpt || post.title} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.seo_title || post.title} />
        <meta property="og:description" content={post.seo_description || post.excerpt || ""} />
        <meta property="og:url" content={canonicalUrl} />
        {post.featured_image && <meta property="og:image" content={post.featured_image} />}
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <ArticleSchema
        title={post.title}
        description={post.seo_description || post.excerpt || post.title}
        url={canonicalUrl}
        image={post.featured_image || undefined}
        datePublished={post.publish_date || undefined}
        category={post.category || undefined}
      />

      <ConversionHeader />

      <main className="min-h-screen bg-background">
        {/* Breadcrumb - subtle top bar */}
        <div className="border-b border-border/60">
          <div className="container py-3">
            <Breadcrumbs 
              items={[
                { label: "Guides", href: "/blog" },
                { label: post.title }
              ]} 
            />
          </div>
        </div>

        <article>
          {/* ── Cinematic Hero Section ── */}
          <div className="relative overflow-hidden">
            {/* Background gradient wash */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
            
            <header className="relative py-10 md:py-16 lg:py-20">
              <div className="container max-w-4xl px-4 md:px-6">
                {/* Meta bar */}
                <div className="flex items-center gap-3 flex-wrap mb-5 md:mb-6">
                  {post.category && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                      <BookOpen className="h-3 w-3" />
                      {post.category}
                    </span>
                  )}
                  {post.publish_date && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(post.publish_date)}
                    </span>
                  )}
                  {readingTime > 0 && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {readingTime} min read
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl font-extrabold leading-[1.1] tracking-tight mb-5 md:mb-6 text-foreground">
                  {post.title}
                </h1>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
                    {post.excerpt}
                  </p>
                )}

                {/* Gold accent line */}
                <div className="mt-6 md:mt-8 flex items-center gap-3">
                  <div className="h-[2px] w-16 rounded-full bg-gradient-to-r from-primary to-primary/30" />
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                </div>
              </div>
            </header>
          </div>

          {/* ── Featured Image ── */}
          {post.featured_image && (
            <div className="container max-w-4xl px-4 md:px-6 pb-2">
              <div className="relative rounded-xl md:rounded-2xl overflow-hidden shadow-lg shadow-black/[0.04]">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full aspect-[16/9] object-cover"
                  loading="eager"
                />
                {/* Subtle bottom fade for blending into content */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/60 to-transparent" />
              </div>
            </div>
          )}

          {/* ── Article Body ── */}
          <div className="container max-w-4xl px-4 md:px-6 py-8 md:py-12">
            <div
              className={[
                "prose prose-sm sm:prose-base md:prose-lg max-w-none",
                // Headings
                "prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-foreground",
                "prose-h2:text-xl sm:prose-h2:text-2xl md:prose-h2:text-[1.75rem] prose-h2:mt-10 md:prose-h2:mt-14 prose-h2:mb-4 md:prose-h2:mb-5",
                "prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-7 md:prose-h3:mt-9 prose-h3:mb-3",
                // Body
                "prose-p:text-muted-foreground prose-p:leading-[1.8] prose-p:mb-4 md:prose-p:mb-5",
                "prose-strong:text-foreground prose-strong:font-bold",
                // Links  
                "prose-a:text-primary prose-a:font-medium prose-a:underline-offset-2 hover:prose-a:text-primary/80",
                // Lists
                "prose-ul:ml-4 md:prose-ul:ml-6 prose-ol:ml-4 md:prose-ol:ml-6",
                "prose-li:text-muted-foreground prose-li:mb-2 md:prose-li:mb-2.5 prose-li:leading-[1.7]",
                // Blockquotes - gold accent
                "prose-blockquote:border-l-[3px] prose-blockquote:border-primary prose-blockquote:bg-primary/[0.03] prose-blockquote:rounded-r-lg prose-blockquote:pl-5 md:prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-4 prose-blockquote:not-italic prose-blockquote:text-foreground/80",
                // Tables
                "prose-table:w-full prose-table:border-collapse prose-table:text-xs sm:prose-table:text-sm md:prose-table:text-base",
                "prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 md:prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold",
                "prose-td:border prose-td:border-border prose-td:px-3 md:prose-td:px-4 prose-td:py-2",
                // Dividers
                "prose-hr:my-8 md:prose-hr:my-12 prose-hr:border-border/60",
                // Images
                "prose-img:rounded-xl prose-img:shadow-md",
                "overflow-x-auto"
              ].join(" ")}
            >
              {parsedContent ? (
                <div dangerouslySetInnerHTML={{ __html: parsedContent }} />
              ) : (
                <p className="text-muted-foreground">No content available.</p>
              )}
            </div>

            {/* ── Tags ── */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 md:mt-14 pt-6 md:pt-8 border-t border-border/60">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  {post.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/60 hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── CTA Banner ── */}
            <div className="mt-10 md:mt-14 relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-primary/[0.02] to-transparent p-6 md:p-8">
              {/* Decorative glow */}
              <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />
              <div className="relative">
                <h3 className="font-bold text-lg md:text-xl mb-2 text-foreground">
                  Ready to Start Your Presale Journey?
                </h3>
                <p className="text-sm md:text-base text-muted-foreground mb-5 max-w-2xl">
                  Browse the latest presale condos and townhomes across Metro Vancouver with VIP pricing and floor plans.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <Link to="/presale-projects">
                    <Button size="sm" className="shadow-sm">
                      Browse All Projects
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Link to="/surrey-presale-condos">
                    <Button size="sm" variant="outline" className="bg-background/80">Surrey Presales</Button>
                  </Link>
                  <Link to="/langley-presale-condos">
                    <Button size="sm" variant="outline" className="bg-background/80">Langley Presales</Button>
                  </Link>
                  <Link to="/presale-guide">
                    <Button size="sm" variant="outline" className="bg-background/80">Buyer's Guide</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* ── Related Articles ── */}
        {relatedPosts.length > 0 && (
          <aside aria-label="Related articles" className="py-14 md:py-20 border-t border-border/40 bg-muted/20">
            <div className="container">
              <div className="flex items-center gap-3 mb-8 md:mb-10">
                <div className="h-[2px] w-10 rounded-full bg-primary" />
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Related Guides</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {relatedPosts.map((related) => (
                  <Link key={related.id} to={`/blog/${related.slug}`}>
                    <Card className="group overflow-hidden hover:shadow-xl hover:shadow-primary/[0.04] hover:-translate-y-0.5 transition-all duration-300 h-full border-border/60">
                      <div className="aspect-[16/10] overflow-hidden">
                        {related.featured_image ? (
                          <img
                            src={related.featured_image}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <FileText className="h-10 w-10 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 md:p-5">
                        {related.category && (
                          <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">
                            {related.category}
                          </span>
                        )}
                        <h3 className="font-bold text-sm md:text-base mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {related.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          {related.publish_date && (
                            <span className="text-[11px] text-muted-foreground">
                              {formatDate(related.publish_date)}
                            </span>
                          )}
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        )}
      </main>

      <Footer />
    </>
  );
}
