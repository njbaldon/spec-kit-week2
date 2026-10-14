# Quickstart & Validation Guide: Quote of the Day

**Feature Branch**: `001-quote-of-the-day`  
**Date**: 2026-10-14  

This guide provides end-to-end instructions for running the application, executing automated tests, and manually verifying the core feature scenarios.

---

## 1. Prerequisites
- Modern web browser (Chrome, Safari, Firefox, Edge).
- Node.js (v20+ or v22+) installed locally for running automated test suites.

---

## 2. Running Automated Tests

Run the native test suite using Node.js:

```bash
# Execute unit and integration tests
node --test tests/**/*.test.js
```

### Expected Output:
```text
✔ quote-manager > initial load selects a valid quote
✔ quote-manager > getRandomQuote never immediately repeats current quote
✔ quote-manager > toggleFavorite persists quote ID and updates state
✔ storage > handles localStorage writes, reads, and corruption fallbacks
✔ integration > full flow from random quote to persistence reload
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

---

## 3. Running the Web Application

Because the application uses native ES Modules, it can be served using any lightweight static HTTP server:

```bash
# Option A: Python 3 built-in HTTP server
python3 -m http.server 8080 --directory src

# Option B: Node.js npx serve
npx --yes serve src
```

Open your browser to `http://localhost:8080`.

---

## 4. Manual Verification Walkthrough

Follow these steps to validate the user stories described in [spec.md](./spec.md):

### Scenario A: Initial Quote Display (User Story 1 - P1)
1. Open `http://localhost:8080` in the browser.
2. **Verify**: A quote block is immediately visible with quotation text and author name.
3. **Verify**: The favorite button (#btn-favorite) indicates inactive state (unfavorited).

### Scenario B: Request New Quote (User Story 2 - P2)
1. Click the **"New quote"** button (#btn-new-quote).
2. **Verify**: The displayed quote updates immediately (<200ms) with new quote text and author.
3. **Verify**: The newly displayed quote is different from the previous quote.

### Scenario C: Favoriting and Persistence (User Story 3 - P3)
1. On the currently displayed quote, click the **Favorite** button (#btn-favorite).
2. **Verify**: The button changes to its active favorited state (e.g., filled icon / active style).
3. Reload the browser page (`Cmd+R` / `F5`).
4. Click "New quote" until the favorited quote appears again (or open Favorites view).
5. **Verify**: The quote retains its favorited state after page reload.

### Scenario D: View Favorites List (User Story 4 - P4)
1. Click the **"View Favorites"** button (#btn-view-favorites).
2. **Verify**: The favorites list displays all quotes that have been marked as favorites.
3. Click the unfavorite action for an item in the favorites list.
4. **Verify**: The item is removed from the list and storage is updated.
