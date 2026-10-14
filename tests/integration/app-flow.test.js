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

test('Integration: In-Session Refavoriting — unfavorited row is retained until reload', async (t) => {
  const sharedBrowserStorage = new MockBrowserStorage();

  // --- Setup: favorite two quotes ---
  const sessionStorage = new StorageService(sharedBrowserStorage);
  const sessionManager = new QuoteManager(quotes, sessionStorage);

  const quoteA = quotes[0];
  const quoteB = quotes[1];

  sessionManager.toggleFavorite(quoteA.id); // favorite A
  sessionManager.toggleFavorite(quoteB.id); // favorite B

  assert.equal(sessionManager.isFavorited(quoteA.id), true, 'quoteA is favorited');
  assert.equal(sessionManager.isFavorited(quoteB.id), true, 'quoteB is favorited');

  // Simulate sessionFavorites Set as AppController would maintain it
  const sessionFavorites = new Set(sessionStorage.getFavorites());
  assert.ok(sessionFavorites.has(quoteA.id), 'sessionFavorites contains quoteA');
  assert.ok(sessionFavorites.has(quoteB.id), 'sessionFavorites contains quoteB');

  // --- Unfavorite quoteA from the list (as renderFavoritesList "Remove" handler does) ---
  sessionManager.toggleFavorite(quoteA.id); // removes from storage + _favorites
  // sessionFavorites is NOT modified (in-session retention)

  assert.equal(sessionManager.isFavorited(quoteA.id), false, 'quoteA is no longer favorited in QuoteManager');
  assert.ok(sessionFavorites.has(quoteA.id), 'sessionFavorites still contains quoteA (row stays visible)');
  assert.equal(sessionManager.isFavorited(quoteB.id), true, 'quoteB remains favorited');

  // Verify storage no longer contains quoteA
  const storedAfterRemove = sessionStorage.getFavorites();
  assert.ok(!storedAfterRemove.includes(quoteA.id), 'localStorage no longer contains quoteA');
  assert.ok(storedAfterRemove.includes(quoteB.id), 'localStorage still contains quoteB');

  // --- Refavorite quoteA (as "Refavorite" button handler does) ---
  sessionManager.toggleFavorite(quoteA.id); // re-adds to storage + _favorites

  assert.equal(sessionManager.isFavorited(quoteA.id), true, 'quoteA is favorited again after refavoriting');
  const storedAfterRefav = sessionStorage.getFavorites();
  assert.ok(storedAfterRefav.includes(quoteA.id), 'localStorage contains quoteA again after refavoriting');

  // --- Simulate reload: new session reads only stored favorites ---
  const reloadStorage = new StorageService(sharedBrowserStorage);
  const reloadManager = new QuoteManager(quotes, reloadStorage);
  const reloadSessionFavorites = new Set(reloadStorage.getFavorites());

  assert.ok(reloadSessionFavorites.has(quoteA.id), 'After reload, quoteA (refavorited) persists');
  assert.ok(reloadSessionFavorites.has(quoteB.id), 'After reload, quoteB persists');

  // --- Now test purge on reload: unfavorite quoteA and do NOT refavorite ---
  const purgeStorage = new StorageService(sharedBrowserStorage);
  const purgeManager = new QuoteManager(quotes, purgeStorage);
  const purgeSessionFavorites = new Set(purgeStorage.getFavorites());

  purgeManager.toggleFavorite(quoteA.id); // unfavorite, no refavorite
  // purgeSessionFavorites still has quoteA (session retention in-memory only)
  assert.ok(purgeSessionFavorites.has(quoteA.id), 'Session set retains quoteA during session');
  assert.equal(purgeManager.isFavorited(quoteA.id), false, 'QuoteManager no longer marks quoteA as favorited');

  // Next reload sees clean state
  const nextReloadStorage = new StorageService(sharedBrowserStorage);
  const nextReloadSessionFavorites = new Set(nextReloadStorage.getFavorites());
  assert.ok(!nextReloadSessionFavorites.has(quoteA.id), 'After reload without refavoriting, quoteA is gone');
  assert.ok(nextReloadSessionFavorites.has(quoteB.id), 'quoteB still persists unaffected');
});
