import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { powerApps } from "@microsoft/power-apps-vite";

export default defineConfig({
  base: "./",
  server: {
    host: "::",
    port: 3000
  },
  plugins: [react(), tailwindcss(), powerApps()]
});
