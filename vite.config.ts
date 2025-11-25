import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/ts-renderer.tsx",
      name: "FlightSeatMapChart",
      fileName: () => "index.js"
    },
    rollupOptions: {
      // No external dependencies
      external: [],
      output: {
        format: "iife", // Required for ThoughtSpot custom charts
        globals: {}
      }
    }
  }
});
