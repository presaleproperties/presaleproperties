import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { AssignmentFaqHero } from "@/components/assignments/AssignmentFaqHero";
import { AssignmentFaqAccordion, FaqItem } from "@/components/assignments/AssignmentFaqAccordion";
import { Link } from "react-router-dom";
import { TrendingDown, Calendar, Wallet, ArrowRight } from "lucide-react";

const BENEFITS = [
  { icon: TrendingDown, title: "Pay less than today’s developer price", body: "Assignments are typically discounted 3–10% vs. current developer pricing for the same floor plan." },
  { icon: Calendar, title: "Move in sooner", body: "Building is further along — often 6 to 18 months from completion instead of 3 to 4 years out." },
  { icon: Wallet, title: "Original buyer paid the early deposits", body: "You take over the contract at whatever stage it’s in — sometimes with 15–20% already paid, sometimes more." },
];

const FAQS: FaqItem[] = [
  { q: "What is a presale assignment?", a: "When the original buyer of a pre-construction home transfers their purchase contract to a new buyer before the building completes. You step into their shoes, take over the contract, and close with the developer when the building is built." },
  { q: "Are assignments cheaper than buying new from the developer?", a: "Usually yes — assuming the market has been flat or declining since the original purchase. If the market has gone up, the assignment price may be below the current developer price but above the original contract price. The gap between \"original price\" and \"current developer price\" is where both sides find room to make a deal." },
  { q: "What are the main benefits of buying an assignment?", a: [
    "Lower price than current developer pricing.",
    "Building is further along (less construction risk).",
    "Faster move-in timeline.",
    "Often better floor plans or views that already sold out in new inventory.",
    "2-5-10 home warranty still applies (it's assigned to you).",
  ]},
  { q: "What are the risks of buying an assignment?", a: [
    "You take the contract \"as-is\" — including any clauses the original buyer signed.",
    "If the building gets delayed, you're bound by the original completion date rules.",
    "GST on the assignment amount is usually the buyer's responsibility.",
    "You need to requalify for a mortgage based on current rates, which may be higher than when the original buyer bought.",
  ]},
  { q: "Do I get the GST rebate as an assignee?", a: "Yes, if you intend to live in the unit as your primary residence, you qualify for the BC New Housing Rebate (partial GST rebate) the same as any first buyer would. If you're an investor, you can still claim the New Residential Rental Property Rebate after closing if you rent it out for at least 12 months." },
  { q: "How much deposit do I need?", a: "Two layers: (1) The original deposits already paid to the developer (usually 15–20% of contract price) — you reimburse the seller for these at assignment closing. (2) Any remaining deposits required by the developer before completion. So your cash-out-of-pocket at assignment = original deposits paid + any uplift to the seller + GST + closing costs. A mortgage typically covers the balance at final completion." },
  { q: "What's the difference between assignment price and original contract price?", a: [
    "Original contract price = what the first buyer agreed to pay the developer.",
    "Assignment price = what you pay the first buyer for their contract.",
    "The assignment price = original contract price + the seller's uplift (their profit).",
    "On the developer's closing date, you pay the remaining balance of the original contract price directly to the developer.",
  ]},
  { q: "Can I get a mortgage pre-approval before buying an assignment?", a: "Yes — and you should. Lenders approve assignments but often require stronger credit profiles, larger down payments (usually 20%+), and proof of income. Your mortgage will be based on the assignment price, not the original contract price. Most major banks lend on assignments; some smaller lenders won't." },
  { q: "Do I pay Property Transfer Tax (PTT)?", a: "Yes. PTT is paid by the assignee (you) on the developer's completion date, calculated on the full purchase price. First-time buyers may qualify for partial PTT exemption if the property is under the threshold." },
  { q: "Is the 2-5-10 home warranty still valid when I buy an assignment?", a: "Yes. The warranty is tied to the property, not the buyer. It transfers with the assignment and gives you the same coverage any first buyer would get: 2 years materials & labour, 5 years building envelope, 10 years structural." },
  { q: "What documents should I review before buying an assignment?", a: [
    "Original Contract of Purchase and Sale (the developer's contract).",
    "Disclosure Statement and all amendments.",
    "Floor plan and unit specifications.",
    "Proof of deposits paid by the original buyer.",
    "Developer's assignment consent.",
    "Assignment Contract of Purchase and Sale.",
    "Any strata documents available (if the disclosure statement has been amended to include them).",
  ]},
  { q: "Can I back out if I don't like what I see later?", a: "Depending on how the assignment is structured, you may have a rescission period (similar to a new presale — typically 7 days). Ask for this to be written in. Once the rescission period ends, your deposit is at risk." },
  { q: "What are the closing costs on an assignment?", a: [
    "Property Transfer Tax (on final completion, not assignment).",
    "GST (5% on the full price; buyer usually gets rebate portion back if eligible).",
    "Legal fees: typically $1,500–$2,500.",
    "Mortgage costs, title insurance, adjustments.",
    "Strata move-in fees (at completion).",
  ]},
  { q: "Can I buy an assignment as a first-time buyer?", a: "Yes. You still qualify for First-Time Home Buyer PTT exemption (or partial exemption, depending on price) and the GST New Housing Rebate — same as buying new from the developer. No penalties for buying an assignment as your first home." },
  { q: "What's the step-by-step buying process?", a: [
    "Get mortgage pre-approval for assignments specifically (not all lenders do them).",
    "Define your criteria (project, floor plan, budget, timeline).",
    "We search our off-market assignment inventory + any MLS-listed assignments.",
    "Shortlist and review the contract, disclosure, and deposit ledger.",
    "Negotiate price and assignment terms.",
    "Execute the Assignment Contract of Purchase and Sale.",
    "Submit to developer for consent (we manage this).",
    "Pay deposits + uplift to seller via your lawyer.",
    "Wait for completion — move in when the building is done.",
    "Pay balance to developer at final closing.",
  ]},
];

