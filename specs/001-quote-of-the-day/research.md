# Research & Technical Decisions: Quote of the Day with Favoriting

**Feature Branch**: `001-quote-of-the-day`  
**Date**: 2026-10-14  
**Status**: Completed  

## 1. Application Architecture & Vanilla JS Structure

### Decision
Implement the application using standard semantic HTML5, modern vanilla CSS3, and standard ES6 modules (`type="module"` in `<script>`) without a compiler, bundler, or front-end framework.

The client codebase is structured into four focused layers:
1. `quotes.js`: Curated, immutable dataset of built-in quotes.
2. `storage.js`: Persistence service abstracting browser `localStorage` with in-memory fallback.
3. `quote-manager.js`: Pure domain service handling quote selection, immediate-repeat prevention, and favorite state manipulation.
4. `app.js`: UI orchestrator handling DOM events, view rendering, and accessibility.

### Rationale
- Complies strictly with the user request: "Use plain HTML/CSS/JavaScript, no backend".
- Satisfies Constitution Principle I (Clean Architecture & Modular Design) and Principle III (Simplicity & YAGNI).
- Native ES Modules run directly in all modern browsers without needing build tools (Vite, Webpack, Babel), eliminating tooling churn.
- Decoupling domain logic (`quote-manager.js`) from DOM manipulation (`app.js`) enables 100% automated unit testing under Node.js without browser emulation.

### Alternatives Considered
- **Single monolithic `script.js`**: Rejected because mixing DOM queries, persistence, and algorithmic quote selection violates single-responsibility principles and prevents isolated unit testing.
- **Frontend Framework (React, Vue, Svelte)**: Rejected because it violates user constraints, introduces heavy dependencies, and violates YAGNI for a single-page quote generator.

---

## 2. Persistence & LocalStorage Fallback Strategy

### Decision
Persist favorite quote identifiers in `window.localStorage` under the key `qod_favorites_v1` serialized as a JSON array of strings (e.g. `["q-1", "q-4"]`).

Wrap all storage operations inside a defensive `StorageService` class/module that:
1. Detects `localStorage` availability via feature detection.
2. Wraps read/write/delete calls in `try...catch` blocks to gracefully handle `QuotaExceededError`, `SecurityError` (common in restricted iframes or private browsing modes), and corrupted JSON.
3. Automatically falls back to an internal in-memory `Set` if `localStorage` is disabled or throws an exception, notifying the UI state via an error or warning callback.

### Rationale
- Fulfills the explicit user requirement: "persist favorites in localStorage".
- Fulfills Functional Requirement FR-007 and FR-008.
- Satisfies Edge Case "Persistence Storage Unavailable" from the feature specification, ensuring the app never crashes when storage is restricted.

### Alternatives Considered
- **IndexedDB**: Rejected because an asynchronous transaction API is vastly over-engineered for storing dozens of quote ID strings.
- **Direct un-abstracted `localStorage.setItem()` calls in UI event handlers**: Rejected because unhandled storage exceptions in private/incognito modes cause unhandled runtime errors, breaking user interaction.
- **Cookies**: Rejected due to size limits, header bloat, and lack of need for server transmission.

---

## 3. Quote Selection & Repetition Avoidance

### Decision
Implement an $O(1)$ deterministic non-repeating random selection algorithm in `quote-manager.js`:
- If the collection length $N \le 1$, return the current quote (or only quote).
- If $N > 1$ and a quote is currently displayed at index $i$, pick an offset $k$ uniformly at random from $\{1, 2, \dots, N - 1\}$ and select index $j = (i + k) \pmod N$.

### Rationale
- Fulfills FR-004 ("preventing immediate repetition of the currently displayed quote").
- Guarantees that the new quote is strictly different from the current quote in a single operation without while-loop retries or nondeterministic re-rolls.
- Avoids state overhead associated with shuffling entire arrays or managing dynamic pools.

### Alternatives Considered
- **While-loop rejection sampling (`while (newIndex === currentIndex)` )**: Rejected because it relies on probabilistic re-rolls; while unlikely to loop extensively, it is nondeterministic and requires special handling when $N=1$.
- **Full array shuffle / deck exhaustion**: Rejected as unnecessary state complexity for simple random browsing.

---

## 4. Automated Testing Strategy

### Decision
Execute automated tests using Node.js built-in test runner (`node:test`) and assertion library (`node:assert`) with native ES module support (`"type": "module"` in `package.json`).

Test suites:
1. `tests/unit/quote-manager.test.js`: Validates random selection, repeat prevention, edge cases ($N=0, 1, 2$), and favorite toggle operations.
2. `tests/unit/storage.test.js`: Validates serialization, deserialization, corrupted data handling, and in-memory fallback behavior.
3. `tests/integration/app-flow.test.js`: Validates the end-to-end business flow across `StorageService` and `QuoteManager`.

### Rationale
- Complies strictly with Constitution Principle II (Automated testing mandatory) and Principle V (Automated Quality Gates).
- Requires zero third-party npm packages; runs natively using the environment's Node.js v22.13.0 installation.
- Fast execution (<100ms) with zero build overhead.

### Alternatives Considered
- **Jest / Vitest**: Rejected because introducing external test runners and their transpile dependencies adds unnecessary complexity for plain ES modules.
- **Manual verification only**: Rejected because it violates Constitution Principle II.
