import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SwipeNavigationProvider } from "@/components/SwipeNavigationProvider";
import { ResaleToPropertiesRedirect } from "@/components/redirects/ResaleToPropertiesRedirect";
import { PresaleProjectSEORedirect } from "@/components/redirects/PresaleProjectSEORedirect";
import { CityPresaleSEORedirect } from "@/components/redirects/CityPresaleSEORedirect";
import { BlogsRedirect } from "@/components/redirects/BlogsRedirect";
import { GlobalSEO } from "@/components/seo/GlobalSEO";
import { FaviconLoader } from "@/components/FaviconLoader";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import About from "./pages/About";

import BuyersGuide from "./pages/BuyersGuide";
import PresaleGuide from "./pages/PresaleGuide";
import MortgageCalculatorPage from "./pages/MortgageCalculatorPage";
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
import AdminTeamMembers from "./pages/admin/AdminTeamMembers";
import AdminGoogleReviews from "./pages/admin/AdminGoogleReviews";
import AdminThemeManager from "./pages/admin/AdminThemeManager";
import AdminTasks from "./pages/admin/AdminTasks";
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
import PresaleCityHubPage from "./pages/PresaleCityHubPage";
import PresaleCityTypePricePage from "./pages/PresaleCityTypePricePage";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";

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

