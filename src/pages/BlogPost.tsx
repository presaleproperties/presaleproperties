import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
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
  ExternalLink,
} from "lucide-react";

// Static fallback hero assets (generated)
import heroSurreyPresale from "@/assets/blog-hero-surrey-presale.jpg";
import heroCondoInterior from "@/assets/blog-hero-condo-interior.jpg";

const FALLBACK_HEROES = [heroSurreyPresale, heroCondoInterior];

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

  // Hero image: use featured_image, fall back to Pollinations AI, then static asset
  const heroImageUrl = useMemo(() => {
    if (post?.featured_image) return post.featured_image;
    if (!post?.title) return FALLBACK_HEROES[0];
    const encoded = encodeURIComponent(
      `${post.title} Surrey BC real estate presale condo`
    );
    return `https://image.pollinations.ai/prompt/${encoded}?width=1400&height=600&nologo=true`;
  }, [post?.featured_image, post?.title]);

  const relatedHero = (p: RelatedPost) => {
    if (p.featured_image) return p.featured_image;
    const i = relatedPosts.indexOf(p) % FALLBACK_HEROES.length;
    return FALLBACK_HEROES[i];
  };

  if (loading) {
    return (
      <>
        <ConversionHeader />
        <div className="min-h-screen flex items-center justify-center bg-background">
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
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-background">
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
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
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

        {/* ── HERO: Full-bleed, edge-to-edge, 560px tall ── */}
        <div className="relative w-full overflow-hidden" style={{ height: "clamp(420px, 56vw, 600px)" }}>
          {/* Background image */}
          <img
            src={heroImageUrl}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
          />

          {/* Subtle top vignette so nav area stays visible */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />

          {/* Main gradient overlay — bottom 60% transparent → rgba(0,0,0,0.85) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.70) 30%, rgba(0,0,0,0.20) 60%, transparent 100%)",
            }}
          />

          {/* Back nav — top left */}
          <div className="absolute top-4 left-4 md:left-8 z-10">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              All Guides
            </Link>
          </div>

          {/* Share button — top right */}
          <div className="absolute top-4 right-4 md:right-8 z-10">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          </div>

          {/* Bottom content overlay — title, badges */}
          <div className="absolute bottom-0 inset-x-0 z-10 pb-8 md:pb-12 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">

              {/* Category badge — gold */}
              {post.category && (
                <span
                  className="inline-block mb-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border"
                  style={{
                    background: "hsl(40 65% 55% / 0.18)",
                    color: "hsl(40 80% 78%)",
                    borderColor: "hsl(40 65% 55% / 0.45)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  {post.category}
                </span>
              )}

              {/* Title */}
              <h1
                className="text-2xl sm:text-3xl md:text-[2.4rem] lg:text-[2.75rem] font-extrabold leading-[1.1] tracking-tight text-white mb-4 max-w-3xl"
                style={{ textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}
              >
                {post.title}
              </h1>

              {/* Meta row — gold/amber tint */}
              <div className="flex flex-wrap items-center gap-4">
                {post.publish_date && (
                  <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "hsl(40 80% 75%)" }}>
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(post.publish_date)}
                  </span>
                )}
                {readingTime > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "hsl(40 80% 75%)" }}>
                    <Clock className="h-3.5 w-3.5" />
                    {readingTime} min read
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── ARTICLE BODY ── clean off-white / warm light background */}
        <div style={{ background: "hsl(30 25% 98%)" }}>
          <div className="max-w-[800px] mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16">

            {/* Excerpt / intro — gold left border */}
            {post.excerpt && (
              <p
                className="text-lg md:text-xl font-medium mb-10 leading-relaxed pl-5"
                style={{
                  color: "hsl(220 20% 22%)",
                  borderLeft: "4px solid hsl(40 65% 55%)",
                }}
              >
                {post.excerpt}
              </p>
            )}

            {/* Article body */}
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
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                    style={{
                      background: "hsl(40 65% 55% / 0.08)",
                      color: "hsl(220 20% 35%)",
                      borderColor: "hsl(40 65% 55% / 0.25)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* ── AUTHOR CARD ── */}
            <div
              className="mt-12 rounded-2xl p-6 md:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5"
              style={{
                background: "hsl(220 20% 10%)",
                borderLeft: "4px solid hsl(40 65% 55%)",
              }}
            >
              {/* Author headshot */}
              <img
                src="https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/team/1769974057981-u5d1e1f.jpg"
                alt="Uzair Muhammad"
                className="flex-shrink-0 w-14 h-14 rounded-full object-cover"
                style={{ border: "2px solid hsl(40 65% 55% / 0.6)" }}
              />

              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: "hsl(40 65% 55%)" }}
                >
                  Written by
                </p>
                <p className="text-base font-extrabold text-white leading-snug mb-0.5">
                  Uzair Muhammad
                </p>
                <p className="text-sm" style={{ color: "hsl(220 10% 60%)" }}>
                  Surrey Presale Specialist&nbsp;&middot;&nbsp;
                  <a
                    href="https://presaleproperties.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-semibold hover:underline"
                    style={{ color: "hsl(40 80% 68%)" }}
                  >
                    PresaleProperties.com
                    <ExternalLink className="h-3 w-3 ml-0.5" />
                  </a>
                </p>
              </div>

              <Link
                to="/presale-projects"
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-lg"
                style={{
                  background: "hsl(40 65% 55%)",
                  color: "hsl(0 0% 100%)",
                }}
              >
                Book a Discovery Call
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* ── CTA BANNER ── */}
            <div
              className="mt-8 relative overflow-hidden rounded-2xl p-6 md:p-8"
              style={{
                background: "linear-gradient(135deg, hsl(40 65% 55% / 0.09) 0%, hsl(40 50% 48% / 0.04) 100%)",
                border: "1px solid hsl(40 65% 55% / 0.25)",
              }}
            >
              {/* Ambient glow */}
              <div
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                style={{ background: "hsl(40 65% 55% / 0.12)" }}
              />
              <div className="relative">
                <h3 className="font-extrabold text-lg mb-2" style={{ color: "hsl(220 20% 10%)" }}>
                  Ready to Start Your Presale Journey?
                </h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Browse the latest presale condos and townhomes across Metro Vancouver with VIP pricing and floor plans.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <Link to="/presale-projects">
                    <button
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-md transition-all hover:opacity-90"
                      style={{ background: "hsl(40 65% 55%)", color: "hsl(0 0% 100%)" }}
                    >
                      Browse All Projects
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                  {[
                    { to: "/surrey-presale-condos", label: "Surrey Presales" },
                    { to: "/langley-presale-condos", label: "Langley Presales" },
                    { to: "/presale-guide", label: "Buyer's Guide" },
                  ].map(({ to, label }) => (
                    <Link key={to} to={to}>
                      <button className="inline-flex items-center px-4 py-2.5 rounded-full border text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors bg-background">
                        {label}
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── YOU MIGHT ALSO LIKE ── */}
        {relatedPosts.length > 0 && (
          <section
            aria-label="Related articles"
            className="py-16 md:py-20 border-t border-border/40"
            style={{ background: "hsl(30 15% 97%)" }}
          >
            <div className="max-w-[1100px] mx-auto px-4 md:px-8">
              {/* Section header */}
              <div className="flex items-center gap-3 mb-10">
                <div className="h-[3px] w-8 rounded-full" style={{ background: "hsl(40 65% 55%)" }} />
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "hsl(220 20% 10%)" }}>
                  You Might Also Like
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.id}
                    to={`/blog/${related.slug}`}
                    className="group block"
                  >
                    <article
                      className="h-full rounded-2xl overflow-hidden bg-card hover:-translate-y-1 transition-all duration-300"
                      style={{
                        border: "1px solid hsl(40 30% 88%)",
                        boxShadow: "0 2px 12px hsl(220 20% 10% / 0.05)",
                      }}
                    >
                      {/* Image */}
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={relatedHero(related)}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        {related.category && (
                          <span
                            className="inline-block text-[10px] font-bold uppercase tracking-widest mb-2"
                            style={{ color: "hsl(40 65% 48%)" }}
                          >
                            {related.category}
                          </span>
                        )}
                        <h3
                          className="font-bold text-sm md:text-[15px] leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2"
                          style={{ color: "hsl(220 20% 12%)" }}
                        >
                          {related.title}
                        </h3>
                        {related.excerpt && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                            {related.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid hsl(40 20% 92%)" }}>
                          {related.publish_date && (
                            <span className="text-[11px] text-muted-foreground">
                              {formatDate(related.publish_date)}
                            </span>
                          )}
                          <span
                            className="flex items-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "hsl(40 65% 48%)" }}
                          >
                            Read Guide
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </article>
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
