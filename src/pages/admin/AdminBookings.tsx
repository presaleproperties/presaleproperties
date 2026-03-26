import { useState, useEffect } from "react";
import { Helmet } from "@/components/seo/Helmet";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Phone, 
  Mail, 
  Search, 
  Check, 
  X, 
  Loader2,
  Building2,
  Inbox,
  User,
  CalendarCheck,
  CalendarClock,
  CalendarX
} from "lucide-react";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

interface Booking {
  id: string;
  appointment_type: "preview" | "showing";
  appointment_date: string;
  appointment_time: string | null;
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

const formatBuyerType = (type: string) => {
  const labels: Record<string, string> = {
    first_time: "First-time Buyer",
    investor: "Investor",
    upgrader: "Upgrading",
    other: "Other",
  };
  return labels[type] || type;
};

const formatTimeline = (timeline: string) => {
  const labels: Record<string, string> = {
    "0_3_months": "0–3 months",
    "3_6_months": "3–6 months",
    "6_12_months": "6–12 months",
    "12_plus_months": "12+ months",
  };
  return labels[timeline] || timeline;
};

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
  confirmed: { label: "Confirmed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  completed: { label: "Completed", className: "bg-sky-100 text-sky-800 border-sky-200" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

function BookingCard({ 
  booking, 
  onConfirm, 
  onCancel, 
  onComplete,
  processing 
}: { 
  booking: Booking; 
  onConfirm: () => void; 
  onCancel: () => void; 
  onComplete: () => void;
  processing: boolean;
}) {
  const config = statusConfig[booking.status];
  const isPast = new Date(booking.appointment_date) < new Date(new Date().toDateString());

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Left section */}
          <div className="flex gap-4 flex-1 min-w-0">
            {/* Date block */}
            <div className={`flex flex-col items-center justify-center rounded-lg border px-3 py-2 min-w-[64px] text-center shrink-0 ${isPast && booking.status !== "completed" ? "bg-muted/50" : "bg-card"}`}>
              <span className="text-xs font-medium text-muted-foreground uppercase">
                {format(parseISO(booking.appointment_date), "MMM")}
              </span>
              <span className="text-xl font-bold text-foreground leading-tight">
                {format(parseISO(booking.appointment_date), "d")}
              </span>
              <span className="text-xs text-muted-foreground">
                {booking.appointment_time 
                  ? format(parseISO(`2000-01-01T${booking.appointment_time}`), "h:mm a")
                  : "—"}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-2 min-w-0">
              {/* Name + Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">{booking.name}</h3>
                <Badge variant="outline" className={config.className}>
                  {config.label}
                </Badge>
                <Badge variant="outline" className="text-xs font-normal">
                  {booking.appointment_type === "preview" ? "Preview" : "Showing"}
                </Badge>
              </div>

              {/* Contact */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {booking.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {booking.phone}
                </span>
              </div>

              {/* Project + Profile */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="gap-1 font-normal">
                  <Building2 className="h-3 w-3" />
                  {booking.project_name}
                  {booking.project_city && ` · ${booking.project_city}`}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatBuyerType(booking.buyer_type)} · {formatTimeline(booking.timeline)}
                </span>
              </div>

              {/* Notes */}
              {booking.notes && (
                <p className="text-xs text-muted-foreground italic truncate max-w-md" title={booking.notes}>
                  "{booking.notes}"
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0 sm:pt-1">
            {booking.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                  onClick={onConfirm}
                  disabled={processing}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Confirm</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-destructive hover:bg-destructive/10"
                  onClick={onCancel}
                  disabled={processing}
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Decline</span>
                </Button>
              </>
            )}
            {booking.status === "confirmed" && (
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={onComplete}
                disabled={processing}
              >
                Mark Done
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
      toast({ title: "Error loading bookings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (booking: Booking, newStatus: BookingStatus) => {
    setProcessing(true);
    try {
      const updateData: Record<string, any> = { status: newStatus };
      if (newStatus === "confirmed") updateData.confirmed_at = new Date().toISOString();
      else if (newStatus === "cancelled") updateData.cancelled_at = new Date().toISOString();

      const { error } = await supabase.from("bookings").update(updateData).eq("id", booking.id);
      if (error) throw error;

      if (newStatus === "confirmed" || newStatus === "cancelled") {
        await supabase.functions.invoke("send-booking-status-update", {
          body: {
            email: booking.email,
            name: booking.name,
            project_name: booking.project_name,
            appointment_date: format(parseISO(booking.appointment_date), "EEEE, MMMM d, yyyy"),
            appointment_time: booking.appointment_time 
              ? format(parseISO(`2000-01-01T${booking.appointment_time}`), "h:mm a")
              : "",
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
      toast({ title: "Error updating booking", variant: "destructive" });
    } finally {
      setProcessing(false);
      setSelectedBooking(null);
      setActionType(null);
    }
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
  const confirmedCount = bookings.filter(b => b.status === "confirmed").length;
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
      <Helmet>
        <title>Bookings | Admin</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            {bookings.length} total appointments
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-amber-100 p-2.5">
                <CalendarClock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-emerald-100 p-2.5">
                <CalendarCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{confirmedCount}</p>
                <p className="text-xs text-muted-foreground">Confirmed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-sky-500">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-sky-100 p-2.5">
                <Calendar className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayCount}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as BookingStatus | "all")}>
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs px-3">Pending</TabsTrigger>
              <TabsTrigger value="confirmed" className="text-xs px-3">Confirmed</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs px-3">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Booking Cards */}
        <div className="space-y-2">
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No bookings found</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                processing={processing}
                onConfirm={() => { setSelectedBooking(booking); setActionType("confirm"); }}
                onCancel={() => { setSelectedBooking(booking); setActionType("cancel"); }}
                onComplete={() => handleStatusChange(booking, "completed")}
              />
            ))
          )}
        </div>
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
                : `This will cancel ${selectedBooking?.name}'s appointment and notify them via email.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={processing}
              className={actionType === "cancel" ? "bg-destructive hover:bg-destructive/90" : ""}
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
