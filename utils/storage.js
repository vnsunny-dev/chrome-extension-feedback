/**
 * Agentation Feedback — Storage Module
 * CRUD operations for feedback notes using chrome.storage.local
 * Notes are keyed by normalized URL (stripped of hash and query params)
 */
(function () {
  'use strict';

  window.AgentationFeedback = window.AgentationFeedback || {};

  /**
   * Normalize a URL by removing hash and query parameters
   * @param {string} url - The URL to normalize
   * @returns {string} Normalized URL
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
   * Generate a unique note ID
   * @returns {string} Unique ID string
   */
  function generateId() {
    return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get the storage key prefix for notes
   * @param {string} url - The page URL
   * @returns {string} Storage key
   */
  function storageKey(url) {
    return 'af_notes_' + normalizeUrl(url);
  }

  /**
   * Save a new note for a given URL
   * @param {string} url - The page URL
   * @param {Object} noteData - The note data (without id, number, timestamps)
   * @returns {Promise<Object>} The saved note with generated fields
   */
  async function saveNote(url, noteData) {
    const key = storageKey(url);
    const result = await chrome.storage.local.get(key);
    const notes = result[key] || [];

    const maxNumber = notes.reduce((max, n) => Math.max(max, n.number || 0), 0);

    const note = {
      id: generateId(),
      number: maxNumber + 1,
      selector: noteData.selector || '',
      category: noteData.category || 'Other',
      priority: noteData.priority || 'minor',
      description: noteData.description || '',
      computedStyles: noteData.computedStyles || {},
      screenshot: noteData.screenshot || '',
      pageUrl: normalizeUrl(url),
      elementTag: noteData.elementTag || '',
      elementClasses: noteData.elementClasses || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    notes.push(note);
    await chrome.storage.local.set({ [key]: notes });

    return note;
  }

  /**
   * Get all notes for a given URL
   * @param {string} url - The page URL
   * @returns {Promise<Array>} Array of notes (empty if none)
   */
  async function getNotes(url) {
    const key = storageKey(url);
    const result = await chrome.storage.local.get(key);
    return result[key] || [];
  }

  /**
   * Update an existing note by ID
   * @param {string} url - The page URL
   * @param {string} noteId - The note ID to update
   * @param {Object} updates - Fields to merge into the note
   * @returns {Promise<Object|null>} The updated note, or null if not found
   */
  async function updateNote(url, noteId, updates) {
    const key = storageKey(url);
    const result = await chrome.storage.local.get(key);
    const notes = result[key] || [];

    const index = notes.findIndex(n => n.id === noteId);
    if (index === -1) return null;

    notes[index] = {
      ...notes[index],
      ...updates,
      id: notes[index].id, // preserve id
      number: notes[index].number, // preserve number
      createdAt: notes[index].createdAt, // preserve creation time
      updatedAt: new Date().toISOString()
    };

    await chrome.storage.local.set({ [key]: notes });
    return notes[index];
  }

  /**
   * Delete a note by ID
   * @param {string} url - The page URL
   * @param {string} noteId - The note ID to delete
   * @returns {Promise<boolean>} True if the note was found and deleted
   */
  async function deleteNote(url, noteId) {
    const key = storageKey(url);
    const result = await chrome.storage.local.get(key);
    const notes = result[key] || [];

    const filtered = notes.filter(n => n.id !== noteId);
    if (filtered.length === notes.length) return false;

    await chrome.storage.local.set({ [key]: filtered });
    return true;
  }

  /**
   * Clear all notes for a given URL
   * @param {string} url - The page URL
   * @returns {Promise<void>}
   */
  async function clearNotes(url) {
    const key = storageKey(url);
    await chrome.storage.local.remove(key);
  }

  /**
   * Get all notes across all URLs
   * @returns {Promise<Object>} Object mapping URLs to note arrays
   */
  async function getAllNotes() {
    const all = await chrome.storage.local.get(null);
    const result = {};

    for (const [key, value] of Object.entries(all)) {
      if (key.startsWith('af_notes_') && Array.isArray(value)) {
        const url = key.replace('af_notes_', '');
        result[url] = value;
      }
    }

    return result;
  }

  /**
   * Get the count of notes for a given URL
   * @param {string} url - The page URL
   * @returns {Promise<number>} Note count
   */
  async function getNotesCount(url) {
    const notes = await getNotes(url);
    return notes.length;
  }

  // Expose on namespace
  window.AgentationFeedback.Storage = {
    normalizeUrl,
    generateId,
    saveNote,
    getNotes,
    updateNote,
    deleteNote,
    clearNotes,
    getAllNotes,
    getNotesCount
  };
})();
