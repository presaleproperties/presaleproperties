import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Receipt, 
  ExternalLink, 
  Loader2,
  CreditCard,
  Download
} from "lucide-react";
import { format } from "date-fns";

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  receipt_url: string | null;
  listing_id: string | null;
  agent_id: string | null;
  listing?: { title: string; project_name: string } | null;
  [key: string]: any;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completed: { label: "Paid", variant: "default" },
  pending: { label: "Pending", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
  refunded: { label: "Refunded", variant: "secondary" },
};

export default function DashboardBilling() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from("payments")
        .select(`
          *,
          listing:listings(title, project_name)
        `)
        .eq("agent_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setPayments(data || []);
      
      const total = (data || [])
        .filter(p => p.status === "completed")
        .reduce((sum, p) => sum + Number(p.amount), 0);
      setTotalSpent(total);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(price);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Billing & Receipts</h1>
          <p className="text-muted-foreground">View your payment history and download receipts</p>
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{payments.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {payments.filter(p => p.status === "pending").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription>
              All your listing payments and receipts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No payments yet</h3>
                <p className="text-muted-foreground">
                  Your payment history will appear here once you publish a listing.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">
                          {payment.listing?.title || "Listing Payment"}
                        </h4>
                        <Badge variant={statusLabels[payment.status]?.variant || "secondary"}>
                          {statusLabels[payment.status]?.label || payment.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payment.listing?.project_name || "Unknown Project"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(payment.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold">
                        {formatPrice(Number(payment.amount))}
                      </p>
                      
                      {payment.receipt_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a 
                            href={payment.receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Receipt
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
