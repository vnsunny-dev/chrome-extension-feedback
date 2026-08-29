# Agentation Feedback — Technical Architecture Document

## Overview

Agentation Feedback is a Chrome Extension (Manifest V3) that enables developers to visually annotate web page elements with structured feedback and export AI-ready prompts. The extension uses a click-to-annotate workflow where users select DOM elements, auto-capture CSS selectors and computed styles, and generate structured prompts for AI coding tools.

### Architecture Philosophy
- **Zero build step**: Pure vanilla JS/CSS, no bundler or transpiler required
- **CSS isolation**: Shadow DOM prevents style conflicts with host pages
- **Offline-first**: All data stored locally in `chrome.storage.local`
- **Minimal permissions**: Only `activeTab`, `storage`, and `scripting`

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     CHROME BROWSER                            │
│                                                               │
│  ┌─────────────────┐   messages    ┌────────────────────┐    │
│  │   Popup (UI)     │◄────────────►│  Background Worker  │    │
│  │   popup.html     │              │  background.js      │    │
│  │   popup.js       │              │                     │    │
│  │   popup.css      │              │  • Badge updates    │    │
│  └────────┬─────────┘              │  • Tab screenshots  │    │
│           │                        │  • Message routing   │    │
│           │ chrome.tabs            └──────────┬───────────┘    │
│           │ .sendMessage                      │               │
│           │                                   │               │
│           ▼                                   ▼               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                   WEB PAGE (Tab)                        │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │            Content Script Layer                   │   │   │
│  │  │                                                   │   │   │
│  │  │  content.js                                       │   │   │
│  │  │  ├── Inspection Mode (hover/click)                │   │   │
│  │  │  ├── Floating Note Panel (Shadow DOM)             │   │   │
│  │  │  ├── Numbered Pins (Shadow DOM)                   │   │   │
│  │  │  └── Toast Notifications (Shadow DOM)             │   │   │
│  │  │                                                   │   │   │
│  │  │  utils/                                           │   │   │
│  │  │  ├── storage.js      (chrome.storage.local)       │   │   │
│  │  │  ├── selector.js     (CSS selector generation)    │   │   │
│  │  │  ├── styles-capture.js (computed styles)          │   │   │
│  │  │  ├── screenshot.js   (element screenshots)        │   │   │
│  │  │  └── export.js       (AI prompt / JSON / MD / CSV)│   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌──────────────────┐                                   │   │
│  │  │  Shadow DOM Host  │ ← All extension UI isolated here │   │
│  │  │  #agentation-     │                                   │   │
│  │  │   feedback-root   │                                   │   │
│  │  └──────────────────┘                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                chrome.storage.local                      │   │
│  │  Key: "af_notes_{normalized_url}"                        │   │
│  │  Value: Array<Note>                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Manifest V3 Configuration

**File**: `manifest.json`

| Permission | Rationale |
|---|---|
| `activeTab` | Access the current tab's content for element inspection and screenshots |
| `storage` | Persist notes in `chrome.storage.local` |
| `scripting` | Programmatically inject content scripts when needed |

**Content Script Injection**: Declared in manifest `content_scripts` field with `"matches": ["<all_urls>"]` and `"run_at": "document_idle"`. This ensures scripts load after the page is interactive.

**Script Load Order**: Utils load before content script to ensure `AgentationFeedback` namespace is populated:
```
storage.js → selector.js → styles-capture.js → screenshot.js → export.js → content.js
```

---

### 2. Content Script — State Machine

**File**: `content/content.js`

The content script operates as a simple state machine:

```
                    ┌──── click extension icon / message ────┐
                    │                                         │
                    ▼                                         │
              ┌──────────┐    click element    ┌────────────┐
  ──start──►  │ IDLE      │──────────────────►│ INSPECTING  │
              └──────────┘◄───── Escape ──────└────────────┘
                    ▲                                │
                    │                          click element
                    │                                │
                    │                                ▼
                    │                        ┌──────────────┐
                    └─── save / cancel ──────│  ANNOTATING   │
                                             └──────────────┘
```

**States**:
- `idle`: Default state. Pins are visible, no interaction capturing.
- `inspecting`: Cursor overlay is active. Mousemove highlights elements. Click selects.
- `annotating`: Floating panel is open. User can edit and save.

