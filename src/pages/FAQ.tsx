import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, ArrowRight, ChevronDown, Home, DollarSign, FileText, TrendingUp, Receipt, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Helmet } from "@/components/seo/Helmet";
import { MetaTags } from "@/components/seo/MetaTags";
import { Button } from "@/components/ui/button";

/* ────────────────────────────────────────────
   FAQ Data
   ──────────────────────────────────────────── */

interface FAQItem {
  q: string;
  a: React.ReactNode;
}

interface FAQSection {
  title: string;
  icon: React.ReactNode;
  slug: string;
  items: FAQItem[];
}

const FAQ_SECTIONS: FAQSection[] = [
  {
    title: "Getting Started",
    icon: <Home className="h-4 w-4" />,
    slug: "getting-started",
    items: [
      {
        q: "What is a presale condo?",
        a: "A presale condo is a home you purchase before it is built. You sign a contract and lock in the price today, then the developer builds the property over the next 2–4 years. When construction is complete, you move in (or rent it out) at the price you originally agreed to — regardless of how much the market has moved. In Metro Vancouver, presales have historically appreciated significantly during the construction period.",
      },
      {
        q: "How does buying a presale condo work in BC?",
        a: (
          <>
            The process typically follows these steps: (1) You register for VIP access to get early pricing and floor plans. (2) You choose your unit and sign a Purchase and Sale Agreement. (3) You pay a deposit (usually 5–20% of the purchase price, staggered over 12–18 months). (4) You wait for construction to complete (typically 2–4 years). (5) You arrange your mortgage closer to completion. (6) You complete the purchase, get your keys, and move in. Throughout this process, a presale specialist like our team guides you at every step — at no cost to you. <Link to="/presale-process" className="text-primary hover:underline font-medium">Learn more about the presale process →</Link>
          </>
        ),
      },
      {
        q: "Is buying a presale condo a good idea?",
        a: (
          <>
            For most buyers in BC, yes — if you buy the right project. Presales let you lock in today's price, spread your deposit over time, save on Property Transfer Tax (first-time buyers can save up to $50,000+), and benefit from any market appreciation during construction. That said, not every project is worth buying. The developer's track record, location, pricing relative to market, and your personal financial timeline all matter. That is exactly why working with a presale specialist matters — we tell you when a project is not worth it, even if it costs us a deal. <Link to="/presale-projects" className="text-primary hover:underline font-medium">Browse current presale projects →</Link>
          </>
        ),
      },
      {
        q: "Do I need a realtor to buy a presale condo?",
        a: "You do not need one, but you absolutely should have one — and it costs you nothing. The developer pays the realtor's commission, so having a presale specialist in your corner is free. Without representation, you are negotiating directly with the developer's sales team, whose job is to sell units at the highest price. Your presale specialist negotiates for you, reviews contracts, and ensures your interests are protected.",
      },
      {
        q: "What does it cost to work with The Presale Properties Group?",
        a: (
          <>
            $0. Our fee is paid by the developer — not by you. You get VIP access to pricing, floor plans, and incentives that are not available to the public, plus expert guidance throughout the entire process, at absolutely no cost. <Link to="/contact" className="text-primary hover:underline font-medium">Get in touch →</Link>
          </>
        ),
      },
    ],
  },
  {
    title: "Deposits & Financing",
    icon: <DollarSign className="h-4 w-4" />,
    slug: "deposits",
    items: [
      {
        q: "How much deposit do I need for a presale condo in BC?",
        a: "Most presale condos in the Fraser Valley and Metro Vancouver require a total deposit of 5–20% of the purchase price, staggered over several payments. A typical deposit structure looks like this: 5% at signing, 5% at 90 days, 5% at 180 days, and sometimes an additional 5% at 365 days. Some developers offer as low as 5–10% total deposit, which is significantly less than a traditional resale purchase.",
      },
      {
        q: "When do I need to arrange my mortgage for a presale condo?",
        a: "You do not need mortgage approval at the time of purchase. Since the building takes 2–4 years to complete, you arrange your mortgage closer to the completion date — usually 6–12 months before the estimated move-in. This gives you time to save, improve your credit, and shop for the best mortgage rate. We connect our clients with trusted mortgage brokers who specialize in presale financing.",
      },
      {
        q: "Can I use my RRSP for a presale condo deposit?",
        a: "Yes. If you are a first-time home buyer, you can withdraw up to $60,000 from your RRSP under the Home Buyers Plan (HBP) to put toward your presale purchase. This withdrawal is tax-free as long as you repay it within the required timeframe. Additionally, the First Home Savings Account (FHSA) allows you to contribute up to $8,000/year (max $40,000) toward your first home, with contributions being tax-deductible.",
      },
      {
        q: "What happens to my deposit if the developer cancels the project?",
        a: "In BC, presale deposits are protected by law. Developers are required to hold your deposit in a trust account, and if the project is cancelled, your full deposit is returned to you with interest. This protection is regulated under the Real Estate Development Marketing Act (REDMA) and overseen by the BC Financial Services Authority (BCFSA).",
      },
    ],
  },
  {
    title: "The Presale Process",
    icon: <FileText className="h-4 w-4" />,
    slug: "process",
    items: [
      {
        q: "What is REDMA and how does it protect presale buyers in BC?",
        a: "REDMA (Real Estate Development Marketing Act) is BC legislation that protects presale buyers. Key protections include: your deposit is held in trust (developers cannot use it for construction), you receive a 7-day rescission (cooling off) period after signing, developers must provide a Disclosure Statement with all material facts about the project, and if the project is cancelled, your deposit is returned with interest.",
      },
      {
        q: "What is the 7-day rescission period?",
        a: (
          <>
            After signing a presale purchase agreement in BC, you have 7 calendar days to change your mind and cancel the contract for any reason — no penalty. Your full deposit is returned. This cooling off period is mandated by REDMA and gives you time to review the contract with your lawyer, confirm your finances, and make sure you are comfortable with the purchase. <Link to="/blog" className="text-primary hover:underline font-medium">Read our guides for more details →</Link>
          </>
        ),
      },
      {
        q: "How long does it take for a presale condo to be built?",
        a: "Construction timelines vary by project, but most presale condos in Metro Vancouver take 2–4 years from purchase to completion. Townhomes are typically faster (18–30 months). Your purchase agreement will include an estimated completion date, though delays of 6–12 months are not uncommon. We track construction progress and keep our clients updated throughout the build.",
      },
      {
        q: "What is an assignment sale?",
        a: "An assignment sale is when you sell your presale contract to another buyer before the building is completed. Essentially, you are selling your right to purchase the unit. If the market has appreciated since you bought, you can profit from the difference. Not all developers allow assignments, and there may be fees involved (typically $5,000–$10,000 plus a percentage). We advise our clients on assignment terms before they sign the original contract.",
      },
      {
        q: "What happens at completion?",
        a: "When the building is complete, you will: (1) Receive a completion notice from the developer. (2) Do a walkthrough inspection of your unit and note any deficiencies. (3) Arrange your mortgage and finalize financing. (4) Pay the balance of the purchase price (minus your deposit) through your lawyer or notary. (5) Pay closing costs including GST (new homes are subject to 5% GST, though rebates may apply), Property Transfer Tax, and legal fees. (6) Receive your keys and move in.",
      },
    ],
  },
  {
    title: "Investment & Strategy",
    icon: <TrendingUp className="h-4 w-4" />,
    slug: "investment",
    items: [
      {
        q: "Is a presale condo a good investment?",
        a: (
          <>
            Presale condos have historically been strong investments in Metro Vancouver. Key advantages include: price appreciation during construction (you lock in today's price and benefit from 2–4 years of market growth), leverage (you control a $500K+ asset with a $25K–$100K deposit), rental income potential after completion, and the ability to sell via assignment before completion. However, like any investment, returns depend on the project, location, timing, and market conditions. We help our clients evaluate each opportunity based on data, not hype. <Link to="/calculator" className="text-primary hover:underline font-medium">Try our investment calculator →</Link>
          </>
        ),
      },
      {
        q: "Should I buy a presale condo to live in or as an investment?",
        a: "Both strategies work, and the best choice depends on your personal situation. Owner-occupiers benefit from the First-Time Home Buyer exemption on Property Transfer Tax (saving up to $13,000), the GST New Housing Rebate (saving up to $6,300 on homes under $450,000), and the ability to lock in a price below future market value. Investors benefit from rental income, assignment opportunities, and portfolio diversification. About 40% of our clients buy to live in, and 60% buy as investments.",
      },
      {
        q: "What is the difference between a presale and a resale condo?",
        a: (
          <>
            A presale is a brand new unit you buy before construction is complete. A resale is an existing unit someone else is selling. Key differences: Presales have staggered deposits (easier entry), brand new finishes and appliances, new home warranty coverage (2-5-10 year), potential for price appreciation during construction, and typically no bidding wars. Resales offer immediate move-in, you can see exactly what you are buying, and you may be able to negotiate on price. For most buyers in the Fraser Valley, presales offer better value and more financial flexibility. <Link to="/properties" className="text-primary hover:underline font-medium">Browse resale listings →</Link>
          </>
        ),
      },
      {
        q: "Can I rent out my presale condo after completion?",
        a: (
          <>
            Yes, most presale condos in Metro Vancouver allow rentals, though some strata bylaws may have rental restrictions. Before purchasing, we review the strata bylaws and rental policies so you know exactly what is allowed. In areas like <Link to="/surrey-presale-condos" className="text-primary hover:underline font-medium">Surrey</Link>, <Link to="/langley-presale-condos" className="text-primary hover:underline font-medium">Langley</Link>, and <Link to="/coquitlam-presale-condos" className="text-primary hover:underline font-medium">Coquitlam</Link>, rental demand is extremely high, and many of our investor clients generate positive cash flow from their presale units.
          </>
        ),
      },
    ],
  },
  {
    title: "Taxes & Costs",
    icon: <Receipt className="h-4 w-4" />,
    slug: "taxes",
    items: [
      {
        q: "What taxes do I pay on a presale condo in BC?",
        a: "The main taxes include: GST (5% on the purchase price — first-time buyers may qualify for a partial rebate on homes under $450,000), Property Transfer Tax (first-time buyers are exempt on purchases up to $500,000, with partial exemptions up to $835,000), and annual property taxes. New presale buyers can potentially save $30,000–$50,000+ in combined tax savings compared to buying a resale property.",
      },
      {
        q: "What are the closing costs for a presale condo?",
        a: "Typical closing costs include: GST (5% of purchase price, minus any rebate), Property Transfer Tax (varies, first-time buyers may be exempt), legal fees ($1,500–$2,500), home insurance, utility connection fees, and any applicable strata fees. We provide our clients with a detailed cost breakdown for each specific project so there are no surprises at completion.",
      },
    ],
  },
  {
    title: "About Our Team",
    icon: <Users className="h-4 w-4" />,
    slug: "about",
    items: [
      {
        q: "Why should I work with a presale specialist instead of a general realtor?",
        a: (
          <>
            Most realtors handle resale homes and dabble in presales. We do presale exclusively — it is our entire business. This means we have deep relationships with developers (which gets you VIP pricing and early access), we know how to read and negotiate presale contracts, we track every active and upcoming presale project in the Fraser Valley and Metro Vancouver, and we have helped 400+ families through the presale process specifically. Working with a generalist is like going to a family doctor for heart surgery — they might get it right, but would you take that chance with the biggest purchase of your life? <Link to="/about" className="text-primary hover:underline font-medium">Learn more about our team →</Link>
          </>
        ),
      },
      {
        q: "What areas do you cover?",
        a: (
          <>
            We cover all of Metro Vancouver and the Fraser Valley, with a particular focus on <Link to="/surrey-presale-condos" className="text-primary hover:underline font-medium">Surrey</Link>, <Link to="/langley-presale-condos" className="text-primary hover:underline font-medium">Langley</Link>, <Link to="/abbotsford-presale-condos" className="text-primary hover:underline font-medium">Abbotsford</Link>, <Link to="/coquitlam-presale-condos" className="text-primary hover:underline font-medium">Coquitlam</Link>, Delta, Burnaby, Vancouver, New Westminster, Port Moody, and Maple Ridge. We speak English, Hindi, Punjabi, Urdu, and Arabic.
          </>
        ),
      },
      {
        q: "How do I get started?",
        a: (
          <>
            Book a free 15-minute Discovery Call with Uzair. We will discuss your goals, timeline, and budget, and match you with presale opportunities that fit. There is no cost, no obligation, and no pressure. Just clarity. <Link to="/contact" className="text-primary hover:underline font-medium">Visit our contact page</Link> or call <a href="tel:6722581100" className="text-primary hover:underline font-medium">672-258-1100</a>.
          </>
        ),
      },
    ],
  },
];

/* ────────────────────────────────────────────
   Build plain-text FAQ list for JSON-LD
   ──────────────────────────────────────────── */

function getAllFAQsPlainText(): { question: string; answer: string }[] {
  const result: { question: string; answer: string }[] = [];
  for (const section of FAQ_SECTIONS) {
    for (const item of section.items) {
      const answer = typeof item.a === "string" ? item.a : extractText(item.a);
      result.push({ question: item.q, answer });
    }
  }
  return result;
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    const { children } = (node as any).props;
    return extractText(children);
  }
  return "";
}

