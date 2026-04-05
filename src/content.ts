import { decrypt, hasPrefix, extractTokens, clearKeyCache, PREFIX } from "./crypto";

let secret: string | null = null;

// Nodes currently being processed — prevents re-entrant scanning from
// MutationObserver firing on our own text replacements.
const processing = new WeakSet<Node>();

async function decryptTextNode(node: Text): Promise<void> {
  if (!secret || !node.textContent || !hasPrefix(node.textContent)) return;
  if (processing.has(node)) return;
  processing.add(node);

  const tokens = extractTokens(node.textContent);
  if (tokens.length === 0) return;

  let text = node.textContent;
  // Process in reverse so indices stay valid
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    try {
      const plain = await decrypt(secret, token.ciphertext);
      text = text.slice(0, token.start) + plain + text.slice(token.end);
    } catch {
      // Wrong key or corrupted ciphertext — leave the token as-is
    }
  }
  if (text !== node.textContent) {
    node.textContent = text;
  }
}

function collectTextNodes(root: Node): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current: Node | null;
  while ((current = walker.nextNode())) {
    if (current.textContent && hasPrefix(current.textContent)) {
      nodes.push(current as Text);
    }
  }
  return nodes;
}

async function scanSubtree(root: Node): Promise<void> {
  if (!secret) return;
  // Check if root itself is a text node
  if (root.nodeType === Node.TEXT_NODE) {
    await decryptTextNode(root as Text);
    return;
  }
  const nodes = collectTextNodes(root);
  await Promise.all(nodes.map(decryptTextNode));
}

async function scanFullPage(): Promise<void> {
  await scanSubtree(document.body);
}

// --- MutationObserver with requestAnimationFrame debouncing ---

let pendingNodes: Node[] = [];
let rafScheduled = false;

function flushPending(): void {
  rafScheduled = false;
  const batch = pendingNodes;
  pendingNodes = [];
  for (const node of batch) {
    scanSubtree(node);
  }
}

const observer = new MutationObserver((mutations) => {
  if (!secret) return;
  for (const m of mutations) {
    if (m.type === "childList") {
      for (const added of m.addedNodes) {
        pendingNodes.push(added);
      }
    } else if (m.type === "characterData" && m.target.textContent && hasPrefix(m.target.textContent)) {
      pendingNodes.push(m.target);
    }
  }
  if (pendingNodes.length > 0 && !rafScheduled) {
    rafScheduled = true;
    requestAnimationFrame(flushPending);
  }
});

// --- Decrypt <input> and <select> values that the TreeWalker misses ---

async function decryptFormValues(root: Node): Promise<void> {
  if (!secret) return;
  const container = root.nodeType === Node.ELEMENT_NODE ? (root as Element) : document.body;
  const inputs = container.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    "input, select, textarea, [value]",
  );
  for (const el of inputs) {
    if ("value" in el && typeof el.value === "string" && hasPrefix(el.value)) {
      const tokens = extractTokens(el.value);
      let val = el.value;
      for (let i = tokens.length - 1; i >= 0; i--) {
        try {
          const plain = await decrypt(secret, tokens[i].ciphertext);
          val = val.slice(0, tokens[i].start) + plain + val.slice(tokens[i].end);
        } catch { /* skip */ }
      }
      if (val !== el.value) el.value = val;
    }
    // Also handle <option> text inside <select>
    if (el instanceof HTMLSelectElement) {
      for (const opt of el.options) {
        if (hasPrefix(opt.textContent ?? "")) {
          const tokens = extractTokens(opt.textContent!);
          let t = opt.textContent!;
          for (let i = tokens.length - 1; i >= 0; i--) {
            try {
              const plain = await decrypt(secret, tokens[i].ciphertext);
              t = t.slice(0, tokens[i].start) + plain + t.slice(tokens[i].end);
            } catch { /* skip */ }
          }
          if (t !== opt.textContent) opt.textContent = t;
        }
      }
    }
  }
}

// --- Title attribute decryption ---

async function decryptTitleAttributes(root: Node): Promise<void> {
  if (!secret) return;
  const container = root.nodeType === Node.ELEMENT_NODE ? (root as Element) : document.body;
  const els = container.querySelectorAll("[title]");
  for (const el of els) {
    const title = el.getAttribute("title") ?? "";
    if (!hasPrefix(title)) continue;
    const tokens = extractTokens(title);
    let t = title;
    for (let i = tokens.length - 1; i >= 0; i--) {
      try {
        const plain = await decrypt(secret, tokens[i].ciphertext);
        t = t.slice(0, tokens[i].start) + plain + t.slice(tokens[i].end);
      } catch { /* skip */ }
    }
    if (t !== title) el.setAttribute("title", t);
  }
}

// --- Lifecycle ---

async function init(): Promise<void> {
  const data = await chrome.storage.local.get("sabaiDecryptKey");
  secret = data.sabaiDecryptKey ?? null;
  if (!secret) return;

  await scanFullPage();
  await decryptFormValues(document.body);
  await decryptTitleAttributes(document.body);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

// Listen for key changes from the popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "sabai-decrypt-key-updated") {
    clearKeyCache();
    secret = message.key ?? null;
    if (secret) {
      scanFullPage();
      decryptFormValues(document.body);
      decryptTitleAttributes(document.body);
    }
  }
});

init();
