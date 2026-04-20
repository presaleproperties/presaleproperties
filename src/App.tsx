import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ProtectedRoute } from "@/components/dashboard/ProtectedRoute";
import { DashboardErrorBoundary } from "@/components/dashboard/DashboardErrorBoundary";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SwipeNavigationProvider } from "@/components/SwipeNavigationProvider";
import { GlobalPullToRefresh } from "@/components/GlobalPullToRefresh";
import { ResaleToPropertiesRedirect } from "@/components/redirects/ResaleToPropertiesRedirect";
import { PresaleProjectSEORedirect } from "@/components/redirects/PresaleProjectSEORedirect";
import { CityPresaleSEORedirect } from "@/components/redirects/CityPresaleSEORedirect";
import { BlogsRedirect } from "@/components/redirects/BlogsRedirect";
import { PropertiesCleanupRedirect } from "@/components/redirects/PropertiesSpaceRedirect";
import { GlobalSEO } from "@/components/seo/GlobalSEO";
import { FaviconLoader } from "@/components/FaviconLoader";
import { AgentManifestSwap } from "@/components/dashboard/AgentManifestSwap";
import { UtmTracker } from "@/components/UtmTracker";
import { LoftyPageTracker } from "@/components/LoftyPageTracker";
import { BehaviorTracker } from "@/components/tracking/BehaviorTracker";
import { MetaPixel } from "@/components/tracking/MetaPixel";
import { GA4Tracker } from "@/components/tracking/GA4Tracker";
import { TrackingScripts } from "@/components/tracking/TrackingScripts";
import { BuyerAuthProvider } from "@/hooks/useBuyerAuth";
import { ExitIntentPopup } from "@/components/conversion/ExitIntentPopup";
import { PropertiesSlugDispatcher } from "@/components/routing/PropertiesSlugDispatcher";
import { Suspense, lazy } from "react";

// Only the homepage is eagerly loaded for fastest initial paint
import Index from "./pages/Index";

