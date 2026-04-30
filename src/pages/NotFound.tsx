import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Home, Search, Users, Building2 } from "lucide-react";

/**
 * 404 Not Found Page
 * 
 * SEO Considerations:
 * - Sets HTTP 404 status via meta tag for SSR/prerender detection
 * - Uses noindex to prevent indexing of 404 pages
 * - Provides helpful navigation to prevent soft 404 issues
 */
const NotFound = () => {
  const location = useLocation();
  
  // Check if the attempted URL is agent-related
  const isAgentRelated = location.pathname.toLowerCase().includes("agent");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    // Signal to prerender services that this is a true 404
    // This helps search engines understand the page doesn't exist
    if (typeof window !== "undefined") {
      // Set window variable for prerender detection
      (window as any).prerenderReady = true;
      (window as any).prerenderStatusCode = 404;
    }
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Page Not Found | PresaleProperties.com</title>
        <meta name="robots" content="noindex, nofollow" />
        {/* Signal 404 status for prerender services */}
        <meta name="prerender-status-code" content="404" />
        {/* Prevent any canonical inheritance */}
        {/* No canonical - 404 pages should not be indexed */}
      </Helmet>
      
      <ConversionHeader />
      
      <main className="min-h-[60vh] flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          {isAgentRelated ? (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Team member? Sign in to access your dashboard:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/login">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Users className="h-4 w-4 mr-2" />
                    Team Login
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    <Building2 className="h-4 w-4 mr-2" />
                    Team Dashboard
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <Button size="lg" className="w-full sm:w-auto">
                  <Home className="h-4 w-4 mr-2" />
                  Return Home
                </Button>
              </Link>
              <Link to="/presale-projects">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Search className="h-4 w-4 mr-2" />
                  Browse Projects
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default NotFound;
