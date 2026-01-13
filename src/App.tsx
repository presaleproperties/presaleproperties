import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/dashboard/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SwipeNavigationProvider } from "@/components/SwipeNavigationProvider";
import Index from "./pages/Index";
import Assignments from "./pages/Assignments";
import ListingDetail from "./pages/ListingDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ForAgents from "./pages/ForAgents";
import ForDevelopers from "./pages/ForDevelopers";
import BuyersGuide from "./pages/BuyersGuide";
import PresaleGuide from "./pages/PresaleGuide";
import MortgageCalculatorPage from "./pages/MortgageCalculatorPage";
import Login from "./pages/Login";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import DashboardListings from "./pages/dashboard/DashboardListings";
import DashboardLeads from "./pages/dashboard/DashboardLeads";
import DashboardProfile from "./pages/dashboard/DashboardProfile";
import DashboardBilling from "./pages/dashboard/DashboardBilling";
import ListingForm from "./pages/dashboard/ListingForm";
import DeveloperDashboard from "./pages/developer/DeveloperDashboard";
import DeveloperProjects from "./pages/developer/DeveloperProjects";
import DeveloperTourRequests from "./pages/developer/DeveloperTourRequests";
import DeveloperSettings from "./pages/developer/DeveloperSettings";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminProjectForm from "./pages/admin/AdminProjectForm";
import AdminProjectImport from "./pages/admin/AdminProjectImport";
import AdminBlogs from "./pages/admin/AdminBlogs";
import AdminBlogForm from "./pages/admin/AdminBlogForm";
import AdminBlogImport from "./pages/admin/AdminBlogImport";
import AdminAgents from "./pages/admin/AdminAgents";
import AdminListings from "./pages/admin/AdminListings";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminLeadAnalytics from "./pages/admin/AdminLeadAnalytics";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminSchedulerSettings from "./pages/admin/AdminSchedulerSettings";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDeveloperProfiles from "./pages/admin/AdminDeveloperProfiles";
import AdminMLSSync from "./pages/admin/AdminMLSSync";
import AdminEmailTemplates from "./pages/admin/AdminEmailTemplates";
import AdminEmailWorkflows from "./pages/admin/AdminEmailWorkflows";
import NotFound from "./pages/NotFound";
import PresaleProjects from "./pages/PresaleProjects";
import PresaleProjectDetail from "./pages/PresaleProjectDetail";
import CityPresalePage from "./pages/CityPresalePage";
import CityProductPage from "./pages/CityProductPage";
import NeighbourhoodProductPage from "./pages/NeighbourhoodProductPage";
import NeighborhoodLandingPage from "./pages/NeighborhoodLandingPage";
import PriceBasedPage from "./pages/PriceBasedPage";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import { FloatingMapButton } from "@/components/mobile/FloatingMapButton";
import { UtmTracker } from "@/components/UtmTracker";
import { LoftyPageTracker } from "@/components/LoftyPageTracker";
import { BehaviorTracker } from "@/components/tracking/BehaviorTracker";
import { MetaPixel } from "@/components/tracking/MetaPixel";
import ROICalculator from "./pages/ROICalculator";
import MapSearch from "./pages/MapSearch";
import ResaleListings from "./pages/ResaleListings";
import ResaleListingDetail from "./pages/ResaleListingDetail";
import CityResalePage from "./pages/CityResalePage";
import Developers from "./pages/Developers";
import AdminDevelopers from "./pages/admin/AdminDevelopers";
import InvestmentSnapshotPage from "./pages/InvestmentSnapshotPage";
import ResalePropertyTypePage from "./pages/ResalePropertyTypePage";
import ResalePriceRangePage from "./pages/ResalePriceRangePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SwipeNavigationProvider>
            <ScrollToTop />
            <UtmTracker />
            <LoftyPageTracker />
            <BehaviorTracker />
            <MetaPixel />
            <FloatingMapButton />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/presale-projects" element={<PresaleProjects />} />
            <Route path="/presale-projects/:slug" element={<PresaleProjectDetail />} />
            <Route path="/map-search" element={<MapSearch />} />
            <Route path="/resale" element={<ResaleListings />} />
            {/* City-specific resale pages - MUST be before :listingKey route */}
            <Route path="/resale/vancouver" element={<CityResalePage />} />
            <Route path="/resale/surrey" element={<CityResalePage />} />
            <Route path="/resale/coquitlam" element={<CityResalePage />} />
            <Route path="/resale/burnaby" element={<CityResalePage />} />
            <Route path="/resale/delta" element={<CityResalePage />} />
            <Route path="/resale/langley" element={<CityResalePage />} />
            <Route path="/resale/abbotsford" element={<CityResalePage />} />
            <Route path="/resale/chilliwack" element={<CityResalePage />} />
            <Route path="/resale/richmond" element={<CityResalePage />} />
            <Route path="/resale/new-westminster" element={<CityResalePage />} />
            <Route path="/resale/port-coquitlam" element={<CityResalePage />} />
            <Route path="/resale/port-moody" element={<CityResalePage />} />
            <Route path="/resale/white-rock" element={<CityResalePage />} />
            {/* Property type and price range routes - MUST be before :listingKey */}
            <Route path="/resale/:citySlug/condos" element={<ResalePropertyTypePage />} />
            <Route path="/resale/:citySlug/townhouses" element={<ResalePropertyTypePage />} />
            <Route path="/resale/:citySlug/houses" element={<ResalePropertyTypePage />} />
            <Route path="/resale/:citySlug/duplexes" element={<ResalePropertyTypePage />} />
            <Route path="/resale/:citySlug/under-500k" element={<ResalePriceRangePage />} />
            <Route path="/resale/:citySlug/under-750k" element={<ResalePriceRangePage />} />
            <Route path="/resale/:citySlug/under-1m" element={<ResalePriceRangePage />} />
            <Route path="/resale/:citySlug/under-1.5m" element={<ResalePriceRangePage />} />
            <Route path="/resale/:citySlug/under-2m" element={<ResalePriceRangePage />} />
            <Route path="/resale/:citySlug/luxury" element={<ResalePriceRangePage />} />
            {/* Dynamic listing key route - MUST be after city/type/price routes */}
            <Route path="/resale/:listingKey" element={<ResaleListingDetail />} />
            <Route path="/presale-condos/:citySlug" element={<CityPresalePage />} />
            
            <Route path="/presale-condos-under-:pricePoint-:citySlug" element={<PriceBasedPage />} />
            <Route path="/presale-townhomes-under-:pricePoint-:citySlug" element={<PriceBasedPage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/assignments/:id" element={<ListingDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/for-developers" element={<ForDevelopers />} />
            <Route path="/buyers-guide" element={<BuyersGuide />} />
            <Route path="/presale-guide" element={<PresaleGuide />} />
            <Route path="/mortgage-calculator" element={<MortgageCalculatorPage />} />
            <Route path="/roi-calculator" element={<ROICalculator />} />
            <Route path="/calculator" element={<InvestmentSnapshotPage />} />
            <Route path="/developers" element={<Developers />} />
            
            {/* SEO Neighborhood Landing Pages */}
            <Route path="/south-surrey-presale" element={<NeighborhoodLandingPage />} />
            <Route path="/langley-willoughby-presale" element={<NeighborhoodLandingPage />} />
            <Route path="/surrey-city-centre-presale" element={<NeighborhoodLandingPage />} />
            <Route path="/coquitlam-burquitlam-presale" element={<NeighborhoodLandingPage />} />
            <Route path="/burnaby-metrotown-presale" element={<NeighborhoodLandingPage />} />
            <Route path="/vancouver-mount-pleasant-presale" element={<NeighborhoodLandingPage />} />
            <Route path="/richmond-brighouse-presale" element={<NeighborhoodLandingPage />} />
            <Route path="/north-vancouver-lonsdale-presale" element={<NeighborhoodLandingPage />} />
            <Route path="/new-westminster-downtown-presale" element={<NeighborhoodLandingPage />} />
            <Route path="/maple-ridge-town-centre-presale" element={<NeighborhoodLandingPage />} />
            
            <Route path="/login" element={<Login />} />
            
            {/* Developer Portal Routes */}
            <Route path="/developer" element={<DeveloperDashboard />} />
            <Route path="/developer/projects" element={<DeveloperProjects />} />
            <Route path="/developer/tour-requests" element={<DeveloperTourRequests />} />
            <Route path="/developer/settings" element={<DeveloperSettings />} />
            
            {/* Agent Dashboard Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
            <Route path="/dashboard/listings" element={<ProtectedRoute><DashboardListings /></ProtectedRoute>} />
            <Route path="/dashboard/listings/new" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
            <Route path="/dashboard/listings/:id/edit" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
            <Route path="/dashboard/leads" element={<ProtectedRoute><DashboardLeads /></ProtectedRoute>} />
            <Route path="/dashboard/billing" element={<ProtectedRoute><DashboardBilling /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><DashboardProfile /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminProtectedRoute><AdminOverview /></AdminProtectedRoute>} />
            <Route path="/admin/projects" element={<AdminProtectedRoute><AdminProjects /></AdminProtectedRoute>} />
            <Route path="/admin/projects/new" element={<AdminProtectedRoute><AdminProjectForm /></AdminProtectedRoute>} />
            <Route path="/admin/projects/import" element={<AdminProtectedRoute><AdminProjectImport /></AdminProtectedRoute>} />
            <Route path="/admin/projects/:id/edit" element={<AdminProtectedRoute><AdminProjectForm /></AdminProtectedRoute>} />
            <Route path="/admin/listings" element={<AdminProtectedRoute><AdminListings /></AdminProtectedRoute>} />
            <Route path="/admin/blogs" element={<AdminProtectedRoute><AdminBlogs /></AdminProtectedRoute>} />
            <Route path="/admin/blogs/new" element={<AdminProtectedRoute><AdminBlogForm /></AdminProtectedRoute>} />
            <Route path="/admin/blogs/import" element={<AdminProtectedRoute><AdminBlogImport /></AdminProtectedRoute>} />
            <Route path="/admin/blogs/:id/edit" element={<AdminProtectedRoute><AdminBlogForm /></AdminProtectedRoute>} />
            <Route path="/admin/agents" element={<AdminProtectedRoute><AdminAgents /></AdminProtectedRoute>} />
            <Route path="/admin/leads" element={<AdminProtectedRoute><AdminLeads /></AdminProtectedRoute>} />
            <Route path="/admin/leads/analytics" element={<AdminProtectedRoute><AdminLeadAnalytics /></AdminProtectedRoute>} />
            <Route path="/admin/payments" element={<AdminProtectedRoute><AdminPayments /></AdminProtectedRoute>} />
            <Route path="/admin/bookings" element={<AdminProtectedRoute><AdminBookings /></AdminProtectedRoute>} />
            <Route path="/admin/scheduler-settings" element={<AdminProtectedRoute><AdminSchedulerSettings /></AdminProtectedRoute>} />
            <Route path="/admin/developers" element={<AdminProtectedRoute><AdminDevelopers /></AdminProtectedRoute>} />
            <Route path="/admin/developer-accounts" element={<AdminProtectedRoute><AdminDeveloperProfiles /></AdminProtectedRoute>} />
            <Route path="/admin/mls-sync" element={<AdminProtectedRoute><AdminMLSSync /></AdminProtectedRoute>} />
            <Route path="/admin/email-templates" element={<AdminProtectedRoute><AdminEmailTemplates /></AdminProtectedRoute>} />
            <Route path="/admin/email-workflows" element={<AdminProtectedRoute><AdminEmailWorkflows /></AdminProtectedRoute>} />
            <Route path="/admin/settings" element={<AdminProtectedRoute><AdminSettings /></AdminProtectedRoute>} />
            
            {/* SEO City Product Pages - must be before 404 */}
            <Route path="/:cityProductSlug" element={<CityProductPage />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SwipeNavigationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
