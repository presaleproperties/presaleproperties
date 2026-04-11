import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Layers, TrendingUp, Clock, Star, AlertTriangle, FileX,
  Search, Plus, Wand2,
} from "lucide-react";
import { ReactNode } from "react";

interface StatItem {
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
}

interface AssignmentManagementHeroProps {
  title: string;
  subtitle: string;
  stats: StatItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode;
  alertBadges?: ReactNode;
}

export function AssignmentManagementHero({
  title,
  subtitle,
  stats,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search assignments...",
  actions,
  alertBadges,
}: AssignmentManagementHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90 text-background p-5 sm:p-8">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      {/* Accent gradient */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
      
      <div className="relative">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
            </div>
            <p className="text-background/60 text-sm ml-[42px]">{subtitle}</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {alertBadges}
            {actions}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-background/[0.06] backdrop-blur-sm border border-background/10 rounded-xl p-3 sm:p-4 transition-colors hover:bg-background/[0.10]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`h-6 w-6 rounded-md flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
                <span className="text-[10px] sm:text-xs text-background/50 uppercase tracking-wider font-medium">{stat.label}</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-background">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-background/40 pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-background/10 border-background/15 text-background placeholder:text-background/40 h-10 focus:bg-background/15 focus:border-background/25"
          />
        </div>
      </div>
    </div>
  );
}
