import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  BookOpen,
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

  // Group regular posts by category
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
    "name": "Presale & New Construction Blog | Vancouver Real Estate 2026",
    "description": "Expert guides on buying presale & new construction in Vancouver. First-time buyer tips, market updates, investment strategies.",
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
        <title>Presale & New Construction Blog | Vancouver Real Estate 2026</title>
        <meta name="description" content="Expert guides on buying presale & new construction in Vancouver. First-time buyer tips, market updates, investment strategies. Free resources & advice." />
        <link rel="canonical" href="https://presaleproperties.com/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Presale & New Construction Blog | Vancouver Real Estate 2026" />
        <meta property="og:description" content="Expert guides on buying presale & new construction in Vancouver." />
        <meta property="og:url" content="https://presaleproperties.com/blog" />
        <script type="application/ld+json">{JSON.stringify(collectionSchema)}</script>
      </Helmet>

      <ConversionHeader />
      
      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30">
          <div className="container py-3">
            <Breadcrumbs items={[{ label: "Blog" }]} />
          </div>
        </div>

        {/* Hero Section - Refined */}
        <section className="relative overflow-hidden py-14 md:py-20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-5">
                <BookOpen className="h-4 w-4" />
                Insights & Guides
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
                Your Presale
                <span className="block bg-gradient-to-r from-primary to-primary-deep bg-clip-text text-transparent">
                  Knowledge Hub
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Market updates, buying guides, and expert strategies for navigating Metro Vancouver's presale market
              </p>
            </div>
          </div>
        </section>

        {/* Search & Category Bar */}
        <section aria-label="Article filters" className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b py-4">
          <div className="container">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 rounded-full border-border/60 bg-muted/40 focus:bg-card"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Category chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`inline-flex items-center whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                    !activeCategory
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  All Articles
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={`inline-flex items-center whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
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
        <section aria-label="Blog articles" className="py-10 md:py-14">
          <div className="container">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading articles...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-24">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">No articles found</h2>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or category filter
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory(null);
                  }}
                  className="rounded-full"
                >
                  Clear Filters
                </Button>
              </div>
            ) : isSearching || activeCategory ? (
              /* Search/filter results - flat grid */
              <div>
                <p className="text-sm text-muted-foreground mb-6">
                  Showing {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}
                  {activeCategory && <> in <strong>{activeCategory}</strong></>}
                  {searchQuery && <> matching "<strong>{searchQuery}</strong>"</>}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPosts.map((post) => (
                    <BlogPostCard key={post.id} post={post} formatDate={formatDate} />
                  ))}
                </div>
              </div>
            ) : (
              /* Default view: Featured carousel + category carousels */
              <div className="space-y-14">
                {/* Featured Carousel */}
                {featuredPosts.length > 0 && (
                  <BlogFeaturedCarousel posts={featuredPosts} formatDate={formatDate} />
                )}

                {/* Category Carousels */}
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

                {/* Uncategorized posts */}
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
