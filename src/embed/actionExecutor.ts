export type EmbedAction = {
  type: "navigate_and_highlight" | string;
  url?: string;
  selector?: string;
  highlightText?: string;
};

export const pendingActionKey = "arcigy_pending_action";

function log(message: string, detail?: unknown) {
  console.log(`[ArcigyChatbot] ${message}`, detail ?? "");
}

function normalizePath(pathname: string) {
  return pathname.replace(/\/$/, "") || "/";
}

function isCurrentUrl(url?: string) {
  if (!url) return true;

  const target = new URL(url, window.location.origin);
  const current = new URL(window.location.href);

  return target.origin === current.origin && normalizePath(target.pathname) === normalizePath(current.pathname);
}

function highlightElement(element: HTMLElement) {
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.classList.add("arcigy-chatbot-highlight");
  log("TARGET_FOUND", element);

  window.setTimeout(() => {
    element.classList.remove("arcigy-chatbot-highlight");
    log("HIGHLIGHT_DONE");
  }, 3000);
}

export function validateSelector(selector: string) {
  return Boolean(selector && document.querySelector(selector));
}

export function runAction(action: EmbedAction) {
  log("ACTION_STARTED", action);

  const selector = action.selector || "";
  const currentTarget = selector ? document.querySelector<HTMLElement>(selector) : null;

  if (currentTarget) {
    highlightElement(currentTarget);
    return;
  }

  if (action.url && !isCurrentUrl(action.url)) {
    sessionStorage.setItem(pendingActionKey, JSON.stringify(action));
    log("REDIRECTING", action.url);
    window.location.href = new URL(action.url, window.location.origin).toString();
    return;
  }

  log("TARGET_NOT_FOUND", selector);
}

export function runPendingAction() {
  const rawAction = sessionStorage.getItem(pendingActionKey);
  if (!rawAction) return;

  sessionStorage.removeItem(pendingActionKey);

  try {
    const action = JSON.parse(rawAction) as EmbedAction;
    window.setTimeout(() => runAction(action), 250);
  } catch {
    log("TARGET_NOT_FOUND", "invalid pending action");
  }
}
