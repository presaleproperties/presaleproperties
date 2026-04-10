import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen,
  TrendingUp,
  MapPin,
  Building2,
  DollarSign,
  ArrowRight,
  FileText,
  Calendar,
  Star,
  Loader2,
  Calculator,
  Users,
  ChevronRight
} from "lucide-react";

// Content categories with icons and descriptions
const CONTENT_CATEGORIES = [
  { slug: "presale-guides", title: "Presale Guides", description: "Learn how to buy presale condos and townhomes", icon: BookOpen, color: "bg-blue-500/10 text-blue-600", dbCategory: "Presale Guides" },
  { slug: "buyer-education", title: "Buyer Education", description: "Essential knowledge for home buyers", icon: BookOpen, color: "bg-sky-500/10 text-sky-600", dbCategory: "Buyer Education" },
  { slug: "market-insights", title: "Market Insights", description: "Latest presale market reports and trends", icon: TrendingUp, color: "bg-green-500/10 text-green-600", dbCategory: "Market Insights" },
  { slug: "investment-strategy", title: "Investment Strategy", description: "ROI calculations and investment strategies", icon: DollarSign, color: "bg-emerald-500/10 text-emerald-600", dbCategory: "Investment Strategy" },
  { slug: "neighbourhood-guides", title: "Neighbourhood Guides", description: "In-depth guides to BC's best neighbourhoods", icon: MapPin, color: "bg-purple-500/10 text-purple-600", dbCategory: "Neighbourhood Guides" },
  { slug: "tax-finance", title: "Tax & Finance", description: "Tax planning and financial strategies", icon: DollarSign, color: "bg-amber-500/10 text-amber-600", dbCategory: "Tax & Finance" },
  { slug: "city-spotlight", title: "City Spotlight", description: "Deep dives into BC's fastest-growing cities", icon: Building2, color: "bg-orange-500/10 text-orange-600", dbCategory: "City Spotlight" },
  { slug: "assignments", title: "Assignments", description: "Buying and selling presale assignments", icon: TrendingUp, color: "bg-rose-500/10 text-rose-600", dbCategory: "Assignments" },
  { slug: "agent-spotlight", title: "Agent Spotlight", description: "Meet the agents behind successful transactions", icon: Users, color: "bg-indigo-500/10 text-indigo-600", dbCategory: "Agent Spotlight" },
  { slug: "faq", title: "FAQ", description: "Frequently asked questions about presales", icon: BookOpen, color: "bg-teal-500/10 text-teal-600", dbCategory: "FAQ" },
];
// Quick resources
const QUICK_RESOURCES = [
  {
    title: "Investment Calculator",
    description: "Calculate ROI, cash flow, and returns",
    href: "/calculator",
    icon: Calculator
  },
  {
    title: "Presale Guide",
    description: "Complete guide to buying presale",
    href: "/presale-guide",
    icon: BookOpen
  },
  {
    title: "Developer Directory",
    description: "Browse top BC developers",
    href: "/developers",
    icon: Building2
  },
  {
    title: "Contact an Expert",
    description: "Get personalized advice",
    href: "/contact",
    icon: Users
  }
];

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

