import { useState, useRef, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

// ─── Brand colours ─────────────────────────────────────────────────────────
const C = {
  gold: "#B8963E",
  goldLight: "#D4AF6A",
  ink: "#111111",
  dark: "#1C1C1C",
  coal: "#2A2A2A",
  offWhite: "#F8F6F2",
  smoke: "#E8E4DC",
  panel: "#0d0d0d",
  panelBorder: "#1e1e1e",
  panelSub: "#141414",
  textMuted: "#888",
  textFaint: "#555",
  green: "#16a34a",
  greenBg: "#dcfce7",
  greenBorder: "#166534",
  red: "#dc2626",
};

// ─── Default data ───────────────────────────────────────────────────────────
const DEFAULT_PLANS = [
  { id: 1, name: "B1", type: "1 Bed + Den + 1 Bath", sqft: "505", bal: "59", wasPrice: "$459,900", nowPrice: "$399,900", saved: "$60,000", psf: "$792", floorPlanImg: null as string | null },
  { id: 2, name: "B2", type: "1 Bed + Den + 1 Bath", sqft: "589", bal: "52", wasPrice: "$509,900", nowPrice: "$429,900", saved: "$80,000", psf: "$730", floorPlanImg: null as string | null },
  { id: 3, name: "B10", type: "1 Bed + Den + 1 Bath", sqft: "534", bal: "52", wasPrice: "$479,900", nowPrice: "$409,900", saved: "$70,000", psf: "$768", floorPlanImg: null as string | null },
  { id: 4, name: "C5", type: "2 Bed + 2 Bath", sqft: "765", bal: "72", wasPrice: "$639,900", nowPrice: "$594,900", saved: "$45,000", psf: "$777", floorPlanImg: null as string | null },
];

const DEFAULT_DEPOSITS = [
  { label: "WITHIN 7 DAYS", percent: "2.5%", amount: "~ $10,000", note: "Reserve your unit" },
  { label: "3 MONTHS", percent: "2.5%", amount: "~ $10,000", note: "Secure your investment" },
  { label: "SEPT 30 2026", percent: "5%", amount: "~ $20,000", note: "Mid-term milestone" },
  { label: "SUMMER 2028", percent: "—", amount: "Mortgage", note: "At completion" },
];

const PRESET_AGENTS = [
  { name: "UZAIR MUHAMMAD", title: "Presale Specialist", languages: "English · Punjabi · Hindi · Urdu", phone: "778-231-3592", email: "info@presaleproperties.com", website: "presaleproperties.com" },
  { name: "SARB GREWAL", title: "Presale Specialist", languages: "English · Punjabi", phone: "+1 (778) 846-7065", email: "sarb@presaleproperties.com", website: "presaleproperties.com" },
  { name: "RAVISH PASSY", title: "Presale Specialist", languages: "English · Hindi", phone: "+1 (604) 349-9399", email: "ravish@presaleproperties.com", website: "presaleproperties.com" },
];

type Plan = typeof DEFAULT_PLANS[0];
type Deposit = typeof DEFAULT_DEPOSITS[0];

interface FormState {
  projectName: string;
  tagline: string;
  address: string;
  city: string;
  developerName: string;
  buildingType: string;
  completionDate: string;
  awards: string;
  plans: Plan[];
  deposits: Deposit[];
  fromPrice: string;
  fromPriceLabel: string;
  fromPsf: string;
  psfLabel: string;
  vipBadge: string;
  agentName: string;
  agentTitle: string;
  agentLanguages: string;
  agentPhone: string;
  agentEmail: string;
  agentWebsite: string;
  heroImage: string | null;
}

const DEFAULT_STATE: FormState = {
  projectName: "EDEN",
  tagline: "by Zenterra Development",
  address: "7600 Block 200 St",
  city: "Willoughby, Langley BC",
  developerName: "Zenterra Development",
  buildingType: "6-Storey Wood Frame",
  completionDate: "Summer 2028",
  awards: "30+ Awards",
  plans: DEFAULT_PLANS,
  deposits: DEFAULT_DEPOSITS,
  fromPrice: "$399,900",
  fromPriceLabel: "Starting Price",
  fromPsf: "$792/sqft",
  psfLabel: "Price Per Sq. Ft.",
  vipBadge: "VIP PREVIEW ACCESS",
  agentName: "UZAIR MUHAMMAD",
  agentTitle: "Presale Specialist",
  agentLanguages: "English · Punjabi · Hindi · Urdu",
  agentPhone: "778-231-3592",
  agentEmail: "info@presaleproperties.com",
  agentWebsite: "presaleproperties.com",
  heroImage: null,
};

// ─── Tiny helper components ─────────────────────────────────────────────────
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label style={{ color: C.textMuted, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>
      {children}
    </div>
  );
}

function DarkInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: C.panelSub,
        border: `1px solid ${C.panelBorder}`,
        borderRadius: 6,
        color: "#e5e5e5",
        fontSize: 12,
        padding: "6px 10px",
        outline: "none",
        width: "100%",
      }}
      onFocus={e => (e.target.style.borderColor = C.gold)}
      onBlur={e => (e.target.style.borderColor = C.panelBorder)}
    />
  );
}

