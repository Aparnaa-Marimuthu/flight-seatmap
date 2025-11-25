import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import "./RootRenderer"; // Registers window.customChartApp

const rootEl = document.getElementById("root");

// If ThoughtSpot is embedding us, it calls window.customChartApp.render().
// So do NOT mount React in that case.
const isEmbeddedInThoughtSpot = window !== window.parent;

if (!isEmbeddedInThoughtSpot) {
  // Local development mode
  ReactDOM.createRoot(rootEl!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
