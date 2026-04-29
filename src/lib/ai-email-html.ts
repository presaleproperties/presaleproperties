import {
  buildAiEmailHtml,
  
  buildLululemonEmailHtml,
  buildEditorialEmailHtml,
  DEFAULT_AGENT,
  EMAIL_FONT_PAIRINGS,
  type AiEmailCopy,
  type AgentInfo,
  type EmailFontPairing,
} from "@/components/admin/AiEmailTemplate";
import { withEmailHeader } from "@/lib/emailHeader";

const AGENT_CONTACTS: Record<string, { phone: string; email: string }> = {
  Uzair: { phone: "778-231-3592", email: "info@presaleproperties.com" },
  Sarb: { phone: "+1 (778) 846-7065", email: "sarb@presaleproperties.com" },
  Ravish: { phone: "+1 (604) 349-9399", email: "ravish@presaleproperties.com" },
};

type LayoutVersion = "classic" | "modern" | "editorial";

type StoredFloorPlan = {
  id?: string;
  url?: string;
  label?: string;
  sqft?: string;
  price?: string;
  exclusive_credit?: string;
  monthly_payment?: string;
};

type StoredImageCard = {
  id?: string;
  url?: string;
  caption?: string;
};

function getSelectedFont(fontId?: string): EmailFontPairing {
  return EMAIL_FONT_PAIRINGS.find((font) => font.id === fontId) ?? EMAIL_FONT_PAIRINGS[0];
}

function getSavedDeckMeta(formData: any) {
  return {
    deckUrl: formData?._deckUrl,
    deckParking: formData?._deckParking,
    deckLocker: formData?._deckLocker,
  };
}

function getAgentForTemplate(selAgent?: string, agentOverride?: Partial<AgentInfo> | null): AgentInfo {
  const fullName = agentOverride?.full_name || selAgent || DEFAULT_AGENT.full_name;
  const firstName = fullName.split(" ")[0] || DEFAULT_AGENT.full_name.split(" ")[0];
  const contact = AGENT_CONTACTS[firstName] ?? { phone: DEFAULT_AGENT.phone, email: DEFAULT_AGENT.email };

  return {
    full_name: fullName,
    title: agentOverride?.title || DEFAULT_AGENT.title,
    photo_url: agentOverride?.photo_url ?? DEFAULT_AGENT.photo_url,
    phone: contact.phone,
    email: contact.email,
  };
}

function normalizeCopy(formData: any): AiEmailCopy {
  const copy = formData?.copy || {};
  const vars = formData?.vars || {};

  return {
    subjectLine: copy.subjectLine ?? vars.subjectLine ?? "",
    previewText: copy.previewText ?? vars.previewText ?? "",
    headline: copy.headline ?? vars.headline ?? "",
    bodyCopy: copy.bodyCopy ?? vars.bodyCopy ?? "",
    incentiveText: copy.incentiveText ?? vars.incentiveText ?? "",
    projectName: copy.projectName ?? vars.projectName ?? "",
    city: copy.city ?? vars.city ?? "",
    neighborhood: copy.neighborhood ?? vars.neighborhood ?? "",
    developerName: copy.developerName ?? vars.developerName ?? "",
    startingPrice: copy.startingPrice ?? vars.startingPrice ?? "",
    deposit: copy.deposit ?? vars.deposit ?? "",
    completion: copy.completion ?? vars.completion ?? "",
    projectUrl: copy.projectUrl ?? formData?.projectUrl ?? "",
    infoRows: Array.isArray(copy.infoRows)
      ? copy.infoRows
      : Array.isArray(formData?.infoRows)
        ? formData.infoRows
        : [],
    imageCards: Array.isArray(copy.imageCards)
      ? copy.imageCards
      : Array.isArray(formData?.imageCards)
        ? formData.imageCards
        : [],
  };
}

