import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Dismiss splash screen after React mounts
function dismissSplash() {
  const splash = document.getElementById("app-splash");
  if (splash) {
    splash.style.opacity = "0";
    splash.style.visibility = "hidden";
    setTimeout(() => splash.remove(), 600);
  }
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
  // Dismiss after first paint
  requestAnimationFrame(() => {
    requestAnimationFrame(dismissSplash);
  });
}