export default function ContentHub() {
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoryPosts, setCategoryPosts] = useState<Record<string, { title: string; slug: string }[]>>({});

  useEffect(() => {
    fetchPosts();
    fetchCategoryPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // Fetch featured posts
      const { data: featured } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image, category, is_featured, publish_date")
        .eq("is_published", true)
        .eq("is_featured", true)
        .order("publish_date", { ascending: false })
        .limit(3);

      // Fetch recent posts
      const { data: recent } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image, category, is_featured, publish_date")
        .eq("is_published", true)
        .order("publish_date", { ascending: false })
        .limit(6);

      setFeaturedPosts(featured || []);
      setRecentPosts(recent || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryPosts = async () => {
    try {
      const { data } = await supabase
        .from("blog_posts")
        .select("title, slug, category")
        .eq("is_published", true)
        .order("publish_date", { ascending: false });

      const grouped: Record<string, { title: string; slug: string }[]> = {};
      (data || []).forEach((p) => {
        if (!p.category) return;
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push({ title: p.title, slug: p.slug });
      });
      setCategoryPosts(grouped);
    } catch (error) {
      console.error("Error fetching category posts:", error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Helmet>
        <title>Guides & Resources | BC Presale Real Estate Education | PresaleProperties.com</title>
        <meta name="description" content="Free guides and resources for buying presale condos in Metro Vancouver. Learn about deposits, assignments, completion and more." />
        <link rel="canonical" href="https://presaleproperties.com/guides" />
        <meta property="og:title" content="Guides & Resources | BC Presale Real Estate Education | PresaleProperties.com" />
        <meta property="og:description" content="Free guides and resources for buying presale condos in Metro Vancouver. Learn about deposits, assignments, completion and more." />
        <meta property="og:url" content="https://presaleproperties.com/guides" />
        <meta property="og:type" content="website" />
        
        {/* Schema.org for content hub */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "BC Presale Real Estate Guides & Resources",
            "description": "Expert guides, market updates, and investment analysis for BC presale properties",
            "url": "https://presaleproperties.com/guides",
            "publisher": {
              "@type": "Organization",
              "name": "PresaleProperties.com",
              "url": "https://presaleproperties.com"
            },
            "hasPart": CONTENT_CATEGORIES.map(cat => ({
              "@type": "WebPage",
              "name": cat.title,
              "description": cat.description,
              "url": `https://presaleproperties.com/guides/${cat.slug}`
            }))
          })}
        </script>
      </Helmet>

      <ConversionHeader />
      
      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30">
          <div className="container py-3">
            <Breadcrumbs items={[{ label: "Guides & Resources" }]} />
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background py-12 md:py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4">
                Educational Resources
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                Guides & Resources
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Everything you need to navigate the BC presale market with confidence. 
                Expert guides, market updates, and investment insights.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/presale-guide">
                  <Button size="lg">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Start with The Guide
                  </Button>
                </Link>
                <Link to="/calculator">
                  <Button size="lg" variant="outline">
                    <Calculator className="h-4 w-4 mr-2" />
                    Investment Calculator
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Content Categories Grid */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Browse by Category</h2>
                <p className="text-muted-foreground mt-1">
                  Explore our curated content collections
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CONTENT_CATEGORIES
                .filter((cat) => (categoryPosts[cat.dbCategory]?.length ?? 0) > 0)
                .map((category) => {
                const Icon = category.icon;
                const posts = categoryPosts[category.dbCategory] || [];
                return (
                  <Link key={category.slug} to={`/guides/${category.slug}`}>
                    <Card className="group h-full hover:shadow-xl transition-all duration-300 hover:border-primary/50">
                      <CardContent className="p-6">
                        <div className={`h-12 w-12 rounded-xl ${category.color} flex items-center justify-center mb-4`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                          {category.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          {category.description}
                        </p>
                        <ul className="space-y-2 mb-4">
                          {posts.slice(0, 3).map((post) => (
                            <li key={post.slug} className="text-sm text-muted-foreground flex items-center gap-2">
                              <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                              <span className="truncate">{post.title}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center text-primary text-sm font-medium">
                          {posts.length} article{posts.length !== 1 ? "s" : ""}
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Articles */}
        {featuredPosts.length > 0 && (
          <section className="py-12 md:py-16 bg-muted/30">
            <div className="container">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">Featured Articles</h2>
                  <p className="text-muted-foreground mt-1">
                    Our most popular and helpful content
                  </p>
                </div>
                <Link to="/blog" className="hidden sm:block">
                  <Button variant="outline">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {featuredPosts.map((post) => (
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
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Featured
                              </Badge>
                            </div>
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
                            {post.publish_date && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(post.publish_date)}
                              </span>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    </article>
                  ))}
                </div>
              )}

              <div className="mt-6 sm:hidden">
                <Link to="/blog">
                  <Button variant="outline" className="w-full">
                    View All Articles
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Quick Resources */}
        <section className="py-12 md:py-16">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Quick Resources</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {QUICK_RESOURCES.map((resource) => {
                const Icon = resource.icon;
                return (
                  <Link key={resource.href} to={resource.href}>
                    <Card className="group hover:shadow-md transition-all hover:border-primary/50 h-full">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {resource.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {resource.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Recent Articles */}
        {recentPosts.length > 0 && (
          <section className="py-12 md:py-16 bg-muted/30">
            <div className="container">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold">Latest Articles</h2>
                <Link to="/blog">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentPosts.map((post) => (
                  <article key={post.id}>
                    <Link to={`/blog/${post.slug}`}>
                      <Card className="group hover:shadow-md transition-all h-full">
                        <CardContent className="p-4 flex gap-4">
                          <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
                            {post.featured_image ? (
                              <img
                                src={post.featured_image}
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {post.category && (
                              <Badge variant="secondary" className="mb-1 text-xs">
                                {post.category}
                              </Badge>
                            )}
                            <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                              {post.title}
                            </h3>
                            {post.publish_date && (
                              <span className="text-xs text-muted-foreground mt-1 block">
                                {formatDate(post.publish_date)}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Newsletter CTA */}
        <section className="py-12 md:py-16">
          <div className="container">
            <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
              <CardContent className="p-8 md:p-12 text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Stay Updated
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                  Get the latest market updates, new project launches, and expert insights 
                  delivered to your inbox weekly.
                </p>
                <Link to="/contact">
                  <Button size="lg">
                    Subscribe to Updates
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
