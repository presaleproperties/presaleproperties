import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
  planCount: 4,
  plans: [emptyPlan(), emptyPlan(), emptyPlan(), emptyPlan()],
  deposits: [
    { label: "WITHIN 7 DAYS", percent: "2.5%", amount: "~ $10,000", note: "Reserve your unit" },
    { label: "3 MONTHS", percent: "2.5%", amount: "~ $10,000", note: "Secure your investment" },
    { label: "SEPT 30 2026", percent: "5%", amount: "~ $20,000", note: "Mid-term milestone" },
    { label: "SUMMER 2028", percent: "—", amount: "Mortgage", note: "At completion" },
  ],
  fromPrice: "", fromPriceLabel: "Starting Price", fromPsf: "", psfLabel: "Price Per Sq. Ft.",
  vipBadge: "VIP EXCLUSIVE PRICING",
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
const LOGO_WHITE_URL = "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/brand%2Flogo-white.png";

/** Full white logo — for hero overlay / dark backgrounds */
function LogoWhite({ height = 44 }: { height?: number }) {
  return (
    <img src={LOGO_WHITE_URL} alt="Presale Properties Group" style={{ height, width: "auto", objectFit: "contain", display: "block" }} />
  );
}

/** Compact logo for footer corner — same white asset, smaller */
function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <img src={LOGO_WHITE_URL} alt="Presale Properties Group" style={{ height: size * 1.4, width: "auto", objectFit: "contain", display: "block" }} />
  );
}

