# Quote of the Day Web Application

A lightweight, zero-dependency client-side single-page web application that displays an inspirational quote of the day with author attribution from a built-in curated collection. Features non-repeating random quote generation, personal favoriting with browser `localStorage` persistence, and a saved favorites review panel.

Built with plain semantic HTML5, modern vanilla CSS3, and native ES6 JavaScript modules.

---

## Features

- **Quote of the Day (P1 / MVP)**: Immediately displays a random inspirational quote with author attribution on page load.
- **Dynamic Exploration (P2)**: Interactive "New quote" button selects another quote from the collection without immediate repetition ($O(1)$ non-repeating algorithm).
- **Personal Favoriting & Persistence (P3)**: Heart button allows favoriting/un-favoriting quotes with persistent storage in browser `localStorage`. Gracefully falls back to in-memory state in restricted/private browsing modes.
- **Favorites Review (P4)**: Dedicated panel allows reviewing all saved favorite quotes and removing quotes directly from the list.

---

## Getting Started

### Prerequisites
- Any modern web browser (Chrome, Firefox, Safari, Edge).
- Node.js (v20+ or v22+) for running automated test suites.

### Running the Application

Because the app uses native ES Modules (`<script type="module">`), serve the `src/` directory with any static web server:

```bash
# Option A: Python 3
python3 -m http.server 8080 --directory src

# Option B: Node.js npx serve
npx serve src
```

Open your browser to `http://localhost:8080`.

---

## Running Automated Tests

The project includes unit and integration tests using Node.js's built-in test runner (`node:test`) and assertion library (`node:assert`). No third-party dependencies are required.

```bash
npm test
```

Expected output:
```text
✔ Integration: End-to-End Quote Browsing & LocalStorage Persistence Across Reloads
✔ QuoteManager - User Story 1: Initial quote selection on load
✔ QuoteManager - User Story 2: Non-repeating random quote selection
✔ QuoteManager - User Story 3: Favorite and Unfavorite Toggling
✔ QuoteManager - User Story 4: View and retrieve saved favorite quotes
✔ StorageService - Persistence & Fallback
ℹ tests 21
ℹ pass 21
ℹ fail 0
```

---

## Project Structure

```text
├── src/
│   ├── index.html           # Main application shell with accessibility landmarks
│   ├── css/
│   │   └── styles.css       # Clean responsive styles and accessible states
│   └── js/
│       ├── quotes.js        # Curated dataset of built-in quotes
│       ├── storage.js       # LocalStorage service with in-memory fallback
│       ├── quote-manager.js # Pure domain logic: randomizer & favorite state
│       └── app.js           # UI Controller and DOM event handlers
├── tests/
│   ├── unit/
│   │   ├── quote-manager.test.js  # Tests for selection, repetition & favorites
│   │   └── storage.test.js        # Tests for storage, deduplication & fallback
│   └── integration/
│       └── app-flow.test.js       # End-to-end multi-session reload simulation
├── specs/001-quote-of-the-day/    # Feature specifications, plans, and tasks
├── package.json
└── README.md
```
