import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary.tsx";
import { bootstrapCrmTemplateSeed } from "./lib/bootstrapCrmTemplateSeed";
import "./index.css";

// Best-effort: ensure CRM template seed runs once after deployment.
bootstrapCrmTemplateSeed();

function dismissSplash() {
  const splash = document.getElementById("app-splash");
  if (!splash || !splash.parentNode) return;

  splash.style.opacity = "0";
  splash.style.visibility = "hidden";
  setTimeout(() => splash.remove(), 350);
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
  // Dismiss splash once React has painted
  requestAnimationFrame(() => {
    requestAnimationFrame(dismissSplash);
  });
}
