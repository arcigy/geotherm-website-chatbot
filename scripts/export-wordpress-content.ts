import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

type WpRenderedValue = {
  rendered?: string;
};

type WpItem = {
  id?: number;
  slug?: string;
  link?: string;
  modified?: string;
  title?: WpRenderedValue;
  content?: WpRenderedValue;
};

type ExportSection = {
  heading: string;
  level: "h1" | "h2" | "h3";
  text: string;
};

type ExportItem = {
  type: "page" | "post";
  id: number;
  title: string;
  slug: string;
  url: string;
  modified: string;
  rawRenderedHtml: string;
  cleanText: string;
  sections: ExportSection[];
};

const outputPath = path.join(process.cwd(), "knowledge", "wordpress-export.json");

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function removeShortcodeNoise(value: string): string {
  return value
    .replace(/\[(\/)?(?:vc_|et_|fusion_|av_|wp_|elementor_|contact-form-7|rev_slider|slider|gallery)[^\]]*\]/gi, " ")
    .replace(/\[[a-z][a-z0-9_-]*(?:\s+[^\]]*)?\]\s*\[\/[a-z][a-z0-9_-]*\]/gi, " ")
    .replace(/\[\/?[a-z][a-z0-9_-]*(?:\s+[^\]]*)?\]/gi, " ");
}

function loadCleanHtml(html: string): cheerio.CheerioAPI {
  const $ = cheerio.load(html);
  $("script, style, noscript, template, svg, iframe").remove();
  $(
    [
      ".elementor-hidden",
      ".screen-reader-text",
      ".sr-only",
      ".skip-link",
      ".fusion-sharing-box",
      ".sharedaddy",
      ".jp-relatedposts",
      ".wp-block-social-links",
    ].join(","),
  ).remove();
  return $;
}

function cleanTextFromHtml(html: string): string {
  const $ = loadCleanHtml(html);
  return normalizeWhitespace(removeShortcodeNoise($.root().text()));
}

function extractSections(html: string, fallbackHeading: string): ExportSection[] {
  const $ = loadCleanHtml(html);
  const body = $("body").length ? $("body") : $("html");
  const sections: ExportSection[] = [];
  let current: ExportSection | null = null;

  function appendText(text: string): void {
    const clean = normalizeWhitespace(removeShortcodeNoise(text));
    if (!clean) return;

    if (!current) {
      current = {
        heading: fallbackHeading || "Content",
        level: "h1",
        text: "",
      };
      sections.push(current);
    }

    current.text = normalizeWhitespace(`${current.text} ${clean}`);
  }

  body.find("h1, h2, h3, p, li, blockquote, td, th").each((_, element) => {
    const node = $(element);
    const tagName = element.tagName.toLowerCase();
    const text = node.text();

    if (tagName === "h1" || tagName === "h2" || tagName === "h3") {
      const heading = normalizeWhitespace(removeShortcodeNoise(text));
      if (!heading) return;

      current = {
        heading,
        level: tagName,
        text: "",
      };
      sections.push(current);
      return;
    }

    appendText(text);
  });

  return sections
    .map((section) => ({
      ...section,
      text: normalizeWhitespace(section.text),
    }))
    .filter((section) => section.heading || section.text);
}

function decodeRenderedTitle(renderedTitle = ""): string {
  return cleanTextFromHtml(renderedTitle);
}

function endpointUrl(siteUrl: URL, type: "pages" | "posts", page: number): string {
  const url = new URL(`/wp-json/wp/v2/${type}`, siteUrl);
  url.searchParams.set("per_page", "100");
  url.searchParams.set("page", String(page));
  return url.toString();
}

async function fetchWordPressPage(url: string): Promise<{ items: WpItem[]; totalPages: number } | null> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.warn(`Warning: WordPress REST request failed (${response.status} ${response.statusText}): ${url}`);
      return null;
    }

    const totalPagesHeader = response.headers.get("x-wp-totalpages");
    const totalPages = Math.max(Number.parseInt(totalPagesHeader || "1", 10) || 1, 1);
    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      console.warn(`Warning: WordPress REST response was not a list: ${url}`);
      return null;
    }

    return {
      items: data as WpItem[],
      totalPages,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: WordPress REST request could not be completed: ${url}`);
    console.warn(`Reason: ${message}`);
    return null;
  }
}

async function fetchAll(siteUrl: URL, type: "page" | "post"): Promise<ExportItem[]> {
  const endpointType = type === "page" ? "pages" : "posts";
  const exported: ExportItem[] = [];
  let totalPages = 1;

  for (let page = 1; page <= totalPages; page += 1) {
    const result = await fetchWordPressPage(endpointUrl(siteUrl, endpointType, page));
    if (!result) continue;

    totalPages = result.totalPages;

    for (const item of result.items) {
      if (typeof item.id !== "number") continue;

      const rawRenderedHtml = item.content?.rendered || "";
      const title = decodeRenderedTitle(item.title?.rendered || "");
      const cleanText = cleanTextFromHtml(rawRenderedHtml);

      exported.push({
        type,
        id: item.id,
        title,
        slug: item.slug || "",
        url: item.link || "",
        modified: item.modified || "",
        rawRenderedHtml,
        cleanText,
        sections: extractSections(rawRenderedHtml, title),
      });
    }
  }

  return exported;
}

function getSiteUrl(): URL {
  const value = process.env.WP_SITE_URL;
  if (!value) {
    throw new Error("WP_SITE_URL is required. Example: $env:WP_SITE_URL=\"https://example.com\"");
  }

  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("WP_SITE_URL must start with http:// or https://");
  }

  return url;
}

async function main(): Promise<void> {
  let siteUrl: URL;

  try {
    siteUrl = getSiteUrl();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
    return;
  }

  const [pages, posts] = await Promise.all([fetchAll(siteUrl, "page"), fetchAll(siteUrl, "post")]);
  const exported = [...pages, ...posts];

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(exported, null, 2)}\n`, "utf8");

  if (exported.length === 0) {
    console.warn("Warning: no public WordPress pages or posts were exported. The REST API may be unavailable or empty.");
  }

  console.log(`Saved ${exported.length} WordPress items to ${outputPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Exporter failed: ${message}`);
  process.exitCode = 1;
});
