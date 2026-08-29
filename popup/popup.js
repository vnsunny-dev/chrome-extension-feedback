/**
 * Agentation Feedback — Popup Script
 * Controls the extension popup UI: note list, stats, export, and inspection trigger
 */
(function () {
  'use strict';

  // ========== DOM REFERENCES ==========

  const $currentUrl = document.getElementById('currentUrl');
  const $totalCount = document.getElementById('totalCount');
  const $criticalCount = document.getElementById('criticalCount');
  const $majorCount = document.getElementById('majorCount');
  const $minorCount = document.getElementById('minorCount');
  const $noteList = document.getElementById('noteList');
  const $emptyState = document.getElementById('emptyState');
  const $btnInspect = document.getElementById('btnInspect');
  const $btnCopyAll = document.getElementById('btnCopyAll');
  const $btnExport = document.getElementById('btnExport');
  const $exportMenu = document.getElementById('exportMenu');
  const $btnClear = document.getElementById('btnClear');

  /** @type {chrome.tabs.Tab|null} */
  let currentTab = null;

  /** @type {Array} Current page notes */
  let currentNotes = [];

  /** Priority emoji mapping */
  const PRIORITY_EMOJI = { critical: '🔴', major: '🟡', minor: '🔵' };
  const PRIORITY_LABEL = { critical: 'Critical', major: 'Major', minor: 'Minor' };

  // ========== INITIALIZATION ==========

  /**
   * Initialize the popup
   */
  async function init() {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tab;

      if (tab && tab.url) {
        const url = new URL(tab.url);
        $currentUrl.textContent = url.hostname + url.pathname;
        $currentUrl.title = tab.url;
      }

      await loadNotes();
    } catch (err) {
      console.error('[AF Popup] Init error:', err);
    }

    bindEvents();
  }

  // ========== LOAD & RENDER NOTES ==========

  /**
   * Load notes from storage and render the UI
   */
  async function loadNotes() {
    if (!currentTab || !currentTab.url) return;

    try {
      const normalizedUrl = normalizeUrl(currentTab.url);
      const key = 'af_notes_' + normalizedUrl;
      const result = await chrome.storage.local.get(key);
      currentNotes = result[key] || [];

      renderStats();
      renderNoteList();
    } catch (err) {
      console.error('[AF Popup] Load notes error:', err);
    }
  }

  /**
   * Normalize URL (same logic as storage module)
   * @param {string} url
   * @returns {string}
   */
  function normalizeUrl(url) {
    try {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname}`;
    } catch (e) {
      return url;
    }
  }

  /**
   * Render the stats bar
   */
  function renderStats() {
    const counts = { critical: 0, major: 0, minor: 0 };
    currentNotes.forEach(n => {
      counts[n.priority] = (counts[n.priority] || 0) + 1;
    });

    $totalCount.textContent = currentNotes.length;
    $criticalCount.textContent = counts.critical;
    $majorCount.textContent = counts.major;
    $minorCount.textContent = counts.minor;
  }

  /**
   * Render the note list
   */
  function renderNoteList() {
    // Clear existing cards (keep empty state)
    $noteList.querySelectorAll('.note-card').forEach(el => el.remove());

    if (currentNotes.length === 0) {
      $emptyState.style.display = 'flex';
      return;
    }

    $emptyState.style.display = 'none';

    // Sort: critical first, then major, then minor
    const priorityOrder = { critical: 0, major: 1, minor: 2 };
    const sorted = [...currentNotes].sort((a, b) =>
      (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
    );

    sorted.forEach(note => {
      const card = createNoteCard(note);
      $noteList.appendChild(card);
    });
  }

  /**
   * Create a note card element
   * @param {Object} note
   * @returns {HTMLElement}
   */
  function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.dataset.noteId = note.id;

    const desc = (note.description || '').substring(0, 100);
    const selector = note.selector || '';

    card.innerHTML = `
      <div class="note-number note-number-${note.priority || 'minor'}">${note.number}</div>
      <div class="note-body">
        <div class="note-meta">
          <span class="note-category">${note.category || 'Other'}</span>
          <span class="note-selector" title="${escapeAttr(selector)}">${escapeHtml(selector)}</span>
        </div>
        <p class="note-desc">${escapeHtml(desc)}</p>
      </div>
      <div class="note-actions">
        <button class="note-action-btn" data-action="copy" title="Copy AI Prompt">🤖</button>
        <button class="note-action-btn delete" data-action="delete" title="Delete note">🗑️</button>
      </div>
    `;

    // Click card to scroll to element on page
    card.addEventListener('click', (e) => {
      if (e.target.closest('.note-action-btn')) return;
      scrollToNote(note);
    });

    // Copy AI prompt
    card.querySelector('[data-action="copy"]').addEventListener('click', (e) => {
      e.stopPropagation();
      copyNoteAIPrompt(note);
    });

    // Delete note
    card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNote(note);
    });

    return card;
  }

  // ========== ACTIONS ==========

  /**
   * Start inspection mode in the content script
   */
  async function startInspection() {
    if (!currentTab) return;

    try {
      // First, try to inject the content script if not already loaded
      await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
          // Check if content script is loaded
          return typeof window.AgentationFeedback !== 'undefined';
        }
      });

      chrome.tabs.sendMessage(currentTab.id, { action: 'startInspection' });
      window.close(); // Close popup to let user interact with the page
    } catch (err) {
      showToast('❌ Cannot inspect this page');
    }
  }

  /**
   * Scroll to a note's element on the page
   * @param {Object} note
   */
  function scrollToNote(note) {
    if (!currentTab) return;

    chrome.runtime.sendMessage({
      action: 'scrollToNote',
      tabId: currentTab.id,
      noteId: note.id,
      selector: note.selector
    });
  }

  /**
   * Copy a single note as AI prompt
   * @param {Object} note
   */
  async function copyNoteAIPrompt(note) {
    const prompt = formatAIPrompt(note);
    try {
      await navigator.clipboard.writeText(prompt);
      showToast('📋 AI prompt copied!');
    } catch (e) {
      // Fallback
      copyFallback(prompt);
      showToast('📋 AI prompt copied!');
    }
  }

  /**
   * Copy all notes as batch AI prompt
   */
  async function copyAllAIPrompt() {
    if (currentNotes.length === 0) {
      showToast('No notes to copy');
      return;
    }

    const prompt = formatBatchAIPrompt(currentNotes, currentTab.url);
    try {
      await navigator.clipboard.writeText(prompt);
      showToast('📋 All notes copied as AI prompt!');
    } catch (e) {
      copyFallback(prompt);
      showToast('📋 All notes copied as AI prompt!');
    }
  }

  /**
   * Delete a note
   * @param {Object} note
   */
  async function deleteNote(note) {
    if (!currentTab) return;

    try {
      const normalizedUrl = normalizeUrl(currentTab.url);
      const key = 'af_notes_' + normalizedUrl;
      const result = await chrome.storage.local.get(key);
      const notes = (result[key] || []).filter(n => n.id !== note.id);

      await chrome.storage.local.set({ [key]: notes });

      // Refresh pins on page
      chrome.tabs.sendMessage(currentTab.id, { action: 'refreshPins' });

      await loadNotes();
      showToast('🗑️ Note deleted');
    } catch (err) {
      showToast('❌ Delete failed');
    }
  }

  /**
   * Clear all notes for the current page
   */
  async function clearAllNotes() {
    if (!currentTab) return;

    const normalizedUrl = normalizeUrl(currentTab.url);
    const key = 'af_notes_' + normalizedUrl;

    await chrome.storage.local.remove(key);

    // Refresh pins on page
    chrome.tabs.sendMessage(currentTab.id, { action: 'refreshPins' });

    await loadNotes();
    showToast('🗑️ All notes cleared');
  }

  /**
   * Export notes in the given format
   * @param {string} format - 'json' | 'markdown' | 'csv'
   */
  function exportNotes(format) {
    if (currentNotes.length === 0) {
      showToast('No notes to export');
      return;
    }

    let content, filename, mimeType;
    const timestamp = new Date().toISOString().split('T')[0];
    const hostname = currentTab ? new URL(currentTab.url).hostname : 'page';

    switch (format) {
      case 'json':
        content = JSON.stringify(currentNotes, null, 2);
        filename = `agentation-feedback-${hostname}-${timestamp}.json`;
        mimeType = 'application/json';
        break;

      case 'markdown':
        content = formatBatchAIPrompt(currentNotes, currentTab.url);
        filename = `agentation-feedback-${hostname}-${timestamp}.md`;
        mimeType = 'text/markdown';
        break;

      case 'csv':
        content = formatCSV(currentNotes);
        filename = `agentation-feedback-${hostname}-${timestamp}.csv`;
        mimeType = 'text/csv';
        break;

      default:
        return;
    }

    downloadFile(content, filename, mimeType);
    showToast(`📥 Exported as ${format.toUpperCase()}`);
  }

  // ========== EXPORT FORMATTERS (duplicated from export.js since popup can't access content script modules) ==========

  function formatAIPrompt(note) {
    const emoji = PRIORITY_EMOJI[note.priority] || '🔵';
    const label = PRIORITY_LABEL[note.priority] || 'Minor';
    const classes = (note.elementClasses || []).join(' ');

    let output = `## Frontend Feedback Note #${note.number}\n\n`;
    output += `**Priority**: ${emoji} ${label}\n`;
    output += `**Category**: ${note.category}\n`;
    output += `**Page**: ${note.pageUrl}\n\n`;

    output += `### Target Element\n`;
    output += `- **CSS Selector**: \`${note.selector}\`\n`;
    output += `- **Element**: \`<${note.elementTag}${classes ? ' class="' + classes + '"' : ''}>\`\n\n`;

    if (note.computedStyles && typeof note.computedStyles === 'object') {
      const flat = flattenStyles(note.computedStyles);
      const entries = Object.entries(flat).filter(([, v]) => v && v !== 'normal' && v !== 'none' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)');

      if (entries.length > 0) {
        output += `### Current Computed Styles\n`;
        output += `| Property | Current Value |\n`;
        output += `|---|---|\n`;
        for (const [prop, value] of entries) {
          output += `| ${prop} | ${value} |\n`;
        }
        output += '\n';
      }
    }

    output += `### Feedback\n${note.description}\n\n`;
    output += `### Instructions\nFind the element matching CSS selector \`${note.selector}\` in the codebase and fix the issue described above.\n`;

    return output;
  }

  function formatBatchAIPrompt(notes, pageUrl) {
    const counts = { critical: 0, major: 0, minor: 0 };
    notes.forEach(n => { counts[n.priority] = (counts[n.priority] || 0) + 1; });

    let output = `# Agentation Feedback Report\n\n`;
    output += `**Page**: ${pageUrl}\n`;
    output += `**Total Issues**: ${notes.length}`;
    output += ` (🔴 ${counts.critical} Critical, 🟡 ${counts.major} Major, 🔵 ${counts.minor} Minor)\n`;
    output += `**Generated**: ${new Date().toISOString()}\n\n`;
    output += `Fix all the following frontend issues. Each note includes the CSS selector to grep in the codebase and the computed styles showing the current state.\n\n`;

    const priorityOrder = { critical: 0, major: 1, minor: 2 };
    const sorted = [...notes].sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

    sorted.forEach(note => {
      output += '---\n\n';
      output += formatAIPrompt(note);
      output += '\n';
    });

    return output;
  }

  function formatCSV(notes) {
    const headers = ['Number', 'Priority', 'Category', 'Selector', 'Description', 'Page URL', 'Created At'];
    const rows = [headers.join(',')];

    notes.forEach(n => {
      const row = [
        n.number,
        PRIORITY_LABEL[n.priority] || 'Minor',
        n.category,
        csvEscape(n.selector),
        csvEscape(n.description),
        csvEscape(n.pageUrl),
        n.createdAt
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  function csvEscape(value) {
    if (!value) return '""';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function flattenStyles(styles) {
    const flat = {};
    for (const groupProps of Object.values(styles)) {
      if (typeof groupProps !== 'object') continue;
      for (const [prop, value] of Object.entries(groupProps)) {
        flat[prop.replace(/([A-Z])/g, '-$1').toLowerCase()] = value;
      }
    }
    return flat;
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function copyFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  // ========== UTILITY ==========

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /**
   * Show a confirmation dialog
   * @param {string} title
   * @param {string} message
   * @returns {Promise<boolean>}
   */
  function showConfirm(title, message) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = `
        <div class="confirm-dialog">
          <h3>${title}</h3>
          <p>${message}</p>
          <div class="confirm-actions">
            <button class="confirm-cancel">Cancel</button>
            <button class="confirm-delete">Delete</button>
          </div>
        </div>
      `;

      overlay.querySelector('.confirm-cancel').addEventListener('click', () => {
        overlay.remove();
        resolve(false);
      });

      overlay.querySelector('.confirm-delete').addEventListener('click', () => {
        overlay.remove();
        resolve(true);
      });

      document.body.appendChild(overlay);
    });
  }

  /**
   * Show a toast notification in the popup
   * @param {string} message
   */
  function showToast(message) {
    const existing = document.querySelector('.popup-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'popup-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2000);
  }

  // ========== EVENT BINDING ==========

  function bindEvents() {
    // Inspect button
    $btnInspect.addEventListener('click', startInspection);

    // Copy all as AI prompt
    $btnCopyAll.addEventListener('click', copyAllAIPrompt);

    // Export dropdown
    $btnExport.addEventListener('click', (e) => {
      e.stopPropagation();
      $exportMenu.classList.toggle('open');
    });

    // Export menu items
    $exportMenu.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        exportNotes(item.dataset.export);
        $exportMenu.classList.remove('open');
      });
    });

    // Close dropdown when clicking elsewhere
    document.addEventListener('click', () => {
      $exportMenu.classList.remove('open');
    });

    // Clear all
    $btnClear.addEventListener('click', async () => {
      if (currentNotes.length === 0) return;

      const confirmed = await showConfirm(
        '🗑️ Clear All Notes?',
        `This will delete ${currentNotes.length} note(s) for this page. This cannot be undone.`
      );

      if (confirmed) {
        await clearAllNotes();
      }
    });

    // Listen for storage changes to refresh UI
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        loadNotes();
      }
    });
  }

  // ========== START ==========

  init();

})();