// ─── Logo Mark SVG ──────────────────────────────────────────────────────────
function LogoMark({ size = 28, gold = C.gold }: { size?: number; gold?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" fill={gold} />
      <rect x="9" y="8" width="3" height="16" rx="1.5" fill="#111" />
      <rect x="14.5" y="8" width="3" height="16" rx="1.5" fill="#111" />
      <rect x="20" y="8" width="3" height="16" rx="1.5" fill="#111" />
    </svg>
  );
}

// ─── PREVIEW COMPONENT ──────────────────────────────────────────────────────
function OnePagerPreview({ data }: { data: FormState }) {
  const PAGE_W = 612;
  const PAGE_H = 792;

  return (
    <div
      id="one-pager-preview"
      style={{
        width: PAGE_W,
        minHeight: PAGE_H,
        background: C.offWhite,
        fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
        position: "relative",
        boxShadow: "0 8px 80px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}
    >
      {/* ── 1. HERO ── */}
      <div style={{ position: "relative", height: 335, overflow: "hidden", background: "#111" }}>
        {data.heroImage ? (
          <img src={data.heroImage} alt="hero" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)" }} />
        )}
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.7) 100%)" }} />

        {/* Top-left logo */}
        <div style={{ position: "absolute", top: 18, left: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <LogoMark size={30} gold={C.gold} />
          <div>
            <div style={{ color: C.gold, fontSize: 7, fontWeight: 700, letterSpacing: "0.2em", lineHeight: 1 }}>PRESALE</div>
            <div style={{ color: "#fff", fontSize: 7, fontWeight: 400, letterSpacing: "0.18em", lineHeight: 1.2 }}>PROPERTIES</div>
          </div>
        </div>

        {/* Top-right VIP badge */}
        <div style={{ position: "absolute", top: 18, right: 18, background: C.gold, borderRadius: 20, padding: "4px 12px", fontSize: 7, fontWeight: 700, color: "#111", letterSpacing: "0.12em" }}>
          {data.vipBadge}
        </div>

        {/* Bottom-left: project info */}
        <div style={{ position: "absolute", bottom: 20, left: 20 }}>
          <div style={{ width: 28, height: 2.5, background: C.gold, marginBottom: 8 }} />
          <div style={{ color: "#fff", fontSize: 34, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}>{data.projectName}</div>
          <div style={{ color: C.gold, fontSize: 10, fontWeight: 600, marginTop: 4 }}>{data.tagline}</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 8, marginTop: 2 }}>{data.address} · {data.city}</div>
        </div>

        {/* Bottom-right: price */}
        <div style={{ position: "absolute", bottom: 20, right: 20, textAlign: "right" }}>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em" }}>From {data.fromPrice}</div>
          <div style={{ color: C.gold, fontSize: 8, fontWeight: 600, marginTop: 2 }}>{data.fromPriceLabel}</div>
          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.2)", margin: "6px 0" }} />
          <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: 600 }}>From {data.fromPsf}</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 7 }}>{data.psfLabel}</div>
        </div>
      </div>

      {/* ── 2. STAT BLOCKS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { val: data.address, lbl: "Address" },
          { val: data.buildingType, lbl: "Construction" },
          { val: data.completionDate, lbl: "Completion" },
          { val: data.developerName, lbl: "Developer" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: i % 2 === 0 ? C.dark : C.coal,
              padding: "10px 12px",
              borderLeft: i % 2 === 1 ? `2px solid ${C.gold}` : undefined,
            }}
          >
            <div style={{ color: "#fff", fontSize: 8, fontWeight: 700, lineHeight: 1.3 }}>{s.val}</div>
            <div style={{ color: C.gold, fontSize: 6, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 3 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* ── 3. PLANS HEADER ── */}
      <div style={{ background: C.dark, borderTop: `2px solid ${C.gold}`, padding: "9px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#fff", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.15em" }}>FLOOR PLANS · VIP PRICING</span>
        <span style={{ color: C.textMuted, fontSize: 6.5 }}>Limited Time · Subject to Change</span>
      </div>

      {/* ── 4. FLOOR PLAN CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${data.plans.length}, 1fr)` }}>
        {data.plans.map((plan, i) => (
          <div
            key={plan.id}
            style={{
              background: i % 2 === 0 ? "#fff" : C.offWhite,
              borderTop: `3px solid ${C.gold}`,
              padding: "12px 10px",
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            {/* Plan pill */}
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: C.ink, color: "#fff", borderRadius: 12, padding: "2px 8px", fontSize: 6.5, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6, alignSelf: "flex-start" }}>{plan.name}</div>
            <div style={{ color: C.ink, fontSize: 8, fontWeight: 700, lineHeight: 1.3, marginBottom: 3 }}>{plan.type}</div>
            <div style={{ color: C.textMuted, fontSize: 6.5, marginBottom: 8 }}>{plan.sqft} sqft + {plan.bal} bal</div>
            <div style={{ height: 1, background: C.smoke, marginBottom: 6 }} />
            {/* WAS */}
            <div style={{ color: C.textMuted, fontSize: 5.5, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 2 }}>WAS</div>
            <div style={{ color: C.red, fontSize: 8.5, fontWeight: 700, textDecoration: "line-through", marginBottom: 6 }}>{plan.wasPrice}</div>
            <div style={{ height: 1, background: C.smoke, marginBottom: 6 }} />
            {/* NOW */}
            <div style={{ color: C.gold, fontSize: 5.5, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 2 }}>NOW</div>
            <div style={{ color: C.ink, fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{plan.nowPrice}</div>
            {/* Savings badge */}
            <div style={{ background: C.greenBg, borderLeft: `3px solid ${C.greenBorder}`, padding: "4px 6px", marginBottom: 8, borderRadius: "0 4px 4px 0" }}>
              <div style={{ color: C.green, fontSize: 6.5, fontWeight: 700 }}>Save {plan.saved}</div>
            </div>
            <div style={{ height: 1, background: C.smoke, marginBottom: 6 }} />
            {/* PSF */}
            <div style={{ color: C.textMuted, fontSize: 5.5, marginBottom: 2 }}>Price per sq.ft.</div>
            <div style={{ color: C.ink, fontSize: 8, fontWeight: 700 }}>{plan.psf}</div>
          </div>
        ))}
      </div>

      {/* ── 5. DEPOSIT BLOCKS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {data.deposits.map((d, i) => {
          const isLast = i === data.deposits.length - 1;
          const isFirst = i === 0;
          return (
            <div
              key={i}
              style={{
                background: i % 2 === 0 ? C.dark : C.coal,
                padding: "10px 10px",
                borderTop: (isFirst || isLast) ? `2px solid ${C.gold}` : undefined,
                borderLeft: isLast ? `3px solid ${C.gold}` : undefined,
              }}
            >
              {/* Percent pill */}
              <div style={{
                display: "inline-flex",
                background: isLast ? C.gold : "#333",
                color: isLast ? "#111" : "#fff",
                borderRadius: 10,
                padding: "2px 7px",
                fontSize: 7,
                fontWeight: 800,
                marginBottom: 5,
              }}>{d.percent}</div>
              <div style={{ color: C.gold, fontSize: 5.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>{d.label}</div>
              <div style={{ color: "#fff", fontSize: 8.5, fontWeight: 700, marginBottom: 3 }}>{d.amount}</div>
              <div style={{ color: C.textMuted, fontSize: 6 }}>{d.note}</div>
            </div>
          );
        })}
      </div>

      {/* ── 6. FOOTER ── */}
      <div style={{ background: C.ink, borderTop: `2px solid ${C.gold}`, padding: "12px 20px", display: "flex", alignItems: "center", gap: 0 }}>
        {/* Left: agent info */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <LogoMark size={26} gold={C.gold} />
          <div>
            <div style={{ color: "#fff", fontSize: 8, fontWeight: 700, letterSpacing: "0.05em" }}>{data.agentName}</div>
            <div style={{ color: C.textMuted, fontSize: 5.5, marginTop: 1 }}>{data.agentTitle}</div>
            <div style={{ color: C.gold, fontSize: 5.5, marginTop: 1 }}>{data.agentLanguages}</div>
          </div>
        </div>
        {/* Divider */}
        <div style={{ width: 1, height: 36, background: "#333", margin: "0 18px" }} />
        {/* Right: contact */}
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#fff", fontSize: 9.5, fontWeight: 800 }}>{data.agentPhone}</div>
          <div style={{ color: C.textMuted, fontSize: 6.5, marginTop: 2 }}>{data.agentEmail}</div>
          <div style={{ color: C.gold, fontSize: 6.5, marginTop: 1 }}>{data.agentWebsite}</div>
        </div>
      </div>

      {/* Awards ribbon */}
      {data.awards && (
        <div style={{ background: C.gold, padding: "4px 0", textAlign: "center" }}>
          <span style={{ color: "#111", fontSize: 6.5, fontWeight: 700, letterSpacing: "0.15em" }}>🏆 {data.awards}</span>
        </div>
      )}

      {/* ── 7. DISCLAIMER ── */}
      <div style={{ background: C.ink, padding: "6px 20px" }}>
        <p style={{ color: "#444", fontSize: 5, lineHeight: 1.4, margin: 0 }}>
          E&OE. Prices subject to change without notice. Limited time offer. Not intended to solicit buyers currently under contract.
        </p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function AdminCampaignBuilder() {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  const set = useCallback((key: keyof FormState, val: any) => setForm(f => ({ ...f, [key]: val })), []);

  const setPlan = (idx: number, key: keyof Plan, val: any) => {
    setForm(f => {
      const plans = f.plans.map((p, i) => i === idx ? { ...p, [key]: val } : p);
      return { ...f, plans };
    });
  };

  const setDeposit = (idx: number, key: keyof Deposit, val: string) => {
    setForm(f => {
      const deposits = f.deposits.map((d, i) => i === idx ? { ...d, [key]: val } : d);
      return { ...f, deposits };
    });
  };

  const addPlan = () => {
    if (form.plans.length >= 4) return;
    setForm(f => ({
      ...f,
      plans: [...f.plans, { id: Date.now(), name: "", type: "", sqft: "", bal: "", wasPrice: "", nowPrice: "", saved: "", psf: "", floorPlanImg: null }]
    }));
  };

  const removePlan = (idx: number) => {
    setForm(f => ({ ...f, plans: f.plans.filter((_, i) => i !== idx) }));
  };

  const handleHeroUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set("heroImage", ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFloorPlanUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPlan(idx, "floorPlanImg", ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const saveTemplate = () => {
    localStorage.setItem(`campaign_${form.projectName}`, JSON.stringify(form));
    alert(`Template "${form.projectName}" saved!`);
  };

  const loadTemplate = () => {
    const name = prompt("Enter project name to load:");
    if (!name) return;
    const saved = localStorage.getItem(`campaign_${name}`);
    if (saved) {
      setForm(JSON.parse(saved));
    } else {
      alert("No template found for that name.");
    }
  };

  const generatePDF = () => {
    window.print();
  };

  const applyAgent = (idx: number) => {
    const agent = PRESET_AGENTS[idx];
    setForm(f => ({ ...f, ...{ agentName: agent.name, agentTitle: agent.title, agentLanguages: agent.languages, agentPhone: agent.phone, agentEmail: agent.email, agentWebsite: agent.website } }));
  };

  const TABS = ["Project", "Plans & Pricing", "Deposit", "Offer Details", "Agent", "Files"];

  const inputStyle: React.CSSProperties = {
    background: C.panelSub,
    border: `1px solid ${C.panelBorder}`,
    borderRadius: 6,
    color: "#e5e5e5",
    fontSize: 12,
    padding: "6px 10px",
    outline: "none",
    width: "100%",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 4,
  };

  return (
    <AdminLayout>
      {/* Break out of AdminLayout's max-w-6xl container */}
      <div style={{ margin: "-24px -24px 0", minHeight: "calc(100vh - 56px)" }}>
      {/* Print stylesheet */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        @media print {
          body * { visibility: hidden !important; }
          #one-pager-preview, #one-pager-preview * { visibility: visible !important; }
          #one-pager-preview {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 612pt !important;
            transform: none !important;
            box-shadow: none !important;
          }
          @page { size: letter; margin: 0; }
        }
        .campaign-tab:hover { background: #1e1e1e !important; }
        .plan-card-form { background: #141414; border: 1px solid #1e1e1e; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
        input:focus { border-color: ${C.gold} !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0d0d0d; } ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        .upload-zone { border: 1.5px dashed #2a2a2a; border-radius: 8px; padding: 16px; text-align: center; cursor: pointer; transition: border-color 0.2s; }
        .upload-zone:hover { border-color: ${C.gold}; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", background: "#000", fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif", overflow: "hidden" }}>
        {/* ── LEFT PANEL ── */}
        <div style={{ width: 430, minWidth: 430, background: C.panel, borderRight: `1px solid ${C.panelBorder}`, display: "flex", flexDirection: "column", height: "100vh" }}>

          {/* Header */}
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.panelBorder}`, display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={22} gold={C.gold} />
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Campaign Builder</div>
              <div style={{ color: C.textFaint, fontSize: 10 }}>Presale Properties · One-Pager Generator</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${C.panelBorder}`, overflowX: "auto" }}>
            {TABS.map((tab, i) => (
              <button
                key={i}
                className="campaign-tab"
                onClick={() => setActiveTab(i)}
                style={{
                  padding: "9px 12px",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: activeTab === i ? C.gold : C.textMuted,
                  background: activeTab === i ? "#141414" : "transparent",
                  border: "none",
                  borderBottom: activeTab === i ? `2px solid ${C.gold}` : "2px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

            {/* TAB 0 — Project */}
            {activeTab === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <FieldRow label="Project Name"><DarkInput value={form.projectName} onChange={v => set("projectName", v)} /></FieldRow>
                <FieldRow label="Tagline"><DarkInput value={form.tagline} onChange={v => set("tagline", v)} /></FieldRow>
                <FieldRow label="Street Address"><DarkInput value={form.address} onChange={v => set("address", v)} /></FieldRow>
                <FieldRow label="City / Area"><DarkInput value={form.city} onChange={v => set("city", v)} /></FieldRow>
                <FieldRow label="Developer Name"><DarkInput value={form.developerName} onChange={v => set("developerName", v)} /></FieldRow>
                <FieldRow label="Building Type"><DarkInput value={form.buildingType} onChange={v => set("buildingType", v)} /></FieldRow>
                <FieldRow label="Completion Date"><DarkInput value={form.completionDate} onChange={v => set("completionDate", v)} /></FieldRow>
                <FieldRow label="Awards"><DarkInput value={form.awards} onChange={v => set("awards", v)} placeholder="e.g. 30+ Awards" /></FieldRow>
              </div>
            )}

            {/* TAB 1 — Plans & Pricing */}
            {activeTab === 1 && (
              <div>
                {form.plans.map((plan, idx) => (
                  <div key={plan.id} className="plan-card-form">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ color: C.gold, fontSize: 11, fontWeight: 700 }}>Plan {idx + 1}</span>
                      {form.plans.length > 1 && (
                        <button onClick={() => removePlan(idx)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 11 }}>✕ Remove</button>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {(["name", "type", "sqft", "bal", "wasPrice", "nowPrice", "saved", "psf"] as (keyof Plan)[]).map(key => (
                        <div key={key}>
                          <label style={labelStyle}>{key === "sqft" ? "Interior sqft" : key === "bal" ? "Balcony sqft" : key === "wasPrice" ? "Was Price" : key === "nowPrice" ? "Now Price" : key === "saved" ? "Amount Saved" : key === "psf" ? "Price/sqft" : key === "name" ? "Plan Name" : "Unit Type"}</label>
                          <input
                            style={inputStyle}
                            value={String(plan[key] ?? "")}
                            onChange={e => setPlan(idx, key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {form.plans.length < 4 && (
                  <button onClick={addPlan} style={{ width: "100%", padding: "8px", background: "none", border: `1.5px dashed ${C.gold}`, color: C.gold, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>
                    + Add Plan
                  </button>
                )}
              </div>
            )}

            {/* TAB 2 — Deposit */}
            {activeTab === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {form.deposits.map((dep, idx) => (
                  <div key={idx} style={{ background: C.panelSub, border: `1px solid ${C.panelBorder}`, borderRadius: 8, padding: 12 }}>
                    <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Stage {idx + 1}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {(["label", "percent", "amount", "note"] as (keyof Deposit)[]).map(key => (
                        <div key={key}>
                          <label style={labelStyle}>{key === "label" ? "Stage Label" : key === "percent" ? "Percentage" : key === "amount" ? "Dollar Amount" : "Note"}</label>
                          <input style={inputStyle} value={dep[key]} onChange={e => setDeposit(idx, key, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3 — Offer Details */}
            {activeTab === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <FieldRow label="Starting From Price"><DarkInput value={form.fromPrice} onChange={v => set("fromPrice", v)} /></FieldRow>
                <FieldRow label="Price Label"><DarkInput value={form.fromPriceLabel} onChange={v => set("fromPriceLabel", v)} /></FieldRow>
                <FieldRow label="From PSF"><DarkInput value={form.fromPsf} onChange={v => set("fromPsf", v)} /></FieldRow>
                <FieldRow label="PSF Label"><DarkInput value={form.psfLabel} onChange={v => set("psfLabel", v)} /></FieldRow>
                <FieldRow label="VIP Badge Text"><DarkInput value={form.vipBadge} onChange={v => set("vipBadge", v)} /></FieldRow>
              </div>
            )}

            {/* TAB 4 — Agent */}
            {activeTab === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Quick Switch</label>
                  <select
                    onChange={e => applyAgent(Number(e.target.value))}
                    defaultValue=""
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="" disabled>— Select a preset agent —</option>
                    {PRESET_AGENTS.map((a, i) => (
                      <option key={i} value={i}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ height: 1, background: C.panelBorder }} />
                <FieldRow label="Full Name"><DarkInput value={form.agentName} onChange={v => set("agentName", v)} /></FieldRow>
                <FieldRow label="Title"><DarkInput value={form.agentTitle} onChange={v => set("agentTitle", v)} /></FieldRow>
                <FieldRow label="Languages"><DarkInput value={form.agentLanguages} onChange={v => set("agentLanguages", v)} /></FieldRow>
                <FieldRow label="Phone"><DarkInput value={form.agentPhone} onChange={v => set("agentPhone", v)} /></FieldRow>
                <FieldRow label="Email"><DarkInput value={form.agentEmail} onChange={v => set("agentEmail", v)} /></FieldRow>
                <FieldRow label="Website"><DarkInput value={form.agentWebsite} onChange={v => set("agentWebsite", v)} /></FieldRow>
              </div>
            )}

            {/* TAB 5 — Files */}
            {activeTab === 5 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Hero Image (JPG/PNG)</label>
                  <label className="upload-zone" style={{ display: "block" }}>
                    <input type="file" accept="image/*" onChange={handleHeroUpload} style={{ display: "none" }} />
                    {form.heroImage ? (
                      <div>
                        <img src={form.heroImage} alt="hero" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 4 }} />
                        <div style={{ color: C.gold, fontSize: 10, marginTop: 4 }}>✓ Hero image loaded</div>
                      </div>
                    ) : (
                      <div style={{ color: C.textFaint, fontSize: 11 }}>Click to upload hero image</div>
                    )}
                  </label>
                </div>
                <div style={{ height: 1, background: C.panelBorder }} />
                <div>
                  <label style={labelStyle}>Floor Plan Images (per plan)</label>
                  {form.plans.map((plan, idx) => (
                    <div key={plan.id} style={{ marginBottom: 8 }}>
                      <label style={{ ...labelStyle, color: "#666" }}>Plan {plan.name || idx + 1}</label>
                      <label className="upload-zone" style={{ display: "block" }}>
                        <input type="file" accept="image/*,application/pdf" onChange={e => handleFloorPlanUpload(idx, e)} style={{ display: "none" }} />
                        {plan.floorPlanImg ? (
                          <div style={{ color: C.gold, fontSize: 10 }}>✓ File loaded for {plan.name}</div>
                        ) : (
                          <div style={{ color: C.textFaint, fontSize: 11 }}>Upload floor plan for {plan.name || `Plan ${idx + 1}`}</div>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── BOTTOM ACTION BAR ── */}
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.panelBorder}`, background: C.panel }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button
                onClick={generatePDF}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  background: C.gold,
                  color: "#111",
                  border: "none",
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                ↓ Generate PDF
              </button>
              <button
                onClick={saveTemplate}
                style={{ padding: "9px 14px", background: C.panelSub, color: "#ccc", border: `1px solid ${C.panelBorder}`, borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
              >
                Save
              </button>
              <button
                onClick={loadTemplate}
                style={{ padding: "9px 14px", background: C.panelSub, color: "#ccc", border: `1px solid ${C.panelBorder}`, borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
              >
                Load
              </button>
            </div>
            <div style={{ color: C.textFaint, fontSize: 9.5, textAlign: "center" }}>
              Page 1 — One Pager + {form.plans.length} floor plan{form.plans.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: PREVIEW ── */}
        <div style={{ flex: 1, background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Preview header bar */}
          <div style={{ padding: "10px 20px", borderBottom: `1px solid #1a1a1a`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#555", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em" }}>LIVE PREVIEW — US LETTER (612×792pt)</span>
            <span style={{ color: "#333", fontSize: 10 }}>Updates in real time</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

