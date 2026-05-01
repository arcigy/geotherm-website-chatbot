import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

const origin = "https://www.geotherm.sk";
const sitemapIndex = `${origin}/sitemap_index.xml`;
const outputPath = path.join(process.cwd(), "src", "data", "geotherm-knowledge.json");

async function fetchText(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(25000),
    headers: {
      "user-agent": "Arcigy GEOTHERM chatbot knowledge scraper/0.1",
      accept: "text/html,application/xml,text/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`);
  }

  return {
    contentType: response.headers.get("content-type") ?? "",
    text: await response.text(),
  };
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

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function extractPage(url, html) {
  const $ = cheerio.load(html);

  $("script, style, noscript, svg, iframe, form, nav, header, footer").remove();

  const title = normalizeWhitespace(
    $("meta[property='og:title']").attr("content") || $("title").first().text() || "",
  );
  const description = normalizeWhitespace(
    $("meta[name='description']").attr("content") ||
      $("meta[property='og:description']").attr("content") ||
      "",
  );
  const headings = $("h1, h2, h3")
    .map((_, element) => normalizeWhitespace($(element).text()))
    .get()
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 40);

  const contentRoot = $("main, article, #main, .post-content, .entry-content, .fusion-post-content").first();
  const rawText = normalizeWhitespace((contentRoot.length ? contentRoot : $("body")).text());
  const text = rawText
    .replace(/Prejsť na obsah/gi, "")
    .replace(/Go to Top/gi, "")
    .trim();

  return {
    url,
    title,
    description,
    headings,
    text: text.slice(0, 16000),
  };
}

async function main() {
  const urls = [...new Set(await readSitemap(sitemapIndex))].sort();
  const pages = [];
  const queue = [...urls];

  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      if (!url) return;

      try {
        const { contentType, text } = await fetchText(url);
        if (!contentType.includes("html")) continue;

        const page = extractPage(url, text);
        if (page.text.length > 120) {
          pages.push(page);
          console.log(`${pages.length}/${urls.length} ${url}`);
        }
      } catch (error) {
        console.warn(`Skipped ${url}: ${error.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: 6 }, worker));

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        scrapedAt: new Date().toISOString(),
        source: origin,
        pageCount: pages.length,
        pages,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`Saved ${pages.length} pages to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
