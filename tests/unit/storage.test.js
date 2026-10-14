import test from 'node:test';
import assert from 'node:assert/strict';
import { StorageService } from '../../src/js/storage.js';

class MockStorage {
  constructor() {
    this.store = new Map();
    this.throwOnSet = false;
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    if (this.throwOnSet) {
      throw new Error('QuotaExceededError: Mock storage limit reached');
    }
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

test('StorageService - Persistence & Fallback', async (t) => {
  await t.test('detects available storage backend and saves/reads favorites', () => {
    const mock = new MockStorage();
    const service = new StorageService(mock);

    assert.equal(service.isAvailable(), true, 'Storage should be detected as available');
    assert.deepEqual(service.getFavorites(), [], 'Initial favorites should be empty');

    const saved = service.saveFavorites(['q-1', 'q-2', 'q-1']);
    assert.equal(saved, true, 'saveFavorites should return true for operational backend');

    const favorites = service.getFavorites();
    assert.equal(favorites.length, 2, 'Duplicates should be pruned');
    assert.ok(favorites.includes('q-1'));
    assert.ok(favorites.includes('q-2'));

    // Verify raw storage content
    const raw = mock.getItem(StorageService.STORAGE_KEY);
    assert.ok(raw);
    assert.deepEqual(JSON.parse(raw).sort(), ['q-1', 'q-2']);
  });

  await t.test('adds and removes individual favorites cleanly', () => {
    const mock = new MockStorage();
    const service = new StorageService(mock);

    service.addFavorite('quote-001');
    service.addFavorite('quote-002');
    assert.equal(service.getFavorites().length, 2);

    service.removeFavorite('quote-001');
    assert.deepEqual(service.getFavorites(), ['quote-002']);

    service.clear();
    assert.deepEqual(service.getFavorites(), []);
  });

  await t.test('handles corrupted JSON in storage gracefully', () => {
    const mock = new MockStorage();
    mock.setItem(StorageService.STORAGE_KEY, '{invalid json corrupted string');

    const service = new StorageService(mock);
    assert.deepEqual(service.getFavorites(), [], 'Corrupted storage should yield empty array, not crash');
  });

  await t.test('falls back to in-memory set when storage backend throws', () => {
    const mock = new MockStorage();
    const service = new StorageService(mock);

    mock.throwOnSet = true;
    const result = service.saveFavorites(['q-fallback']);

    assert.equal(result, false, 'Should return false when persistent write fails');
    assert.equal(service.isAvailable(), false, 'isAvailable should flip to false');
    assert.deepEqual(service.getFavorites(), ['q-fallback'], 'In-memory state should still retain value');
  });
});
