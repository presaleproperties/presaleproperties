import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Eye, Users, FileText, MousePointerClick, Send, MapPin } from "lucide-react";

interface TopProject {
  project_id: string;
  project_name: string;
  project_city: string;
  total_views: number;
  unique_visitors: number;
  floorplan_views: number;
  cta_clicks: number;
  form_starts: number;
  form_submits: number;
}

interface TopProjectsTableProps {
  projects: TopProject[];
}

export function TopProjectsTable({ projects }: TopProjectsTableProps) {
  if (!projects || projects.length === 0) return null;

  return (
    <Card>
      <CardHeader className="py-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-info-soft p-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-info" />
            </div>
            <CardTitle className="text-sm font-semibold">Top Projects by Engagement</CardTitle>
          </div>
          <span className="text-[10px] text-muted-foreground">Last 90 days</span>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">#</th>
                <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Project</th>
                <th className="text-center py-2 px-2 font-semibold text-muted-foreground" title="Total Views">
                  <Eye className="h-3 w-3 mx-auto" />
                </th>
                <th className="text-center py-2 px-2 font-semibold text-muted-foreground" title="Unique Visitors">
                  <Users className="h-3 w-3 mx-auto" />
                </th>
                <th className="text-center py-2 px-2 font-semibold text-muted-foreground" title="Floorplan Views">
                  <FileText className="h-3 w-3 mx-auto" />
                </th>
                <th className="text-center py-2 px-2 font-semibold text-muted-foreground" title="CTA Clicks">
                  <MousePointerClick className="h-3 w-3 mx-auto" />
                </th>
                <th className="text-center py-2 px-2 font-semibold text-muted-foreground" title="Form Submits">
                  <Send className="h-3 w-3 mx-auto" />
                </th>
                <th className="text-center py-2 px-2 font-semibold text-muted-foreground">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => {
                const convRate = project.total_views > 0 
                  ? ((project.form_submits / project.total_views) * 100).toFixed(1)
                  : "0";
                const dropOff = project.form_starts > 0 && project.form_starts > project.form_submits;
                return (
                  <tr 
                    key={project.project_id} 
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2.5 pr-3">
                      <span className="text-[10px] font-bold text-info bg-info-soft px-1.5 py-0.5 rounded">
                        #{index + 1}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Link 
                        to={`/admin/projects/${project.project_id}/edit`}
                        className="hover:text-info transition-colors"
                      >
                        <p className="font-medium truncate max-w-[180px]">{project.project_name}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {project.project_city}
                        </p>
                      </Link>
                    </td>
                    <td className="py-2.5 px-2 text-center font-medium">{project.total_views.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-center text-muted-foreground">{project.unique_visitors.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-center text-muted-foreground">{project.floorplan_views}</td>
                    <td className="py-2.5 px-2 text-center text-muted-foreground">{project.cta_clicks}</td>
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>{project.form_submits}</span>
                        {dropOff && (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 bg-danger-soft text-danger border-danger/30" title={`${project.form_starts - project.form_submits} abandoned`}>
                            -{project.form_starts - project.form_submits}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 ${
                          Number(convRate) > 2 ? 'bg-success-soft text-success-strong border-success/30' :
                          Number(convRate) > 0 ? 'bg-warning-soft text-warning-strong border-warning/30' :
                          'bg-muted text-muted-foreground'
                        }`}
                      >
                        {convRate}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/30">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Eye className="h-2.5 w-2.5" /> Views</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Users className="h-2.5 w-2.5" /> Unique</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><FileText className="h-2.5 w-2.5" /> Floorplans</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MousePointerClick className="h-2.5 w-2.5" /> CTAs</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Send className="h-2.5 w-2.5" /> Leads</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-danger-soft text-danger border-danger/30">-N</Badge> Drop-offs
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
