/**
 * Agentation Feedback — Content Script
 * Handles inspection mode, element selection, floating note panel, and numbered pins.
 * All UI is injected into a Shadow DOM container for CSS isolation.
 */
(function () {
  'use strict';

  const AF = window.AgentationFeedback;

  // ========== STATE ==========

  /** @type {'idle'|'inspecting'|'annotating'} */
  let state = 'idle';

  /** @type {Element|null} Currently hovered element during inspection */
  let hoveredElement = null;

  /** @type {Element|null} Currently selected element for annotation */
  let selectedElement = null;

  /** @type {ShadowRoot|null} Shadow root for our UI */
  let shadowRoot = null;

  /** @type {HTMLElement|null} Highlight overlay element */
  let highlightOverlay = null;

  /** @type {HTMLElement|null} Floating note panel element */
  let notePanel = null;

  /** @type {Map<string, HTMLElement>} Map of note ID to pin element */
  const pins = new Map();

  // ========== SHADOW DOM SETUP ==========

  /**
   * Initialize the Shadow DOM container for all extension UI
   */
  function initShadowRoot() {
    if (shadowRoot) return;

    let host = document.getElementById('agentation-feedback-root');
    if (!host) {
      host = document.createElement('div');
      host.id = 'agentation-feedback-root';
      document.body.appendChild(host);
    }

    shadowRoot = host.attachShadow({ mode: 'open' });

    // Inject styles into shadow root
    const style = document.createElement('style');
    style.textContent = getShadowStyles();
    shadowRoot.appendChild(style);
  }

  /**
   * Get all CSS styles for Shadow DOM elements
   * @returns {string} CSS text
   */
  function getShadowStyles() {
    return `
      /* ---- Reset ---- */
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      /* ---- Highlight Overlay ---- */
      .af-highlight {
        position: fixed;
        pointer-events: none;
        border: 2px solid #7C3AED;
        background: rgba(124, 58, 237, 0.08);
        border-radius: 3px;
        z-index: 2147483646;
        transition: all 0.1s ease;
      }

      .af-highlight-label {
        position: absolute;
        top: -24px;
        left: 0;
        background: #7C3AED;
        color: #fff;
        font-size: 11px;
        font-family: 'SF Mono', 'Fira Code', monospace;
        padding: 2px 8px;
        border-radius: 3px 3px 0 0;
        white-space: nowrap;
        max-width: 400px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ---- Inspection Cursor Overlay ---- */
      .af-cursor-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        cursor: crosshair;
        z-index: 2147483645;
        pointer-events: auto;
      }

      /* ---- Floating Note Panel ---- */
      .af-panel {
        position: fixed;
        width: 380px;
        max-height: 520px;
        background: #1a1a2e;
        border: 1px solid rgba(124, 58, 237, 0.3);
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.15);
        z-index: 2147483647;
        overflow: hidden;
        pointer-events: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif;
        color: #e0e0e0;
        animation: af-panel-in 0.2s ease-out;
      }

      @keyframes af-panel-in {
        from { opacity: 0; transform: translateY(8px) scale(0.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      .af-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: linear-gradient(135deg, #4F46E5, #7C3AED);
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }

      .af-panel-header h3 {
        font-size: 13px;
        font-weight: 600;
        color: #fff;
        letter-spacing: 0.3px;
      }

      .af-panel-close {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.15);
        border: none;
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.15s;
      }

      .af-panel-close:hover {
        background: rgba(255,255,255,0.25);
      }

      .af-panel-body {
        padding: 16px;
        overflow-y: auto;
        max-height: 400px;
      }

      .af-panel-body::-webkit-scrollbar {
        width: 6px;
      }

      .af-panel-body::-webkit-scrollbar-thumb {
        background: rgba(124,58,237,0.3);
        border-radius: 3px;
      }

      /* ---- Selector Display ---- */
      .af-selector-box {
        background: #0d0d1a;
        border: 1px solid rgba(124,58,237,0.2);
        border-radius: 8px;
        padding: 8px 12px;
        margin-bottom: 12px;
        font-family: 'SF Mono', 'Fira Code', monospace;
        font-size: 12px;
        color: #a78bfa;
        word-break: break-all;
        line-height: 1.4;
      }

      /* ---- Element Screenshot ---- */
      .af-screenshot {
        width: 100%;
        max-height: 120px;
        object-fit: contain;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.05);
        margin-bottom: 12px;
        background: #0d0d1a;
      }

      /* ---- Form Fields ---- */
      .af-field {
        margin-bottom: 12px;
      }

      .af-field label {
        display: block;
        font-size: 11px;
        font-weight: 600;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
      }

      .af-field select,
      .af-field textarea {
        width: 100%;
        background: #0d0d1a;
        border: 1px solid rgba(124,58,237,0.2);
        border-radius: 8px;
        padding: 8px 12px;
        color: #e0e0e0;
        font-size: 13px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.15s;
      }

      .af-field select:focus,
      .af-field textarea:focus {
        border-color: #7C3AED;
      }

      .af-field select {
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23888' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 32px;
      }

      .af-field select option {
        background: #1a1a2e;
        color: #e0e0e0;
      }

      .af-field textarea {
        min-height: 80px;
        resize: vertical;
      }

      /* ---- Priority Radio Buttons ---- */
      .af-priority-group {
        display: flex;
        gap: 8px;
      }

      .af-priority-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 8px;
        border: 1px solid rgba(124,58,237,0.2);
        border-radius: 8px;
        background: #0d0d1a;
        color: #999;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
      }

      .af-priority-btn:hover {
        border-color: rgba(124,58,237,0.4);
        color: #ccc;
      }

      .af-priority-btn.active {
        border-color: var(--priority-color);
        background: var(--priority-bg);
        color: var(--priority-color);
        font-weight: 600;
      }

      .af-priority-btn[data-priority="critical"] {
        --priority-color: #ef4444;
        --priority-bg: rgba(239, 68, 68, 0.1);
      }

      .af-priority-btn[data-priority="major"] {
        --priority-color: #eab308;
        --priority-bg: rgba(234, 179, 8, 0.1);
      }

      .af-priority-btn[data-priority="minor"] {
        --priority-color: #3b82f6;
        --priority-bg: rgba(59, 130, 246, 0.1);
      }

      /* ---- Styles Accordion ---- */
      .af-styles-toggle {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: #0d0d1a;
        border: 1px solid rgba(124,58,237,0.2);
        border-radius: 8px;
        color: #888;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s;
        margin-bottom: 4px;
      }

      .af-styles-toggle:hover {
        color: #aaa;
        border-color: rgba(124,58,237,0.3);
      }

      .af-styles-toggle .af-chevron {
        transition: transform 0.2s;
      }

      .af-styles-toggle.open .af-chevron {
        transform: rotate(180deg);
      }

      .af-styles-content {
        display: none;
        margin-top: 4px;
        margin-bottom: 12px;
      }

      .af-styles-content.open {
        display: block;
      }

      .af-styles-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        font-family: 'SF Mono', 'Fira Code', monospace;
      }

      .af-styles-table td {
        padding: 3px 8px;
        border-bottom: 1px solid rgba(255,255,255,0.03);
      }

      .af-styles-table td:first-child {
        color: #888;
        white-space: nowrap;
      }

      .af-styles-table td:last-child {
        color: #a78bfa;
        word-break: break-all;
      }

      /* ---- Action Buttons ---- */
      .af-actions {
        display: flex;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid rgba(255,255,255,0.05);
        background: #15152a;
      }

      .af-btn {
        flex: 1;
        padding: 10px 12px;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .af-btn-primary {
        background: linear-gradient(135deg, #4F46E5, #7C3AED);
        color: #fff;
      }

      .af-btn-primary:hover {
        box-shadow: 0 4px 16px rgba(124,58,237,0.4);
        transform: translateY(-1px);
      }

      .af-btn-secondary {
        background: rgba(124,58,237,0.1);
        color: #a78bfa;
        border: 1px solid rgba(124,58,237,0.2);
      }

      .af-btn-secondary:hover {
        background: rgba(124,58,237,0.2);
      }

      .af-btn-danger {
        background: rgba(239,68,68,0.1);
        color: #ef4444;
        border: 1px solid rgba(239,68,68,0.2);
      }

      .af-btn-danger:hover {
        background: rgba(239,68,68,0.2);
      }

      /* ---- Numbered Pins ---- */
      .af-pin {
        position: fixed;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #fff;
        cursor: pointer;
        pointer-events: auto;
        z-index: 2147483646;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.15s, box-shadow 0.15s;
        animation: af-pin-in 0.3s ease-out;
      }

      .af-pin:hover {
        transform: scale(1.2);
        box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      }

      @keyframes af-pin-in {
        from { opacity: 0; transform: scale(0.5); }
        to   { opacity: 1; transform: scale(1); }
      }

      .af-pin-critical { background: #ef4444; }
      .af-pin-major    { background: #eab308; color: #1a1a2e; }
      .af-pin-minor    { background: #3b82f6; }

      /* ---- Toast Notification ---- */
      .af-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 12px 20px;
        background: #1a1a2e;
        border: 1px solid rgba(124,58,237,0.3);
        border-radius: 10px;
        color: #e0e0e0;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        z-index: 2147483647;
        pointer-events: auto;
        animation: af-toast-in 0.3s ease-out;
      }

      @keyframes af-toast-in {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .af-toast.af-toast-out {
        animation: af-toast-out 0.2s ease-in forwards;
      }

      @keyframes af-toast-out {
        from { opacity: 1; transform: translateY(0); }
        to   { opacity: 0; transform: translateY(16px); }
      }

      .af-toast-success { border-color: rgba(34,197,94,0.4); }
      .af-toast-error   { border-color: rgba(239,68,68,0.4); }
    `;
  }

  // ========== HIGHLIGHT OVERLAY ==========

  /**
   * Show highlight overlay on an element
   * @param {Element} element - The element to highlight
   */
  function showHighlight(element) {
    if (!shadowRoot) return;

    const rect = element.getBoundingClientRect();

    if (!highlightOverlay) {
      highlightOverlay = document.createElement('div');
      highlightOverlay.className = 'af-highlight';
      highlightOverlay.innerHTML = '<div class="af-highlight-label"></div>';
      shadowRoot.appendChild(highlightOverlay);
    }

    highlightOverlay.style.top = rect.top + 'px';
    highlightOverlay.style.left = rect.left + 'px';
    highlightOverlay.style.width = rect.width + 'px';
    highlightOverlay.style.height = rect.height + 'px';
    highlightOverlay.style.display = 'block';

    // Show selector in label
    const tag = element.tagName.toLowerCase();
    const classes = Array.from(element.classList).slice(0, 3).join('.');
    highlightOverlay.querySelector('.af-highlight-label').textContent =
      tag + (classes ? '.' + classes : '') + (element.id ? '#' + element.id : '');
  }

  /**
   * Hide the highlight overlay
   */
  function hideHighlight() {
    if (highlightOverlay) {
      highlightOverlay.style.display = 'none';
    }
  }

  // ========== INSPECTION MODE ==========

  /** @type {HTMLElement|null} Cursor overlay during inspection */
  let cursorOverlay = null;

  /**
   * Start inspection mode — user can hover/click to select elements
   */
  function startInspection() {
    if (state !== 'idle') return;

    initShadowRoot();
    state = 'inspecting';

    // Create invisible overlay to capture mouse events without interfering with page
    cursorOverlay = document.createElement('div');
    cursorOverlay.className = 'af-cursor-overlay';
    shadowRoot.appendChild(cursorOverlay);

    cursorOverlay.addEventListener('mousemove', onInspectMouseMove);
    cursorOverlay.addEventListener('click', onInspectClick);
    document.addEventListener('keydown', onInspectKeyDown);

    showToast('🔍 Inspection mode — click an element to annotate', 'success');
  }

  /**
   * Stop inspection mode
   */
  function stopInspection() {
    state = 'idle';
    hoveredElement = null;
    hideHighlight();

    if (cursorOverlay) {
      cursorOverlay.removeEventListener('mousemove', onInspectMouseMove);
      cursorOverlay.removeEventListener('click', onInspectClick);
      cursorOverlay.remove();
      cursorOverlay = null;
    }

    document.removeEventListener('keydown', onInspectKeyDown);
  }

  /**
   * Handle mousemove during inspection — highlight element under cursor
   * @param {MouseEvent} e
   */
  function onInspectMouseMove(e) {
    if (state !== 'inspecting') return;

    // Temporarily hide overlay to get real element underneath
    cursorOverlay.style.pointerEvents = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    cursorOverlay.style.pointerEvents = 'auto';

    if (el && el !== hoveredElement && el.id !== 'agentation-feedback-root' && !el.closest('#agentation-feedback-root')) {
      hoveredElement = el;
      showHighlight(el);
    }
  }

  /**
   * Handle click during inspection — select element and open note panel
   * @param {MouseEvent} e
   */
  function onInspectClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (state !== 'inspecting' || !hoveredElement) return;

    selectedElement = hoveredElement;
    stopInspection();
    openNotePanel(selectedElement);
  }

  /**
   * Handle Escape key to exit inspection mode
   * @param {KeyboardEvent} e
   */
  function onInspectKeyDown(e) {
    if (e.key === 'Escape') {
      stopInspection();
      showToast('Inspection cancelled', 'success');
    }
  }

  // ========== FLOATING NOTE PANEL ==========

  /**
   * Open the note creation/editing panel for an element
   * @param {Element} element - The DOM element to annotate
   * @param {Object} [existingNote] - If editing, the existing note data
   */
  async function openNotePanel(element, existingNote) {
    if (!shadowRoot) initShadowRoot();

    state = 'annotating';

    // Capture element data
    const selector = AF.Selector.generateSelector(element);
    const styles = AF.StylesCapture.captureStyles(element);
    const stylesTable = AF.StylesCapture.getStylesTable(styles);

    // Capture screenshot
    let screenshot = '';
    try {
      screenshot = await AF.Screenshot.captureElement(element);
    } catch (e) {
      console.warn('[AF] Screenshot failed:', e);
    }

    // Remove existing panel
    closeNotePanel();

    // Position panel near element
    const rect = element.getBoundingClientRect();
    const panelWidth = 380;
    const panelMaxHeight = 520;

    let top = rect.bottom + 12;
    let left = rect.left;

    // Keep panel in viewport
    if (left + panelWidth > window.innerWidth - 16) {
      left = window.innerWidth - panelWidth - 16;
    }
    if (left < 16) left = 16;

    if (top + panelMaxHeight > window.innerHeight - 16) {
      top = rect.top - panelMaxHeight - 12;
      if (top < 16) top = 16;
    }

    // Build panel HTML
    notePanel = document.createElement('div');
    notePanel.className = 'af-panel';
    notePanel.style.top = top + 'px';
    notePanel.style.left = left + 'px';

    const elementTag = element.tagName;
    const elementClasses = Array.from(element.classList);

    notePanel.innerHTML = `
      <div class="af-panel-header">
        <h3>${existingNote ? '✏️ Edit Note #' + existingNote.number : '📝 New Feedback Note'}</h3>
        <button class="af-panel-close" data-action="close">✕</button>
      </div>
      <div class="af-panel-body">
        ${screenshot ? `<img class="af-screenshot" src="${screenshot}" alt="Element preview" />` : ''}
        
        <div class="af-selector-box">${escapeHtml(selector)}</div>

        <div class="af-field">
          <label>Category</label>
          <select data-field="category">
            <option value="Color" ${existingNote?.category === 'Color' ? 'selected' : ''}>🎨 Color</option>
            <option value="Typography" ${existingNote?.category === 'Typography' ? 'selected' : ''}>🔤 Typography</option>
            <option value="Spacing" ${existingNote?.category === 'Spacing' ? 'selected' : ''}>📐 Spacing</option>
            <option value="Layout" ${existingNote?.category === 'Layout' ? 'selected' : ''}>📏 Layout</option>
            <option value="Other" ${existingNote?.category === 'Other' ? 'selected' : ''}>📋 Other</option>
          </select>
        </div>

        <div class="af-field">
          <label>Priority</label>
          <div class="af-priority-group">
            <button class="af-priority-btn ${(existingNote?.priority || '') === 'critical' ? 'active' : ''}" data-priority="critical">🔴 Critical</button>
            <button class="af-priority-btn ${(!existingNote || existingNote.priority === 'major') ? 'active' : ''}" data-priority="major">🟡 Major</button>
            <button class="af-priority-btn ${(existingNote?.priority || '') === 'minor' ? 'active' : ''}" data-priority="minor">🔵 Minor</button>
          </div>
        </div>

        <div class="af-field">
          <label>Feedback</label>
          <textarea data-field="description" placeholder="Describe the issue (e.g., 'Color should be #FF5500, currently too dark')">${existingNote?.description || ''}</textarea>
        </div>

        <button class="af-styles-toggle" data-action="toggle-styles">
          <span>📊 Computed Styles (${stylesTable.length})</span>
          <span class="af-chevron">▼</span>
        </button>
        <div class="af-styles-content" data-role="styles-content">
          <table class="af-styles-table">
            ${stylesTable.map(row => `<tr><td>${row.property}</td><td>${row.value}</td></tr>`).join('')}
          </table>
        </div>
      </div>
      <div class="af-actions">
        <button class="af-btn af-btn-secondary" data-action="copy-ai">🤖 AI Prompt</button>
        ${existingNote
          ? `<button class="af-btn af-btn-danger" data-action="delete" data-note-id="${existingNote.id}">🗑️</button>`
          : ''
        }
        <button class="af-btn af-btn-primary" data-action="save">💾 Save</button>
      </div>
    `;

    shadowRoot.appendChild(notePanel);

    // Store data on the panel for save/copy
    notePanel._afData = {
      selector,
      styles,
      screenshot,
      elementTag,
      elementClasses,
      existingNote
    };

    // Bind events
    bindPanelEvents(notePanel);
  }

  /**
   * Bind event listeners for the note panel
   * @param {HTMLElement} panel
   */
  function bindPanelEvents(panel) {
    // Close button
    panel.querySelector('[data-action="close"]').addEventListener('click', () => {
      closeNotePanel();
      state = 'idle';
    });

    // Priority buttons
    panel.querySelectorAll('.af-priority-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.af-priority-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Styles accordion
    const stylesToggle = panel.querySelector('[data-action="toggle-styles"]');
    const stylesContent = panel.querySelector('[data-role="styles-content"]');
    stylesToggle.addEventListener('click', () => {
      stylesToggle.classList.toggle('open');
      stylesContent.classList.toggle('open');
    });

    // Save button
    panel.querySelector('[data-action="save"]').addEventListener('click', () => saveNote(panel));

    // Copy AI Prompt button
    panel.querySelector('[data-action="copy-ai"]').addEventListener('click', () => copyAIPrompt(panel));

    // Delete button (if editing)
    const deleteBtn = panel.querySelector('[data-action="delete"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteNoteFromPanel(panel));
    }

    // Escape to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeNotePanel();
        state = 'idle';
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  /**
   * Close and remove the note panel
   */
  function closeNotePanel() {
    if (notePanel) {
      notePanel.remove();
      notePanel = null;
    }
    selectedElement = null;
  }

  /**
   * Save a note from the panel form data
   * @param {HTMLElement} panel
   */
  async function saveNote(panel) {
    const data = panel._afData;
    const category = panel.querySelector('[data-field="category"]').value;
    const description = panel.querySelector('[data-field="description"]').value;
    const activeP = panel.querySelector('.af-priority-btn.active');
    const priority = activeP ? activeP.dataset.priority : 'major';

    if (!description.trim()) {
      showToast('⚠️ Please enter a description', 'error');
      return;
    }

    const noteData = {
      selector: data.selector,
      category,
      priority,
      description,
      computedStyles: data.styles,
      screenshot: data.screenshot,
      elementTag: data.elementTag,
      elementClasses: data.elementClasses
    };

    try {
      const url = window.location.href;

      if (data.existingNote) {
        await AF.Storage.updateNote(url, data.existingNote.id, noteData);
        showToast('✅ Note updated!', 'success');
      } else {
        await AF.Storage.saveNote(url, noteData);
        showToast('✅ Note saved!', 'success');
      }

      closeNotePanel();
      state = 'idle';

      // Refresh pins and update badge
      await renderPins();
      chrome.runtime.sendMessage({ action: 'updateBadge', url: url });

    } catch (err) {
      console.error('[AF] Save failed:', err);
      showToast('❌ Failed to save note', 'error');
    }
  }

  /**
   * Copy AI prompt for the current panel's note data
   * @param {HTMLElement} panel
   */
  async function copyAIPrompt(panel) {
    const data = panel._afData;
    const category = panel.querySelector('[data-field="category"]').value;
    const description = panel.querySelector('[data-field="description"]').value;
    const activeP = panel.querySelector('.af-priority-btn.active');
    const priority = activeP ? activeP.dataset.priority : 'major';

    const note = {
      number: data.existingNote ? data.existingNote.number : '?',
      selector: data.selector,
      category,
      priority,
      description: description || '(no description)',
      computedStyles: data.styles,
      elementTag: data.elementTag,
      elementClasses: data.elementClasses,
      pageUrl: window.location.href
    };

    const prompt = AF.Export.formatAIPrompt(note);
    const success = await AF.Export.copyToClipboard(prompt);

    if (success) {
      showToast('📋 AI prompt copied to clipboard!', 'success');
    } else {
      showToast('❌ Failed to copy', 'error');
    }
  }

  /**
   * Delete a note from the edit panel
   * @param {HTMLElement} panel
   */
  async function deleteNoteFromPanel(panel) {
    const data = panel._afData;
    if (!data.existingNote) return;

    try {
      const url = window.location.href;
      await AF.Storage.deleteNote(url, data.existingNote.id);

      closeNotePanel();
      state = 'idle';

      await renderPins();
      chrome.runtime.sendMessage({ action: 'updateBadge', url: url });

      showToast('🗑️ Note deleted', 'success');
    } catch (err) {
      showToast('❌ Failed to delete note', 'error');
    }
  }

  // ========== NUMBERED PINS ==========

  /**
   * Render numbered pins for all notes on the current page
   */
  async function renderPins() {
    if (!shadowRoot) initShadowRoot();

    // Clear existing pins
    pins.forEach(pin => pin.remove());
    pins.clear();

    try {
      const notes = await AF.Storage.getNotes(window.location.href);

      notes.forEach(note => {
        try {
          const el = document.querySelector(note.selector);
          if (!el) return;

          const pin = document.createElement('div');
          pin.className = `af-pin af-pin-${note.priority || 'minor'}`;
          pin.textContent = note.number;
          pin.dataset.noteId = note.id;
          pin.dataset.selector = note.selector;

          // Position pin at top-right of element
          const rect = el.getBoundingClientRect();
          pin.style.top = (rect.top + window.scrollY - 6) + 'px';
          pin.style.left = (rect.right + window.scrollX - 6) + 'px';

          // Use fixed positioning relative to viewport
          pin.style.position = 'fixed';
          pin.style.top = (rect.top - 6) + 'px';
          pin.style.left = (rect.right - 6) + 'px';

          // Click to open edit panel
          pin.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetEl = document.querySelector(note.selector);
            if (targetEl) {
              openNotePanel(targetEl, note);
            }
          });

          shadowRoot.appendChild(pin);
          pins.set(note.id, pin);
        } catch (e) {
          // Element may not exist on page anymore
        }
      });
    } catch (err) {
      console.warn('[AF] Failed to render pins:', err);
    }
  }

  /**
   * Update pin positions (e.g., after scroll or resize)
   */
  function updatePinPositions() {
    pins.forEach((pin, noteId) => {
      const selector = pin.dataset.selector;
      if (!selector) return;

      try {
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          pin.style.top = (rect.top - 6) + 'px';
          pin.style.left = (rect.right - 6) + 'px';
        }
      } catch (e) {
        // Ignore
      }
    });
  }

  // ========== TOAST NOTIFICATIONS ==========

  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {'success'|'error'} type - Toast type
   */
  function showToast(message, type) {
    if (!shadowRoot) initShadowRoot();

    // Remove existing toast
    const existing = shadowRoot.querySelector('.af-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `af-toast af-toast-${type}`;
    toast.textContent = message;
    shadowRoot.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('af-toast-out');
      setTimeout(() => toast.remove(), 200);
    }, 2500);
  }

  // ========== UTILITY ==========

  /**
   * Escape HTML special characters
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ========== MESSAGE HANDLING ==========

  /**
   * Listen for messages from popup and background
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startInspection') {
      startInspection();
      sendResponse({ success: true });
      return false;
    }

    if (message.action === 'scrollToNote') {
      try {
        const el = document.querySelector(message.selector);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Flash the element
          showHighlight(el);
          setTimeout(() => hideHighlight(), 2000);
        }
        sendResponse({ success: true });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return false;
    }

    if (message.action === 'refreshPins') {
      renderPins();
      sendResponse({ success: true });
      return false;
    }
  });

  // ========== INITIALIZATION ==========

  /**
   * Initialize the content script
   */
  function init() {
    initShadowRoot();
    renderPins();

    // Update pin positions on scroll and resize
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updatePinPositions, 50);
    }, { passive: true });

    window.addEventListener('resize', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updatePinPositions, 50);
    }, { passive: true });
  }

  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