function buildAiFinalHtml({
  fields,
  agent,
  heroImage,
  floorPlans,
  fpHeading,
  fpSubheading,
  ctaUrl,
  font,
  layoutVersion,
  imageCards,
  loopSlides,
  deckUrl,
  deckParking,
  deckLocker,
  brochureUrl,
  floorplanUrl,
  showFloorPlansCta,
  showBrochureCta,
  showViewMorePlansCta,
  showCallNowCta,
  showInterestedCta,
  interestedWhatsapp,
}: {
  fields: AiEmailCopy;
  agent: AgentInfo;
  heroImage: string;
  floorPlans: StoredFloorPlan[];
  fpHeading: string;
  fpSubheading: string;
  ctaUrl?: string;
  font?: EmailFontPairing;
  layoutVersion?: LayoutVersion;
  imageCards?: StoredImageCard[];
  loopSlides?: string[];
  deckUrl?: string;
  deckParking?: string;
  deckLocker?: string;
  brochureUrl?: string;
  floorplanUrl?: string;
  showFloorPlansCta?: boolean;
  showBrochureCta?: boolean;
  showViewMorePlansCta?: boolean;
  showCallNowCta?: boolean;
  showInterestedCta?: boolean;
  interestedWhatsapp?: string;
}): string {
  if (layoutVersion === "editorial") {
    const slides = (loopSlides && loopSlides.length > 0)
      ? loopSlides.filter(Boolean)
      : [heroImage, ...(imageCards?.filter(c => c.url).map(c => c.url) ?? [])].filter(Boolean);
    return buildEditorialEmailHtml({
      projectName: fields.projectName || "",
      city: fields.city,
      developerName: fields.developerName,
      heroImage: heroImage || undefined,
      headline: fields.headline,
      bodyCopy: fields.bodyCopy,
      subjectLine: fields.subjectLine,
      previewText: fields.previewText,
      startingPrice: fields.startingPrice,
      deposit: fields.deposit,
      completion: fields.completion,
      infoRows: fields.infoRows,
      incentiveText: fields.incentiveText,
      deckUrl: deckUrl || undefined,
      projectUrl: fields.projectUrl || undefined,
      brochureUrl,
      floorplanUrl,
      loopSlides: slides,
      showFloorPlansCta, showBrochureCta, showViewMorePlansCta, showCallNowCta,
      showInterestedCta, interestedWhatsapp,
    }, agent);
  }

  if (layoutVersion === "modern") {
    const slides = (loopSlides && loopSlides.length > 0)
      ? loopSlides.filter(Boolean)
      : [heroImage, ...(imageCards?.filter(c => c.url).map(c => c.url) ?? [])].filter(Boolean);
    return buildLululemonEmailHtml({
      projectName: fields.projectName || "",
      city: fields.city,
      developerName: fields.developerName,
      heroImage: heroImage || undefined,
      headline: fields.headline,
      bodyCopy: fields.bodyCopy,
      subjectLine: fields.subjectLine,
      previewText: fields.previewText,
      startingPrice: fields.startingPrice,
      deposit: fields.deposit,
      completion: fields.completion,
      infoRows: fields.infoRows,
      incentiveText: fields.incentiveText,
      deckUrl: deckUrl || undefined,
      brochureUrl,
      floorplanUrl,
      floorPlans: floorPlans.filter((fp) => fp.url).map((fp) => ({
        id: fp.id || "",
        url: fp.url || "",
        label: fp.label || "",
        sqft: fp.sqft || "",
        price: fp.price && fp.price.trim() !== "" ? fp.price.trim() : undefined,
        exclusive_credit: fp.exclusive_credit && fp.exclusive_credit.trim() !== "" ? fp.exclusive_credit.trim() : undefined,
        monthly_payment: fp.monthly_payment && fp.monthly_payment.trim() !== "" ? fp.monthly_payment.trim() : undefined,
      })),
      fpHeading,
      fpSubheading,
      loopSlides: slides,
      showFloorPlansCta, showBrochureCta, showViewMorePlansCta, showCallNowCta,
      showInterestedCta, interestedWhatsapp,
    }, agent);
  }

  const base = buildAiEmailHtml(fields, agent, ctaUrl, font, false);
  const ACCENT = "#C9A55A";
  const DARK = "#0d1f18";
  const bodyFont = font?.body || "'DM Sans', Helvetica, Arial, sans-serif";

  let html = heroImage
    ? base.replace(
        "<!-- ─── HERO STATS BAR",
        `  <!-- ─── HERO IMAGE ─── -->
  <tr>
    <td style="padding:0;line-height:0;font-size:0;">
      <img src="${heroImage}" alt="${fields.projectName || "Project"}" width="600" height="400" loading="eager" decoding="async" fetchpriority="high"
           style="display:block;width:100%;max-width:600px;height:auto;" />
    </td>
  </tr>
  <!-- ─── HERO STATS BAR`,
      )
    : base;

  if (floorPlans.length > 0) {
    const active = floorPlans.filter((fp) => fp.url);
    if (active.length > 0) {
      const heading = fpHeading || "Available Floor Plans";
      const sub = fpSubheading || "Limited units remaining — register now for priority access";
      const cells = active.map((fp) => `
        <td style="padding:8px;width:${active.length === 1 ? "100%" : "50%"};vertical-align:top;text-align:center;">
          <div style="border:1px solid #e0dbd3;overflow:hidden;background:#fafaf8;">
            <img src="${fp.url}" alt="${fp.label || "Floor Plan"}" width="100%" style="display:block;width:100%;height:auto;" />
            ${fp.label || fp.sqft ? `<div style="padding:10px 12px 12px;">
              ${fp.label ? `<p style="margin:0 0 3px 0;font-family:${bodyFont};font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#111;">${fp.label}</p>` : ""}
              ${fp.sqft ? `<p style="margin:0;font-family:${bodyFont};font-size:10px;color:#888;">${fp.sqft}</p>` : ""}
            </div>` : ""}
          </div>
        </td>`).join("");
      const displayFont = font?.display || "'Cormorant Garamond', Georgia, serif";
      const block = `
  <!-- ─── FLOOR PLANS ─── -->
  <tr><td style="background:${DARK};padding:0;"><div style="height:3px;background:${ACCENT};"></div></td></tr>
  <tr><td style="background:${DARK};padding:28px 36px 8px;">
    <p style="margin:0 0 6px 0;font-family:${bodyFont};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">FLOOR PLANS</p>
    <p style="margin:0 0 8px 0;font-family:${displayFont};font-size:26px;font-weight:600;color:#ffffff;line-height:1.15;">${heading}</p>
    <p style="margin:0;font-family:${bodyFont};font-size:12px;color:#8aaa96;line-height:1.6;">${sub}</p>
  </td></tr>
  <tr><td style="background:${DARK};padding:16px 28px 28px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>${cells}</tr></table>
  </td></tr>
  <tr><td style="background:${DARK};padding:0 36px 28px;">
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background:${ACCENT};padding:13px 32px;">
        <a href="tel:16722581100" style="font-family:${bodyFont};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${DARK};text-decoration:none;font-weight:600;">CALL NOW →</a>
      </td>
    </tr></table>
  </td></tr>`;
      html = html.replace("<!-- ─── AGENT CARD", `${block}\n  <!-- ─── AGENT CARD`);
    }
  }

  return html;
}

