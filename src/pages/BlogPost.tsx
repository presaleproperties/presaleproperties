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
  Tag
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

  // Parse content - supports both HTML and Markdown with XSS protection
  const parsedContent = useMemo(() => {
    if (!post?.content) return null;
    
    // Check if content is already HTML
    const isHtml = /<[a-z][\s\S]*>/i.test(post.content);
    const rawHtml = isHtml ? post.content : marked.parse(post.content) as string;
    
    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'blockquote', 'code', 'pre'],
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
    // Signal 404 to prerender services
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
              Back to Blog
            </Button>
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const canonicalUrl = `https://presaleproperties.com/blog/${post.slug}`;

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
        {/* Breadcrumb */}
        <div className="border-b">
          <div className="container py-3">
            <Breadcrumbs 
              items={[
                { label: "Blog", href: "/blog" },
                { label: post.title }
              ]} 
            />
          </div>
        </div>

        {/* Hero */}
        <article>
          <header className="py-8 md:py-12 border-b">
            <div className="container max-w-4xl">
              <div className="flex items-center gap-3 flex-wrap mb-4">
                {post.category && (
                  <Badge variant="secondary">{post.category}</Badge>
                )}
                {post.publish_date && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.publish_date)}
                  </span>
                )}
                {post.content && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {getReadingTime(post.content)} min read
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="text-xl text-muted-foreground">
                  {post.excerpt}
                </p>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="container max-w-4xl py-8">
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full aspect-[16/9] object-cover rounded-xl"
              />
            </div>
          )}

          {/* Content */}
          <div className="container max-w-4xl py-8">
          <div className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:mb-4 prose-ul:ml-6 prose-ol:ml-6 prose-li:mb-2 prose-strong:font-semibold prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-left prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-hr:my-8">
              {parsedContent ? (
                <div dangerouslySetInnerHTML={{ __html: parsedContent }} />
              ) : (
                <p className="text-muted-foreground">No content available.</p>
              )}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {post.tags.map((tag, i) => (
                    <Badge key={i} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Internal Links CTA */}
            <div className="mt-12 p-6 bg-primary/5 rounded-xl border border-primary/10">
              <h3 className="font-semibold text-lg mb-3">Ready to Start Your Presale Journey?</h3>
              <p className="text-muted-foreground mb-4">
                Browse the latest presale condos and townhomes across Metro Vancouver.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/presale-projects">
                  <Button size="sm">Browse All Projects</Button>
                </Link>
                <Link to="/surrey-presale-condos">
                  <Button size="sm" variant="outline">Surrey Presales</Button>
                </Link>
                <Link to="/langley-presale-condos">
                  <Button size="sm" variant="outline">Langley Presales</Button>
                </Link>
                <Link to="/presale-guide">
                  <Button size="sm" variant="outline">Buyer's Guide</Button>
                </Link>
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <aside aria-label="Related articles" className="py-12 bg-muted/30">
            <div className="container">
              <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((related) => (
                  <Link key={related.id} to={`/blog/${related.slug}`}>
                    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                      <div className="aspect-[16/10] overflow-hidden">
                        {related.featured_image ? (
                          <img
                            src={related.featured_image}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <FileText className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        {related.category && (
                          <Badge variant="secondary" className="mb-2 text-xs">
                            {related.category}
                          </Badge>
                        )}
                        <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {related.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          {related.publish_date && (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(related.publish_date)}
                            </span>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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