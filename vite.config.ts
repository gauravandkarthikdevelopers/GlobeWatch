import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      // Avoid browser CORS issues by proxying external feeds through Vite.
      // Paths are rewritten to remove the proxy prefix.
      "/gdelt": {
        target: "https://api.gdeltproject.org",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/gdelt/, ""),
      },
      "/reliefweb": {
        target: "https://api.reliefweb.int",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/reliefweb/, ""),
      },
      "/usgs": {
        target: "https://earthquake.usgs.gov",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/usgs/, ""),
      },
      "/gdacs": {
        target: "https://gdacs.org",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/gdacs/, ""),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
