import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

const origin = "https://www.geotherm.sk";
const sitemapIndex = `${origin}/sitemap_index.xml`;
const outputPath = path.join(process.cwd(), "src", "data", "geotherm-knowledge.json");

const skipImagePattern =
  /logo|avatar|gravatar|favicon|admin-ajax|blank|sprite|loader|facebook|instagram|linkedin|placeholder/i;

const productKeywords = [
  "tepelné čerpadlo",
  "tepelná čerpadlá",
  "vzduch voda",
  "zem voda",
  "voda voda",
  "rekuperácia",
  "riadené vetranie",
  "podlahové vykurovanie",
  "stenové vykurovanie",
  "stropné chladenie",
  "fotovoltika",
  "solárne panely",
  "zdravotechnika",
  "zti",
  "dotácie",
  "zelená domácnostiam",
  "servis",
  "projekcia",
  "montáž",
  "vaillant",
  "nibe",
  "daikin",
  "viessmann",
  "hoval",
  "zehnder",
  "stiebel",
];

function normalizeWhitespace(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeForSearch(value = "") {
  return normalizeWhitespace(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function slugFromUrl(url) {
  return url.replace(origin, "").replace(/^\/|\/$/g, "") || "home";
}

function readableTitle(value) {
  return normalizeWhitespace(value)
    .replace(/\s+[-|]\s+Geotherm Slovakia s\.r\.o\.$/i, "")
    .replace(/\s+[-|]\s+GEOTHERM Slovakia s\.r\.o\.$/i, "");
}

async function fetchText(url, retries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(18000),
        headers: {
          "user-agent": "Arcigy GEOTHERM chatbot static knowledge builder/1.0",
          accept: "text/html,application/xml,text/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        throw new Error(`Fetch failed ${response.status}`);
      }

      return {
        contentType: response.headers.get("content-type") ?? "",
        text: await response.text(),
      };
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    }
  }

  throw lastError;
}

async function readSitemap(url, seen = new Set()) {
  if (seen.has(url)) return [];
  seen.add(url);

  const { text } = await fetchText(url);
  const $ = cheerio.load(text, { xmlMode: true });
  const childSitemaps = $("sitemap loc")
    .map((_, element) => $(element).text().trim())
    .get()
    .filter(Boolean);

  if (childSitemaps.length) {
    const nested = [];

    for (const child of childSitemaps) {
      nested.push(...(await readSitemap(child, seen)));
    }

    return nested;
  }

  return $("url loc")
    .map((_, element) => $(element).text().trim())
    .get()
    .filter((urlValue) => urlValue.startsWith(origin))
    .filter((urlValue) => !urlValue.includes("/wp-content/"))
    .filter((urlValue) => !urlValue.includes("/author/"))
    .filter((urlValue) => !urlValue.includes("/tag/"))
    .filter((urlValue) => !urlValue.includes("/feed/"));
}

function resolveUrl(pageUrl, src = "") {
  if (!src || src.startsWith("data:") || src.startsWith("mailto:") || src.startsWith("tel:")) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("//")) return `https:${src}`;

  return new URL(src.split("?")[0], pageUrl).toString();
}

function bestImageSource(image, pageUrl) {
  const srcset = image.attr("srcset") || image.attr("data-srcset") || "";
  const candidates = srcset
    .split(",")
    .map((entry) => {
      const [src, size = "0w"] = entry.trim().split(/\s+/);
      return {
        src,
        width: Number.parseInt(size.replace(/\D/g, ""), 10) || 0,
      };
    })
    .filter((candidate) => candidate.src)
    .sort((a, b) => b.width - a.width);

  return (
    resolveUrl(pageUrl, candidates[0]?.src) ||
    resolveUrl(pageUrl, image.attr("data-src") || image.attr("data-orig-file") || image.attr("src") || "")
  );
}

