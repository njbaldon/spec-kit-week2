# Storage Service Contract: Quote of the Day

**Feature Branch**: `001-quote-of-the-day`  
**Date**: 2026-10-14  

This contract defines the interface and error handling rules for the persistence layer (`storage.js`).

## 1. Storage Interface Definition

```typescript
export interface IStorageService {
  /**
   * Returns whether persistent browser storage is functional.
   */
  isAvailable(): boolean;

  /**
   * Retrieves the set of favorited quote IDs.
   * If storage is empty or unavailable, returns an empty array.
   */
  getFavorites(): string[];

  /**
   * Saves the complete array of favorited quote IDs.
   * Deduplicates entries before saving.
   * Returns true if successfully saved to localStorage, false if fallen back to memory.
   */
  saveFavorites(ids: string[]): boolean;

  /**
   * Adds a single quote ID to favorites.
   */
  addFavorite(id: string): boolean;

  /**
   * Removes a single quote ID from favorites.
   */
  removeFavorite(id: string): boolean;

  /**
   * Clears all saved favorites (useful for testing or reset).
   */
  clear(): void;
}
```

## 2. Invariants & Error Handling
- **Non-throwing Guarantee**: Methods MUST NOT throw uncaught runtime exceptions to callers. Any storage exception (`QuotaExceededError`, `SecurityError`, parse error) must be caught internally.
- **Data Integrity**: If parsed JSON from storage is malformed or not an array, `getFavorites()` must reset to an empty list or fall back gracefully without corrupting subsequent writes.
- **Storage Key**: Fixed key `qod_favorites_v1` ensures versioned scoping.
