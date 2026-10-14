import test from 'node:test';
import assert from 'node:assert/strict';
import { quotes } from '../../src/js/quotes.js';
import { StorageService } from '../../src/js/storage.js';
import { QuoteManager } from '../../src/js/quote-manager.js';

class MockBrowserStorage {
  constructor() {
    this._store = new Map();
  }
  getItem(k) { return this._store.has(k) ? this._store.get(k) : null; }
  setItem(k, v) { this._store.set(k, String(v)); }
  removeItem(k) { this._store.delete(k); }
  clear() { this._store.clear(); }
}

test('Integration: End-to-End Quote Browsing & LocalStorage Persistence Across Reloads', async (t) => {
  const sharedBrowserStorage = new MockBrowserStorage();

  // --- Session 1: First visit ---
  let session1Storage = new StorageService(sharedBrowserStorage);
  let session1Manager = new QuoteManager(quotes, session1Storage);

  const initialQuote = session1Manager.getCurrentQuote();
  assert.ok(initialQuote, 'Session 1 must have an active initial quote');
  assert.equal(session1Manager.isFavorited(initialQuote.id), false, 'Initially quote is unfavorited');

  // Cycle quotes
  const secondQuote = session1Manager.getRandomQuote();
  assert.notEqual(secondQuote.id, initialQuote.id, 'New quote must not repeat initial quote');

  // Favorite the second quote
  const favResult = session1Manager.toggleFavorite();
  assert.equal(favResult, true, 'Toggling unfavorited quote returns true');
  assert.equal(session1Manager.isFavorited(secondQuote.id), true, 'Quote should be reported as favorited');

  // Verify stored serialized state in mock localStorage
  const rawSaved = sharedBrowserStorage.getItem(StorageService.STORAGE_KEY);
  assert.ok(rawSaved, 'Storage key must be set');
  const parsedIds = JSON.parse(rawSaved);
  assert.ok(parsedIds.includes(secondQuote.id), 'Saved array must include favorited quote ID');

  // --- Session 2: Page reload / return visit ---
  let session2Storage = new StorageService(sharedBrowserStorage);
  let session2Manager = new QuoteManager(quotes, session2Storage);

  assert.equal(
    session2Manager.isFavorited(secondQuote.id),
    true,
    'Favorited status MUST persist across new session/reload'
  );
  assert.equal(
    session2Manager.isFavorited(initialQuote.id),
    false,
    'Non-favorited quote must remain unfavorited'
  );

  // Unfavorite in session 2
  const unfavResult = session2Manager.toggleFavorite(secondQuote.id);
  assert.equal(unfavResult, false, 'Unfavoriting returns false');
  assert.equal(session2Manager.isFavorited(secondQuote.id), false, 'Quote is now unfavorited');

  // --- Session 3: Subsequent reload ---
  let session3Storage = new StorageService(sharedBrowserStorage);
  let session3Manager = new QuoteManager(quotes, session3Storage);

  assert.equal(
    session3Manager.isFavorited(secondQuote.id),
    false,
    'Unfavorited status must persist across subsequent reload'
  );
  assert.deepEqual(session3Storage.getFavorites(), [], 'Favorites collection should be empty');
});
