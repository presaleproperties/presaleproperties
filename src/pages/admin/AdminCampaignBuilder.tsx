import { useState, useRef, useCallback, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Building2, User, DollarSign, FileText, Sparkles, Download, Save, Upload,
  Plus, Trash2, ChevronDown, Image as ImageIcon
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
}

const emptyPlan = (): Plan => ({
  id: Date.now(), name: "", type: "", sqft: "", bal: "",
  wasPrice: "", nowPrice: "", saved: "", psf: "",
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
};

// ─── Logo Mark SVG ──────────────────────────────────────────────────────────
function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" fill={C.gold} />
      <rect x="9" y="8" width="3" height="16" rx="1.5" fill="#111" />
      <rect x="14.5" y="8" width="3" height="16" rx="1.5" fill="#111" />
      <rect x="20" y="8" width="3" height="16" rx="1.5" fill="#111" />
    </svg>
  );
}

// ─── PREVIEW COMPONENT ──────────────────────────────────────────────────────
function OnePagerPreview({ data }: { data: FormState }) {
  const PAGE_W = 612;
  const agent = PRESET_AGENTS[data.agentIdx] || PRESET_AGENTS[0];
  const plans = data.plans.slice(0, data.planCount);
  const colCount = plans.length || 1;

  return (
    <div
      id="one-pager-preview"
      style={{
        width: PAGE_W, background: C.offWhite,
        fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
        position: "relative",
        boxShadow: "0 8px 80px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}
    >
      {/* ── 1. HERO ── */}
      <div style={{ position: "relative", height: 330, overflow: "hidden", background: "#111" }}>
        {data.heroImage ? (
          <img src={data.heroImage} alt="hero" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.75) 100%)" }} />

        {/* Top-left logo */}
        <div style={{ position: "absolute", top: 18, left: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <LogoMark size={30} />
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
        <div style={{ position: "absolute", bottom: 20, left: 20, maxWidth: "60%" }}>
          <div style={{ width: 28, height: 2.5, background: C.gold, marginBottom: 8 }} />
          <div style={{ color: "#fff", fontSize: 34, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}>{data.projectName || "Project Name"}</div>
          <div style={{ color: C.gold, fontSize: 10, fontWeight: 600, marginTop: 4 }}>{data.tagline || "by Developer"}</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 8, marginTop: 2 }}>{data.address}{data.city ? ` · ${data.city}` : ""}</div>
        </div>

        {/* Bottom-right: price */}
        <div style={{ position: "absolute", bottom: 20, right: 20, textAlign: "right" }}>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>From {data.fromPrice || "$—"}</div>
          <div style={{ color: C.gold, fontSize: 8, fontWeight: 600, marginTop: 2 }}>{data.fromPriceLabel}</div>
          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.2)", margin: "6px 0" }} />
          <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: 600 }}>From {data.fromPsf || "$—/sqft"}</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 7 }}>{data.psfLabel}</div>
        </div>
      </div>

      {/* ── 2. STAT BLOCKS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { val: data.address || "—", lbl: "Address" },
          { val: data.buildingType || "—", lbl: "Construction" },
          { val: data.completionDate || "—", lbl: "Completion" },
          { val: data.developerName || "—", lbl: "Developer" },
        ].map((s, i) => (
          <div key={i} style={{ background: i % 2 === 0 ? C.dark : C.coal, padding: "10px 12px", borderLeft: i % 2 === 1 ? `2px solid ${C.gold}` : undefined }}>
            <div style={{ color: "#fff", fontSize: 8, fontWeight: 700, lineHeight: 1.3 }}>{s.val}</div>
            <div style={{ color: C.gold, fontSize: 6, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 3 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* ── 3. INCENTIVE BANNER ── */}
      {data.incentiveBanner.items.some(x => x) && (
        <div style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 8, fontWeight: 800, color: "#111", letterSpacing: "0.12em" }}>
              {data.incentiveBanner.headline}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {data.incentiveBanner.items.filter(Boolean).map((item, i) => (
              <div key={i} style={{ background: "rgba(0,0,0,0.15)", borderRadius: 4, padding: "3px 8px" }}>
                <span style={{ color: "#fff", fontSize: 7, fontWeight: 700 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. PLANS HEADER ── */}
      <div style={{ background: C.dark, borderTop: `2px solid ${C.gold}`, padding: "9px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#fff", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.15em" }}>FLOOR PLANS · VIP PRICING</span>
        <span style={{ color: C.textMuted, fontSize: 6.5 }}>Limited Time · Subject to Change</span>
      </div>

      {/* ── 5. FLOOR PLAN CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
        {plans.map((plan, i) => (
          <div key={plan.id} style={{ background: i % 2 === 0 ? "#fff" : C.offWhite, borderTop: `3px solid ${C.gold}`, padding: "12px 10px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "inline-flex", background: C.ink, color: "#fff", borderRadius: 12, padding: "2px 8px", fontSize: 6.5, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6, alignSelf: "flex-start" }}>{plan.name || "—"}</div>
            <div style={{ color: C.ink, fontSize: 8, fontWeight: 700, lineHeight: 1.3, marginBottom: 3 }}>{plan.type || "—"}</div>
            <div style={{ color: C.textMuted, fontSize: 6.5, marginBottom: 8 }}>{plan.sqft || "—"} sqft{plan.bal ? ` + ${plan.bal} bal` : ""}</div>
            <div style={{ height: 1, background: C.smoke, marginBottom: 6 }} />
            <div style={{ color: C.textMuted, fontSize: 5.5, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 2 }}>WAS</div>
            <div style={{ color: C.red, fontSize: 8.5, fontWeight: 700, textDecoration: "line-through", marginBottom: 6 }}>{plan.wasPrice || "—"}</div>
            <div style={{ height: 1, background: C.smoke, marginBottom: 6 }} />
            <div style={{ color: C.gold, fontSize: 5.5, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 2 }}>NOW</div>
            <div style={{ color: C.ink, fontSize: colCount <= 2 ? 16 : 13, fontWeight: 800, marginBottom: 8 }}>{plan.nowPrice || "—"}</div>
            {plan.saved && (
              <div style={{ background: C.greenBg, borderLeft: `3px solid ${C.greenBorder}`, padding: "4px 6px", marginBottom: 8, borderRadius: "0 4px 4px 0" }}>
                <div style={{ color: C.green, fontSize: 6.5, fontWeight: 700 }}>Save {plan.saved}</div>
              </div>
            )}
            <div style={{ height: 1, background: C.smoke, marginBottom: 6 }} />
            <div style={{ color: C.textMuted, fontSize: 5.5, marginBottom: 2 }}>Price per sq.ft.</div>
            <div style={{ color: C.ink, fontSize: 8, fontWeight: 700 }}>{plan.psf || "—"}</div>
          </div>
        ))}
      </div>

      {/* ── 6. DEPOSIT BLOCKS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {data.deposits.map((d, i) => {
          const isLast = i === 3;
          const isFirst = i === 0;
          return (
            <div key={i} style={{ background: i % 2 === 0 ? C.dark : C.coal, padding: "10px 10px", borderTop: (isFirst || isLast) ? `2px solid ${C.gold}` : undefined, borderLeft: isLast ? `3px solid ${C.gold}` : undefined }}>
              <div style={{ display: "inline-flex", background: isLast ? C.gold : "#333", color: isLast ? "#111" : "#fff", borderRadius: 10, padding: "2px 7px", fontSize: 7, fontWeight: 800, marginBottom: 5 }}>{d.percent}</div>
              <div style={{ color: C.gold, fontSize: 5.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>{d.label}</div>
              <div style={{ color: "#fff", fontSize: 8.5, fontWeight: 700, marginBottom: 3 }}>{d.amount}</div>
              <div style={{ color: C.textMuted, fontSize: 6 }}>{d.note}</div>
            </div>
          );
        })}
      </div>

      {/* ── 7. FOOTER with headshot ── */}
      <div style={{ background: C.ink, borderTop: `2px solid ${C.gold}`, padding: "12px 20px", display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          {/* Agent headshot */}
          <div style={{ width: 42, height: 42, borderRadius: "50%", overflow: "hidden", border: `2px solid ${C.gold}`, flexShrink: 0 }}>
            <img src={agent.photo} alt={agent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 8, fontWeight: 700, letterSpacing: "0.05em" }}>{agent.name}</div>
            <div style={{ color: C.textMuted, fontSize: 5.5, marginTop: 1 }}>{agent.title}</div>
            <div style={{ color: C.gold, fontSize: 5.5, marginTop: 1 }}>{agent.languages}</div>
          </div>
        </div>
        <div style={{ width: 1, height: 36, background: "#333", margin: "0 18px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark size={26} />
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#fff", fontSize: 9.5, fontWeight: 800 }}>{agent.phone}</div>
            <div style={{ color: C.textMuted, fontSize: 6.5, marginTop: 2 }}>{agent.email}</div>
            <div style={{ color: C.gold, fontSize: 6.5, marginTop: 1 }}>{agent.website}</div>
          </div>
        </div>
      </div>

      {/* Awards ribbon */}
      {data.awards && (
        <div style={{ background: C.gold, padding: "4px 0", textAlign: "center" }}>
          <span style={{ color: "#111", fontSize: 6.5, fontWeight: 700, letterSpacing: "0.15em" }}>🏆 {data.awards}</span>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ background: C.ink, padding: "6px 20px" }}>
        <p style={{ color: "#444", fontSize: 5, lineHeight: 1.4, margin: 0 }}>
          E&OE. Prices subject to change without notice. Limited time offer. Not intended to solicit buyers currently under contract.
        </p>
      </div>
    </div>
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
}

export default function AdminCampaignBuilder() {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase
        .from("presale_projects")
        .select("id, name, city, neighborhood, address, developer_name, starting_price, price_range, deposit_structure, deposit_percent, incentives, featured_image, completion_year, completion_month, project_type, unit_mix, highlights, amenities")
        .eq("is_published", true)
        .order("name");
      if (data) setProjects(data as ProjectOption[]);
      setLoading(false);
    };
    fetchProjects();
  }, []);

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

  const saveTemplate = () => {
    localStorage.setItem(`campaign_${form.projectName}`, JSON.stringify(form));
    toast.success(`Template "${form.projectName}" saved`);
  };

  const loadTemplate = () => {
    const name = prompt("Enter project name to load:");
    if (!name) return;
    const saved = localStorage.getItem(`campaign_${name}`);
    if (saved) {
      setForm(JSON.parse(saved));
      toast.success(`Loaded template for "${name}"`);
    } else {
      toast.error("No template found for that name.");
    }
  };

  const generatePDF = () => window.print();

  return (
    <AdminLayout>
      <style>{`
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
      `}</style>

      <div style={{ margin: "-24px -24px 0", minHeight: "calc(100vh - 56px)" }}>
        <div className="flex h-[calc(100vh-56px)]">

          {/* ── LEFT PANEL ── */}
          <div className="w-[430px] min-w-[430px] border-r border-border bg-card flex flex-col h-full">

            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-bold text-sm tracking-tight">Campaign Builder</h1>
                  <p className="text-xs text-muted-foreground">One-Pager Generator</p>
                </div>
              </div>

              {/* Project selector */}
              <Select value={selectedProjectId} onValueChange={handleProjectSelect}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder={loading ? "Loading projects…" : "Select a project to auto-fill"} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-muted-foreground ml-1.5">· {p.city}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="project" className="flex flex-col flex-1 min-h-0">
              <TabsList className="w-full rounded-none border-b border-border h-auto p-0 bg-transparent justify-start">
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
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-3 py-2.5 gap-1.5"
                  >
                    <tab.icon className="h-3 w-3" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

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
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                          Plan {idx + 1}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          ["name", "Plan Name"], ["type", "Unit Type"],
                          ["sqft", "Interior sqft"], ["bal", "Balcony sqft"],
                          ["wasPrice", "Was Price"], ["nowPrice", "Now Price"],
                          ["saved", "Amount Saved"], ["psf", "Price/sqft"],
                        ].map(([key, label]) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</Label>
                            <Input
                              value={String((plan as any)[key] || "")}
                              onChange={e => setPlan(idx, key as keyof Plan, e.target.value)}
                              className="h-7 text-xs"
                            />
                          </div>
                        ))}
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
                  {form.deposits.map((dep, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                      <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                        Stage {idx + 1}
                      </Badge>
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
                  ))}
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
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Hero Image</Label>
                    <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 p-4 cursor-pointer transition-colors">
                      <input type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
                      {form.heroImage ? (
                        <div className="w-full">
                          <img src={form.heroImage} alt="hero" className="w-full h-24 object-cover rounded-lg" />
                          <p className="text-[10px] text-primary font-medium text-center mt-2">✓ Hero image loaded · Click to replace</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Click to upload hero image</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">JPG, PNG recommended</p>
                        </div>
                      )}
                    </label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    If no hero image is uploaded, the project's featured image from the database will be used automatically.
                  </p>
                </TabsContent>
              </div>
            </Tabs>

            {/* ── BOTTOM ACTION BAR ── */}
            <div className="p-3 border-t border-border bg-card space-y-2">
              <div className="flex gap-2">
                <Button onClick={generatePDF} className="flex-1 h-9 text-xs gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Generate PDF
                </Button>
                <Button variant="outline" size="sm" onClick={saveTemplate} className="h-9 text-xs gap-1">
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={loadTemplate} className="h-9 text-xs gap-1">
                  <Upload className="h-3.5 w-3.5" />
                  Load
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Page 1 — One Pager · {form.planCount} floor plan{form.planCount !== 1 ? "s" : ""}
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
              className="flex-1 overflow-auto flex items-start justify-center p-6"
            >
              <div style={{ transform: "scale(0.95)", transformOrigin: "top center" }}>
                <OnePagerPreview data={form} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
