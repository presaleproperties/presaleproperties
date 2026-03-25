import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import {
  Download,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Home,
  Shield,
  ArrowRight,
  Star,
  FileText,
} from "lucide-react";

// ─── Checklist data ────────────────────────────────────────────────────────────
const CONDO_SECTIONS = [
  {
    title: "Entry & Hallway",
    icon: "🚪",
    items: [
      "Front door opens/closes/locks smoothly",
      "Door frame aligned — no gaps or warping",
      "Flooring transitions flush at threshold",
      "Light switch and overhead fixture functional",
    ],
  },
  {
    title: "Kitchen",
    icon: "🍳",
    items: [
      "All appliances present and matching contract spec",
      "Fridge cools, no unusual noise",
      "Oven, range, and all burners ignite",
      "Dishwasher runs a short cycle without leaking",
      "Microwave and hood fan operational",
      "All cabinet doors and drawers soft-close properly",
      "Countertop edges chip-free, no pitting",
      "Backsplash caulking clean and continuous",
      "Sink drains fully, faucet pressure adequate",
      "Under-sink area dry — no water stains",
    ],
  },
  {
    title: "Living & Dining Area",
    icon: "🛋️",
    items: [
      "Flooring scratch/dent/gap-free throughout",
      "No squeaks or soft spots underfoot",
      "Walls even paint, no nail pops or cracks",
      "All outlets live (test with charger)",
      "All light switches and dimmers work",
      "Balcony door glides smoothly, locks securely",
    ],
  },
  {
    title: "Bedrooms",
    icon: "🛏️",
    items: [
      "Door latches without sticking",
      "Closet door(s) align and track properly",
      "Flooring defect-free",
      "Windows open/close/lock; screen intact",
      "No scratches on glass panes",
      "Electrical outlets live in all locations",
    ],
  },
  {
    title: "Bathrooms",
    icon: "🚿",
    items: [
      "Toilet doesn't rock; flushes cleanly",
      "Shower/tub water pressure and temperature good",
      "Grout lines complete — no gaps or crumbling",
      "Caulking around tub/shower sealed",
      "No chips in porcelain or ceramic tile",
      "Vanity mirror and light fixture secure",
      "Exhaust fan operational",
      "Cabinet doors and drawers aligned",
    ],
  },
  {
    title: "Walls, Ceilings & Paint",
    icon: "🎨",
    items: [
      "Check at multiple angles (lights on & off)",
      "No uneven sheen or roller marks",
      "No settling cracks above door frames",
      "Baseboards and trim fully painted and caulked",
      "Crown moulding mitre joints tight",
    ],
  },
  {
    title: "Windows & Balcony",
    icon: "🪟",
    items: [
      "All glazing scratch-free",
      "Window locking mechanisms work",
      "Balcony surface free of major cracks",
      "Balcony railing secure — no wobble",
      "Sliding door weather-strip intact",
    ],
  },
  {
    title: "Mechanical & Building Systems",
    icon: "⚙️",
    items: [
      "HVAC / fan coil set to cooling and heating — both respond",
      "Thermostat and controls explained by developer rep",
      "Ventilation system running",
      "Smoke and CO detectors present and functional",
      "Sprinkler heads undamaged",
      "Suite electrical panel labelled correctly",
    ],
  },
];

