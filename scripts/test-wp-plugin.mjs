import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pluginDir = path.join(root, "arcigy-chatbot-plugin");
const requiredFiles = [
  "arcigy-chatbot-plugin.php",
  "includes/class-rest.php",
  "includes/class-admin.php",
  "assets/chatbot.js",
  "assets/chatbot.css",
];

for (const relativePath of requiredFiles) {
  assert.equal(fs.existsSync(path.join(pluginDir, relativePath)), true, `${relativePath} is missing`);
}

const mainPlugin = fs.readFileSync(path.join(pluginDir, "arcigy-chatbot-plugin.php"), "utf8");
const restClass = fs.readFileSync(path.join(pluginDir, "includes/class-rest.php"), "utf8");
const adminClass = fs.readFileSync(path.join(pluginDir, "includes/class-admin.php"), "utf8");
const widgetJs = fs.readFileSync(path.join(pluginDir, "assets/chatbot.js"), "utf8");
const widgetCss = fs.readFileSync(path.join(pluginDir, "assets/chatbot.css"), "utf8");

assert.match(mainPlugin, /wp_enqueue_script\(/, "plugin must enqueue script");
assert.match(mainPlugin, /wp_enqueue_style\(/, "plugin must enqueue style");
assert.match(mainPlugin, /arcigy-chatbot-root/, "plugin must render root element");
assert.match(mainPlugin, /wp_localize_script\(/, "plugin must localize frontend config");

assert.match(restClass, /arcigy-chatbot\/v1/, "REST namespace missing");
assert.match(restClass, /\/message/, "message route missing");
assert.match(restClass, /wp_verify_nonce/, "REST nonce verification missing");
assert.match(restClass, /external_backend_url/, "external backend forwarding missing");
assert.doesNotMatch(widgetJs, /api_key/i, "API key must not be bundled into frontend JavaScript");

assert.match(adminClass, /Arcigy Chatbot/, "admin page missing");
assert.match(adminClass, /show_on_all_pages/, "show on all pages setting missing");

assert.match(widgetJs, /ACTION_STARTED/, "action executor log missing");
assert.match(widgetJs, /REDIRECTING/, "redirect log missing");
assert.match(widgetJs, /TARGET_FOUND/, "target found log missing");
assert.match(widgetJs, /TARGET_NOT_FOUND/, "target not found log missing");
assert.match(widgetJs, /HIGHLIGHT_DONE/, "highlight done log missing");
assert.match(widgetCss, /#arcigy-chatbot-root/, "widget CSS must be scoped to root");

console.log("PASS WordPress plugin structure and built assets");
