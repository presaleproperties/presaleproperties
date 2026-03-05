import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
import logoWhiteAsset from "@/assets/logo-white.png";
import { useNavigate, useParams } from "react-router-dom";
import html2canvas from "html2canvas";
// jsPDF removed — using PNG export instead
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Building2, User, DollarSign, FileText, Sparkles, Download, Save, Upload,
  Plus, PlusCircle, Trash2, Image as ImageIcon, BookOpen, Layers, FileSpreadsheet,
  Wand2, Loader2, Search, ArrowLeft, LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Brand colours for pixel-accurate PDF preview ──────────────────────────
const C = {
  gold: "#B8963E", goldLight: "#D4AF6A", ink: "#111111", dark: "#1C1C1C",
  coal: "#2A2A2A", offWhite: "#F8F6F2", smoke: "#E8E4DC", panel: "#0d0d0d",
  textMuted: "#888", textFaint: "#555", green: "#16a34a", greenBg: "#dcfce7",
  greenBorder: "#166534", red: "#dc2626",
};

// ─── Pre-stored agents with headshots ──────────────────────────────────────
const PRESET_AGENTS = [
  {
    name: "UZAIR MUHAMMAD", title: "Founder & Presale Strategist",
    languages: "English · Punjabi · Hindi · Urdu", phone: "778-231-3592",
    email: "info@presaleproperties.com", website: "presaleproperties.com",
    photo: "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/team/1769974057981-u5d1e1f.jpg",
  },
  {
    name: "SARB GREWAL", title: "Presale Expert",
    languages: "English · Punjabi", phone: "+1 (778) 846-7065",
    email: "sarb@presaleproperties.com", website: "presaleproperties.com",
    photo: "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/team/1769973843032-qlc6fc.png",
  },
  {
    name: "RAVISH PASSY", title: "Presale Expert",
    languages: "English · Hindi", phone: "+1 (604) 349-9399",
    email: "ravish@presaleproperties.com", website: "presaleproperties.com",
    photo: "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/team/1769973742728-csckvf.png",
  },
];

// ─── Assignment types ───────────────────────────────────────────────────────
interface AssignmentFormState {
  listingId: string;
  projectName: string; unitNumber: string; address: string; city: string;
  unitType: string; interiorSqft: string; exteriorSqft: string;
  floorLevel: string; exposure: string;
  parkingStalls: string; hasLocker: boolean;
  estimatedCompletion: string;
  askingPrice: string; depositToLock: string;
  buyerAgentCommission: string;
  developerApprovalRequired: boolean;
  heroImage: string | null; description: string; shortDescription: string;
  floorPlanUrl: string | null;
  agentIdx: number;
}

const DEFAULT_ASSIGNMENT_STATE: AssignmentFormState = {
  listingId: "", projectName: "", unitNumber: "", address: "", city: "",
  unitType: "", interiorSqft: "", exteriorSqft: "",
  floorLevel: "", exposure: "",
  parkingStalls: "", hasLocker: false,
  estimatedCompletion: "",
  askingPrice: "", depositToLock: "",
  buyerAgentCommission: "",
  developerApprovalRequired: false,
  heroImage: null, description: "", shortDescription: "",
  floorPlanUrl: null,
  agentIdx: 0,
};

// ─── Types ─────────────────────────────────────────────────────────────────
interface Plan {
  id: number; name: string; type: string; sqft: string; bal: string;
  wasPrice: string; nowPrice: string; saved: string; psf: string;
  floorPlanUrl: string; // URL to downloadable floor plan PDF/image
}

interface Deposit {
  label: string; percent: string; amount: string; note: string;
}

interface IncentiveBanner {
  headline: string;
  items: string[];
}

interface FormState {
  projectName: string; tagline: string; address: string; city: string;
  developerName: string; buildingType: string; completionDate: string; awards: string;
  heroHeadline: string; heroSubheadline: string;
  infoBlock1Label: string; infoBlock1Value: string;
  infoBlock2Label: string; infoBlock2Value: string;
  infoBlock3Label: string; infoBlock3Value: string;
  planCount: number; plans: Plan[];
  deposits: Deposit[];
  fromPrice: string; fromPriceLabel: string; fromPsf: string; psfLabel: string;
  vipBadge: string;
  incentiveBanner: IncentiveBanner;
  agentIdx: number;
  heroImage: string | null;
  brochureUrl: string;    // downloadable brochure URL
  pricingSheetUrl: string; // downloadable pricing sheet URL
}

let _planId = 0;
const emptyPlan = (): Plan => ({
  id: ++_planId, name: "", type: "", sqft: "", bal: "",
  wasPrice: "", nowPrice: "", saved: "", psf: "", floorPlanUrl: "",
});

const DEFAULT_STATE: FormState = {
  projectName: "", tagline: "", address: "", city: "", developerName: "",
  buildingType: "", completionDate: "", awards: "",
  heroHeadline: "", heroSubheadline: "",
  infoBlock1Label: "ADDRESS", infoBlock1Value: "",
  infoBlock2Label: "TYPE", infoBlock2Value: "",
  infoBlock3Label: "COMPLETION", infoBlock3Value: "",
  planCount: 4,
  plans: [emptyPlan(), emptyPlan(), emptyPlan(), emptyPlan()],
  deposits: [
    { label: "WITHIN 7 DAYS", percent: "2.5%", amount: "~ $10,000", note: "Reserve your unit" },
    { label: "3 MONTHS", percent: "2.5%", amount: "~ $10,000", note: "Secure your investment" },
    { label: "SEPT 30 2026", percent: "5%", amount: "~ $20,000", note: "Mid-term milestone" },
    { label: "SUMMER 2028", percent: "—", amount: "Mortgage", note: "At completion" },
  ],
  fromPrice: "", fromPriceLabel: "Starting Price", fromPsf: "", psfLabel: "Price Per Sq. Ft.",
  vipBadge: "Private Offering",
  incentiveBanner: {
    headline: "LIMITED TIME INCENTIVES",
    items: ["Up to $80,000 in savings", "Reduced deposit structure", "Free AC upgrade included"],
  },
  agentIdx: 0,
  heroImage: null,
  brochureUrl: "",
  pricingSheetUrl: "",
};

// ─── Logo assets ────────────────────────────────────────────────────────────
const LOGO_WHITE_URL = logoWhiteAsset;

/** Full white logo — for hero overlay / dark backgrounds */
function LogoWhite({ height = 44 }: { height?: number }) {
  return (
    <img
      src={LOGO_WHITE_URL}
      alt="Presale Properties Group"
      style={{
        height,
        width: "auto",
        objectFit: "contain",
        display: "block",
        
      }}
    />
  );
}

/** Compact logo for footer corner — same white asset, smaller */
function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <img src={LOGO_WHITE_URL} alt="Presale Properties Group" style={{ height: size * 1.4, width: "auto", objectFit: "contain", display: "block" }} />
  );
}

