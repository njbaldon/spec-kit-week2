# Data Model: Quote of the Day with Favoriting

**Feature Branch**: `001-quote-of-the-day`  
**Date**: 2026-10-14  
**Status**: Completed  

## 1. Entities & Schemas

### 1.1 Quote Entity
Represents an individual quotation in the curated collection.

| Field | Type | Required | Description | Validation Rules |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `string` | Yes | Unique identifier for the quote | Non-empty, alphanumeric with dashes (e.g., `"quote-001"`). Must be unique within the dataset. |
| `text` | `string` | Yes | The quotation text content | Non-empty trimmed string, min length 5 characters. |
| `author` | `string` | Yes | Name of the quoted individual | Non-empty trimmed string, min length 2 characters. |
| `category` | `string` | No | Optional thematic classification | Optional string (e.g., `"Inspiration"`, `"Philosophy"`). |

```json
{
  "id": "quote-001",
  "text": "The only way to do great work is to love what you do.",
  "author": "Steve Jobs",
  "category": "Inspiration"
}
```

---

### 1.2 Favorite State & Storage Schema
Represents the collection of quotes favorited by the user on their device.

#### In-Memory Domain Model
In application runtime memory, favorites are represented as a `Set<string>` containing the quote `id`s:
```typescript
favorites: Set<string>
```

#### Persistent LocalStorage Schema
Stored in `window.localStorage` under the key `qod_favorites_v1`:
- **Format**: Serialized JSON array of unique string IDs.
- **Example**:
```json
["quote-001", "quote-004", "quote-012"]
```

#### Storage Validation Rules
1. On read: Parsed value must be an Array. Any item that is not a non-empty string or does not match a known quote ID is sanitized or discarded.
2. On write: Value must be an array of unique strings. Array is deduplicated before serialization.
3. Fallback: If `localStorage` throws or is unavailable, in-memory `Set` serves as transient storage for the session.

---

### 1.3 Application State (`AppState`)
Represents the runtime state of the client application.

```typescript
interface AppState {
  quotes: Quote[];                 // Full immutable collection of quotes
  currentQuote: Quote | null;      // Currently active quote
  currentIndex: number;            // Current index in quotes array (-1 if empty)
  favorites: Set<string>;          // Set of favorited quote IDs
  isStorageAvailable: boolean;     // False if localStorage is restricted/disabled
  activeView: 'single' | 'favorites'; // Active UI view mode
}
```

---

## 2. State Transitions & Lifecycle

```
[APP LOAD]
    │
    ▼
[State: INIT] ──► Read favorites from StorageService
    │         ──► Pick initial random quote
    │         ──► Render initial quote view
    ▼
[State: VIEWING_QUOTE]
    │
    ├──► Action: NEW_QUOTE ──► Pick new non-repeating index ──► Update currentQuote & UI
    │
    ├──► Action: TOGGLE_FAVORITE ──► Add/Remove from favorites Set
    │                                ──► Persist to StorageService
    │                                ──► Update Favorite Button UI
    │
    └──► Action: TOGGLE_VIEW ──► Switch activeView ('single' <-> 'favorites')
                                 ──► Render Favorites List or Return to Quote
```

### Transition Invariants
- `currentQuote` must never be `null` after initialization as long as `quotes.length > 0`.
- Calling `NEW_QUOTE` when `quotes.length > 1` must result in `nextIndex !== previousIndex`.
- Toggling favorite for `quoteId` must be strictly idempotent with respect to double-clicks (state flips exactly once per user gesture).
