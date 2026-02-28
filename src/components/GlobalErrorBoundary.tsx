/**
 * GlobalErrorBoundary
 * Catches uncaught React render errors and shows a recovery UI
 * instead of a blank white screen.
 */
import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Send to GA4 if available
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "exception", {
        description: error.message,
        fatal: true,
        component_stack: info.componentStack?.slice(0, 200),
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: "24px",
          background: "#fff",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 48, margin: "0 0 16px" }}>⚠️</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
          Something went wrong
        </h1>
        <p style={{ color: "#6b7280", fontSize: 15, maxWidth: 400, margin: "0 0 28px", lineHeight: 1.6 }}>
          Our team has been notified. Try refreshing the page or head back to the homepage.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={this.handleReload}
            style={{
              padding: "12px 24px",
              background: "#f59e0b",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Reload Page
          </button>
          <button
            onClick={this.handleGoHome}
            style={{
              padding: "12px 24px",
              background: "#1f2937",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Go to Homepage
          </button>
        </div>
        {import.meta.env.DEV && this.state.error && (
          <pre
            style={{
              marginTop: 32,
              padding: 16,
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 8,
              fontSize: 12,
              color: "#dc2626",
              maxWidth: 600,
              textAlign: "left",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {this.state.error.stack}
          </pre>
        )}
      </div>
    );
  }
}
