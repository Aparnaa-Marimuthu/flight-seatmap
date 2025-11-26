import React from "react";
import ReactDOM from "react-dom/client";
import FlightSeatMap from "./components/FlightSeatMap";
import seatSvg from "./assets/corrected_seats_hitbox.svg?raw";

declare global {
  interface Window {
    customChartApp: any;
    __TS_EMBEDDED__?: boolean;
  }
}

window.customChartApp = {
  render(container: HTMLElement, data: any, config: any) {
    window.__TS_EMBEDDED__ = true;

    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <FlightSeatMap svgMarkup={seatSvg} data={data} config={config} />
      </React.StrictMode>
    );
  }
};
