import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { BlogFeaturedCarousel } from "@/components/blog/BlogFeaturedCarousel";
import { BlogCategoryCarousel } from "@/components/blog/BlogCategoryCarousel";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search,
  FileText,
  Loader2,
  X,
  Sparkles,
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

  const categories = [...new Set(posts.map(p => p.category).filter(Boolean) as string[])].sort();

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

        {/* Premium Hero Section */}
        <section className="relative overflow-hidden py-14 md:py-20 lg:py-28">
          {/* Layered background */}
          <div className="absolute inset-0 bg-gradient-to-b from-muted/60 via-background to-background" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
          
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center px-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs sm:text-sm font-semibold mb-6 md:mb-8 shadow-xs">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Expert Insights & Buyer Guides
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 md:mb-6 tracking-tightest leading-[1.1]">
                Your Presale{" "}
                <span className="text-gradient-gold">
                  Knowledge Hub
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
                Market updates, buying guides, and expert strategies for navigating Metro Vancouver's presale landscape
              </p>
            </div>
          </div>
        </section>

        {/* Search & Category Bar */}
        <section aria-label="Article filters" className="sticky top-14 md:top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 py-3 md:py-4">
          <div className="container">
            <div className="flex flex-col gap-3">
              {/* Search */}
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

              {/* Category chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`inline-flex items-center whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 border shrink-0 ${
                    !activeCategory
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "bg-card text-muted-foreground border-border/50 hover:border-foreground/20 hover:text-foreground shadow-xs"
                  }`}
                >
                  All Guides
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={`inline-flex items-center whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 border shrink-0 ${
                      activeCategory === cat
                        ? "bg-foreground text-background border-foreground shadow-sm"
                        : "bg-card text-muted-foreground border-border/50 hover:border-foreground/20 hover:text-foreground shadow-xs"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section aria-label="Blog articles" className="py-10 md:py-14 lg:py-18">
          <div className="container">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 md:py-32 gap-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-2 border-muted" />
                  <Loader2 className="h-12 w-12 animate-spin text-primary absolute inset-0" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Loading articles...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
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
                  return (
                    <BlogCategoryCarousel
                      key={category}
                      category={category}
                      posts={catPosts}
                      formatDate={formatDate}
                    />
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
        </section>
      </main>

      <Footer />
    </>
  );
}