/* ────────────────────────────────────────────
   Accordion Item
   ──────────────────────────────────────────── */

function FAQAccordionItem({
  q,
  a,
  isOpen,
  onToggle,
}: {
  q: string;
  a: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "group rounded-xl border transition-all duration-200 overflow-hidden",
        isOpen
          ? "border-primary/30 bg-primary/[0.03] shadow-sm"
          : "border-border/50 bg-card hover:border-primary/20 hover:shadow-sm"
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
        aria-expanded={isOpen}
      >
        <span
          className={cn(
            "text-[15px] sm:text-base font-medium leading-snug transition-colors duration-200",
            isOpen ? "text-primary" : "text-foreground group-hover:text-primary"
          )}
        >
          {q}
        </span>
        <span
          className={cn(
            "shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
            isOpen
              ? "bg-primary text-primary-foreground"
              : "bg-muted/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              isOpen && "rotate-180"
            )}
          />
        </span>
      </button>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-0">
            <div className="text-[15px] text-muted-foreground leading-relaxed">
              {typeof a === "string"
                ? a.split("\n\n").map((para, i) => (
                    <p key={i} className={cn(i > 0 && "mt-3")}>
                      {para}
                    </p>
                  ))
                : <p>{a}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   FAQ Page
   ──────────────────────────────────────────── */

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_SECTIONS;
    const q = searchQuery.toLowerCase();
    return FAQ_SECTIONS
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const answerText = typeof item.a === "string" ? item.a : extractText(item.a);
          return item.q.toLowerCase().includes(q) || answerText.toLowerCase().includes(q);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const allFaqs = getAllFAQsPlainText();
  const totalQuestions = allFaqs.length;
  const matchCount = filteredSections.reduce((sum, s) => sum + s.items.length, 0);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://presaleproperties.com" },
      { "@type": "ListItem", position: 2, name: "FAQ", item: "https://presaleproperties.com/faq" },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <MetaTags
        title="Presale Condo FAQ BC | Common Questions Answered"
        description="Get answers to the most common presale condo questions in BC. Deposits, timelines, assignments, buyer protections, and more — explained by specialists."
        url="https://presaleproperties.com/faq"
        type="website"
      />
      <Helmet>
        <title>Presale Condo FAQ BC | Common Questions Answered | Presale Properties</title>
        <meta
          name="description"
          content="Get answers to the most common presale condo questions in BC. Deposits, timelines, assignments, buyer protections, and more — explained by specialists."
        />
        <link rel="canonical" href="https://presaleproperties.com/faq" />
        <meta property="og:title" content="Presale Condo FAQ BC | Common Questions Answered | Presale Properties" />
        <meta property="og:description" content="Get answers to the most common presale condo questions in BC. Deposits, timelines, assignments, buyer protections, and more — explained by specialists." />
        <meta property="og:url" content="https://presaleproperties.com/faq" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <ConversionHeader />

      <main className="pt-20">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">FAQ</span>
          </nav>
        </div>

        {/* Hero + Search */}
        <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 pb-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight">
              Presale Condo FAQ
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed text-base sm:text-lg">
              {totalQuestions} answers to the questions BC buyers ask most — from deposits to closing costs. Scroll, skim, or search.
            </p>
          </div>

          <div className="mt-6 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search questions (e.g. deposit, assignment, GST)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border/60 bg-card text-foreground placeholder:text-muted-foreground/60 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground bg-muted/80 rounded-md px-2 py-1 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {isSearching && (
            <p className="mt-3 text-sm text-muted-foreground">
              {matchCount} result{matchCount !== 1 ? "s" : ""} for "{searchQuery}"
            </p>
          )}
        </section>

        {/* Two-col layout: sticky nav + content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
          <div className="grid lg:grid-cols-[220px_1fr] gap-10">
            {/* Sticky sidebar nav */}
            <aside className="hidden lg:block">
              <nav className="sticky top-24 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 px-3">
                  Categories
                </p>
                {FAQ_SECTIONS.map((section) => (
                  <a
                    key={section.slug}
                    href={`#${section.slug}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <span className="text-muted-foreground/70">{section.icon}</span>
                    <span>{section.title}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground/60 tabular-nums">
                      {section.items.length}
                    </span>
                  </a>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div>
              {filteredSections.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-2xl">
                  <p className="text-muted-foreground">No matching questions found.</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-primary hover:underline text-sm font-medium"
                  >
                    Browse all categories
                  </button>
                </div>
              ) : (
                <div className="space-y-14">
                  {filteredSections.map((section) => (
                    <section key={section.slug} id={section.slug} className="scroll-mt-24">
                      <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-border/60">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                          {section.icon}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                          {section.title}
                        </h2>
                      </div>

                      <div className="divide-y divide-border/50">
                        {section.items.map((item, iIdx) => (
                          <article key={iIdx} className="py-6 first:pt-0">
                            <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug mb-2">
                              {item.q}
                            </h3>
                            <div className="text-[15px] text-muted-foreground leading-relaxed">
                              {typeof item.a === "string" ? (
                                item.a.split("\n\n").map((para, i) => (
                                  <p key={i} className={cn(i > 0 && "mt-3")}>{para}</p>
                                ))
                              ) : (
                                <p>{item.a}</p>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <section className="bg-muted/30 border-t border-border/40">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-14 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Still have questions?
            </h2>
            <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
              Book a free Discovery Call with Uzair — no cost, no obligation.
            </p>
            <Link to="/contact">
              <Button size="lg" className="mt-5 gap-2">
                Book a Free Discovery Call
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
