import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Dismiss splash with a premium hold + fade
function dismissSplash() {
  const splash = document.getElementById("app-splash");
  if (!splash || splash.style.display === "none") return;
  
  // Hold the splash briefly so the animation feels intentional, then fade
  setTimeout(() => {
    splash.style.opacity = "0";
    splash.style.visibility = "hidden";
    setTimeout(() => splash.remove(), 900);
  }, 400);
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </React.StrictMode>
  );
  // Wait for first meaningful paint before dismissing
  requestAnimationFrame(() => {
    requestAnimationFrame(dismissSplash);
  });
}
