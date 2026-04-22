/**
 * Regression test: city names with spaces (e.g. "North Vancouver") must always
 * be slugged correctly inside hero CTA URLs and city catalog/nav URLs across
 * every email variant.
 *
 * What "correct" means here:
 *  - Slug appears as `north-vancouver` (lowercase, hyphen-separated).
 *  - The raw display string `North Vancouver` (or any space-bearing city)
 *    NEVER appears inside an href value — even URL-encoded as `North%20Vancouver`
 *    or `North+Vancouver`. It may still appear in visible text/headings.
 *
 * Covers:
 *  - buildRecommendationEmailHtml  (hero "Browse All in <city>" CTA + city nav)
 *  - buildCatalogueEmailHtml       (no city URL today — guards against future regressions)
 *  - buildMultiProjectEmailHtml    (no city URL today — guards against future regressions)
 */
import { describe, it, expect } from "vitest";
import { buildRecommendationEmailHtml } from "../buildRecommendationEmailHtml";
import { buildCatalogueEmailHtml } from "../buildCatalogueEmailHtml";
import { buildMultiProjectEmailHtml } from "../buildMultiProjectEmailHtml";

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

/** Extract every href value from an HTML string. */
function extractHrefs(html: string): string[] {
  const hrefs: string[] = [];
  const re = /\bhref\s*=\s*"([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) hrefs.push(m[1]);
  return hrefs;
}

/**
 * Resolve an href to its real destination — if it goes through the
 * track-email-open redirect, return the inner `url` query param; otherwise
 * return the href itself.
 */
function resolveHref(href: string): string {
  try {
    const u = new URL(href);
    if (u.pathname.endsWith("/track-email-open")) {
      return u.searchParams.get("url") || href;
    }
    return href;
  } catch {
    return href;
  }
}

/** Build a minimal valid project for the Recommendation builder. */
function recProject(city: string, slug: string) {
  return {
    id: `proj-${slug}`,
    category: "condo" as const,
    projectName: `Test Project (${city})`,
    city,
    neighborhood: "Lonsdale",
    developerName: "Test Dev",
    startingPrice: "$899,000",
    completion: "2027",
    featuredImage: "https://example.com/img.jpg",
    projectUrl: `https://presaleproperties.com/presale-projects/${slug}`,
  };
}

const SPACE_CITIES: Array<{ display: string; slug: string }> = [
  { display: "North Vancouver", slug: "north-vancouver" },
  { display: "New Westminster", slug: "new-westminster" },
  { display: "Maple Ridge", slug: "maple-ridge" },
  { display: "Port Moody", slug: "port-moody" },
];

/**
 * Assert that none of the URL-encoded variants of a space-bearing city ever
 * appear inside an href. Visible text is allowed to contain the raw display.
 */
function assertNoUnsluggedCityInHrefs(html: string, cityDisplay: string) {
  const hrefs = extractHrefs(html);
  const forbiddenForms = [
    cityDisplay,                                      // "North Vancouver"
    cityDisplay.replace(/ /g, "%20"),                 // "North%20Vancouver"
    cityDisplay.replace(/ /g, "+"),                   // "North+Vancouver"
    cityDisplay.toLowerCase(),                        // "north vancouver"
    cityDisplay.toLowerCase().replace(/ /g, "%20"),
    cityDisplay.toLowerCase().replace(/ /g, "+"),
  ];
  for (const href of hrefs) {
    // Resolve through tracker so we inspect the real destination too.
    const dest = resolveHref(href);
    for (const bad of forbiddenForms) {
      expect(
        href.includes(bad),
        `Raw city "${bad}" leaked into href: ${href}`,
      ).toBe(false);
      expect(
        dest.includes(bad),
        `Raw city "${bad}" leaked into tracked destination: ${dest} (from ${href})`,
      ).toBe(false);
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Recommendation email — hero CTA + city nav must slug correctly
// ───────────────────────────────────────────────────────────────────────────

describe("buildRecommendationEmailHtml — city slugging", () => {
  for (const { display, slug } of SPACE_CITIES) {
    it(`hero "Browse All in ${display}" CTA links to /presale-projects/${slug}`, () => {
      const html = buildRecommendationEmailHtml({
        subjectLine: "Test",
        previewText: "Test",
        headline: "Test",
        bodyCopy: "Test",
        city: display,
        projects: [recProject(display, "test-tower")],
      });

      // Visible text retains the human-readable name.
      expect(html).toContain(`Browse All in ${display}`);

      // Hero tracked URL must resolve to the slugged path.
      const hrefs = extractHrefs(html).map(resolveHref);
      const heroDest = hrefs.find(
        (h) => h === `https://presaleproperties.com/presale-projects/${slug}`,
      );
      expect(
        heroDest,
        `Expected hero CTA destination https://presaleproperties.com/presale-projects/${slug} not found`,
      ).toBeTruthy();

      // No unsugged form of the city anywhere inside any href.
      assertNoUnsluggedCityInHrefs(html, display);
    });
  }

  it("city nav `North Vancouver` link (when present) is also slugged", () => {
    // The Recommendation header nav already hard-codes /presale-projects/<slug>
    // for canonical cities; assert at least the "north-vancouver" path shape
    // never gets emitted as the raw display form.
    const html = buildRecommendationEmailHtml({
      subjectLine: "Test",
      previewText: "Test",
      headline: "Test",
      bodyCopy: "Test",
      city: "North Vancouver",
      projects: [recProject("North Vancouver", "harbour-walk")],
    });
    assertNoUnsluggedCityInHrefs(html, "North Vancouver");
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Catalogue + Multi-project — no city URL today, but guard against regressions
// ───────────────────────────────────────────────────────────────────────────

describe("buildCatalogueEmailHtml — no unslugged city leaks into hrefs", () => {
  for (const { display } of SPACE_CITIES) {
    it(`renders cleanly with city="${display}"`, () => {
      const html = buildCatalogueEmailHtml({
        subjectLine: "Test",
        previewText: "Test",
        headline: "Test",
        bodyCopy: "Test",
        city: display,
        projects: [
          {
            id: "p1",
            projectName: "Test Project",
            city: display,
            startingPrice: "$899,000",
            completion: "2027",
            featuredImage: "https://example.com/img.jpg",
            projectUrl: "https://presaleproperties.com/presale-projects/test",
          },
        ],
      });
      assertNoUnsluggedCityInHrefs(html, display);
    });
  }
});

describe("buildMultiProjectEmailHtml — no unslugged city leaks into hrefs", () => {
  for (const { display } of SPACE_CITIES) {
    it(`renders cleanly with city="${display}"`, () => {
      const html = buildMultiProjectEmailHtml({
        subjectLine: "Test",
        previewText: "Test",
        headline: "Test",
        bodyCopy: "Test",
        weekNumber: 1,
        weekLabel: "Week 1",
        city: display,
        projects: [
          {
            projectName: "Test Project",
            city: display,
            startingPrice: "$899,000",
            featuredImage: "https://example.com/img.jpg",
            projectUrl: "https://presaleproperties.com/presale-projects/test",
          },
        ],
      });
      assertNoUnsluggedCityInHrefs(html, display);
    });
  }
});
