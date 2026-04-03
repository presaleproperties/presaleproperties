export interface LeadScoreInput {
  usedCalculator?: boolean;
  pagesViewed?: number;
  sessionCount?: number;
  formType?: string;
  phone?: string;
  message?: string;
  utmSource?: string;
}

export interface LeadScoreResult {
  score: number;
  temperature: "hot" | "warm" | "cold";
}

export function calculateLeadScore(data: LeadScoreInput): LeadScoreResult {
  // Base score of 1 — every lead that fills a form has some intent
  let score = 1;

  if (data.usedCalculator) score += 3;
  if ((data.pagesViewed ?? 0) >= 5) score += 2;
  else if ((data.pagesViewed ?? 0) >= 2) score += 1;
  if ((data.sessionCount ?? 1) >= 3) score += 3;
  else if ((data.sessionCount ?? 1) >= 2) score += 2;
  if (data.formType === "project_inquiry" || data.formType === "access_pack" || data.formType === "mobile_cta") score += 2;
  if (data.formType === "consultation" || data.formType === "deck_gate") score += 3;
  if (data.phone && data.phone.trim().length > 0) score += 1;
  if (data.message && data.message.trim().length > 50) score += 1;
  if (data.utmSource === "google") score += 1;

  const temperature: "hot" | "warm" | "cold" =
    score >= 8 ? "hot" : score >= 4 ? "warm" : "cold";

  return { score, temperature };
}
