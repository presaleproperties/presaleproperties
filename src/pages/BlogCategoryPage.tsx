import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
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
  ChevronRight,
  GraduationCap,
  Receipt,
  Users,
  HelpCircle,
  Globe,
  Repeat
} from "lucide-react";

// Category configuration aligned with canonical categories
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
    relatedCategories: ["buyer-education", "investment-strategy"],
    featuredTopics: [
      { title: "First-Time Buyer's Guide to Presale", description: "Everything you need to know before buying your first presale property" },
      { title: "Understanding Presale Contracts", description: "Key clauses, rescission periods, and what to watch for" },
      { title: "Deposit Structures Explained", description: "How presale deposits work and what to budget for" },
      { title: "Assignment Sales Guide", description: "How to sell your presale contract before completion" }
    ]
  },
  "buyer-education": {
    title: "Buyer Education",
    slug: "buyer-education",
    description: "Essential knowledge for home buyers in BC's real estate market",
    longDescription: "Build your confidence as a buyer with our educational resources. Learn about mortgages, the buying process, due diligence, and how to make smart decisions in BC's competitive real estate market.",
    icon: GraduationCap,
    dbCategory: "Buyer Education",
    relatedCategories: ["presale-guides", "tax-finance"],
    featuredTopics: [
      { title: "Home Buying 101", description: "Step-by-step guide to purchasing your first home" },
      { title: "Mortgage Pre-Approval Guide", description: "What you need to know before applying" },
      { title: "Due Diligence Checklist", description: "Essential checks before making an offer" },
      { title: "Closing Costs Breakdown", description: "All the costs beyond the purchase price" }
    ]
  },
  "market-insights": {
    title: "Market Insights",
    slug: "market-insights",
    description: "Latest BC real estate market reports and presale trends",
    longDescription: "Stay informed with our regular market updates covering presale launches, price trends, and market conditions across Greater Vancouver and the Fraser Valley. Get data-driven insights to make smarter investment decisions.",
    icon: TrendingUp,
    dbCategory: "Market Insights",
    relatedCategories: ["investment-strategy", "city-spotlight"],
    featuredTopics: [
      { title: "Monthly Market Reports", description: "Comprehensive analysis of presale market conditions" },
      { title: "Price Trend Analysis", description: "Track pricing movements across cities and property types" },
      { title: "Upcoming Launches", description: "Preview of new presale projects coming to market" },
      { title: "Quarterly Forecasts", description: "Expert predictions for the BC presale market" }
    ]
  },
  "investment-strategy": {
    title: "Investment Strategy",
    slug: "investment-strategy",
    description: "ROI calculations, rental yields, and presale investment strategies",
    longDescription: "Maximize your returns with our in-depth investment analysis. Learn about rental yields, ROI calculations, tax strategies, and which markets offer the best opportunities for presale investors in BC.",
    icon: DollarSign,
    dbCategory: "Investment Strategy",
    relatedCategories: ["market-insights", "tax-finance"],
    featuredTopics: [
      { title: "Rental Yield Analysis", description: "Compare rental returns across BC neighborhoods" },
      { title: "Presale vs Resale ROI", description: "Which strategy offers better returns?" },
      { title: "Portfolio Building", description: "Build a diversified real estate portfolio" },
      { title: "Financing Strategies", description: "Optimize your mortgage for maximum leverage" }
    ]
  },
  "neighbourhood-guides": {
    title: "Neighbourhood Guides",
    slug: "neighbourhood-guides",
    description: "In-depth guides to BC's best neighbourhoods for presale investment",
    longDescription: "Discover the best neighbourhoods for presale investment in Greater Vancouver and the Fraser Valley. Our detailed guides cover everything from walkability and transit access to schools, amenities, and future development plans.",
    icon: MapPin,
    dbCategory: "Neighbourhood Guides",
    relatedCategories: ["city-spotlight", "market-insights"],
    featuredTopics: [
      { title: "South Surrey Living Guide", description: "Discover why South Surrey is a top choice for families and investors" },
      { title: "Langley Willoughby Overview", description: "Explore the booming Willoughby neighbourhood" },
      { title: "Surrey City Centre Guide", description: "Urban living in Surrey's growing downtown core" },
      { title: "Burnaby Metrotown Guide", description: "High-rise living near BC's largest shopping centre" }
    ]
  },
  "tax-finance": {
    title: "Tax & Finance",
    slug: "tax-finance",
    description: "Tax planning, mortgage tips, and financial strategies for property buyers",
    longDescription: "Navigate the financial side of real estate with confidence. Our guides cover property transfer tax, GST on presales, mortgage strategies, and tax-efficient investing for BC property buyers.",
    icon: Receipt,
    dbCategory: "Tax & Finance",
    relatedCategories: ["buyer-education", "investment-strategy"],
    featuredTopics: [
      { title: "Property Transfer Tax Guide", description: "Understand PTT and available exemptions" },
      { title: "GST on Presale Properties", description: "When GST applies and how to claim rebates" },
      { title: "Mortgage Rate Strategies", description: "Fixed vs variable and when to lock in" },
      { title: "First-Time Buyer Incentives", description: "Government programs that save you money" }
    ]
  },
  "agent-spotlight": {
    title: "Agent Spotlight",
    slug: "agent-spotlight",
    description: "Meet the agents and teams behind successful presale transactions",
    longDescription: "Get to know the experienced agents helping buyers navigate BC's presale market. Learn about their strategies, success stories, and what makes them leaders in the industry.",
    icon: Users,
    dbCategory: "Agent Spotlight",
    relatedCategories: ["presale-guides", "buyer-education"],
    featuredTopics: [
      { title: "Agent Success Stories", description: "Real results from top-performing agents" },
      { title: "Why Work with a Presale Specialist", description: "The value of expert representation" },
      { title: "Team Profiles", description: "Meet the professionals behind the brand" },
      { title: "Client Testimonials", description: "What buyers say about their experience" }
    ]
  },
  "faq": {
    title: "FAQ",
    slug: "faq",
    description: "Frequently asked questions about presale condos and the buying process",
    longDescription: "Find quick answers to the most common questions about buying presale properties in BC. From deposit timelines to assignment rules, we've got you covered.",
    icon: HelpCircle,
    dbCategory: "FAQ",
    relatedCategories: ["buyer-education", "presale-guides"],
    featuredTopics: [
      { title: "Presale FAQ", description: "Common questions about the presale process" },
      { title: "Assignment FAQ", description: "Everything about selling your presale contract" },
      { title: "Mortgage FAQ", description: "Financing questions answered" },
      { title: "Closing FAQ", description: "What to expect at completion" }
    ]
  },
  "city-spotlight": {
    title: "City Spotlight",
    slug: "city-spotlight",
    description: "Deep dives into BC's fastest-growing cities for real estate",
    longDescription: "Explore the cities driving BC's real estate growth. Our city spotlights cover market conditions, development pipeline, infrastructure investments, and why these cities are attracting buyers and investors.",
    icon: Globe,
    dbCategory: "City Spotlight",
    relatedCategories: ["neighbourhood-guides", "market-insights"],
    featuredTopics: [
      { title: "Surrey Growth Story", description: "Why Surrey is BC's fastest-growing city" },
      { title: "Langley Development Boom", description: "New projects transforming Langley" },
      { title: "Burnaby Urban Plan", description: "Burnaby's vision for the next decade" },
      { title: "Abbotsford Rising", description: "Affordable living in the Fraser Valley" }
    ]
  },
  "assignments": {
    title: "Assignments",
    slug: "assignments",
    description: "Guides to buying and selling presale assignment contracts in BC",
    longDescription: "Learn the ins and outs of presale assignments. Our guides cover how to list, price, and sell your presale contract, as well as how to find and evaluate assignment opportunities as a buyer.",
    icon: Repeat,
    dbCategory: "Assignments",
    relatedCategories: ["presale-guides", "investment-strategy"],
    featuredTopics: [
      { title: "Assignment Selling Guide", description: "How to successfully sell your presale contract" },
      { title: "Buying Assignments", description: "Finding and evaluating assignment opportunities" },
      { title: "Assignment Pricing", description: "How to price your assignment competitively" },
      { title: "Legal Considerations", description: "What you need to know about assignment contracts" }
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
                              <Badge className="bg-warning hover:bg-warning">
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
