import test from 'node:test';
import assert from 'node:assert/strict';
import { quotes } from '../../src/js/quotes.js';
import { StorageService } from '../../src/js/storage.js';
import { AppController } from '../../src/js/app.js';
import { FakeDocument, MockBrowserStorage } from '../helpers/fake-dom.js';

const KEY = StorageService.STORAGE_KEY;

/** Boots a controller against a fresh document, simulating a page load over `backend`. */
function boot(backend) {
  const doc = new FakeDocument();
  const app = new AppController({ doc, storage: new StorageService(backend) });
  return { doc, app, el: (id) => doc.getElementById(id) };
}

function seed(backend, ids) {
  backend.setItem(KEY, JSON.stringify(ids));
}

function stored(backend) {
  return JSON.parse(backend.getItem(KEY) || '[]');
}

/** Opens the favorites view and returns the rendered list rows. */
function openFavorites(page) {
  page.el('btn-view-favorites').click();
  return page.el('favorites-list').children;
}

test('AppController - quote card and favorite button (US1, US3)', async (t) => {
  await t.test('renders a quote and author on load', () => {
    const page = boot(new MockBrowserStorage());
    const current = page.app.quoteManager.getCurrentQuote();
    assert.equal(page.el('quote-text').textContent, current.text);
    assert.equal(page.el('quote-author').textContent, current.author);
    assert.equal(page.el('btn-favorite').getAttribute('aria-pressed'), 'false');
  });

  await t.test('favoriting from the card updates state, label, and storage', () => {
    const backend = new MockBrowserStorage();
    const page = boot(backend);
    const current = page.app.quoteManager.getCurrentQuote();

    page.el('btn-favorite').click();

    assert.equal(page.el('btn-favorite').getAttribute('aria-pressed'), 'true');
    assert.ok(page.el('btn-favorite').classList.contains('is-favorited'));
    assert.equal(page.el('btn-view-favorites').textContent, 'View Favorites (1)');
    assert.deepEqual(stored(backend), [current.id]);
  });

  await t.test('shows the storage warning when localStorage is unavailable', () => {
    const throwingBackend = {
      getItem() { throw new Error('SecurityError'); },
      setItem() { throw new Error('SecurityError'); },
      removeItem() { throw new Error('SecurityError'); }
    };
    const page = boot(throwingBackend);
    assert.equal(page.el('storage-warning').classList.contains('is-hidden'), false);
  });
});

