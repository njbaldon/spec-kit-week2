# Quote of the Day Web Application

A lightweight, zero-dependency client-side single-page web application that displays an inspirational quote of the day with author attribution from a built-in curated collection. Features non-repeating random quote generation, personal favoriting with browser `localStorage` persistence, a saved favorites review panel, and **in-session refavoriting** — unfavorited items stay visible in the list during the current session so accidental removals can be undone instantly.

Built with plain semantic HTML5, modern vanilla CSS3, and native ES6 JavaScript modules.

---

## Features

- **Quote of the Day (P1 / MVP)**: Immediately displays a random inspirational quote with author attribution on page load.
- **Dynamic Exploration (P2)**: Interactive "New quote" button selects another quote from the collection without immediate repetition ($O(1)$ non-repeating algorithm).
- **Personal Favoriting & Persistence (P3)**: Heart button allows favoriting/un-favoriting quotes with persistent storage in browser `localStorage`. Gracefully falls back to in-memory state in restricted/private browsing modes.
- **Favorites Review & In-Session Refavoriting (P4)**: Dedicated panel shows all saved favorite quotes. When you remove a quote from the list, it stays visible (muted with a dashed border) with a green **+ Refavorite** button until you reload — so accidental removals are instantly recoverable. The removed quote's persistent favorite state is cleared immediately; only refavoriting it restores persistence.

---

## How In-Session Refavoriting Works

1. Open the **Favorites** panel (click "View Favorites").
2. Click **✕ Remove** on any quote — it is immediately removed from `localStorage` but the row stays in the list with a muted appearance.
3. Changed your mind? Click **+ Refavorite** to restore the quote to your permanent favorites.
4. On the next page reload, any rows left in the "removed" state will no longer appear.

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
✔ Integration: In-Session Refavoriting — unfavorited row is retained until reload
✔ QuoteManager - User Story 1: Initial quote selection on load
✔ QuoteManager - User Story 2: Non-repeating random quote selection
✔ QuoteManager - User Story 3: Favorite and Unfavorite Toggling
✔ QuoteManager - User Story 4: View and retrieve saved favorite quotes
✔ QuoteManager - User Story 4: getQuoteById() lookup
✔ StorageService - Persistence & Fallback
ℹ tests 26
ℹ pass 26
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
│       ├── quote-manager.js # Pure domain logic: randomizer, favorite state & getQuoteById()
│       └── app.js           # UI Controller: event handlers, sessionFavorites & in-session retention
├── tests/
│   ├── unit/
│   │   ├── quote-manager.test.js  # Tests for selection, repetition, favorites & getQuoteById()
│   │   └── storage.test.js        # Tests for storage, deduplication & fallback
│   └── integration/
│       └── app-flow.test.js       # Multi-session reload + in-session refavoriting simulation
├── specs/001-quote-of-the-day/    # Feature specifications, plans, and tasks
├── package.json
└── README.md
```
