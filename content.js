// Snippext content script
// Zero UI injection. Listens for keystrokes, expands snippets silently.

let snippets = {};

function loadSnippets() {
  chrome.storage.local.get("snippets", (data) => {
    snippets = data.snippets || {};
  });
}

loadSnippets();

chrome.storage.onChanged.addListener((changes) => {
  if (changes.snippets) {
    snippets = changes.snippets.newValue || {};
  }
});

function getTextBeforeCursor(el) {
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    return el.value.substring(0, el.selectionStart);
  }
  if (el.isContentEditable) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return "";
    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);
    range.setStart(el, 0);
    return range.toString();
  }
  return "";
}

function replaceText(el, keyword, expansion) {
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    const start = el.selectionStart;
    const val = el.value;
    const before = val.substring(0, start - keyword.length);
    const after = val.substring(start);
    el.value = before + expansion + after;
    const newPos = before.length + expansion.length;
    el.setSelectionRange(newPos, newPos);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (el.isContentEditable) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    // Move range back by keyword length
    const node = range.startContainer;
    const offset = range.startOffset;
    if (node.nodeType === Node.TEXT_NODE && offset >= keyword.length) {
      const newRange = document.createRange();
      newRange.setStart(node, offset - keyword.length);
      newRange.setEnd(node, offset);
      newRange.deleteContents();
      const textNode = document.createTextNode(expansion);
      newRange.insertNode(textNode);
      const finalRange = document.createRange();
      finalRange.setStartAfter(textNode);
      finalRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(finalRange);
    }
    el.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }
}

document.addEventListener("keyup", (e) => {
  const el = e.target;
  const isEditable =
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable;

  if (!isEditable) return;

  const textBefore = getTextBeforeCursor(el);
  if (!textBefore) return;

  for (const keyword of Object.keys(snippets)) {
    if (textBefore.endsWith(keyword)) {
      replaceText(el, keyword, snippets[keyword]);
      break;
    }
  }
}, true);
