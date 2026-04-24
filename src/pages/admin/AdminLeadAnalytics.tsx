import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2,
  Home,
  UserCheck,
  Download,
  FileSpreadsheet
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { toast } from "sonner";

interface ProjectLead {
  id: string;
  name: string;
  email: string;
  persona: string | null;
  home_size: string | null;
  agent_status: string | null;
  created_at: string;
  project_id: string | null;
  presale_projects: {
    name: string;
    city: string;
  } | null;
}

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
};

const PIE_COLORS = [
  "hsl(221, 83%, 53%)", // blue
  "hsl(142, 71%, 45%)", // green
  "hsl(45, 93%, 47%)",  // yellow
  "hsl(0, 84%, 60%)",   // red
];

export default function AdminLeadAnalytics() {
  const { data: projectLeads, isLoading } = useQuery({
    queryKey: ["admin-lead-analytics"],
    queryFn: async () => {
      // Fetch last 90 days of leads for analytics (scalable limit)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const { data, error } = await supabase
        .from("project_leads")
        .select(`
          id,
          name,
          email,
          persona,
          home_size,
          agent_status,
          created_at,
          project_id,
          presale_projects (
            name,
            city
          )
        `)
        .neq("name", "Newsletter Signup")
        .gte("created_at", ninetyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) throw error;
      return data as ProjectLead[];
    },
  });

  // Calculate metrics
  const totalLeads = projectLeads?.length || 0;

  // Leads by persona
  const personaData = projectLeads?.reduce((acc, lead) => {
    const persona = lead.persona || "unknown";
    const label = persona === "first_time" ? "First-time Buyer" 
      : persona === "investor" ? "Investor" 
      : persona === "realtor" ? "Realtor" 
      : "Unknown";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const personaChartData = Object.entries(personaData).map(([name, value]) => ({
    name,
    value,
    percentage: totalLeads > 0 ? Math.round((value / totalLeads) * 100) : 0,
  }));

  // Leads by home size
  const homeSizeData = projectLeads?.reduce((acc, lead) => {
    const size = lead.home_size || "unknown";
    const label = size === "1_bed" ? "1 Bedroom" 
      : size === "2_bed" ? "2 Bedroom" 
      : size === "3_bed_plus" ? "3+ Bedroom" 
      : "Unknown";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const homeSizeChartData = Object.entries(homeSizeData).map(([name, value]) => ({
    name,
    value,
    percentage: totalLeads > 0 ? Math.round((value / totalLeads) * 100) : 0,
  }));

  // Leads by agent status
  const agentStatusData = projectLeads?.reduce((acc, lead) => {
    const status = lead.agent_status || "unknown";
    const label = status === "i_am_realtor" ? "Is Agent" 
      : status === "yes" ? "Has Agent" 
      : status === "no" ? "No Agent" 
      : "Unknown";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const agentStatusChartData = Object.entries(agentStatusData).map(([name, value]) => ({
    name,
    value,
    percentage: totalLeads > 0 ? Math.round((value / totalLeads) * 100) : 0,
  }));

  // Leads by project (top 10)
  const projectData = projectLeads?.reduce((acc, lead) => {
    const projectName = lead.presale_projects?.name || "No Project";
    acc[projectName] = (acc[projectName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const projectChartData = Object.entries(projectData)
    .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + "..." : name, fullName: name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Leads over time (last 30 days)
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const leadsOverTime = last30Days.map((day) => {
    const dayStart = startOfDay(day);
    const count = projectLeads?.filter((lead) => {
      const leadDate = startOfDay(new Date(lead.created_at));
      return leadDate.getTime() === dayStart.getTime();
    }).length || 0;
    return {
      date: format(day, "MMM d"),
      leads: count,
    };
  });

  // Calculate week-over-week growth
  const thisWeekLeads = projectLeads?.filter((lead) => {
    const leadDate = new Date(lead.created_at);
    return leadDate >= subDays(new Date(), 7);
  }).length || 0;

  const lastWeekLeads = projectLeads?.filter((lead) => {
    const leadDate = new Date(lead.created_at);
    return leadDate >= subDays(new Date(), 14) && leadDate < subDays(new Date(), 7);
  }).length || 0;

  const weekGrowth = lastWeekLeads > 0 
    ? Math.round(((thisWeekLeads - lastWeekLeads) / lastWeekLeads) * 100) 
    : thisWeekLeads > 0 ? 100 : 0;

  // Export functions
  const downloadCSV = (filename: string, content: string) => {
    const encodedUri = encodeURI(content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} downloaded`);
  };

  const exportSummaryReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Lead Analytics Summary Report\n";
    csvContent += `Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}\n\n`;
    
    csvContent += "SUMMARY METRICS\n";
    csvContent += `Total Leads,${totalLeads}\n`;
    csvContent += `This Week,${thisWeekLeads}\n`;
    csvContent += `Last Week,${lastWeekLeads}\n`;
    csvContent += `Week-over-Week Growth,${weekGrowth}%\n`;
    csvContent += `Active Projects,${Object.keys(projectData).length}\n`;
    csvContent += `Leads Without Agent,${agentStatusData["No Agent"] || 0}\n\n`;
    
    csvContent += "BY PERSONA\n";
    csvContent += "Persona,Count,Percentage\n";
    personaChartData.forEach(item => {
      csvContent += `${item.name},${item.value},${item.percentage}%\n`;
    });
    csvContent += "\n";
    
    csvContent += "BY HOME SIZE\n";
    csvContent += "Home Size,Count,Percentage\n";
    homeSizeChartData.forEach(item => {
      csvContent += `${item.name},${item.value},${item.percentage}%\n`;
    });
    csvContent += "\n";
    
    csvContent += "BY AGENT STATUS\n";
    csvContent += "Status,Count,Percentage\n";
    agentStatusChartData.forEach(item => {
      csvContent += `${item.name},${item.value},${item.percentage}%\n`;
    });
    csvContent += "\n";
    
    csvContent += "TOP PROJECTS\n";
    csvContent += "Project,Leads\n";
    projectChartData.forEach(item => {
      csvContent += `"${item.fullName}",${item.value}\n`;
    });
    
    downloadCSV(`lead-analytics-summary-${format(new Date(), "yyyy-MM-dd")}.csv`, csvContent);
  };

  const exportDailyTrend = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Leads\n";
    leadsOverTime.forEach(item => {
      csvContent += `${item.date},${item.leads}\n`;
    });
    downloadCSV(`lead-daily-trend-${format(new Date(), "yyyy-MM-dd")}.csv`, csvContent);
  };

  const exportByProject = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Project,Leads,Percentage\n";
    Object.entries(projectData)
      .sort(([, a], [, b]) => b - a)
      .forEach(([name, count]) => {
        const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
        csvContent += `"${name}",${count},${percentage}%\n`;
      });
    downloadCSV(`leads-by-project-${format(new Date(), "yyyy-MM-dd")}.csv`, csvContent);
  };

  const chartConfig = {
    leads: { label: "Leads", color: COLORS.primary },
    value: { label: "Count", color: COLORS.primary },
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Lead Analytics</h1>
            <p className="text-muted-foreground">
              Conversion metrics and lead insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportSummaryReport}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Full Summary Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportDailyTrend}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Daily Trend Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportByProject}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Leads by Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge variant="secondary" className="text-sm py-1 px-3 w-fit">
              <BarChart3 className="h-4 w-4 mr-1.5" />
              Last 30 Days
            </Badge>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalLeads}</p>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{thisWeekLeads}</p>
                  <p className="text-sm text-muted-foreground">
                    This Week
                    {weekGrowth !== 0 && (
                      <span className={weekGrowth > 0 ? "text-success ml-1" : "text-danger ml-1"}>
                        {weekGrowth > 0 ? "+" : ""}{weekGrowth}%
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Object.keys(projectData).length}</p>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {agentStatusData["No Agent"] || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Without Agent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Leads Over Time</CardTitle>
            <CardDescription>Daily lead submissions for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={leadsOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads by Persona */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Leads by Persona
              </CardTitle>
              <CardDescription>Buyer type distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
                  <PieChart>
                    <Pie
                      data={personaChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {personaChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex-1 space-y-2">
                  {personaChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="text-sm font-medium">
                        {item.value} <span className="text-muted-foreground">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leads by Home Size */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Leads by Home Size
              </CardTitle>
              <CardDescription>Unit size preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
                  <PieChart>
                    <Pie
                      data={homeSizeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {homeSizeChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex-1 space-y-2">
                  {homeSizeChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="text-sm font-medium">
                        {item.value} <span className="text-muted-foreground">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leads by Agent Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Leads by Agent Status
              </CardTitle>
              <CardDescription>Agent relationship breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
                  <PieChart>
                    <Pie
                      data={agentStatusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {agentStatusChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex-1 space-y-2">
                  {agentStatusChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="text-sm font-medium">
                        {item.value} <span className="text-muted-foreground">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Top Projects by Leads
              </CardTitle>
              <CardDescription>Projects generating the most interest</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={projectChartData} layout="vertical">
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false}
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value, name, props) => [value, props.payload.fullName]}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