const TOWNHOME_SECTIONS = [
  {
    title: "Exterior & Curb",
    icon: "🏡",
    items: [
      "Walk full perimeter — check cladding for damage",
      "No missing caulking around exterior windows",
      "Paint even, no drips or missed areas",
      "Driveway/walkway concrete free of major cracks",
      "Exterior lights operational",
    ],
  },
  {
    title: "Garage",
    icon: "🚗",
    items: [
      "Garage door opens/closes with wall button and remote",
      "No excessive grinding or shaking",
      "Garage floor — major cracks are a deficiency (hairlines are normal)",
      "EV charger rough-in installed (if purchased as upgrade)",
      "Garage interior walls painted and finished",
      "Man door to home opens/locks properly",
    ],
  },
  {
    title: "Mechanical Room",
    icon: "🔧",
    items: [
      "Hot water tank — no leaks at base or connections",
      "Furnace / heat pump — no leaks; operation explained",
      "HRV/ERV unit present and running",
      "Pressure relief valve accessible",
    ],
  },
  {
    title: "Main Floor: Kitchen & Living",
    icon: "🍳",
    items: [
      "All appliances present and matching contract spec",
      "Fridge, oven, dishwasher, microwave all functional",
      "All burners ignite; hood fan works",
      "Cabinet doors and drawers soft-close",
      "Countertop edges chip-free",
      "Backsplash caulking complete",
      "Laminate/hardwood — no scratches, gaps, or squeaks",
      "All outlets live; all switches functional",
      "Patio/backyard door locks and glides smoothly",
    ],
  },
  {
    title: "Upper Floor: Bedrooms & Bathrooms",
    icon: "🛏️",
    items: [
      "Every bedroom door latches without sticking",
      "Windows open/close/lock; screens intact",
      "All bathrooms: toilet firm, flush functional",
      "Shower pressure and temperature adequate",
      "Grout and caulking sealed with no gaps",
      "No chips in porcelain, no scratches on shower glass",
      "Carpet seams tight at baseboards and transitions",
    ],
  },
  {
    title: "Stairs & Common Areas",
    icon: "🪜",
    items: [
      "Step on every tread — listen for loud squeaks or soft boards",
      "Handrail securely fastened at both ends",
      "Baluster spacing compliant (no gaps > 4 inches)",
      "Stair nosing flush and secure",
    ],
  },
  {
    title: "Throughout: Walls, Paint & Trim",
    icon: "🎨",
    items: [
      "Look at walls at multiple angles with lights on and off",
      "No uneven paint, roller marks, or drips",
      "Settling cracks above door frames noted",
      "Baseboards and door casings fully painted",
      "Crown moulding joints tight",
    ],
  },
  {
    title: "Electrical & Life Safety",
    icon: "⚡",
    items: [
      "Every outlet tested with phone charger",
      "Every light switch and dimmer functional",
      "Smoke detectors present on each level",
      "CO detector installed near sleeping areas",
      "Panel labels match actual circuits",
    ],
  },
];

const WARRANTY_ROWS = [
  {
    period: "12 Months",
    covers: "Materials & labour (individual unit) — workmanship defects: drywall cracks, nail pops, paint, flooring, cabinetry, tile",
    note: null,
  },
  {
    period: "15 Months",
    covers: "Materials & labour for strata common property — lobby, corridors, amenities, parkade, common mechanical rooms",
    note: "Strata / Condo only",
  },
  {
    period: "24 Months",
    covers: "Major systems — electrical, plumbing, heating & cooling, ventilation, exterior cladding, exterior doors & windows",
    note: null,
  },
  {
    period: "5 Years",
    covers: "Building envelope — water penetration through roof, exterior walls, windows, doors, and foundation",
    note: null,
  },
  {
    period: "10 Years",
    covers: "Structural defects — foundation, load-bearing walls, beams, columns, floor and roof framing",
    note: null,
  },
];

const TOOLS = [
  { icon: "📋", label: "Contract & Upgrade List", desc: "Verify colours, finishes, and every paid upgrade were delivered" },
  { icon: "🔵", label: "Blue Painter's Tape", desc: "Mark scratches and deficiencies directly on surfaces" },
  { icon: "🔌", label: "Phone Charger / Outlet Tester", desc: "Verify every electrical outlet is live" },
  { icon: "🔦", label: "Flashlight", desc: "Inspect under sinks, inside cabinets, and dark corners" },
  { icon: "📏", label: "Level or Marble", desc: "Test that countertops and floors are perfectly flat" },
  { icon: "📱", label: "Your Phone (Charged)", desc: "Photo and video document every deficiency you find" },
];

