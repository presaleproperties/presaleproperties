import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search,
  FileText,
  Calendar,
  Star,
  Loader2,
  ArrowRight
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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || post.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = filteredPosts.filter(p => p.is_featured);
  const regularPosts = filteredPosts.filter(p => !p.is_featured);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <Helmet>
        <title>Blog | Real Estate Insights & Market Updates | PresaleProperties.com</title>
        <meta name="description" content="Stay updated with the latest real estate news, market insights, and tips for buying presale properties in Greater Vancouver." />
        <link rel="canonical" href="https://presaleproperties.com/blog" />
      </Helmet>

      <ConversionHeader />
      
      <main className="min-h-screen bg-background pt-14 md:pt-16">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30">
          <div className="container py-3">
            <Breadcrumbs items={[{ label: "Blog" }]} />
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background py-12 md:py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                Blog & Insights
              </h1>
              <p className="text-lg text-muted-foreground">
                Market updates, buying guides, and expert tips for navigating the presale market
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section aria-label="Article filters" className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b py-4">
          <div className="container">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Content */}
        <section aria-label="Blog articles" className="py-8 md:py-12">
          <div className="container">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No articles found</h2>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filters
                </p>
                <Button onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Featured Posts */}
                {featuredPosts.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Featured Articles</h2>
                    <div className="grid md:grid-cols-2 gap-6" role="feed" aria-label="Featured articles">
                      {featuredPosts.map((post) => (
                        <article key={post.id}>
                          <Link to={`/blog/${post.slug}`}>
                          <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                            <div className="relative aspect-[16/9] overflow-hidden">
                              {post.featured_image ? (
                                <img
                                  src={post.featured_image}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <FileText className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute top-3 left-3">
                                <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                  <Star className="h-3 w-3 mr-1 fill-current" />
                                  Featured
                                </Badge>
                              </div>
                            </div>
                            <CardContent className="p-5">
                              {post.category && (
                                <Badge variant="secondary" className="mb-3">
                                  {post.category}
                                </Badge>
                              )}
                              <h3 className="font-semibold text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                {post.title}
                              </h3>
                              {post.excerpt && (
                                <p className="text-muted-foreground line-clamp-2 mb-4">
                                  {post.excerpt}
                                </p>
                              )}
                              <div className="flex items-center justify-between">
                                {post.publish_date && (
                                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(post.publish_date)}
                                  </span>
                                )}
                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                              </div>
                            </CardContent>
                          </Card>
                          </Link>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Posts */}
                {regularPosts.length > 0 && (
                  <div>
                    {featuredPosts.length > 0 && (
                      <h2 className="text-2xl font-bold mb-6">Latest Articles</h2>
                    )}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" role="feed" aria-label="Latest articles">
                      {regularPosts.map((post) => (
                        <article key={post.id}>
                          <Link to={`/blog/${post.slug}`}>
                          <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                            <div className="relative aspect-[16/10] overflow-hidden">
                              {post.featured_image ? (
                                <img
                                  src={post.featured_image}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <FileText className="h-10 w-10 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4">
                              {post.category && (
                                <Badge variant="secondary" className="mb-2 text-xs">
                                  {post.category}
                                </Badge>
                              )}
                              <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                {post.title}
                              </h3>
                              {post.excerpt && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                  {post.excerpt}
                                </p>
                              )}
                              <div className="flex items-center justify-between">
                                {post.publish_date && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(post.publish_date)}
                                  </span>
                                )}
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                              </div>
                            </CardContent>
                          </Card>
                          </Link>
                        </article>
                      ))}
                    </div>
                  </div>
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