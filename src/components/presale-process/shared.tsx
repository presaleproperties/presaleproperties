import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Reusable primitives using the site design system ───────────── */

export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-secondary/40 p-4 sm:p-5 w-full min-w-0", className)}>
      {children}
    </div>
  );
}

export function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-background border border-border p-3 sm:p-4 flex flex-col gap-1.5 min-w-0 overflow-hidden">
      <span className="text-xl sm:text-2xl font-bold text-primary leading-none tracking-tight truncate">
        {value}
      </span>
      <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-medium leading-tight line-clamp-2">
        {label}
      </span>
    </div>
  );
}

export function StatGrid({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
      {stats.map((s) => (
        <StatBox key={s.label} {...s} />
      ))}
    </div>
  );
}

export function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 min-w-0">
      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/12 border border-primary/25 flex items-center justify-center">
        <Check size={10} className="text-primary" strokeWidth={3} />
      </span>
      <span className="text-sm leading-relaxed text-foreground/75 min-w-0">
        {text}
      </span>
    </li>
  );
}

export function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5 w-full">
      {items.map((item) => (
        <CheckItem key={item} text={item} />
      ))}
    </ul>
  );
}

export function CostRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start sm:items-center justify-between gap-2 py-2.5 border-b border-border last:border-0 min-w-0">
      <span className={cn(
        "text-sm leading-snug min-w-0 flex-1 pr-2",
        highlight ? "text-foreground font-medium" : "text-muted-foreground"
      )}>
        {label}
      </span>
      <span className={cn(
        "text-sm font-semibold tabular-nums whitespace-nowrap flex-shrink-0",
        highlight ? "text-primary" : "text-foreground"
      )}>
        {value}
      </span>
    </div>
  );
}

export function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold mb-3 sm:mb-4">
      {text}
    </p>
  );
}

export function DepositBar({ label, pct, amount, maxPct = 20 }: { label: string; pct: number; amount: string; maxPct?: number }) {
  const fillPct = Math.min((pct / maxPct) * 100, 100);
  return (
    <div className="space-y-1.5 min-w-0">
      <div className="flex justify-between items-center gap-2 min-w-0">
        <span className="text-xs text-muted-foreground font-medium truncate flex-1 min-w-0">{label}</span>
        <span className="text-xs font-bold text-primary whitespace-nowrap flex-shrink-0">{amount}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-700 delay-100"
          style={{ width: `${fillPct}%` }}
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
    <div>
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-3 sm:gap-4 min-w-0">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full mt-1.5 transition-colors",
              item.done ? "bg-primary" : "bg-border"
            )} />
            {idx < items.length - 1 && (
              <div className="w-px flex-1 min-h-[24px] bg-border" />
            )}
          </div>
          <div className={cn("min-w-0", idx < items.length - 1 ? "pb-4" : "pb-1")}>
            <p className={cn("text-sm font-medium leading-snug", item.done ? "text-foreground" : "text-muted-foreground/60")}>
              {item.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