function extractImages($, pageUrl) {
  const images = [];
  const contentRoot = $("main, article, #main, .post-content, .entry-content, .fusion-post-content").first();
  const scope = contentRoot.length ? contentRoot : $("body");

  scope.find("img").each((_, element) => {
    const image = $(element);
    const isChromeImage = image.closest(
      "header, footer, nav, aside, .sidebar, .fusion-recent-posts, .related-posts, .fusion-carousel, .fusion-sharing-box",
    ).length;
    const url = bestImageSource(image, pageUrl);
    const alt = normalizeWhitespace(image.attr("alt") || image.attr("title") || "");
    const width = Number.parseInt(image.attr("width") || "", 10) || undefined;
    const height = Number.parseInt(image.attr("height") || "", 10) || undefined;
    const className = image.attr("class") || "";

    if (isChromeImage || !url || !url.startsWith(origin)) return;
    if (skipImagePattern.test(`${url} ${alt} ${className}`)) return;
    if (width && width < 140) return;

    images.push({
      url,
      alt: alt || readableTitle(path.basename(url).replace(/\.(webp|jpe?g|png)$/i, "")),
      width,
      height,
    });
  });

  return unique(images.map((image) => image.url))
    .map((url) => images.find((image) => image.url === url))
    .slice(0, 10);
}

function classifyPage(url, text, title, headings) {
  const haystack = normalizeForSearch(`${url} ${title} ${headings.join(" ")} ${text}`);

  return productKeywords
    .filter((keyword) => haystack.includes(normalizeForSearch(keyword)))
    .slice(0, 14);
}

function chunkText(text) {
  const paragraphs = text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ0-9])/)
    .map(normalizeWhitespace)
    .filter((value) => value.length > 70);
  const chunks = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + " " + paragraph).length > 1250 && current.length > 220) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = normalizeWhitespace(`${current} ${paragraph}`);
    }
  }

  if (current.length > 120) chunks.push(current);
  return chunks.slice(0, 14);
}

function cleanText(value) {
  return normalizeWhitespace(value)
    .replace(/Prejsť na obsah/gi, "")
    .replace(/Go to Top/gi, "")
    .replace(/Zdieľať tento článok/gi, "")
    .replace(/Facebook Twitter LinkedIn/gi, "")
    .replace(/Previous Next/gi, "")
    .trim();
}

function extractPage(url, html) {
  const $ = cheerio.load(html);
  const title = readableTitle(
    $("meta[property='og:title']").attr("content") ||
      $("title").first().text() ||
      $("h1").first().text() ||
      "",
  );
  const description = normalizeWhitespace(
    $("meta[name='description']").attr("content") || $("meta[property='og:description']").attr("content") || "",
  );
  const images = extractImages($, url);

  $("script, style, noscript, svg, iframe, form, nav, header, footer, .sidebar, .fusion-sharing-box").remove();

  const headings = unique(
    $("h1, h2, h3")
      .map((_, element) => normalizeWhitespace($(element).text()))
      .get(),
  ).slice(0, 40);
  const contentRoot = $("main, article, #main, .post-content, .entry-content, .fusion-post-content").first();
  const rawText = cleanText((contentRoot.length ? contentRoot : $("body")).text());

  if (rawText.length < 170) return null;

  const chunks = chunkText(rawText);

  return {
    url,
    slug: slugFromUrl(url),
    title,
    description,
    headings,
    tags: classifyPage(url, rawText, title, headings),
    images,
    text: rawText.slice(0, 16000),
    chunks: chunks.map((content, index) => ({
      id: `${url}#chunk-${index + 1}`,
      content,
    })),
  };
}

async function main() {
  const urls = [...new Set(await readSitemap(sitemapIndex))].sort();
  const pages = [];
  const failed = [];
  const queue = [...urls];
  const workerCount = 10;

  async function worker(workerIndex) {
    while (queue.length) {
      const url = queue.shift();
      if (!url) return;

      try {
        const { contentType, text } = await fetchText(url);
        if (!contentType.includes("html")) continue;

        const page = extractPage(url, text);
        if (page) {
          pages.push(page);
          console.log(`${pages.length}/${urls.length} worker-${workerIndex} ${url}`);
        }
      } catch (error) {
        failed.push({ url, reason: error instanceof Error ? error.message : String(error) });
        console.warn(`Skipped ${url}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, (_, index) => worker(index + 1)));

  pages.sort((a, b) => a.url.localeCompare(b.url));

  const chunkCount = pages.reduce((sum, page) => sum + page.chunks.length, 0);
  const imageCount = pages.reduce((sum, page) => sum + page.images.length, 0);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        scrapedAt: new Date().toISOString(),
        source: origin,
        mode: "static-live-sitemap-crawl",
        pageCount: pages.length,
        chunkCount,
        imageCount,
        failedCount: failed.length,
        failed,
        pages,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`Saved ${pages.length} pages, ${chunkCount} chunks and ${imageCount} images to ${outputPath}`);
  if (failed.length) console.log(`Failed URLs: ${failed.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
