import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/dashboard/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SwipeNavigationProvider } from "@/components/SwipeNavigationProvider";
import { ResaleToPropertiesRedirect } from "@/components/redirects/ResaleToPropertiesRedirect";
import Index from "./pages/Index";
import Contact from "./pages/Contact";

import ForAgents from "./pages/ForAgents";
import BuyersGuide from "./pages/BuyersGuide";
import PresaleGuide from "./pages/PresaleGuide";
import MortgageCalculatorPage from "./pages/MortgageCalculatorPage";
import Login from "./pages/Login";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import DashboardListings from "./pages/dashboard/DashboardListings";
import DashboardLeads from "./pages/dashboard/DashboardLeads";
import DashboardProfile from "./pages/dashboard/DashboardProfile";
import DashboardBilling from "./pages/dashboard/DashboardBilling";
import DashboardAssignments from "./pages/dashboard/DashboardAssignments";
import DashboardMessages from "./pages/dashboard/DashboardMessages";
import DashboardProjectDocuments from "./pages/dashboard/DashboardProjectDocuments";
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
import AdminAIAnalytics from "./pages/admin/AdminAIAnalytics";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminSchedulerSettings from "./pages/admin/AdminSchedulerSettings";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDeveloperProfiles from "./pages/admin/AdminDeveloperProfiles";
import AdminMLSSync from "./pages/admin/AdminMLSSync";
import AdminEmailTemplates from "./pages/admin/AdminEmailTemplates";
import AdminEmailWorkflows from "./pages/admin/AdminEmailWorkflows";
import AdminMarketData from "./pages/admin/AdminMarketData";
import AdminMarketDashboard from "./pages/admin/AdminMarketDashboard";
import NotFound from "./pages/NotFound";
import AdminClients from "./pages/admin/AdminClients";
import AdminClientSearches from "./pages/admin/AdminClientSearches";
import AdminClientForm from "./pages/admin/AdminClientForm";
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
import { ExitIntentPopup } from "@/components/conversion/ExitIntentPopup";
import { UtmTracker } from "@/components/UtmTracker";
import { LoftyPageTracker } from "@/components/LoftyPageTracker";
import { BehaviorTracker } from "@/components/tracking/BehaviorTracker";
import { MetaPixel } from "@/components/tracking/MetaPixel";
import ROICalculator from "./pages/ROICalculator";
import MapSearch from "./pages/MapSearch";
import ResaleListings from "./pages/ResaleListings";
import ResaleListingDetail from "./pages/ResaleListingDetail";
import CityResalePage from "./pages/CityResalePage";
import AssignmentDetail from "./pages/AssignmentDetail";
import Developers from "./pages/Developers";
import AdminDevelopers from "./pages/admin/AdminDevelopers";
import InvestmentSnapshotPage from "./pages/InvestmentSnapshotPage";
import ResalePropertyTypePage from "./pages/ResalePropertyTypePage";
import ResalePriceRangePage from "./pages/ResalePriceRangePage";
import ResaleBedroomPage from "./pages/ResaleBedroomPage";
import PopularSearchesPage from "./pages/PopularSearchesPage";
import NeighborhoodPropertyTypePage from "./pages/NeighborhoodPropertyTypePage";
import ContentHub from "./pages/ContentHub";
import BlogCategoryPage from "./pages/BlogCategoryPage";
import AdLandingPage from "./pages/AdLandingPage";
import AdminLandingPages from "./pages/admin/AdminLandingPages";
import VIPMembership from "./pages/VIPMembership";
import BuyerAuth from "./pages/BuyerAuth";
import BuyerLogin from "./pages/BuyerLogin";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import AdminBuyers from "./pages/admin/AdminBuyers";
import { BuyerAuthProvider } from "@/hooks/useBuyerAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