const FAQS = [
  {
    q: "Can I bring someone with me to the walkthrough?",
    a: "Yes — and you should. Bring your agent or a trusted friend to take notes and photos while you focus on inspecting. Two sets of eyes catch far more than one.",
  },
  {
    q: "What if the developer's rep dismisses my deficiency?",
    a: "Write it down anyway. Sign the deficiency list only after all items are recorded. If something is listed, the developer is legally obligated to address it under BC's Homeowner Protection Act. Never skip adding an item because the rep says it's 'minor'.",
  },
  {
    q: "How long does the walkthrough take?",
    a: "Allow 2–3 hours for a condo and 3–4 hours for a townhome. Do not rush. This is likely the largest purchase of your life.",
  },
  {
    q: "What happens after I submit my deficiency list?",
    a: "The developer must repair agreed-upon deficiencies before or shortly after possession. Get all repair timelines in writing, and do a follow-up visit before you officially close to confirm they were completed.",
  },
  {
    q: "Are cosmetic deficiencies covered under BC Home Warranty?",
    a: "Cosmetic defects (scratches, dents, paint issues) must be caught at the PDI walkthrough — before possession. The 12-month materials and labour warranty covers workmanship defects that emerge after possession (like settling cracks), not cosmetic damage you failed to note at PDI.",
  },
  {
    q: "What if I find deficiencies after moving in?",
    a: "Document them immediately with photos and timestamps and submit a written warranty claim to your warranty provider. Under BC's 2-5-10 Home Warranty, you have 12 months from possession for materials and labour defects (individual unit), 15 months for strata common property defects, and 24 months for major system defects like plumbing or HVAC.",
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────
function DownloadCTA({ variant = "primary" }: { variant?: "primary" | "secondary" }) {
  if (variant === "secondary") {
    return (
      <a
        href="/downloads/PresaleProperties_Deficiency_Checklist.pdf"
        download
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-primary text-primary font-semibold text-sm hover:bg-primary/10 transition-colors"
      >
        <Download className="h-4 w-4" />
        Download Free Checklist
      </a>
    );
  }
  return (
    <a
      href="/downloads/PresaleProperties_Deficiency_Checklist.pdf"
      download
      className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-lg hover:bg-primary/90 transition-all hover:shadow-xl hover:-translate-y-0.5"
    >
      <Download className="h-5 w-5" />
      Download Free Deficiency Checklist (PDF)
    </a>
  );
}

function ChecklistSection({ sections }: { sections: typeof CONDO_SECTIONS }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {sections.map((section, i) => (
        <div key={i} className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-muted/50 transition-colors text-left"
          >
            <span className="flex items-center gap-3 font-semibold text-foreground">
              <span className="text-xl">{section.icon}</span>
              {section.title}
              <Badge variant="secondary" className="ml-1 text-xs">{section.items.length} items</Badge>
            </span>
            {open === i ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
          </button>
          {open === i && (
            <div className="px-5 pb-4 pt-2 bg-card border-t border-border">
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-foreground/80">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-muted/50 transition-colors text-left gap-4"
      >
        <span className="font-medium text-foreground">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 pt-2 bg-card border-t border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function DeficiencyWalkthroughGuide() {
  return (
    <>
      <Helmet>
        <title>Presale Deficiency Walkthrough Guide BC | Free PDI Checklist</title>
        <meta name="description" content="Complete presale deficiency walkthrough guide for BC condos and townhomes. Free downloadable PDI checklist covering every room plus BC Home Warranty timelines." />
        <link rel="canonical" href="https://presaleproperties.com/deficiency-walkthrough-guide" />
      </Helmet>

      <ConversionHeader />

      <main>
        {/* ── Hero ── */}
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/blog-images/blog-townhome-walkthrough-hero.jpg')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-slate-900/80" />
          <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 text-xs font-semibold tracking-wide uppercase">
              Free BC Buyer Resource
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              The Complete Presale<br className="hidden md:block" />
              <span className="text-primary"> Deficiency Walkthrough</span><br className="hidden md:block" />
              Guide for BC Buyers
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              Your brand-new home is almost ready. Before you sign for it, use this level-by-level PDI guide to catch every deficiency — for both condos and townhomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <DownloadCTA />
              <a href="#guide" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-medium">
                Read the full guide <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-slate-400">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400" /> Covers condos & townhomes</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400" /> BC Home Warranty reference</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400" /> Free printable checklist</span>
            </div>
          </div>
        </section>

        {/* ── Why it matters ── */}
        <section className="bg-amber-50 dark:bg-amber-950/20 border-y border-amber-200 dark:border-amber-800/40 py-10">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">Why the walkthrough is your most important appointment</p>
                <p className="text-amber-800 dark:text-amber-300 text-sm leading-relaxed">
                  In BC, developers must repair defects you identify <strong>before possession</strong>. Cosmetic damage found <em>after</em> you move in can be blamed on your move. A thorough PDI is the only way to protect your investment — and your deposit.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats strip ── */}
        <section className="bg-card border-b border-border py-10">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { val: "100+", label: "Items in checklist" },
              { val: "10 yrs", label: "Max BC warranty coverage" },
              { val: "3–4 hrs", label: "Allow for townhome PDI" },
              { val: "Free", label: "Printable checklist PDF" },
            ].map((s) => (
              <div key={s.val}>
                <div className="text-3xl font-bold text-primary">{s.val}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tools ── */}
        <section className="py-16 bg-background" id="guide">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-2">What to Bring</h2>
            <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">Treat your walkthrough like a professional inspection. Come prepared with these six essentials.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TOOLS.map((t) => (
                <div key={t.label} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
                  <span className="text-2xl flex-shrink-0">{t.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Checklist Tabs ── */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Room-by-Room Inspection Guide</h2>
                <p className="text-muted-foreground">Select your property type below — click each section to expand the checklist.</p>
              </div>
              <DownloadCTA variant="secondary" />
            </div>

            <Tabs defaultValue="condo" className="w-full">
              <TabsList className="grid grid-cols-2 w-full max-w-sm mb-6">
                <TabsTrigger value="condo" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Condo
                </TabsTrigger>
                <TabsTrigger value="townhome" className="flex items-center gap-2">
                  <Home className="h-4 w-4" /> Townhome
                </TabsTrigger>
              </TabsList>

              <TabsContent value="condo">
                <div className="mb-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 flex gap-3">
                  <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Condo PDI focus:</strong> Pay extra attention to mechanical systems (fan coils, ventilation) and balcony / window seals — these are the most common condo deficiencies in BC new builds.
                  </p>
                </div>
                <ChecklistSection sections={CONDO_SECTIONS} />
              </TabsContent>

              <TabsContent value="townhome">
                <div className="mb-4 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 flex gap-3">
                  <Home className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800 dark:text-green-300">
                    <strong>Townhome PDI focus:</strong> A townhome has a garage, exterior, and private mechanical room — all additional points of failure compared to a condo. Start outside and work level by level.
                  </p>
                </div>
                <ChecklistSection sections={TOWNHOME_SECTIONS} />
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* ── BC Home Warranty ── */}
        <section className="py-16 bg-background">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-start gap-4 mb-8">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">BC Home Warranty Coverage</h2>
                <p className="text-muted-foreground">All new construction in BC is covered by mandatory Home Warranty Insurance. Even if you miss something at the PDI, you may still be protected.</p>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="px-5 py-3 text-left font-semibold">Coverage Period</th>
                    <th className="px-5 py-3 text-left font-semibold">What It Covers</th>
                  </tr>
                </thead>
                <tbody>
                  {WARRANTY_ROWS.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-muted/40"}>
                      <td className="px-5 py-4 font-semibold text-primary whitespace-nowrap">{row.period}</td>
                      <td className="px-5 py-4 text-foreground/80">{row.covers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>💡 Pro Tip:</strong> Set a calendar reminder for <strong>12 months after possession</strong>. Walk through your home again and submit a warranty claim for any settling cracks, nail pops, or minor defects before your 15-month materials window closes.
              </p>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-2">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-center mb-10">Answers to the questions BC presale buyers ask us most.</p>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Blog links ── */}
        <section className="py-16 bg-background">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Read the Full Guides</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link
                to="/blog/presale-condo-deficiency-walkthrough-guide-bc"
                className="group block rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all"
              >
                <div className="h-44 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <Building2 className="h-16 w-16 text-white/60 group-hover:text-white/80 transition-colors" />
                </div>
                <div className="p-5">
                  <Badge className="mb-2 text-xs">Condo</Badge>
                  <h3 className="font-bold text-lg leading-snug mb-2 group-hover:text-primary transition-colors">
                    The Ultimate Presale Condo Deficiency Walkthrough Guide for BC Buyers
                  </h3>
                  <p className="text-sm text-muted-foreground">Room-by-room inspection guide specific to condo towers in Metro Vancouver and the Fraser Valley.</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-primary text-sm font-medium">
                    Read guide <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>

              <Link
                to="/blog/presale-townhome-deficiency-walkthrough-guide-bc"
                className="group block rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all"
              >
                <div className="h-44 bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
                  <Home className="h-16 w-16 text-white/60 group-hover:text-white/80 transition-colors" />
                </div>
                <div className="p-5">
                  <Badge className="mb-2 text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Townhome</Badge>
                  <h3 className="font-bold text-lg leading-snug mb-2 group-hover:text-primary transition-colors">
                    The Complete Presale Townhome Deficiency Walkthrough Guide for BC Buyers
                  </h3>
                  <p className="text-sm text-muted-foreground">Level-by-level guide covering exterior, garage, mechanicals, main floor, upper floor, and stairs.</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-primary text-sm font-medium">
                    Read guide <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Download CTA band ── */}
        <section className="py-16 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Download Your Free Printable Checklist</h2>
            <p className="text-slate-300 mb-8 text-lg max-w-xl mx-auto">
              Don't try to memorize this. Print our comprehensive checklist and bring it to your walkthrough. Works for both condos and townhomes across Surrey, Langley, and Metro Vancouver.
            </p>
            <DownloadCTA />
            <p className="text-xs text-slate-500 mt-4">PDF · Printable · Free · No sign-up required</p>
          </div>
        </section>

        {/* ── Expert CTA ── */}
        <section className="py-16 bg-card border-t border-border">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
            </div>
            <h2 className="text-3xl font-bold mb-4">Don't Navigate the Presale Market Alone</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Our team at Presale Properties has guided hundreds of BC buyers through PDI walkthroughs — at <strong>zero cost to you</strong>. Book a free call with Uzair Muhammad today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="px-8">
                  Book a Free Discovery Call
                </Button>
              </Link>
              <Link to="/presale-projects">
                <Button size="lg" variant="outline" className="px-8">
                  Browse Presale Projects
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