test('AppController - favorites view (US4)', async (t) => {
  await t.test('toggles between quote card and favorites panel', () => {
    const page = boot(new MockBrowserStorage());

    openFavorites(page);
    assert.ok(page.el('quote-card').classList.contains('is-hidden'));
    assert.equal(page.el('favorites-container').classList.contains('is-hidden'), false);
    assert.equal(page.el('btn-view-favorites').getAttribute('aria-expanded'), 'true');
    assert.equal(page.el('btn-view-favorites').textContent, 'Back to Quote');

    page.el('btn-view-favorites').click();
    assert.equal(page.el('quote-card').classList.contains('is-hidden'), false);
    assert.ok(page.el('favorites-container').classList.contains('is-hidden'));
    assert.equal(page.el('btn-view-favorites').getAttribute('aria-expanded'), 'false');
  });

  await t.test('shows the empty-state message when nothing is favorited (US4/AC2)', () => {
    const rows = openFavorites(boot(new MockBrowserStorage()));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].className, 'favorites-empty');
  });

  await t.test('lists every favorited quote with text and author (US4/AC1)', () => {
    const backend = new MockBrowserStorage();
    seed(backend, [quotes[0].id, quotes[1].id]);
    const rows = openFavorites(boot(backend));

    assert.equal(rows.length, 2);
    assert.equal(rows[0].children[0].children[0].textContent, `"${quotes[0].text}"`);
    assert.equal(rows[0].children[0].children[1].textContent, `— ${quotes[0].author}`);
    assert.equal(rows[0].children[1].className, 'btn-remove-fav');
  });

  await t.test('removed row stays visible for refavoriting, then disappears on reload (US4/AC3)', () => {
    const backend = new MockBrowserStorage();
    seed(backend, [quotes[0].id, quotes[1].id]);
    const page = boot(backend);

    openFavorites(page)[0].children[1].click(); // ✕ Remove on quotes[0]

    let rows = page.el('favorites-list').children;
    assert.equal(rows.length, 2, 'removed row is retained this session');
    assert.ok(rows[0].classList.contains('is-unfavorited'));
    assert.equal(rows[0].children[1].className, 'btn-refavorite');
    assert.equal(rows[0].children[1].textContent, '+ Refavorite');
    assert.deepEqual(stored(backend), [quotes[1].id], 'persistent favorite is cleared immediately');
    assert.equal(page.el('btn-view-favorites').textContent, 'Back to Quote');

    page.el('btn-view-favorites').click();
    assert.equal(page.el('btn-view-favorites').textContent, 'View Favorites (1)');

    const reloaded = openFavorites(boot(backend));
    assert.equal(reloaded.length, 1, 'unfavorited row is gone after reload');
    assert.equal(reloaded[0].children[0].children[0].textContent, `"${quotes[1].text}"`);
  });

  await t.test('refavoriting a retained row restores persistence', () => {
    const backend = new MockBrowserStorage();
    seed(backend, [quotes[0].id]);
    const page = boot(backend);

    openFavorites(page)[0].children[1].click(); // ✕ Remove
    page.el('favorites-list').children[0].children[1].click(); // + Refavorite

    const row = page.el('favorites-list').children[0];
    assert.equal(row.classList.contains('is-unfavorited'), false);
    assert.equal(row.children[1].className, 'btn-remove-fav');
    assert.deepEqual(stored(backend), [quotes[0].id]);
    assert.equal(openFavorites(boot(backend)).length, 1, 'refavorited quote survives reload');
  });

  await t.test('unfavoriting from the quote card removes the quote from the list (US4/AC3 scope)', () => {
    const page = boot(new MockBrowserStorage());

    page.el('btn-favorite').click(); // favorite
    page.el('btn-favorite').click(); // unfavorite from the card, not the list

    const rows = openFavorites(page);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].className, 'favorites-empty');
  });

  await t.test('ignores stored IDs that match no built-in quote (data-model §1.2)', () => {
    const backend = new MockBrowserStorage();
    seed(backend, ['retired-quote-id']);
    const page = boot(backend);

    assert.equal(page.el('btn-view-favorites').textContent, 'View Favorites (0)');
    const rows = openFavorites(page);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].className, 'favorites-empty');
  });
});

test('AppController - storage failing mid-session from the favorites list (Edge Case: Persistence Storage Unavailable)', async (t) => {
  /** Backend that works at load time and starts throwing once `failing` is set. */
  class FlakyStorage extends MockBrowserStorage {
    constructor() {
      super();
      this.failing = false;
    }
    setItem(k, v) {
      if (this.failing) throw new Error('QuotaExceededError');
      super.setItem(k, v);
    }
  }

  for (const action of ['remove', 'refavorite']) {
    await t.test(`shows the storage warning when a list ${action} cannot be persisted`, () => {
      const backend = new FlakyStorage();
      seed(backend, [quotes[0].id]);
      const page = boot(backend);
      openFavorites(page);

      if (action === 'refavorite') {
        page.el('favorites-list').children[0].children[1].click(); // ✕ Remove while storage works
      }
      assert.ok(page.el('storage-warning').classList.contains('is-hidden'));

      backend.failing = true;
      page.el('favorites-list').children[0].children[1].click();

      assert.equal(page.el('storage-warning').classList.contains('is-hidden'), false);
    });
  }
});
