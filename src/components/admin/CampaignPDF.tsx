import {
  Document, Page, View, Text, Image as PDFImage,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Colour palette ──────────────────────────────────────────────────────────
const GOLD = "#C9A84C";
const DARK = "#111111";
const COAL = "#1C1C1C";
const COAL2 = "#2A2A2A";
const OFF_WHITE = "#F8F6F2";
const SMOKE = "#E8E4DC";
const GREEN_BG = "#1e5c2e";
const GREEN_BADGE = "#166534";
const GREEN_TEXT = "#a8ffbc";
const RED = "#dc2626";
const MUTED = "#888888";
const LOGO_WHITE = "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/brand%2Flogo-white.png";

// ─── Letter page: 612 × 792 pt ───────────────────────────────────────────────
const PW = 612; // page width pt

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // One-pager: auto-height page (no fixed height = wraps content exactly)
  page: { backgroundColor: OFF_WHITE, fontFamily: "Helvetica", width: PW },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: { position: "relative", height: 230, overflow: "hidden" },
  heroImg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" },
  heroFallback: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#0f3460" },
  heroOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.48)" },
  heroLogo: { position: "absolute", top: 12, left: 16, width: 130, height: 52, objectFit: "contain" },
  heroBadgeWrap: { position: "absolute", top: 14, right: 16 },
  heroBadge: { backgroundColor: GOLD, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 4 },
  heroBadgeText: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: DARK, letterSpacing: 1.3 },
  heroBadgeSub: { fontSize: 4.5, color: "rgba(255,255,255,0.5)", fontStyle: "italic", textAlign: "right", marginTop: 3 },
  heroBottomLeft: { position: "absolute", bottom: 16, left: 20, maxWidth: 330 },
  heroAccent: { width: 26, height: 2.5, backgroundColor: GOLD, marginBottom: 6 },
  heroProjectName: { fontSize: 30, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: -0.5, lineHeight: 1.05 },
  heroDeveloper: { fontSize: 9, fontFamily: "Helvetica-Bold", color: GOLD, marginTop: 5 },
  heroAddress: { fontSize: 7, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  heroBottomRight: { position: "absolute", bottom: 16, right: 20, alignItems: "flex-end" },
  heroFromLabel: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 },
  heroPrice: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  heroPsf: { fontSize: 6.5, color: "rgba(255,255,255,0.6)", marginTop: 3 },

  // ── Info bar ──────────────────────────────────────────────────────────────
  infoBar: { flexDirection: "row" },
  infoCell: { flex: 1, paddingHorizontal: 11, paddingVertical: 8 },
  infoCellEven: { backgroundColor: COAL },
  infoCellOdd: { backgroundColor: COAL2, borderLeftWidth: 1.5, borderLeftColor: GOLD },
  infoCellVal: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#ffffff", lineHeight: 1.3 },
  infoCellLbl: { fontSize: 6, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 },

  // ── Incentive banner ──────────────────────────────────────────────────────
  incentiveBanner: {
    paddingHorizontal: 20, paddingVertical: 9,
    borderTopWidth: 0.5, borderTopColor: "rgba(255,255,255,0.1)",
    borderBottomWidth: 0.5, borderBottomColor: "rgba(255,255,255,0.1)",
    backgroundColor: GREEN_BG,
  },
  incentiveHeadline: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  incentiveHeadlineLine: { width: 14, height: 0.8, backgroundColor: "rgba(255,255,255,0.4)", marginHorizontal: 6 },
  incentiveHeadlineText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 2 },
  incentivePills: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  incentivePill: {
    backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 0.7, borderColor: "rgba(255,255,255,0.28)",
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, margin: 2.5,
  },
  incentivePillText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 0.4 },
  incentivePillCheck: { fontSize: 7, color: GREEN_TEXT },

  // ── Floor plans header ────────────────────────────────────────────────────
  plansHeader: {
    backgroundColor: COAL, borderTopWidth: 2, borderTopColor: GOLD,
    paddingHorizontal: 16, paddingVertical: 7,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  plansHeaderText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 1.6 },
  plansHeaderSub: { fontSize: 6.5, color: MUTED },

  // ── Plan card grid ────────────────────────────────────────────────────────
  planGrid: { flexDirection: "row" },
  planCard: { flex: 1, borderTopWidth: 2.5, borderTopColor: GOLD, padding: 9, paddingBottom: 7 },
  planCardEven: { backgroundColor: "#ffffff" },
  planCardOdd: { backgroundColor: OFF_WHITE },
  planBadge: { backgroundColor: DARK, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start", marginBottom: 5 },
  planBadgeText: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 0.8 },
  planType: { fontSize: 8, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 2, lineHeight: 1.3 },
  planSqft: { fontSize: 6.5, color: MUTED, marginBottom: 7 },
  planDivider: { height: 0.7, backgroundColor: SMOKE, marginBottom: 5 },
  planWasLbl: { fontSize: 6, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 1, marginBottom: 2 },
  planWasPrice: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: RED, textDecoration: "line-through", marginBottom: 5 },
  planNowLbl: { fontSize: 6, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1, marginBottom: 2 },
  planNowPrice: { fontSize: 13, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 7 },
  planNowPriceLarge: { fontSize: 17, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 7 },
  planSavingBar: {
    backgroundColor: "#dcfce7", borderLeftWidth: 2.5, borderLeftColor: GREEN_BADGE,
    paddingHorizontal: 5, paddingVertical: 3, marginBottom: 7, borderRadius: 2,
  },
  planSavingText: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: "#15803d" },
  planPsfLbl: { fontSize: 6, color: MUTED, marginBottom: 2 },
  planPsf: { fontSize: 8, fontFamily: "Helvetica-Bold", color: DARK },

  // ── Deposit ───────────────────────────────────────────────────────────────
  depositSection: { backgroundColor: COAL, paddingHorizontal: 20, paddingVertical: 12 },
  depositTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  depositTitle: { fontSize: 7, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1.8, textTransform: "uppercase" },
  depositBasedOn: { fontSize: 5.5, color: "rgba(255,255,255,0.35)" },
  depositRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-start" },
  depositCol: { flex: 1, alignItems: "center" },
  depositCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: GOLD, justifyContent: "center", alignItems: "center", marginBottom: 5 },
  depositCircleFinal: { width: 24, height: 24, borderRadius: 12, backgroundColor: COAL2, borderWidth: 1.5, borderColor: GOLD, justifyContent: "center", alignItems: "center", marginBottom: 5 },
  depositCircleNum: { fontSize: 9, fontFamily: "Helvetica-Bold", color: DARK },
  depositPct: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: GOLD, textAlign: "center" },
  depositAmt: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#ffffff", textAlign: "center", marginTop: 1 },
  depositLabel: { fontSize: 5.5, color: "rgba(255,255,255,0.45)", textAlign: "center", marginTop: 2 },
  depositCompletionLbl: { fontSize: 7, fontFamily: "Helvetica-Bold", color: GOLD, textAlign: "center" },
  depositMortgage: { fontSize: 5.5, color: "rgba(255,255,255,0.55)", textAlign: "center", marginTop: 2 },
  depositDate: { fontSize: 5, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 1 },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: { backgroundColor: DARK, borderTopWidth: 2, borderTopColor: GOLD, paddingHorizontal: 20, paddingVertical: 9, flexDirection: "row", alignItems: "center" },
  footerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  footerPhoto: { width: 42, height: 42, borderRadius: 21, marginRight: 11, borderWidth: 1.5, borderColor: GOLD },
  footerName: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 0.5 },
  footerTitle: { fontSize: 6, color: MUTED, marginTop: 1.5 },
  footerLang: { fontSize: 6, color: GOLD, marginTop: 1.5 },
  footerDivider: { width: 0.7, height: 34, backgroundColor: "#333333", marginHorizontal: 18 },
  footerRight: { alignItems: "flex-end" },
  footerPhone: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  footerEmail: { fontSize: 6.5, color: MUTED, marginTop: 2 },
  footerWeb: { fontSize: 6.5, color: GOLD, marginTop: 1.5 },

  // ── Disclaimer ────────────────────────────────────────────────────────────
  disclaimer: { backgroundColor: DARK, paddingHorizontal: 20, paddingVertical: 5 },
  disclaimerText: { fontSize: 4.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 },

  // ── Floor plan pages (fixed Letter size 612 × 792) ────────────────────────
  fpPage: { backgroundColor: "#ffffff", fontFamily: "Helvetica", width: PW, height: 792 },
  fpHeader: {
    backgroundColor: DARK, borderBottomWidth: 3, borderBottomColor: GOLD,
    paddingHorizontal: 20, paddingVertical: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  fpHeaderLeft: { flexDirection: "row", alignItems: "center" },
  fpLogo: { width: 100, height: 40, objectFit: "contain" },
  fpHeaderDivider: { width: 0.7, height: 28, backgroundColor: "#444", marginHorizontal: 14 },
  fpHeaderLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#aaaaaa", letterSpacing: 1.3, textTransform: "uppercase" },
  fpBadge: { backgroundColor: GOLD, borderRadius: 4, paddingHorizontal: 14, paddingVertical: 6 },
  fpBadgeText: { fontSize: 10, fontFamily: "Helvetica-Bold", color: DARK, letterSpacing: 1 },
  fpStrip: { backgroundColor: COAL, paddingHorizontal: 20, paddingVertical: 10, flexDirection: "row", flexWrap: "wrap" },
  fpStripCell: { marginRight: 28, marginBottom: 2 },
  fpStripLbl: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 },
  fpStripVal: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  // Image fills maximum space between strip and footer
  fpImageWrap: { flex: 1, backgroundColor: "#ffffff", padding: 16 },
  fpImage: { width: "100%", height: "100%", objectFit: "contain" },
  fpFooter: {
    backgroundColor: DARK, borderTopWidth: 2, borderTopColor: GOLD,
    paddingHorizontal: 20, paddingVertical: 9,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  fpFooterAgent: { flexDirection: "row", alignItems: "center" },
  fpFooterPhoto: { width: 32, height: 32, borderRadius: 16, marginRight: 9, borderWidth: 1.5, borderColor: GOLD },
  fpFooterName: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  fpFooterPhone: { fontSize: 7, color: GOLD, marginTop: 1.5 },
  fpDisclaimer: { fontSize: 5.5, color: "rgba(255,255,255,0.4)", textAlign: "right", maxWidth: "52%" },
});

