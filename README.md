# SABAI Decrypt

Chrome extension that decrypts BYOS-encrypted **supplier and buyer names** directly in your browser — both on the Sabai365 web portal and inside Gmail alert emails sent by Sabai365.

## Why an Extension?

When a BYOS customer's supplier and buyer names are stored encrypted in Sabai's database, they need to be decrypted for display. Baking decryption into the Sabai365 frontend would require the customer to trust that the frontend code isn't exfiltrating the key — and to re-verify this on every release.

This extension is a **small, standalone, auditable codebase** that a third party can review in full. Chrome's [isolated world](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#isolated_world) execution model guarantees that the page's JavaScript cannot access the extension's variables or `chrome.storage` — a hard security boundary enforced by the browser, not by Sabai's code.

**Your decryption key never leaves your machine.**

## How It Works

1. The Sabai365 backend prefixes encrypted names (suppliers and buyers) with the marker `⌁ENC:` followed by the AES-256-GCM ciphertext (base64-encoded).
2. The extension's content script scans the page for this marker using a `TreeWalker` and a `MutationObserver` for dynamically rendered content.
3. Each encrypted token is decrypted in-place using the Web Crypto API with the key you configure.
4. The key is stored in `chrome.storage.local`, which is encrypted at rest by Chrome's profile encryption and inaccessible to page JavaScript.

The same prefix is used for both supplier and buyer names — the extension treats them uniformly, since the trust boundary (the encryption key) is the same.

## Encryption Details

| Parameter | Value |
|-----------|-------|
| Algorithm | AES-256-GCM |
| Key derivation | `SHA-256(SECRET_ENCRYPTION_KEY)` → 32-byte key |
| Wire format | `base64(12-byte IV ‖ ciphertext ‖ 16-byte auth tag)` |
| Prefix | `⌁ENC:` (U+2301 + `ENC:`) |

This matches the encryption in [BYOS `relay.ts`](https://github.com/sabai-group/byos/blob/main/src/relay.ts).

## Installation

- **End users:** follow the step-by-step guide in **[INSTALL.md](INSTALL.md)** — download the latest release zip, load it as an unpacked extension, paste in your key. No command line required.
- **Auditors and developers:** see [Build from source](#build-from-source) below.

Both paths produce the same Chrome MV3 extension; the release zip is built by [`.github/workflows/release.yml`](.github/workflows/release.yml) directly from a tagged commit, so its contents are exactly reproducible from source.

### Build from source

```bash
git clone https://github.com/sabai-group/sabai-decrypt.git
cd sabai-decrypt
npm install
npm run package
```

This produces a loadable folder at `dist/`. Then in Chrome:

1. Go to `chrome://extensions/`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select the `dist/` folder.
4. Click the extension's toolbar icon, paste your `SECRET_ENCRYPTION_KEY`, click **Save Key**.

To rebuild after editing source, run `npm run package` and click the reload icon on the extension's card in `chrome://extensions/`.

## Supported origins

The extension only runs on origins listed under `content_scripts[0].matches` in [`manifest.json`](manifest.json):

- `https://*.sabai365.ai/*`
- `https://365.sabai.group/*`
- `http://localhost:5173/*` (Vite dev server)
- `https://mail.google.com/*` (so encrypted names in Sabai365 alert emails are decrypted in Gmail)

If your deployment uses a different host, fork the repo, add it to `matches`, and rebuild.

### A note on Gmail

The extension runs in Chrome's isolated world on Gmail just like it does on Sabai365 — it cannot be observed or interfered with by Gmail's own JavaScript, and your decryption key remains inaccessible to any page script. The content script only modifies text nodes that actually contain the `⌁ENC:` prefix; all other email content is left untouched. Because Gmail re-renders aggressively when switching threads, the `MutationObserver` re-runs the prefix scan on newly added subtrees only, which keeps the cost negligible.

## Development

```bash
npm install
npm run watch    # Rebuild on file changes
```

After a rebuild, click **Reload** on the extension in `chrome://extensions/`.

## Releasing a new version

Releases are built and published by [`.github/workflows/release.yml`](.github/workflows/release.yml) whenever a `vX.Y.Z` tag is pushed.

1. Bump the `version` field in [`manifest.json`](manifest.json) (and `package.json` if you want to keep them in sync).
2. Commit and push to `main`.
3. Tag and push:
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```
4. The workflow will build the extension, zip `dist/` as `sabai-decrypt-v1.2.3.zip`, and create a GitHub Release with that asset attached. The job fails if the tag and `manifest.json` versions disagree.

## Auditing This Extension

The entire decryption logic lives in four files:

| File | Purpose |
|------|---------|
| `src/crypto.ts` | AES-256-GCM decryption via Web Crypto API |
| `src/content.ts` | DOM scanning and in-place text replacement |
| `src/popup.ts` | Key configuration UI |
| `manifest.json` | Extension permissions (only `storage`) |

The extension requests **no network permissions**. It cannot make HTTP requests, so the key cannot be transmitted anywhere. The only permission is `storage` (for saving the key locally).

## License

MIT
