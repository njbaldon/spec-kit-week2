# UI & DOM Contract: Quote of the Day

**Feature Branch**: `001-quote-of-the-day`  
**Date**: 2026-10-14  

This contract defines the DOM elements, CSS hook classes, semantic roles, and accessibility attributes required by the application interface.

## 1. Primary Elements & IDs

| Element ID | HTML Tag | Role / ARIA | Description |
| :--- | :--- | :--- | :--- |
| `#quote-card` | `<section>` | `aria-live="polite"` | The main container displaying the current quote |
| `#quote-text` | `<blockquote>` | N/A | Contains the rendered quotation text |
| `#quote-author` | `<cite>` | N/A | Contains the rendered author attribution |
| `#btn-new-quote` | `<button>` | `aria-label="Show new random quote"` | Triggers display of next random quote |
| `#btn-favorite` | `<button>` | `aria-pressed="false|true"`, `aria-label="Toggle favorite"` | Toggles favorite status of the displayed quote |
| `#btn-view-favorites` | `<button>` | `aria-expanded="false|true"` | Toggles visibility of the saved favorites list |
| `#favorites-container` | `<section>` | `aria-label="Saved Favorite Quotes"` | Container showing the list of favorited quotes |
| `#favorites-list` | `<ul>` | N/A | Unordered list of saved quote items |
| `#storage-warning` | `<div>` | `role="alert"`, hidden by default | Banner displayed if `localStorage` is disabled or failing |

---

## 2. Interactive States & Visual Classes

- **Favorite Button Active State**:
  - Class: `.is-favorited` applied to `#btn-favorite` when the current quote is in favorites.
  - Attribute: `aria-pressed="true"`.
- **Favorite Button Inactive State**:
  - Class: `.is-favorited` removed from `#btn-favorite`.
  - Attribute: `aria-pressed="false"`.
- **View Toggle**:
  - Hidden class: `.is-hidden` toggled on `#quote-card` or `#favorites-container` based on `activeView`.
  - Favorites button label updates or toggles between "View Favorites (N)" and "Back to Quote".
- **Favorites List Item States**:
  - Active: Item in `#favorites-list` contains button `.btn-remove-fav` with text `✕ Remove`.
  - In-Session Unfavorited: Item receives `.is-unfavorited` class (muted presentation); button switches to `.btn-refavorite` with text `+ Refavorite` allowing immediate reversal. Row remains in list until page reload.

---

## 3. Keyboard & Screen Reader Accessibility
- All interactive controls (`#btn-new-quote`, `#btn-favorite`, `#btn-view-favorites`) are standard focusable `<button>` elements.
- When `#btn-new-quote` is activated, `#quote-card` announces updated text via `aria-live="polite"` without resetting page focus.
