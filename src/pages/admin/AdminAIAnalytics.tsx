import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { 
  Brain, 
  TrendingUp, 
  Users, 
  MousePointerClick,
  Mail,
  Eye,
  Target,
  Download,
  FileSpreadsheet,
  Sparkles
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { toast } from "sonner";

interface AIAlert {
  id: string;
  client_id: string;
  alert_type: string;
  property_name: string | null;
  property_address: string | null;
  price: number | null;
  status: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  created_at: string;
  client: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    intent_score: number | null;
  } | null;
}

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
};

const PIE_COLORS = [
  "hsl(45, 93%, 47%)",   // gold
  "hsl(221, 83%, 53%)",  // blue
  "hsl(142, 71%, 45%)",  // green
  "hsl(0, 84%, 60%)",    // red
];

export default function AdminAIAnalytics() {
  // Fetch AI recommendation alerts
  const { data: aiAlerts, isLoading } = useQuery({
    queryKey: ["admin-ai-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_alerts")
        .select(`
          id,
          client_id,
          alert_type,
          property_name,
          property_address,
          price,
          status,
          sent_at,
          opened_at,
          clicked_at,
          created_at,
          client:clients(email, first_name, last_name, intent_score)
        `)
        .eq("alert_type", "ai_recommendation")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as AIAlert[];
    },
  });

  // Fetch all alert types for comparison
  const { data: allAlerts } = useQuery({
    queryKey: ["admin-all-alerts-comparison"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_alerts")
        .select("alert_type, opened_at, clicked_at")
        .gte("created_at", subDays(new Date(), 30).toISOString());

      if (error) throw error;
      return data;
    },
  });

  // Calculate metrics
  const totalSent = aiAlerts?.length || 0;
  const uniqueClients = new Set(aiAlerts?.map(a => a.client_id)).size;
  
  const opened = aiAlerts?.filter(a => a.opened_at).length || 0;
  const clicked = aiAlerts?.filter(a => a.clicked_at).length || 0;
  
  const openRate = totalSent > 0 ? Math.round((opened / totalSent) * 100) : 0;
  const clickRate = totalSent > 0 ? Math.round((clicked / totalSent) * 100) : 0;
  const clickToOpenRate = opened > 0 ? Math.round((clicked / opened) * 100) : 0;

  // Alerts over time (last 30 days)
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const alertsOverTime = last30Days.map((day) => {
    const dayStart = startOfDay(day);
    const dayAlerts = aiAlerts?.filter((alert) => {
      if (!alert.sent_at) return false;
      const alertDate = startOfDay(new Date(alert.sent_at));
      return alertDate.getTime() === dayStart.getTime();
    }) || [];
    
    return {
      date: format(day, "MMM d"),
      sent: dayAlerts.length,
      opened: dayAlerts.filter(a => a.opened_at).length,
      clicked: dayAlerts.filter(a => a.clicked_at).length,
    };
  });

  // Compare AI vs regular alerts
  const alertTypeComparison = (() => {
    if (!allAlerts) return [];
    
    const types: Record<string, { sent: number; opened: number; clicked: number }> = {};
    
    for (const alert of allAlerts) {
      const type = alert.alert_type === "ai_recommendation" ? "AI Recommendations" : "Saved Search Alerts";
      if (!types[type]) types[type] = { sent: 0, opened: 0, clicked: 0 };
      types[type].sent++;
      if (alert.opened_at) types[type].opened++;
      if (alert.clicked_at) types[type].clicked++;
    }
    
    return Object.entries(types).map(([name, data]) => ({
      name,
      openRate: data.sent > 0 ? Math.round((data.opened / data.sent) * 100) : 0,
      clickRate: data.sent > 0 ? Math.round((data.clicked / data.sent) * 100) : 0,
      sent: data.sent,
    }));
  })();

  // Top performing properties
  const propertyPerformance = (() => {
    if (!aiAlerts) return [];
    
    const props: Record<string, { name: string; sent: number; clicked: number }> = {};
    
    for (const alert of aiAlerts) {
      const key = alert.property_name || "Unknown";
      if (!props[key]) props[key] = { name: key, sent: 0, clicked: 0 };
      props[key].sent++;
      if (alert.clicked_at) props[key].clicked++;
    }
    
    return Object.values(props)
      .map(p => ({ ...p, clickRate: p.sent > 0 ? Math.round((p.clicked / p.sent) * 100) : 0 }))
      .sort((a, b) => b.clicked - a.clicked)
      .slice(0, 10);
  })();

  // Recent recipients
  const recentRecipients = (() => {
    if (!aiAlerts) return [];
    
    const clientMap: Record<string, {
      email: string;
      name: string;
      totalSent: number;
      opened: number;
      clicked: number;
      lastSent: string;
      intentScore: number;
    }> = {};
    
    for (const alert of aiAlerts) {
      const clientId = alert.client_id;
      if (!clientMap[clientId]) {
        clientMap[clientId] = {
          email: alert.client?.email || "Unknown",
          name: [alert.client?.first_name, alert.client?.last_name].filter(Boolean).join(" ") || "Unknown",
          totalSent: 0,
          opened: 0,
          clicked: 0,
          lastSent: alert.sent_at || alert.created_at,
          intentScore: alert.client?.intent_score || 0,
        };
      }
      clientMap[clientId].totalSent++;
      if (alert.opened_at) clientMap[clientId].opened++;
      if (alert.clicked_at) clientMap[clientId].clicked++;
      if (alert.sent_at && alert.sent_at > clientMap[clientId].lastSent) {
        clientMap[clientId].lastSent = alert.sent_at;
      }
    }
    
    return Object.values(clientMap)
      .sort((a, b) => new Date(b.lastSent).getTime() - new Date(a.lastSent).getTime())
      .slice(0, 20);
  })();

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

  const exportSummary = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "AI Recommendations Performance Report\n";
    csvContent += `Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}\n\n`;
    
    csvContent += "SUMMARY METRICS\n";
    csvContent += `Total Recommendations Sent,${totalSent}\n`;
    csvContent += `Unique Clients,${uniqueClients}\n`;
    csvContent += `Open Rate,${openRate}%\n`;
    csvContent += `Click Rate,${clickRate}%\n`;
    csvContent += `Click-to-Open Rate,${clickToOpenRate}%\n\n`;
    
    csvContent += "TOP PROPERTIES BY CLICKS\n";
    csvContent += "Property,Sent,Clicked,Click Rate\n";
    propertyPerformance.forEach(p => {
      csvContent += `"${p.name}",${p.sent},${p.clicked},${p.clickRate}%\n`;
    });
    
    downloadCSV(`ai-recommendations-report-${format(new Date(), "yyyy-MM-dd")}.csv`, csvContent);
  };

  const exportRecipients = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Email,Name,Recommendations Sent,Opened,Clicked,Intent Score,Last Sent\n";
    recentRecipients.forEach(r => {
      csvContent += `"${r.email}","${r.name}",${r.totalSent},${r.opened},${r.clicked},${r.intentScore},"${r.lastSent}"\n`;
    });
    downloadCSV(`ai-recipients-${format(new Date(), "yyyy-MM-dd")}.csv`, csvContent);
  };

  const chartConfig = {
    sent: { label: "Sent", color: "hsl(221, 83%, 53%)" },
    opened: { label: "Opened", color: "hsl(45, 93%, 47%)" },
    clicked: { label: "Clicked", color: "hsl(142, 71%, 45%)" },
    openRate: { label: "Open Rate", color: "hsl(45, 93%, 47%)" },
    clickRate: { label: "Click Rate", color: "hsl(142, 71%, 45%)" },
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" />
              AI Recommendation Analytics
            </h1>
            <p className="text-muted-foreground">
              Performance metrics for AI-powered property recommendations
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
                <DropdownMenuItem onClick={exportSummary}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Performance Summary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportRecipients}>
                  <Users className="h-4 w-4 mr-2" />
                  Recipient List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge variant="secondary" className="text-sm py-1 px-3">
              <Brain className="h-4 w-4 mr-1.5" />
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
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalSent}</p>
                  <p className="text-sm text-muted-foreground">Recommendations Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Eye className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{openRate}%</p>
                  <p className="text-sm text-muted-foreground">
                    Open Rate
                    <span className="text-xs ml-1">({opened} opened)</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <MousePointerClick className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{clickRate}%</p>
                  <p className="text-sm text-muted-foreground">
                    Click Rate
                    <span className="text-xs ml-1">({clicked} clicks)</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{uniqueClients}</p>
                  <p className="text-sm text-muted-foreground">Unique Recipients</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations Over Time</CardTitle>
            <CardDescription>Daily send, open, and click activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={alertsOverTime}>
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
                  dataKey="sent" 
                  stroke="hsl(221, 83%, 53%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(221, 83%, 53%)", strokeWidth: 0, r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="opened" 
                  stroke="hsl(45, 93%, 47%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(45, 93%, 47%)", strokeWidth: 0, r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="clicked" 
                  stroke="hsl(142, 71%, 45%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(142, 71%, 45%)", strokeWidth: 0, r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI vs Regular Alerts Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                AI vs Regular Alerts
              </CardTitle>
              <CardDescription>Open and click rate comparison</CardDescription>
            </CardHeader>
            <CardContent>
              {alertTypeComparison.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <BarChart data={alertTypeComparison} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={120}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="openRate" fill="hsl(45, 93%, 47%)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="clickRate" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No comparison data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performing Properties
              </CardTitle>
              <CardDescription>Most clicked recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              {propertyPerformance.length > 0 ? (
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
                  {propertyPerformance.slice(0, 5).map((prop, i) => (
                    <div key={prop.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-5">#{i + 1}</span>
                        <span className="text-sm font-medium truncate max-w-[180px]">{prop.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{prop.sent} sent</span>
                        <Badge variant={prop.clickRate > 10 ? "default" : "secondary"}>
                          {prop.clickRate}% CTR
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No property data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Recipients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Recipients</CardTitle>
            <CardDescription>Clients who received AI recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRecipients.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-center">Sent</TableHead>
                      <TableHead className="text-center">Opened</TableHead>
                      <TableHead className="text-center">Clicked</TableHead>
                      <TableHead className="text-center">Intent Score</TableHead>
                      <TableHead>Last Sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRecipients.map((recipient) => (
                      <TableRow key={recipient.email}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{recipient.name !== "Unknown" ? recipient.name : recipient.email}</p>
                            {recipient.name !== "Unknown" && (
                              <p className="text-sm text-muted-foreground">{recipient.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{recipient.totalSent}</TableCell>
                        <TableCell className="text-center">
                          <span className={recipient.opened > 0 ? "text-yellow-600 font-medium" : "text-muted-foreground"}>
                            {recipient.opened}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={recipient.clicked > 0 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                            {recipient.clicked}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={recipient.intentScore >= 20 ? "default" : "secondary"}>
                            {recipient.intentScore}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(recipient.lastSent), "MMM d, h:mm a")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No AI recommendations sent yet</p>
                <p className="text-sm mt-1">Recommendations will appear here once clients with browsing activity receive them</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