---

### 3. Element Highlighting Algorithm

During inspection mode, a transparent `div` overlay captures mouse events. On `mousemove`:

1. Temporarily disable overlay pointer events
2. Call `document.elementFromPoint(x, y)` to get the real element
3. Re-enable overlay pointer events
4. Get element's `getBoundingClientRect()`
5. Position highlight overlay to match the element's bounds
6. Display element tag + classes in a label above the highlight

This avoids interfering with the page's own event handlers.

---

### 4. CSS Selector Generation

**File**: `utils/selector.js`

**Algorithm** (priority order):
1. **ID selector**: If element has an `id`, use `#elementId` (validate uniqueness)
2. **Short path**: Walk up the DOM, building `tag.class` segments
   - Filter out framework/state classes (`active`, `hover`, CSS modules hashes)
   - Use up to 2 most meaningful classes
   - Check `document.querySelectorAll(candidate).length === 1` at each step
3. **nth-of-type**: If siblings share the same tag, append `:nth-of-type(n)`
4. **Ancestor anchor**: If an ancestor has a unique ID, use it as anchor
5. **Full path fallback**: Complete path from `body` with `>` combinators

**Design Decision**: Prefer short, readable selectors over guaranteed-unique XPaths. XPaths break easily and are hard for AI tools to grep.

---

### 5. Computed Styles Extraction

**File**: `utils/styles-capture.js`

Captures three categories of styles using `window.getComputedStyle()`:

| Category | Properties |
|---|---|
| **Color** | `color`, `background-color`, `border-color` (collapsed if all sides equal) |
| **Typography** | `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-align`, `text-decoration`, `text-transform` |
| **Spacing** | `margin-{top,right,bottom,left}`, `padding-{top,right,bottom,left}` |

**Border color simplification**: If all 4 border sides have the same color, they're collapsed into a single `borderColor` property.

---

### 6. Screenshot Capture Pipeline

**File**: `utils/screenshot.js`

```
Content Script                    Background Worker
     │                                  │
     │ 1. getBoundingClientRect()        │
     │    of target element              │
     │                                  │
     │ 2. sendMessage({captureTab})  ──►│
     │                                  │ 3. chrome.tabs
     │                                  │    .captureVisibleTab()
     │◄── 4. Return JPEG dataURL ───────│
     │                                  │
     │ 5. Create canvas, draw full      │
     │    screenshot, crop to element   │
     │    bounds (accounting for DPR)   │
     │                                  │
     │ 6. Scale to max 400px width      │
     │    Export as JPEG 70% quality    │
     │                                  │
     │ 7. Return base64 data URL        │
```

**DPR Handling**: `window.devicePixelRatio` is used to correctly map CSS pixels to the screenshot's physical pixels. On a 2x display, a 100px-wide element occupies 200px in the screenshot.

---

### 7. Shadow DOM Isolation Strategy

All extension UI (highlight overlay, floating panel, pins, toasts) is rendered inside a Shadow DOM:

```javascript
const host = document.createElement('div');
host.id = 'agentation-feedback-root';
document.body.appendChild(host);
const shadowRoot = host.attachShadow({ mode: 'open' });
```

**Benefits**:
- Host page CSS cannot affect our UI
- Our CSS cannot leak into the host page
- Works on pages with strict CSS resets
- No class naming conflicts

**Limitation**: Shadow DOM elements cannot be targeted by the host page's JavaScript unless it specifically queries our shadow root.

---

### 8. Storage Schema

**File**: `utils/storage.js`

**Key format**: `af_notes_{normalized_url}`

**URL Normalization**: Strip hash (`#`) and query params (`?`) so notes persist across URL variations.

**Note Object**:
```typescript
interface Note {
  id: string;              // "note_1693000000000_abc123"
  number: number;          // Auto-incremented per URL (1, 2, 3...)
  selector: string;        // CSS selector to find the element
  category: Category;      // "Color" | "Typography" | "Spacing" | "Layout" | "Other"
  priority: Priority;      // "critical" | "major" | "minor"
  description: string;     // User's free-text feedback
  computedStyles: {        // Grouped computed styles
    color: Record<string, string>;
    typography: Record<string, string>;
    spacing: Record<string, string>;
  };
  screenshot: string;      // Base64 JPEG data URL (or empty)
  pageUrl: string;         // Normalized page URL
  elementTag: string;      // e.g., "BUTTON"
  elementClasses: string[];// e.g., ["primary", "btn"]
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

---

### 9. AI Prompt Format

**File**: `utils/export.js`

The AI prompt format is designed to give AI coding tools maximum context:

```markdown
## Frontend Feedback Note #1