import { BuyerAuthProvider } from "@/hooks/useBuyerAuth";

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
    <ThemeProvider>
    <AuthProvider>
      <BuyerAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SwipeNavigationProvider>
            <ScrollToTop />
            <GlobalSEO />
            <FaviconLoader />
            <UtmTracker />
            <LoftyPageTracker />
            <BehaviorTracker />
            <MetaPixel />
            
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/presale-projects" element={<PresaleProjects />} />
            <Route path="/presale-projects/:citySlug/:typePriceSlug" element={<PresaleCityTypePricePage />} />
            <Route path="/presale-projects/:citySlug" element={<PresaleCityHubPage />} />
            <Route path="/presale/:slug" element={<PresaleProjectSEORedirect />} />
            <Route path="/map-search" element={<MapSearch />} />
            
            <Route path="/properties" element={<ResaleListings />} />
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
            <Route path="/properties/north-vancouver" element={<CityResalePage />} />
            <Route path="/properties/maple-ridge" element={<CityResalePage />} />
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
            <Route path="/properties/:citySlug/1-bedroom" element={<ResaleBedroomPage />} />
            <Route path="/properties/:citySlug/2-bedroom" element={<ResaleBedroomPage />} />
            <Route path="/properties/:citySlug/3-bedroom" element={<ResaleBedroomPage />} />
            <Route path="/properties/:citySlug/4-bedroom" element={<ResaleBedroomPage />} />
            <Route path="/properties/:citySlug/:neighborhoodSlug/condos" element={<NeighborhoodPropertyTypePage />} />
            <Route path="/properties/:citySlug/:neighborhoodSlug/townhomes" element={<NeighborhoodPropertyTypePage />} />
            <Route path="/properties/:citySlug/:neighborhoodSlug/homes" element={<NeighborhoodPropertyTypePage />} />
            <Route path="/properties/popular-searches" element={<PopularSearchesPage />} />
            <Route path="/properties/:slug" element={<ResaleListingDetail />} />
            
            {/* Legacy /resale/* redirects */}
            <Route path="/resale" element={<Navigate to="/properties" replace />} />
            <Route path="/resale/popular-searches" element={<Navigate to="/properties/popular-searches" replace />} />
            <Route path="/resale/:segment" element={<ResaleToPropertiesRedirect />} />
            <Route path="/resale/:citySlug/:segment" element={<ResaleToPropertiesRedirect />} />
            <Route path="/resale/:citySlug/:neighborhoodSlug/:type" element={<ResaleToPropertiesRedirect />} />
            <Route path="/presale-condos/:citySlug" element={<CityPresaleSEORedirect />} />
            
            <Route path="/presale-condos-under-:pricePoint-:citySlug" element={<PriceBasedPage />} />
            <Route path="/presale-townhomes-under-:pricePoint-:citySlug" element={<PriceBasedPage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            
            <Route path="/guides" element={<ContentHub />} />
            <Route path="/guides/:categorySlug" element={<BlogCategoryPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            
            <Route path="/buyers-guide" element={<BuyersGuide />} />
            <Route path="/presale-guide" element={<PresaleGuide />} />
            <Route path="/mortgage-calculator" element={<MortgageCalculatorPage />} />
            <Route path="/roi-calculator" element={<ROICalculator />} />
            <Route path="/calculator" element={<InvestmentSnapshotPage />} />
            <Route path="/developers" element={<Developers />} />
            
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
            
            {/* Legacy assignment/agent redirects */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/for-agents" element={<Navigate to="/" replace />} />
            <Route path="/assignments/:id" element={<Navigate to="/map-search" replace />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/dashboard/*" element={<Navigate to="/" replace />} />
            <Route path="/agent" element={<Navigate to="/" replace />} />
            <Route path="/agents" element={<Navigate to="/" replace />} />
            <Route path="/agent-portal" element={<Navigate to="/" replace />} />
            <Route path="/agent-dashboard" element={<Navigate to="/" replace />} />
            
            {/* Developer Portal Routes */}
            <Route path="/developer" element={<DeveloperDashboard />} />
            <Route path="/developer/projects" element={<DeveloperProjects />} />
            <Route path="/developer/tour-requests" element={<DeveloperTourRequests />} />
            <Route path="/developer/settings" element={<DeveloperSettings />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminProtectedRoute><AdminOverview /></AdminProtectedRoute>} />
            <Route path="/admin/projects" element={<AdminProtectedRoute><AdminProjects /></AdminProtectedRoute>} />
            <Route path="/admin/projects/new" element={<AdminProtectedRoute><AdminProjectForm /></AdminProtectedRoute>} />
            <Route path="/admin/projects/import" element={<AdminProtectedRoute><AdminProjectImport /></AdminProtectedRoute>} />
            <Route path="/admin/projects/:id/edit" element={<AdminProtectedRoute><AdminProjectForm /></AdminProtectedRoute>} />
            <Route path="/admin/blogs" element={<AdminProtectedRoute><AdminBlogs /></AdminProtectedRoute>} />
            <Route path="/admin/blogs/new" element={<AdminProtectedRoute><AdminBlogForm /></AdminProtectedRoute>} />
            <Route path="/admin/blogs/import" element={<AdminProtectedRoute><AdminBlogImport /></AdminProtectedRoute>} />
            <Route path="/admin/blogs/:id/edit" element={<AdminProtectedRoute><AdminBlogForm /></AdminProtectedRoute>} />
            <Route path="/admin/landing-pages" element={<AdminProtectedRoute><AdminLandingPages /></AdminProtectedRoute>} />
            <Route path="/admin/leads" element={<AdminProtectedRoute><AdminLeads /></AdminProtectedRoute>} />
            <Route path="/admin/leads/analytics" element={<AdminProtectedRoute><AdminLeadAnalytics /></AdminProtectedRoute>} />
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
            
            <Route path="/admin/clients" element={<AdminProtectedRoute><AdminClients /></AdminProtectedRoute>} />
            <Route path="/admin/clients/new" element={<AdminProtectedRoute><AdminClientForm /></AdminProtectedRoute>} />
            <Route path="/admin/clients/:clientId/edit" element={<AdminProtectedRoute><AdminClientForm /></AdminProtectedRoute>} />
            <Route path="/admin/clients/:clientId/searches" element={<AdminProtectedRoute><AdminClientSearches /></AdminProtectedRoute>} />
            <Route path="/admin/team-members" element={<AdminProtectedRoute><AdminTeamMembers /></AdminProtectedRoute>} />
            <Route path="/admin/google-reviews" element={<AdminProtectedRoute><AdminGoogleReviews /></AdminProtectedRoute>} />
            <Route path="/admin/theme" element={<AdminProtectedRoute><AdminThemeManager /></AdminProtectedRoute>} />
            <Route path="/admin/tasks" element={<AdminProtectedRoute><AdminTasks /></AdminProtectedRoute>} />
            
            {/* Legacy redirects */}
            <Route path="/admin/listings" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/agents" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/payments" element={<Navigate to="/admin" replace />} />
            
            <Route path="/blogs/:slug" element={<BlogsRedirect />} />
            <Route path="/blogs" element={<Navigate to="/blog" replace />} />
            
            <Route path="/guide" element={<Navigate to="/buyers-guide" replace />} />
            <Route path="/privacy" element={<Navigate to="/about" replace />} />
            <Route path="/market-report/:city" element={<NotFound />} />
            <Route path="/market-report" element={<NotFound />} />
            <Route path="/deposit/:slug" element={<NotFound />} />
            <Route path="/langley/presales" element={<Navigate to="/presale-projects/langley" replace />} />
            <Route path="/investment-presale-properties" element={<Navigate to="/presale-projects" replace />} />
            
            <Route path="/presale-condos-vancouver" element={<Navigate to="/vancouver-presale-condos" replace />} />
            <Route path="/presale-condos-surrey" element={<Navigate to="/surrey-presale-condos" replace />} />
            <Route path="/presale-condos-burnaby" element={<Navigate to="/burnaby-presale-condos" replace />} />
            <Route path="/presale-condos-coquitlam" element={<Navigate to="/coquitlam-presale-condos" replace />} />
            <Route path="/presale-condos-langley" element={<Navigate to="/langley-presale-condos" replace />} />
            <Route path="/presale-condos-richmond" element={<Navigate to="/richmond-presale-condos" replace />} />
            <Route path="/presale-condos-delta" element={<Navigate to="/delta-presale-condos" replace />} />
            
            <Route path="/surrey-presale-properties" element={<Navigate to="/surrey-presale-condos" replace />} />
            <Route path="/burnaby-presale-properties" element={<Navigate to="/burnaby-presale-condos" replace />} />
            <Route path="/abbotsford-presale-properties" element={<Navigate to="/abbotsford-presale-condos" replace />} />
            
            <Route path="/:cityProductSlug" element={<CityProductPage />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SwipeNavigationProvider>
        </BrowserRouter>
      </TooltipProvider>
      </BuyerAuthProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
