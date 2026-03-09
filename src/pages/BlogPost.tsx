import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
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
  Share2,
  User,
  ExternalLink,
} from "lucide-react";

// Configure marked
marked.setOptions({ gfm: true, breaks: false });

function getReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const wordCount = text.split(" ").filter((w) => w.length > 0).length;
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
  excerpt: string | null;
};

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) fetchPost();
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

      if (data) {
        const { data: related } = await supabase
          .from("blog_posts")
          .select("id, title, slug, featured_image, category, publish_date, excerpt")
          .eq("is_published", true)
          .neq("id", data.id)
          .limit(3);
        setRelatedPosts(related || []);
      }
    } catch (err) {
      console.error("Error fetching post:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.title, url: window.location.href });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const parsedContent = useMemo(() => {
    if (!post?.content) return null;
    const isHtml = /<[a-z][\s\S]*>/i.test(post.content);
    const rawHtml = isHtml ? post.content : (marked.parse(post.content) as string);
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        "h1","h2","h3","h4","h5","h6","p","strong","em","ul","ol","li","a",
        "br","div","span","table","thead","tbody","tr","th","td","img",
        "blockquote","code","pre","hr",
      ],
      ALLOWED_ATTR: ["href","class","target","rel","src","alt","title","width","height","id"],
      ADD_ATTR: ["target"],
      FORCE_BODY: true,
    });
  }, [post?.content]);

  // Auto-generate hero image URL if no featured image
  const heroImageUrl = useMemo(() => {
    if (post?.featured_image) return post.featured_image;
    if (!post?.title) return null;
    const encoded = encodeURIComponent(
      `${post.title} Surrey BC real estate presale condo`
    );
    return `https://image.pollinations.ai/prompt/${encoded}?width=1400&height=600&nologo=true`;
  }, [post?.featured_image, post?.title]);

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
        </Helmet>
        <ConversionHeader />
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The article you're looking for doesn't exist or is no longer available.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Guides
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
        {heroImageUrl && <meta property="og:image" content={heroImageUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <ArticleSchema
        title={post.title}
        description={post.seo_description || post.excerpt || post.title}
        url={canonicalUrl}
        image={heroImageUrl || undefined}
        datePublished={post.publish_date || undefined}
        category={post.category || undefined}
      />

      <ConversionHeader />

      <main className="min-h-screen bg-background">

        {/* ── HERO: Full-bleed image with overlay ── */}
        <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
          {/* Image */}
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0 bg-foreground/90" />
          )}

          {/* Dark gradient overlay bottom-heavy */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

          {/* Breadcrumb top-left */}
          <div className="absolute top-0 inset-x-0 z-10 pt-4 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
              <nav className="flex items-center gap-2 text-xs text-white/70">
                <Link to="/blog" className="hover:text-white transition-colors flex items-center gap-1">
                  <ChevronLeft className="h-3 w-3" />
                  Guides
                </Link>
                <span>/</span>
                <span className="text-white/50 line-clamp-1">{post.title}</span>
              </nav>
            </div>
          </div>

          {/* Overlay content — bottom of hero */}
          <div className="absolute bottom-0 inset-x-0 z-10 pb-8 md:pb-12 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Category badge */}
              {post.category && (
                <span className="inline-block mb-4 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-primary text-primary-foreground">
                  {post.category}
                </span>
              )}

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-extrabold leading-[1.1] tracking-tight text-white mb-4 max-w-3xl drop-shadow-lg">
                {post.title}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4">
                {post.publish_date && (
                  <span className="flex items-center gap-1.5 text-xs text-white/80">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(post.publish_date)}
                  </span>
                )}
                {readingTime > 0 && (
                  <span className="flex items-center gap-1.5 text-xs text-white/80">
                    <Clock className="h-3.5 w-3.5" />
                    {readingTime} min read
                  </span>
                )}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-xs text-white/80 hover:text-primary transition-colors ml-auto"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── ARTICLE BODY ── */}
        <div className="bg-[hsl(30,20%,98%)]">
          <div className="max-w-[800px] mx-auto px-4 md:px-6 py-12 md:py-16">

            {/* Excerpt / intro */}
            {post.excerpt && (
              <p className="text-lg md:text-xl font-medium text-primary mb-10 leading-relaxed border-l-4 border-primary pl-5">
                {post.excerpt}
              </p>
            )}

            {/* Article content with premium prose styling */}
            {parsedContent ? (
              <div
                className="blog-prose"
                dangerouslySetInnerHTML={{ __html: parsedContent }}
              />
            ) : (
              <p className="text-muted-foreground">No content available.</p>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border/50 flex items-center gap-2.5 flex-wrap">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                {post.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/8 text-foreground/70 border border-primary/20 hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* ── Author Card ── */}
            <div className="mt-12 rounded-2xl border border-primary/20 bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-sm">
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-0.5">
                  Written by
                </p>
                <p className="text-base font-bold text-foreground leading-snug">
                  Uzair Muhammad
                </p>
                <p className="text-sm text-muted-foreground">
                  Surrey Presale Specialist&nbsp;&middot;&nbsp;
                  <a
                    href="https://presaleproperties.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    PresaleProperties.com
                    <ExternalLink className="h-3 w-3 ml-0.5" />
                  </a>
                </p>
              </div>
              <Link
                to="/presale-projects"
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
              >
                Book a Discovery Call
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* ── CTA Banner ── */}
            <div className="mt-8 relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-primary/[0.03] to-transparent p-6 md:p-8">
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              <div className="relative">
                <h3 className="font-bold text-lg mb-2 text-foreground">
                  Ready to Start Your Presale Journey?
                </h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Browse the latest presale condos and townhomes across Metro Vancouver with VIP pricing and floor plans.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <Link to="/presale-projects">
                    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                      Browse All Projects
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                  <Link to="/surrey-presale-condos">
                    <button className="inline-flex items-center px-4 py-2 rounded-full border border-border bg-background text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors">
                      Surrey Presales
                    </button>
                  </Link>
                  <Link to="/langley-presale-condos">
                    <button className="inline-flex items-center px-4 py-2 rounded-full border border-border bg-background text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors">
                      Langley Presales
                    </button>
                  </Link>
                  <Link to="/presale-guide">
                    <button className="inline-flex items-center px-4 py-2 rounded-full border border-border bg-background text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors">
                      Buyer's Guide
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── YOU MIGHT ALSO LIKE ── */}
        {relatedPosts.length > 0 && (
          <section aria-label="Related articles" className="py-16 md:py-20 border-t border-border/40 bg-muted/30">
            <div className="max-w-[1100px] mx-auto px-4 md:px-8">
              <div className="flex items-center gap-3 mb-10">
                <div className="h-[3px] w-8 rounded-full bg-primary" />
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  You Might Also Like
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((related) => {
                  const relatedHero = related.featured_image
                    ? related.featured_image
                    : `https://image.pollinations.ai/prompt/${encodeURIComponent(related.title + " Surrey BC real estate presale")}?width=800&height=450&nologo=true`;

                  return (
                    <Link
                      key={related.id}
                      to={`/blog/${related.slug}`}
                      className="group block"
                    >
                      <article className="h-full rounded-2xl overflow-hidden border border-border/50 bg-card hover:shadow-xl hover:shadow-primary/[0.06] hover:-translate-y-0.5 transition-all duration-300">
                        {/* Image */}
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <img
                            src={relatedHero}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          {related.category && (
                            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
                              {related.category}
                            </span>
                          )}
                          <h3 className="font-bold text-sm md:text-[15px] leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
                            {related.title}
                          </h3>
                          {related.excerpt && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                              {related.excerpt}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            {related.publish_date && (
                              <span className="text-[11px] text-muted-foreground">
                                {formatDate(related.publish_date)}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                              Read Guide
                              <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
