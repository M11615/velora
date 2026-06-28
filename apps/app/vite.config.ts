import { defineConfig, UserConfig } from "vite";
import react from "@vitejs/plugin-react";

// process is a nodejs global
const devHost: string | undefined = process.env.TAURI_DEV_HOST;
const serverUrl: string | undefined = process.env.SERVER_URL;
const aiUrl: string | undefined = process.env.AI_URL;

// https://vite.dev/config/
export default defineConfig(async (): Promise<UserConfig> => ({
  plugins: [react()],
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: devHost || false,
    hmr: devHost
      ? {
        protocol: "ws",
        host: devHost,
        port: 1421
      }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"]
    },
    proxy: {
      "/api": {
        target: serverUrl,
        changeOrigin: true,
        rewrite: (path: string): string => {
          return path.replace(/^\/api/, "");
        }
      },
      "/ai": {
        target: aiUrl,
        changeOrigin: true,
        rewrite: (path: string): string => {
          return path.replace(/^\/ai/, "");
        }
      }
    }
  }
}));
