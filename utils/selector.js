/**
 * Agentation Feedback — Selector Module
 * Generates unique, human-readable CSS selectors for DOM elements
 */
(function () {
  'use strict';

  window.AgentationFeedback = window.AgentationFeedback || {};

  /** Classes to skip when building selectors (common framework/state classes) */
  const SKIP_CLASSES = new Set([
    'active', 'hover', 'focus', 'visited', 'disabled', 'enabled',
    'show', 'hide', 'hidden', 'visible', 'open', 'closed', 'collapsed',
    'fade', 'in', 'out', 'enter', 'leave', 'appear',
    'ng-scope', 'ng-binding', 'ng-isolate-scope',
    'is-active', 'is-open', 'is-visible', 'is-hidden',
    'js-enabled', 'no-js',
    'even', 'odd', 'first', 'last'
  ]);

  /**
   * Check if a selector uniquely identifies one element
   * @param {string} selector - CSS selector to test
   * @returns {boolean} True if exactly one element matches
   */
  function isUnique(selector) {
    try {
      return document.querySelectorAll(selector).length === 1;
    } catch (e) {
      return false;
    }
  }

  /**
   * Escape special characters in CSS selectors
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  function cssEscape(str) {
    if (typeof CSS !== 'undefined' && CSS.escape) {
      return CSS.escape(str);
    }
    return str.replace(/([^\w-])/g, '\\$1');
  }

  /**
   * Get meaningful classes for an element (filtering out framework/state classes)
   * @param {Element} element - The DOM element
   * @returns {string[]} Array of meaningful class names
   */
  function getMeaningfulClasses(element) {
    return Array.from(element.classList).filter(cls => {
      if (SKIP_CLASSES.has(cls)) return false;
      if (cls.length <= 1) return false;
      // Skip classes that look auto-generated (e.g., 'css-1a2b3c', '_2dF3g')
      if (/^(css|sc|styled)-[a-z0-9]+$/i.test(cls)) return false;
      if (/^_[a-zA-Z0-9]{5,}$/.test(cls)) return false;
      return true;
    });
  }

  /**
   * Build a selector segment for a single element
   * @param {Element} element - The DOM element
   * @returns {string} Selector segment (e.g., 'div.container' or 'button.primary')
   */
  function buildSegment(element) {
    const tag = element.tagName.toLowerCase();
    const classes = getMeaningfulClasses(element);

    if (classes.length > 0) {
      // Use up to 2 most specific classes
      const classSelector = classes.slice(0, 2).map(c => '.' + cssEscape(c)).join('');
      return tag + classSelector;
    }

    return tag;
  }

  /**
   * Get the nth-of-type index for an element among its siblings
   * @param {Element} element - The DOM element
   * @returns {number} 1-based nth-of-type index
   */
  function getNthOfType(element) {
    const tag = element.tagName;
    let index = 1;
    let sibling = element.previousElementSibling;

    while (sibling) {
      if (sibling.tagName === tag) index++;
      sibling = sibling.previousElementSibling;
    }

    return index;
  }

  /**
   * Count siblings of the same type
   * @param {Element} element - The DOM element
   * @returns {number} Count of siblings with same tag
   */
  function countSameTypeSiblings(element) {
    const parent = element.parentElement;
    if (!parent) return 1;

    const tag = element.tagName;
    return Array.from(parent.children).filter(c => c.tagName === tag).length;
  }

  /**
   * Generate a unique CSS selector for the given element
   * @param {Element} element - The DOM element to generate a selector for
   * @returns {string} A unique CSS selector string
   */
  function generateSelector(element) {
    if (!element || element === document.documentElement || element === document.body) {
      return element ? element.tagName.toLowerCase() : 'html';
    }

    // Strategy 1: Element has a unique ID
    if (element.id) {
      const idSelector = '#' + cssEscape(element.id);
      if (isUnique(idSelector)) {
        return idSelector;
      }
    }

    // Strategy 2: Build path upward, try to find a short unique selector
    const path = [];
    let current = element;

    while (current && current !== document.body && current !== document.documentElement) {
      let segment = buildSegment(current);

      // Check if this segment alone is unique
      if (path.length === 0 && isUnique(segment)) {
        return segment;
      }

      // If element has a unique ID among ancestors, use it as anchor
      if (current !== element && current.id) {
        const anchorSelector = '#' + cssEscape(current.id);
        if (isUnique(anchorSelector)) {
          path.push(anchorSelector);
          break;
        }
      }

      // Add nth-of-type if there are siblings of the same type
      if (countSameTypeSiblings(current) > 1) {
        segment += ':nth-of-type(' + getNthOfType(current) + ')';
      }

      path.push(segment);

      // Try the built selector so far
      const candidate = path.slice().reverse().join(' > ');
      if (isUnique(candidate)) {
        return candidate;
      }

      current = current.parentElement;
    }

    // Strategy 3: Full path from body
    const fullSelector = path.slice().reverse().join(' > ');
    if (isUnique(fullSelector)) {
      return fullSelector;
    }

    // Strategy 4: Fallback — add body prefix
    const fallback = 'body > ' + fullSelector;
    return fallback;
  }

  // Expose on namespace
  window.AgentationFeedback.Selector = {
    generateSelector
  };
})();
