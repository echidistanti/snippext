# Snippext

**A silent, local text expander for Chrome. No UI injection. No AI. No cloud.**

---

## What it does

Snippext lets you define short keywords that automatically expand into longer strings whenever you type them in any text field in Chrome. Type `@@` and it becomes `example@email.com`. Type `;addr` and it becomes your full address. The expansion happens instantly and invisibly — no popup, no suggestion box, no autocomplete overlay.

It works in any editable element on any page: standard `<input>` and `<textarea>` fields, as well as `contenteditable` elements like Gmail, Notion, Google Docs, and similar web apps.

---

## How it works

### Text expansion (content.js)

A lightweight content script runs on every page you visit. It listens to keyboard events using a capture-phase `keyup` listener — meaning it intercepts input before the page itself processes it. On each keystroke, it reads the text immediately before the cursor and checks whether it ends with any of your defined keywords. If a match is found, the keyword is silently replaced with its corresponding expansion in place, without any visual feedback or intermediate state.

For standard inputs and textareas, the replacement is done by directly manipulating `element.value` and repositioning the cursor. For `contenteditable` elements, it uses the browser's Selection and Range APIs to delete the keyword and insert the expanded text as a text node. In both cases, the appropriate `input` and `change` events are dispatched so the host page remains aware of the change (important for frameworks like React or Vue that rely on synthetic events).

All snippet data is loaded once on page load from `chrome.storage.local` and kept in memory. A storage change listener keeps it in sync if you add or delete snippets while the page is open.

### Control panel (popup.html + popup.js)

Clicking the extension icon opens a popup with a minimal dark-themed interface. From here you can:

- **Add a snippet** — enter a keyword (e.g. `@@mail`) and the text it should expand to (e.g. `example@email.com`), then press Enter or click the `+` button. Tab moves focus between the two fields.
- **Edit a snippet** — click on any snippet in the list to enter edit mode, modify the keyword or expansion, then save or cancel.
- **Delete a snippet** — click the `×` button on any row in the list.
- **Filter snippets** — a search field appears automatically once you have more than four snippets, letting you filter by keyword or expansion text.
- **Export to JSON** — the "export JSON" button in the footer downloads all your snippets as a plain `.json` file, useful for backup or transfer.
- **Import from JSON** — the "import JSON" button in the footer allows you to select a `.json` file to import snippets, merging them with existing ones (overwriting duplicates).

Snippets are stored entirely in `chrome.storage.local` — local to your browser profile, never synced to any server.

---

## File structure

```
snippext/
├── manifest.json     # Extension manifest (Manifest V3)
├── content.js        # Text expansion logic, injected into every page
├── popup.html        # Control panel markup and styles
├── popup.js          # Control panel logic
├── LICENSE          # MIT license text
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Installation

1. Download and unzip the extension folder.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `snippext` folder.
5. The extension icon will appear in your toolbar.

---

## Permissions

| Permission | Why |
|---|---|
| `storage` | To save and retrieve your snippets locally |
| `content_scripts` on `<all_urls>` | To enable text expansion on any page you visit |

No network requests are made. No data leaves your machine. The extension has no background service worker and no persistent process beyond the content script that runs while a tab is open.

---

## Defining good keywords

Keywords work best when they are short, unlikely to appear naturally in text, and easy to type quickly. Common conventions:

- Prefix with a symbol: `@@mail`, `;;addr`, `//sig`
- Use doubled letters: `mmail`, `aaddr`
- Use a personal prefix: `em.mail`, `em.phone`

Avoid keywords that are common English words or letter combinations, as they will trigger unexpectedly mid-sentence.

---

## Limitations

- Snippext does not support **multi-step expansion**, **cursor placement tokens**, or **dynamic variables** (e.g. today's date). It performs a simple string replacement.
- It does not work in **native desktop inputs** outside of Chrome (for system-wide expansion, consider [Espanso](https://espanso.org)).
- In some heavily sandboxed `<iframe>` elements, the content script may not have access depending on the frame's origin policy.

---

## Design philosophy

Snippext was built as a deliberate response to the feature creep in modern text expander tools: no toolbar injected into pages, no floating icon attached to input fields, no background sync process, no AI-driven suggestions, no account required. It does one thing — replaces a keyword with a string — and stays completely invisible while doing it.
