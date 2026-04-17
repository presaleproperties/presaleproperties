import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { SellAssignmentForm } from "@/components/assignments/SellAssignmentForm";
import { useAppSetting } from "@/hooks/useAppSetting";
import { Link } from "react-router-dom";
import { MessageCircle, Sparkles, ListChecks, DollarSign, Receipt, HelpCircle, FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS: { title: string; body: string }[] = [
  { title: "Free valuation call", body: "15 minutes. We pull comps, check the current developer price list, and tell you what your contract is worth in today's market." },
  { title: "Review your contract", body: "We check the assignment clause, the developer's assignment fee, and any marketing restrictions." },
  { title: "Get developer consent", body: "Most developers require written consent before you can assign. We handle the submission and paperwork." },
  { title: "Marketing strategy", body: "Depending on the developer's rules, we list on MLS, market privately through our buyer network, or run a direct-to-buyer campaign." },
  { title: "Negotiate the offer", body: "We represent you, not the buyer. We get the highest price the market will pay." },
  { title: "Assignment paperwork", body: "Assignment Contract of Purchase and Sale, deposit transfer, developer sign-off, lawyer engagement." },
  { title: "Close and get paid", body: "Your uplift (plus original deposit back) flows through your lawyer on the assignment closing date — usually 30–60 days after acceptance." },
];

type FaqAnswer = string | string[];

interface FaqGroup {
  slug: string;
  title: string;
  icon: React.ReactNode;
  items: { q: string; a: FaqAnswer }[];
}

const FAQ_GROUPS: FaqGroup[] = [
  {
    slug: "basics",
    title: "Assignment basics",
    icon: <FileText className="h-4 w-4" />,
    items: [
      { q: "What is a presale assignment sale?", a: "An assignment is when you — the original buyer — transfer your rights and obligations under a pre-construction purchase contract to a new buyer before the building completes. You're not selling the condo (it doesn't exist yet). You're selling your contract." },
      { q: "Can I sell my presale before it completes?", a: "Yes, in most cases — as long as your contract's assignment clause allows it and the developer consents. A small number of developers prohibit assignments entirely. We'll check your contract for free." },
      { q: "Do I need the developer's permission to assign?", a: "Almost always, yes. BC developers require written consent. Some refuse assignments until a certain percentage of the building is sold. Some allow only one assignment per unit. Some restrict marketing (no MLS, no public listing). We know each developer's policy." },
      { q: "Can I assign a presale townhouse or detached — or just condos?", a: "All three. The rules are the same — it comes down to what the contract allows and what the developer consents to." },
    ],
  },
  {
    slug: "pricing",
    title: "Pricing & marketing",
    icon: <DollarSign className="h-4 w-4" />,
    items: [
      { q: "How much can I sell my assignment for?", a: "Three numbers matter: (1) your original contract price, (2) current developer price for the same floor plan, (3) recent comparable resale or assignment comps. Your assignment price is usually somewhere between the original price and the current developer price — discounted slightly because the buyer is taking on your contract \"as-is.\"" },
      { q: "Can I list my assignment on MLS / Realtor.ca?", a: "Depends on the developer. In Vancouver and inner suburbs, most developers prohibit MLS listings for assignments. In the Fraser Valley (Surrey, Langley, Abbotsford, Coquitlam), many developers allow MLS. We'll confirm before we market." },
      { q: "How long does it take to sell?", a: "Expect 2–4 months from listing to accepted offer, depending on price, market conditions, and the developer's marketing restrictions. Closing happens 30–60 days after offer acceptance." },
      { q: "What if the market has dropped since I bought?", a: "You have three options: (1) sell at a loss and cut losses, (2) hold through completion and rent it out, (3) complete and flip as a resale. We'll model the numbers for each scenario on your free call." },
      { q: "What is an assignment fee and who pays it?", a: "The developer charges an assignment fee for processing the paperwork. It can range from a few hundred dollars to as much as 1–5% of the original purchase price. The assignor (seller) typically pays it, though it's negotiable." },
    ],
  },
  {
    slug: "taxes",
    title: "Taxes & money",
    icon: <Receipt className="h-4 w-4" />,
    items: [
      { q: "What are the tax implications of selling an assignment?", a: [
        "GST: As of May 2022, CRA applies 5% GST on all assignment sales of new residential properties — even if the assignor isn't a \"builder.\" GST is calculated on the assignment amount (your profit, essentially), not the full contract price. The buyer usually pays it, but it's negotiable.",
        "Income tax vs. capital gains: CRA generally treats assignment profit as business income (100% taxable), not a capital gain (50% taxable) — unless you can prove you intended to live in the unit. This is the single biggest tax surprise for most sellers.",
        "Anti-flipping rule: If you held the contract less than 12 months from assignment closing, CRA treats it as business income automatically, with no principal residence exemption.",
        "We are not accountants. We strongly recommend a CPA who specializes in BC real estate before you accept an offer.",
      ]},
      { q: "Who pays the GST — me or the buyer?", a: "Negotiable. In most assignment contracts we draft, the buyer pays the GST on the assignment amount. But it's a deal point." },
      { q: "Do I need to report the sale to CRA?", a: "Yes. Assignors must file an election and report the sale on their tax return. Failure to report can result in significant penalties. Your accountant handles this." },
      { q: "What happens to my deposit when the assignment closes?", a: "On assignment completion, the new buyer pays your lawyer: (a) your original deposit back, and (b) the uplift (the extra amount over what you paid). Your lawyer then pays the developer's assignment fee and taxes, and releases the balance to you." },
      { q: "What's the difference between \"deposit back\" and \"uplift\"?", a: "Deposit back = the deposits you've already paid the developer (usually 15–20% of the contract price). Uplift = the profit you negotiate on top, because the market moved up or the building is closer to completion. Combined, the buyer pays you \"deposit back + uplift\" on closing." },
    ],
  },
  {
    slug: "paperwork",
    title: "Paperwork & process",
    icon: <ListChecks className="h-4 w-4" />,
    items: [
      { q: "What documents do I need?", a: [
        "Original Contract of Purchase and Sale with the developer.",
        "Disclosure Statement and any amendments.",
        "Proof of deposits paid.",
        "Assignment Contract of Purchase and Sale (we draft this).",
        "Developer's assignment consent form (we submit this).",
        "Tax info for CRA reporting.",
      ]},
      { q: "Do I need a realtor to sell an assignment?", a: "Legally, no. Practically, yes. Assignment sales have unique paperwork, developer-specific rules, and marketing restrictions that general realtors don't understand. We do nothing but presales." },
      { q: "Why work with The Presale Properties Group specifically?", a: "We only do presales — no resales, no detached, no noise. We know every active developer in the Fraser Valley. We represent buyers exclusively, which means when we list your assignment, we have 200+ active buyers in our database looking right now. 400+ clients served. Only 2 defaults. Uzair is the direct point of contact." },
    ],
  },
];

const NAV_SECTIONS = [
  { slug: "overview", title: "Overview", icon: <Sparkles className="h-4 w-4" /> },
  { slug: "process", title: "The 7-step process", icon: <ListChecks className="h-4 w-4" /> },
  ...FAQ_GROUPS.map((g) => ({ slug: g.slug, title: g.title, icon: g.icon })),
  { slug: "get-valuation", title: "Get your valuation", icon: <HelpCircle className="h-4 w-4" /> },
];

function flattenFaqs() {
  return FAQ_GROUPS.flatMap((g) =>
    g.items.map((it) => ({
      question: it.q,
      answer: Array.isArray(it.a) ? it.a.join(" ") : it.a,
    }))
  );
}

export default function SellYourAssignment() {
  const { data: whatsappSetting } = useAppSetting("whatsapp_number");
  const whatsappNumber = whatsappSetting ? String(whatsappSetting).replace(/"/g, "") : "16722581100";
  const phoneDisplay = "(672) 258-1100";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi Uzair — I'd like to sell my presale assignment.")}`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: flattenFaqs().map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://presaleproperties.com" },
      { "@type": "ListItem", position: 2, name: "Assignments", item: "https://presaleproperties.com/assignments" },
      { "@type": "ListItem", position: 3, name: "Sell Your Assignment", item: "https://presaleproperties.com/assignments/sell-your-assignment" },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Sell My Presale Assignment in BC | The Presale Properties Group</title>
        <meta name="description" content="Selling a presale condo or townhouse assignment in Metro Vancouver or the Fraser Valley? Get a free valuation, marketing plan, and full representation from Uzair Muhammad. 400+ clients served, only 2 defaults." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href="https://presaleproperties.com/assignments/sell-your-assignment" />
        <meta property="og:title" content="Sell My Presale Assignment in BC | The Presale Properties Group" />
        <meta property="og:description" content="Free valuation. Full representation. 400+ presale clients. Only 2 defaults." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://presaleproperties.com/assignments/sell-your-assignment" />
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
            <Link to="/assignments" className="hover:text-foreground transition-colors">Assignments</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">Sell Your Assignment</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 pb-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-3">Sell Your Assignment</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight">
              Sell your presale assignment with a specialist who only does presales.
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed text-base sm:text-lg">
              Get market value, qualified buyers, and a clean closing — without losing your deposit or your sanity.
              400+ presale clients served. Only 2 defaults. Buyer-first always.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <a href="#get-valuation">Get my free valuation</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> Message Uzair
                </a>
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              {[
                { value: "400+", label: "Clients served" },
                { value: "2", label: "Defaults — ever" },
                { value: "24h", label: "Response time" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Two-col: sticky sidebar + expanded content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
          <div className="grid lg:grid-cols-[240px_1fr] gap-10">
            {/* Sticky sidebar nav */}
            <aside className="hidden lg:block">
              <nav className="sticky top-24 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 px-3">
                  On this page
                </p>
                {NAV_SECTIONS.map((s) => (
                  <a
                    key={s.slug}
                    href={`#${s.slug}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <span className="text-muted-foreground/70">{s.icon}</span>
                    <span>{s.title}</span>
                  </a>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div className="min-w-0 space-y-16">
              {/* Overview */}
              <section id="overview" className="scroll-mt-24">
                <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-border/60">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    Overview
                  </h2>
                </div>
                <div className="space-y-4 text-[15px] sm:text-base text-muted-foreground leading-relaxed">
                  <p>
                    Life changes. Maybe you bought a presale 3 years ago and your situation has shifted.
                    Maybe you want to free up capital for a bigger opportunity. Maybe the project is
                    12 months from completion and you'd rather take the uplift now.
                  </p>
                  <p>
                    Whatever the reason, selling a presale assignment in BC is{" "}
                    <strong className="text-foreground font-semibold">not</strong> the same as selling a resale condo.
                    The rules are specific, the tax treatment is different, and most general realtors don't specialize in this.
                    We do — we've closed hundreds of presale contracts and we know every developer's assignment policy
                    in the Fraser Valley inside out.
                  </p>
                </div>
              </section>

              {/* Process */}
              <section id="process" className="scroll-mt-24">
                <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-border/60">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                    <ListChecks className="h-4 w-4" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    The 7-step process
                  </h2>
                </div>
                <ol className="space-y-3">
                  {STEPS.map((step, i) => (
                    <li
                      key={i}
                      className="flex gap-4 rounded-xl border border-border/60 bg-card p-4 sm:p-5 hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <div className="shrink-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 leading-snug">{step.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {/* FAQ groups — fully expanded */}
              {FAQ_GROUPS.map((group) => (
                <section key={group.slug} id={group.slug} className="scroll-mt-24">
                  <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-border/60">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                      {group.icon}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                      {group.title}
                    </h2>
                  </div>

                  <div className="divide-y divide-border/50">
                    {group.items.map((item, iIdx) => (
                      <article key={iIdx} className="py-6 first:pt-0">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug mb-2">
                          {item.q}
                        </h3>
                        <div className="text-[15px] text-muted-foreground leading-relaxed">
                          {Array.isArray(item.a) ? (
                            <ul className="space-y-2">
                              {item.a.map((para, idx) => (
                                <li key={idx} className="flex gap-2.5">
                                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                                  <span>{para}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>{item.a}</p>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}

              {/* Form */}
              <section
                id="get-valuation"
                className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm"
              >
                <div className="mb-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-2">Free Valuation</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
                    Get your free valuation
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Fill this out and Uzair will personally call you within 24 hours with a valuation
                    and game plan. No cost, no obligation.
                  </p>
                </div>
                <SellAssignmentForm />
              </section>
            </div>
          </div>
        </div>

        {/* Final WhatsApp strip */}
        <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground to-foreground/95 text-background py-12 sm:py-14">
          <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/15 blur-[100px]" />
          <div className="container relative px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="max-w-xl">
              <h3 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Not ready to fill a form?</h3>
              <p className="text-background/70 text-sm sm:text-base">
                Text Uzair directly:{" "}
                <a
                  href={`tel:+1${whatsappNumber.replace(/\D/g, "").slice(-10)}`}
                  className="font-semibold text-background underline-offset-4 hover:underline"
                >
                  {phoneDisplay}
                </a>
              </p>
            </div>
            <Button asChild size="lg" className="font-semibold gap-2 w-full sm:w-auto shadow-lg shadow-primary/20">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Message on WhatsApp
              </a>
            </Button>
          </div>
        </section>

        {/* Cross-link */}
        <section className="bg-background py-10 sm:py-12 border-t border-border">
          <div className="container px-4 text-center text-sm sm:text-base text-muted-foreground">
            Buying instead?{" "}
            <Link
              to="/assignments/buying-an-assignment"
              className="text-primary font-semibold hover:underline underline-offset-4 inline-flex items-center gap-1"
            >
              Read our guide to buying an assignment <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
