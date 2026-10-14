# Quote Service Contract: Quote of the Day

**Feature Branch**: `001-quote-of-the-day`  
**Date**: 2026-10-14  

This contract defines the programmatic interface for `QuoteManager` in `quote-manager.js`.

## 1. Interface Definition

```typescript
export interface IQuoteManager {
  /**
   * Initializes the manager with a quote list and optional StorageService.
   */
  constructor(quotes: Quote[], storage?: IStorageService);

  /**
   * Returns the currently active quote. Returns null only if collection is empty.
   */
  getCurrentQuote(): Quote | null;

  /**
   * Selects and returns a new random quote from the collection.
   * If collection has 2 or more quotes, the returned quote MUST NOT be the current quote.
   */
  getRandomQuote(): Quote | null;

  /**
   * Toggles favorite status for a given quote ID (or current quote if omitted).
   * Returns boolean representing the new favorite state (true = favorited, false = unfavorited).
   */
  toggleFavorite(quoteId?: string): boolean;

  /**
   * Checks if a given quote ID is currently favorited.
   */
  isFavorited(quoteId: string): boolean;

  /**
   * Returns an array of all Quote objects currently marked as favorites.
   */
  getFavoriteQuotes(): Quote[];

  /**
   * Returns the count of total quotes in the library.
   */
  getTotalQuoteCount(): number;
}
```

## 2. Invariants & Guarantees
- **No Immediate Repetition**: If `quotes.length >= 2`, `getRandomQuote()` guarantees that the new quote is distinct from the immediately preceding quote.
- **Graceful Single-Item Handling**: If `quotes.length === 1`, `getRandomQuote()` safely returns the single quote without looping or error.
- **Empty Collection Safe**: If `quotes.length === 0`, all quote accessor methods return `null` safely.
