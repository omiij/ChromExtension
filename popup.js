
// popup.js - renders saved highlights and allows deletions
function formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return "";
  }
}

function hostname(href) {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return "";
  }
}

function render(highlights) {
  const list = document.getElementById("list");
  const count = document.getElementById("count");
  list.innerHTML = "";
  count.textContent = `${highlights.length} item${highlights.length === 1 ? "" : "s"}`;

  const tpl = document.getElementById("itemTemplate");
  highlights.forEach((h) => {
    const node = tpl.content.cloneNode(true);
    node.querySelector(".text").textContent = h.text;
    const a = node.querySelector(".source");
    a.textContent = hostname(h.url) || "source";
    a.href = h.url;
    node.querySelector(".time").textContent = formatTime(h.createdAt);
    const delBtn = node.querySelector(".delete");
    delBtn.addEventListener("click", () => removeHighlight(h.id));
    list.appendChild(node);
  });
}

function load() {
  chrome.storage.local.get({ highlights: [] }, (res) => {
    const arr = Array.isArray(res.highlights) ? res.highlights : [];
    render(arr);
  });
}

function removeHighlight(id) {
  chrome.storage.local.get({ highlights: [] }, (res) => {
    const arr = Array.isArray(res.highlights) ? res.highlights : [];
    const next = arr.filter(h => h.id !== id);
    chrome.storage.local.set({ highlights: next }, load);
  });
}

document.getElementById("clearAll").addEventListener("click", () => {
  if (confirm("Delete all highlights?")) {
    chrome.storage.local.set({ highlights: [] }, load);
  }
});

document.addEventListener("DOMContentLoaded", load);
