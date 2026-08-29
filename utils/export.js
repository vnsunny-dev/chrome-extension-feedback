/**
 * Agentation Feedback — Export Module
 * Formats notes for AI prompts, JSON, Markdown, and CSV export
 */
(function () {
  'use strict';

  window.AgentationFeedback = window.AgentationFeedback || {};

  /** Priority emoji mapping */
  const PRIORITY_EMOJI = {
    critical: '🔴',
    major: '🟡',
    minor: '🔵'
  };

  /** Priority label mapping */
  const PRIORITY_LABEL = {
    critical: 'Critical',
    major: 'Major',
    minor: 'Minor'
  };

  /**
   * Format a single note as an AI-ready prompt
   * @param {Object} note - The note object
   * @returns {string} Formatted AI prompt text
   */
  function formatAIPrompt(note) {
    const emoji = PRIORITY_EMOJI[note.priority] || '🔵';
    const label = PRIORITY_LABEL[note.priority] || 'Minor';
    const classes = (note.elementClasses || []).join(' ');

    let output = '';
    output += `## Frontend Feedback Note #${note.number}\n\n`;
    output += `**Priority**: ${emoji} ${label}\n`;
    output += `**Category**: ${note.category}\n`;
    output += `**Page**: ${note.pageUrl}\n\n`;

    output += `### Target Element\n`;
    output += `- **CSS Selector**: \`${note.selector}\`\n`;
    output += `- **Element**: \`<${note.elementTag}${classes ? ' class="' + classes + '"' : ''}>\`\n\n`;

    // Build computed styles table
    if (note.computedStyles && typeof note.computedStyles === 'object') {
      const flat = flattenStylesForExport(note.computedStyles);
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

    output += `### Feedback\n`;
    output += `${note.description}\n\n`;

    output += `### Instructions\n`;
    output += `Find the element matching CSS selector \`${note.selector}\` in the codebase and fix the issue described above. Use the computed styles to identify the current state and apply the requested changes.\n`;

    return output;
  }

  /**
   * Flatten grouped styles into kebab-case key-value pairs
   * @param {Object} styles - Grouped styles { color: {...}, typography: {...}, spacing: {...} }
   * @returns {Object} Flat key-value object
   */
  function flattenStylesForExport(styles) {
    const flat = {};

    for (const groupProps of Object.values(styles)) {
      if (typeof groupProps !== 'object') continue;
      for (const [prop, value] of Object.entries(groupProps)) {
        const kebab = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        flat[kebab] = value;
      }
    }

    return flat;
  }

  /**
   * Format all notes as a batch AI prompt
   * @param {Array} notes - Array of note objects
   * @param {string} pageUrl - The page URL
   * @returns {string} Formatted batch AI prompt
   */
  function formatBatchAIPrompt(notes, pageUrl) {
    if (!notes || notes.length === 0) return 'No feedback notes to export.';

    const counts = { critical: 0, major: 0, minor: 0 };
    notes.forEach(n => { counts[n.priority] = (counts[n.priority] || 0) + 1; });

    let output = '';
    output += `# Agentation Feedback Report\n\n`;
    output += `**Page**: ${pageUrl}\n`;
    output += `**Total Issues**: ${notes.length}`;
    output += ` (🔴 ${counts.critical} Critical, 🟡 ${counts.major} Major, 🔵 ${counts.minor} Minor)\n`;
    output += `**Generated**: ${new Date().toISOString()}\n\n`;
    output += `Fix all the following frontend issues. Each note includes the CSS selector to grep in the codebase and the computed styles showing the current state.\n\n`;

    // Sort by priority: critical first, then major, then minor
    const priorityOrder = { critical: 0, major: 1, minor: 2 };
    const sorted = [...notes].sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

    sorted.forEach((note, i) => {
      output += '---\n\n';
      output += formatAIPrompt(note);
      if (i < sorted.length - 1) output += '\n';
    });

    return output;
  }

  /**
   * Format notes as JSON
   * @param {Array} notes - Array of note objects
   * @returns {string} Pretty-printed JSON string
   */
  function formatJSON(notes) {
    // Strip screenshot data to reduce size (optional)
    const cleaned = notes.map(n => ({
      ...n,
      screenshot: n.screenshot ? '[base64 thumbnail]' : ''
    }));
    return JSON.stringify(cleaned, null, 2);
  }

  /**
   * Format notes as a Markdown report
   * @param {Array} notes - Array of note objects
   * @param {string} pageUrl - The page URL
   * @returns {string} Markdown formatted report
   */
  function formatMarkdown(notes, pageUrl) {
    if (!notes || notes.length === 0) return '# No feedback notes\n';

    let output = `# Frontend Feedback Report\n\n`;
    output += `**Page**: ${pageUrl}\n`;
    output += `**Date**: ${new Date().toLocaleDateString()}\n`;
    output += `**Total Notes**: ${notes.length}\n\n`;

    output += `## Summary\n\n`;
    output += `| # | Priority | Category | Selector | Description |\n`;
    output += `|---|----------|----------|----------|-------------|\n`;

    notes.forEach(n => {
      const emoji = PRIORITY_EMOJI[n.priority] || '🔵';
      const desc = (n.description || '').replace(/\|/g, '\\|').replace(/\n/g, ' ').substring(0, 60);
      output += `| ${n.number} | ${emoji} ${PRIORITY_LABEL[n.priority] || 'Minor'} | ${n.category} | \`${n.selector}\` | ${desc} |\n`;
    });

    output += '\n## Details\n\n';

    notes.forEach(n => {
      output += formatAIPrompt(n);
      output += '\n---\n\n';
    });

    return output;
  }

  /**
   * Format notes as CSV
   * @param {Array} notes - Array of note objects
   * @returns {string} CSV formatted string
   */
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

  /**
   * Escape a value for CSV (handle commas, quotes, newlines)
   * @param {string} value - The value to escape
   * @returns {string} CSV-safe value
   */
  function csvEscape(value) {
    if (!value) return '""';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /**
   * Download a file by creating a blob and triggering a download
   * @param {string} content - File content
   * @param {string} filename - Desired filename
   * @param {string} mimeType - MIME type (e.g., 'application/json')
   */
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

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} True if successful
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  }

  // Expose on namespace
  window.AgentationFeedback.Export = {
    formatAIPrompt,
    formatBatchAIPrompt,
    formatJSON,
    formatMarkdown,
    formatCSV,
    downloadFile,
    copyToClipboard
  };
})();
