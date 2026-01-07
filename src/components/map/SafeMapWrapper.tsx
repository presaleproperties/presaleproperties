import { useState, useEffect, ReactNode, Component, ErrorInfo } from "react";
import { MapPin, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary for catching map rendering errors
class MapErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[SafeMapWrapper] Map error caught:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface SafeMapWrapperProps {
  children: ReactNode;
  height?: string;
  onRetry?: () => void;
  debugMode?: boolean;
}

interface MapDebugInfo {
  isClient: boolean;
  provider: "leaflet";
  hasError: boolean;
  errorMessage: string | null;
  loadTime: number | null;
}

export function SafeMapWrapper({ 
  children, 
  height = "h-[500px] lg:h-[600px]",
  onRetry,
  debugMode = false
}: SafeMapWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadStartTime] = useState(Date.now());
  const [loadTime, setLoadTime] = useState<number | null>(null);

  // Client-side only check - prevents SSR issues
  useEffect(() => {
    setIsClient(true);
    setLoadTime(Date.now() - loadStartTime);
  }, [loadStartTime]);

  const handleError = (error: Error) => {
    console.error("[SafeMapWrapper] Error:", error);
    setHasError(true);
    setErrorMessage(error.message);
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage(null);
    onRetry?.();
  };

  const debugInfo: MapDebugInfo = {
    isClient,
    provider: "leaflet",
    hasError,
    errorMessage,
    loadTime
  };

  // Debug panel (only in development)
  const DebugPanel = () => {
    if (!debugMode || process.env.NODE_ENV === "production") return null;
    
    return (
      <div className="absolute top-2 right-2 z-[1001] bg-background/95 backdrop-blur-sm border rounded-lg p-3 text-xs font-mono max-w-[200px]">
        <p className="font-bold mb-2 text-foreground">Map Debug</p>
        <div className="space-y-1 text-muted-foreground">
          <p>Client: {debugInfo.isClient ? "✅" : "❌"}</p>
          <p>Provider: {debugInfo.provider}</p>
          <p>Error: {debugInfo.hasError ? "⚠️" : "✅"}</p>
          {debugInfo.loadTime && <p>Load: {debugInfo.loadTime}ms</p>}
          {debugInfo.errorMessage && (
            <p className="text-destructive text-[10px] break-words">
              {debugInfo.errorMessage}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Loading state while we check for client-side
  if (!isClient) {
    return (
      <div className={`${height} rounded-xl bg-muted animate-pulse flex items-center justify-center`}>
        <div className="text-center text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-2 animate-pulse" />
          <p>Preparing map...</p>
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (hasError) {
    return (
      <div className={`${height} rounded-xl bg-muted flex items-center justify-center border border-border`}>
        <div className="text-center text-muted-foreground p-6 max-w-sm">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-amber-500" />
          <h3 className="font-semibold text-foreground mb-2">Map couldn't load</h3>
          <p className="text-sm mb-4">
            The map is temporarily unavailable. You can still browse projects using the list view.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="default" size="sm" asChild>
              <a href="/presale-projects">Browse List</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const ErrorFallback = (
    <div className={`${height} rounded-xl bg-muted flex items-center justify-center border border-border`}>
      <div className="text-center text-muted-foreground p-6 max-w-sm">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-amber-500" />
        <h3 className="font-semibold text-foreground mb-2">Map Error</h3>
        <p className="text-sm mb-4">
          Something went wrong loading the map. Try refreshing the page.
        </p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Page
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <MapErrorBoundary 
        fallback={ErrorFallback} 
        onError={(error) => handleError(error)}
      >
        {children}
      </MapErrorBoundary>
      <DebugPanel />
    </div>
  );
}
