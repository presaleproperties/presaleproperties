import { Check } from "lucide-react";

/* ── Reusable primitives ─────────────────────────────── */

export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative p-5 md:p-6 ${className}`}
      style={{
        background: "#141414",
        borderTop: "2px solid #C9A96E",
        borderRight: "1px solid rgba(201,169,110,0.18)",
        borderBottom: "1px solid rgba(201,169,110,0.18)",
        borderLeft: "1px solid rgba(201,169,110,0.18)",
        borderRadius: "3px",
      }}
    >
      {children}
    </div>
  );
}

export function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="p-4 flex flex-col gap-1"
      style={{
        background: "#1C1C1C",
        border: "1px solid rgba(201,169,110,0.18)",
        borderRadius: "2px",
      }}
    >
      <span
        className="font-['Cormorant_Garamond'] font-semibold leading-none"
        style={{ fontSize: "clamp(22px, 3vw, 32px)", color: "#C9A96E" }}
      >
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-widest" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>
        {label}
      </span>
    </div>
  );
}

export function StatGrid({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((s) => (
        <StatBox key={s.label} {...s} />
      ))}
    </div>
  );
}

export function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border border-[#C9A96E] flex items-center justify-center">
        <Check size={11} color="#C9A96E" strokeWidth={2.5} />
      </span>
      <span className="text-sm leading-relaxed" style={{ color: "#F5F0E8", fontFamily: "DM Sans, sans-serif" }}>
        {text}
      </span>
    </li>
  );
}

export function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <CheckItem key={item} text={item} />
      ))}
    </ul>
  );
}

export function CostRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: "1px solid rgba(201,169,110,0.10)" }}
    >
      <span className="text-sm" style={{ color: highlight ? "#F5F0E8" : "#8A8078", fontFamily: "DM Sans, sans-serif" }}>
        {label}
      </span>
      <span
        className="text-sm font-semibold tabular-nums"
        style={{ color: highlight ? "#C9A96E" : "#F5F0E8", fontFamily: "DM Sans, sans-serif" }}
      >
        {value}
      </span>
    </div>
  );
}

export function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: "#C9A96E", fontFamily: "DM Sans, sans-serif" }}>
      {text}
    </p>
  );
}

export function DepositBar({ label, pct, amount }: { label: string; pct: number; amount: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color: "#C9A96E", fontFamily: "DM Sans, sans-serif" }}>{amount}</span>
      </div>
      <div className="h-[6px] w-full rounded-[1px]" style={{ background: "#1C1C1C" }}>
        <div
          className="h-full rounded-[1px] transition-all duration-700 delay-100"
          style={{ width: `${pct}%`, background: "#C9A96E" }}
        />
      </div>
      <p className="text-[10px]" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>{pct}% of purchase price</p>
    </div>
  );
}

interface TimelineItem {
  label: string;
  desc: string;
  done?: boolean;
}

export function MilestoneTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="space-y-0">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-4">
          {/* dot + line */}
          <div className="flex flex-col items-center">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
              style={{ background: item.done ? "#C9A96E" : "#2A2A2A", border: item.done ? "none" : "1px solid #8A8078" }}
            />
            {idx < items.length - 1 && (
              <div className="w-[1px] flex-1 min-h-[28px]" style={{ background: "rgba(201,169,110,0.2)" }} />
            )}
          </div>
          {/* content */}
          <div className="pb-5">
            <p className="text-sm font-medium" style={{ color: item.done ? "#F5F0E8" : "#8A8078", fontFamily: "DM Sans, sans-serif" }}>
              {item.label}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}>{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
