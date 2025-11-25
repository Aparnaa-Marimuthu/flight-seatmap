import React from "react";
import ReactDOM from "react-dom/client";
import FlightSeatMap from "./components/FlightSeatMap";
import seatSvg from "./assets/airplane_seat_map.svg?raw";

declare global {
  interface Window {
    customChartApp: any;
  }
}

(window as any).customChartApp = {
  render: (container: HTMLElement, data: any, config: any) => {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <FlightSeatMap svgMarkup={seatSvg} data={data} config={config} />
      </React.StrictMode>
    );
  }
}