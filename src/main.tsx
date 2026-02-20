import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Ensure splash plays for a minimum duration before dismissing
const SPLASH_MIN_MS = 2200; // minimum 2.2s so full animation plays
const splashStart = Date.now();

function dismissSplash() {
  const splash = document.getElementById("app-splash");
  if (!splash || splash.style.display === "none") return;
  
  const elapsed = Date.now() - splashStart;
  const remaining = Math.max(0, SPLASH_MIN_MS - elapsed);
  
  setTimeout(() => {
    splash.style.opacity = "0";
    splash.style.visibility = "hidden";
    setTimeout(() => splash.remove(), 1100);
  }, remaining);
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
  // Wait for first meaningful paint, then respect minimum splash time
  requestAnimationFrame(() => {
    requestAnimationFrame(dismissSplash);
  });
}
