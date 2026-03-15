import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Reusable primitives using the site design system ───────────── */

export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 md:p-6 shadow-card", className)}>
      {children}
    </div>
  );
}

export function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 border border-border p-4 flex flex-col gap-1">
      <span className="text-2xl md:text-3xl font-bold text-primary leading-none tracking-tight">
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
        {label}
      </span>
    </div>
  );
}

export function StatGrid({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {stats.map((s) => (
        <StatBox key={s.label} {...s} />
      ))}
    </div>
  );
}

export function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
        <Check size={10} className="text-primary" strokeWidth={3} />
      </span>
      <span className="text-sm leading-relaxed text-foreground/80">
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
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className={cn("text-sm", highlight ? "text-foreground font-medium" : "text-muted-foreground")}>
        {label}
      </span>
      <span className={cn("text-sm font-semibold tabular-nums", highlight ? "text-primary" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

export function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold mb-4">
      {text}
    </p>
  );
}

export function DepositBar({ label, pct, amount }: { label: string; pct: number; amount: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className="text-xs font-bold text-primary">{amount}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700 delay-100"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{pct}% of purchase price</p>
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
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-3 h-3 rounded-full flex-shrink-0 mt-1 transition-colors",
                item.done ? "bg-primary" : "bg-secondary border-2 border-border"
              )}
            />
            {idx < items.length - 1 && (
              <div className="w-px flex-1 min-h-[28px] bg-border" />
            )}
          </div>
          <div className="pb-5">
            <p className={cn("text-sm font-medium", item.done ? "text-foreground" : "text-muted-foreground")}>
              {item.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
