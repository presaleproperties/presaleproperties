import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "@/components/seo/Helmet";
import { MetaTags } from "@/components/seo/MetaTags";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { FloatingBottomNav } from "@/components/mobile/FloatingBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, MapPin, ArrowRight, TrendingUp, Tag, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateProjectUrl } from "@/lib/seoUrls";

const PAGE_URL = "https://presaleproperties.com/presale-incentives";

const FAQS = [
  {
    q: "Are presale incentives negotiable in BC?",
    a: "Some incentives are negotiable, especially in slower market conditions or near sales velocity targets. Developers usually run incentives systematically rather than case-by-case, but a strong buyer working with a connected Realtor can sometimes secure bonus credits, parking, storage, or upgrade allowances.",
  },
  {
    q: "How long do presale condo incentives last?",
    a: "Incentives are typically time-limited or capped at a sales threshold (often 75–80% sold). Once those goals are hit, developers pull the offer. That's why our list is updated regularly — the deal you see today may be gone next week.",
  },
  {
    q: "Can I assign my presale unit and keep the incentive?",
    a: "In most cases, no. Many developers exclude assignment buyers from incentive offers, and credits often disappear at assignment. Always review the disclosure statement and assignment clause with your lawyer before relying on an incentive surviving a resale.",
  },
  {
    q: "What counts as a presale incentive?",
    a: "Common BC presale incentives include cash credits ($10K–$100K+), reduced deposits (as low as 5%), GST or PTT absorption, decorating allowances, free parking and storage, capped strata fees, rate buy-downs, and assignment fee waivers.",
  },
  {
    q: "How do I get VIP access to presale incentives in Metro Vancouver?",
    a: "The best incentives are often released first to buyers working with Realtors who have direct developer relationships. Register with our VIP list to get early notification of new launches, deposit reductions, and limited-time credits before they go public.",
  },
  {
    q: "What are the best presale incentives available right now?",
    a: "Current Metro Vancouver incentives range from $10,000 to over $100,000 in cash credits, deposit programs as low as 5%, GST coverage for first-time buyers, and free parking/storage bundles. The list above is updated as developers release new offers — contact us for the latest VIP-only incentives.",
  },
];

interface ProjectRow {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string | null;
  developer_name: string | null;
  starting_price: number | null;
  featured_image: string | null;
  project_type: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  incentives: string | null;
  short_description: string | null;
  completion_year: number | null;
}

