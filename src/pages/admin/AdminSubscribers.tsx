import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Mail, 
  Search, 
  Download,
  Bell,
  Calendar,
  TrendingUp
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

export default function AdminSubscribers() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch subscribers (newsletter signups without project_id)
  const { data: subscribers, isLoading } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_leads")
        .select("id, email, created_at")
        .eq("name", "Newsletter Signup")
        .is("project_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Subscriber[];
    },
  });

  // Filter subscribers based on search
  const filteredSubscribers = subscribers?.filter(
    (sub) => sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalSubscribers = subscribers?.length || 0;
  const thisWeekSubscribers = subscribers?.filter(sub => {
    const subDate = new Date(sub.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return subDate >= weekAgo;
  }).length || 0;
  
  const thisMonthSubscribers = subscribers?.filter(sub => {
    const subDate = new Date(sub.created_at);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return subDate >= monthAgo;
  }).length || 0;

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredSubscribers || filteredSubscribers.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Email,Subscribed At\n";
    
    filteredSubscribers.forEach((sub) => {
      csvContent += `"${sub.email}","${format(new Date(sub.created_at), "yyyy-MM-dd HH:mm")}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Subscribers</h1>
            <p className="text-muted-foreground">
              People who signed up for new project alerts
            </p>
          </div>
          <Badge variant="secondary" className="text-sm py-1.5 px-4 w-fit">
            <Bell className="h-4 w-4 mr-2" />
            {totalSubscribers} Total Subscribers
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSubscribers}</p>
              <p className="text-sm text-muted-foreground">Total Subscribers</p>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{thisWeekSubscribers}</p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{thisMonthSubscribers}</p>
              <p className="text-sm text-muted-foreground">This Month</p>
            </div>
          </div>
        </div>

        {/* Search & Export */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={!filteredSubscribers?.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Subscribers Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredSubscribers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12">
                    <Bell className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No subscribers found</p>
                    <p className="text-sm text-muted-foreground">
                      Subscribers will appear here when people sign up for alerts
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscribers?.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{sub.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div>
                        {format(new Date(sub.created_at), "MMM d, yyyy")}
                        <span className="text-xs ml-2">
                          {format(new Date(sub.created_at), "h:mm a")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`mailto:${sub.email}`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {filteredSubscribers && filteredSubscribers.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Showing {filteredSubscribers.length} of {totalSubscribers} subscribers
          </p>
        )}
      </div>
    </AdminLayout>
  );
}
