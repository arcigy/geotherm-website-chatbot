import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Browser, type ConsoleMessage } from "playwright";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import { startChatServer } from "./chat-server";

const reportPath = path.join(process.cwd(), "knowledge", "embed-ui-test-report.md");
const screenshotPath = path.join(process.cwd(), "knowledge", "embed-ui-test-screenshot.png");
const apiUrl = "http://127.0.0.1:4317";
const previewUrl = "http://127.0.0.1:4321/embed-preview.html";

async function startPreviewServer(): Promise<ViteDevServer> {
  const server = await createViteServer({
    root: path.join(process.cwd(), "dist-embed"),
    appType: "mpa",
    logLevel: "silent",
    server: {
      host: "127.0.0.1",
      port: 4321,
      strictPort: true,
    },
  });
  await server.listen();
  return server;
}

async function main(): Promise<void> {
  const api = await startChatServer({ port: 4317, host: "127.0.0.1" });
  const preview = await startPreviewServer();
  const consoleErrors: string[] = [];
  let widgetLoaded = false;
  let apiCallCount = 0;
  let firstAnswer = "";
  let fallbackAnswer = "";
  let screenshotWritten = false;
  let browser: Browser | null = null;
  let failureError = "";

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

    page.on("console", (message: ConsoleMessage) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url() === `${apiUrl}/chat`) apiCallCount += 1;
    });

    await page.goto(previewUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".arcigy-chatbot", { state: "attached", timeout: 10_000 });
    const textarea = page.locator(".arcigy-chatbot__input textarea");
    await textarea.waitFor({ state: "visible", timeout: 10_000 });
    widgetLoaded = true;

    await textarea.fill("aké hlučné je NIBE");
    await Promise.all([
      page.waitForResponse((response) => response.url() === `${apiUrl}/chat` && response.request().method() === "POST"),
      page.locator(".arcigy-chatbot__send").click(),
    ]);
    await page.waitForFunction(
      () => {
        const messages = document.querySelectorAll<HTMLElement>(".arcigy-chatbot__message.is-assistant");
        const last = messages[messages.length - 1];
        return Boolean(last && last.innerText.length > 160 && (last.innerText.includes("Podľa nájdených informácií") || last.innerText.includes("NIBE")));
      },
      undefined,
      { timeout: 20_000 },
    );
    firstAnswer = await page.locator(".arcigy-chatbot__message.is-assistant").last().innerText();

    await textarea.fill("aké je počasie");
    await Promise.all([
      page.waitForResponse((response) => response.url() === `${apiUrl}/chat` && response.request().method() === "POST"),
      page.locator(".arcigy-chatbot__send").click(),
    ]);
    await page.waitForFunction(
      () => {
        const messages = document.querySelectorAll<HTMLElement>(".arcigy-chatbot__message.is-assistant");
        const last = messages[messages.length - 1];
        return Boolean(last && last.innerText.includes("nenašiel dostatočne jasnú odpoveď") && last.innerText.includes("Skúste sa opýtať"));
      },
      undefined,
      { timeout: 20_000 },
    );
    fallbackAnswer = await page.locator(".arcigy-chatbot__message.is-assistant").last().innerText();

    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    screenshotWritten = true;

  } catch (error) {
    failureError = error instanceof Error ? error.message : String(error);
  } finally {
    if (browser) await browser.close().catch(() => undefined);
    await preview.close();
    await new Promise<void>((resolve, reject) => {
      api.close((error) => (error ? reject(error) : resolve()));
    });
  }

  const apiCallsPassed = apiCallCount >= 2;
  const firstAnswerPassed = /NIBE|hluč|hluk|tich/i.test(firstAnswer);
  const fallbackPassed = fallbackAnswer.includes("nenašiel dostatočne jasnú odpoveď");
  const passed = !failureError && widgetLoaded && apiCallsPassed && firstAnswerPassed && fallbackPassed && consoleErrors.length === 0;
  const report = [
    "# Embed UI Test Report",
    "",
    `Preview URL: \`${previewUrl}\``,
    `API base: \`${apiUrl}\``,
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- widget loaded: ${widgetLoaded ? "yes" : "no"}`,
    `- POST /chat calls: ${apiCallCount}`,
    `- first answer rendered: ${firstAnswerPassed ? "yes" : "no"}`,
    `- fallback worked: ${fallbackPassed ? "yes" : "no"}`,
    `- console errors: ${consoleErrors.length}`,
    `- test error: ${failureError || "none"}`,
    `- screenshot: ${screenshotWritten ? screenshotPath : "not captured"}`,
    `- verdict: ${passed ? "PASS" : "NEEDS WORK"}`,
    "",
    "## First Query",
    "",
    "Query: `aké hlučné je NIBE`",
    "",
    firstAnswer || "No answer captured.",
    "",
    "## Fallback Query",
    "",
    "Query: `aké je počasie`",
    "",
    fallbackAnswer || "No fallback answer captured.",
    "",
    "## Console Errors",
    "",
    consoleErrors.length ? consoleErrors.map((error) => `- ${error}`).join("\n") : "None.",
    "",
  ].join("\n");

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, report, "utf8");
  console.log(`Embed UI test ${passed ? "PASS" : "NEEDS WORK"}`);
  console.log(`POST /chat calls: ${apiCallCount}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`Saved ${reportPath}`);

  if (!passed) process.exitCode = 1;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Embed UI test failed: ${message}`);
  process.exitCode = 1;
});
