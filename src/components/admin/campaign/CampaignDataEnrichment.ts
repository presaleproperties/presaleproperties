/**
 * Fetches organic data from the database to enrich campaign emails:
 * - Blog posts (guides, market updates) for relevant CTAs
 * - City market stats for real numbers in comparisons
 * - CMHC rental data for investment analysis
 * - Google reviews for social proof
 */

import { supabase } from "@/integrations/supabase/client";

export interface BlogLink {
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  featured_image: string | null;
}

export interface MarketStats {
  city: string;
  benchmark_price: number | null;
  avg_price_sqft: number | null;
  days_on_market: number | null;
  total_inventory: number | null;
  total_sales: number | null;
  yoy_price_change: number | null;
  mom_price_change: number | null;
  sale_to_list_ratio: number | null;
  market_type: string | null;
  report_month: number;
  report_year: number;
}

export interface RentalData {
  city: string;
  avg_rent_1br: number | null;
  avg_rent_2br: number | null;
  avg_rent_3br: number | null;
  vacancy_rate_overall: number | null;
  yoy_rent_change_1br: number | null;
  yoy_rent_change_2br: number | null;
}

export interface ReviewData {
  reviewer_name: string;
  review_text: string;
  rating: number;
  reviewer_location: string | null;
}

export interface CampaignEnrichmentData {
  /** Matching guide/educational blog posts */
  educationGuides: BlogLink[];
  /** Latest market update blog post */
  latestMarketUpdate: BlogLink | null;
  /** Real market stats for the city */
  marketStats: MarketStats | null;
  /** CMHC rental data for the city */
  rentalData: RentalData | null;
  /** Top Google reviews for social proof */
  reviews: ReviewData[];
}

/**
 * Fetch all enrichment data for a campaign in one batch
 */
