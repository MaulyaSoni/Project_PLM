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
  },
  optimizeDeps: {
    include: ["@tanstack/react-query", "@tanstack/query-core"],
  },
  ssr: {
    noExternal: ["@tanstack/react-query", "@tanstack/query-core"],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@tanstack/react-query": path.resolve(__dirname, "./node_modules/@tanstack/react-query/src/index.ts"),
      "@tanstack/query-core": path.resolve(__dirname, "./node_modules/@tanstack/query-core/src/index.ts"),
    },
  },
}));
