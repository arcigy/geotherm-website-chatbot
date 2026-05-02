import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

const sourceRoot = process.argv[2] || path.join(process.env.TEMP || "", "geotherm_full_20260502_135240", "site");
const origin = "https://www.geotherm.sk";
const outputPath = path.join(process.cwd(), "src", "data", "geotherm-knowledge.json");

const skipImagePattern = /logo|avatar|gravatar|favicon|admin-ajax|blank|sprite|loader|facebook|instagram|linkedin/i;
const productKeywords = [
  "tepelné čerpadlo",
  "tepelne cerpadlo",
  "rekuperácia",
  "rekuperacia",
  "fotovoltaika",
  "podlahové vykurovanie",
  "podlahove vykurovanie",
  "stropné chladenie",
  "stropne chladenie",
  "stenové vykurovanie",
  "stenove vykurovanie",
  "solárne panely",
  "solarne panely",
  "dotácie",
  "dotacie",
  "servis",
  "vaillant",
  "nibe",
  "zehnder",
  "multimatic",
];

function normalizeWhitespace(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeUrlPath(value) {
  return value.replaceAll("\\", "/");
}

function pageUrlFromFile(filePath) {
  const relative = normalizeUrlPath(path.relative(sourceRoot, filePath));

  if (relative === "index.html") return `${origin}/`;

  return `${origin}/${relative.replace(/\/index\.html$/, "/").replace(/\.html$/, "/")}`;
}

function resolveAssetUrl(pageFile, src = "") {
  if (!src || src.startsWith("data:") || src.startsWith("mailto:") || src.startsWith("tel:")) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("//")) return `https:${src}`;

  const pageDir = path.dirname(pageFile);
  const assetPath = path.resolve(pageDir, src.split("?")[0]);
  const relative = normalizeUrlPath(path.relative(sourceRoot, assetPath));

  if (relative.startsWith("..")) return "";
  return `${origin}/${relative}`;
}

function readableTitle(value) {
  return normalizeWhitespace(value)
    .replace(/\s+-\s+Geotherm Slovakia s\.r\.o\.$/i, "")
    .replace(/\s+\|\s+Geotherm Slovakia s\.r\.o\.$/i, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function classifyPage(url, text, title) {
  const haystack = `${url} ${title} ${text}`.toLowerCase();
  return productKeywords.filter((keyword) => haystack.includes(keyword)).slice(0, 10);
}

function extractImages($, pageFile) {
  const images = [];
  const contentRoot = $("main, article, #main, .post-content, .entry-content, .fusion-post-content").first();
  const scope = contentRoot.length ? contentRoot : $("body");

  scope.find("img").each((_, element) => {
      const image = $(element);
      const isChromeImage = image.closest(
        "header, footer, nav, aside, .sidebar, .fusion-recent-posts, .related-posts, .fusion-carousel, .fusion-sharing-box",
      ).length;
      const src = image.attr("src") || image.attr("data-src") || image.attr("data-orig-file") || "";
      const url = resolveAssetUrl(pageFile, src);
      const alt = normalizeWhitespace(image.attr("alt") || image.attr("title") || "");
      const width = Number.parseInt(image.attr("width") || "", 10) || undefined;
      const height = Number.parseInt(image.attr("height") || "", 10) || undefined;
      const className = image.attr("class") || "";

      if (isChromeImage || !url || skipImagePattern.test(`${url} ${alt} ${className}`)) return;
      if (width && width < 140) return;

      images.push({
        url,
        alt: alt || readableTitle(path.basename(url)),
        width,
        height,
      });
    });

  return unique(images.map((image) => image.url))
    .map((url) => images.find((image) => image.url === url))
    .slice(0, 8);
}

function chunkText(text) {
  const paragraphs = text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ0-9])/)
    .map(normalizeWhitespace)
    .filter((value) => value.length > 80);

  const chunks = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + " " + paragraph).length > 1200 && current.length > 220) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = normalizeWhitespace(`${current} ${paragraph}`);
    }
  }

  if (current.length > 120) chunks.push(current);
  return chunks.slice(0, 12);
}

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function extractPage(filePath) {
  const html = await readFile(filePath, "utf8");
  const $ = cheerio.load(html);
  const url = pageUrlFromFile(filePath);
  const title = readableTitle(
    $("meta[property='og:title']").attr("content") || $("title").first().text() || $("h1").first().text() || "",
  );
  const description = normalizeWhitespace(
    $("meta[name='description']").attr("content") || $("meta[property='og:description']").attr("content") || "",
  );
  const images = extractImages($, filePath);

  $("script, style, noscript, svg, iframe, form, nav, header, footer, .sidebar, .fusion-sharing-box").remove();

  const headings = unique(
    $("h1, h2, h3")
      .map((_, element) => normalizeWhitespace($(element).text()))
      .get(),
  ).slice(0, 30);
  const contentRoot = $("main, article, #main, .post-content, .entry-content, .fusion-post-content").first();
  const rawText = normalizeWhitespace((contentRoot.length ? contentRoot : $("body")).text());
  const text = rawText
    .replace(/Prejsť na obsah/gi, "")
    .replace(/Go to Top/gi, "")
    .replace(/Zdieľať tento článok/gi, "")
    .trim();

  if (text.length < 180) return null;

  const chunks = chunkText(text);
  return {
    url,
    slug: url.replace(origin, "").replace(/^\/|\/$/g, "") || "home",
    title,
    description,
    headings,
    tags: classifyPage(url, text, title),
    images,
    text: text.slice(0, 14000),
    chunks: chunks.map((content, index) => ({
      id: `${url}#chunk-${index + 1}`,
      content,
    })),
  };
}

async function main() {
  const rootStat = await stat(sourceRoot);
  if (!rootStat.isDirectory()) {
    throw new Error(`Archive site root does not exist: ${sourceRoot}`);
  }

  const files = await walk(sourceRoot);
  const htmlFiles = files
    .filter((file) => file.endsWith(".html"))
    .filter((file) => !normalizeUrlPath(file).includes("/wp-admin/"))
    .sort();
  const pages = [];

  for (const file of htmlFiles) {
    const page = await extractPage(file);
    if (page) pages.push(page);
  }

  const chunkCount = pages.reduce((sum, page) => sum + page.chunks.length, 0);
  const imageCount = pages.reduce((sum, page) => sum + page.images.length, 0);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        scrapedAt: new Date().toISOString(),
        source: origin,
        archiveSource: sourceRoot,
        pageCount: pages.length,
        chunkCount,
        imageCount,
        pages,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`Saved ${pages.length} pages, ${chunkCount} chunks and ${imageCount} images to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
