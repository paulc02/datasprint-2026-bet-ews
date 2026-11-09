// Un singur fișier HTML, cu tot codul inclus: se deschide direct cu dublu-click (file://), fără server.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: { outDir: "dist-single", emptyOutDir: true, chunkSizeWarningLimit: 4000 },
});
