# Installing SABAI Decrypt

This guide walks you through installing the SABAI Decrypt Chrome extension. It takes about 5 minutes and you don't need any technical background — just follow the steps in order.

**What this extension does:** it reads the scrambled supplier and buyer names on Sabai365 (and in Sabai365 alert emails inside Gmail) and shows you the real names. The "key" that unscrambles them is stored only on your computer — Sabai never sees it.

**You'll need:**
- Google Chrome (any recent version)
- The decryption key your Sabai contact gave you (a long random string)

---

## Step 1 — Download the extension

1. Open the [latest release page](https://github.com/sabai-group/sabai-decrypt/releases/latest).
2. Under **Assets**, click the file named `sabai-decrypt-vX.Y.Z.zip` (the `X.Y.Z` will be a version number like `1.0.0`). It will download to your computer.

## Step 2 — Unzip it somewhere permanent

Find the downloaded `.zip` file (usually in your **Downloads** folder) and **double-click it to unzip**. This creates a folder called `sabai-decrypt-vX.Y.Z`.

> **Important:** move that folder somewhere you won't accidentally delete it — for example, your **Documents** folder. Chrome reads the extension from this folder every time it starts, so if you delete or move it later, the extension will stop working.

## Step 3 — Open Chrome's extensions page

In a new Chrome tab, copy and paste this into the address bar and press Enter:

```
chrome://extensions
```

(Chrome doesn't allow these links to be clicked directly — you have to paste them.)

## Step 4 — Turn on Developer mode and load the extension

On the extensions page:

1. **Turn on Developer mode** using the toggle in the top-right corner (highlighted in green below).
2. Three new buttons will appear in the top-left. Click **Load unpacked** (highlighted in orange).

![Chrome extensions page with Developer mode and Load unpacked highlighted](docs/images/extensions-page.png)

3. A file picker will open. Find the **`sabai-decrypt-vX.Y.Z` folder you unzipped in Step 2**, select it, and click **Open** (or **Select Folder** on Windows).

You should now see a card titled **SABAI Decrypt** on the page. The extension is installed.

## Step 5 — Pin the extension to your toolbar

So you can find it easily:

1. Click the **puzzle-piece icon** in the top-right of the Chrome toolbar.
2. Find **SABAI Decrypt** in the list.
3. Click the **pin icon** next to it (highlighted in green below).

![Pinning an extension to the Chrome toolbar](docs/images/pin-extension.png)

A small icon for SABAI Decrypt will now stay visible in your toolbar.

## Step 6 — Enter your decryption key

1. Click the **SABAI Decrypt** icon in the toolbar. A small popup appears.
2. Paste the decryption key your Sabai contact gave you into the input field.
3. Click **Save Key**.
4. Open or refresh any Sabai365 page (or Gmail tab with a Sabai365 alert email). The supplier and buyer names will now appear in plain text instead of as scrambled `⌁ENC:...` strings.

That's it — you're done.

---

## Updating to a new version

When a new version is released:

1. Download the new `sabai-decrypt-vX.Y.Z.zip` from the [Releases page](https://github.com/sabai-group/sabai-decrypt/releases).
2. Unzip it and **replace the contents of your existing extension folder** with the new files (or just delete the old folder and use the new one — but you'll need to redo Step 4 if you do that).
3. Go back to `chrome://extensions/` and click the small **circular reload arrow** on the SABAI Decrypt card (highlighted in green below).

![Reload icon on the extensions page](docs/images/reload-extension.png)

Your saved decryption key is preserved, so you don't need to enter it again.

---

## Troubleshooting

**The extension card shows an error or doesn't appear**
Make sure you selected the folder that contains `manifest.json` directly — not the `.zip` file itself, and not a folder containing the unzipped folder.

**Names still look like `⌁ENC:abc123...`**
- Check that you saved your key in the popup (Step 6) — the popup will show "Key saved" when it worked.
- Refresh the page after saving the key.
- Confirm the key matches the one used to encrypt the data. If it doesn't match, decryption fails silently and the encrypted text stays as-is.

**Chrome warns me about "Developer mode extensions"**
This is normal. Chrome shows that warning whenever you have any unpacked extension installed. The extension is open source and the code is published at [github.com/sabai-group/sabai-decrypt](https://github.com/sabai-group/sabai-decrypt) — feel free to share it with your IT/security team for review.

**It stopped working after restarting Chrome**
You probably moved or deleted the unzipped folder. Move it back, or repeat Step 4 with its new location.

---

## Why am I installing it this way instead of from the Chrome Web Store?

This extension is intentionally distributed outside the Chrome Web Store so the source code stays small, reviewable, and verifiably identical to what runs in your browser. The release `.zip` you just installed was built automatically from the [tagged source code on GitHub](https://github.com/sabai-group/sabai-decrypt/releases) by a public build script — anyone can reproduce it byte-for-byte.

> Screenshots in this guide are from the [Chrome for Developers documentation](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world), used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