// ─── Prop types ──────────────────────────────────────────────────────────────
interface Plan {
  id: number; name: string; type: string; sqft: string; bal: string;
  wasPrice: string; nowPrice: string; saved: string; psf: string;
  floorPlanUrl: string;
}
interface Deposit { label: string; percent: string; amount: string; note: string; }
interface Agent { name: string; title: string; languages: string; phone: string; email: string; website: string; photo: string; }
interface IncentiveBanner { headline: string; items: string[]; }

interface CampaignPDFProps {
  projectName: string; tagline: string; address: string; city: string;
  developerName: string; buildingType: string; completionDate: string;
  awards: string; heroImage: string | null;
  fromPrice: string; fromPsf: string; vipBadge: string;
  plans: Plan[]; planCount: number;
  deposits: Deposit[];
  incentiveBanner: IncentiveBanner;
  agent: Agent;
}

const parseMoney = (s: string) => parseFloat(String(s).replace(/[^0-9.]/g, "")) || 0;

// ─── One-Pager: auto-height page (no fixed LETTER height → no whitespace) ────
function OnePagerPage({ p }: { p: CampaignPDFProps }) {
  const plans = p.plans.slice(0, p.planCount);
  const prices = plans.map(pl => parseMoney(pl.nowPrice)).filter(n => n > 0);
  const lowestPrice = prices.length ? Math.min(...prices) : 0;
  const lowestPlan = plans.find(pl => parseMoney(pl.nowPrice) === lowestPrice) || plans[0];
  const displayPrice = lowestPrice > 0 ? `$${lowestPrice.toLocaleString()}` : (p.fromPrice || "—");
  const displayPsf = lowestPlan?.psf || p.fromPsf || "";

  const regularDeposits = p.deposits.slice(0, -1);
  const mortgageStep = p.deposits[p.deposits.length - 1];
  const basePrice = parseMoney(plans[0]?.nowPrice || p.fromPrice);
  const calcAmt = (pctStr: string) => {
    const pct = parseMoney(pctStr);
    if (!basePrice || isNaN(pct) || pct <= 0) return null;
    return `$${Math.round(basePrice * pct / 100).toLocaleString()}`;
  };

  const colCount = plans.length || 1;
  const bigFont = colCount <= 2;

  return (
    // wrap={false} prevents react-pdf from adding a blank continuation page
    <Page size={[PW, 792]} style={s.page} wrap={false}>
      {/* ── HERO ── */}
      <View style={s.hero}>
        {p.heroImage ? (
          <PDFImage src={p.heroImage} style={s.heroImg} />
        ) : (
          <View style={s.heroFallback} />
        )}
        <View style={s.heroOverlay} />
        <PDFImage src={LOGO_WHITE} style={s.heroLogo} />
        <View style={s.heroBadgeWrap}>
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeText}>{p.vipBadge || "VIP EXCLUSIVE PRICING"}</Text>
          </View>
          
        </View>
        <View style={s.heroBottomLeft}>
          <View style={s.heroAccent} />
          <Text style={s.heroProjectName}>{p.projectName || "Project Name"}</Text>
          <Text style={s.heroDeveloper}>{p.tagline || ""}</Text>
          <Text style={s.heroAddress}>{p.address}{p.city ? ` · ${p.city}` : ""}</Text>
        </View>
        <View style={s.heroBottomRight}>
          <Text style={s.heroFromLabel}>Starting From</Text>
          <Text style={s.heroPrice}>{displayPrice}</Text>
          {displayPsf ? <Text style={s.heroPsf}>{displayPsf}</Text> : null}
        </View>
      </View>

      {/* ── INFO BAR ── */}
      <View style={s.infoBar}>
        {[
          { val: p.address || "—", lbl: "Address" },
          { val: p.buildingType || "—", lbl: "Construction" },
          { val: p.completionDate || "—", lbl: "Completion" },
          { val: p.developerName || "—", lbl: "Developer" },
        ].map((cell, i) => (
          <View key={i} style={[s.infoCell, i % 2 === 0 ? s.infoCellEven : s.infoCellOdd]}>
            <Text style={s.infoCellVal}>{cell.val}</Text>
            <Text style={s.infoCellLbl}>{cell.lbl}</Text>
          </View>
        ))}
      </View>

      {/* ── INCENTIVE BANNER ── */}
      {p.incentiveBanner.items.some(x => x) && (
        <View style={s.incentiveBanner}>
          <View style={s.incentiveHeadline}>
            <View style={s.incentiveHeadlineLine} />
            <Text style={s.incentiveHeadlineText}>{p.incentiveBanner.headline}</Text>
            <View style={s.incentiveHeadlineLine} />
          </View>
          <View style={s.incentivePills}>
            {p.incentiveBanner.items.filter(Boolean).map((item, i) => (
              <View key={i} style={s.incentivePill}>
                <Text style={s.incentivePillText}>
                  <Text style={s.incentivePillCheck}>✓ </Text>{item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── FLOOR PLANS HEADER ── */}
      <View style={s.plansHeader}>
        <Text style={s.plansHeaderText}>FLOOR PLANS · VIP PRICING</Text>
        <Text style={s.plansHeaderSub}>Limited Time · Subject to Change</Text>
      </View>

      {/* ── PLAN CARDS ── */}
      <View style={s.planGrid}>
        {plans.map((plan, i) => (
          <View key={plan.id} style={[s.planCard, i % 2 === 0 ? s.planCardEven : s.planCardOdd]}>
            <View style={s.planBadge}>
              <Text style={s.planBadgeText}>{plan.name || "—"}</Text>
            </View>
            <Text style={s.planType}>{plan.type || "—"}</Text>
            <Text style={s.planSqft}>
              {plan.sqft || "—"} sqft{plan.bal ? ` + ${plan.bal} bal` : ""}
            </Text>
            <View style={s.planDivider} />
            <Text style={s.planWasLbl}>WAS</Text>
            <Text style={s.planWasPrice}>{plan.wasPrice || "—"}</Text>
            <View style={s.planDivider} />
            <Text style={s.planNowLbl}>NOW</Text>
            <Text style={bigFont ? s.planNowPriceLarge : s.planNowPrice}>{plan.nowPrice || "—"}</Text>
            {plan.saved ? (
              <View style={s.planSavingBar}>
                <Text style={s.planSavingText}>Save {plan.saved}</Text>
              </View>
            ) : null}
            <View style={s.planDivider} />
            <Text style={s.planPsfLbl}>Price per sq.ft.</Text>
            <Text style={s.planPsf}>{plan.psf || "—"}</Text>
          </View>
        ))}
      </View>

      {/* ── DEPOSIT STRUCTURE ── */}
      <View style={s.depositSection}>
        <View style={s.depositTitleRow}>
          <Text style={s.depositTitle}>Deposit Structure</Text>
          {basePrice > 0 && (
            <Text style={s.depositBasedOn}>Based on {plans[0]?.nowPrice || p.fromPrice}</Text>
          )}
        </View>
        <View style={s.depositRow}>
          {regularDeposits.map((d, i) => {
            const autoAmt = calcAmt(d.percent);
            const displayAmt = autoAmt || d.amount;
            return (
              <View key={i} style={s.depositCol}>
                <View style={s.depositCircle}>
                  <Text style={s.depositCircleNum}>{i + 1}</Text>
                </View>
                <Text style={s.depositPct}>{d.percent || "—"}</Text>
                {displayAmt ? <Text style={s.depositAmt}>{displayAmt}</Text> : null}
                <Text style={s.depositLabel}>{d.label}</Text>
              </View>
            );
          })}
          {mortgageStep && (
            <View style={s.depositCol}>
              <View style={s.depositCircleFinal}>
                <Text style={{ fontSize: 12 }}>🏠</Text>
              </View>
              <Text style={s.depositCompletionLbl}>Completion</Text>
              <Text style={s.depositMortgage}>Mortgage begins</Text>
              <Text style={s.depositDate}>{mortgageStep.label}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── FOOTER ── */}
      <View style={s.footer}>
        <View style={s.footerLeft}>
          <PDFImage src={p.agent.photo} style={s.footerPhoto} />
          <View>
            <Text style={s.footerName}>{p.agent.name}</Text>
            <Text style={s.footerTitle}>{p.agent.title}</Text>
            <Text style={s.footerLang}>{p.agent.languages}</Text>
          </View>
        </View>
        <View style={s.footerDivider} />
        <View style={s.footerRight}>
          <Text style={s.footerPhone}>{p.agent.phone}</Text>
          <Text style={s.footerEmail}>{p.agent.email}</Text>
          <Text style={s.footerWeb}>{p.agent.website}</Text>
        </View>
      </View>

      {/* ── DISCLAIMER ── */}
      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>
          E&OE. Prices subject to change without notice. Limited time offer. Not intended to solicit buyers currently under contract.
        </Text>
      </View>
    </Page>
  );
}

// ─── Floor-plan page: fixed 612×792 so the image fills ALL available space ───
function FloorPlanPage({ plan, projectName, agent }: { plan: Plan; projectName: string; agent: Agent }) {
  // Header ~62pt + strip ~38pt + footer ~50pt + disclaimer = ~150pt fixed chrome
  // Image area = 792 - 150 = 642pt, minus 32pt padding = 610pt usable
  return (
    <Page size={[PW, 792]} style={s.fpPage} wrap={false}>
      {/* Header */}
      <View style={s.fpHeader}>
        <View style={s.fpHeaderLeft}>
          <PDFImage src={LOGO_WHITE} style={s.fpLogo} />
          <View style={s.fpHeaderDivider} />
          <Text style={s.fpHeaderLabel}>Floor Plan · {projectName || "Project"}</Text>
        </View>
        <View style={s.fpBadge}>
          <Text style={s.fpBadgeText}>{plan.name || "PLAN"}</Text>
        </View>
      </View>

      {/* Details strip */}
      <View style={s.fpStrip}>
        {plan.type   ? <View style={s.fpStripCell}><Text style={s.fpStripLbl}>Unit Type</Text><Text style={s.fpStripVal}>{plan.type}</Text></View>   : null}
        {plan.sqft   ? <View style={s.fpStripCell}><Text style={s.fpStripLbl}>Interior</Text><Text style={s.fpStripVal}>{plan.sqft} sqft</Text></View> : null}
        {plan.bal    ? <View style={s.fpStripCell}><Text style={s.fpStripLbl}>Balcony</Text><Text style={s.fpStripVal}>{plan.bal} sqft</Text></View>   : null}
        {plan.nowPrice ? <View style={s.fpStripCell}><Text style={s.fpStripLbl}>Price</Text><Text style={s.fpStripVal}>{plan.nowPrice}</Text></View>   : null}
        {plan.psf    ? <View style={s.fpStripCell}><Text style={s.fpStripLbl}>Price/sqft</Text><Text style={s.fpStripVal}>{plan.psf}</Text></View>     : null}
      </View>

      {/* Floor plan image — flex:1 fills all remaining vertical space */}
      <View style={s.fpImageWrap}>
        {plan.floorPlanUrl && plan.floorPlanUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
          <PDFImage src={plan.floorPlanUrl} style={s.fpImage} />
        ) : (
          <Text style={{ fontSize: 10, color: MUTED, textAlign: "center", marginTop: 20 }}>
            Floor plan image not available
          </Text>
        )}
      </View>

      {/* Footer */}
      <View style={s.fpFooter}>
        <View style={s.fpFooterAgent}>
          <PDFImage src={agent.photo} style={s.fpFooterPhoto} />
          <View>
            <Text style={s.fpFooterName}>{agent.name}</Text>
            <Text style={s.fpFooterPhone}>{agent.phone}</Text>
          </View>
        </View>
        <Text style={s.fpDisclaimer}>
          E&OE. Floor plans subject to change. Not to scale.
        </Text>
      </View>
    </Page>
  );
}

// ─── Exported document ───────────────────────────────────────────────────────
export function CampaignPDFDocument({ data, agent }: { data: CampaignPDFProps & { agent: Agent }; agent: Agent }) {
  const plans = data.plans.slice(0, data.planCount);
  const floorPlanPlans = plans.filter(
    p => p.floorPlanUrl && p.floorPlanUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i)
  );

  return (
    <Document title={data.projectName || "Campaign"} author="Presale Properties Group">
      <OnePagerPage p={data} />
      {floorPlanPlans.map(plan => (
        <FloorPlanPage key={plan.id} plan={plan} projectName={data.projectName} agent={agent} />
      ))}
    </Document>
  );
}
