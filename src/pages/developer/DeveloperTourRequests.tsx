import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperPortalLayout } from "@/components/developer/DeveloperPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Loader2, Calendar, Clock, User, Mail, Phone, Building2 } from "lucide-react";

interface TourRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
  project_name: string;
  notes: string | null;
  created_at: string;
}

export default function DeveloperTourRequests() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TourRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?type=developer");
      return;
    }

    if (user) {
      fetchTourRequests();
    }
  }, [user, authLoading, navigate]);

  const fetchTourRequests = async () => {
    if (!user) return;

    const { data: devProfile } = await supabase
      .from("developer_profiles")
      .select("id, verification_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!devProfile || devProfile.verification_status !== "approved") {
      navigate("/developer");
      return;
    }

    const { data: projects } = await supabase
      .from("presale_projects")
      .select("id")
      .eq("developer_id", devProfile.id);

    if (!projects || projects.length === 0) {
      setLoading(false);
      return;
    }

    const projectIds = projects.map(p => p.id);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .in("project_id", projectIds)
      .order("appointment_date", { ascending: true });

    if (bookings) {
      setRequests(bookings);
    }

    setLoading(false);
  };


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DeveloperPortalLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Tour Requests</h1>
          <p className="text-muted-foreground">Agents requesting tours of your projects</p>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No tour requests yet</h2>
              <p className="text-muted-foreground">
                When agents book tours for your projects, they'll appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{request.project_name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(request.appointment_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {request.appointment_time}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>

                  <div className="border-t pt-4 grid sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{request.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                        {request.email}
                      </a>
                    </div>
                    {request.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${request.phone}`} className="text-primary hover:underline">
                          {request.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {request.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">{request.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DeveloperPortalLayout>
  );
}
