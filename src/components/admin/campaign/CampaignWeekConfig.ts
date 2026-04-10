/**
 * Configuration for each week of the 12-week campaign sequence.
 * Defines which projects to use, the template type, and default copy.
 */

export type CampaignWeekType = "single-project" | "multi-project" | "ai-content";

export interface CampaignWeekDef {
  week: number;
  label: string;
  shortLabel: string;
  description: string;
  type: CampaignWeekType;
  /** Which project(s) to pull data from: "primary" | "alt1" | "alt2" | "all" */
  projectSource: "primary" | "alt1" | "alt2" | "all";
  /** Default subject line template */
  defaultSubject: string;
  /** Default headline template */
  defaultHeadline: string;
  /** AI prompt hint for content generation (Phase 3) */
  aiPromptHint?: string;
}

export const CAMPAIGN_WEEKS: CampaignWeekDef[] = [
  {
    week: 1,
    label: "VIP Launch",
    shortLabel: "VIP",
    description: "Full project details — hero image, pricing, floor plans, Book a Preview CTA",
    type: "single-project",
    projectSource: "primary",
    defaultSubject: "{projectName} — Exclusive VIP Access",
    defaultHeadline: "You're on the VIP List — {projectName}",
  },
  {
    week: 2,
    label: "Your Options Overview",
    shortLabel: "Options",
    description: "All 3 projects side by side — image, name, price, type, completion",
    type: "multi-project",
    projectSource: "all",
    defaultSubject: "Your {city} Presale Options — 3 Projects Compared",
    defaultHeadline: "Your {city} Presale Options",
  },
  {
    week: 3,
    label: "Presale Education",
    shortLabel: "Education",
    description: "How presale works — deposit leverage, appreciation, locking in today's price",
    type: "ai-content",
    projectSource: "primary",
    defaultSubject: "How Presale Works — And Why Now",
    defaultHeadline: "What Is Presale & Why Now?",
    aiPromptHint: "Educational email explaining how presale real estate works using the primary project's numbers. Cover deposit leverage, locking in today's price, appreciation by completion. Target first-time buyers.",
  },
  {
    week: 4,
    label: "Deep Dive — Project 2",
    shortLabel: "Project 2",
    description: "Full breakdown of the second project — hero, pricing, floor plans, highlights",
    type: "single-project",
    projectSource: "alt1",
    defaultSubject: "A Closer Look at {projectName}",
    defaultHeadline: "A Closer Look — {projectName}",
  },
  {
    week: 5,
    label: "Neighbourhood Spotlight",
    shortLabel: "Neighbourhood",
    description: "Walk score, schools, transit, what's being built — sells all 3 projects",
    type: "ai-content",
    projectSource: "all",
    defaultSubject: "Why {city} — The Full Neighbourhood Breakdown",
    defaultHeadline: "The Neighbourhood — {city}",
    aiPromptHint: "Neighbourhood spotlight email covering walk/transit scores, schools, shopping, transit, development plans. This sells all 3 projects because they share the same location.",
  },
  {
    week: 6,
    label: "Money Comparison",
    shortLabel: "Money",
    description: "Deposit structures, monthly costs, strata fees — all 3 projects side by side",
    type: "multi-project",
    projectSource: "all",
    defaultSubject: "What Each Project Actually Costs You Monthly",
    defaultHeadline: "The Money Breakdown — 3 Projects Compared",
  },
  {
    week: 7,
    label: "Deep Dive — Project 3",
    shortLabel: "Project 3",
    description: "Full breakdown of the third project — floor plans, pricing, what makes it different",
    type: "single-project",
    projectSource: "alt2",
    defaultSubject: "A Closer Look at {projectName}",
    defaultHeadline: "A Closer Look — {projectName}",
  },
  {
    week: 8,
    label: "Investment Analysis",
    shortLabel: "Investment",
    description: "Price/sqft, rent estimates, yield, appreciation, CMHC data — all 3 compared",
    type: "multi-project",
    projectSource: "all",
    defaultSubject: "Investment Breakdown — How the Numbers Stack Up",
    defaultHeadline: "The Investment Angle — 3 Projects Compared",
    aiPromptHint: "Investment-focused email comparing all 3 projects: price per sqft, estimated rent, rental yield, appreciation projections, CMHC data. Serve investor segment without alienating first-time buyers.",
  },
  {
    week: 9,
    label: "Social Proof",
    shortLabel: "Proof",
    description: "Agent track record, client testimonial, developer warranty, trust-building",
    type: "ai-content",
    projectSource: "primary",
    defaultSubject: "Why 400+ Buyers Have Gone Presale With Me",
    defaultHeadline: "Here's Why Buyers Trust Us",
    aiPromptHint: "Social proof and trust-building email. Include agent track record (400+ units), a client success story, developer warranty info. Build confidence in presale buying.",
  },
  {
    week: 10,
    label: "Market Update",
    shortLabel: "Update",
    description: "Availability updates, price changes, new incentives across all 3 projects",
    type: "multi-project",
    projectSource: "all",
    defaultSubject: "Quick Update on Your 3 Presale Options",
    defaultHeadline: "What's Changed — A Quick Update",
  },
  {
    week: 11,
    label: "Meet the Agent",
    shortLabel: "Agent",
    description: "Personal story, background, languages, family — warm and human",
    type: "ai-content",
    projectSource: "primary",
    defaultSubject: "A Little About Me — Uzair Muhammad",
    defaultHeadline: "Meet Your Presale Specialist",
    aiPromptHint: "Personal agent introduction email. 10 years at City of Surrey background, why they switched to real estate, buyer-side only philosophy, languages spoken, family. Warm, personal tone.",
  },
  {
    week: 12,
    label: "Decision Email",
    shortLabel: "Decision",
    description: "Recap all 3 projects, final CTA to book or reply with objections",
    type: "multi-project",
    projectSource: "all",
    defaultSubject: "You've Seen All 3 — Here's Your Quick Recap",
    defaultHeadline: "Time to Decide — Your 3 Options Recap",
  },
];
