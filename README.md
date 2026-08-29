# 🎯 Agentation Feedback

**Click. Annotate. Copy. Let AI fix your frontend.**

A Chrome extension that lets developers click any element on their website, annotate it with structured feedback (wrong color, font size, spacing, etc.), and copy AI-ready prompts with CSS selectors & computed styles — ready to paste into **Claude Code**, **Cursor**, or any AI coding tool.

---

## 🧩 The Problem

You're building a website, comparing it against a Figma design. You spot issues:

- ❌ Button color is `#FF6600` instead of `#FF5500`
- ❌ Heading font-size is `18px` instead of `16px`
- ❌ Card padding is too wide

You take manual notes. 10 notes. 20 notes. 50 notes. Rechecking becomes a nightmare.

When you ask an AI coding tool to fix these issues, you have to describe elements by hand:
> *"The blue button in the sidebar... no, the other one... the one with the icon..."*

The AI guesses. Often wrong.

## 💡 The Solution

**Agentation Feedback** gives your AI agent everything it needs:

```
CSS Selector:  .sidebar > button.primary
Computed:      background-color: rgb(255, 102, 0)
Feedback:      Should be #FF5500
```

The AI can now `grep` for `.sidebar > button.primary` in your codebase and fix it in seconds.

---

## ✨ Features

### 🎯 Click-to-Annotate
Click any element on the page to create a feedback note. No DevTools needed.

### 📌 Visual Pins
Numbered, color-coded pins appear on annotated elements:
- 🔴 **Critical** — Must fix before launch
- 🟡 **Major** — Should fix
- 🔵 **Minor** — Nice to fix

### 🤖 AI-Ready Prompts
One-click copy a structured prompt containing:
- CSS selector to grep your codebase
- Computed styles showing current appearance
- Your feedback with intent
- Instructions for the AI agent

### 🎨 Auto-Capture
When you click an element, the extension automatically captures:
- **CSS selector** (unique, human-readable)
- **Computed styles** (color, typography, spacing)
- **Element screenshot** (thumbnail preview)

### 📊 Smart Categorization
Each note has:
- **Category**: Color, Typography, Spacing, Layout, Other
- **Priority**: Critical, Major, Minor

### 📋 Batch Export
Export all notes at once:
- **🤖 Copy All as AI Prompt** — one mega-prompt for all issues
- **📄 JSON** — structured data for programmatic use
- **📝 Markdown** — readable report
- **📊 CSV** — spreadsheet-friendly

### 💾 Persistent Storage
Notes are saved per-URL in Chrome local storage. Reload the page — your pins are still there.

### 🛡️ Shadow DOM Isolation
All extension UI lives inside a Shadow DOM container, so it never conflicts with the host page's styles.

---

## 🚀 Quick Start

### Installation

1. **Clone or download** this repository:
   ```bash
   git clone https://github.com/your-username/agentation-feedback.git
   ```

2. Open **Chrome** and navigate to:
   ```
   chrome://extensions
   ```

3. Enable **Developer Mode** (top-right toggle)

4. Click **"Load unpacked"** → select the `agentation-feedback` folder

5. The extension icon appears in your toolbar! 🎉

### Usage

#### 1. Start Inspection
Click the extension icon → Click **🔍 Inspect**

#### 2. Select an Element
Hover over elements to see them highlighted. Click to select.

#### 3. Write Feedback
A floating panel appears near the element with:
- Auto-captured CSS selector and computed styles
- Category dropdown and priority selector
- Textarea for your feedback

#### 4. Save or Copy
- **💾 Save** — saves the note, adds a numbered pin
- **🤖 AI Prompt** — copies a structured prompt to clipboard

#### 5. Review Notes
Click the extension icon to see all notes for the current page, with stats and quick actions.

#### 6. Export
Use the export button to download as JSON, Markdown, or CSV. Or "Copy All" to get a batch AI prompt.

---

## 🤖 AI Integration

### How It Works

When you click **"🤖 AI Prompt"**, the extension copies a structured text block like this:

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
| font-size | 14px |
| font-weight | 600 |

### Feedback
Background color should be #FF5500, currently showing #FF6600.

### Instructions
Find the element matching CSS selector `.sidebar > button.primary` in the codebase
and fix the issue described above.
```

### Paste into Your AI Tool

1. **Claude Code**: Paste the prompt directly into your conversation
2. **Cursor**: Paste in the chat or use `@codebase` with the selector
3. **GitHub Copilot Chat**: Paste and ask it to fix the issue
4. **Any AI tool with codebase access**: The CSS selector lets the AI grep and find the exact file

---

## 🏗️ Tech Stack

| Component | Technology |
|---|---|
| Extension API | Chrome Manifest V3 |
| Language | Vanilla JavaScript (ES2020+) |
| Styling | Vanilla CSS |
| Storage | `chrome.storage.local` |
| UI Isolation | Shadow DOM |
| Screenshots | `captureVisibleTab` + Canvas |

---

## 📁 Project Structure

```
agentation-feedback/
├── manifest.json              # Extension manifest (MV3)
├── README.md                  # This file
├── TECH_DOCUMENT.md           # Technical architecture
├── icons/
│   ├── icon16.png             # Toolbar icon
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png            # Store/install icon
├── popup/
│   ├── popup.html             # Popup structure
│   ├── popup.css              # Premium dark theme
│   └── popup.js               # Note list, stats, export
├── content/
│   ├── content.css            # Host page root container
│   └── content.js             # Inspection, annotation, pins
├── background/
│   └── background.js          # Badge, screenshots, routing
└── utils/
    ├── storage.js             # CRUD operations
    ├── selector.js            # CSS selector generator
    ├── styles-capture.js      # Computed styles extractor
    ├── screenshot.js          # Element screenshot capture
    └── export.js              # Export formatters
```

---

## 🗺️ Roadmap

### v1.1
- [ ] Import notes from JSON file
- [ ] Expected value field (e.g., "should be #FF5500")
- [ ] Status tracking (Open / Fixed / Won't Fix)
- [ ] Keyboard shortcuts for common actions

### v1.2
- [ ] Figma design overlay comparison
- [ ] PixelPerfect integration
- [ ] React/Vue component tree detection

### v2.0
- [ ] Source file path detection via sourcemaps
- [ ] Cloud sync for team collaboration
- [ ] Screenshot comparison (before/after)
- [ ] Direct API integration with AI tools

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Credits

Inspired by [Agentation](https://agentation.com) — the gold standard for AI-powered design feedback.

Built with ❤️ for developers who care about pixel-perfect UIs.
