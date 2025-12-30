import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Search, 
  Check, 
  X, 
  Loader2,
  Building2,
  Filter
} from "lucide-react";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

interface Booking {
  id: string;
  appointment_type: "preview" | "showing";
  appointment_date: string;
  appointment_time: string;
  status: BookingStatus;
  project_name: string;
  project_city: string | null;
  name: string;
  email: string;
  phone: string;
  buyer_type: string;
  timeline: string;
  notes: string | null;
  created_at: string;
}

export default function AdminBookings() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionType, setActionType] = useState<"confirm" | "cancel" | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error loading bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (booking: Booking, newStatus: BookingStatus) => {
    setProcessing(true);
    try {
      const updateData: Record<string, any> = { status: newStatus };
      
      if (newStatus === "confirmed") {
        updateData.confirmed_at = new Date().toISOString();
      } else if (newStatus === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", booking.id);

      if (error) throw error;

      // Send confirmation/cancellation email
      if (newStatus === "confirmed" || newStatus === "cancelled") {
        await supabase.functions.invoke("send-booking-status-update", {
          body: {
            email: booking.email,
            name: booking.name,
            project_name: booking.project_name,
            appointment_date: format(parseISO(booking.appointment_date), "EEEE, MMMM d, yyyy"),
            appointment_time: format(parseISO(`2000-01-01T${booking.appointment_time}`), "h:mm a"),
            status: newStatus,
          },
        });
      }

      toast({
        title: `Booking ${newStatus}`,
        description: `${booking.name}'s appointment has been ${newStatus}.`,
      });

      fetchBookings();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error updating booking",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setSelectedBooking(null);
      setActionType(null);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "confirmed":
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>;
    }
  };

  const formatBuyerType = (type: string) => {
    const labels: Record<string, string> = {
      first_time: "First-time",
      investor: "Investor",
      upgrader: "Upgrading",
      other: "Other",
    };
    return labels[type] || type;
  };

  const formatTimeline = (timeline: string) => {
    const labels: Record<string, string> = {
      "0_3_months": "0-3 mo",
      "3_6_months": "3-6 mo",
      "6_12_months": "6-12 mo",
      "12_plus_months": "12+ mo",
    };
    return labels[timeline] || timeline;
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.project_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const todayCount = bookings.filter(b => 
    b.appointment_date === format(new Date(), "yyyy-MM-dd") && 
    (b.status === "confirmed" || b.status === "pending")
  ).length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage appointment requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{todayCount}</div>
              <p className="text-sm text-muted-foreground">Today's Appointments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.status === "confirmed").length}
              </div>
              <p className="text-sm text-muted-foreground">Confirmed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{bookings.length}</div>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as BookingStatus | "all")}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">
                              {format(parseISO(booking.appointment_date), "MMM d, yyyy")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(parseISO(`2000-01-01T${booking.appointment_time}`), "h:mm a")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {booking.appointment_type === "preview" ? "Preview" : "Showing"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="truncate max-w-[150px]">
                            <div className="font-medium text-sm truncate">{booking.project_name}</div>
                            {booking.project_city && (
                              <div className="text-xs text-muted-foreground">{booking.project_city}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{booking.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {booking.email}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {booking.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatBuyerType(booking.buyer_type)}</div>
                          <div className="text-xs text-muted-foreground">{formatTimeline(booking.timeline)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell className="text-right">
                        {booking.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setActionType("confirm");
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setActionType("cancel");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {booking.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(booking, "completed")}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedBooking && !!actionType} onOpenChange={() => {
        setSelectedBooking(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "confirm" ? "Confirm Booking?" : "Cancel Booking?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "confirm" 
                ? `This will confirm ${selectedBooking?.name}'s appointment and send them a confirmation email.`
                : `This will cancel ${selectedBooking?.name}'s appointment and notify them via email.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={processing}
              className={actionType === "cancel" ? "bg-red-600 hover:bg-red-700" : ""}
              onClick={() => {
                if (selectedBooking && actionType) {
                  handleStatusChange(selectedBooking, actionType === "confirm" ? "confirmed" : "cancelled");
                }
              }}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === "confirm" ? "Confirm" : "Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
