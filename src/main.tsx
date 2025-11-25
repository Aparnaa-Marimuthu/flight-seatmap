import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import "./RootRenderer";

// If ThoughtSpot calls window.customChartApp.render(), it will render into the container.
// If NOT, we mount the local dev app.

if (!(window as any).__TS_EMBEDDED__) {
  const rootEl = document.getElementById("root");
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}
