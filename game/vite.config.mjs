import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function routeRuntimeAssetsThroughEdge() {
  return {
    name: "human-override-r2-runtime-assets",
    enforce: "pre",
    transform(code, id) {
      const normalized = id.replaceAll("\\", "/");
      if (!normalized.includes("/src/") || !code.includes("assets/overload/")) return null;
      const routed = code.replace(/(["'`])(?:\.\/|\/)assets\/overload\//g, "$1/cdn/assets/overload/");
      return routed === code ? null : { code: routed, map: null };
    },
  };
}

function manualChunks(id) {
  const normalized = id.replaceAll("\\", "/");
  if (normalized.includes("/node_modules/phaser/")) return "phaser-vendor";
  if (normalized.includes("/node_modules/react/")
    || normalized.includes("/node_modules/react-dom/")
    || normalized.includes("/node_modules/scheduler/")) return "react-vendor";
  if (normalized.includes("/src/game/assets/manifest.ts")) return "overload-assets";
  if (normalized.includes("/src/phaser/view/")) return "overload-view";
  if (normalized.includes("/src/phaser/")) return "overload-runtime";
  if (normalized.includes("/src/swarm/")) return "overload-simulation";
  return undefined;
}

export default defineConfig(({ command }) => ({
  base: "./",
  build: {
    outDir: "dist/client",
    chunkSizeWarningLimit: 1700,
    rollupOptions: {
      output: { manualChunks },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [
    ...(command === "build" ? [routeRuntimeAssetsThroughEdge()] : []),
    react(),
  ],
}));
