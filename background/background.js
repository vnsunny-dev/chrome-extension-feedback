/**
 * Agentation Feedback — Background Service Worker
 * Handles badge updates, tab screenshots, and message routing
 */

// Update badge when tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      await updateBadge(tab.id, tab.url);
    }
  } catch (e) {
    // Tab may have been closed
  }
});

// Update badge when URL changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await updateBadge(tabId, tab.url);
  }
});

/**
 * Update the extension badge with the note count for a URL
 * @param {number} tabId - The tab ID
 * @param {string} url - The page URL
 */
async function updateBadge(tabId, url) {
  try {
    const normalizedUrl = normalizeUrl(url);
    const key = 'af_notes_' + normalizedUrl;
    const result = await chrome.storage.local.get(key);
    const notes = result[key] || [];
    const count = notes.length;

    await chrome.action.setBadgeText({
      text: count > 0 ? String(count) : '',
      tabId: tabId
    });

    await chrome.action.setBadgeBackgroundColor({
      color: count > 0 ? '#7C3AED' : '#666666',
      tabId: tabId
    });
  } catch (e) {
    // Silently fail for non-http tabs
  }
}

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

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureTab') {
    // Capture the visible tab for element screenshots
    chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 80 }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ dataUrl: dataUrl });
      }
    });
    return true; // Keep message channel open for async response
  }

  if (message.action === 'updateBadge') {
    // Update badge when notes change
    const tabId = sender.tab ? sender.tab.id : message.tabId;
    const url = message.url || (sender.tab ? sender.tab.url : '');
    if (tabId && url) {
      updateBadge(tabId, url);
    }
    sendResponse({ success: true });
    return false;
  }

  if (message.action === 'startInspection') {
    // Forward to content script
    chrome.tabs.sendMessage(message.tabId, { action: 'startInspection' }, (response) => {
      sendResponse(response);
    });
    return true;
  }

  if (message.action === 'scrollToNote') {
    // Forward to content script
    chrome.tabs.sendMessage(message.tabId, {
      action: 'scrollToNote',
      noteId: message.noteId,
      selector: message.selector
    }, (response) => {
      sendResponse(response);
    });
    return true;
  }
});

// Update badge when storage changes
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== 'local') return;

  for (const key of Object.keys(changes)) {
    if (key.startsWith('af_notes_')) {
      // Refresh badge for all tabs matching this URL
      const url = key.replace('af_notes_', '');
      try {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (tab.url && normalizeUrl(tab.url) === url) {
            await updateBadge(tab.id, tab.url);
          }
        }
      } catch (e) {
        // Ignore
      }
    }
  }
});
