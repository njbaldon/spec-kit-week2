# Tasks: Quote of the Day with Favoriting

**Branch**: `001-quote-of-the-day` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

This document contains the actionable, dependency-ordered task breakdown for implementing the Quote of the Day feature. Tasks are strictly organized by user story phases to enable independent delivery and testing.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, directory structure, and runtime tooling configuration.

- [X] T001 Create project directory structure for `src/` and `tests/` directories per `specs/001-quote-of-the-day/plan.md`
- [X] T002 Initialize project configuration with `"type": "module"` and test runner script `"test": "node --test tests/**/*.test.js"` in `package.json`
- [X] T003 [P] Create base HTML5 shell with viewport metadata, stylesheet link, and module script tags in `src/index.html`
- [X] T004 [P] Create CSS foundation with modern reset, custom properties, and typography in `src/css/styles.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared datasets and services that MUST be completed before user story implementation can begin.

**⚠️ CRITICAL**: No user story work can begin until this foundational phase is complete.

- [X] T005 Create curated built-in quote dataset in `src/js/quotes.js` containing at least 15 quotes enforcing constraints verbatim: `id` (non-empty alphanumeric with dashes, unique within dataset), `text` (non-empty trimmed string, min length 5 characters), `author` (non-empty trimmed string, min length 2 characters), and optional `category`
- [X] T006 [P] Implement `StorageService` in `src/js/storage.js` adhering to `specs/001-quote-of-the-day/contracts/storage-contract.md` using key `qod_favorites_v1` with JSON array parsing, deduplication, and defensive fallback to an in-memory `Set` on errors

**Checkpoint**: Foundation ready — user story implementation can now proceed.

---

## Phase 3: User Story 1 - Display Quote on Page Load (Priority: P1) 🎯 MVP

**Goal**: When a visitor navigates to the page, display a single quote drawn at random from the built-in library with quotation text and author attribution.

**Independent Test**: Load `src/index.html` in a web browser; verify that a quotation and author attribution from `src/js/quotes.js` are immediately visible in `#quote-card` without user interaction.

### Tests for User Story 1 ⚠️

> *Write these tests FIRST and ensure they fail before implementing the story components.*

- [X] T007 [P] [US1] Write unit test for initial quote selection and quote schema verification in `tests/unit/quote-manager.test.js`
- [X] T008 [US1] Implement `QuoteManager` class constructor and `getCurrentQuote()` in `src/js/quote-manager.js` adhering to `specs/001-quote-of-the-day/contracts/quote-service-contract.md` to select and return an initial random quote
- [X] T009 [P] [US1] Add semantic quote card elements `#quote-card`, `#quote-text` (`<blockquote>`), and `#quote-author` (`<cite>`) with `aria-live="polite"` in `src/index.html`
- [X] T010 [P] [US1] Style quote card container, typography, and responsive spacing in `src/css/styles.css`
- [X] T011 [US1] Wire application startup in `src/js/app.js` to instantiate `QuoteManager` and render initial quote to `#quote-text` and `#quote-author` on page load

**Checkpoint**: User Story 1 (MVP) is fully functional and independently testable.

---

## Phase 4: User Story 2 - Request a New Random Quote (Priority: P2)

**Goal**: Clicking the "New quote" button selects and displays another random quote from the collection without immediate repetition.

**Independent Test**: Click `#btn-new-quote`; verify `#quote-text` and `#quote-author` update to a different quote from the collection without reloading the page.

### Tests for User Story 2 ⚠️

- [X] T012 [P] [US2] Write unit test in `tests/unit/quote-manager.test.js` verifying `getRandomQuote()` avoids immediate repeat when collection length $N \ge 2$ and handles $N \le 1$
- [X] T013 [US2] Implement $O(1)$ non-repeating random selection algorithm in `getRandomQuote()` in `src/js/quote-manager.js`
- [X] T014 [P] [US2] Add `#btn-new-quote` button with `aria-label="Show new random quote"` in `src/index.html`
- [X] T015 [P] [US2] Style `#btn-new-quote` button layout, hover, focus, and active states in `src/css/styles.css`
- [X] T016 [US2] Bind click event listener on `#btn-new-quote` to invoke `getRandomQuote()` and update DOM in `src/js/app.js`

**Checkpoint**: User Stories 1 and 2 work independently and seamlessly together.

---

## Phase 5: User Story 3 - Favorite and Unfavorite Quotes with Persistence (Priority: P3)

**Goal**: Allow users to toggle favorite status on any displayed quote, update visual state, and persist favorites in `localStorage` across page reloads.

**Independent Test**: Click `#btn-favorite` on a quote, observe `.is-favorited` class and `aria-pressed="true"`, reload the page, and verify the favorite status remains active.

### Tests for User Story 3 ⚠️

