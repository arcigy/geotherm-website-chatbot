# Arcigy Chatbot Embed

## Build

```bash
npm run build:embed
```

## Výsledné súbory

```
dist-embed/chatbot.js
dist-embed/chatbot.css
dist-embed/embed-preview.html
dist-embed/README-EMBED.md
```

Na WordPress treba nahrať alebo hostovať iba tieto dva súbory:

```
chatbot.js
chatbot.css
```

## Lokálny test

Spustite:

```bash
npm run dev:chat-api
npm run preview:embed
```

Potom otvorte:

```
http://127.0.0.1:4321/embed-preview.html
```

## WordPress vloženie

Vložte tento snippet cez WPCode alebo do pätičky stránky. Treba doplniť iba URL k API a URL k súborom.

```html
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
```

## Preview iba na tajnej URL

Ak ho nechcete ukázať verejne, použite preview gate:

```html
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
```

Preview URL:

```
https://example.com/?arcigy_preview=7f92k-test
```

## Rollback

Vo WPCode snippet vypnite alebo zmažte. Keď sa `chatbot.js` nenačíta, React widget sa vôbec nespustí.
