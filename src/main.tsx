import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Dismiss splash after app is truly interactive
function dismissSplash() {
  const splash = document.getElementById("app-splash");
  if (!splash || splash.style.display === "none") return;
  
  // Slight hold so animation feels intentional, then fade
  splash.style.opacity = "0";
  splash.style.visibility = "hidden";
  setTimeout(() => splash.remove(), 900);
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
  // Wait for first meaningful paint — two rAF frames + small delay
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(dismissSplash, 100);
    });
  });
}