// ─── PREVIEW COMPONENT ──────────────────────────────────────────────────────
function OnePagerPreview({ data }: { data: FormState }) {
  const PAGE_W = 612;
  const agent = PRESET_AGENTS[data.agentIdx] || PRESET_AGENTS[0];
  const plans = data.plans.slice(0, data.planCount);
  const colCount = plans.length || 1;

  return (
    <>
    <div
      id="one-pager-preview"
      className="pdf-page"
      style={{
        width: 612,
        background: C.offWhite,
        fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
        position: "relative",
        boxShadow: "0 8px 80px rgba(0,0,0,0.5)",
        overflow: "visible",
      }}
    >
      {/* ── 1. HERO ── */}
      <div style={{ position: "relative", height: 290, overflow: "hidden", background: "#111" }}>
        {data.heroImage ? (
          <img src={data.heroImage} alt="hero" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.8) 100%)" }} />

        {/* Top-left logo — contained so it doesn't bleed over price */}
        <div style={{ position: "absolute", top: 12, left: 16, maxWidth: "45%" }}>
          <LogoWhite height={80} />
        </div>

        {/* Top-right VIP badge + exclusivity line */}
        <div style={{ position: "absolute", top: 14, right: 16, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
          <div style={{ background: C.gold, borderRadius: 20, padding: "4px 12px", fontSize: 7, fontWeight: 700, color: "#111", letterSpacing: "0.12em" }}>
            {data.vipBadge}
          </div>
          <div style={{ fontSize: 5, color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>
            Exclusive to Presale Properties Group clients only.
          </div>
        </div>

        {/* Bottom-left: project info — stays in its lane */}
        <div style={{ position: "absolute", bottom: 16, left: 20, maxWidth: "55%" }}>
          <div style={{ width: 28, height: 2.5, background: C.gold, marginBottom: 6 }} />
          <div style={{ color: "#fff", fontSize: 32, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em", textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}>{data.projectName || "Project Name"}</div>
          <div style={{ color: C.gold, fontSize: 9.5, fontWeight: 600, marginTop: 4 }}>{data.tagline || "by Developer"}</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 7.5, marginTop: 2 }}>{data.address}{data.city ? ` · ${data.city}` : ""}</div>
        </div>

        {/* Bottom-right: price — aligned to bottom-right corner */}
        {(() => {
          const parsePrice = (s: string) => parseFloat(String(s).replace(/[^0-9.]/g, "")) || 0;
          const prices = plans.map(p => parsePrice(p.nowPrice)).filter(n => n > 0);
          const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
          const lowestPlan = plans.find(p => parsePrice(p.nowPrice) === lowestPrice) || plans[0];
          const displayPrice = lowestPrice > 0 ? `$${lowestPrice.toLocaleString()}` : (data.fromPrice || "$—");
          const displayPsf = lowestPlan?.psf || data.fromPsf || "";
          return (
            <div style={{ position: "absolute", bottom: 16, right: 20, textAlign: "right" }}>
              <div style={{ color: C.gold, fontSize: 7, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3, opacity: 0.85 }}>Starting From</div>
              <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{displayPrice}</div>
              {displayPsf && (
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 7, fontWeight: 500, marginTop: 3 }}>{displayPsf}</div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── 2. STAT BLOCKS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { val: data.address || "—", lbl: "Address" },
          { val: data.buildingType || "—", lbl: "Construction" },
          { val: data.completionDate || "—", lbl: "Completion" },
          { val: data.developerName || "—", lbl: "Developer" },
        ].map((s, i) => (
          <div key={i} style={{ background: i % 2 === 0 ? C.dark : C.coal, padding: "8px 12px", borderLeft: i % 2 === 1 ? `2px solid ${C.gold}` : undefined }}>
            <div style={{ color: "#fff", fontSize: 8, fontWeight: 700, lineHeight: 1.3 }}>{s.val}</div>
            <div style={{ color: C.gold, fontSize: 6, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 3 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* ── 3. INCENTIVE BANNER ── */}
      {data.incentiveBanner.items.some(x => x) && (
        <div style={{ background: `linear-gradient(135deg, #145c2e 0%, #1e8c46 50%, #145c2e 100%)`, padding: "9px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 16, height: 1, background: "rgba(255,255,255,0.4)" }} />
            <span style={{ fontSize: 7, fontWeight: 800, color: "#fff", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.9 }}>{data.incentiveBanner.headline}</span>
            <div style={{ width: 16, height: 1, background: "rgba(255,255,255,0.4)" }} />
          </div>
          <div style={{ display: "flex", gap: 7, justifyContent: "center", flexWrap: "wrap" }}>
            {data.incentiveBanner.items.filter(Boolean).map((item, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 20, padding: "4px 11px", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "#a8ffbc", fontSize: 7, fontWeight: 800 }}>✓</span>
                <span style={{ color: "#fff", fontSize: 7, fontWeight: 600, letterSpacing: "0.04em" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. PLANS HEADER ── */}
      <div style={{ background: C.dark, borderTop: `2px solid ${C.gold}`, padding: "7px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#fff", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.15em" }}>FLOOR PLANS · VIP PRICING</span>
        <span style={{ color: C.textMuted, fontSize: 6.5 }}>Limited Time · Subject to Change</span>
      </div>

      {/* ── 5. FLOOR PLAN CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
        {plans.map((plan, i) => (
          <div key={plan.id} style={{ background: i % 2 === 0 ? "#fff" : C.offWhite, borderTop: `3px solid ${C.gold}`, padding: "10px 10px 8px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "inline-flex", background: C.ink, color: "#fff", borderRadius: 12, padding: "2px 8px", fontSize: 6.5, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 5, alignSelf: "flex-start" }}>{plan.name || "—"}</div>
            <div style={{ color: C.ink, fontSize: 8, fontWeight: 700, lineHeight: 1.3, marginBottom: 2 }}>{plan.type || "—"}</div>
            <div style={{ color: C.textMuted, fontSize: 6.5, marginBottom: 7 }}>{plan.sqft || "—"} sqft{plan.bal ? ` + ${plan.bal} bal` : ""}</div>
            <div style={{ height: 1, background: C.smoke, marginBottom: 5 }} />
            <div style={{ color: C.textMuted, fontSize: 5.5, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 2 }}>WAS</div>
            <div style={{ color: C.red, fontSize: 8.5, fontWeight: 700, textDecoration: "line-through", marginBottom: 5 }}>{plan.wasPrice || "—"}</div>
            <div style={{ height: 1, background: C.smoke, marginBottom: 5 }} />
            <div style={{ color: C.gold, fontSize: 5.5, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 2 }}>NOW</div>
            <div style={{ color: C.ink, fontSize: colCount <= 2 ? 16 : 13, fontWeight: 800, marginBottom: 7 }}>{plan.nowPrice || "—"}</div>
            {plan.saved && (
              <div style={{ background: C.greenBg, borderLeft: `3px solid ${C.greenBorder}`, padding: "3px 6px", marginBottom: 7, borderRadius: "0 4px 4px 0" }}>
                <div style={{ color: C.green, fontSize: 6.5, fontWeight: 700 }}>Save {plan.saved}</div>
              </div>
            )}
            <div style={{ height: 1, background: C.smoke, marginBottom: 5 }} />
            <div style={{ color: C.textMuted, fontSize: 5.5, marginBottom: 2 }}>Price per sq.ft.</div>
            <div style={{ color: C.ink, fontSize: 8, fontWeight: 700 }}>{plan.psf || "—"}</div>
          </div>
        ))}
      </div>

      {/* ── 6. DEPOSIT TIMELINE ── */}
      {(() => {
        const basePrice = parseFloat(String(plans[0]?.nowPrice || data.fromPrice || "").replace(/[^0-9.]/g, "")) || 0;
        const calcAmount = (pctStr: string) => {
          const pct = parseFloat(String(pctStr).replace(/[^0-9.]/g, ""));
          if (!basePrice || isNaN(pct)) return null;
          return `$${Math.round(basePrice * pct / 100).toLocaleString()}`;
        };
        const regularDeposits = data.deposits.filter((_, i) => i < data.deposits.length - 1);
        const mortgageStep = data.deposits[data.deposits.length - 1];
        return (
          <div style={{ background: C.dark, padding: "10px 20px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: C.gold, fontSize: 6.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>Deposit Structure</span>
              {basePrice > 0 && <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 5.5 }}>Based on {plans[0]?.nowPrice || data.fromPrice}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              {regularDeposits.map((d, i) => {
                const autoAmt = calcAmount(d.percent);
                const displayAmt = autoAmt || d.amount;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 56 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#111", marginBottom: 5, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ color: C.gold, fontSize: 7, fontWeight: 700 }}>{d.percent || "—"}</div>
                      {displayAmt && <div style={{ color: "#fff", fontSize: 6.5, fontWeight: 600, marginTop: 1 }}>{displayAmt}</div>}
                      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 5.5, marginTop: 2, textAlign: "center", maxWidth: 60 }}>{d.label}</div>
                    </div>
                    {i < regularDeposits.length - 1 && (
                      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.gold}88, rgba(255,255,255,0.15))`, margin: "0 4px", marginBottom: 28 }} />
                    )}
                  </div>
                );
              })}
              {mortgageStep && (
                <>
                  <div style={{ flex: 1, height: 1, borderTop: "1.5px dashed rgba(255,255,255,0.2)", margin: "0 4px", marginBottom: 28 }} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 60 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#2a2a2a", border: `1.5px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 5, flexShrink: 0 }}>
                      <span style={{ fontSize: 9 }}>🏠</span>
                    </div>
                    <div style={{ color: C.gold, fontSize: 6.5, fontWeight: 700 }}>Completion</div>
                    <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 5.5, marginTop: 2, textAlign: "center", maxWidth: 60 }}>Mortgage begins</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 5, marginTop: 1, textAlign: "center" }}>{mortgageStep.label}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── 7. FOOTER with headshot ── */}
      <div style={{ background: C.ink, borderTop: `2px solid ${C.gold}`, padding: "10px 20px", display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: `2px solid ${C.gold}`, flexShrink: 0 }}>
            <img src={agent.photo} alt={agent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 8, fontWeight: 700, letterSpacing: "0.05em" }}>{agent.name}</div>
            <div style={{ color: C.textMuted, fontSize: 5.5, marginTop: 1 }}>{agent.title}</div>
            <div style={{ color: C.gold, fontSize: 5.5, marginTop: 1 }}>{agent.languages}</div>
          </div>
        </div>
        <div style={{ width: 1, height: 36, background: "#333", margin: "0 18px" }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#fff", fontSize: 9.5, fontWeight: 800 }}>{agent.phone}</div>
          <div style={{ color: C.textMuted, fontSize: 6.5, marginTop: 2 }}>{agent.email}</div>
          <div style={{ color: C.gold, fontSize: 6.5, marginTop: 1 }}>{agent.website}</div>
        </div>
      </div>

      {/* Awards ribbon */}
      {data.awards && (
        <div style={{ background: C.gold, padding: "4px 0", textAlign: "center" }}>
          <span style={{ color: "#111", fontSize: 6.5, fontWeight: 700, letterSpacing: "0.15em" }}>🏆 {data.awards}</span>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ background: C.ink, padding: "5px 20px" }}>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 5, lineHeight: 1.4, margin: 0 }}>
          E&OE. Prices subject to change without notice. Limited time offer. Not intended to solicit buyers currently under contract.
        </p>
      </div>
    </div>

    {/* ── FLOOR PLAN PAGES — fixed 792px, everything proportioned to fit ── */}
    {plans.filter(p => p.floorPlanUrl).map((plan, i) => (
      <div
        key={`fp-page-${plan.id}`}
        className="floor-plan-page pdf-page"
        style={{
          width: PAGE_W,
          height: 792,
          background: C.offWhite,
          fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
          boxShadow: "0 8px 80px rgba(0,0,0,0.5)",
          marginTop: 24,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Page header — logo + plan badge */}
        <div style={{ background: C.ink, borderBottom: `3px solid ${C.gold}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <LogoWhite height={48} />
            <div style={{ width: 1, height: 30, background: "#333" }} />
            <div style={{ color: "#aaa", fontSize: 7.5, letterSpacing: "0.12em", fontWeight: 600, textTransform: "uppercase" }}>Floor Plan · {data.projectName || "Project"}</div>
          </div>
          <div style={{ background: C.gold, borderRadius: 4, padding: "5px 14px" }}>
            <span style={{ color: "#111", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em" }}>{plan.name || `PLAN ${i + 1}`}</span>
          </div>
        </div>

        {/* Plan details strip */}
        <div style={{ background: C.dark, padding: "9px 20px", display: "flex", gap: 28, alignItems: "center", flexShrink: 0 }}>
          {plan.type && <div><div style={{ color: C.gold, fontSize: 6.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Unit Type</div><div style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>{plan.type}</div></div>}
          {plan.sqft && <div><div style={{ color: C.gold, fontSize: 6.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Interior</div><div style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>{plan.sqft} sqft</div></div>}
          {plan.bal && <div><div style={{ color: C.gold, fontSize: 6.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Balcony</div><div style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>{plan.bal} sqft</div></div>}
          {plan.nowPrice && <div><div style={{ color: C.gold, fontSize: 6.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Price</div><div style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>{plan.nowPrice}</div></div>}
          {plan.psf && <div><div style={{ color: C.gold, fontSize: 6.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Price/sqft</div><div style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>{plan.psf}</div></div>}
        </div>

        {/* Floor plan image — expands to fill available space */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 24px", background: "#fff", overflow: "hidden" }}>
          <img
            src={plan.floorPlanUrl}
            alt={`Floor plan ${plan.name}`}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
          />
        </div>

        {/* Page footer */}
        <div style={{ background: C.ink, borderTop: `2px solid ${C.gold}`, padding: "9px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", border: `1.5px solid ${C.gold}`, flexShrink: 0 }}>
              <img src={agent.photo} alt={agent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <div style={{ color: "#fff", fontSize: 8, fontWeight: 700 }}>{agent.name}</div>
              <div style={{ color: C.gold, fontSize: 7, fontWeight: 600 }}>{agent.phone}</div>
            </div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 5.5, textAlign: "right" }}>
            E&OE. Floor plans subject to change. Not to scale.
          </div>
        </div>
      </div>
    ))}
  </>
  );
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
    if (wasNum > nowNum && nowNum > 0) updated.saved = `$${(wasNum - nowNum).toLocaleString()}`;
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
      address: project.address || "",
      city: `${project.neighborhood}, ${project.city}`,
      developerName: project.developer_name || "",
      buildingType: projectType,
      completionDate,
      fromPrice: fmt(project.starting_price),
      fromPsf: "",
      heroImage: project.featured_image || null,
      // Auto-fill docs from project if available
      brochureUrl: project.brochure_files?.[0] || f.brochureUrl,
      pricingSheetUrl: project.pricing_sheets?.[0] || f.pricingSheetUrl,
    }));

    toast.success(`Loaded "${project.name}" — fill in plans & incentives`);
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

  const generatePDF = async () => {
    const pageEls = document.querySelectorAll<HTMLElement>(".pdf-page");
    if (!pageEls.length) { toast.error("Preview not found"); return; }
    toast.info("Generating PDF…");
    try {
      const PDF_W_PT = 612;
      const PDF_H_PT = 792;
      const DESIGN_W_PX = 612;
      const SCALE = 8; // 8x = ~4896px wide on letter = true 2K+ quality

      let pdf: jsPDF | null = null;

      for (let i = 0; i < pageEls.length; i++) {
        const el = pageEls[i];
        const isOnePager = i === 0;

        // Wait for layout to settle
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        // Capture height: for one-pager use full scrollHeight; for floor plans use fixed 792
        const captureH = isOnePager ? el.scrollHeight : PDF_H_PT;

        const canvas = await html2canvas(el, {
          scale: SCALE,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false,
          width: DESIGN_W_PX,
          height: captureH,
          windowWidth: DESIGN_W_PX,
          windowHeight: captureH,
          x: 0,
          y: 0,
        });

        // Compute natural PDF height (1px at 612px design width = 1pt)
        const naturalH_pt = (canvas.height / SCALE);

        if (isOnePager) {
          // Custom page exactly matching rendered height — zero scaling, pixel-perfect
          pdf = new jsPDF({ unit: "pt", format: [PDF_W_PT, naturalH_pt], orientation: "portrait" });
          const imgData = canvas.toDataURL("image/png");
          pdf.addImage(imgData, "PNG", 0, 0, PDF_W_PT, naturalH_pt, undefined, "NONE");
        } else {
          // Floor plan pages: standard Letter
          pdf!.addPage([PDF_W_PT, PDF_H_PT], "portrait");
          const imgData = canvas.toDataURL("image/png");
          pdf!.addImage(imgData, "PNG", 0, 0, PDF_W_PT, PDF_H_PT, undefined, "NONE");
        }
      }

      const projectSlug = form.projectName?.replace(/\s+/g, "-").toLowerCase() || "brochure";
      pdf!.save(`${projectSlug}-exclusive.pdf`);
      toast.success("PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("PDF generation failed");
    }
  };

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
    toast.loading("Uploading…");
    const url = await uploadFile(file, "campaign-docs");
    toast.dismiss();
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

              {/* Project search */}
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
            </div>

          {/* Tabs */}
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

              <div className="flex-1 overflow-y-auto px-4 py-4">

                {/* ─── TAB: Project ─── */}
                <TabsContent value="project" className="mt-0 space-y-3">
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

            {/* ── BOTTOM ACTION BAR ── */}
            <div className="p-3 border-t border-border bg-card space-y-2">
              {/* Template name */}
              <div className="space-y-1">
                <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Template Name</Label>
                <Input
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder={form.projectName || "e.g. Oakridge Q1 2026 VIP"}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={generatePDF} className="flex-1 h-9 text-xs gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Generate PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveTemplate}
                  disabled={saving}
                  className="h-9 text-xs gap-1 min-w-[72px]"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {saving ? "Saving…" : templateId && templateId !== "new" ? "Update" : "Save"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                {1 + form.plans.slice(0, form.planCount).filter(p => p.floorPlanUrl).length} page{form.plans.slice(0, form.planCount).filter(p => p.floorPlanUrl).length > 0 ? "s" : ""} · {form.planCount} plan{form.planCount !== 1 ? "s" : ""} · {form.plans.slice(0, form.planCount).filter(p => p.floorPlanUrl).length} floor plan PDF{form.plans.slice(0, form.planCount).filter(p => p.floorPlanUrl).length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* ── RIGHT PANEL: PREVIEW ── */}
          <div className="flex-1 bg-muted/20 flex flex-col overflow-hidden">
            <div className="px-5 py-2.5 border-b border-border flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">Live Preview — US Letter (612×792pt)</span>
              <Badge variant="outline" className="text-[9px]">Updates in real time</Badge>
            </div>

            <div
              ref={previewRef}
              className="flex-1 overflow-auto flex items-start justify-center p-3"
            >
              <div id="print-root" style={{ width: 612, transformOrigin: "top left", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                <OnePagerPreview data={form} />
              </div>
            </div>
          </div>
        </div>
    </AdminLayout>
  );
}