- [X] T017 [P] [US3] Write unit tests for `StorageService` in `tests/unit/storage.test.js` verifying save, read, deduplication, JSON corruption handling, and in-memory fallback
- [X] T018 [P] [US3] Write unit tests for `toggleFavorite(quoteId)` and `isFavorited(quoteId)` in `tests/unit/quote-manager.test.js`
- [X] T019 [US3] Implement `toggleFavorite(quoteId)` and `isFavorited(quoteId)` in `src/js/quote-manager.js` integrating with `StorageService`
- [X] T020 [P] [US3] Add `#btn-favorite` with `aria-pressed="false"`, `aria-label="Toggle favorite"`, and `#storage-warning` alert container in `src/index.html`
- [X] T021 [P] [US3] Add styling for `#btn-favorite`, `.is-favorited` active state, and `#storage-warning` alert banner in `src/css/styles.css`
- [X] T022 [US3] Wire `#btn-favorite` click handling and storage error alerts to synchronize UI state in `src/js/app.js`
- [X] T023 [US3] Write end-to-end integration test in `tests/integration/app-flow.test.js` verifying quote navigation, favoriting, and persistent reload flow

**Checkpoint**: User Stories 1, 2, and 3 are functional with persistent state.

---

## Phase 6: User Story 4 - View Saved Favorites (Priority: P4)

**Goal**: Provide a view displaying all favorited quotes with their text and author, and allow removing quotes from favorites directly from the list.

**Independent Test**: Favorite one or more quotes, click `#btn-view-favorites`, verify `#favorites-list` displays all favorited quotes, and removing an item updates the list and persistence.

### Tests for User Story 4 ⚠️

- [X] T024 [P] [US4] Write unit test for `getFavoriteQuotes()` and empty state handling in `tests/unit/quote-manager.test.js`
- [X] T025 [US4] Implement `getFavoriteQuotes()` in `src/js/quote-manager.js` returning full `Quote` objects matching stored favorite IDs
- [X] T026 [P] [US4] Add `#btn-view-favorites`, `#favorites-container` with `aria-label="Saved Favorite Quotes"`, and `#favorites-list` in `src/index.html`
- [X] T027 [P] [US4] Style `#favorites-container`, favorite items, empty state message, and `.is-hidden` utility in `src/css/styles.css`
- [X] T028 [US4] Implement view toggle between quote card and favorites list, and bind item unfavorite actions in `src/js/app.js`

**Checkpoint**: All user stories (P1 through P4) are fully functional and independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification, test suite pass, documentation, and final validation.

- [X] T029 [P] Validate end-to-end manual walkthrough scenarios per `specs/001-quote-of-the-day/quickstart.md`
- [X] T030 Run full automated test suite via `node --test tests/**/*.test.js` and verify 100% pass rate with zero failures
- [X] T031 [P] Add user documentation and execution instructions in `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

```
[Phase 1: Setup]
       │
       ▼
[Phase 2: Foundational]
       │
       ├─────────────────────────┬─────────────────────────┬─────────────────────────┐
       ▼                         ▼                         ▼                         ▼
[Phase 3: US1 (P1)]       [Phase 4: US2 (P2)]       [Phase 5: US3 (P3)]       [Phase 6: US4 (P4)]
       │                         │                         │                         │
       └─────────────────────────┴─────────────────────────┴─────────────────────────┘
                                           │
                                           ▼
                                [Phase 7: Polish & Validation]
```

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup (T001, T002). Blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion (T005). Delivers the MVP.
- **User Story 2 (Phase 4)**: Depends on US1 domain model in `src/js/quote-manager.js`.
- **User Story 3 (Phase 5)**: Depends on Foundational storage (T006) and US1 quote manager.
- **User Story 4 (Phase 6)**: Depends on US3 favoriting state in `src/js/quote-manager.js`.
- **Polish (Phase 7)**: Depends on all stories being complete.

---

## Parallel Execution Examples

### Parallel Example: User Story 1
```bash
# Author tests and UI markup in parallel:
Task T007: "Write unit test for initial quote selection in tests/unit/quote-manager.test.js"
Task T009: "Add semantic quote card elements in src/index.html"
Task T010: "Style quote card container in src/css/styles.css"
```

### Parallel Example: User Story 3
```bash
# Author storage unit tests and favorite button markup concurrently:
Task T017: "Write unit tests for StorageService in tests/unit/storage.test.js"
Task T018: "Write unit tests for toggleFavorite in tests/unit/quote-manager.test.js"
Task T020: "Add #btn-favorite and #storage-warning in src/index.html"
Task T021: "Add styling for #btn-favorite in src/css/styles.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Setup: T001–T004)
2. Complete Phase 2 (Foundational: T005, T006)
3. Complete Phase 3 (User Story 1: T007–T011)
4. **Validate**: Open `src/index.html` to verify quote of the day renders immediately.

### Incremental Delivery
1. Foundation + US1 → Core MVP (Quote of the day displayed).
2. Add US2 → Interactive browsing ("New quote" non-repeating random selection).
3. Add US3 → Personalization (Favorite toggling and `localStorage` persistence).
4. Add US4 → Collection review (Dedicated favorites list and item removal).
5. Polish → Verification against `quickstart.md`, 100% test pass with `node --test`.
