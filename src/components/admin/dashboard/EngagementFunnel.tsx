import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, MousePointerClick, FileText, FormInput, Send, Users } from "lucide-react";

interface FunnelData {
  total_page_views: number;
  total_property_views: number;
  total_floorplan_views: number;
  total_cta_clicks: number;
  total_form_starts: number;
  total_form_submits: number;
  unique_page_viewers: number;
  unique_property_viewers: number;
}

interface EngagementFunnelProps {
  data: FunnelData | null;
}

export function EngagementFunnel({ data }: EngagementFunnelProps) {
  if (!data) return null;

  const steps = [
    { 
      label: "Page Views", 
      value: data.total_page_views, 
      unique: data.unique_page_viewers,
      icon: Eye, 
      color: "bg-info-soft text-info",
      barColor: "bg-info",
    },
    { 
      label: "Project Views", 
      value: data.total_property_views, 
      unique: data.unique_property_viewers,
      icon: Users, 
      color: "bg-info-soft text-info",
      barColor: "bg-info",
    },
    { 
      label: "Floorplan Views", 
      value: data.total_floorplan_views, 
      icon: FileText, 
      color: "bg-primary/10 text-primary",
      barColor: "bg-primary",
    },
    { 
      label: "CTA Clicks", 
      value: data.total_cta_clicks, 
      icon: MousePointerClick, 
      color: "bg-warning-soft text-warning",
      barColor: "bg-warning",
    },
    { 
      label: "Form Started", 
      value: data.total_form_starts, 
      icon: FormInput, 
      color: "bg-warning-soft text-warning",
      barColor: "bg-warning",
    },
    { 
      label: "Form Submitted", 
      value: data.total_form_submits, 
      icon: Send, 
      color: "bg-success-soft text-success",
      barColor: "bg-success",
    },
  ];

  const maxValue = Math.max(...steps.map(s => s.value), 1);

  // Drop-off calculations
  const formDropOff = data.total_form_starts > 0 
    ? Math.round(((data.total_form_starts - data.total_form_submits) / data.total_form_starts) * 100)
    : 0;
  const viewToClickRate = data.total_property_views > 0
    ? ((data.total_cta_clicks / data.total_property_views) * 100).toFixed(1)
    : "0";
  const overallConversion = data.total_page_views > 0
    ? ((data.total_form_submits / data.total_page_views) * 100).toFixed(2)
    : "0";

  return (
    <Card>
      <CardHeader className="py-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <MousePointerClick className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold">Engagement Funnel</CardTitle>
          </div>
          <span className="text-[10px] text-muted-foreground">Last 90 days</span>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0 space-y-4">
        {/* Funnel bars */}
        <div className="space-y-2.5">
          {steps.map((step) => {
            const Icon = step.icon;
            const width = Math.max((step.value / maxValue) * 100, 2);
            return (
              <div key={step.label} className="flex items-center gap-3">
                <div className={`rounded-lg p-1.5 shrink-0 ${step.color}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <span className="text-xs font-medium">{step.label}</span>
                    <span className="text-xs font-bold tabular-nums">
                      {step.value.toLocaleString()}
                      {step.unique !== undefined && (
                        <span className="text-[10px] font-normal text-muted-foreground ml-1">
                          ({step.unique.toLocaleString()} unique)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${step.barColor} transition-all duration-500`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drop-off insights */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold text-foreground">{viewToClickRate}%</p>
            <p className="text-[10px] text-muted-foreground leading-tight">View → Click Rate</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className={`text-lg font-bold ${formDropOff > 50 ? 'text-danger' : formDropOff > 25 ? 'text-warning' : 'text-success'}`}>
              {formDropOff}%
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">Form Drop-Off</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold text-foreground">{overallConversion}%</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Overall Conversion</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
