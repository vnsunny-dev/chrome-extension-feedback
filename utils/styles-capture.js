/**
 * Agentation Feedback — Styles Capture Module
 * Extracts computed styles (color, typography, spacing) from DOM elements
 */
(function () {
  'use strict';

  window.AgentationFeedback = window.AgentationFeedback || {};

  /** Style properties to capture, grouped by category */
  const STYLE_GROUPS = {
    color: [
      'color',
      'backgroundColor',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor'
    ],
    typography: [
      'fontFamily',
      'fontSize',
      'fontWeight',
      'lineHeight',
      'letterSpacing',
      'textAlign',
      'textDecoration',
      'textTransform'
    ],
    spacing: [
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft'
    ]
  };

  /**
   * Convert camelCase property name to kebab-case
   * @param {string} prop - camelCase property name
   * @returns {string} kebab-case name
   */
  function toKebabCase(prop) {
    return prop.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  /**
   * Simplify border colors — if all 4 sides are equal, return single borderColor
   * @param {Object} colorObj - The color properties object
   * @returns {Object} Simplified color object
   */
  function simplifyBorderColors(colorObj) {
    const sides = ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'];
    const values = sides.map(s => colorObj[s]).filter(Boolean);

    if (values.length === 4 && values.every(v => v === values[0])) {
      const simplified = { ...colorObj };
      sides.forEach(s => delete simplified[s]);
      simplified.borderColor = values[0];
      return simplified;
    }

    return colorObj;
  }

  /**
   * Capture computed styles for an element, grouped by category
   * @param {Element} element - The DOM element
   * @returns {Object} Styles grouped as { color: {...}, typography: {...}, spacing: {...} }
   */
  function captureStyles(element) {
    if (!element) return { color: {}, typography: {}, spacing: {} };

    const computed = window.getComputedStyle(element);
    const result = {};

    for (const [group, props] of Object.entries(STYLE_GROUPS)) {
      result[group] = {};
      for (const prop of props) {
        result[group][prop] = computed.getPropertyValue(toKebabCase(prop)) || computed[prop] || '';
      }
    }

    // Simplify border colors if all 4 sides are equal
    result.color = simplifyBorderColors(result.color);

    return result;
  }

  /**
   * Flatten grouped styles into a single key-value object
   * Uses kebab-case property names for readability
   * @param {Object} styles - Grouped styles from captureStyles()
   * @returns {Object} Flat key-value object
   */
  function flattenStyles(styles) {
    const flat = {};

    for (const [group, props] of Object.entries(styles)) {
      for (const [prop, value] of Object.entries(props)) {
        flat[toKebabCase(prop)] = value;
      }
    }

    return flat;
  }

  /**
   * Get a display-friendly styles table (for the floating panel)
   * Filters out default/empty values
   * @param {Object} styles - Grouped styles from captureStyles()
   * @returns {Array<{property: string, value: string, group: string}>}
   */
  function getStylesTable(styles) {
    const rows = [];
    const defaults = new Set(['normal', 'none', '0px', 'auto', 'start']);

    for (const [group, props] of Object.entries(styles)) {
      for (const [prop, value] of Object.entries(props)) {
        if (value && !defaults.has(value) && value !== 'rgba(0, 0, 0, 0)') {
          rows.push({
            property: toKebabCase(prop),
            value: value,
            group: group
          });
        }
      }
    }

    return rows;
  }

  // Expose on namespace
  window.AgentationFeedback.StylesCapture = {
    captureStyles,
    flattenStyles,
    getStylesTable
  };
})();
