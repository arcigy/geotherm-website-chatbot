import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    emptyOutDir: false,
    outDir: "arcigy-chatbot-plugin/assets",
    sourcemap: false,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, "src/wp-widget/main.tsx"),
      name: "ArcigyChatbotWidget",
      formats: ["iife"],
      fileName: () => "chatbot.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => (assetInfo.name?.endsWith(".css") ? "chatbot.css" : "chatbot-[name][extname]"),
      },
    },
  },
});
