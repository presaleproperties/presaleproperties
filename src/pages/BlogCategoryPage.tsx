import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText,
  Calendar,
  Star,
  Loader2,
  ArrowRight,
  BookOpen,
  TrendingUp,
  MapPin,
  Building2,
  DollarSign,
  ChevronRight
} from "lucide-react";

// Category configuration with SEO-optimized content
const CATEGORY_CONFIG: Record<string, {
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  icon: typeof BookOpen;
  dbCategory: string;
  relatedCategories: string[];
  featuredTopics: { title: string; description: string }[];
}> = {
  "presale-guides": {
    title: "Presale Guides",
    slug: "presale-guides",
    description: "Expert guides for buying presale condos and townhomes in BC",
    longDescription: "Learn everything you need to know about buying presale properties in British Columbia. From understanding contracts to deposit structures, our comprehensive guides help first-time buyers and seasoned investors navigate the presale market with confidence.",
    icon: BookOpen,
    dbCategory: "Presale Guides",
    relatedCategories: ["investment-analysis", "neighborhood-guides"],
    featuredTopics: [
      { title: "First-Time Buyer's Guide to Presale", description: "Everything you need to know before buying your first presale property" },
      { title: "Understanding Presale Contracts", description: "Key clauses, rescission periods, and what to watch for" },
      { title: "Deposit Structures Explained", description: "How presale deposits work and what to budget for" },
      { title: "Assignment Sales Guide", description: "How to sell your presale contract before completion" }
    ]
  },
  "market-updates": {
    title: "Market Updates",
    slug: "market-updates",
    description: "Latest BC real estate market reports and presale trends",
    longDescription: "Stay informed with our regular market updates covering presale launches, price trends, and market conditions across Greater Vancouver and the Fraser Valley. Get data-driven insights to make smarter investment decisions.",
    icon: TrendingUp,
    dbCategory: "Market Updates",
    relatedCategories: ["investment-analysis", "presale-guides"],
    featuredTopics: [
      { title: "Monthly Market Reports", description: "Comprehensive analysis of presale market conditions" },
      { title: "Price Trend Analysis", description: "Track pricing movements across cities and property types" },
      { title: "Upcoming Launches", description: "Preview of new presale projects coming to market" },
      { title: "Quarterly Forecasts", description: "Expert predictions for the BC presale market" }
    ]
  },
  "neighborhood-guides": {
    title: "Neighborhood Guides",
    slug: "neighborhood-guides",
    description: "In-depth guides to BC's best neighborhoods for presale investment",
    longDescription: "Discover the best neighborhoods for presale investment in Greater Vancouver and the Fraser Valley. Our detailed guides cover everything from walkability and transit access to schools, amenities, and future development plans.",
    icon: MapPin,
    dbCategory: "Neighborhood Guides",
    relatedCategories: ["market-updates", "investment-analysis"],
    featuredTopics: [
      { title: "South Surrey Living Guide", description: "Discover why South Surrey is a top choice for families and investors" },
      { title: "Langley Willoughby Overview", description: "Explore the booming Willoughby neighborhood" },
      { title: "Surrey City Centre Guide", description: "Urban living in Surrey's growing downtown core" },
      { title: "Burnaby Metrotown Guide", description: "High-rise living near BC's largest shopping centre" }
    ]
  },
  "developer-reviews": {
    title: "Developer Reviews",
    slug: "developer-reviews",
    description: "Honest reviews and track records of BC's top developers",
    longDescription: "Make informed decisions with our unbiased developer reviews. We analyze track records, build quality, customer satisfaction, and financial stability to help you choose developers you can trust with your investment.",
    icon: Building2,
    dbCategory: "Developer Reviews",
    relatedCategories: ["presale-guides", "investment-analysis"],
    featuredTopics: [
      { title: "Developer Track Records", description: "Historical performance and delivery timelines" },
      { title: "Build Quality Analysis", description: "Construction standards and warranty coverage" },
      { title: "Top Developers Compared", description: "Side-by-side comparisons of leading developers" },
      { title: "New Developer Profiles", description: "Emerging developers entering the BC market" }
    ]
  },
  "investment-analysis": {
    title: "Investment Analysis",
    slug: "investment-analysis",
    description: "ROI calculations, rental yields, and presale investment strategies",
    longDescription: "Maximize your returns with our in-depth investment analysis. Learn about rental yields, ROI calculations, tax strategies, and which markets offer the best opportunities for presale investors in BC.",
    icon: DollarSign,
    dbCategory: "Investment Analysis",
    relatedCategories: ["market-updates", "presale-guides"],
    featuredTopics: [
      { title: "Rental Yield Analysis", description: "Compare rental returns across BC neighborhoods" },
      { title: "Presale vs Resale ROI", description: "Which strategy offers better returns?" },
      { title: "Tax Strategies for Investors", description: "Minimize taxes on your presale investment" },
      { title: "Financing Strategies", description: "Optimize your mortgage for maximum leverage" }
    ]
  }
};

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

export default function BlogCategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const category = categorySlug ? CATEGORY_CONFIG[categorySlug] : null;

  useEffect(() => {
    if (category) {
      fetchPosts();
    }
  }, [category]);

  const fetchPosts = async () => {
    if (!category) return;
    
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image, category, is_featured, publish_date")
        .eq("is_published", true)
        .eq("category", category.dbCategory)
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!category) {
    return (
      <>
        <ConversionHeader />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
            <Link to="/guides" className="text-primary hover:underline">
              Browse all categories
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const Icon = category.icon;

  return (
    <>
      <Helmet>
        <title>{category.title} | BC Presale Real Estate | PresaleProperties.com</title>
        <meta name="description" content={category.description} />
        <link rel="canonical" href={`https://presaleproperties.com/guides/${category.slug}`} />
      </Helmet>

      <ConversionHeader />
      
      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30">
          <div className="container py-3">
            <Breadcrumbs items={[
              { label: "Guides & Resources", href: "/guides" },
              { label: category.title }
            ]} />
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background py-12 md:py-16">
          <div className="container">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="secondary" className="text-sm">
                  {posts.length} Articles
                </Badge>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                {category.title}
              </h1>
              <p className="text-lg text-muted-foreground">
                {category.longDescription}
              </p>
            </div>
          </div>
        </section>

        {/* Featured Topics */}
        <section className="py-8 border-b">
          <div className="container">
            <h2 className="text-lg font-semibold mb-4">Popular Topics</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {category.featuredTopics.map((topic, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm mb-1">{topic.title}</h3>
                    <p className="text-xs text-muted-foreground">{topic.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Articles */}
        <section className="py-8 md:py-12">
          <div className="container">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No articles yet</h2>
                <p className="text-muted-foreground mb-6">
                  We're working on adding content to this category. Check back soon!
                </p>
                <Link to="/guides" className="text-primary hover:underline">
                  Browse all categories
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
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
                          {post.is_featured && (
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Featured
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
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
            )}
          </div>
        </section>

        {/* Related Categories */}
        <section className="py-8 md:py-12 bg-muted/30">
          <div className="container">
            <h2 className="text-xl font-bold mb-6">Related Categories</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {category.relatedCategories.map((relatedSlug) => {
                const related = CATEGORY_CONFIG[relatedSlug];
                if (!related) return null;
                const RelatedIcon = related.icon;
                return (
                  <Link key={relatedSlug} to={`/guides/${relatedSlug}`}>
                    <Card className="hover:shadow-md transition-all hover:border-primary/50">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <RelatedIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm">{related.title}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {related.description}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export { CATEGORY_CONFIG };
