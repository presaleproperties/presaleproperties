import { cn } from "@/lib/utils";
import { CAMPAIGN_WEEKS, type CampaignWeekType } from "./CampaignWeekConfig";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, LayoutGrid, Sparkles, X } from "lucide-react";

interface Props {
  activeWeek: number;
  onWeekChange: (week: number) => void;
  completedWeeks?: Set<number>;
  bundleName: string;
  onExitCampaign: () => void;
}

const typeIcon: Record<CampaignWeekType, React.ReactNode> = {
  "single-project": <FileText className="h-3 w-3" />,
  "multi-project": <LayoutGrid className="h-3 w-3" />,
  "ai-content": <Sparkles className="h-3 w-3" />,
};

const typeColor: Record<CampaignWeekType, string> = {
  "single-project": "text-info",
  "multi-project": "text-primary",
  "ai-content": "text-warning",
};

export function CampaignWeekNavigator({
  activeWeek,
  onWeekChange,
  completedWeeks = new Set(),
  bundleName,
  onExitCampaign,
}: Props) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Campaign header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary/10 to-transparent border-b border-border">
        <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center shrink-0">
          <LayoutGrid className="h-3 w-3 text-primary" />
        </div>
        <span className="text-xs font-bold text-foreground truncate">Campaign: {bundleName}</span>
        <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0">
          {completedWeeks.size}/12
        </Badge>
        <button
          onClick={onExitCampaign}
          className="ml-auto h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
          title="Exit campaign mode"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Scrollable week tabs */}
      <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {CAMPAIGN_WEEKS.map(w => {
          const isActive = w.week === activeWeek;
          const isDone = completedWeeks.has(w.week);
          return (
            <button
              key={w.week}
              onClick={() => onWeekChange(w.week)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 min-w-[80px] border-b-2 transition-all shrink-0 relative group",
                isActive
                  ? "border-primary bg-primary/5"
                  : isDone
                    ? "border-success/50 hover:bg-muted/30"
                    : "border-transparent hover:bg-muted/30 hover:border-muted-foreground/20"
              )}
              title={w.description}
            >
              {/* Week number + status icon */}
              <div className="flex items-center gap-1">
                {isDone ? (
                  <CheckCircle2 className="h-3 w-3 text-success" />
                ) : (
                  <span className={cn("text-[9px] font-bold", isActive ? "text-primary" : "text-muted-foreground")}>
                    W{w.week}
                  </span>
                )}
                <span className={cn("shrink-0", typeColor[w.type])}>
                  {typeIcon[w.type]}
                </span>
              </div>
              {/* Label */}
              <span className={cn(
                "text-[10px] font-medium leading-tight text-center whitespace-nowrap",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {w.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active week description */}
      {CAMPAIGN_WEEKS.find(w => w.week === activeWeek) && (
        <div className="px-3 py-1.5 bg-muted/20 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            <span className="font-semibold text-foreground">Week {activeWeek}: {CAMPAIGN_WEEKS[activeWeek - 1].label}</span>
            {" — "}
            {CAMPAIGN_WEEKS[activeWeek - 1].description}
          </p>
        </div>
      )}
    </div>
  );
}
