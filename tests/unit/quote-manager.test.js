import test from 'node:test';
import assert from 'node:assert/strict';
import { QuoteManager } from '../../src/js/quote-manager.js';
import { StorageService } from '../../src/js/storage.js';
import { quotes as sampleQuotes } from '../../src/js/quotes.js';

test('QuoteManager - User Story 1: Initial quote selection on load', async (t) => {
  await t.test('initializes with a valid quote from collection', () => {
    const manager = new QuoteManager(sampleQuotes);
    const quote = manager.getCurrentQuote();

    assert.ok(quote, 'A quote should be returned on initial load');
    assert.equal(typeof quote.id, 'string', 'Quote ID must be a string');
    assert.ok(quote.id.length > 0, 'Quote ID must not be empty');
    assert.equal(typeof quote.text, 'string', 'Quote text must be a string');
    assert.ok(quote.text.trim().length >= 5, 'Quote text must be at least 5 characters');
    assert.equal(typeof quote.author, 'string', 'Quote author must be a string');
    assert.ok(quote.author.trim().length >= 2, 'Quote author must be at least 2 characters');
  });

  await t.test('handles empty quotes collection gracefully', () => {
    const emptyManager = new QuoteManager([]);
    assert.equal(emptyManager.getCurrentQuote(), null, 'Should return null when quotes collection is empty');
    assert.equal(emptyManager.getTotalQuoteCount(), 0, 'Total count should be 0');
  });

  await t.test('handles single-item quotes collection', () => {
    const singleQuote = [{ id: 'q-single', text: 'Lone quote test string', author: 'Author' }];
    const manager = new QuoteManager(singleQuote);
    assert.deepEqual(manager.getCurrentQuote(), singleQuote[0]);
    assert.equal(manager.getTotalQuoteCount(), 1);
  });
});

test('QuoteManager - User Story 2: Non-repeating random quote selection', async (t) => {
  await t.test('getRandomQuote never immediately repeats the current quote when N >= 2', () => {
    const manager = new QuoteManager(sampleQuotes);
    let previousQuote = manager.getCurrentQuote();

    for (let i = 0; i < 50; i++) {
      const nextQuote = manager.getRandomQuote();
      assert.ok(nextQuote, 'Next quote must not be null');
      assert.notEqual(
        nextQuote.id,
        previousQuote.id,
        `Consecutive quotes must not be identical (failed on iteration ${i})`
      );
      previousQuote = nextQuote;
    }
  });

  await t.test('getRandomQuote handles two-item collection alternating or selecting different item', () => {
    const twoQuotes = [
      { id: 'q-1', text: 'First quote test', author: 'Author 1' },
      { id: 'q-2', text: 'Second quote test', author: 'Author 2' }
    ];
    const manager = new QuoteManager(twoQuotes);
    const initial = manager.getCurrentQuote();
    const next = manager.getRandomQuote();

    assert.notEqual(next.id, initial.id, 'In 2-item list, next must be the other quote');
  });

  await t.test('getRandomQuote handles single-item collection gracefully', () => {
    const singleQuote = [{ id: 'q-single', text: 'Lone quote test string', author: 'Author' }];
    const manager = new QuoteManager(singleQuote);
    const next = manager.getRandomQuote();
    assert.deepEqual(next, singleQuote[0], 'Should return the single item without crashing');
  });

  await t.test('getRandomQuote handles empty collection', () => {
    const manager = new QuoteManager([]);
    assert.equal(manager.getRandomQuote(), null, 'Should return null for empty collection');
  });
});

test('QuoteManager - User Story 3: Favorite and Unfavorite Toggling', async (t) => {
  class MockStorage {
    constructor() {
      this._store = new Map();
    }
    getItem(k) { return this._store.has(k) ? this._store.get(k) : null; }
    setItem(k, v) { this._store.set(k, String(v)); }
    removeItem(k) { this._store.delete(k); }
    clear() { this._store.clear(); }
  }

  await t.test('toggles favorite on current quote when no ID is passed', () => {
    const storage = new StorageService(new MockStorage());
    const manager = new QuoteManager(sampleQuotes, storage);
    const current = manager.getCurrentQuote();

    assert.equal(manager.isFavorited(current.id), false, 'Initially not favorited');

    const stateAfterFirst = manager.toggleFavorite();
    assert.equal(stateAfterFirst, true, 'Returns true after favoriting');
    assert.equal(manager.isFavorited(current.id), true, 'isFavorited reports true');

    const stateAfterSecond = manager.toggleFavorite();
    assert.equal(stateAfterSecond, false, 'Returns false after unfavoriting');
    assert.equal(manager.isFavorited(current.id), false, 'isFavorited reports false');
  });

  await t.test('toggles favorite for explicit quote ID', () => {
    const storage = new StorageService(new MockStorage());
    const manager = new QuoteManager(sampleQuotes, storage);

    assert.equal(manager.isFavorited('quote-005'), false);
    manager.toggleFavorite('quote-005');
    assert.equal(manager.isFavorited('quote-005'), true);
  });
});

test('QuoteManager - User Story 4: View and retrieve saved favorite quotes', async (t) => {
  class MockStorage {
    constructor() { this._store = new Map(); }
    getItem(k) { return this._store.has(k) ? this._store.get(k) : null; }
    setItem(k, v) { this._store.set(k, String(v)); }
    removeItem(k) { this._store.delete(k); }
    clear() { this._store.clear(); }
  }

  await t.test('returns empty array when no quotes are favorited', () => {
    const storage = new StorageService(new MockStorage());
    const manager = new QuoteManager(sampleQuotes, storage);
    assert.deepEqual(manager.getFavoriteQuotes(), []);
  });

  await t.test('returns full Quote objects for all favorited IDs', () => {
    const storage = new StorageService(new MockStorage());
    const manager = new QuoteManager(sampleQuotes, storage);

    manager.toggleFavorite('quote-001');
    manager.toggleFavorite('quote-003');

    const favs = manager.getFavoriteQuotes();
    assert.equal(favs.length, 2);
    assert.ok(favs.find((q) => q.id === 'quote-001'));
    assert.ok(favs.find((q) => q.id === 'quote-003'));
    assert.equal(favs[0].author, sampleQuotes.find(q => q.id === favs[0].id).author);
  });
});

test('QuoteManager - User Story 4: getQuoteById() lookup', async (t) => {
  await t.test('returns the correct Quote object for a valid ID', () => {
    const manager = new QuoteManager(sampleQuotes);
    const result = manager.getQuoteById('quote-001');
    assert.ok(result, 'Should return a Quote object for a known ID');
    assert.equal(result.id, 'quote-001', 'Returned quote must have the requested ID');
    assert.equal(typeof result.text, 'string', 'Quote must have text');
    assert.equal(typeof result.author, 'string', 'Quote must have author');
  });

  await t.test('returns null for an unknown ID', () => {
    const manager = new QuoteManager(sampleQuotes);
    const result = manager.getQuoteById('nonexistent-id-xyz');
    assert.equal(result, null, 'Should return null for an ID not in the collection');
  });

  await t.test('returns null when called on an empty collection', () => {
    const manager = new QuoteManager([]);
    const result = manager.getQuoteById('quote-001');
    assert.equal(result, null, 'Should return null when collection is empty');
  });
});