**Priority**: 🔴 Critical
**Category**: Color
**Page**: http://localhost:3000/dashboard

### Target Element
- **CSS Selector**: `.sidebar > button.primary`
- **Element**: `<BUTTON class="primary btn">`

### Current Computed Styles
| Property | Current Value |
|---|---|
| color | rgb(255, 255, 255) |
| background-color | rgb(255, 102, 0) |

### Feedback
Background color should be #FF5500, currently showing #FF6600.

### Instructions
Find the element matching CSS selector `.sidebar > button.primary`
in the codebase and fix the issue described above.
```

**Why this format?**
- CSS selector lets agents `grep -r ".sidebar > button.primary"` in the codebase
- Computed styles show current appearance for comparison
- Markdown table is parseable by all AI models
- Instructions tell the agent exactly what to do

---

### 10. Popup Architecture

**File**: `popup/popup.js`

The popup runs in its own context (not the content script's). It communicates via:
- `chrome.storage.local.get()` — direct storage access for reading notes
- `chrome.tabs.sendMessage()` — to trigger actions in the content script
- `chrome.runtime.sendMessage()` — to route through the background worker

**Note**: The popup cannot access `window.AgentationFeedback` (content script namespace). Export formatters are duplicated in `popup.js`.

---

## Data Flow Diagrams

### Note Creation Flow
```
User clicks "Inspect" in popup
  → popup sends startInspection to content script
  → content script enters INSPECTING state
  → cursor overlay captures mousemove
  → user clicks element
  → content script captures: selector, styles, screenshot
  → floating panel renders in Shadow DOM
  → user fills form and clicks Save
  → storage.saveNote() writes to chrome.storage.local
  → numbered pin rendered on element
  → badge updated via background worker
```

### AI Prompt Copy Flow
```
User clicks "🤖 AI Prompt" (on panel or in popup)
  → export.formatAIPrompt(note) generates structured text
  → navigator.clipboard.writeText() copies to clipboard
  → toast notification confirms success
  → user pastes into Claude Code / Cursor
```

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Vanilla JS | No framework | No build step, simpler debugging, Chrome extension constraints |
| Shadow DOM | CSS isolation | Host page styles can't break our UI |
| `chrome.storage.local` | Not IndexedDB | Simpler API, built-in Chrome sync potential |
| IIFE pattern | Not ES modules | Content scripts don't support ES module `import` |
| `captureVisibleTab` | Not html2canvas | No library dependency, better quality |
| JPEG 70% | Not PNG | 5-15KB per thumbnail vs 50-100KB |
| Per-URL keying | Not global | Notes are contextual to specific pages |

---

## Known Limitations

| Limitation | Details |
|---|---|
| No iframe support | Content scripts can't access cross-origin iframes |
| Element must be visible | Screenshot requires element in viewport |
| 10MB storage limit | ~200+ notes with screenshots (mitigated by JPEG compression) |
| Chrome only | No Firefox/Safari/Edge support |
| No sourcemap integration | Cannot detect source file paths (planned for v2) |
| Pin position drift | Pins use fixed positioning; dynamic layouts may cause drift |

---

## Performance Considerations

| Area | Optimization |
|---|---|
| DOM overhead | Shadow DOM minimizes layout recalculations |
| Mouse tracking | Debounced `mousemove` handler (implicit via `elementFromPoint`) |
| Screenshot size | Compressed to max 400px width, JPEG 70% quality |
| Storage queries | Keyed by URL for O(1) lookups, no full-scan needed |
| Pin updates | Throttled scroll/resize handlers (50ms debounce) |
| Selector generation | Early termination when unique selector found |

---

## Security

- **No external network requests**: All data stays local
- **No remote code execution**: No `eval()`, no dynamic script loading
- **CSP compliant**: Shadow DOM and inline styles only
- **Minimal permissions**: Only `activeTab`, `storage`, `scripting`
- **No user data collection**: Zero telemetry, zero analytics
