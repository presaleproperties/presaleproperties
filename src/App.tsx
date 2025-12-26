import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/dashboard/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import Index from "./pages/Index";
import Assignments from "./pages/Assignments";
import ListingDetail from "./pages/ListingDetail";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Login from "./pages/Login";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import DashboardListings from "./pages/dashboard/DashboardListings";
import DashboardLeads from "./pages/dashboard/DashboardLeads";
import DashboardProfile from "./pages/dashboard/DashboardProfile";
import ListingForm from "./pages/dashboard/ListingForm";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminAgents from "./pages/admin/AdminAgents";
import AdminListings from "./pages/admin/AdminListings";
import AdminAllListings from "./pages/admin/AdminAllListings";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/assignments/:id" element={<ListingDetail />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Dashboard Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
            <Route path="/dashboard/listings" element={<ProtectedRoute><DashboardListings /></ProtectedRoute>} />
            <Route path="/dashboard/listings/new" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
            <Route path="/dashboard/listings/:id/edit" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
            <Route path="/dashboard/leads" element={<ProtectedRoute><DashboardLeads /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><DashboardProfile /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminProtectedRoute><AdminOverview /></AdminProtectedRoute>} />
            <Route path="/admin/agents" element={<AdminProtectedRoute><AdminAgents /></AdminProtectedRoute>} />
            <Route path="/admin/listings" element={<AdminProtectedRoute><AdminListings /></AdminProtectedRoute>} />
            <Route path="/admin/all-listings" element={<AdminProtectedRoute><AdminAllListings /></AdminProtectedRoute>} />
            <Route path="/admin/payments" element={<AdminProtectedRoute><AdminPayments /></AdminProtectedRoute>} />
            <Route path="/admin/settings" element={<AdminProtectedRoute><AdminSettings /></AdminProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
