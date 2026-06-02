import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const previewHtml = `<!doctype html>
<html lang="sk">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no" />
    <title>Arcigy Chatbot Embed Preview</title>
    <link rel="stylesheet" href="./chatbot.css" />
    <style>
      html,
      body {
        min-height: 100%;
        margin: 0;
        background: #fff;
      }
    </style>
    <script>
      window.ARCIGY_CHATBOT_CONFIG = {
        mode: "local",
        apiBase: window.location.protocol + "//" + window.location.hostname + ":4317",
        siteId: "geotherm",
        siteUrl: window.location.origin,
        debug: true
      };
    </script>
  </head>
  <body>
    <div id="arcigy-chatbot-root"></div>
    <script src="./chatbot.js"></script>
  </body>
</html>
`;

const readme = `# Arcigy Chatbot Embed

## Build

\`\`\`bash
npm run build:embed
\`\`\`

## Výsledné súbory

\`\`\`
dist-embed/chatbot.js
dist-embed/chatbot.css
dist-embed/embed-preview.html
dist-embed/README-EMBED.md
\`\`\`

Na WordPress treba nahrať alebo hostovať iba tieto dva súbory:

\`\`\`
chatbot.js
chatbot.css
\`\`\`

## Lokálny test

Spustite:

\`\`\`bash
npm run dev:chat-api
npm run preview:embed
\`\`\`

Potom otvorte:

\`\`\`
http://127.0.0.1:4321/embed-preview.html
\`\`\`

## WordPress vloženie

Vložte tento snippet cez WPCode alebo do pätičky stránky. Treba doplniť iba URL k API a URL k súborom.

\`\`\`html
<script>
(function () {
  window.ARCIGY_CHATBOT_CONFIG = {
    mode: "production",
    apiBase: "https://YOUR-API-DOMAIN",
    siteId: "geotherm",
    siteUrl: window.location.origin,
    debug: false
  };

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://YOUR-CDN-URL/chatbot.css";
  document.head.appendChild(css);

  const script = document.createElement("script");
  script.src = "https://YOUR-CDN-URL/chatbot.js";
  script.defer = true;
  document.body.appendChild(script);
})();
</script>
\`\`\`

## Preview iba na tajnej URL

Ak ho nechcete ukázať verejne, použite preview gate:

\`\`\`html
<script>
(function () {
  const params = new URLSearchParams(window.location.search);
  if (params.get("arcigy_preview") !== "7f92k-test") return;

  window.ARCIGY_CHATBOT_CONFIG = {
    mode: "production",
    apiBase: "https://YOUR-API-DOMAIN",
    siteId: "geotherm",
    siteUrl: window.location.origin,
    debug: true
  };

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://YOUR-CDN-URL/chatbot.css";
  document.head.appendChild(css);

  const script = document.createElement("script");
  script.src = "https://YOUR-CDN-URL/chatbot.js";
  script.defer = true;
  document.body.appendChild(script);
})();
</script>
\`\`\`

Preview URL:

\`\`\`
https://example.com/?arcigy_preview=7f92k-test
\`\`\`

## Rollback

Vo WPCode snippet vypnite alebo zmažte. Keď sa \`chatbot.js\` nenačíta, React widget sa vôbec nespustí.
`;

function writeEmbedDocs() {
  return {
    name: "write-embed-docs",
    closeBundle() {
      mkdirSync(resolve(__dirname, "dist-embed"), { recursive: true });
      writeFileSync(resolve(__dirname, "dist-embed/embed-preview.html"), previewHtml, "utf8");
      writeFileSync(resolve(__dirname, "dist-embed/README-EMBED.md"), readme, "utf8");
    },
  };
}

export default defineConfig({
  plugins: [react(), writeEmbedDocs()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    emptyOutDir: true,
    outDir: "dist-embed",
    sourcemap: false,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, "src/embed.tsx"),
      name: "ArcigyChatbotEmbed",
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