// --- Lazy-loaded pages (code-split) ---
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const ForAgents = lazy(() => import("./pages/ForAgents"));
const BuyersGuide = lazy(() => import("./pages/BuyersGuide"));
const PresaleGuide = lazy(() => import("./pages/PresaleGuide"));
const DeficiencyWalkthroughGuide = lazy(() => import("./pages/DeficiencyWalkthroughGuide"));
const FAQ = lazy(() => import("./pages/FAQ"));
const MortgageCalculatorPage = lazy(() => import("./pages/MortgageCalculatorPage"));
const Login = lazy(() => import("./pages/Login"));
const DashboardOverview = lazy(() => import("./pages/dashboard/DashboardOverview"));
const DashboardListings = lazy(() => import("./pages/dashboard/DashboardListings"));
const DashboardLeads = lazy(() => import("./pages/dashboard/DashboardLeads"));
const DashboardEmails = lazy(() => import("./pages/dashboard/DashboardEmails"));
const DashboardProfile = lazy(() => import("./pages/dashboard/DashboardProfile"));
const DashboardProjectDocuments = lazy(() => import("./pages/dashboard/DashboardProjectDocuments"));
const ListingForm = lazy(() => import("./pages/dashboard/ListingForm"));
const DashboardMarketingHub = lazy(() => import("./pages/dashboard/DashboardMarketingHub"));
const DashboardEmailBuilder = lazy(() => import("./pages/dashboard/DashboardEmailBuilder"));
const DeveloperDashboard = lazy(() => import("./pages/developer/DeveloperDashboardNew"));
const DeveloperProjects = lazy(() => import("./pages/developer/DeveloperProjects"));
const DeveloperTourRequests = lazy(() => import("./pages/developer/DeveloperTourRequests"));
const DeveloperSettings = lazy(() => import("./pages/developer/DeveloperSettings"));
const DeveloperPortalLanding = lazy(() => import("./pages/developer/DeveloperPortalLanding"));
const DeveloperSignup = lazy(() => import("./pages/developer/DeveloperSignup"));
const DeveloperLogin = lazy(() => import("./pages/developer/DeveloperLogin"));
const DeveloperProjectForm = lazy(() => import("./pages/developer/DeveloperProjectForm"));
const DeveloperUnitsPage = lazy(() => import("./pages/developer/DeveloperUnitsPage"));
const DeveloperInventoryPage = lazy(() => import("./pages/developer/DeveloperInventoryPage"));
const DeveloperAddInventoryWizard = lazy(() => import("./pages/developer/DeveloperAddInventoryWizard"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const AdminProjectForm = lazy(() => import("./pages/admin/AdminProjectForm"));
const AdminProjectImport = lazy(() => import("./pages/admin/AdminProjectImport"));
const AdminBlogs = lazy(() => import("./pages/admin/AdminBlogs"));
const AdminBlogForm = lazy(() => import("./pages/admin/AdminBlogForm"));
const AdminBlogImport = lazy(() => import("./pages/admin/AdminBlogImport"));
const AdminAgents = lazy(() => import("./pages/admin/AdminAgents"));
const AdminAssignments = lazy(() => import("./pages/admin/AdminAssignments"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminLeadAnalytics = lazy(() => import("./pages/admin/AdminLeadAnalytics"));
const AdminLeadOnboard = lazy(() => import("./pages/admin/AdminLeadOnboard"));

const AdminAIAnalytics = lazy(() => import("./pages/admin/AdminAIAnalytics"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminSchedulerSettings = lazy(() => import("./pages/admin/AdminSchedulerSettings"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDeveloperProfiles = lazy(() => import("./pages/admin/AdminDeveloperProfiles"));
const AdminMLSSync = lazy(() => import("./pages/admin/AdminMLSSync"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/AdminEmailTemplates"));
const AdminEmailWorkflows = lazy(() => import("./pages/admin/AdminEmailWorkflows"));
const AdminMarketData = lazy(() => import("./pages/admin/AdminMarketData"));
const AdminMarketDashboard = lazy(() => import("./pages/admin/AdminMarketDashboard"));
const AdminTeamMembers = lazy(() => import("./pages/admin/AdminTeamMembers"));
const AdminGoogleReviews = lazy(() => import("./pages/admin/AdminGoogleReviews"));
const AdminThemeManager = lazy(() => import("./pages/admin/AdminThemeManager"));
const AdminTasks = lazy(() => import("./pages/admin/AdminTasks"));
const AdminSystem = lazy(() => import("./pages/admin/AdminSystem"));
const AdminTechStack = lazy(() => import("./pages/admin/AdminTechStack"));
const AdminLiveActivity = lazy(() => import("./pages/admin/AdminLiveActivity"));
const AdminClients = lazy(() => import("./pages/admin/AdminClients"));
const AdminClientSearches = lazy(() => import("./pages/admin/AdminClientSearches"));
const AdminClientForm = lazy(() => import("./pages/admin/AdminClientForm"));
const AdminAiEmailBuilder = lazy(() => import("./pages/admin/AdminAiEmailBuilder"));
const AdminMarketingHub = lazy(() => import("./pages/admin/AdminMarketingHub"));
const AdminEmailCenter = lazy(() => import("./pages/admin/AdminEmailCenter"));
const AdminEmailFlows = lazy(() => import("./pages/admin/AdminEmailFlows"));
const AdminSystemEmails = lazy(() => import("./pages/admin/AdminSystemEmails"));

const AdminDevelopers = lazy(() => import("./pages/admin/AdminDevelopers"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Assignments = lazy(() => import("./pages/Assignments"));
const PresaleProjects = lazy(() => import("./pages/PresaleProjects"));
const PresaleProjectDetail = lazy(() => import("./pages/PresaleProjectDetail"));
const CityPresalePage = lazy(() => import("./pages/CityPresalePage"));
const CityProductPage = lazy(() => import("./pages/CityProductPage"));
const NeighbourhoodProductPage = lazy(() => import("./pages/NeighbourhoodProductPage"));
const NeighborhoodLandingPage = lazy(() => import("./pages/NeighborhoodLandingPage"));
const PriceBasedPage = lazy(() => import("./pages/PriceBasedPage"));
const PresaleCityHubPage = lazy(() => import("./pages/PresaleCityHubPage"));
const PresaleCityTypePricePage = lazy(() => import("./pages/PresaleCityTypePricePage"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const ROICalculator = lazy(() => import("./pages/ROICalculator"));
const MapSearch = lazy(() => import("./pages/MapSearch"));
const ResaleListings = lazy(() => import("./pages/ResaleListings"));
const ResaleListingDetail = lazy(() => import("./pages/ResaleListingDetail"));
const CityResalePage = lazy(() => import("./pages/CityResalePage"));
const AssignmentDetail = lazy(() => import("./pages/AssignmentDetail"));
const SellYourAssignment = lazy(() => import("./pages/SellYourAssignment"));
const BuyingAnAssignment = lazy(() => import("./pages/BuyingAnAssignment"));
const Developers = lazy(() => import("./pages/Developers"));
const DeveloperProfile = lazy(() => import("./pages/DeveloperProfile"));
const InvestmentSnapshotPage = lazy(() => import("./pages/InvestmentSnapshotPage"));
const ResalePropertyTypePage = lazy(() => import("./pages/ResalePropertyTypePage"));
const ResalePriceRangePage = lazy(() => import("./pages/ResalePriceRangePage"));
const ResaleBedroomPage = lazy(() => import("./pages/ResaleBedroomPage"));
const ResaleTypePricePage = lazy(() => import("./pages/ResaleTypePricePage"));
const PopularSearchesPage = lazy(() => import("./pages/PopularSearchesPage"));
const NeighborhoodPropertyTypePage = lazy(() => import("./pages/NeighborhoodPropertyTypePage"));
const ContentHub = lazy(() => import("./pages/ContentHub"));
const BlogCategoryPage = lazy(() => import("./pages/BlogCategoryPage"));

const PresaleCompletionYearPage = lazy(() => import("./pages/PresaleCompletionYearPage"));
const PresaleProcess = lazy(() => import("./pages/PresaleProcess"));
const DeckPublicPage = lazy(() => import("./pages/DeckPublicPage"));
const DashboardDecks = lazy(() => import("./pages/dashboard/DashboardDecks"));
const DashboardDeckBuilder = lazy(() => import("./pages/dashboard/DashboardDeckBuilder"));

const BuyerAuth = lazy(() => import("./pages/BuyerAuth"));
const BuyerLogin = lazy(() => import("./pages/BuyerLogin"));
const BuyerDashboard = lazy(() => import("./pages/buyer/BuyerDashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

// Minimal loading fallback — splash screen covers initial load
const PageFallback = () => null;

// Keyed wrapper so the email builder fully remounts when navigating from a pitch deck
// (the ?t= timestamp param changes, causing a new key and fresh state)
function AdminAiEmailBuilderKeyed() {
  const [searchParams] = useSearchParams();
  const t = searchParams.get("t") ?? "0";
  return <AdminAiEmailBuilder key={t} />;
}

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
            <GlobalPullToRefresh>
            <ScrollToTop />
            <GlobalSEO />
            <FaviconLoader />
            <AgentManifestSwap />
            <UtmTracker />
            <LoftyPageTracker />
            <BehaviorTracker />
            <MetaPixel />
            <GA4Tracker />
            
            {/* <ExitIntentPopup /> - Temporarily hidden */}
            <ExitIntentPopup />
          <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/presale-projects" element={<PresaleProjects />} />
            {/* NEW SEO URL Structure: /presale-projects/{city}/{type}/{price} */}
            <Route path="/presale-projects/:citySlug/:typePriceSlug" element={<PresaleCityTypePricePage />} />
            <Route path="/presale-projects/:citySlug" element={<PresaleCityHubPage />} />
            {/* SEO Redirect: /presale-projects/:slug -> /{neighborhood}-presale-{type}-{slug} */}
            {/* Legacy route redirect - redirect /presale/:slug to SEO URL */}
            <Route path="/presale/:slug" element={<PresaleProjectSEORedirect />} />
            
            {/* Presale Completion Year Pages */}
            <Route path="/presale-projects-completing-2025" element={<PresaleCompletionYearPage />} />
            <Route path="/presale-projects-completing-2026" element={<PresaleCompletionYearPage />} />
            <Route path="/presale-projects-completing-2027" element={<PresaleCompletionYearPage />} />
            <Route path="/presale-projects-completing-2028" element={<PresaleCompletionYearPage />} />
            
            <Route path="/map-search" element={<MapSearch />} />
            
            {/* Assignment browse + detail */}
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/assignments/sell-your-assignment" element={<SellYourAssignment />} />
            <Route path="/assignments/buying-an-assignment" element={<BuyingAnAssignment />} />
            <Route path="/assignments/:id" element={<AssignmentDetail />} />
            
            <Route path="/properties" element={<ResaleListings />} />
            {/* Dynamic city properties pages - validated inside CityResalePage against CITY_CONFIG */}
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
            {/* Normalize townhomes → townhouses, homes → city page */}
            <Route path="/properties/:citySlug/townhomes" element={<ResalePropertyTypePage />} />
            <Route path="/properties/:citySlug/homes" element={<ResalePropertyTypePage />} />
            {/* Popular Searches SEO Hub */}
            <Route path="/properties/popular-searches" element={<PopularSearchesPage />} />
            {/* Combined type + price pages */}
            <Route path="/properties/condos-under-500k" element={<ResaleTypePricePage />} />
            <Route path="/properties/condos-under-500k-surrey" element={<ResaleTypePricePage />} />
            <Route path="/properties/condos-under-500k-langley" element={<ResaleTypePricePage />} />
            <Route path="/properties/condos-under-500k-coquitlam" element={<ResaleTypePricePage />} />
            <Route path="/properties/condos-under-500k-burnaby" element={<ResaleTypePricePage />} />
            <Route path="/properties/townhomes-under-800k" element={<ResaleTypePricePage />} />
            <Route path="/properties/townhomes-under-800k-surrey" element={<ResaleTypePricePage />} />
            <Route path="/properties/townhomes-under-800k-langley" element={<ResaleTypePricePage />} />
            <Route path="/properties/townhomes-under-800k-coquitlam" element={<ResaleTypePricePage />} />
            <Route path="/properties/townhomes-under-800k-burnaby" element={<ResaleTypePricePage />} />
            {/* Dynamic: city page OR listing detail, resolved by PropertiesSlugDispatcher */}
            <Route path="/properties/:slug" element={<PropertiesSlugDispatcher />} />
            
            {/* Move-In Ready redirect */}
            <Route path="/move-in-ready" element={<Navigate to="/properties" replace />} />
            
            {/* Legacy /resale/* redirects for SEO preservation */}
            <Route path="/resale" element={<Navigate to="/properties" replace />} />
            <Route path="/resale/popular-searches" element={<Navigate to="/properties/popular-searches" replace />} />
            <Route path="/resale/:segment" element={<ResaleToPropertiesRedirect />} />
            <Route path="/resale/:citySlug/:segment" element={<ResaleToPropertiesRedirect />} />
            <Route path="/resale/:citySlug/:neighborhoodSlug/:type" element={<ResaleToPropertiesRedirect />} />
            {/* SEO Redirect: /presale-condos/:citySlug -> /{citySlug}-presale-condos */}
            <Route path="/presale-condos/:citySlug" element={<CityPresaleSEORedirect />} />
            
            <Route path="/presale-condos-under-:pricePoint-:citySlug" element={<PriceBasedPage />} />
            <Route path="/presale-townhomes-under-:pricePoint-:citySlug" element={<PriceBasedPage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            
            {/* Content Hub & Category Pages */}
            <Route path="/guides" element={<ContentHub />} />
            <Route path="/guides/:categorySlug" element={<BlogCategoryPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            
            <Route path="/buyers-guide" element={<BuyersGuide />} />
            <Route path="/presale-guide" element={<PresaleGuide />} />
            <Route path="/presale-process" element={<PresaleProcess />} />
            <Route path="/deficiency-walkthrough-guide" element={<DeficiencyWalkthroughGuide />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/mortgage-calculator" element={<MortgageCalculatorPage />} />
            <Route path="/roi-calculator" element={<ROICalculator />} />
            <Route path="/calculator" element={<InvestmentSnapshotPage />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/developers/:slug" element={<DeveloperProfile />} />
            
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
            <Route path="/developer-portal" element={<DeveloperPortalLanding />} />
            <Route path="/developer/signup" element={<DeveloperSignup />} />
            <Route path="/developer/login" element={<DeveloperLogin />} />
            <Route path="/developer" element={<DeveloperDashboard />} />
            <Route path="/developer/projects" element={<DeveloperProjects />} />
            <Route path="/developer/projects/new" element={<DeveloperProjectForm />} />
            <Route path="/developer/projects/:id/edit" element={<DeveloperProjectForm />} />
            <Route path="/developer/projects/:projectId/units" element={<DeveloperUnitsPage />} />
            <Route path="/developer/projects/:projectId/inventory" element={<DeveloperInventoryPage />} />
            <Route path="/developer/add-inventory" element={<DeveloperAddInventoryWizard />} />
            <Route path="/developer/tour-requests" element={<DeveloperTourRequests />} />
            <Route path="/developer/settings" element={<DeveloperSettings />} />
            
            {/* Agent Dashboard Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardErrorBoundary><DashboardOverview /></DashboardErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/projects" element={<ProtectedRoute><DashboardErrorBoundary><DashboardProjectDocuments /></DashboardErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/assignments" element={<Navigate to="/map-search?mode=assignments" replace />} />
            <Route path="/dashboard/listings" element={<ProtectedRoute><DashboardErrorBoundary><DashboardListings /></DashboardErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/listings/new" element={<ProtectedRoute><DashboardErrorBoundary><ListingForm /></DashboardErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/listings/:id/edit" element={<ProtectedRoute><DashboardErrorBoundary><ListingForm /></DashboardErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/decks" element={<Navigate to="/dashboard/marketing-hub?tab=decks" replace />} />
            <Route path="/dashboard/decks/new" element={<ProtectedRoute><DashboardErrorBoundary><DashboardDeckBuilder /></DashboardErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/decks/:id/edit" element={<ProtectedRoute><DashboardErrorBoundary><DashboardDeckBuilder /></DashboardErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/leads" element={<ProtectedRoute><DashboardErrorBoundary><DashboardLeads /></DashboardErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/emails" element={<ProtectedRoute><DashboardErrorBoundary><DashboardEmails /></DashboardErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/marketing-hub" element={<ProtectedRoute><DashboardErrorBoundary><DashboardMarketingHub /></DashboardErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/email-builder" element={<ProtectedRoute><DashboardErrorBoundary><DashboardEmailBuilder /></DashboardErrorBoundary></ProtectedRoute>} />
            {/* Legacy redirects for removed pages */}
            <Route path="/dashboard/messages" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/lead-onboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/billing" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><DashboardErrorBoundary><DashboardProfile /></DashboardErrorBoundary></ProtectedRoute>} />
            
            {/* For Agents - redirect to login */}
            <Route path="/for-agents" element={<Navigate to="/login" replace />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminProtectedRoute><AdminOverview /></AdminProtectedRoute>} />
            <Route path="/admin/projects" element={<AdminProtectedRoute><AdminProjects /></AdminProtectedRoute>} />
            <Route path="/admin/projects/new" element={<AdminProtectedRoute><AdminProjectForm /></AdminProtectedRoute>} />
            <Route path="/admin/projects/import" element={<AdminProtectedRoute><AdminProjectImport /></AdminProtectedRoute>} />
            <Route path="/admin/projects/:id/edit" element={<AdminProtectedRoute><AdminProjectForm /></AdminProtectedRoute>} />
            <Route path="/admin/assignments" element={<AdminProtectedRoute><AdminAssignments /></AdminProtectedRoute>} />
            <Route path="/admin/blogs" element={<AdminProtectedRoute><AdminBlogs /></AdminProtectedRoute>} />
            <Route path="/admin/blogs/new" element={<AdminProtectedRoute><AdminBlogForm /></AdminProtectedRoute>} />
            <Route path="/admin/blogs/import" element={<AdminProtectedRoute><AdminBlogImport /></AdminProtectedRoute>} />
            <Route path="/admin/blogs/:id/edit" element={<AdminProtectedRoute><AdminBlogForm /></AdminProtectedRoute>} />
            
            <Route path="/admin/agents" element={<AdminProtectedRoute><AdminAgents /></AdminProtectedRoute>} />
            <Route path="/admin/leads" element={<AdminProtectedRoute><AdminLeads /></AdminProtectedRoute>} />
            <Route path="/admin/leads/analytics" element={<AdminProtectedRoute><AdminLeadAnalytics /></AdminProtectedRoute>} />
            <Route path="/admin/lead-onboard" element={<AdminProtectedRoute><AdminLeadOnboard /></AdminProtectedRoute>} />
            
            <Route path="/admin/payments" element={<AdminProtectedRoute><AdminPayments /></AdminProtectedRoute>} />
            <Route path="/admin/bookings" element={<AdminProtectedRoute><AdminBookings /></AdminProtectedRoute>} />
            <Route path="/admin/scheduler-settings" element={<AdminProtectedRoute><AdminSchedulerSettings /></AdminProtectedRoute>} />
            <Route path="/admin/developers" element={<AdminProtectedRoute><AdminDevelopers /></AdminProtectedRoute>} />
            <Route path="/admin/developer-accounts" element={<AdminProtectedRoute><AdminDeveloperProfiles /></AdminProtectedRoute>} />
            <Route path="/admin/mls-sync" element={<AdminProtectedRoute><AdminMLSSync /></AdminProtectedRoute>} />
            <Route path="/admin/email-templates" element={<AdminProtectedRoute><AdminEmailTemplates /></AdminProtectedRoute>} />
            <Route path="/admin/email-workflows" element={<AdminProtectedRoute><AdminEmailWorkflows /></AdminProtectedRoute>} />
            <Route path="/admin/email-center" element={<AdminProtectedRoute><AdminEmailCenter /></AdminProtectedRoute>} />
            <Route path="/admin/email-flows" element={<AdminProtectedRoute><AdminEmailFlows /></AdminProtectedRoute>} />
            <Route path="/admin/system-emails" element={<AdminProtectedRoute><AdminSystemEmails /></AdminProtectedRoute>} />
            {/* Unified Marketing Hub — replaces old email-builder-hub & campaign-hub */}
            <Route path="/admin/marketing-hub" element={<AdminProtectedRoute><AdminMarketingHub /></AdminProtectedRoute>} />
            <Route path="/admin/email-builder" element={<AdminProtectedRoute><AdminAiEmailBuilderKeyed /></AdminProtectedRoute>} />
            {/* Legacy redirects so old bookmarks still work */}
            <Route path="/admin/email-builder-hub" element={<Navigate to="/admin/marketing-hub" replace />} />
            <Route path="/admin/ai-email-builder" element={<Navigate to="/admin/email-builder" replace />} />
            <Route path="/admin/campaign-builder" element={<Navigate to="/admin/marketing-hub" replace />} />
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
            <Route path="/admin/system" element={<AdminProtectedRoute><AdminSystem /></AdminProtectedRoute>} />
            <Route path="/admin/tech-stack" element={<AdminProtectedRoute><AdminTechStack /></AdminProtectedRoute>} />
            <Route path="/admin/live-activity" element={<AdminProtectedRoute><AdminLiveActivity /></AdminProtectedRoute>} />
            
            
            {/* Agent URL Redirects - common typos/variants */}
            <Route path="/agent" element={<Navigate to="/for-agents" replace />} />
            <Route path="/agents" element={<Navigate to="/for-agents" replace />} />
            <Route path="/agent-portal" element={<Navigate to="/dashboard" replace />} />
            <Route path="/agent-dashboard" element={<Navigate to="/dashboard" replace />} />
            
            {/* Legacy /blogs/* → /blog/* redirect (Google crawled plural form) */}
            <Route path="/blogs/:slug" element={<BlogsRedirect />} />
            <Route path="/blogs" element={<Navigate to="/blog" replace />} />
            
            {/* Legacy route redirects for soft 404 fixes */}
            <Route path="/guide" element={<Navigate to="/buyers-guide" replace />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            {/* Dead routes — redirect to relevant hub so Google sees 301, not soft 404 */}
            <Route path="/market-report/:city" element={<Navigate to="/blog" replace />} />
            <Route path="/market-report" element={<Navigate to="/blog" replace />} />
            <Route path="/deposit/:slug" element={<Navigate to="/presale-guide" replace />} />
            <Route path="/langley/presales" element={<Navigate to="/presale-projects/langley" replace />} />
            <Route path="/investment-presale-properties" element={<Navigate to="/presale-projects" replace />} />
            
            {/* Legacy /presale-condos-{city} format (no slash separator) */}
            <Route path="/presale-condos-vancouver" element={<Navigate to="/vancouver-presale-condos" replace />} />
            <Route path="/presale-condos-surrey" element={<Navigate to="/surrey-presale-condos" replace />} />
            <Route path="/presale-condos-burnaby" element={<Navigate to="/burnaby-presale-condos" replace />} />
            <Route path="/presale-condos-coquitlam" element={<Navigate to="/coquitlam-presale-condos" replace />} />
            <Route path="/presale-condos-langley" element={<Navigate to="/langley-presale-condos" replace />} />
            <Route path="/presale-condos-richmond" element={<Navigate to="/richmond-presale-condos" replace />} />
            <Route path="/presale-condos-delta" element={<Navigate to="/delta-presale-condos" replace />} />
            
            {/* Legacy presale-properties format */}
            <Route path="/surrey-presale-properties" element={<Navigate to="/surrey-presale-condos" replace />} />
            <Route path="/burnaby-presale-properties" element={<Navigate to="/burnaby-presale-condos" replace />} />
            <Route path="/abbotsford-presale-properties" element={<Navigate to="/abbotsford-presale-condos" replace />} />
            
            {/* Legacy presale price pages */}
            <Route path="/presale-condos-under-700k" element={<Navigate to="/presale-projects" replace />} />
            <Route path="/presale-condos-under-500k" element={<Navigate to="/presale-projects" replace />} />
            <Route path="/presale-condos-under-800k" element={<Navigate to="/presale-projects" replace />} />
            <Route path="/presale-townhomes-under-700k" element={<Navigate to="/presale-projects" replace />} />
            
            {/* /for-developers → /for-agents */}
            <Route path="/for-developers" element={<Navigate to="/for-agents" replace />} />
            
            {/* Properties with spaces in city names (Google crawled these) */}
            <Route path="/properties/new westminster" element={<Navigate to="/properties/new-westminster" replace />} />
            <Route path="/properties/white rock" element={<Navigate to="/properties/white-rock" replace />} />
            <Route path="/properties/north vancouver" element={<Navigate to="/properties/north-vancouver" replace />} />
            <Route path="/properties/maple ridge" element={<Navigate to="/properties/maple-ridge" replace />} />
            <Route path="/properties/port moody" element={<Navigate to="/properties/port-moody" replace />} />
            <Route path="/properties/port coquitlam" element={<Navigate to="/properties/port-coquitlam" replace />} />
            <Route path="/properties/west vancouver" element={<Navigate to="/properties/west-vancouver" replace />} />
            
            {/* Catch 'undefined' segment URLs — Google crawled these from internal links with null property types */}
            {/* These must come BEFORE the generic :slug route */}
            <Route path="/properties/:citySlug/undefined" element={<PropertiesCleanupRedirect />} />
            <Route path="/properties/:citySlug/:neighborhoodSlug/undefined" element={<PropertiesCleanupRedirect />} />
            <Route path="/properties/:citySlug/undefined/:type" element={<PropertiesCleanupRedirect />} />
            
            {/* Legacy /property-type/ routes → redirect to presale projects */}
            <Route path="/property-type/condos/:slug" element={<Navigate to="/presale-projects" replace />} />
            <Route path="/property-type/townhomes/:slug" element={<Navigate to="/presale-projects" replace />} />
            <Route path="/property-type/:type/:slug" element={<Navigate to="/presale-projects" replace />} />

            {/* Old ad-hoc project campaign pages → redirect to presale projects hub */}
            <Route path="/properties/georgetown-ii" element={<Navigate to="/presale-projects/surrey" replace />} />
            <Route path="/properties/brentwood-block" element={<Navigate to="/presale-projects/burnaby" replace />} />
            <Route path="/properties/komo" element={<Navigate to="/presale-projects/surrey" replace />} />
            <Route path="/properties/havenwood" element={<Navigate to="/presale-projects" replace />} />
            <Route path="/properties/westview" element={<Navigate to="/presale-projects" replace />} />
            <Route path="/properties/harriswood" element={<Navigate to="/presale-projects/langley" replace />} />
            <Route path="/properties/the-wright-rail-district-flats" element={<Navigate to="/presale-projects/langley" replace />} />
            <Route path="/properties/soto-on-w28" element={<Navigate to="/presale-projects/vancouver" replace />} />
            <Route path="/properties/tricity-central" element={<Navigate to="/presale-projects/coquitlam" replace />} />
            <Route path="/properties/nature-s-edge" element={<Navigate to="/presale-projects/langley" replace />} />
            <Route path="/presale-projects/ironwood" element={<Navigate to="/presale-projects/richmond" replace />} />
            <Route path="/coquitlam-town-centre-presale-condos-town-centre" element={<Navigate to="/presale-projects/coquitlam" replace />} />
            <Route path="/prime-abbotsford-location-presale-homes-cooper-meadows-west-field" element={<Navigate to="/presale-projects/abbotsford" replace />} />
            <Route path="/whalley-presale-condos-georgetown-ii" element={<Navigate to="/presale-projects/surrey" replace />} />
            <Route path="/dawson-delta-presale-condos-brentwood-block" element={<Navigate to="/presale-projects/burnaby" replace />} />

            {/* Public Pitch Deck pages — must be before /:cityProductSlug catch-all */}
            <Route path="/deck/:slug" element={<DeckPublicPage />} />

            {/* SEO City Product Pages - must be before 404 */}
            <Route path="/:cityProductSlug" element={<CityProductPage />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
            </GlobalPullToRefresh>
          </SwipeNavigationProvider>
        </BrowserRouter>
      </TooltipProvider>
      </BuyerAuthProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
