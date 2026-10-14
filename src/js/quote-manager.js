/**
 * QuoteManager encapsulates quote selection, non-repeating randomization,
 * and favorite state coordination.
 */
export class QuoteManager {
  /**
   * @param {Array<{id: string, text: string, author: string, category?: string}>} quotes
   * @param {import('./storage.js').StorageService} [storageService]
   */
  constructor(quotes = [], storageService = null) {
    this._quotes = Array.isArray(quotes) ? quotes : [];
    this._storage = storageService;
    this._currentIndex = -1;
    this._currentQuote = null;
    this._favorites = this._loadKnownFavorites();

    if (this._quotes.length > 0) {
      // Pick initial random quote on initialization
      this._currentIndex = Math.floor(Math.random() * this._quotes.length);
      this._currentQuote = this._quotes[this._currentIndex];
    }
  }

  /**
   * Reads stored favorite IDs, keeping only those that match a quote in the collection.
   * Stale IDs (e.g. from a quote retired from the dataset) are pruned from storage too;
   * otherwise they would inflate favorite counts while never rendering in the list.
   * @returns {Set<string>}
   */
  _loadKnownFavorites() {
    if (!this._storage) return new Set();

    const stored = this._storage.getFavorites();
    const knownIds = new Set(this._quotes.map((q) => q.id));
    const known = stored.filter((id) => knownIds.has(id));

    if (known.length !== stored.length) {
      this._storage.saveFavorites(known);
    }
    return new Set(known);
  }

  /**
   * Returns total count of quotes in the collection.
   * @returns {number}
   */
  getTotalQuoteCount() {
    return this._quotes.length;
  }

  /**
   * Returns the currently active quote. Returns null if collection is empty.
   * @returns {{id: string, text: string, author: string, category?: string}|null}
   */
  getCurrentQuote() {
    return this._currentQuote;
  }

  /**
   * Selects and returns a new random quote from the collection.
   * If collection has 2 or more quotes, the returned quote is guaranteed
   * to differ from the currently active quote (no immediate repeat).
   * @returns {{id: string, text: string, author: string, category?: string}|null}
   */
  getRandomQuote() {
    if (this._quotes.length === 0) {
      return null;
    }

    if (this._quotes.length === 1) {
      this._currentIndex = 0;
      this._currentQuote = this._quotes[0];
      return this._currentQuote;
    }

    // Pick a non-zero offset between 1 and (length - 1)
    const offset = 1 + Math.floor(Math.random() * (this._quotes.length - 1));
    this._currentIndex = (this._currentIndex + offset) % this._quotes.length;
    this._currentQuote = this._quotes[this._currentIndex];
    return this._currentQuote;
  }

  /**
   * Checks if a quote is currently favorited.
   * If quoteId is omitted, checks the currently active quote.
   * @param {string} [quoteId]
   * @returns {boolean}
   */
  isFavorited(quoteId) {
    const id = quoteId || (this._currentQuote ? this._currentQuote.id : null);
    if (!id) return false;
    return this._favorites.has(id);
  }

  /**
   * Toggles the favorite status for a given quote ID or currently active quote.
   * @param {string} [quoteId]
   * @returns {boolean} The new favorite status (true = favorited, false = unfavorited).
   */
  toggleFavorite(quoteId) {
    const id = quoteId || (this._currentQuote ? this._currentQuote.id : null);
    if (!id) return false;

    if (this._favorites.has(id)) {
      this._favorites.delete(id);
      if (this._storage) {
        this._storage.removeFavorite(id);
      }
      return false;
    } else {
      this._favorites.add(id);
      if (this._storage) {
        this._storage.addFavorite(id);
      }
      return true;
    }
  }

  /**
   * Returns the Quote object matching the given ID, or null if not found.
   * @param {string} id
   * @returns {{id: string, text: string, author: string, category?: string}|null}
   */
  getQuoteById(id) {
    return this._quotes.find((q) => q.id === id) || null;
  }

  /**
   * Returns an array of Quote objects currently in favorites.
   * @returns {Array<{id: string, text: string, author: string, category?: string}>}
   */
  getFavoriteQuotes() {
    return this._quotes.filter((q) => this._favorites.has(q.id));
  }
}
