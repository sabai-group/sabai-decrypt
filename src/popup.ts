const keyInput = document.getElementById("key-input") as HTMLInputElement;
const btnSave = document.getElementById("btn-save") as HTMLButtonElement;
const btnClear = document.getElementById("btn-clear") as HTMLButtonElement;
const toggleVis = document.getElementById("toggle-vis") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const statusText = document.getElementById("status-text") as HTMLSpanElement;
const toast = document.getElementById("toast") as HTMLDivElement;

function setStatus(configured: boolean): void {
  statusEl.className = `status ${configured ? "configured" : "not-configured"}`;
  statusText.textContent = configured ? "Key configured" : "No key configured";
}

function showToast(msg: string): void {
  toast.textContent = msg;
  toast.className = "toast success";
  setTimeout(() => {
    toast.className = "toast";
  }, 2000);
}

async function notifyContentScripts(key: string | null): Promise<void> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  for (const tab of tabs) {
    if (tab.id != null) {
      chrome.tabs.sendMessage(tab.id, {
        type: "sabai-decrypt-key-updated",
        key,
      }).catch(() => {
        // Tab may not have the content script loaded
      });
    }
  }
}

// Load current state
chrome.storage.local.get("sabaiDecryptKey").then((data) => {
  const saved = data.sabaiDecryptKey ?? "";
  setStatus(saved.length > 0);
});

// Toggle password visibility
toggleVis.addEventListener("click", () => {
  const showing = keyInput.type === "text";
  keyInput.type = showing ? "password" : "text";
  toggleVis.textContent = showing ? "\u{1F441}" : "\u{1F441}\u{200D}\u{1F5E8}";
});

// Save
btnSave.addEventListener("click", async () => {
  const key = keyInput.value.trim();
  if (!key) return;
  await chrome.storage.local.set({ sabaiDecryptKey: key });
  setStatus(true);
  keyInput.value = "";
  showToast("Key saved — reload the Sabai365 tab to decrypt");
  await notifyContentScripts(key);
});

// Clear
btnClear.addEventListener("click", async () => {
  await chrome.storage.local.remove("sabaiDecryptKey");
  setStatus(false);
  keyInput.value = "";
  showToast("Key cleared");
  await notifyContentScripts(null);
});

// Enter key to save
keyInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnSave.click();
});
