# Arcigy Chatbot Embed

## A) Build

```bash
npm run build:embed
```

## B) Výsledné súbory

```
dist-embed/chatbot.js
dist-embed/chatbot.css
dist-embed/embed-preview.html
dist-embed/README-EMBED.md
```

## C) Lokálny test

Otvorte:

```
dist-embed/embed-preview.html
```

V chate skúste: `nibe`, `dotácie`, `montáž`, `servis`, `hlučnosť`, `cena`, `kontakt`, `realizácie`.

## D) WPCode preview snippet

Widget sa má zobraziť iba na tajnej preview URL:

```
?arcigy_preview=7f92k-test
```

Snippet:

```html
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
```

## E) Rollback

Vo WPCode snippet vypnite alebo zmažte. Keď sa `chatbot.js` nenačíta, React widget sa vôbec nespustí.

## F) Console testy

```js
window.arcigyChatbot.test.runFakeAction("nibe")
window.arcigyChatbot.test.validateSelector("#nibe-s2125")
```

## Backend režim neskôr

Ak nastavíte `mode` na `local` alebo `production` a doplníte `apiBase`, widget pošle:

```js
POST `${apiBase}/chat`
{ message, currentUrl: window.location.href, siteId }
```

Ak request zlyhá alebo `apiBase` chýba, widget bezpečne použije lokálnu fake odpoveď.
