// Snippext popup.js

let snippets = {};
let filterQuery = "";

const inputKeyword = document.getElementById("inputKeyword");
const inputExpansion = document.getElementById("inputExpansion");
const btnAdd = document.getElementById("btnAdd");
const snippetList = document.getElementById("snippetList");
const countBadge = document.getElementById("countBadge");
const errorMsg = document.getElementById("errorMsg");
const inputSearch = document.getElementById("inputSearch");
const searchBar = document.getElementById("searchBar");
const btnExport = document.getElementById("btnExport");
const toast = document.getElementById("toast");

// ── Load ──────────────────────────────────────────────
chrome.storage.local.get("snippets", (data) => {
  snippets = data.snippets || {};
  render();
});

// ── Render ────────────────────────────────────────────
function render() {
  const keys = Object.keys(snippets).filter(k =>
    !filterQuery || k.includes(filterQuery) || snippets[k].toLowerCase().includes(filterQuery.toLowerCase())
  );

  const count = Object.keys(snippets).length;
  countBadge.textContent = count === 1 ? "1 snippet" : `${count} snippets`;
  searchBar.style.display = count > 4 ? "" : "none";

  if (keys.length === 0) {
    snippetList.innerHTML = `
      <div class="empty-state">
        ${count === 0
          ? `<p>No snippets yet.</p><p class="hint">Type a keyword → expansion above.</p>`
          : `<p class="hint">No results for "<span style="color:var(--text-dim)">${esc(filterQuery)}</span>"</p>`
        }
      </div>`;
    return;
  }

  snippetList.innerHTML = keys
    .sort()
    .map(k => `
      <div class="snippet-item" data-key="${esc(k)}">
        <div class="snippet-keyword">${esc(k)}</div>
        <div class="snippet-expansion"><span title="${esc(snippets[k])}">${esc(snippets[k])}</span></div>
        <button class="btn-delete" data-key="${esc(k)}" title="Delete">
          <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <line x1="2" y1="2" x2="11" y2="11"/><line x1="11" y1="2" x2="2" y2="11"/>
          </svg>
        </button>
      </div>`
    ).join("");

  snippetList.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => deleteSnippet(btn.dataset.key));
  });
}

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Add ───────────────────────────────────────────────
function addSnippet() {
  const kw = inputKeyword.value.trim();
  const exp = inputExpansion.value;

  errorMsg.className = "error-msg";
  errorMsg.textContent = "";

  if (!kw) {
    showError("Keyword cannot be empty.");
    inputKeyword.focus();
    return;
  }
  if (!exp) {
    showError("Expansion cannot be empty.");
    inputExpansion.focus();
    return;
  }
  if (snippets[kw] !== undefined) {
    showError(`"${kw}" already exists. Delete it first.`);
    return;
  }

  snippets[kw] = exp;
  save(() => {
    inputKeyword.value = "";
    inputExpansion.value = "";
    inputKeyword.focus();
    render();
    showToast(`"${kw}" added`);
  });
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.className = "error-msg visible";
}

// ── Delete ────────────────────────────────────────────
function deleteSnippet(key) {
  delete snippets[key];
  save(() => {
    render();
    showToast(`"${key}" removed`);
  });
}

// ── Save ──────────────────────────────────────────────
function save(cb) {
  chrome.storage.local.set({ snippets }, cb);
}

// ── Export ────────────────────────────────────────────
btnExport.addEventListener("click", () => {
  const json = JSON.stringify(snippets, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "snippext-export.json";
  a.click();
  URL.revokeObjectURL(url);
});

// ── Search ────────────────────────────────────────────
inputSearch.addEventListener("input", () => {
  filterQuery = inputSearch.value.trim();
  render();
});

// ── Keyboard shortcuts ────────────────────────────────
inputKeyword.addEventListener("keydown", (e) => {
  if (e.key === "Tab" && !e.shiftKey) {
    e.preventDefault();
    inputExpansion.focus();
  }
  if (e.key === "Enter") addSnippet();
});
inputExpansion.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    addSnippet();
  }
});
btnAdd.addEventListener("click", addSnippet);

// ── Toast ─────────────────────────────────────────────



let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

// ── Theme toggle ──────────────────────────────────────
const btnTheme = document.getElementById("btnTheme");

chrome.storage.local.get("theme", (data) => {
  if (data.theme === "light") document.documentElement.classList.add("light");
});

btnTheme.addEventListener("click", () => {
  const isLight = document.documentElement.classList.toggle("light");
  chrome.storage.local.set({ theme: isLight ? "light" : "dark" });
});

// Focus keyword on open
inputKeyword.focus();
