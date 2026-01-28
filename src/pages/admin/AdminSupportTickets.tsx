import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MessageSquare,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Mail,
  Calendar,
  Loader2,
  Archive,
} from "lucide-react";
import { format } from "date-fns";

interface SupportTicket {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminSupportTickets() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;

    setIsUpdating(true);
    try {
      const updateData: Partial<SupportTicket> = {
        admin_notes: adminNotes || selectedTicket.admin_notes,
        status: newStatus || selectedTicket.status,
      };

      if (newStatus === "resolved" && selectedTicket.status !== "resolved") {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("support_tickets")
        .update(updateData)
        .eq("id", selectedTicket.id);

      if (error) throw error;

      toast({
        title: "Ticket Updated",
        description: "Support ticket has been updated successfully.",
      });

      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const openTicketDialog = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setAdminNotes(ticket.admin_notes || "");
    setNewStatus(ticket.status);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Open</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/30"><Clock className="h-3 w-3" /> In Progress</Badge>;
      case "resolved":
        return <Badge variant="outline" className="gap-1 text-green-600 border-green-500/30 bg-green-500/10"><CheckCircle className="h-3 w-3" /> Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "normal":
        return <Badge variant="secondary">Normal</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openTickets = filteredTickets.filter(t => t.status === "open");
  const inProgressTickets = filteredTickets.filter(t => t.status === "in_progress");
  const resolvedTickets = filteredTickets.filter(t => t.status === "resolved");

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Support Tickets
            </h1>
            <p className="text-muted-foreground">Manage agent support requests and inquiries</p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Tickets</p>
                  <p className="text-3xl font-bold text-destructive">{openTickets.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-destructive/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-3xl font-bold text-amber-600">{inProgressTickets.length}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-600/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-3xl font-bold text-green-600">{resolvedTickets.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by subject, email, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tickets Table */}
        <Tabs defaultValue="open" className="space-y-4">
          <TabsList>
            <TabsTrigger value="open" className="gap-2">
              Open <Badge variant="destructive" className="ml-1 h-5 px-1.5">{openTickets.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="gap-2">
              In Progress <Badge variant="secondary" className="ml-1 h-5 px-1.5">{inProgressTickets.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="resolved" className="gap-2">
              Resolved <Badge variant="outline" className="ml-1 h-5 px-1.5">{resolvedTickets.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {["open", "in_progress", "resolved"].map(status => (
            <TabsContent key={status} value={status}>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(status === "open" ? openTickets : status === "in_progress" ? inProgressTickets : resolvedTickets).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No {status.replace("_", " ")} tickets
                          </TableCell>
                        </TableRow>
                      ) : (
                        (status === "open" ? openTickets : status === "in_progress" ? inProgressTickets : resolvedTickets).map(ticket => (
                          <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openTicketDialog(ticket)}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{ticket.subject}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">{ticket.message}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{ticket.name}</p>
                                  <p className="text-xs text-muted-foreground">{ticket.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(ticket.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm">View</Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Ticket Detail Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="sm:max-w-[600px]">
            {selectedTicket && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                  <DialogTitle>{selectedTicket.subject}</DialogTitle>
                  <DialogDescription>
                    From {selectedTicket.name} ({selectedTicket.email})
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Message */}
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
                  </div>

                  {/* Meta Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Created: {format(new Date(selectedTicket.created_at), "MMM d, yyyy h:mm a")}
                    </div>
                    {selectedTicket.resolved_at && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Resolved: {format(new Date(selectedTicket.resolved_at), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>

                  {/* Status Update */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Update Status</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Admin Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Admin Notes</label>
                    <Textarea
                      placeholder="Add internal notes about this ticket..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateTicket} disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Ticket"
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
