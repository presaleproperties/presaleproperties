/**
 * AI content generation for campaign weeks 3, 5, 9, 11
 * Uses the existing generate-email-copy edge function with campaign-specific prompts
 */

import { supabase } from "@/integrations/supabase/client";
import { CAMPAIGN_WEEKS } from "./CampaignWeekConfig";

export interface CampaignProject {
  name: string;
  city: string;
  neighborhood?: string | null;
  developer_name?: string | null;
  starting_price?: number | null;
  price_range?: string | null;
  deposit_structure?: string | null;
  deposit_percent?: number | null;
  completion_year?: number | null;
  completion_month?: number | null;
  highlights?: string[] | null;
  short_description?: string | null;
}

interface AiCopyResult {
  subjectLine: string;
  previewText: string;
  headline: string;
  bodyCopy: string;
  incentiveText?: string;
}

export async function generateCampaignWeekCopy(
  weekNumber: number,
  primaryProject: CampaignProject,
  altProject1: CampaignProject,
  altProject2: CampaignProject,
): Promise<AiCopyResult> {
  const weekDef = CAMPAIGN_WEEKS[weekNumber - 1];
  if (!weekDef) throw new Error(`Invalid week number: ${weekNumber}`);

  // Build context from all three projects
  const projectSummaries = [
    { label: "Primary Project", ...primaryProject },
    { label: "Alternative 1", ...altProject1 },
    { label: "Alternative 2", ...altProject2 },
  ].map(p => {
    const price = p.price_range || (p.starting_price ? `From $${p.starting_price.toLocaleString()}` : "N/A");
    const deposit = p.deposit_structure || (p.deposit_percent ? `${p.deposit_percent}%` : "N/A");
    const completion = p.completion_year ? `${p.completion_year}` : "TBD";
    return `${p.label}: ${p.name} — ${p.city}${p.neighborhood ? `, ${p.neighborhood}` : ""} | ${price} | Deposit: ${deposit} | Completion: ${completion}${p.highlights?.length ? ` | Highlights: ${p.highlights.slice(0, 3).join(", ")}` : ""}`;
  }).join("\n");

  const prompt = `${weekDef.aiPromptHint || weekDef.description}

CAMPAIGN CONTEXT — 12-Week Drip Sequence, Week ${weekNumber} ("${weekDef.label}"):
${projectSummaries}

Write this as Week ${weekNumber} of a 12-week campaign. The reader has already received ${weekNumber - 1} emails. ${weekNumber <= 3 ? "Keep it introductory." : weekNumber <= 8 ? "The reader is warming up — go deeper." : "The reader is engaged — build urgency and trust."}

Subject line should reference: ${weekDef.defaultSubject.replace("{city}", primaryProject.city).replace("{projectName}", primaryProject.name)}
Headline should be similar to: ${weekDef.defaultHeadline.replace("{city}", primaryProject.city).replace("{projectName}", primaryProject.name)}`;

  const { data, error } = await supabase.functions.invoke("generate-email-copy", {
    body: {
      prompt,
      projectDetails: {
        projectName: primaryProject.name,
        city: primaryProject.city,
        neighborhood: primaryProject.neighborhood,
        developerName: primaryProject.developer_name,
        startingPrice: primaryProject.price_range || (primaryProject.starting_price ? `$${primaryProject.starting_price.toLocaleString()}` : ""),
        deposit: primaryProject.deposit_structure || "",
        completion: primaryProject.completion_year ? `${primaryProject.completion_year}` : "",
      },
      templateType: "project-intro",
      tone: weekNumber <= 4 ? "warm" : weekNumber <= 8 ? "informational" : "confident",
    },
  });

  if (error) throw new Error(error.message || "AI generation failed");
  if (data?.error) throw new Error(data.error);

  const copy = data?.copy;
  if (!copy) throw new Error("No copy returned from AI");

  return {
    subjectLine: copy.subjectLine || weekDef.defaultSubject.replace("{city}", primaryProject.city).replace("{projectName}", primaryProject.name),
    previewText: copy.previewText || "",
    headline: copy.headline || weekDef.defaultHeadline.replace("{city}", primaryProject.city).replace("{projectName}", primaryProject.name),
    bodyCopy: copy.bodyCopy || "",
    incentiveText: copy.incentiveText || "",
  };
}