const formatPrice = (price: number | null) => {
  if (!price) return null;
  if (price >= 1000000) {
    const m = price / 1000000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2)}M`;
  }
  return `$${Math.round(price / 1000)}K`;
};

const PresaleIncentivesPage = () => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["presale-incentives-list"],
    queryFn: async (): Promise<ProjectRow[]> => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select(
          "id,name,slug,city,neighborhood,developer_name,starting_price,featured_image,project_type,incentives,short_description,completion_year,incentives_available"
        )
        .eq("is_published", true)
        .or("incentives_available.eq.true,incentives.not.is.null")
        .order("city", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as any[]).filter(
        (p) => p.incentives_available === true || (p.incentives && p.incentives.trim().length > 0)
      );
    },
  });

  // Group by city
  const byCity = useMemo(() => {
    const map = new Map<string, ProjectRow[]>();
    (projects ?? []).forEach((p) => {
      const c = p.city || "Other";
      if (!map.has(c)) map.set(c, []);
      map.get(c)!.push(p);
    });
    // Sort cities by count desc, then alpha
    return Array.from(map.entries()).sort((a, b) => {
      if (b[1].length !== a[1].length) return b[1].length - a[1].length;
      return a[0].localeCompare(b[0]);
    });
  }, [projects]);

  const totalProjects = projects?.length ?? 0;
  const totalCities = byCity.length;

  // JSON-LD: ItemList of incentivized projects
  const itemListSchema = useMemo(() => {
    if (!projects?.length) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Metro Vancouver Presale Condo Incentives",
      itemListElement: projects.slice(0, 30).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://presaleproperties.com${generateProjectUrl({
          slug: p.slug,
          neighborhood: p.neighborhood || p.city,
          projectType: p.project_type,
        })}`,
        name: `${p.name} — ${p.city}`,
      })),
    };
  }, [projects]);

  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    }),
    []
  );

  return (
    <div className="min-h-screen bg-background">
      <MetaTags
        title="BC Presale Condo Incentives & Discounts | Updated Daily"
        description="Live list of Metro Vancouver presale condo & townhome incentives — cash credits, GST coverage, low deposits, free parking. Sorted by city. Updated regularly."
        url={PAGE_URL}
      />
      <Helmet>
        <link rel="canonical" href={PAGE_URL} />
        {itemListSchema && (
          <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
        )}
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <ConversionHeader />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-14 md:py-20">
            <div className="max-w-3xl">
              <Badge variant="secondary" className="mb-4 gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Updated regularly
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                BC Presale Condo Incentives & New Homes with Discounts
              </h1>
              <p className="mt-5 text-lg md:text-xl text-muted-foreground leading-relaxed">
                Every active Metro Vancouver presale incentive in one place — cash credits, GST coverage,
                deposit reductions, free parking, decorating allowances and more. Grouped by city so you
                can compare deals fast.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link to="/contact">Get VIP Incentive Access</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#cities">Browse by City</a>
                </Button>
              </div>
              {!isLoading && totalProjects > 0 && (
                <p className="mt-6 text-sm text-muted-foreground">
                  Currently tracking <strong className="text-foreground">{totalProjects}</strong> projects
                  with active incentives across <strong className="text-foreground">{totalCities}</strong>{" "}
                  Metro Vancouver cities.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* CITY QUICK NAV */}
        {!isLoading && byCity.length > 0 && (
          <section className="border-b bg-card/30 sticky top-16 z-30 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="container mx-auto px-4 py-3">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide" id="cities">
                {byCity.map(([city, items]) => (
                  <a
                    key={city}
                    href={`#city-${city.toLowerCase().replace(/\s+/g, "-")}`}
                    className="shrink-0 px-3.5 py-1.5 rounded-full border bg-background text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    {city} <span className="text-muted-foreground">({items.length})</span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CITY SECTIONS */}
        <section className="container mx-auto px-4 py-10 md:py-14">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : byCity.length === 0 ? (
            <div className="text-center py-16">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h2 className="mt-4 text-2xl font-semibold">No active incentives right now</h2>
              <p className="mt-2 text-muted-foreground">
                Check back soon — developers release new offers every week.
              </p>
              <Button asChild className="mt-6">
                <Link to="/presale-projects">Browse all presale projects</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-14">
              {byCity.map(([city, items]) => (
                <div
                  key={city}
                  id={`city-${city.toLowerCase().replace(/\s+/g, "-")}`}
                  className="scroll-mt-32"
                >
                  <div className="flex items-end justify-between mb-6 pb-3 border-b">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-primary" />
                        {city} Presale Incentives
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {items.length} {items.length === 1 ? "project" : "projects"} with active offers
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((p) => {
                      const url = generateProjectUrl({
                        slug: p.slug,
                        neighborhood: p.neighborhood || p.city,
                        projectType: p.project_type,
                      });
                      return (
                        <Link key={p.id} to={url} className="group block">
                          <Card className="overflow-hidden h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/60">
                            <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                              {p.featured_image ? (
                                <img
                                  src={p.featured_image}
                                  alt={`${p.name} presale incentive offer in ${p.city}`}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Building2 className="h-12 w-12 text-muted-foreground/40" />
                                </div>
                              )}
                              <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground gap-1 shadow-md">
                                <Sparkles className="h-3 w-3" />
                                Incentive
                              </Badge>
                              {p.starting_price && (
                                <div className="absolute bottom-3 right-3 bg-background/95 backdrop-blur px-2.5 py-1 rounded-md text-sm font-semibold shadow">
                                  From {formatPrice(p.starting_price)}
                                </div>
                              )}
                            </div>
                            <CardContent className="p-5">
                              <div className="text-xs font-medium text-primary uppercase tracking-wide mb-1.5">
                                {p.neighborhood || p.city}
                              </div>
                              <h3 className="font-bold text-lg leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                {p.name}
                              </h3>
                              {p.developer_name && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  by {p.developer_name}
                                </p>
                              )}
                              {p.incentives ? (
                                <p className="mt-3 text-sm text-foreground/80 leading-relaxed line-clamp-3 bg-primary/5 border border-primary/10 rounded-md p-2.5">
                                  <Tag className="inline h-3.5 w-3.5 mr-1 text-primary" />
                                  {p.incentives}
                                </p>
                              ) : p.short_description ? (
                                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                                  {p.short_description}
                                </p>
                              ) : null}
                              <div className="mt-4 inline-flex items-center text-sm font-semibold text-primary group-hover:gap-2 gap-1 transition-all">
                                View Incentive Details
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* EDUCATIONAL / SEO LONG-FORM */}
        <section className="border-t bg-card/30">
          <div className="container mx-auto px-4 py-14 md:py-20 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Understanding Metro Vancouver Presale Incentives
            </h2>
            <div className="prose prose-lg max-w-none text-foreground/85 space-y-5 leading-relaxed">
              <p>
                Vancouver's presale market is one of the most incentive-driven new-construction
                environments in North America. Developers use cash credits, deposit reductions, GST and
                PTT coverage, decorating allowances, free parking and rate buy-downs to move inventory
                ahead of completion targets — and informed buyers can save tens of thousands of dollars
                by shopping the right offer at the right time.
              </p>
              <p>
                The page above is a live snapshot of every active presale incentive across our tracked
                projects in Metro Vancouver — Surrey, Langley, Coquitlam, Burnaby, Vancouver, Richmond,
                North Vancouver, Port Moody, Abbotsford, Delta and more. Listings are grouped by city so
                you can compare deals in your target area side-by-side.
              </p>

              <h3 className="text-2xl font-semibold mt-10 mb-3 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                The most common BC presale incentives in 2026
              </h3>
              <ul className="space-y-2">
                <li><strong>Cash credits & price reductions</strong> — typically $10,000 to $100,000+ off select homes.</li>
                <li><strong>Reduced-deposit programs</strong> — some developers now accept as little as 5% down.</li>
                <li><strong>GST coverage for first-time buyers</strong> — on homes under $1M, this can save up to $50,000.</li>
                <li><strong>No Property Transfer Tax (PTT)</strong> for eligible buyers under BC's first-time buyer exemption.</li>
                <li><strong>Decorating & upgrade allowances</strong> — credits for finishes, appliances or window coverings.</li>
                <li><strong>Free parking & storage</strong> — bundled at no extra cost (often a $30K–$60K saving).</li>
                <li><strong>Capped strata fees</strong> for the first 1–2 years of occupancy.</li>
                <li><strong>Mortgage rate buy-downs</strong> — developer pays points to reduce your rate for the term.</li>
                <li><strong>Assignment fee waivers</strong> for buyers who plan to resell before completion.</li>
              </ul>

              <h3 className="text-2xl font-semibold mt-10 mb-3">How to evaluate a presale incentive properly</h3>
              <p>
                Not every "incentive" is a true discount. A $25,000 credit on a unit priced 5% above
                comparable resales is negative economics for the buyer. Before you sign, run through
                this short checklist:
              </p>
              <ul className="space-y-2">
                <li><strong>Net price comparison</strong> — what does the home cost <em>after</em> the incentive vs. recent resales within 5 blocks?</li>
                <li><strong>Location fundamentals</strong> — does transit, employment and demographics support the price without the incentive?</li>
                <li><strong>Completion risk signals</strong> — are big incentives compensating for construction-financing stress?</li>
                <li><strong>Assignment implications</strong> — does the incentive survive a resale before completion? Most don't.</li>
                <li><strong>Disclosure statement</strong> — material incentives must be disclosed under REDMA. Have your lawyer confirm.</li>
              </ul>

              <h3 className="text-2xl font-semibold mt-10 mb-3">Why VIP access matters</h3>
              <p>
                The strongest presale incentives are usually released first to a small network of
                Realtors with direct developer relationships. By the time an offer hits public
                advertising, the best units (and sometimes the best terms) are already gone. Our VIP
                list gets you early notification of deposit reductions, cash credits and limited-launch
                pricing — often before the marketing centre opens.
              </p>

              <div className="not-prose mt-8 rounded-xl border bg-primary/5 p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold mb-2">
                  Get early access to BC's best presale incentives
                </h3>
                <p className="text-muted-foreground mb-5">
                  Join our VIP list to receive new incentives, deposit programs and launch pricing
                  before they're publicly released.
                </p>
                <Button asChild size="lg">
                  <Link to="/contact">Join the VIP List</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container mx-auto px-4 py-14 md:py-20 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Presale Incentive FAQ
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base md:text-lg font-semibold">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/80 leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <Footer />
      <FloatingBottomNav />
    </div>
  );
};

export default PresaleIncentivesPage;
