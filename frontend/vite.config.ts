import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // Add explicit alias configuration for the common package
      "@discura/common": path.resolve(__dirname, "../common/src"),
    },
  },

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          const rewrittenPath = path.replace(/^\/api/, "");
          console.log(`Vite proxy: ${path} -> ${rewrittenPath}`);
          return rewrittenPath;
        },
        configure: (proxy, options) => {
          proxy.on("error", (err, req, res) => {
            console.error("Vite proxy error:", err);
          });
          proxy.on("proxyReq", (proxyReq, req, res) => {
            console.log("Proxying request:", {
              originalUrl: req.url,
              targetUrl: proxyReq.path,
              method: proxyReq.method,
            });
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            console.log("Received proxy response:", {
              originalUrl: req.url,
              statusCode: proxyRes.statusCode,
              headers: proxyRes.headers,
            });
          });
        },
      },
    },
  },
});