export default function BuyingAnAssignment() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Buying a Presale Assignment in BC | The Presale Properties Group</title>
        <meta name="description" content="Thinking about buying a presale assignment in Metro Vancouver or the Fraser Valley? Learn how assignment sales work, what to watch out for, and why they can be the smartest way to buy new construction." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href="https://presaleproperties.com/assignments/buying-an-assignment" />
        <meta property="og:title" content="Buying a Presale Assignment in BC | The Presale Properties Group" />
        <meta property="og:description" content="Skip the developer’s waitlist. Pay less than new. Move in sooner." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://presaleproperties.com/assignments/buying-an-assignment" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://presaleproperties.com" },
            { "@type": "ListItem", position: 2, name: "Assignments", item: "https://presaleproperties.com/assignments" },
            { "@type": "ListItem", position: 3, name: "Buying an Assignment", item: "https://presaleproperties.com/assignments/buying-an-assignment" },
          ],
        })}</script>
      </Helmet>

      <ConversionHeader />

      <main>
        <AssignmentFaqHero
          eyebrow="Buying an Assignment"
          title="Buying a Presale Assignment"
          subhead="Skip the developer’s waitlist. Pay less than new. Move in sooner."
          credibility="Assignments are one of the smartest ways to buy new construction in BC — if you know what you’re looking at."
          primaryCta={{ label: "See Available Assignments", href: "/assignments" }}
          secondaryCta={{ label: "Talk to Uzair", href: "/contact" }}
        />

        {/* Intro */}
        <section className="bg-background py-16 lg:py-20">
          <div className="container px-4 max-w-3xl space-y-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            <p>
              The developer’s price list goes up every quarter. Brand-new units sell in VIP rounds before
              the public ever sees them. And by the time a building is 12 months from completion, the
              original price is long gone.
            </p>
            <p>
              An assignment lets you buy that same unit — same floor plan, same view, same finish — from the
              original buyer instead of the developer. Usually at a discount to the current developer price,
              sometimes with the deposit already 75% paid. The building is further along. The uncertainty is
              lower. And you can move in months earlier than if you bought a new presale today.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-muted/30 border-y border-border py-16 lg:py-24">
          <div className="container px-4">
            <div className="max-w-3xl mb-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-3">Why Buy</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                Why buy an assignment?
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {BENEFITS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-border bg-card p-6 sm:p-7">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 leading-tight">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <AssignmentFaqAccordion
          title="Frequently Asked Questions — Buying"
          subtitle="The honest answers buyers ask before signing."
          faqs={FAQS}
        />

        {/* CTA strip */}
        <section className="bg-foreground text-background py-16 lg:py-20">
          <div className="container px-4 max-w-3xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              See our current assignment inventory
            </h2>
            <p className="text-background/70 mb-8 text-base sm:text-lg leading-relaxed">
              3 active assignments right now — all pre-vetted, priced below current developer pricing.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="font-semibold gap-2">
                <Link to="/assignments">View Available Assignments <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-background/30 text-background hover:bg-background hover:text-foreground font-semibold">
                <Link to="/contact">Book a call with Uzair</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Cross-link */}
        <section className="bg-background py-10 border-t border-border">
          <div className="container px-4 text-center text-sm text-muted-foreground">
            Selling instead?{" "}
            <Link to="/assignments/sell-your-assignment" className="text-primary font-semibold hover:underline">
              Read our guide to selling your assignment →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
