# SABAI Decrypt

Chrome extension that decrypts BYOS-encrypted supplier names directly in your browser when viewing the Sabai365 web portal.

## Why an Extension?

When a BYOS customer's supplier names are stored encrypted in Sabai's database, they need to be decrypted for display. Baking decryption into the Sabai365 frontend would require the customer to trust that the frontend code isn't exfiltrating the key — and to re-verify this on every release.

This extension is a **small, standalone, auditable codebase** that a third party can review in full. Chrome's [isolated world](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#isolated_world) execution model guarantees that the page's JavaScript cannot access the extension's variables or `chrome.storage` — a hard security boundary enforced by the browser, not by Sabai's code.

**Your decryption key never leaves your machine.**

## How It Works

1. The Sabai365 backend prefixes encrypted supplier names with the marker `⌁ENC:` followed by the AES-256-GCM ciphertext (base64-encoded).
2. The extension's content script scans the page for this marker using a `TreeWalker` and a `MutationObserver` for dynamically rendered content.
3. Each encrypted token is decrypted in-place using the Web Crypto API with the key you configure.
4. The key is stored in `chrome.storage.local`, which is encrypted at rest by Chrome's profile encryption and inaccessible to page JavaScript.

## Encryption Details

| Parameter | Value |
|-----------|-------|
| Algorithm | AES-256-GCM |
| Key derivation | `SHA-256(SECRET_ENCRYPTION_KEY)` → 32-byte key |
| Wire format | `base64(12-byte IV ‖ ciphertext ‖ 16-byte auth tag)` |
| Prefix | `⌁ENC:` (U+2301 + `ENC:`) |

This matches the encryption in [BYOS `relay.ts`](https://github.com/sabai-group/byos/blob/main/src/relay.ts).

## Installation

### From Source (Recommended for Audit)

```bash
git clone https://github.com/sabai-group/sabai-decrypt.git
cd sabai-decrypt
npm install
npm run build
```

Then load the `dist/` folder as an unpacked extension:

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `dist/` directory

### Configuration

1. Click the SABAI Decrypt icon in the Chrome toolbar
2. Enter your `SECRET_ENCRYPTION_KEY` (the same key configured in your BYOS instance)
3. Click **Save Key**
4. Reload the Sabai365 tab — encrypted supplier names will be decrypted automatically

## Development

```bash
npm install
npm run watch    # Rebuild on file changes
```

Load `dist/` as an unpacked extension and reload after changes.

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
