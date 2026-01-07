import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Page Not Found | PresaleProperties.com</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      
      <ConversionHeader />
      
      <main className="min-h-[60vh] flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
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
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default NotFound;