// Redirect component for legacy /presale/:slug routes
function PresaleRedirect() {
  const slug = window.location.pathname.replace('/presale/', '');
  return <Navigate to={`/presale-projects/${slug}`} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BuyerAuthProvider>
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
            {/* <ExitIntentPopup /> - Temporarily hidden */}
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/presale-projects" element={<PresaleProjects />} />
            <Route path="/presale-projects/:slug" element={<PresaleProjectDetail />} />
            {/* Legacy route redirect - redirect /presale/:slug to /presale-projects/:slug */}
            <Route path="/presale/:slug" element={<PresaleRedirect />} />
            <Route path="/map-search" element={<MapSearch />} />
            
            {/* Assignment Detail - Verified agents only */}
            <Route path="/assignments/:id" element={<AssignmentDetail />} />
            
            <Route path="/properties" element={<ResaleListings />} />
            {/* City-specific properties pages - MUST be before :listingKey route */}
            <Route path="/properties/vancouver" element={<CityResalePage />} />
            <Route path="/properties/surrey" element={<CityResalePage />} />
            <Route path="/properties/coquitlam" element={<CityResalePage />} />
            <Route path="/properties/burnaby" element={<CityResalePage />} />
            <Route path="/properties/delta" element={<CityResalePage />} />
            <Route path="/properties/langley" element={<CityResalePage />} />
            <Route path="/properties/abbotsford" element={<CityResalePage />} />
            <Route path="/properties/chilliwack" element={<CityResalePage />} />
            <Route path="/properties/richmond" element={<CityResalePage />} />
            <Route path="/properties/new-westminster" element={<CityResalePage />} />
            <Route path="/properties/port-coquitlam" element={<CityResalePage />} />
            <Route path="/properties/port-moody" element={<CityResalePage />} />
            <Route path="/properties/white-rock" element={<CityResalePage />} />
            {/* Property type and price range routes - MUST be before :listingKey */}
            <Route path="/properties/:citySlug/condos" element={<ResalePropertyTypePage />} />
            <Route path="/properties/:citySlug/townhouses" element={<ResalePropertyTypePage />} />
            <Route path="/properties/:citySlug/houses" element={<ResalePropertyTypePage />} />
            <Route path="/properties/:citySlug/duplexes" element={<ResalePropertyTypePage />} />
            <Route path="/properties/:citySlug/under-500k" element={<ResalePriceRangePage />} />
            <Route path="/properties/:citySlug/under-750k" element={<ResalePriceRangePage />} />
            <Route path="/properties/:citySlug/under-1m" element={<ResalePriceRangePage />} />
            <Route path="/properties/:citySlug/under-1.5m" element={<ResalePriceRangePage />} />
            <Route path="/properties/:citySlug/under-2m" element={<ResalePriceRangePage />} />
            <Route path="/properties/:citySlug/luxury" element={<ResalePriceRangePage />} />
            {/* Bedroom count routes */}
            <Route path="/properties/:citySlug/1-bedroom" element={<ResaleBedroomPage />} />
            <Route path="/properties/:citySlug/2-bedroom" element={<ResaleBedroomPage />} />
            <Route path="/properties/:citySlug/3-bedroom" element={<ResaleBedroomPage />} />
            <Route path="/properties/:citySlug/4-bedroom" element={<ResaleBedroomPage />} />
            {/* Neighborhood + Property Type routes */}
            <Route path="/properties/:citySlug/:neighborhoodSlug/condos" element={<NeighborhoodPropertyTypePage />} />
            <Route path="/properties/:citySlug/:neighborhoodSlug/townhomes" element={<NeighborhoodPropertyTypePage />} />
            <Route path="/properties/:citySlug/:neighborhoodSlug/homes" element={<NeighborhoodPropertyTypePage />} />
            {/* Popular Searches SEO Hub */}
            <Route path="/properties/popular-searches" element={<PopularSearchesPage />} />
            {/* Dynamic listing key route - MUST be after city/type/price/bedroom/neighborhood routes */}
            <Route path="/properties/:listingKey" element={<ResaleListingDetail />} />
            
            {/* Legacy /resale/* redirects for SEO preservation */}
            <Route path="/resale" element={<Navigate to="/properties" replace />} />
            <Route path="/resale/popular-searches" element={<Navigate to="/properties/popular-searches" replace />} />
            <Route path="/resale/:segment" element={<ResaleToPropertiesRedirect />} />
            <Route path="/resale/:citySlug/:segment" element={<ResaleToPropertiesRedirect />} />
            <Route path="/resale/:citySlug/:neighborhoodSlug/:type" element={<ResaleToPropertiesRedirect />} />
            <Route path="/presale-condos/:citySlug" element={<CityPresalePage />} />
            
            <Route path="/presale-condos-under-:pricePoint-:citySlug" element={<PriceBasedPage />} />
            <Route path="/presale-townhomes-under-:pricePoint-:citySlug" element={<PriceBasedPage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            
            {/* Content Hub & Category Pages */}
            <Route path="/guides" element={<ContentHub />} />
            <Route path="/guides/:categorySlug" element={<BlogCategoryPage />} />
            <Route path="/contact" element={<Contact />} />
            
            <Route path="/buyers-guide" element={<BuyersGuide />} />
            <Route path="/presale-guide" element={<PresaleGuide />} />
            <Route path="/mortgage-calculator" element={<MortgageCalculatorPage />} />
            <Route path="/roi-calculator" element={<ROICalculator />} />
            <Route path="/calculator" element={<InvestmentSnapshotPage />} />
            <Route path="/developers" element={<Developers />} />
            
            {/* Ad Landing Page - noindex for paid campaigns */}
            <Route path="/exclusive-offer" element={<AdLandingPage />} />
            <Route path="/vip" element={<VIPMembership />} />
            
            {/* Buyer Portal Routes */}
            <Route path="/buyer/signup" element={<BuyerAuth />} />
            <Route path="/buyer/login" element={<BuyerLogin />} />
            <Route path="/buyer" element={<BuyerDashboard />} />
            
            {/* SEO Neighborhood Landing Pages */}
            <Route path="/south-surrey-presale" element={<NeighborhoodLandingPage />} />
            <Route path="/langley-willoughby-presale" element={<NeighborhoodLandingPage />} />
            <Route path="/surrey-city-centre-presale" element={<NeighborhoodLandingPage />} />
            <Route path="/coquitlam-burquitlam-presale" element={<NeighborhoodLandingPage />} />
            <Route path="/burnaby-metrotown-presale" element={<NeighborhoodLandingPage />} />
            <Route path="/burnaby-brentwood-presale" element={<NeighborhoodLandingPage />} />
            <Route path="/surrey-cloverdale-presale" element={<NeighborhoodLandingPage />} />
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
            <Route path="/dashboard/projects" element={<ProtectedRoute><DashboardProjectDocuments /></ProtectedRoute>} />
            <Route path="/dashboard/assignments" element={<ProtectedRoute><DashboardAssignments /></ProtectedRoute>} />
            <Route path="/dashboard/listings" element={<ProtectedRoute><DashboardListings /></ProtectedRoute>} />
            <Route path="/dashboard/listings/new" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
            <Route path="/dashboard/listings/:id/edit" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
            <Route path="/dashboard/messages" element={<ProtectedRoute><DashboardMessages /></ProtectedRoute>} />
            <Route path="/dashboard/leads" element={<ProtectedRoute><DashboardLeads /></ProtectedRoute>} />
            <Route path="/dashboard/billing" element={<ProtectedRoute><DashboardBilling /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><DashboardProfile /></ProtectedRoute>} />
            
            {/* For Agents Marketing Page */}
            <Route path="/for-agents" element={<ForAgents />} />
            
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
            <Route path="/admin/landing-pages" element={<AdminProtectedRoute><AdminLandingPages /></AdminProtectedRoute>} />
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
            <Route path="/admin/market-data" element={<AdminProtectedRoute><AdminMarketData /></AdminProtectedRoute>} />
            <Route path="/admin/market-dashboard" element={<AdminProtectedRoute><AdminMarketDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/ai-analytics" element={<AdminProtectedRoute><AdminAIAnalytics /></AdminProtectedRoute>} />
            <Route path="/admin/settings" element={<AdminProtectedRoute><AdminSettings /></AdminProtectedRoute>} />
            <Route path="/admin/buyers" element={<AdminProtectedRoute><AdminBuyers /></AdminProtectedRoute>} />
            <Route path="/admin/clients" element={<AdminProtectedRoute><AdminClients /></AdminProtectedRoute>} />
            <Route path="/admin/clients/new" element={<AdminProtectedRoute><AdminClientForm /></AdminProtectedRoute>} />
            <Route path="/admin/clients/:clientId/edit" element={<AdminProtectedRoute><AdminClientForm /></AdminProtectedRoute>} />
            <Route path="/admin/clients/:clientId/searches" element={<AdminProtectedRoute><AdminClientSearches /></AdminProtectedRoute>} />
            
            {/* Agent URL Redirects - common typos/variants */}
            <Route path="/agent" element={<Navigate to="/for-agents" replace />} />
            <Route path="/agents" element={<Navigate to="/for-agents" replace />} />
            <Route path="/agent-portal" element={<Navigate to="/dashboard" replace />} />
            <Route path="/agent-dashboard" element={<Navigate to="/dashboard" replace />} />
            
            {/* SEO City Product Pages - must be before 404 */}
            <Route path="/:cityProductSlug" element={<CityProductPage />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SwipeNavigationProvider>
        </BrowserRouter>
      </TooltipProvider>
      </BuyerAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
