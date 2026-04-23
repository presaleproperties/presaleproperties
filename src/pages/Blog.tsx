import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { MetaTags } from "@/components/seo/MetaTags";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { BlogFeaturedCarousel } from "@/components/blog/BlogFeaturedCarousel";
import { BlogCategoryCarousel } from "@/components/blog/BlogCategoryCarousel";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { supabase } from "@/integrations/supabase/client";
import { MistakesGuideLeadMagnet } from "@/components/conversion/MistakesGuideLeadMagnet";
import { 
  Search,
  FileText,
  Loader2,
  X,
} from "lucide-react";

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

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image, category, is_featured, publish_date")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("publish_date", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const CANONICAL_CATEGORIES = [
    "Presale Guides", "Buyer Education", "Market Insights", "Investment Strategy",
    "Neighbourhood Guides", "Tax & Finance", "Agent Spotlight", "FAQ",
    "City Spotlight", "Assignments",
  ];
  const categories = CANONICAL_CATEGORIES.filter(cat =>
    posts.some(p => p.category === cat)
  );

  const isSearching = searchQuery.length > 0;

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !activeCategory || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = posts.filter(p => p.is_featured);
  const regularPosts = posts.filter(p => !p.is_featured);

  const postsByCategory: Record<string, BlogPost[]> = {};
  regularPosts.forEach(post => {
    const cat = post.category || "Uncategorized";
    if (!postsByCategory[cat]) postsByCategory[cat] = [];
    postsByCategory[cat].push(post);
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Presale Condo Blog | Guides, Market Updates and Tips | Presale Properties",
    "description": "Expert guides on buying presale condos in BC. Market updates, deposit tips, neighbourhood guides, and investment strategies from The Presale Properties Group.",
    "url": "https://presaleproperties.com/blog",
    "publisher": {
      "@type": "Organization",
      "name": "PresaleProperties.com",
      "url": "https://presaleproperties.com"
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": posts.length,
      "itemListElement": posts.slice(0, 10).map((post, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://presaleproperties.com/blog/${post.slug}`,
        "name": post.title
      }))
    }
  };

  return (
    <>
      <MetaTags
        title="Presale Condo Blog | Guides & Market Updates"
        description="Expert guides on buying presale condos in BC. Market updates, deposit tips, neighbourhood guides, and investment strategies from The Presale Properties Group."
        url="https://presaleproperties.com/blog"
        type="website"
      />
      <Helmet>
        <title>Presale Condo Blog | Guides, Market Updates and Tips | Presale Properties</title>
        <meta name="description" content="Expert guides on buying presale condos in BC. Market updates, deposit tips, neighbourhood guides, and investment strategies from The Presale Properties Group." />
        <link rel="canonical" href="https://presaleproperties.com/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Presale Condo Blog | Guides, Market Updates and Tips" />
        <meta property="og:description" content="Expert guides on buying presale condos in BC. Market updates, deposit tips, and investment strategies." />
        <meta property="og:url" content="https://presaleproperties.com/blog" />
        <script type="application/ld+json">{JSON.stringify(collectionSchema)}</script>
      </Helmet>

      <ConversionHeader />
      
      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="border-b border-border/40">
          <div className="container py-2 md:py-3">
            <Breadcrumbs items={[{ label: "Blog" }]} />
          </div>
        </div>

        {/* Page heading — single H1 for SEO/AEO */}
        <header className="border-b border-border/40 bg-background">
          <div className="container py-6 md:py-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground text-balance">
              Presale &amp; Real Estate Insights
            </h1>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
              Expert guides on buying presale condos in BC — market updates, deposit tips, neighbourhood guides, and investment strategies.
            </p>
          </div>
        </header>


        {/* Search bar (sticky) */}
        <section aria-label="Article search" className="sticky top-14 md:top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 py-3 md:py-4">
          <div className="container">
            <div className="relative max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search guides & articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-10 h-11 rounded-full border-border/50 bg-card shadow-xs focus:shadow-card focus:border-primary/30 text-sm transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Content with sidebar nav */}
        <section aria-label="Blog articles" className="py-8 md:py-12">
          <div className="container">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 md:py-32 gap-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-2 border-muted" />
                  <Loader2 className="h-12 w-12 animate-spin text-primary absolute inset-0" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Loading articles...</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-[240px_1fr] gap-8 lg:gap-12">
                {/* Sticky sidebar nav (desktop) */}
                <aside className="hidden lg:block">
                  <nav className="sticky top-32 space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 px-3">
                      Categories
                    </p>
                    <button
                      onClick={() => setActiveCategory(null)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        !activeCategory
                          ? "bg-muted text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <span>All Guides</span>
                      <span className="text-[11px] text-muted-foreground/60 tabular-nums">{posts.length}</span>
                    </button>
                    {categories.map(cat => {
                      const slug = cat.toLowerCase().replace(/\s+&\s+/g, "-").replace(/\s+/g, "-");
                      const count = posts.filter(p => p.category === cat).length;
                      const active = activeCategory === cat;
                      return isSearching ? (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(active ? null : cat)}
                          className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                            active
                              ? "bg-muted text-foreground font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          }`}
                        >
                          <span>{cat}</span>
                          <span className="text-[11px] text-muted-foreground/60 tabular-nums">{count}</span>
                        </button>
                      ) : (
                        <a
                          key={cat}
                          href={`#cat-${slug}`}
                          className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        >
                          <span>{cat}</span>
                          <span className="text-[11px] text-muted-foreground/60 tabular-nums">{count}</span>
                        </a>
                      );
                    })}
                  </nav>
                </aside>

                {/* Main content */}
                <div className="min-w-0">
                  {/* Mobile category chips */}
                  <div className="lg:hidden mb-6">
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                      <button
                        onClick={() => setActiveCategory(null)}
                        className={`inline-flex items-center whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all border shrink-0 ${
                          !activeCategory
                            ? "bg-foreground text-background border-foreground"
                            : "bg-card text-muted-foreground border-border/50"
                        }`}
                      >
                        All
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                          className={`inline-flex items-center whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all border shrink-0 ${
                            activeCategory === cat
                              ? "bg-foreground text-background border-foreground"
                              : "bg-card text-muted-foreground border-border/50"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredPosts.length === 0 ? (
                    <div className="text-center py-20 md:py-28">
                      <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-muted/60 mb-5 border border-border/40">
                        <FileText className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/40" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">No articles found</h2>
                      <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-md mx-auto">
                        Try adjusting your search or category filter to discover more content
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery("");
                          setActiveCategory(null);
                        }}
                        className="rounded-full px-6 font-semibold"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  ) : isSearching || activeCategory ? (
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-5 md:mb-8 font-medium">
                        Showing {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}
                        {activeCategory && <> in <strong className="text-foreground">{activeCategory}</strong></>}
                        {searchQuery && <> matching "<strong className="text-foreground">{searchQuery}</strong>"</>}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-7">
                        {filteredPosts.map((post) => (
                          <BlogPostCard key={post.id} post={post} formatDate={formatDate} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-14 md:space-y-20">
                      {featuredPosts.length > 0 && (
                        <BlogFeaturedCarousel posts={featuredPosts} formatDate={formatDate} />
                      )}

                      {categories.map(category => {
                        const catPosts = postsByCategory[category];
                        if (!catPosts || catPosts.length === 0) return null;
                        const slug = category.toLowerCase().replace(/\s+&\s+/g, "-").replace(/\s+/g, "-");
                        return (
                          <div key={category} id={`cat-${slug}`} className="scroll-mt-32">
                            <BlogCategoryCarousel
                              category={category}
                              posts={catPosts}
                              formatDate={formatDate}
                            />
                          </div>
                        );
                      })}

                      {postsByCategory["Uncategorized"]?.length > 0 && (
                        <BlogCategoryCarousel
                          category="More Articles"
                          posts={postsByCategory["Uncategorized"]}
                          formatDate={formatDate}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

      </main>

      <MistakesGuideLeadMagnet location="blog_index" />

      <Footer />
    </>
  );
}
