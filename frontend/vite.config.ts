import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxy = env.VITE_DEV_API_PROXY || "http://127.0.0.1:3001";
  return {
    plugins: [
      TanStackRouterVite({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "src/routes",
        generatedRouteTree: "src/routeTree.gen.ts",
      }),
      react(),
      tailwindcss(),
      tsconfigPaths(),
      ViteImageOptimizer({
        includePublic: true,
        cache: true,
        // PNG: lossless zlib + adaptive filtering (no palette quantization).
        png: {
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: false,
        },
        // JPEG: high-quality mozjpeg — fast loads with negligible visible change.
        jpeg: { quality: 92, mozjpeg: true },
        jpg: { quality: 92, mozjpeg: true },
      }),
    ],
    server: {
      port: 5173,
      host: "0.0.0.0",
      proxy: {
        // Forward API calls to the backend during development.
        "/api": {
          target: apiProxy,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
      host: "0.0.0.0",
      // Same /api proxy for `npm run preview` so the production bundle can
      // be tested locally end-to-end against a running backend, mirroring
      // the nginx setup that serves frontend/dist/ + proxies /api on Plesk.
      proxy: {
        "/api": {
          target: apiProxy,
          changeOrigin: true,
        },
      },
    },
  };
});