export function isAiEmailTemplate(formData: any): boolean {
  return formData?._type === "ai-email";
}

export function buildAiTemplateHtmlFromFormData(formData: any, agentOverride?: Partial<AgentInfo> | null): string {
  const fields = normalizeCopy(formData);
  const font = getSelectedFont(formData?.fontId);
  const agent = getAgentForTemplate(formData?.selAgent, agentOverride);
  const { deckUrl, deckParking, deckLocker } = getSavedDeckMeta(formData);

  const html = buildAiFinalHtml({
    fields,
    agent,
    heroImage: formData?.heroImage || "",
    floorPlans: Array.isArray(formData?.floorPlans) ? formData.floorPlans : [],
    fpHeading: formData?.fpHeading || "",
    fpSubheading: formData?.fpSubheading || "",
    ctaUrl: formData?.directCtaUrl || formData?.ctaUrl || fields.projectUrl,
    font,
    layoutVersion: (formData?.layoutVersion || "modern") as LayoutVersion,
    imageCards: Array.isArray(formData?.imageCards) ? formData.imageCards : [],
    loopSlides: formData?.heroMode === "static" ? [] : (Array.isArray(formData?.loopSlides) ? formData.loopSlides : []),
    deckUrl,
    deckParking,
    deckLocker,
    brochureUrl: formData?.brochureUrl || undefined,
    floorplanUrl: formData?.floorplanUrl || undefined,
    showFloorPlansCta: formData?.showFloorPlansCta,
    showBrochureCta: formData?.showBrochureCta,
    showViewMorePlansCta: formData?.showViewMorePlansCta,
    showCallNowCta: formData?.showCallNowCta,
    showInterestedCta: formData?.showInterestedCta,
    interestedWhatsapp: formData?.interestedWhatsapp,
  });

  // Apply optional brand header (logo + wordmark) if enabled in the saved template.
  // Default ON when the field is missing, to match the builder default.
  return withEmailHeader(html, formData?.showHeader !== false);
}

export function personalizeTemplateHtml(html: string, recipientFirstName?: string): string {
  const firstName = recipientFirstName || "there";
  return html
    .replace(/\{first_name\}/gi, firstName)
    .replace(/\{name\}/gi, firstName)
    .replace(/\[First Name\]/g, firstName)
    .replace(/\[first name\]/g, firstName)
    .replace(/\[Name\]/g, firstName)
    .replace(/\[name\]/g, firstName)
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\*\|FNAME\|\*/g, firstName)
    .replace(/\{\$name\}/g, firstName);
}
