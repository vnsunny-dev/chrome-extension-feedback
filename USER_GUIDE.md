# 📖 Agentation Feedback — User Guide

A complete guide to installing, configuring, and using the Agentation Feedback Chrome extension for your daily frontend development workflow.

---

## Table of Contents

- [Installation](#-installation)
- [First Launch](#-first-launch)
- [Core Workflow](#-core-workflow)
  - [Step 1: Start Inspection](#step-1-start-inspection)
  - [Step 2: Select an Element](#step-2-select-an-element)
  - [Step 3: Write Feedback](#step-3-write-feedback)
  - [Step 4: Save or Copy AI Prompt](#step-4-save-or-copy-ai-prompt)
- [Managing Notes](#-managing-notes)
  - [View All Notes](#view-all-notes)
  - [Jump to Element](#jump-to-element)
  - [Edit a Note](#edit-a-note)
  - [Delete a Note](#delete-a-note)
  - [Clear All Notes](#clear-all-notes)
- [AI Integration](#-ai-integration)
  - [Copy Single Note](#copy-single-note)
  - [Copy All Notes (Batch)](#copy-all-notes-batch)
  - [Using with Claude Code](#using-with-claude-code)
  - [Using with Cursor](#using-with-cursor)
  - [Using with Other AI Tools](#using-with-other-ai-tools)
- [Exporting Notes](#-exporting-notes)
- [Understanding the UI](#-understanding-the-ui)
  - [Extension Popup](#extension-popup)
  - [Floating Note Panel](#floating-note-panel)
  - [Numbered Pins](#numbered-pins)
  - [Badge Counter](#badge-counter)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Tips & Best Practices](#-tips--best-practices)
- [Troubleshooting](#-troubleshooting)
- [FAQ](#-faq)

---

## 🔧 Installation

### Prerequisites

- **Google Chrome** browser (version 88 or later)
- **Developer Mode** enabled in Chrome Extensions

### Step-by-Step Install

#### 1. Download the Extension

**Option A — Clone with Git:**
```bash
git clone https://github.com/your-username/agentation-feedback.git
```

**Option B — Download ZIP:**
1. Download the ZIP file from the repository
2. Extract it to a folder on your computer (e.g., `~/tools/agentation-feedback`)

> ⚠️ **Important**: Remember the folder location — you'll need it in Step 4.

#### 2. Open Chrome Extensions Page

Open Chrome and navigate to:
```
chrome://extensions
```

Or use the menu: **⋮ Menu** → **Extensions** → **Manage Extensions**

#### 3. Enable Developer Mode

Look for the **Developer mode** toggle in the **top-right corner** of the extensions page. Turn it **ON**.

You'll see three new buttons appear: "Load unpacked", "Pack extension", and "Update".

#### 4. Load the Extension

1. Click the **"Load unpacked"** button
2. In the file dialog, navigate to the `agentation-feedback` folder
3. Select the folder (the one containing `manifest.json`) and click **Open**

#### 5. Verify Installation

You should see:
- ✅ **"Agentation Feedback"** appears in the extensions list
- ✅ The extension icon (purple speech bubble with code brackets) appears in your Chrome toolbar
- ✅ No error messages

> 💡 **Tip**: If the icon isn't visible, click the **puzzle piece icon** (🧩) in the toolbar and **pin** Agentation Feedback.

#### 6. Pin the Extension (Recommended)

1. Click the **puzzle piece icon** (🧩) in the Chrome toolbar
2. Find **"Agentation Feedback"** in the list
3. Click the **pin icon** (📌) next to it

The extension icon will now always be visible in your toolbar.

---

## 🎯 First Launch

After installation, test the extension on any website:

1. Navigate to any website (e.g., your localhost dev server or `https://example.com`)
2. Click the **Agentation Feedback icon** in the toolbar
3. A popup opens showing:
   - Extension name and current page URL
   - Stats bar (all zeros since no notes yet)
   - Empty state message: "No notes yet"
   - Action buttons at the bottom

You're ready to start annotating! 🎉

---

## 🔄 Core Workflow

### Step 1: Start Inspection

**Method A — From Popup:**
1. Click the **Agentation Feedback icon** in the toolbar
2. Click the **🔍 Inspect** button

**What happens:**
- The popup closes
- Inspection mode activates on the page
- A toast notification appears: "🔍 Inspection mode — click an element to annotate"
- Your cursor changes to a crosshair

### Step 2: Select an Element

1. **Hover** over elements on the page — each element highlights with a purple border
2. A label appears above the highlighted element showing its tag and classes (e.g., `button.primary`)
3. **Click** on the element you want to annotate

> 💡 **Tip**: To cancel inspection without selecting an element, press **`Escape`**.

### Step 3: Write Feedback

After clicking an element, a **floating panel** appears near it with:

| Section | Description |
|---|---|
| **Element Screenshot** | Auto-captured thumbnail of the element |
| **CSS Selector** | The unique selector for this element (e.g., `.sidebar > button.primary`) |
| **Category** | Dropdown: 🎨 Color, 🔤 Typography, 📐 Spacing, 📏 Layout, 📋 Other |
| **Priority** | Three buttons: 🔴 Critical, 🟡 Major, 🔵 Minor |
| **Feedback** | Textarea to describe the issue |
| **Computed Styles** | Expandable section showing current CSS values |

**Fill in your feedback:**

1. **Select a category** — choose what type of issue it is
2. **Set priority** — click one of the three priority buttons
3. **Write your feedback** — describe what's wrong and what it should be

**Example feedback:**
```
Background color should be #FF5500 per Figma design.
Currently showing #FF6600 — too orange.
```

### Step 4: Save or Copy AI Prompt

At the bottom of the panel, you have three actions:

| Button | Action |
|---|---|
| **🤖 AI Prompt** | Copies a structured prompt to clipboard (for Claude Code, Cursor, etc.) |
| **💾 Save** | Saves the note and places a numbered pin on the element |
| **🗑️ Delete** | Only visible when editing — deletes the note |

**After saving:**
- A numbered, color-coded pin appears on the element
- The badge counter on the extension icon updates
- The note appears in the popup's note list

---

## 📋 Managing Notes

### View All Notes

1. Click the **extension icon** in the toolbar
2. The popup shows all notes for the current page:
   - **Stats bar**: Total notes + breakdown by priority
   - **Note cards**: Each note shows number, category, priority, selector, and description

Notes are sorted by priority: 🔴 Critical first, then 🟡 Major, then 🔵 Minor.

### Jump to Element

Click on any **note card** in the popup → the page scrolls to that element and briefly highlights it with a purple border.

This helps you quickly locate the element on the page without searching.

### Edit a Note

1. Find the **numbered pin** on the page for the note you want to edit
2. **Click the pin** → the floating panel reopens with the existing data
3. Modify the category, priority, or description
4. Click **💾 Save** to update

### Delete a Note

**From the popup:**
1. Hover over a note card
2. Click the **🗑️** (trash) button that appears on the right

**From the floating panel (when editing):**
1. Click the pin on the page to open the note
2. Click the **🗑️** button in the panel

### Clear All Notes

1. Open the popup
2. Click the **🗑️** button in the action bar (bottom right)
3. A confirmation dialog appears: "Clear All Notes?"
4. Click **Delete** to confirm, or **Cancel** to keep your notes

> ⚠️ **Warning**: This action cannot be undone. Consider exporting your notes first.

---

## 🤖 AI Integration

This is the core value of Agentation Feedback — structured prompts that give AI coding tools the exact context they need.

### Copy Single Note

1. **From the floating panel**: Click **🤖 AI Prompt** before or after saving
2. **From the popup**: Hover over a note card → click the **🤖** button

A structured prompt is copied to your clipboard that looks like this:

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

### Copy All Notes (Batch)

1. Open the popup
2. Click the **🤖 Copy All** button in the action bar

This generates a single prompt containing **all notes** for the current page, with a summary header:

```markdown
# Agentation Feedback Report
**Page**: http://localhost:3000/dashboard
**Total Issues**: 10 (🔴 3 Critical, 🟡 5 Major, 🔵 2 Minor)
**Generated**: 2026-08-29T03:00:00Z

Fix all the following frontend issues...

---
[Note 1]
---
[Note 2]
...
```

### Using with Claude Code

1. Copy a note's AI prompt (single or batch)
2. Open **Claude Code** (terminal or IDE)
3. Paste the prompt
4. Claude Code will:
   - Use the CSS selector to `grep` your codebase
   - Find the relevant file and line
   - Apply the fix based on your feedback

**Example workflow:**
```
You: [paste AI prompt]

Claude Code: I found `.sidebar > button.primary` in 
src/components/Sidebar.tsx at line 42. The background 
color is set to '#FF6600'. I'll change it to '#FF5500' 
as specified...
```

### Using with Cursor

1. Copy the AI prompt
2. Open **Cursor** IDE
3. Open the chat (Cmd+L / Ctrl+L)
4. Paste the prompt
5. Cursor will locate the file using the CSS selector and apply the fix

> 💡 **Pro tip**: Use `@codebase` in Cursor to let it search all files for the CSS selector.

### Using with Other AI Tools

The prompt format works with any AI tool that has codebase access:
- **GitHub Copilot Chat** — paste in chat
- **Cody (Sourcegraph)** — paste in chat
- **Windsurf** — paste in chat
- **Aider** — paste as instruction

The key is the **CSS selector** — any AI tool can use it to `grep` and find the right code.

---

## 📥 Exporting Notes

### Export Formats

Click the **📥 Export** button in the popup to choose a format:

| Format | Use Case | File Extension |
|---|---|---|
| **📄 JSON** | Backup, import into other tools, programmatic use | `.json` |
| **📝 Markdown** | Readable report, share with team, documentation | `.md` |
| **📊 CSV** | Spreadsheet analysis, task tracking in Jira/Linear | `.csv` |

### JSON Export

Contains the full note data including computed styles. Good for backup or importing later.

```json
[
  {
    "id": "note_1693000000000_abc123",
    "number": 1,
    "selector": ".sidebar > button.primary",
    "category": "Color",
    "priority": "critical",
    "description": "Background color should be #FF5500",
    "computedStyles": { ... },
    "pageUrl": "http://localhost:3000/dashboard",
    "createdAt": "2026-08-29T03:00:00.000Z"
  }
]
```

### Markdown Export

Same format as the batch AI prompt — a structured report you can share with designers or attach to a PR.

### CSV Export

Flat table format for spreadsheet tools:

```csv
Number,Priority,Category,Selector,Description,Page URL,Created At
1,Critical,Color,".sidebar > button.primary","Background color should be #FF5500",http://localhost:3000/dashboard,2026-08-29T03:00:00.000Z
```

---

## 🖼️ Understanding the UI

### Extension Popup

```
┌──────────────────────────────────┐
│  🎯 Agentation Feedback          │  ← Header with logo & page URL
│  localhost:3000/dashboard         │
├──────────────────────────────────┤
│  [10 Total]  🔴 3  🟡 5  🔵 2    │  ← Stats bar
├──────────────────────────────────┤
│                                   │
│  🔴 1  Color  .btn.primary        │  ← Note cards (click to jump)
│  Background should be #FF5500...  │
│                                   │
│  🟡 2  Typography  h2.title       │
│  Font size should be 16px...      │
│                                   │
│  🔵 3  Spacing  .card             │
│  Padding too wide, should be...   │
│                                   │
├──────────────────────────────────┤
│  [🔍 Inspect] [🤖 Copy All]      │  ← Action bar
│              [📥 Export] [🗑️]     │
└──────────────────────────────────┘
```

### Floating Note Panel

Appears near the clicked element during annotation:

```
┌──────────────────────────────────┐
│  📝 New Feedback Note         ✕  │  ← Header with close button
├──────────────────────────────────┤
│  [Element Screenshot Thumbnail]   │  ← Auto-captured preview
│                                   │
│  .sidebar > button.primary        │  ← CSS selector (read-only)
│                                   │
│  Category: [🎨 Color        ▼]   │  ← Dropdown
│                                   │
│  Priority:                        │
│  [🔴 Critical][🟡 Major][🔵 Minor]│  ← Radio buttons
│                                   │
│  Feedback:                        │
│  ┌──────────────────────────────┐ │
│  │ Background color should be   │ │  ← Textarea
│  │ #FF5500, currently #FF6600   │ │
│  └──────────────────────────────┘ │
│                                   │
│  📊 Computed Styles (12)       ▼  │  ← Expandable accordion
├──────────────────────────────────┤
│  [🤖 AI Prompt]     [💾 Save]    │  ← Action buttons
└──────────────────────────────────┘
```

### Numbered Pins

After saving a note, a small circular badge appears on the element:

- **Position**: Top-right corner of the annotated element
- **Color**: Matches priority (🔴 red, 🟡 yellow, 🔵 blue)
- **Number**: Sequential number for this page
- **Click**: Opens the edit panel for that note

### Badge Counter

The extension icon in the toolbar shows a purple badge with the number of notes for the current page. This updates automatically when you add, edit, or delete notes.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Context | Action |
|---|---|---|
| `Escape` | During inspection | Cancel inspection mode |
| `Escape` | While panel is open | Close the floating panel |

---

## 💡 Tips & Best Practices

### Writing Effective Feedback

**Be specific with values:**
```
✅ "Color should be #FF5500 (Figma: Primary/500)"
❌ "Color is wrong"
```

**Reference the design source:**
```
✅ "Font size should be 16px per Dashboard mockup v2.1"
❌ "Font is too big"
```

**Describe both current and expected state:**
```
✅ "Padding is 24px, should be 16px to match spacing grid"
❌ "Padding is off"
```

### Organizing Your Review

1. **Do one full pass** through the page before fixing anything
2. **Use categories** consistently — they help filter when you have many notes
3. **Set priorities honestly** — not everything is Critical
4. **Export batch AI prompt** after finishing your review, then paste into your AI tool

### Working with Multiple Pages

Notes are stored **per-URL**. When you navigate to a different page:
- The popup shows notes for the new page
- Pins update to show that page's annotations
- Previous page's notes are preserved (visit that URL to see them again)

### Storage Management

- Notes are stored in Chrome's local storage (~10MB limit)
- Each note with screenshot is approximately 10-50KB
- You can safely store 200+ notes before hitting limits
- **Export and clear** periodically if you accumulate many notes

---

## 🔧 Troubleshooting

### Extension icon doesn't appear

1. Click the **puzzle piece** (🧩) in the Chrome toolbar
2. Find "Agentation Feedback" and click the **pin** icon
3. If not listed, go to `chrome://extensions` and check it's enabled

### "Cannot inspect this page" error

Some pages cannot be inspected:
- `chrome://` pages (settings, extensions, etc.)
- Chrome Web Store pages
- PDF viewer
- Browser internal pages

**Solution**: Navigate to a regular website (http/https).

### Pins don't appear after page reload

Pins render based on CSS selectors. If the page structure changed (e.g., different content loaded), some selectors may no longer match.

**Solution**: Open the popup to see all notes — they're still saved. Delete notes whose selectors no longer match.

### Screenshot is blank or missing

Screenshots require the element to be visible in the viewport when captured.

**Causes**:
- Element was partially off-screen
- Element was behind a modal or overlay
- Page has strict Content Security Policy

**Solution**: Scroll so the element is fully visible before clicking.

### Floating panel appears in the wrong position

If the panel overlaps the element or goes off-screen:
- The panel tries to position itself below the element
- If not enough space below, it positions above
- If near screen edges, it shifts horizontally

**Solution**: Scroll so the element is in the center of the viewport before clicking.

### Notes not saving

1. Check if Chrome storage is full: `chrome://settings/content/cookies` → search for extension
2. Try clearing some old notes via Export → Clear
3. Reload the extension in `chrome://extensions`

---

## ❓ FAQ

**Q: Do my notes sync across devices?**
A: Not yet. Notes are stored locally in Chrome. Cloud sync is planned for v2.0.

**Q: Can I use this on mobile (Chrome for Android)?**
A: No. Chrome extensions are only supported on desktop Chrome.

**Q: Does it work with iframes?**
A: No. Elements inside cross-origin iframes cannot be inspected due to browser security restrictions.

**Q: Will it slow down my website?**
A: No. The extension adds minimal DOM overhead (a single Shadow DOM container) and only activates on user interaction.

**Q: Can I import notes from a JSON export?**
A: Not yet. Import functionality is planned for v1.1.

**Q: Does it capture responsive/mobile styles?**
A: Yes. It captures the computed styles at the current viewport size. To check mobile styles, resize your browser or use Chrome DevTools device emulation before annotating.

**Q: What happens if I update the page and elements move?**
A: Pins use CSS selectors to find elements. If the DOM structure changes significantly, some pins may not appear. The notes are still saved — access them via the popup.

---

*Last updated: August 29, 2026*
