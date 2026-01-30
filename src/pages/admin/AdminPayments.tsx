import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { 
  DollarSign,
  Loader2,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

type Payment = Tables<"payments"> & {
  agent_profile?: {
    full_name: string | null;
    email: string;
  };
  listing?: {
    title: string;
  };
};

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setPayments([]);
        setTotalRevenue(0);
        setLoading(false);
        return;
      }

      // Batch fetch all related data in parallel (avoids N+1)
      const agentIds = [...new Set(data.map(p => p.agent_id).filter(Boolean))];
      const listingIds = [...new Set(data.map(p => p.listing_id).filter(Boolean))];

      const [profilesResult, listingsResult] = await Promise.all([
        agentIds.length > 0 
          ? supabase.from("profiles").select("user_id, full_name, email").in("user_id", agentIds)
          : Promise.resolve({ data: [] }),
        listingIds.length > 0 
          ? supabase.from("listings").select("id, title").in("id", listingIds)
          : Promise.resolve({ data: [] })
      ]);

      // Create lookup maps
      const profileMap = new Map(
        (profilesResult.data || []).map(p => [p.user_id, { full_name: p.full_name, email: p.email }])
      );
      const listingMap = new Map(
        (listingsResult.data || []).map(l => [l.id, { title: l.title }])
      );

      // Merge data
      const paymentsWithDetails = data.map(payment => ({
        ...payment,
        agent_profile: payment.agent_id ? profileMap.get(payment.agent_id) : undefined,
        listing: payment.listing_id ? listingMap.get(payment.listing_id) : undefined
      }));

      setPayments(paymentsWithDetails);
      
      // Calculate total revenue from completed payments
      const total = paymentsWithDetails
        .filter(p => p.status === "completed")
        .reduce((sum, p) => sum + Number(p.amount), 0);
      setTotalRevenue(total);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast({
        title: "Error",
        description: "Failed to load payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground">View all payment records</p>
        </div>

        {/* Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {payments.filter(p => p.status === "completed").length} completed payments
            </p>
          </CardContent>
        </Card>

        {/* Payments Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : payments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No payments yet</h3>
              <p className="text-muted-foreground">
                Payment records will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(payment.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {payment.agent_profile?.full_name || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payment.agent_profile?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {payment.listing?.title || "Unknown listing"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(Number(payment.amount))}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell>
                      {payment.receipt_url ? (
                        <a 
                          href={payment.receipt_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
