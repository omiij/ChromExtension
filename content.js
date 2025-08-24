// content.js - injects a small "Save Highlight?" bubble near selected text
(() => {
  const BUBBLE_ID = '__quick_highlight_bubble__';
  let activeRange = null;
  let lastMouse = { x: 50, y: 50 };

  document.addEventListener('mousemove', (e) => {
    lastMouse = { x: e.pageX, y: e.pageY };
  });

  function ensureBubble() {
    let el = document.getElementById(BUBBLE_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = BUBBLE_ID;
    el.innerHTML = `
      <div class="qh-row">
        <span class="qh-title">Save highlight?</span>
        <button class="qh-btn qh-save" title="Save">Save</button>
      </div>
    `;
    el.addEventListener('mousedown', (e) => e.preventDefault()); // avoid selection loss
    document.documentElement.appendChild(el);
    return el;
  }

  function removeBubble() {
    const el = document.getElementById(BUBBLE_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
    activeRange = null;
  }

  function positionBubble(range) {
    const bubble = ensureBubble();
    const rect = range.getBoundingClientRect();

    let top, left;
    if (rect && rect.width > 0 && rect.height > 0) {
      top = rect.top + window.scrollY - bubble.offsetHeight - 8;
      left = rect.left + window.scrollX;
    } else {
      // fallback: near the last mouse position
      top = lastMouse.y - 40;
      left = lastMouse.x;
    }

    bubble.style.position = 'absolute';
    bubble.style.zIndex = '2147483647';
    bubble.style.top = `${Math.max(8, top)}px`;
    bubble.style.left = `${Math.max(8, left)}px`;
  }

  function getSelectedText() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return '';
    return sel.toString().trim();
  }

  function onSelectionChange() {
    const text = getSelectedText();
    if (text && text.length > 0) {
      const sel = window.getSelection();
      try {
        activeRange = sel.getRangeAt(0).cloneRange();
      } catch (e) {
        activeRange = null;
      }
      positionBubble(activeRange || document.createRange());
    } else {
      removeBubble();
    }
  }

  function saveHighlight() {
    const text = getSelectedText();
    if (!text) {
      removeBubble();
      return;
    }
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      url: location.href,
      title: document.title,
      createdAt: Date.now(),
    };
    chrome.storage.local.get({ highlights: [] }, (res) => {
      const arr = Array.isArray(res.highlights) ? res.highlights : [];
      arr.unshift(item); // newest first
      chrome.storage.local.set({ highlights: arr }, () => {
        // Quick toast
        const toast = document.createElement('div');
        toast.className = 'qh-toast';
        toast.textContent = 'Highlight saved';
        document.documentElement.appendChild(toast);
        setTimeout(() => toast.remove(), 1200);
      });
    });
    removeBubble();
    // clear selection for neatness
    const sel = window.getSelection();
    if (sel && sel.removeAllRanges) sel.removeAllRanges();
  }

  // Click handlers on bubble
  document.addEventListener(
    'click',
    (e) => {
      const bubble = document.getElementById(BUBBLE_ID);
      if (!bubble) return;
      if (bubble.contains(e.target)) {
        if (e.target.classList.contains('qh-save')) saveHighlight();
        if (e.target.classList.contains('qh-cancel')) removeBubble();
      } else {
        // clicked outside bubble
        removeBubble();
      }
    },
    true
  );

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') removeBubble();
  });

  // Track selection changes
  document.addEventListener('mouseup', () => setTimeout(onSelectionChange, 0));
  document.addEventListener('keyup', () => setTimeout(onSelectionChange, 0));
})();