// ─── PREVIEW COMPONENT ──────────────────────────────────────────────────────
function OnePagerPreview({ data, onScreenshot, screenshottingPage }: {
  data: FormState;
  onScreenshot?: (pageIdx: number) => void;
  screenshottingPage?: number | null;
}) {
  const PAGE_W = 612;
  const agent = PRESET_AGENTS[data.agentIdx] || PRESET_AGENTS[0];
  const plans = data.plans.slice(0, data.planCount);
  const colCount = plans.length || 1;
  // Column width as percentage — flexbox, not grid
  const colW = `${(100 / colCount).toFixed(4)}%`;

  // ── Deposit helpers ────────────────────────────────────────────────────────
  const parsePrice = (s: string) => parseFloat(String(s).replace(/[^0-9.]/g, "")) || 0;
  const lowestNowPrice = (() => {
    const prices = plans.map(p => parsePrice(p.nowPrice)).filter(n => n > 0);
    return prices.length ? Math.min(...prices) : 0;
  })();
  const lowestPlan = plans.find(p => parsePrice(p.nowPrice) === lowestNowPrice) || plans[0];
  const displayPrice = lowestNowPrice > 0 ? `$${lowestNowPrice.toLocaleString()}` : (data.fromPrice || "$—");
  const lowestPsf = (() => {
    const psfNums = plans.map(p => parsePrice(p.psf)).filter(n => n > 0);
    if (!psfNums.length) return data.fromPsf || "";
    return `$${Math.min(...psfNums).toLocaleString()}/sqft`;
  })();
  const displayPsf = lowestPsf || data.fromPsf || "";
  const baseDepositPrice = parsePrice(plans[0]?.nowPrice || data.fromPrice || "");
  const calcAmt = (pct: string) => {
    const n = parseFloat(String(pct).replace(/[^0-9.]/g, ""));
    if (!baseDepositPrice || isNaN(n)) return null;
    return `$${Math.round(baseDepositPrice * n / 100).toLocaleString()}`;
  };
  const regularDeposits = data.deposits.slice(0, -1);
  const mortgageStep = data.deposits[data.deposits.length - 1];

  // ── Shared text style helper ──────────────────────────────────────────────
  const T = {
    label: { color: C.gold, fontSize: 6, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: 2 },
    labelSm: { color: C.gold, fontSize: 5.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const },
    muted: { color: C.textMuted, fontSize: 6, lineHeight: 1.35 },
  };

  const PageBtn = ({ pageIdx, label }: { pageIdx: number; label: string }) =>
    onScreenshot ? (
      <button
        onClick={() => onScreenshot(pageIdx)}
        disabled={screenshottingPage != null}
        title={`Download ${label}`}
        style={{
          position: "absolute", top: 8, right: -88,
          width: 80, display: "flex", flexDirection: "column", alignItems: "center",
          gap: 4, padding: "6px 8px", borderRadius: 8, border: "1px solid hsl(var(--border))",
          background: "hsl(var(--background))", cursor: "pointer", opacity: screenshottingPage != null ? 0.4 : 1,
          fontSize: 9, fontWeight: 600, color: "hsl(var(--foreground))",
          fontFamily: "inherit",
        }}
      >
        {screenshottingPage === pageIdx
          ? <span style={{ fontSize: 11 }}>⏳</span>
          : <span style={{ fontSize: 13 }}>⬇</span>}
        {label}
      </button>
    ) : null;

  return (
    <>
    {/* ══════════════════════════════════════════════════════════════════════
        ONE-PAGER  —  612 px wide, no CSS Grid anywhere (html2canvas safe)
    ══════════════════════════════════════════════════════════════════════ */}
    <div style={{ position: "relative", display: "block" }}>
    <PageBtn pageIdx={0} label="1-Pager" />
    <div
      id="one-pager-preview"
      data-page-export="one-pager"
      data-page-label="one-pager"
      className="pdf-page"
      style={{
        width: PAGE_W,
        background: C.offWhite,
        fontFamily: "'Plus Jakarta Sans', 'DM Sans', Arial, sans-serif",
        display: "block",
        boxShadow: "0 8px 80px rgba(0,0,0,0.5)",
        // ⚠️  No overflow:hidden — it clips content in html2canvas
      }}
    >

      {/* ── 1. HERO ────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", width: "100%", height: 320, background: "#08080a", display: "block" }}>
        {data.heroImage
          ? <img src={data.heroImage} alt="" crossOrigin="anonymous" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", opacity: 0.88 }} />
          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(150deg,#0a1628,#1a2a40,#0d1f35)" }} />
        }
        {/* Multi-layer gradient for depth and legibility */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.0) 25%, rgba(0,0,0,0.55) 58%, rgba(0,0,0,0.97) 100%)" }} />
        {/* Subtle side vignette */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.2) 100%)" }} />


        {/* top-left logo */}
        <div style={{ position: "absolute", top: -36, left: 18 }}>
          <LogoWhite height={141} />
        </div>

        {/* HEADLINE — bottom aligned */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 26px 16px" }}>
          {/* gold accent bar with glow */}
          <div style={{ width: 44, height: 3, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, borderRadius: 2, marginBottom: 12, boxShadow: `0 0 18px rgba(184,150,62,0.7), 0 0 6px rgba(184,150,62,0.4)` }} />

          {/* Main headline */}
          <div style={{
            color: "#fff", fontSize: 50, fontWeight: 900, lineHeight: 0.93,
            letterSpacing: "-0.03em",
            textShadow: "0 2px 40px rgba(0,0,0,1), 0 1px 6px rgba(0,0,0,0.9)",
            marginBottom: 11, wordBreak: "break-word",
          }}>
            {data.heroHeadline || data.projectName || "Project Name"}
          </div>

          {/* Subheadline + price row */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
            {(data.heroSubheadline || data.developerName) && (
              <div style={{ color: C.goldLight, fontSize: 15, fontWeight: 600, letterSpacing: "0.05em", textShadow: "0 2px 12px rgba(0,0,0,0.9)", lineHeight: 1.2 }}>
                {data.heroSubheadline || `by ${data.developerName}`}
              </div>
            )}
            {/* Price block — right aligned with refined border */}
            <div style={{ textAlign: "right", flexShrink: 0, borderLeft: `1px solid rgba(184,150,62,0.35)`, paddingLeft: 14 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 7.5, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 4 }}>STARTING FROM</div>
              <div style={{ color: "#fff", fontSize: 32, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em", textShadow: "0 2px 24px rgba(0,0,0,0.9)" }}>
                {displayPrice}
              </div>
              {displayPsf && (
                <div style={{ color: C.goldLight, fontSize: 10.5, marginTop: 4, fontWeight: 700, letterSpacing: "0.04em" }}>{displayPsf}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. INFO BAR ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", width: "100%", background: "linear-gradient(180deg,#161616 0%,#111 100%)", borderBottom: `1px solid rgba(184,150,62,0.15)` }}>
        {[
          { val: data.infoBlock1Value || data.address || "—", lbl: data.infoBlock1Label || "ADDRESS" },
          { val: data.infoBlock2Value || data.buildingType || "—", lbl: data.infoBlock2Label || "TYPE" },
          { val: data.infoBlock3Value || data.completionDate || "—", lbl: data.infoBlock3Label || "COMPLETION" },
        ].map((s, i) => (
          <div key={i} style={{ flex: "1 1 33.33%", padding: "10px 16px", borderLeft: i > 0 ? `1px solid rgba(255,255,255,0.07)` : undefined, boxSizing: "border-box" }}>
            <div style={{ color: C.gold, fontSize: 7.5, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 4 }}>{s.lbl}</div>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, lineHeight: 1.25, wordBreak: "break-word", letterSpacing: "0.01em" }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── 3. INCENTIVE BANNER ─────────────────────────────────────────────── */}
      {data.incentiveBanner.items.some(x => x) && (
        <div style={{ background: "linear-gradient(135deg,#0d4a22 0%,#166534 40%,#1a7a3c 60%,#0d4a22 100%)", padding: "10px 22px 12px", boxSizing: "border-box" as const, width: "100%", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.25))" }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: "#fff", letterSpacing: "0.22em", textTransform: "uppercase" as const }}>
              {data.incentiveBanner.headline}
            </span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(255,255,255,0.25))" }} />
          </div>
          <div style={{ textAlign: "center" as const }}>
            {data.incentiveBanner.items.filter(Boolean).map((item, i) => (
              <div key={i} style={{
                display: "inline-block",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 24, padding: "5px 15px",
                fontSize: 11, fontWeight: 600, color: "#fff",
                letterSpacing: "0.02em", whiteSpace: "nowrap" as const, margin: "3px 4px",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
              }}>
                <span style={{ color: "#7dffaa", fontWeight: 900 }}>✓ </span>{item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. FLOOR PLANS HEADER ───────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#0e0e0e 0%,#181818 100%)", borderTop: `2px solid ${C.gold}`, padding: "8px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 3, height: 16, background: `linear-gradient(180deg,${C.goldLight},${C.gold})`, borderRadius: 2, flexShrink: 0 }} />
          <span style={{ color: "#fff", fontSize: 11.5, fontWeight: 900, letterSpacing: "0.18em" }}>FLOOR PLANS</span>
          
        </div>
        <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 8, fontStyle: "italic", letterSpacing: "0.04em" }}>Limited Time · Subject to Change</span>
      </div>

      {/* ── 5. PLAN CARDS ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", width: "100%", background: "#f5f3ef" }}>
        {plans.map((plan, i) => {
          const nowFontSize = colCount === 1 ? 28 : colCount === 2 ? 23 : 19;
          return (
            <div key={plan.id} style={{
              flex: `0 0 ${colW}`, width: colW,
              background: i % 2 === 0 ? "#ffffff" : "#faf9f6",
              borderLeft: i > 0 ? `1px solid #e8e4dc` : undefined,
              padding: "13px 14px 12px",
              display: "flex", flexDirection: "column", boxSizing: "border-box",
              borderTop: `3px solid ${C.gold}`,
            }}>
              {/* Plan badge + sqft row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{
                  display: "inline-block",
                  background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                  color: "#111", borderRadius: 3, padding: "3px 10px",
                  fontSize: 9, fontWeight: 900, letterSpacing: "0.12em",
                  boxShadow: `0 1px 6px rgba(184,150,62,0.3)`,
                }}>{plan.name || "—"}</div>
                {plan.sqft && <span style={{ color: "#999", fontSize: 8, letterSpacing: "0.04em" }}>{plan.sqft} sqft{plan.bal ? ` + ${plan.bal}` : ""}</span>}
              </div>

              {/* Unit type */}
              <div style={{ color: "#1a1a1a", fontSize: 12.5, fontWeight: 700, lineHeight: 1.2, marginBottom: 8, letterSpacing: "0.01em" }}>{plan.type || "—"}</div>

              {/* Price block */}
              <div style={{ background: "linear-gradient(135deg,#111,#1c1c1c)", borderRadius: 7, padding: "10px 12px", marginBottom: 8, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
                {plan.wasPrice && (
                  <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12.5, fontWeight: 500, textDecoration: "line-through", marginBottom: 4, letterSpacing: "0.01em" }}>{plan.wasPrice}</div>
                )}
                <div style={{ color: "#fff", fontSize: nowFontSize, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.01em" }}>{plan.nowPrice || "—"}</div>
                {plan.saved && (
                  <div style={{ marginTop: 8, background: "linear-gradient(135deg,#15803d,#16a34a)", borderRadius: 4, padding: "6px 10px", textAlign: "center", boxShadow: "0 1px 8px rgba(22,163,74,0.3)" }}>
                    <span style={{ color: "#fff", fontSize: 13, fontWeight: 800, letterSpacing: "0.02em" }}>Save {plan.saved}</span>
                  </div>
                )}
              </div>

              {/* PSF row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid #e8e4dc`, paddingTop: 7 }}>
                <span style={{ color: "#aaa", fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>Price / sqft</span>
                <span style={{ color: C.gold, fontSize: 11.5, fontWeight: 800, letterSpacing: "0.02em" }}>{plan.psf || "—"}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 6. DEPOSIT STRUCTURE ────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(180deg,#0e0e0e 0%,#161616 100%)", borderTop: `2px solid ${C.gold}` }}>
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 24px 0" }}>
          <div style={{ width: 3, height: 16, background: `linear-gradient(180deg,${C.goldLight},${C.gold})`, borderRadius: 2, flexShrink: 0 }} />
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 900, letterSpacing: "0.18em" }}>DEPOSIT</span>
          <span style={{ color: C.gold, fontSize: 13, fontWeight: 900, letterSpacing: "0.18em" }}>STRUCTURE</span>
          {baseDepositPrice > 0 && (
            <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 8.5, marginLeft: "auto", letterSpacing: "0.04em" }}>Based on {plans[0]?.nowPrice || data.fromPrice}</span>
          )}
        </div>

        {/* Timeline nodes */}
        <div style={{ display: "flex", width: "100%", alignItems: "stretch", padding: "13px 16px 15px", gap: 0 }}>
          {regularDeposits.map((d, i) => {
            const displayAmt = calcAmt(d.percent) || d.amount;
            const totalCols = regularDeposits.length + (mortgageStep ? 1 : 0);
            const isLast = i === regularDeposits.length - 1 && !mortgageStep;
            return (
              <div key={i} style={{ flex: `1 1 ${(100/totalCols).toFixed(2)}%`, position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {i > 0 && <div style={{ position: "absolute", top: 18, left: 0, width: "50%", height: 1.5, background: `linear-gradient(to right, rgba(184,150,62,0.15), rgba(184,150,62,0.55))` }} />}
                {!isLast && <div style={{ position: "absolute", top: 18, right: 0, width: "50%", height: 1.5, background: `linear-gradient(to right, rgba(184,150,62,0.55), rgba(184,150,62,0.15))` }} />}

                {/* Node */}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.goldLight}, ${C.gold})`,
                  boxShadow: `0 0 18px rgba(184,150,62,0.45), 0 2px 6px rgba(0,0,0,0.4)`,
                  fontSize: 14, fontWeight: 900, color: "#111",
                  lineHeight: "36px", textAlign: "center",
                  position: "relative", zIndex: 1, flexShrink: 0, marginBottom: 9,
                }}>{i + 1}</div>

                {/* Card */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(184,150,62,0.25)", borderRadius: 7, padding: "9px 10px", width: "82%", textAlign: "center", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                  <div style={{ color: C.gold, fontSize: 16, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>{d.percent || "—"}</div>
                  {displayAmt && <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1, marginBottom: 4 }}>{displayAmt}</div>}
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9.5, lineHeight: 1.25, letterSpacing: "0.03em" }}>{d.label}</div>
                </div>
              </div>
            );
          })}

          {/* Completion / mortgage node */}
          {mortgageStep && (() => {
            const totalCols = regularDeposits.length + 1;
            return (
              <div style={{ flex: `1 1 ${(100/totalCols).toFixed(2)}%`, position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ position: "absolute", top: 18, left: 0, width: "50%", height: 1.5, background: `linear-gradient(to right, rgba(184,150,62,0.15), rgba(184,150,62,0.55))` }} />
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "#141414", border: `2px solid ${C.gold}`,
                  boxShadow: `0 0 18px rgba(184,150,62,0.35), 0 2px 6px rgba(0,0,0,0.4)`,
                  fontSize: 17, lineHeight: "32px", textAlign: "center",
                  position: "relative", zIndex: 1, flexShrink: 0, marginBottom: 9,
                }}>🏠</div>
                <div style={{ background: `linear-gradient(135deg, rgba(184,150,62,0.12), rgba(184,150,62,0.04))`, border: `1px solid rgba(184,150,62,0.45)`, borderRadius: 7, padding: "9px 10px", width: "82%", textAlign: "center", boxShadow: "inset 0 1px 0 rgba(184,150,62,0.1)" }}>
                  <div style={{ color: C.gold, fontSize: 14, fontWeight: 900, lineHeight: 1, marginBottom: 4, letterSpacing: "0.06em" }}>COMPLETION</div>
                  <div style={{ color: "#fff", fontSize: 12.5, fontWeight: 700, lineHeight: 1, marginBottom: 4 }}>Mortgage</div>
                  <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 9.5, lineHeight: 1.25 }}>{mortgageStep.label}</div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── 7. AGENT FOOTER ─────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#0e0e0e,#161616)", borderTop: `2px solid ${C.gold}`, padding: "12px 22px", display: "flex", alignItems: "center", gap: 16 }}>
        {agent.photo ? (
          <img src={agent.photo} crossOrigin="anonymous" alt={agent.name} style={{ width: 58, height: 58, borderRadius: "50%", border: `2px solid ${C.gold}`, flexShrink: 0, objectFit: "cover", objectPosition: "center 15%", display: "block", boxShadow: `0 0 14px rgba(184,150,62,0.3)` }} />
        ) : (
          <div style={{ width: 58, height: 58, borderRadius: "50%", border: `2px solid ${C.gold}`, flexShrink: 0, background: "#222" }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#fff", fontSize: 14.5, fontWeight: 900, letterSpacing: "0.06em", lineHeight: 1 }}>{agent.name}</div>
          <div style={{ color: "#888", fontSize: 10.5, marginTop: 5, lineHeight: 1, letterSpacing: "0.02em" }}>{agent.title}</div>
          {agent.languages && <div style={{ color: C.gold, fontSize: 9.5, marginTop: 4, lineHeight: 1, letterSpacing: "0.04em" }}>{agent.languages}</div>}
        </div>
        <div style={{ width: 1, height: 44, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ color: "#fff", fontSize: 17, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.01em" }}>{agent.phone}</div>
          <div style={{ color: "#888", fontSize: 10.5, marginTop: 5, lineHeight: 1 }}>{agent.email}</div>
          <div style={{ color: C.gold, fontSize: 10.5, marginTop: 4, lineHeight: 1, letterSpacing: "0.03em" }}>{agent.website}</div>
        </div>
      </div>

      {data.awards && (
        <div style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, padding: "7px 0", textAlign: "center" }}>
          <span style={{ color: "#111", fontSize: 9.5, fontWeight: 900, letterSpacing: "0.2em" }}>🏆 {data.awards}</span>
        </div>
      )}

      {/* Legal disclaimer */}
      <div style={{ background: "#0a0a0a", padding: "7px 24px" }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 7.5, lineHeight: 1.5, letterSpacing: "0.02em" }}>
          E&OE. Prices, incentives and floor plans are subject to change without notice. Limited time offer. This is not intended to solicit buyers currently under contract with another agent.
        </div>
      </div>
    </div>
    </div>{/* end relative wrapper for one-pager */}

    {/* ══════════════════════════════════════════════════════════════════════
        FLOOR PLAN PAGES  —  612 × 792 px fixed, flex column
    ══════════════════════════════════════════════════════════════════════ */}
    {plans.filter(p => p.floorPlanUrl).map((plan, fpIdx) => (
      <div key={`fp-wrapper-${plan.id}`} style={{ position: "relative", display: "block", marginTop: 40 }}>
        <PageBtn pageIdx={fpIdx + 1} label={`Plan ${fpIdx + 1}${plan.name ? ` · ${plan.name}` : ""}`} />
        <div
          key={`fp-${plan.id}`}
          data-page-export={`floor-plan-${fpIdx}`}
          data-page-label={`floor-plan-${fpIdx + 1}-${plan.name || fpIdx + 1}`}
          className="floor-plan-page pdf-page"
          style={{
            width: PAGE_W, height: 792, minHeight: 792, maxHeight: 792,
            background: "#f8f7f4",
            fontFamily: "'Plus Jakarta Sans', 'DM Sans', Arial, sans-serif",
            boxShadow: "0 12px 80px rgba(0,0,0,0.55)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}
        >
        {/* Header bar — redesigned premium */}
        <div style={{ background: "linear-gradient(135deg,#0a0a0a,#161616)", borderBottom: `3px solid ${C.gold}`, flexShrink: 0, overflow: "hidden" }}>
          {/* Top row: logo | project name + plan badge | savings */}
          <div style={{ padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
              <LogoWhite height={90} />
            </div>


            {/* Right: savings box */}
            {plan.saved && (
              <div style={{ background: "linear-gradient(135deg,#15803d,#16a34a)", borderRadius: 6, padding: "7px 16px", boxShadow: "0 2px 16px rgba(22,163,74,0.4)", textAlign: "center", flexShrink: 0 }}>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 6.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 2 }}>You Save</div>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 900, letterSpacing: "0.01em", lineHeight: 1 }}>{plan.saved}</div>
              </div>
            )}
          </div>

          {/* Specs strip */}
          <div style={{ background: "rgba(0,0,0,0.35)", padding: "9px 20px", display: "flex", gap: 0, alignItems: "stretch", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              plan.type     && { lbl: "UNIT TYPE",   val: plan.type },
              plan.sqft     && { lbl: "INTERIOR",    val: `${plan.sqft} sqft` },
              plan.bal      && { lbl: "BALCONY",     val: `${plan.bal} sqft` },
              plan.nowPrice && { lbl: "PRICE",       val: plan.nowPrice },
              plan.wasPrice && { lbl: "WAS",         val: plan.wasPrice, strike: true },
              plan.psf      && { lbl: "PRICE/SQFT",  val: plan.psf },
            ].filter(Boolean).map((item: any, si) => (
              <div key={si} style={{ paddingLeft: si > 0 ? 20 : 0, borderLeft: si > 0 ? `1px solid rgba(255,255,255,0.08)` : undefined, marginLeft: si > 0 ? 20 : 0 }}>
                <div style={{ color: C.gold, fontSize: 6.5, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 3 }}>{item.lbl}</div>
                <div style={{ color: item.strike ? "rgba(255,255,255,0.45)" : "#fff", fontSize: 11.5, fontWeight: 800, letterSpacing: "0.01em", textDecoration: item.strike ? "line-through" : "none" }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Floor plan image — fills remaining vertical space */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 20px", background: "#fff" }}>
          <img
            src={plan.floorPlanUrl}
            crossOrigin="anonymous"
            alt={`Floor plan ${plan.name}`}
            style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain", display: "block", margin: "0 auto" }}
          />
        </div>

        {/* Footer */}
        <div style={{ background: "linear-gradient(135deg,#0e0e0e,#161616)", borderTop: `2px solid ${C.gold}`, padding: "11px 22px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          {agent.photo
            ? <img src={agent.photo} crossOrigin="anonymous" alt={agent.name} style={{ width: 46, height: 46, borderRadius: "50%", border: `2px solid ${C.gold}`, objectFit: "cover", objectPosition: "center 15%", display: "block", flexShrink: 0, boxShadow: `0 0 12px rgba(184,150,62,0.3)` }} />
            : <div style={{ width: 46, height: 46, borderRadius: "50%", border: `2px solid ${C.gold}`, background: "#222", flexShrink: 0 }} />
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#fff", fontSize: 12, fontWeight: 900, letterSpacing: "0.06em", lineHeight: 1 }}>{agent.name}</div>
            <div style={{ color: "#888", fontSize: 9.5, marginTop: 4, lineHeight: 1 }}>{agent.title}</div>
            {agent.languages && <div style={{ color: C.gold, fontSize: 8.5, marginTop: 3, lineHeight: 1, letterSpacing: "0.04em" }}>{agent.languages}</div>}
          </div>
          <div style={{ width: 1, height: 34, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 900, lineHeight: 1 }}>{agent.phone}</div>
            <div style={{ color: "#888", fontSize: 9.5, marginTop: 4, lineHeight: 1 }}>{agent.email}</div>
            <div style={{ color: C.gold, fontSize: 9, marginTop: 3, lineHeight: 1 }}>{agent.website}</div>
          </div>
          <div style={{ width: 1, height: 34, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 7.5, lineHeight: 1.45, letterSpacing: "0.02em" }}>E&OE. Floor plans subject to change.<br/>Not to scale.</div>
          </div>
        </div>
      </div>
      </div>
    ))}
  </>
  );
}

// ─── PDF PAGE RENDERER ────────────────────────────────────────────────────────
function PdfPageRenderer({ url, style }: { url: string; style?: React.CSSProperties }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fetch as ArrayBuffer to avoid CORS issues with Supabase storage
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        if (cancelled || !canvasRef.current) return;

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        if (cancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale: 2.5 });
        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (e) {
        console.error("PDF render error", e);
        if (!cancelled) setRenderError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  if (renderError) return (
    <div style={{ textAlign: "center", padding: 24, color: "#888", fontSize: 11 }}>
      Unable to render PDF preview.{" "}
      <a href={url} target="_blank" rel="noreferrer" style={{ color: "#b8860b" }}>Open PDF ↗</a>
    </div>
  );

  return (
    <canvas
      ref={canvasRef}
      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block", ...style }}
    />
  );
}


// ─── ASSIGNMENT ONE-PAGER PREVIEW ───────────────────────────────────────────
function AssignmentOnePagerPreview({ data, onScreenshot, screenshottingPage }: {
  data: AssignmentFormState;
  onScreenshot?: (pageIdx: number) => void;
  screenshottingPage?: number | null;
}) {
  const PAGE_W = 612;
  const agent = PRESET_AGENTS[data.agentIdx] || PRESET_AGENTS[0];

  const fmtPrice = (s: string) => {
    const n = parseFloat(String(s).replace(/[^0-9.]/g, ""));
    if (!n) return s || "—";
    return `$${n.toLocaleString()}`;
  };

  const PageBtn = ({ pageIdx, label }: { pageIdx: number; label: string }) =>
    onScreenshot ? (
      <button
        onClick={() => onScreenshot(pageIdx)}
        disabled={screenshottingPage != null}
        title={`Download ${label}`}
        style={{
          position: "absolute", top: 8, right: -88,
          width: 80, display: "flex", flexDirection: "column", alignItems: "center",
          gap: 4, padding: "6px 8px", borderRadius: 8, border: "1px solid hsl(var(--border))",
          background: "hsl(var(--background))", cursor: "pointer", opacity: screenshottingPage != null ? 0.4 : 1,
          fontSize: 9, fontWeight: 600, color: "hsl(var(--foreground))",
          fontFamily: "inherit",
        }}
      >
        {screenshottingPage === pageIdx
          ? <span style={{ fontSize: 11 }}>⏳</span>
          : <span style={{ fontSize: 13 }}>⬇</span>}
        {label}
      </button>
    ) : null;

  const unitTypeLabel = (t: string) => {
    const m: Record<string, string> = {
      studio: "Studio", "1bed": "1 Bedroom", "1bed_den": "1 Bed + Den",
      "2bed": "2 Bedroom", "2bed_den": "2 Bed + Den", "3bed": "3 Bedroom", penthouse: "Penthouse",
    };
    return m[t] || t || "—";
  };

  const detailItems = [
    { label: "Parking", value: data.parkingStalls || "—" },
    { label: "Locker", value: data.hasLocker ? "Included" : "Not Included" },
    { label: "Completion", value: data.estimatedCompletion || "TBD" },
    { label: "Dev. Approval", value: data.developerApprovalRequired ? "Required" : "Not Required" },
    { label: "Buyer's Comm.", value: data.buyerAgentCommission || "—" },
  ];

  return (<>
    <div style={{ position: "relative", display: "block" }}>
      <PageBtn pageIdx={0} label="Assignment" />
      <div
        id="assignment-pager-preview"
        data-page-export="assignment-pager"
        data-page-label="assignment-one-pager"
        className="pdf-page"
        style={{
          width: PAGE_W,
          background: C.offWhite,
          fontFamily: "'Plus Jakarta Sans', 'DM Sans', Arial, sans-serif",
          display: "block",
          boxShadow: "0 8px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* ── 1. HERO ──────────────────────────────────────────────────── */}
        <div style={{ position: "relative", width: "100%", height: 300, background: "#08080a", display: "block" }}>
          {data.heroImage
            ? <img src={data.heroImage} alt="" crossOrigin="anonymous" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", opacity: 0.88 }} />
            : <div style={{ width: "100%", height: "100%", background: "linear-gradient(150deg,#0a1628,#1a2a40,#0d1f35)" }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.0) 25%, rgba(0,0,0,0.55) 58%, rgba(0,0,0,0.97) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.2) 100%)" }} />

          {/* Logo top-left */}
          <div style={{ position: "absolute", top: -36, left: 18 }}>
            <LogoWhite height={141} />
          </div>

          {/* Bottom: project name + pill + unit */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 26px 18px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "inline-block", background: C.gold, color: "#fff", fontSize: 7.5, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 3, marginBottom: 8 }}>
                  Assignment of Contract
                </div>
                <div style={{ color: "#ffffff", fontSize: 28, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.01em", textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}>
                  {data.projectName || "Project Name"}
                </div>
                {data.address && (
                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 9, marginTop: 5, letterSpacing: "0.04em" }}>
                    {data.address}{data.city ? `, ${data.city}` : ""}
                  </div>
                )}
              </div>
              {data.unitNumber && (
                <div style={{ textAlign: "right", paddingBottom: 2 }}>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 7.5, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 3 }}>Unit</div>
                  <div style={{ color: C.gold, fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{data.unitNumber}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. PRICE BAR ─────────────────────────────────────────────── */}
        <div style={{ background: C.dark, display: "flex", borderBottom: `1px solid ${C.coal}` }}>
          <div style={{ flex: 1, padding: "16px 26px", borderRight: `1px solid ${C.coal}` }}>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 5 }}>Asking Price</div>
            <div style={{ color: C.gold, fontSize: 26, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1 }}>
              {fmtPrice(data.askingPrice)}
            </div>
          </div>
          <div style={{ flex: 1, padding: "16px 26px" }}>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 5 }}>Deposit to Lock</div>
            <div style={{ color: "#ffffff", fontSize: 26, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1 }}>
              {fmtPrice(data.depositToLock)}
            </div>
          </div>
        </div>

        {/* ── 3. SPECS STRIP ───────────────────────────────────────────── */}
        <div style={{ background: C.coal, display: "flex", borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
          {[
            { label: "Unit Type", value: unitTypeLabel(data.unitType) },
            { label: "Interior", value: data.interiorSqft ? `${data.interiorSqft} sqft` : "—" },
            { label: "Floor Level", value: data.floorLevel || "—" },
            { label: "Exposure", value: data.exposure || "—" },
          ].map((item, i, arr) => (
            <div key={i} style={{
              flex: 1, padding: "11px 16px", textAlign: "center",
              borderRight: i < arr.length - 1 ? `1px solid rgba(255,255,255,0.08)` : undefined,
            }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 6.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>{item.label}</div>
              <div style={{ color: "#ffffff", fontSize: 11, fontWeight: 700, lineHeight: 1 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* ── 4. DETAILS GRID ──────────────────────────────────────────── */}
        <div style={{ background: C.offWhite, padding: "18px 26px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
            {detailItems.map((item, i) => (
              <div key={i} style={{
                width: "33.333%", padding: "8px 12px 8px 0",
                borderBottom: i < 3 ? `1px solid ${C.smoke}` : undefined,
              }}>
                <div style={{ color: C.textFaint, fontSize: 6.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 3 }}>{item.label}</div>
                <div style={{ color: C.ink, fontSize: 10.5, fontWeight: 700 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. DESCRIPTION ───────────────────────────────────────────── */}
        {(data.shortDescription || data.description) && (
          <div style={{ background: C.smoke, padding: "14px 26px", borderTop: `1px solid rgba(0,0,0,0.07)` }}>
            <div style={{ color: C.textFaint, fontSize: 6.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>About This Project</div>
            <div style={{ color: C.ink, fontSize: 9, lineHeight: 1.6 }}>{data.shortDescription || data.description}</div>
          </div>
        )}

        {/* ── 6. AGENT FOOTER ──────────────────────────────────────────── */}
        <div style={{ background: "linear-gradient(135deg,#0e0e0e,#161616)", borderTop: `2.5px solid ${C.gold}`, padding: "11px 22px", display: "flex", alignItems: "center", gap: 14 }}>
          {agent.photo
            ? <img src={agent.photo} crossOrigin="anonymous" alt={agent.name} style={{ width: 54, height: 54, borderRadius: "50%", border: `2px solid ${C.gold}`, objectFit: "cover", objectPosition: "center 15%", display: "block", flexShrink: 0, boxShadow: `0 0 12px rgba(184,150,62,0.3)` }} />
            : <div style={{ width: 54, height: 54, borderRadius: "50%", border: `2px solid ${C.gold}`, background: "#222", flexShrink: 0 }} />
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#fff", fontSize: 12, fontWeight: 900, letterSpacing: "0.06em", lineHeight: 1 }}>{agent.name}</div>
            <div style={{ color: "#888", fontSize: 9.5, marginTop: 4, lineHeight: 1 }}>{agent.title}</div>
            {agent.languages && <div style={{ color: C.gold, fontSize: 8.5, marginTop: 3, lineHeight: 1, letterSpacing: "0.04em" }}>{agent.languages}</div>}
          </div>
          <div style={{ width: 1, height: 34, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 900, lineHeight: 1 }}>{agent.phone}</div>
            <div style={{ color: "#888", fontSize: 9.5, marginTop: 4, lineHeight: 1 }}>{agent.email}</div>
            <div style={{ color: C.gold, fontSize: 9, marginTop: 3, lineHeight: 1 }}>{agent.website}</div>
          </div>
          <div style={{ width: 1, height: 34, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 7.5, lineHeight: 1.45, letterSpacing: "0.02em" }}>E&OE. Information subject to change.<br/>Not to be used as an offer to purchase.</div>
          </div>
        </div>
      </div>
    </div>

    {/* ══════════════════════════════════════════════════════════════════════
        FLOOR PLAN PAGE 2  —  shown when floorPlanUrl is available
    ══════════════════════════════════════════════════════════════════════ */}
    {data.floorPlanUrl && (
      <div style={{ position: "relative", display: "block", marginTop: 40 }}>
        <PageBtn pageIdx={1} label="Floor Plan" />
        <div
          id="assignment-floor-plan-preview"
          data-page-export="assignment-floor-plan"
          data-page-label="assignment-floor-plan"
          className="pdf-page"
          style={{
            width: PAGE_W, height: 792, minHeight: 792, maxHeight: 792,
            background: "#fff",
            fontFamily: "'Plus Jakarta Sans', 'DM Sans', Arial, sans-serif",
            display: "flex", flexDirection: "column",
            boxShadow: "0 8px 80px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header bar */}
          <div style={{ background: C.dark, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: `2px solid ${C.gold}` }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 6.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Unit Floor Plan</div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 800, letterSpacing: "0.02em" }}>{data.projectName || "Project Name"}{data.unitNumber ? ` · Unit ${data.unitNumber}` : ""}</div>
            </div>
            <LogoWhite height={28} />
          </div>

          {/* Spec pill */}
          <div style={{ background: C.offWhite, padding: "8px 24px", flexShrink: 0, borderBottom: `1px solid ${C.smoke}` }}>
            <div style={{ display: "inline-flex", alignItems: "center", background: C.gold, color: "#fff", fontSize: 7, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", padding: "3px 12px", borderRadius: 3 }}>
              {data.unitType ? `${data.unitType}` : "Floor Plan"}
              {data.interiorSqft ? ` · ${data.interiorSqft} sqft Interior` : ""}
              {data.exteriorSqft ? ` · ${data.exteriorSqft} sqft Outdoor` : ""}
            </div>
          </div>

          {/* Floor plan image */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 20px", background: "#fff", overflow: "hidden" }}>
            {(() => {
              const cleanUrl = data.floorPlanUrl.split("?")[0];
              const isPdf = /\.pdf$/i.test(cleanUrl);
              return isPdf
                ? <PdfPageRenderer url={data.floorPlanUrl} style={{ maxHeight: 580 }} />
                : <img src={data.floorPlanUrl} crossOrigin="anonymous" alt="Floor Plan" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />;
            })()}
          </div>


          {/* Agent footer */}
          <div style={{ background: "linear-gradient(135deg,#0e0e0e,#161616)", borderTop: `2.5px solid ${C.gold}`, padding: "10px 22px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            {agent.photo
              ? <img src={agent.photo} crossOrigin="anonymous" alt={agent.name} style={{ width: 46, height: 46, borderRadius: "50%", border: `2px solid ${C.gold}`, objectFit: "cover", objectPosition: "center 15%", display: "block", flexShrink: 0 }} />
              : <div style={{ width: 46, height: 46, borderRadius: "50%", border: `2px solid ${C.gold}`, background: "#222", flexShrink: 0 }} />
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontSize: 11, fontWeight: 900, letterSpacing: "0.06em", lineHeight: 1 }}>{agent.name}</div>
              <div style={{ color: "#888", fontSize: 8.5, marginTop: 3 }}>{agent.title}</div>
              {agent.languages && <div style={{ color: C.gold, fontSize: 8, marginTop: 2, letterSpacing: "0.04em" }}>{agent.languages}</div>}
            </div>
            <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 900, lineHeight: 1 }}>{agent.phone}</div>
              <div style={{ color: "#888", fontSize: 9, marginTop: 3 }}>{agent.email}</div>
              <div style={{ color: C.gold, fontSize: 8.5, marginTop: 2 }}>{agent.website}</div>
            </div>
            <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 7, lineHeight: 1.45, letterSpacing: "0.02em" }}>E&OE. Information subject to change.<br/>Not to be used as an offer to purchase.</div>
            </div>
          </div>
        </div>
      </div>
    )}
  </>);
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────
interface ProjectOption {
  id: string; name: string; city: string; neighborhood: string;
  address: string | null; developer_name: string | null;
  starting_price: number | null; price_range: string | null;
  deposit_structure: string | null; deposit_percent: number | null;
  incentives: string | null; featured_image: string | null;
  completion_year: number | null; completion_month: number | null;
  project_type: string; unit_mix: string | null;
  highlights: string[] | null; amenities: string[] | null;
  brochure_files: string[] | null; pricing_sheets: string[] | null;
  floorplan_files: string[] | null;
}

export default function AdminCampaignBuilder() {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId?: string }>();
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [projectSearchFocused, setProjectSearchFocused] = useState(false);
  const [extractingPlan, setExtractingPlan] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [screenshottingPage, setScreenshottingPage] = useState<number | null>(null);

  // ── Assignment mode ─────────────────────────────────────────────────────
  const [campaignType, setCampaignType] = useState<"presale" | "assignment">("presale");
  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormState>(DEFAULT_ASSIGNMENT_STATE);
  const [assignmentListings, setAssignmentListings] = useState<any[]>([]);
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState("");
  const [assignmentSearchFocused, setAssignmentSearchFocused] = useState(false);

  // ── Screenshot-based Export ─────────────────────────────────────────────
  // Helper: screenshot one element and download as PNG
  const screenshotEl = useCallback(async (el: HTMLElement, filename: string) => {
    const SCALE = 3;

    // Scroll element into view so it's fully rendered in viewport
    el.scrollIntoView({ block: "start" });
    // Wait for layout + paint to settle after scroll
    await new Promise<void>(r => setTimeout(r, 120));

    const imgs = Array.from(el.querySelectorAll<HTMLImageElement>("img"));
    await Promise.all(imgs.map(img =>
      img.complete ? Promise.resolve() :
      new Promise<void>(r => { img.onload = img.onerror = () => r(); })
    ));
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));

    const rect = el.getBoundingClientRect();
    const canvas = await html2canvas(el, {
      scale: SCALE, useCORS: true, allowTaint: false, logging: false,
      backgroundColor: "#ffffff",
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.round(rect.width),
      windowHeight: Math.round(rect.height),
    });
    canvas.toBlob(blob => {
      if (!blob) { toast.error("Export failed"); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success(`Downloaded ${filename}`);
    }, "image/png");
  }, []);

  // Download ALL pages as separate PNG files
  const generatePDF = useCallback(async () => {
    setPdfGenerating(true);
    try {
      const slug = (campaignType === "assignment" ? (assignmentForm.projectName || "assignment") : (form.projectName || "campaign")).toLowerCase().replace(/\s+/g, "-");
      const pageEls = Array.from(document.querySelectorAll<HTMLElement>("[data-page-export]"));
      if (pageEls.length === 0) { toast.error("No pages found to export"); return; }
      for (let i = 0; i < pageEls.length; i++) {
        const label = pageEls[i].getAttribute("data-page-label") || `page-${i + 1}`;
        await screenshotEl(pageEls[i], `${slug}-${label}.png`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Export failed");
    } finally {
      setPdfGenerating(false);
    }
  }, [form, assignmentForm, campaignType, screenshotEl]);

  // Screenshot a single page by index (for per-page button)
  const screenshotPage = useCallback(async (pageIndex: number) => {
    setScreenshottingPage(pageIndex);
    try {
      const pageEls = Array.from(document.querySelectorAll<HTMLElement>("[data-page-export]"));
      const el = pageEls[pageIndex];
      if (!el) return;
      const slug = (campaignType === "assignment" ? (assignmentForm.projectName || "assignment") : (form.projectName || "campaign")).toLowerCase().replace(/\s+/g, "-");
      const label = el.getAttribute("data-page-label") || `page-${pageIndex + 1}`;
      await screenshotEl(el, `${slug}-${label}.png`);
    } finally {
      setScreenshottingPage(null);
    }
  }, [form, assignmentForm, campaignType, screenshotEl]);



  // Fetch projects + load template if editing
  useEffect(() => {
    const init = async () => {
      // Load projects
      const { data: projData } = await supabase
        .from("presale_projects")
        .select("id, name, city, neighborhood, address, developer_name, starting_price, price_range, deposit_structure, deposit_percent, incentives, featured_image, completion_year, completion_month, project_type, unit_mix, highlights, amenities, brochure_files, pricing_sheets, floorplan_files")
        .eq("is_published", true)
        .order("name");
      if (projData) setProjects(projData as ProjectOption[]);

      // Load assignment listings
      const { data: listingData } = await (supabase as any)
        .from("listings")
        .select("id, title, project_name, unit_number, unit_type, interior_sqft, exterior_sqft, floor_level, exposure, parking, has_locker, estimated_completion, assignment_price, deposit_to_lock, buyer_agent_commission, developer_approval_required, description, address, city, featured_image, floor_plan_url, floor_plan_name, project_id, presale_projects(short_description)")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (listingData) setAssignmentListings(listingData.map((l: any) => ({
        ...l,
        short_description: l.presale_projects?.short_description || "",
      })));

      // Load template if editing existing
      if (templateId && templateId !== "new") {
        const { data: tmpl } = await supabase
          .from("campaign_templates" as any)
          .select("*")
          .eq("id", templateId)
          .single();
        if (tmpl) {
          const t = tmpl as any;
          setTemplateName(t.name || "");
          if (t.form_data) setForm(t.form_data as FormState);
        }
      }

      setLoading(false);
    };
    init();
  }, [templateId]);

  const set = useCallback((key: keyof FormState, val: any) => setForm(f => ({ ...f, [key]: val })), []);

  // Parse price/sqft strings robustly (handles $1,234,567 etc.)
  const parseMoney = (s: string) => parseFloat(String(s).replace(/[^0-9.]/g, "")) || 0;

  // Recalculate psf + saved for a plan, and sync fromPsf if idx === 0
  const calcPlan = (plan: Plan): Plan => {
    const nowNum = parseMoney(plan.nowPrice);
    const wasNum = parseMoney(plan.wasPrice);
    const sqftNum = parseMoney(plan.sqft);
    const updated = { ...plan };
    // Auto-calc saved: only when was > now > 0; clear it if wasPrice is empty or invalid
    if (wasNum > nowNum && nowNum > 0) {
      updated.saved = `$${(wasNum - nowNum).toLocaleString()}`;
    } else if (!plan.wasPrice || wasNum === 0) {
      updated.saved = ""; // clear auto-saved when wasPrice removed
    }
    if (nowNum > 0 && sqftNum > 0) updated.psf = `$${Math.round(nowNum / sqftNum).toLocaleString()}/sqft`;
    return updated;
  };

  const setPlan = (idx: number, key: keyof Plan, val: any) => {
    setForm(f => {
      const plans = f.plans.map((p, i) => i === idx ? calcPlan({ ...p, [key]: val }) : p);
      const plan0 = plans[0];
      const psf0 = plan0?.psf || "";
      return { ...f, plans, fromPsf: psf0 ? psf0 : f.fromPsf };
    });
  };

  const setDeposit = (idx: number, key: keyof Deposit, val: string) => {
    setForm(f => {
      const deposits = f.deposits.map((d, i) => i === idx ? { ...d, [key]: val } : d);
      return { ...f, deposits };
    });
  };

  const addDeposit = () => {
    setForm(f => {
      // Insert a new empty deposit before the last item (mortgage/completion step)
      const last = f.deposits[f.deposits.length - 1];
      const rest = f.deposits.slice(0, -1);
      return { ...f, deposits: [...rest, { label: "NEW STAGE", percent: "2.5%", amount: "", note: "" }, last] };
    });
  };

  const removeDeposit = (idx: number) => {
    setForm(f => {
      const isLast = idx === f.deposits.length - 1;
      if (isLast) return f; // never remove the Completion/Mortgage step
      if (f.deposits.length <= 2) return f; // keep at least 1 regular + 1 completion
      const deposits = f.deposits.filter((_, i) => i !== idx);
      return { ...f, deposits };
    });
  };

  const setIncentiveItem = (idx: number, val: string) => {
    setForm(f => {
      const items = [...f.incentiveBanner.items];
      items[idx] = val;
      return { ...f, incentiveBanner: { ...f.incentiveBanner, items } };
    });
  };

  const addIncentiveItem = () => {
    setForm(f => ({
      ...f,
      incentiveBanner: { ...f.incentiveBanner, items: [...f.incentiveBanner.items, ""] },
    }));
  };

  const removeIncentiveItem = (idx: number) => {
    setForm(f => ({
      ...f,
      incentiveBanner: { ...f.incentiveBanner, items: f.incentiveBanner.items.filter((_, i) => i !== idx) },
    }));
  };

  const handleHeroUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set("heroImage", ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const fmt = (n: number | null) => n ? `$${n.toLocaleString()}` : "";
    const completionDate = project.completion_month && project.completion_year
      ? `${["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][project.completion_month]} ${project.completion_year}`
      : project.completion_year ? String(project.completion_year) : "";

    const projectType = project.project_type === "condo" ? "Condominium"
      : project.project_type === "townhome" ? "Townhome"
      : project.project_type === "single_family" ? "Single Family"
      : project.project_type || "";

    setForm(f => ({
      ...f,
      projectName: project.name,
      tagline: project.developer_name ? `by ${project.developer_name}` : "",
      heroHeadline: project.name,
      heroSubheadline: project.developer_name ? `by ${project.developer_name}` : "",
      address: project.address || "",
      city: `${project.neighborhood}, ${project.city}`,
      developerName: project.developer_name || "",
      buildingType: projectType,
      completionDate,
      infoBlock1Label: "ADDRESS", infoBlock1Value: project.address || `${project.neighborhood}, ${project.city}`,
      infoBlock2Label: "TYPE", infoBlock2Value: projectType,
      infoBlock3Label: "COMPLETION", infoBlock3Value: completionDate,
      fromPrice: fmt(project.starting_price),
      fromPsf: "",
      heroImage: project.featured_image || null,
      // Auto-fill docs from project if available
      brochureUrl: project.brochure_files?.[0] || f.brochureUrl,
      pricingSheetUrl: project.pricing_sheets?.[0] || f.pricingSheetUrl,
    }));

    toast.success(`Loaded "${project.name}" — fill in plans & incentives`);
  };

  const handleAssignmentSelect = (listingId: string) => {
    const listing = assignmentListings.find((l: any) => l.id === listingId);
    if (!listing) return;

    setAssignmentForm({
      listingId,
      projectName: listing.project_name || listing.title || "",
      unitNumber: listing.unit_number || "",
      address: listing.address || "",
      city: listing.city || "",
      unitType: listing.unit_type || "",
      interiorSqft: listing.interior_sqft ? String(listing.interior_sqft) : "",
      exteriorSqft: listing.exterior_sqft ? String(listing.exterior_sqft) : "",
      floorLevel: listing.floor_level ? String(listing.floor_level) : "",
      exposure: listing.exposure || "",
      parkingStalls: listing.parking || "",
      hasLocker: !!listing.has_locker,
      estimatedCompletion: listing.estimated_completion || "",
      askingPrice: listing.assignment_price ? `$${Number(listing.assignment_price).toLocaleString()}` : "",
      depositToLock: listing.deposit_to_lock ? `$${Number(listing.deposit_to_lock).toLocaleString()}` : "",
      buyerAgentCommission: listing.buyer_agent_commission || "",
      developerApprovalRequired: !!listing.developer_approval_required,
      heroImage: listing.featured_image || null,
      description: listing.description || "",
      shortDescription: listing.short_description || "",
      floorPlanUrl: listing.floor_plan_url || null,
      agentIdx: assignmentForm.agentIdx,
    });

    setAssignmentSearchQuery(listing.project_name || listing.title || "");
    setAssignmentSearchFocused(false);
    toast.success(`Loaded "${listing.project_name || listing.title}" — review and export`);
  };

  const updatePlanCount = (count: number) => {
    setForm(f => {
      const plans = [...f.plans];
      while (plans.length < count) plans.push(emptyPlan());
      return { ...f, planCount: count, plans };
    });
  };

  const saveTemplate = async () => {
    const name = templateName || form.projectName || "Untitled Campaign";
    setSaving(true);
    try {
      if (templateId && templateId !== "new") {
        // Update existing
        const { error } = await supabase
          .from("campaign_templates" as any)
          .update({ name, project_name: form.projectName, form_data: form })
          .eq("id", templateId);
        if (error) throw error;
        toast.success("Template updated ✓");
      } else {
        // Create new
        const { data, error } = await supabase
          .from("campaign_templates" as any)
          .insert({ name, project_name: form.projectName, form_data: form })
          .select("id")
          .single();
        if (error) throw error;
        const newId = (data as any)?.id;
        toast.success(`Template "${name}" saved ✓`);
        if (newId) navigate(`/admin/campaign-builder/${newId}`, { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  // PDF generation is now handled by PDFDownloadLink (react-pdf/renderer)

  // ── Upload a file to storage and return public URL ──────────────────────
  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("listing-files").upload(path, file, { upsert: true });
    if (error) { toast.error(`Upload failed: ${error.message}`); return null; }
    const { data } = supabase.storage.from("listing-files").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "brochureUrl" | "pricingSheetUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Uploading…");
    const url = await uploadFile(file, "campaign-docs");
    toast.dismiss(toastId);
    if (url) { set(field, url); toast.success("Uploaded ✓"); }
  };

  const handlePlanFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Uploading floor plan…");
    const url = await uploadFile(file, "campaign-floorplans");
    toast.dismiss(toastId);
    if (!url) return;

    setPlan(idx, "floorPlanUrl", url);

    // Only attempt AI extraction on image files (not PDFs)
    if (file.type.startsWith("image/")) {
      setExtractingPlan(idx);
      toast.loading("Extracting plan info with AI…", { id: `extract-${idx}` });
      try {
        const { data, error } = await supabase.functions.invoke("extract-floorplan-data", {
          body: { imageUrl: url },
        });
        if (!error && data) {
          setForm(f => {
            const plans = f.plans.map((p, i) => {
              if (i !== idx) return p;
              const merged = {
                ...p,
                name: data.planName || p.name,
                type: data.unitType || p.type,
                sqft: data.interiorSqft ? String(data.interiorSqft) : p.sqft,
                bal: data.balconySqft ? String(data.balconySqft) : p.bal,
              };
              return calcPlan(merged);
            });
            const psf0 = plans[0]?.psf || "";
            return { ...f, plans, fromPsf: psf0 ? psf0 : f.fromPsf };
          });
          toast.success("AI extracted plan details ✓", { id: `extract-${idx}` });
        } else {
          toast.dismiss(`extract-${idx}`);
          toast.success("Floor plan uploaded ✓");
        }
      } catch {
        toast.dismiss(`extract-${idx}`);
        toast.success("Floor plan uploaded ✓");
      } finally {
        setExtractingPlan(null);
      }
    } else {
      toast.success("Floor plan uploaded ✓");
    }
  };

  // setPlanWithCalc is now just an alias for setPlan (which auto-calcs via calcPlan)
  const setPlanWithCalc = setPlan;



  return (
    <AdminLayout>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-root, #print-root * { visibility: visible !important; }
          #print-root {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 612pt !important;
            transform: none !important;
            gap: 0 !important;
          }
          #one-pager-preview {
            box-shadow: none !important;
            page-break-after: always;
          }
          .floor-plan-page {
            box-shadow: none !important;
            page-break-after: always;
            margin-top: 0 !important;
          }
          @page { size: letter; margin: 0; }
        }
      `}</style>

      <div className="flex flex-1 min-h-0 h-full">

          {/* ── LEFT PANEL ── */}
          <div className="w-[380px] min-w-[320px] max-w-[380px] border-r border-border bg-card flex flex-col min-h-0">

            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => navigate("/admin/campaign-builder")}
                  className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors shrink-0"
                  title="Back to Campaign Hub"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-sm tracking-tight truncate">
                    {templateId && templateId !== "new" ? (templateName || form.projectName || "Edit Campaign") : "New Campaign"}
                  </h1>
                  <button
                    onClick={() => navigate("/admin/campaign-builder")}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    <LayoutGrid className="h-2.5 w-2.5" />
                    Campaign Hub
                  </button>
                </div>
              </div>

              {/* Campaign type toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden mb-3">
                {(["presale", "assignment"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setCampaignType(type)}
                    className={cn(
                      "flex-1 py-1.5 text-[11px] font-semibold transition-colors",
                      campaignType === type
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {type === "presale" ? "Presale" : "Assignment"}
                  </button>
                ))}
              </div>

              {/* Conditional search */}
              {campaignType === "presale" ? (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search project name…"
                    value={projectSearchQuery}
                    onChange={e => setProjectSearchQuery(e.target.value)}
                    onFocus={() => setProjectSearchFocused(true)}
                    onBlur={() => setTimeout(() => setProjectSearchFocused(false), 150)}
                    className="h-9 pl-8 text-xs"
                  />
                  {projectSearchFocused && projectSearchQuery.length > 0 && (() => {
                    const filtered = projects
                      .filter(p => p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()))
                      .sort((a, b) => {
                        const q = projectSearchQuery.toLowerCase();
                        const aStart = a.name.toLowerCase().startsWith(q);
                        const bStart = b.name.toLowerCase().startsWith(q);
                        return aStart === bStart ? a.name.localeCompare(b.name) : aStart ? -1 : 1;
                      })
                      .slice(0, 8);
                    if (!filtered.length) return null;
                    return (
                      <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-lg shadow-lg overflow-hidden">
                        {filtered.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={() => {
                              handleProjectSelect(p.id);
                              setProjectSearchQuery(p.name);
                              setProjectSearchFocused(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors border-b border-border last:border-0"
                          >
                            <span className="font-medium">{p.name}</span>
                            {p.city && <span className="text-muted-foreground ml-1.5">· {p.city}</span>}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search assignment listing…"
                    value={assignmentSearchQuery}
                    onChange={e => setAssignmentSearchQuery(e.target.value)}
                    onFocus={() => setAssignmentSearchFocused(true)}
                    onBlur={() => setTimeout(() => setAssignmentSearchFocused(false), 150)}
                    className="h-9 pl-8 text-xs"
                  />
                  {assignmentSearchFocused && assignmentSearchQuery.length > 0 && (() => {
                    const q = assignmentSearchQuery.toLowerCase();
                    const filtered = assignmentListings
                      .filter((l: any) => (l.project_name || l.title || "").toLowerCase().includes(q))
                      .slice(0, 8);
                    if (!filtered.length) return (
                      <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-lg shadow-lg overflow-hidden">
                        <div className="px-3 py-2 text-xs text-muted-foreground">No published assignments found</div>
                      </div>
                    );
                    return (
                      <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-lg shadow-lg overflow-hidden">
                        {filtered.map((l: any) => (
                          <button
                            key={l.id}
                            type="button"
                            onMouseDown={() => handleAssignmentSelect(l.id)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors border-b border-border last:border-0"
                          >
                            <span className="font-medium">{l.project_name || l.title}</span>
                            {l.unit_number && <span className="text-primary ml-1.5">Unit {l.unit_number}</span>}
                            {l.city && <span className="text-muted-foreground ml-1.5">· {l.city}</span>}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

          {/* Tabs */}
            {campaignType === "assignment" ? (
              /* ── ASSIGNMENT LEFT PANEL ── */
              <Tabs defaultValue="unit" className="flex flex-col flex-1 min-h-0">
                <div className="border-b border-border overflow-x-auto scrollbar-none">
                  <TabsList className="h-auto p-0 bg-transparent rounded-none flex w-max min-w-full">
                    {[
                      { val: "unit", label: "Unit", icon: Building2 },
                      { val: "pricing", label: "Pricing", icon: DollarSign },
                      { val: "agent", label: "Agent", icon: User },
                      { val: "files", label: "Photo", icon: ImageIcon },
                    ].map(tab => (
                      <TabsTrigger key={tab.val} value={tab.val} className="flex-shrink-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[11px] px-3.5 py-2.5 gap-1.5 whitespace-nowrap">
                        <tab.icon className="h-3 w-3" />{tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                {/* Action bar */}
                <div className="px-3 py-2 border-b border-border bg-card space-y-2">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Template Name</Label>
                      <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder={assignmentForm.projectName || "e.g. The Smith – Unit 1204"} className="h-8 text-xs" />
                    </div>
                    <Button onClick={generatePDF} disabled={pdfGenerating} className="h-8 text-xs gap-1.5 px-3 flex-shrink-0 mt-4">
                      {pdfGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      PNG
                    </Button>
                    <Button variant="outline" size="sm" onClick={saveTemplate} disabled={saving} className="h-8 text-xs gap-1 px-3 flex-shrink-0 mt-4">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {/* UNIT TAB */}
                  <TabsContent value="unit" className="mt-0 space-y-3">
                    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Unit Details</p>
                      {([
                        ["projectName", "Project Name"],
                        ["unitNumber", "Unit Number"],
                        ["address", "Street Address"],
                        ["city", "City"],
                        ["unitType", "Unit Type"],
                        ["interiorSqft", "Interior Sqft"],
                        ["exteriorSqft", "Exterior / Balcony Sqft"],
                        ["floorLevel", "Floor Level"],
                        ["exposure", "Exposure"],
                        ["parkingStalls", "Parking"],
                        ["estimatedCompletion", "Est. Completion"],
                      ] as [keyof AssignmentFormState, string][]).map(([key, label]) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
                          <Input value={String(assignmentForm[key] ?? "")} onChange={e => setAssignmentForm(f => ({ ...f, [key]: e.target.value }))} className="h-8 text-xs" />
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-1">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Locker Included</Label>
                        <button onClick={() => setAssignmentForm(f => ({ ...f, hasLocker: !f.hasLocker }))} className={cn("h-6 w-11 rounded-full transition-colors relative", assignmentForm.hasLocker ? "bg-primary" : "bg-muted")}>
                          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", assignmentForm.hasLocker ? "left-[22px]" : "left-0.5")} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Dev. Approval Required</Label>
                        <button onClick={() => setAssignmentForm(f => ({ ...f, developerApprovalRequired: !f.developerApprovalRequired }))} className={cn("h-6 w-11 rounded-full transition-colors relative", assignmentForm.developerApprovalRequired ? "bg-primary" : "bg-muted")}>
                          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", assignmentForm.developerApprovalRequired ? "left-[22px]" : "left-0.5")} />
                        </button>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Description</p>
                      <textarea value={assignmentForm.description} onChange={e => setAssignmentForm(f => ({ ...f, description: e.target.value }))} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none" placeholder="Optional unit description…" />
                    </div>
                  </TabsContent>
                  {/* PRICING TAB */}
                  <TabsContent value="pricing" className="mt-0 space-y-3">
                    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Pricing</p>
                      {([
                        ["askingPrice", "Asking Price", "$899,000"],
                        ["depositToLock", "Deposit to Lock", "$50,000"],
                        ["buyerAgentCommission", "Buyer's Agent Commission", "3% or $20,000"],
                      ] as [keyof AssignmentFormState, string, string][]).map(([key, label, ph]) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
                          <Input value={String(assignmentForm[key] ?? "")} onChange={e => setAssignmentForm(f => ({ ...f, [key]: e.target.value }))} className="h-8 text-xs" placeholder={ph} />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  {/* AGENT TAB */}
                  <TabsContent value="agent" className="mt-0 space-y-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Select Agent</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {PRESET_AGENTS.map((agent, idx) => (
                          <button key={idx} onClick={() => setAssignmentForm(f => ({ ...f, agentIdx: idx }))} className={cn("flex items-center gap-3 p-3 rounded-xl border text-left transition-all", assignmentForm.agentIdx === idx ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background hover:border-primary/30")}>
                            <img src={agent.photo} alt={agent.name} className="h-10 w-10 rounded-full object-cover border-2" style={{ borderColor: assignmentForm.agentIdx === idx ? C.gold : "transparent" }} />
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">{agent.name}</div>
                              <div className="text-[10px] text-muted-foreground">{agent.title}</div>
                              <div className="text-[10px] text-primary">{agent.phone}</div>
                            </div>
                            {assignmentForm.agentIdx === idx && <Badge className="ml-auto text-[9px] bg-primary text-primary-foreground">Selected</Badge>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  {/* PHOTO TAB */}
                  <TabsContent value="files" className="mt-0 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Hero Image</Label>
                      <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 p-4 cursor-pointer transition-colors">
                        <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setAssignmentForm(af => ({ ...af, heroImage: ev.target?.result as string })); r.readAsDataURL(f); }} className="hidden" />
                        {assignmentForm.heroImage ? (
                          <div className="w-full">
                            <img src={assignmentForm.heroImage} alt="hero" className="w-full h-24 object-cover rounded-lg" />
                            <p className="text-[10px] text-primary font-medium text-center mt-2">✓ Photo loaded · Click to replace</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Click to upload building photo</p>
                          </div>
                        )}
                      </label>
                    </div>
                    <p className="text-[10px] text-muted-foreground bg-muted/50 rounded-lg p-2">If no photo is uploaded, the listing's featured image will be used.</p>
                  </TabsContent>
                </div>
              </Tabs>
            ) : (
            <Tabs defaultValue="project" className="flex flex-col flex-1 min-h-0">
              <div className="border-b border-border overflow-x-auto scrollbar-none">
                <TabsList className="h-auto p-0 bg-transparent rounded-none flex w-max min-w-full">
                  {[
                    { val: "project", label: "Project", icon: Building2 },
                    { val: "plans", label: "Plans", icon: FileText },
                    { val: "incentives", label: "Incentives", icon: Sparkles },
                    { val: "deposit", label: "Deposit", icon: DollarSign },
                    { val: "agent", label: "Agent", icon: User },
                    { val: "files", label: "Files", icon: ImageIcon },
                  ].map(tab => (
                    <TabsTrigger
                      key={tab.val}
                      value={tab.val}
                      className="flex-shrink-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[11px] px-3.5 py-2.5 gap-1.5 whitespace-nowrap"
                    >
                      <tab.icon className="h-3 w-3" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* ── ACTION BAR (pinned below tabs, always visible) ── */}
              <div className="px-3 py-2 border-b border-border bg-card space-y-2">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Template Name</Label>
                    <Input
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                      placeholder={form.projectName || "e.g. Oakridge Q1 2026 VIP"}
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button
                    onClick={generatePDF}
                    disabled={pdfGenerating}
                    className="h-8 text-xs gap-1.5 px-3 flex-shrink-0"
                  >
                    {pdfGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    {pdfGenerating ? "Generating…" : "PNG"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveTemplate}
                    disabled={saving}
                    className="h-8 text-xs gap-1 px-3 flex-shrink-0"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {saving ? "Saving…" : templateId && templateId !== "new" ? "Update" : "Save"}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {1 + form.plans.slice(0, form.planCount).filter(p => p.floorPlanUrl).length} page{form.plans.slice(0, form.planCount).filter(p => p.floorPlanUrl).length > 0 ? "s" : ""} · {form.planCount} plan{form.planCount !== 1 ? "s" : ""} · {form.plans.slice(0, form.planCount).filter(p => p.floorPlanUrl).length} floor plan PDF{form.plans.slice(0, form.planCount).filter(p => p.floorPlanUrl).length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">

                {/* ─── TAB: Project ─── */}
                <TabsContent value="project" className="mt-0 space-y-3">
                  {/* Hero Text Section */}
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-primary">Hero Section Text</p>
                    {[
                      ["heroHeadline", "Hero Headline (big text)"],
                      ["heroSubheadline", "Hero Subheadline (gold text)"],
                    ].map(([key, label]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
                        <Input
                          value={String((form as any)[key] || "")}
                          onChange={e => set(key as keyof FormState, e.target.value)}
                          placeholder={key === "heroHeadline" ? (form.projectName || "e.g. The Smithe") : (form.developerName ? `by ${form.developerName}` : "e.g. by Bosa Development")}
                          className="h-8 text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Project Details */}
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Project Details</p>
                    {[
                      ["projectName", "Project Name"],
                      ["tagline", "Tagline"],
                      ["address", "Street Address"],
                      ["city", "City / Area"],
                      ["developerName", "Developer"],
                      ["buildingType", "Building Type"],
                      ["completionDate", "Completion Date"],
                      ["awards", "Awards"],
                      ["vipBadge", "VIP Badge Text"],
                    ].map(([key, label]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
                        <Input
                          value={String((form as any)[key] || "")}
                          onChange={e => set(key as keyof FormState, e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Info Bar Blocks */}
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Info Bar — 3 Blocks</p>
                    {[
                      ["infoBlock1Label", "infoBlock1Value", "Block 1"],
                      ["infoBlock2Label", "infoBlock2Value", "Block 2"],
                      ["infoBlock3Label", "infoBlock3Value", "Block 3"],
                    ].map(([labelKey, valueKey, title]) => (
                      <div key={labelKey} className="space-y-1">
                        <p className="text-[9px] font-semibold text-primary uppercase tracking-wider">{title}</p>
                        <div className="flex gap-2">
                          <div className="flex-1 space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Label</Label>
                            <Input
                              value={String((form as any)[labelKey] || "")}
                              onChange={e => set(labelKey as keyof FormState, e.target.value)}
                              placeholder="e.g. ADDRESS"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="flex-[2] space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Value</Label>
                            <Input
                              value={String((form as any)[valueKey] || "")}
                              onChange={e => set(valueKey as keyof FormState, e.target.value)}
                              placeholder="e.g. Willoughby, Langley"
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* ─── TAB: Plans & Pricing ─── */}
                <TabsContent value="plans" className="mt-0 space-y-4">
                  {/* Plan count selector */}
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Number of Plans</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map(n => (
                        <button
                          key={n}
                          onClick={() => updatePlanCount(n)}
                          className={cn(
                            "flex-1 h-9 rounded-lg text-xs font-semibold border transition-all",
                            form.planCount === n
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background border-border text-muted-foreground hover:border-primary/50"
                          )}
                        >
                          {n} Plan{n > 1 ? "s" : ""}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.plans.slice(0, form.planCount).map((plan, idx) => (
                    <div key={plan.id} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                      {/* ── Floor Plan Upload (TOP of card) ── */}
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Layers className="h-3 w-3" /> Floor Plan Image
                          {extractingPlan === idx && <Loader2 className="h-3 w-3 animate-spin text-primary ml-1" />}
                          {extractingPlan === idx && <span className="text-primary">Extracting with AI…</span>}
                        </Label>
                        {plan.floorPlanUrl ? (
                          <div className="relative rounded-lg border border-primary/30 bg-background overflow-hidden">
                            {plan.floorPlanUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                              <img src={plan.floorPlanUrl} alt={`Plan ${idx + 1}`} className="w-full max-h-40 object-contain" />
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="text-[10px] text-primary font-medium flex-1 truncate">Floor plan PDF ready</span>
                              </div>
                            )}
                            <div className="absolute top-1 right-1 flex gap-1">
                              <label className="flex items-center justify-center h-6 w-6 rounded bg-background/90 border border-border cursor-pointer hover:bg-muted transition-colors" title="Re-upload">
                                <input type="file" accept=".pdf,image/*" onChange={e => handlePlanFileUpload(e, idx)} className="hidden" />
                                <Upload className="h-3 w-3 text-muted-foreground" />
                              </label>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded bg-background/90 border border-border hover:bg-destructive/10" onClick={() => setPlan(idx, "floorPlanUrl", "")}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <label className={cn(
                            "flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors py-5",
                            extractingPlan === idx
                              ? "border-primary/50 bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-muted/30"
                          )}>
                            <input type="file" accept=".pdf,image/*" onChange={e => handlePlanFileUpload(e, idx)} className="hidden" />
                            {extractingPlan === idx ? (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <Upload className="h-4 w-4 text-muted-foreground" />
                                  <Wand2 className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium">Upload floor plan · AI auto-fills info</span>
                                <span className="text-[9px] text-muted-foreground/60">PDF or image accepted</span>
                              </>
                            )}
                          </label>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                          Plan {idx + 1}
                        </Badge>
                      </div>

                      {/* Plan detail fields */}
                      <div className="grid grid-cols-2 gap-2">
                        {(["name", "type", "sqft", "bal"] as const).map((key) => {
                          const labels: Record<string, string> = { name: "Plan Name", type: "Unit Type", sqft: "Interior sqft", bal: "Balcony sqft" };
                          return (
                            <div key={key} className="space-y-1">
                              <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">{labels[key]}</Label>
                              <Input
                                value={String(plan[key] || "")}
                                onChange={e => setPlanWithCalc(idx, key, e.target.value)}
                                className="h-7 text-xs"
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Pricing fields — auto-calc saved & psf */}
                      <div className="grid grid-cols-2 gap-2 border-t border-border pt-2">
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Was Price</Label>
                          <Input value={plan.wasPrice} onChange={e => setPlanWithCalc(idx, "wasPrice", e.target.value)} className="h-7 text-xs" placeholder="$599,000" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Now Price</Label>
                          <Input value={plan.nowPrice} onChange={e => setPlanWithCalc(idx, "nowPrice", e.target.value)} className="h-7 text-xs" placeholder="$549,000" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            Amount Saved <span className="text-primary/60 normal-case font-normal">(auto)</span>
                          </Label>
                          <Input value={plan.saved} onChange={e => setPlan(idx, "saved", e.target.value)} className="h-7 text-xs bg-primary/5 border-primary/20" placeholder="auto-calculated" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            Price/sqft <span className="text-primary/60 normal-case font-normal">(auto)</span>
                          </Label>
                          <Input value={plan.psf} onChange={e => setPlan(idx, "psf", e.target.value)} className="h-7 text-xs bg-primary/5 border-primary/20" placeholder="auto-calculated" />
                        </div>
                      </div>
                    </div>
                  ))}


                  {/* Offer details */}
                  <div className="pt-2 border-t border-border space-y-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Hero Pricing</p>
                    {[
                      ["fromPrice", "Starting Price"], ["fromPriceLabel", "Price Label"],
                      ["fromPsf", "From PSF"], ["psfLabel", "PSF Label"],
                    ].map(([key, label]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</Label>
                        <Input
                          value={String((form as any)[key] || "")}
                          onChange={e => set(key as keyof FormState, e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* ─── TAB: Incentives ─── */}
                <TabsContent value="incentives" className="mt-0 space-y-4">
                  <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold">Incentive Banner</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">This banner appears prominently between the hero stats and floor plans. Make it count!</p>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Banner Headline</Label>
                      <Input
                        value={form.incentiveBanner.headline}
                        onChange={e => setForm(f => ({ ...f, incentiveBanner: { ...f.incentiveBanner, headline: e.target.value } }))}
                        className="h-8 text-xs font-semibold"
                        placeholder="e.g. LIMITED TIME INCENTIVES"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Incentive Items</Label>
                      {form.incentiveBanner.items.map((item, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            value={item}
                            onChange={e => setIncentiveItem(idx, e.target.value)}
                            className="h-7 text-xs flex-1"
                            placeholder={`Incentive ${idx + 1}`}
                          />
                          {form.incentiveBanner.items.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeIncentiveItem(idx)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {form.incentiveBanner.items.length < 5 && (
                        <Button variant="outline" size="sm" className="w-full h-7 text-xs border-dashed" onClick={addIncentiveItem}>
                          <Plus className="h-3 w-3 mr-1" /> Add Incentive
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg p-3">
                    <strong>Per-plan savings</strong> are configured in the Plans tab (Was → Now → Saved fields). Both the banner above and the per-plan callouts will appear on the one-pager.
                  </div>
                </TabsContent>

                {/* ─── TAB: Deposit ─── */}
                <TabsContent value="deposit" className="mt-0 space-y-3">
                  {form.deposits.map((dep, idx) => {
                    const isLast = idx === form.deposits.length - 1;
                    return (
                      <div key={idx} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                            {isLast ? "Completion / Mortgage" : `Stage ${idx + 1}`}
                          </Badge>
                          {!isLast && (
                            <button
                              onClick={() => removeDeposit(idx)}
                              disabled={form.deposits.length <= 2}
                              className="text-destructive hover:text-destructive/80 disabled:opacity-30 transition-colors"
                              title="Remove this stage"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            ["label", "Stage Label"], ["percent", "Percentage"],
                            ["amount", "Dollar Amount"], ["note", "Note"],
                          ].map(([key, label]) => (
                            <div key={key} className="space-y-1">
                              <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</Label>
                              <Input
                                value={(dep as any)[key]}
                                onChange={e => setDeposit(idx, key as keyof Deposit, e.target.value)}
                                className="h-7 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={addDeposit}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/40 text-primary text-xs py-2 hover:bg-primary/5 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Deposit Stage
                  </button>
                </TabsContent>

                {/* ─── TAB: Agent ─── */}
                <TabsContent value="agent" className="mt-0 space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Select Agent</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {PRESET_AGENTS.map((agent, idx) => (
                        <button
                          key={idx}
                          onClick={() => set("agentIdx", idx)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                            form.agentIdx === idx
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-background hover:border-primary/30"
                          )}
                        >
                          <img
                            src={agent.photo}
                            alt={agent.name}
                            className="h-10 w-10 rounded-full object-cover border-2"
                            style={{ borderColor: form.agentIdx === idx ? C.gold : "transparent" }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{agent.name}</div>
                            <div className="text-[10px] text-muted-foreground">{agent.title}</div>
                            <div className="text-[10px] text-primary">{agent.phone}</div>
                          </div>
                          {form.agentIdx === idx && (
                            <Badge className="ml-auto text-[9px] bg-primary text-primary-foreground">Selected</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* ─── TAB: Files ─── */}
                <TabsContent value="files" className="mt-0 space-y-4">
                  {/* Hero Image */}
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Hero Image</Label>
                    <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 p-4 cursor-pointer transition-colors">
                      <input type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
                      {form.heroImage ? (
                        <div className="w-full">
                          <img src={form.heroImage} alt="hero" className="w-full h-24 object-cover rounded-lg" />
                          <p className="text-[10px] text-primary font-medium text-center mt-2">✓ Hero loaded · Click to replace</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Click to upload hero image</p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Brochure */}
                  <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3 text-primary" /> Brochure (QR code on PDF)
                    </Label>
                    {form.brochureUrl ? (
                      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-2 py-1.5">
                        <Download className="h-3 w-3 text-primary shrink-0" />
                        <span className="text-[10px] text-primary font-medium flex-1 truncate">Brochure ready</span>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive" onClick={() => set("brochureUrl", "")}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-2 py-1.5 cursor-pointer hover:border-primary/50 transition-colors">
                        <input type="file" accept=".pdf,image/*" onChange={e => handleDocUpload(e, "brochureUrl")} className="hidden" />
                        <Upload className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-[10px] text-muted-foreground">Upload brochure PDF</span>
                      </label>
                    )}
                    <Input value={form.brochureUrl} onChange={e => set("brochureUrl", e.target.value)} placeholder="Or paste URL…" className="h-7 text-xs" />
                  </div>

                  {/* Pricing Sheet */}
                  <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileSpreadsheet className="h-3 w-3 text-primary" /> Pricing Sheet (QR code on PDF)
                    </Label>
                    {form.pricingSheetUrl ? (
                      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-2 py-1.5">
                        <Download className="h-3 w-3 text-primary shrink-0" />
                        <span className="text-[10px] text-primary font-medium flex-1 truncate">Pricing sheet ready</span>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive" onClick={() => set("pricingSheetUrl", "")}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-2 py-1.5 cursor-pointer hover:border-primary/50 transition-colors">
                        <input type="file" accept=".pdf,image/*" onChange={e => handleDocUpload(e, "pricingSheetUrl")} className="hidden" />
                        <Upload className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-[10px] text-muted-foreground">Upload pricing sheet PDF</span>
                      </label>
                    )}
                    <Input value={form.pricingSheetUrl} onChange={e => set("pricingSheetUrl", e.target.value)} placeholder="Or paste URL…" className="h-7 text-xs" />
                  </div>

                  <p className="text-[10px] text-muted-foreground bg-muted/50 rounded-lg p-2">
                    Floor plans uploaded in the Plans tab will appear as additional pages at the end of the printed PDF.
                  </p>
                </TabsContent>
              </div>
            </Tabs>
            )}
          </div>

          {/* ── RIGHT PANEL: PREVIEW ── */}
          <div className="flex-1 bg-muted/20 flex flex-col overflow-hidden">
            <div className="px-5 py-2.5 border-b border-border flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                Live Preview — {campaignType === "assignment" ? "Assignment One-Pager (612px)" : "US Letter (612×792pt)"}
              </span>
              <Badge variant="outline" className="text-[9px]">Updates in real time</Badge>
            </div>

            <div ref={previewRef} className="flex-1 overflow-auto p-3">
              <div id="print-root" style={{ width: 700, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                {campaignType === "assignment"
                  ? <AssignmentOnePagerPreview data={assignmentForm} onScreenshot={screenshotPage} screenshottingPage={screenshottingPage} />
                  : <OnePagerPreview data={form} onScreenshot={screenshotPage} screenshottingPage={screenshottingPage} />
                }
              </div>
            </div>
          </div>
        </div>
    </AdminLayout>
  );
}