export async function fetchCampaignEnrichmentData(
  city: string,
): Promise<CampaignEnrichmentData> {
  // Run all queries in parallel
  const [guidesRes, marketUpdateRes, statsRes, rentalRes, reviewsRes] = await Promise.all([
    // 1. Education guides — published blog posts tagged with presale/guide keywords
    supabase
      .from("blog_posts")
      .select("title, slug, excerpt, category, featured_image")
      .eq("is_published", true)
      .or("category.ilike.%guide%,category.ilike.%education%,category.ilike.%presale%,tags.cs.{presale},tags.cs.{guide}")
      .order("publish_date", { ascending: false })
      .limit(5),

    // 2. Latest market update blog post
    supabase
      .from("blog_posts")
      .select("title, slug, excerpt, category, featured_image")
      .eq("is_published", true)
      .or("category.ilike.%market%,tags.cs.{market-update},tags.cs.{market update}")
      .order("publish_date", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // 3. City market stats — most recent month for apartment/condo
    supabase
      .from("city_market_stats")
      .select("city, benchmark_price, avg_price_sqft, days_on_market, total_inventory, total_sales, yoy_price_change, mom_price_change, sale_to_list_ratio, market_type, report_month, report_year")
      .ilike("city", city)
      .or("property_type.ilike.%apartment%,property_type.ilike.%condo%")
      .order("report_year", { ascending: false })
      .order("report_month", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // 4. CMHC rental data — most recent
    supabase
      .from("cmhc_rental_data")
      .select("city, avg_rent_1br, avg_rent_2br, avg_rent_3br, vacancy_rate_overall, yoy_rent_change_1br, yoy_rent_change_2br")
      .ilike("city", `%${city}%`)
      .order("report_year", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // 5. Top Google reviews for social proof
    supabase
      .from("google_reviews")
      .select("reviewer_name, review_text, rating, reviewer_location")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(3),
  ]);

  return {
    educationGuides: (guidesRes.data || []) as BlogLink[],
    latestMarketUpdate: (marketUpdateRes.data as BlogLink | null) || null,
    marketStats: (statsRes.data as MarketStats | null) || null,
    rentalData: (rentalRes.data as RentalData | null) || null,
    reviews: (reviewsRes.data || []) as ReviewData[],
  };
}

// ── HTML snippet builders (inline email-safe HTML, matching brand) ─────────

const F = "'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif";
const ACCENT = "#C9A55A";
const DARK = "#111111";
const SAGE = "#6B9E7E";

/**
 * Builds a "Read the Full Guide" CTA card for education weeks
 */
export function buildGuideCta(guide: BlogLink): string {
  const url = `https://presaleproperties.com/blog/${guide.slug}`;
  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background:#faf8f4;border:1px solid #e8e2d6;border-radius:8px;overflow:hidden;">
    <tr>
      <td style="padding:20px 24px;">
        <p style="margin:0 0 4px;font-family:${F};font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};">FROM OUR GUIDE LIBRARY</p>
        <p style="margin:0 0 8px;font-family:${F};font-size:16px;font-weight:700;color:${DARK};line-height:1.3;">${guide.title}</p>
        ${guide.excerpt ? `<p style="margin:0 0 12px;font-family:${F};font-size:13px;color:#666;line-height:1.6;">${guide.excerpt.slice(0, 120)}${guide.excerpt.length > 120 ? "…" : ""}</p>` : ""}
        <a href="${url}" target="_blank" style="font-family:${F};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${ACCENT};text-decoration:none;">READ THE FULL GUIDE →</a>
      </td>
    </tr>
  </table>`;
}

/**
 * Builds a market stats bar with real data for neighbourhood/investment weeks
 */
export function buildMarketStatsBar(stats: MarketStats): string {
  const cells: string[] = [];

  if (stats.benchmark_price) {
    cells.push(buildStatCell("Benchmark", `$${(stats.benchmark_price / 1000).toFixed(0)}K`));
  }
  if (stats.avg_price_sqft) {
    cells.push(buildStatCell("$/SqFt", `$${stats.avg_price_sqft}`));
  }
  if (stats.days_on_market) {
    cells.push(buildStatCell("Days on Market", `${stats.days_on_market}`));
  }
  if (stats.yoy_price_change !== null && stats.yoy_price_change !== undefined) {
    const sign = stats.yoy_price_change >= 0 ? "+" : "";
    cells.push(buildStatCell("YoY Change", `${sign}${stats.yoy_price_change}%`));
  }

  if (cells.length === 0) return "";

  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background:#faf8f4;border:1px solid #e8e2d6;border-radius:8px;overflow:hidden;">
    <tr>
      <td style="padding:4px 0 0;">
        <p style="margin:0;padding:12px 24px 0;font-family:${F};font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};">REAL MARKET DATA — ${stats.city.toUpperCase()} (${new Date(0, stats.report_month - 1).toLocaleString("en", { month: "short" })} ${stats.report_year})</p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 16px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>${cells.join("")}</tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function buildStatCell(label: string, value: string): string {
  return `<td style="padding:8px;text-align:center;">
    <p style="margin:0 0 2px;font-family:${F};font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#8a7e6b;">${label}</p>
    <p style="margin:0;font-family:${F};font-size:18px;font-weight:800;color:${DARK};">${value}</p>
  </td>`;
}

/**
 * Builds rental data snippet for investment weeks
 */
export function buildRentalDataSnippet(rental: RentalData): string {
  const cells: string[] = [];
  if (rental.avg_rent_1br) cells.push(buildStatCell("1BR Rent", `$${rental.avg_rent_1br.toLocaleString()}`));
  if (rental.avg_rent_2br) cells.push(buildStatCell("2BR Rent", `$${rental.avg_rent_2br.toLocaleString()}`));
  if (rental.vacancy_rate_overall !== null && rental.vacancy_rate_overall !== undefined) {
    cells.push(buildStatCell("Vacancy", `${rental.vacancy_rate_overall}%`));
  }
  if (rental.yoy_rent_change_1br !== null && rental.yoy_rent_change_1br !== undefined) {
    const sign = rental.yoy_rent_change_1br >= 0 ? "+" : "";
    cells.push(buildStatCell("Rent YoY", `${sign}${rental.yoy_rent_change_1br}%`));
  }

  if (cells.length === 0) return "";

  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background:#f0f6f2;border:1px solid #d4e5da;border-radius:8px;overflow:hidden;">
    <tr>
      <td style="padding:4px 0 0;">
        <p style="margin:0;padding:12px 24px 0;font-family:${F};font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${SAGE};">CMHC RENTAL DATA — ${rental.city.toUpperCase()}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 16px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>${cells.join("")}</tr>
        </table>
      </td>
    </tr>
  </table>`;
}

/**
 * Builds a real Google review card for social proof weeks
 */
export function buildReviewCard(review: ReviewData): string {
  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
  const initial = review.reviewer_name.charAt(0).toUpperCase();

  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:12px 0;background:#ffffff;border:1px solid #e8e2d6;border-radius:8px;overflow:hidden;">
    <tr>
      <td style="padding:20px 24px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="44" valign="top" style="padding-right:12px;">
              <div style="width:40px;height:40px;border-radius:50%;background:${ACCENT};text-align:center;line-height:40px;font-family:${F};font-size:18px;font-weight:700;color:#fff;">${initial}</div>
            </td>
            <td valign="top">
              <p style="margin:0 0 2px;font-family:${F};font-size:14px;font-weight:700;color:${DARK};">${review.reviewer_name}</p>
              ${review.reviewer_location ? `<p style="margin:0 0 4px;font-family:${F};font-size:11px;color:#8a7e6b;">${review.reviewer_location}</p>` : ""}
              <p style="margin:0 0 8px;font-family:${F};font-size:16px;color:${ACCENT};letter-spacing:2px;">${stars}</p>
            </td>
          </tr>
        </table>
        <p style="margin:0;font-family:${F};font-size:13px;color:#555;line-height:1.7;font-style:italic;">"${review.review_text.slice(0, 250)}${review.review_text.length > 250 ? "…" : ""}"</p>
      </td>
    </tr>
  </table>`;
}

/**
 * Builds a calculator CTA link
 */
export function buildCalculatorCta(city: string): string {
  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;">
    <tr>
      <td align="center" bgcolor="#faf8f4" style="padding:16px 24px;border:1px solid #e8e2d6;border-radius:8px;">
        <p style="margin:0 0 8px;font-family:${F};font-size:13px;font-weight:600;color:${DARK};">See what your investment could look like</p>
        <a href="https://presaleproperties.com/calculator" target="_blank" style="font-family:${F};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${ACCENT};text-decoration:none;">USE OUR ROI CALCULATOR →</a>
      </td>
    </tr>
  </table>`;
}

/**
 * Builds a market update blog link card
 */
export function buildMarketUpdateCta(blog: BlogLink): string {
  const url = `https://presaleproperties.com/blog/${blog.slug}`;
  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background:#faf8f4;border:1px solid #e8e2d6;border-radius:8px;overflow:hidden;">
    ${blog.featured_image ? `<tr><td style="padding:0;line-height:0;"><a href="${url}" target="_blank" style="display:block;line-height:0;"><img src="${blog.featured_image}" alt="${blog.title}" width="560" style="display:block;width:100%;max-width:100%;height:auto;border:0;border-radius:8px 8px 0 0;" /></a></td></tr>` : ""}
    <tr>
      <td style="padding:16px 24px;">
        <p style="margin:0 0 4px;font-family:${F};font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};">LATEST MARKET UPDATE</p>
        <p style="margin:0 0 8px;font-family:${F};font-size:15px;font-weight:700;color:${DARK};line-height:1.3;">${blog.title}</p>
        <a href="${url}" target="_blank" style="font-family:${F};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${ACCENT};text-decoration:none;">READ FULL REPORT →</a>
      </td>
    </tr>
  </table>`;
}
