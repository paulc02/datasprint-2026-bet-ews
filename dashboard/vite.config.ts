// Config principal: `npm run dev` / `npm run build` → dist/ (site static, merge pe orice hosting).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig({
  // căi relative: site-ul merge și într-un subfolder (ex. GitHub Pages: utilizator.github.io/super-ews/)
  base: "./",
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: {
    // bibliotecile în fișiere separate (se păstrează în cache la actualizări de date)
    rollupOptions: { output: { manualChunks: { grafice: ["recharts"] } } },
    chunkSizeWarningLimit: 900,
  },
});
