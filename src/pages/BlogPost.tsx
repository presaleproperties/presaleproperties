import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
  FileText,
  Loader2,
  ArrowRight,
  Tag
} from "lucide-react";

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

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-2xl font-bold mt-8 mb-4">{line.substring(3)}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={i} className="text-xl font-semibold mt-6 mb-3">{line.substring(4)}</h3>;
      }
      // Bullet points
      if (line.startsWith("- ")) {
        return <li key={i} className="ml-6 mb-2">{line.substring(2)}</li>;
      }
      // Numbered lists
      if (/^\d+\.\s/.test(line)) {
        return <li key={i} className="ml-6 mb-2 list-decimal">{line.replace(/^\d+\.\s/, "")}</li>;
      }
      // Bold text
      if (line.includes("**")) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="mb-4">
            {parts.map((part, j) => 
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </p>
        );
      }
      // Empty lines
      if (line.trim() === "") {
        return <br key={i} />;
      }
      // Regular paragraphs
      return <p key={i} className="mb-4">{line}</p>;
    });
  };

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
    return (
      <>
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
              <div className="flex items-center gap-3 mb-4">
                {post.category && (
                  <Badge variant="secondary">{post.category}</Badge>
                )}
                {post.publish_date && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.publish_date)}
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
            <div className="prose prose-lg max-w-none">
              {post.content ? renderContent(post.content) : (
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
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="py-12 bg-muted/30">
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
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}