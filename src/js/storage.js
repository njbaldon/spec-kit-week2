/**
 * StorageService provides persistent favorites management via window.localStorage
 * with automatic fallback to an in-memory Set when storage is unavailable or restricted.
 */
export class StorageService {
  static STORAGE_KEY = 'qod_favorites_v1';

  /**
   * @param {Storage|null} [storageBackend] Optional backend for dependency injection / testing.
   */
  constructor(storageBackend = null) {
    this._memoryFallback = new Set();
    this._backend = storageBackend;
    this._isStorageAvailable = this._detectAvailability();

    if (this._isStorageAvailable) {
      this._hydrateMemoryFromStorage();
    }
  }

  /**
   * Safely probes whether persistent storage is accessible.
   * @returns {boolean}
   */
  _detectAvailability() {
    try {
      const storage = this._getRawStorage();
      if (!storage) return false;
      const testKey = '__qod_test_probe__';
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @returns {Storage|null}
   */
  _getRawStorage() {
    if (this._backend) {
      return this._backend;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    return null;
  }

  /**
   * Loads initial data from persistent storage into memory cache.
   */
  _hydrateMemoryFromStorage() {
    try {
      const storage = this._getRawStorage();
      const raw = storage.getItem(StorageService.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this._memoryFallback = new Set(
            parsed.filter((item) => typeof item === 'string' && item.trim().length > 0)
          );
        }
      }
    } catch {
      // Ignore parse or access errors, start with clean memory fallback
      this._memoryFallback = new Set();
    }
  }

  /**
   * Returns whether persistent browser storage is functional.
   * @returns {boolean}
   */
  isAvailable() {
    return this._isStorageAvailable;
  }

  /**
   * Retrieves the set of favorited quote IDs.
   * @returns {string[]}
   */
  getFavorites() {
    return Array.from(this._memoryFallback);
  }

  /**
   * Saves the complete array of favorited quote IDs.
   * Deduplicates entries before saving.
   * @param {string[]} ids
   * @returns {boolean} True if persisted to storage backend, false if memory fallback only.
   */
  saveFavorites(ids) {
    if (!Array.isArray(ids)) {
      ids = [];
    }

    const sanitized = ids.filter((id) => typeof id === 'string' && id.trim().length > 0);
    this._memoryFallback = new Set(sanitized);

    if (!this._isStorageAvailable) {
      return false;
    }

    try {
      const storage = this._getRawStorage();
      storage.setItem(StorageService.STORAGE_KEY, JSON.stringify(Array.from(this._memoryFallback)));
      return true;
    } catch {
      this._isStorageAvailable = false;
      return false;
    }
  }

  /**
   * Adds a single quote ID to favorites.
   * @param {string} id
   * @returns {boolean}
   */
  addFavorite(id) {
    if (typeof id !== 'string' || !id.trim()) {
      return false;
    }
    this._memoryFallback.add(id);
    return this.saveFavorites(Array.from(this._memoryFallback));
  }

  /**
   * Removes a single quote ID from favorites.
   * @param {string} id
   * @returns {boolean}
   */
  removeFavorite(id) {
    if (typeof id !== 'string' || !id.trim()) {
      return false;
    }
    this._memoryFallback.delete(id);
    return this.saveFavorites(Array.from(this._memoryFallback));
  }

  /**
   * Clears all saved favorites.
   */
  clear() {
    this._memoryFallback.clear();
    if (this._isStorageAvailable) {
      try {
        const storage = this._getRawStorage();
        storage.removeItem(StorageService.STORAGE_KEY);
      } catch {
        this._isStorageAvailable = false;
      }
    }
  }
}
