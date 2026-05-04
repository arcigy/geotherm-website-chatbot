import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const actionsPath = path.join(root, "src/data/geotherm-entities/page-actions.json");
const actions = JSON.parse(fs.readFileSync(actionsPath, "utf8"));

function localPageForUrl(url) {
  const parsed = new URL(url, "http://localhost");
  const cleanPath = parsed.pathname.replace(/\/$/, "") || "/";

  if (cleanPath === "/") return path.join(root, "src/app/page.tsx");

  const pagePath = path.join(root, "src/app", cleanPath.slice(1), "page.tsx");
  return fs.existsSync(pagePath) ? pagePath : null;
}

function hasAnchor(pageSource, anchorId) {
  const escaped = anchorId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\bid=["'\`]${escaped}["'\`]`).test(pageSource);
}

function selectorHasTarget(pageSource, selector, anchorId) {
  if (anchorId && hasAnchor(pageSource, anchorId)) return true;
  if (selector?.startsWith("#")) return hasAnchor(pageSource, selector.slice(1));
  return selector ? pageSource.includes(selector) : false;
}

let verified = 0;
let externalUnverified = 0;

for (const action of actions) {
  assert.ok(action.id, "action must have id");
  assert.ok(action.label, `${action.id} must have label`);
  assert.ok(action.type, `${action.id} must have type`);
  assert.ok(action.url, `${action.id} must have url`);

  if (["scroll_to", "highlight_section"].includes(action.type)) {
    assert.ok(action.selector || action.anchorId, `${action.id} must have selector or anchorId`);
  }

  const localPage = localPageForUrl(action.url);

  if (!localPage) {
    assert.equal(
      action.external_unverified,
      true,
      `${action.id} points outside local app and must be external_unverified`,
    );
    externalUnverified += 1;
    continue;
  }

  const pageSource = fs.readFileSync(localPage, "utf8");
  assert.equal(
    selectorHasTarget(pageSource, action.selector, action.anchorId),
    true,
    `${action.id} target ${action.selector || action.anchorId} not found in ${path.relative(root, localPage)}`,
  );
  verified += 1;
}

console.log(`PASS geotherm actions: ${actions.length} total, ${verified} verified, ${externalUnverified} external_unverified`);
