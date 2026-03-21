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
  let score = 0;

  if (data.usedCalculator) score += 3;
  if ((data.pagesViewed ?? 0) >= 5) score += 2;
  if ((data.sessionCount ?? 1) >= 2) score += 2;
  if (data.formType === "project_inquiry" || data.formType === "vip_access") score += 2;
  if (data.phone && data.phone.trim().length > 0) score += 1;
  if (data.message && data.message.trim().length > 50) score += 1;
  if (data.utmSource === "google") score += 1;

  const temperature: "hot" | "warm" | "cold" =
    score >= 8 ? "hot" : score >= 5 ? "warm" : "cold";

  return { score, temperature };
}
