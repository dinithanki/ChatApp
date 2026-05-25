import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { normalizeUrl } from "./src/lib/url.js";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiUrl =
    normalizeUrl(env.VITE_API_URL || "http://localhost:3000") ||
    "http://localhost:3000";
  const socketUrl = normalizeUrl(env.VITE_SOCKET_URL || apiUrl) || apiUrl;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true,
        },
        "/socket.io": {
          target: socketUrl,
          ws: true,
        },
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version),
    },
  };
});
