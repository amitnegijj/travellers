import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Fail loudly if 5173 is taken rather than silently moving to 5174/5175 —
    // the API's CORS allowlist only knows about the configured port, so a
    // silent port bump turns into a confusing "blocked by CORS" error with
    // no obvious cause instead of an immediate, obvious "port in use".
    strictPort: true,
  },
});
