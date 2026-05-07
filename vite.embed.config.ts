import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const previewHtml = `<!doctype html>
<html lang="sk">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Arcigy Chatbot Embed Preview</title>
    <link rel="stylesheet" href="./chatbot.css" />
    <style>
      body {
        margin: 0;
        background: #f5f7f3;
        color: #172018;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      main {
        width: min(980px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 56px 0 120px;
      }

      section {
        min-height: 320px;
        margin: 0 0 28px;
        border: 1px solid rgba(23, 32, 24, 0.1);
        border-radius: 18px;
        background: #fff;
        box-shadow: 0 20px 50px rgba(23, 32, 24, 0.08);
        padding: 32px;
      }

      h1 {
        margin: 0 0 14px;
        font-size: clamp(34px, 5vw, 64px);
        line-height: 0.96;
      }

      h2 {
        margin: 0 0 12px;
        font-size: 30px;
      }

      p {
        max-width: 680px;
        color: #536053;
        font-size: 18px;
        line-height: 1.55;
      }
    </style>
    <script>
      window.ARCIGY_CHATBOT_CONFIG = {
        mode: "local",
        apiBase: "http://127.0.0.1:4317",
        siteId: "geotherm",
        siteUrl: window.location.origin,
        debug: true
      };
    </script>
  </head>
  <body>
    <main>
      <section>
        <h1>Externá WordPress stránka</h1>
        <p>Toto HTML simuluje cudziu stránku. Chatbot sa mountuje do vlastného root elementu a neposúva layout stránky.</p>
      </section>
      <section id="nibe-s2125"><h2>NIBE S2125</h2><p>Ukážková produktová sekcia pre intent nibe.</p></section>
      <section id="dotacie"><h2>Dotácie</h2><p>Ukážková sekcia pre dotačný intent.</p></section>
      <section id="montaz"><h2>Montáž</h2><p>Ukážková sekcia procesu montáže.</p></section>
      <section id="servis"><h2>Servis</h2><p>Ukážková sekcia servisnej starostlivosti.</p></section>
      <section id="faq-hlucnost"><h2>FAQ hlučnosť</h2><p>Ukážková FAQ sekcia o hlučnosti.</p></section>
      <section id="faq-cena"><h2>FAQ cena</h2><p>Ukážková FAQ sekcia o cene.</p></section>
      <section id="kontakt-formular"><h2>Kontaktný formulár</h2><p>Ukážková kontaktná sekcia.</p></section>
      <section id="realizacia-rodinny-dom"><h2>Realizácia rodinný dom</h2><p>Ukážková sekcia realizácie.</p></section>
    </main>
    <div id="arcigy-chatbot-root"></div>
    <script src="./chatbot.js"></script>
  </body>
</html>
`;

const readme = `# Arcigy Chatbot Embed

## A) Build

\`\`\`bash
npm run build:embed
\`\`\`

## B) Výsledné súbory

\`\`\`
dist-embed/chatbot.js
dist-embed/chatbot.css
dist-embed/embed-preview.html
dist-embed/README-EMBED.md
\`\`\`

## C) Lokálny test

Otvorte:

\`\`\`
dist-embed/embed-preview.html
\`\`\`

V chate skúste: \`nibe\`, \`dotácie\`, \`montáž\`, \`servis\`, \`hlučnosť\`, \`cena\`, \`kontakt\`, \`realizácie\`.

## D) WPCode preview snippet

Widget sa má zobraziť iba na tajnej preview URL:

\`\`\`
?arcigy_preview=7f92k-test
\`\`\`

Snippet:

\`\`\`html
<script>
(function () {
  const params = new URLSearchParams(window.location.search);

  if (params.get("arcigy_preview") !== "7f92k-test") {
    return;
  }

  window.ARCIGY_CHATBOT_CONFIG = {
    mode: "preview",
    siteId: "client-preview",
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

## E) Rollback

Vo WPCode snippet vypnite alebo zmažte. Keď sa \`chatbot.js\` nenačíta, React widget sa vôbec nespustí.

## F) Console testy

\`\`\`js
window.arcigyChatbot.test.runFakeAction("nibe")
window.arcigyChatbot.test.validateSelector("#nibe-s2125")
\`\`\`

## Backend režim neskôr

Ak nastavíte \`mode\` na \`local\` alebo \`production\` a doplníte \`apiBase\`, widget pošle:

\`\`\`js
POST \`\${apiBase}/chat\`
{ message, currentUrl: window.location.href, siteId }
\`\`\`

Ak request zlyhá alebo \`apiBase\` chýba, widget bezpečne použije lokálnu fake odpoveď.
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
