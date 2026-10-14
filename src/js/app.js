import { quotes } from './quotes.js';
import { StorageService } from './storage.js';
import { QuoteManager } from './quote-manager.js';

/**
 * AppController coordinates DOM elements and user gestures with QuoteManager and StorageService.
 */
export class AppController {
  /**
   * @param {object} [options] Dependencies, injectable so the controller can be tested without a browser.
   * @param {Document} [options.doc] Document to query and create elements in.
   * @param {StorageService} [options.storage] Favorites persistence service.
   */
  constructor({ doc = document, storage = new StorageService() } = {}) {
    this.doc = doc;
    this.storage = storage;
    this.quoteManager = new QuoteManager(quotes, this.storage);

    /**
     * sessionFavorites tracks every quote ID shown in the favorites panel for the current
     * session. It is initialized from the currently-favorited quotes and grows whenever the
     * user favorites a quote. Rows removed from the favorites list stay in this Set until the
     * next page load, which keeps them visible so the user can refavorite accidental removals.
     * Unfavoriting from the quote card is not a list removal, so it drops the row instead.
     * @type {Set<string>}
     */
    this.sessionFavorites = new Set(this.quoteManager.getFavoriteQuotes().map((q) => q.id));

    // Cache DOM references
    this.elements = {
      quoteCard: doc.getElementById('quote-card'),
      quoteText: doc.getElementById('quote-text'),
      quoteAuthor: doc.getElementById('quote-author'),
      btnNewQuote: doc.getElementById('btn-new-quote'),
      btnFavorite: doc.getElementById('btn-favorite'),
      btnViewFavorites: doc.getElementById('btn-view-favorites'),
      favoritesContainer: doc.getElementById('favorites-container'),
      favoritesList: doc.getElementById('favorites-list'),
      storageWarning: doc.getElementById('storage-warning')
    };

    this.isFavoritesViewOpen = false;
    this.init();
  }

  /**
   * Initializes state and attaches event listeners.
   */
  init() {
    this.checkStorageWarning();
    this.attachEventListeners();
    this.renderCurrentQuote();
    this.updateFavoritesButtonLabel();
  }

  /**
   * Sets up interactive event handlers.
   */
  attachEventListeners() {
    if (this.elements.btnNewQuote) {
      this.elements.btnNewQuote.addEventListener('click', () => this.handleNewQuote());
    }
    if (this.elements.btnFavorite) {
      this.elements.btnFavorite.addEventListener('click', () => this.handleToggleFavorite());
    }
    if (this.elements.btnViewFavorites) {
      this.elements.btnViewFavorites.addEventListener('click', () => this.toggleFavoritesView());
    }
  }

  /**
   * Generates and renders a new random quote.
   */
  handleNewQuote() {
    this.quoteManager.getRandomQuote();
    this.renderCurrentQuote();
  }

  /**
   * Toggles the favorite status for the current quote and synchronizes UI.
   * Favoriting adds the quote to sessionFavorites; unfavoriting here removes it, because
   * in-session retention only applies to removals made from the favorites list.
   */
  handleToggleFavorite() {
    const current = this.quoteManager.getCurrentQuote();
    const isNowFavorited = this.quoteManager.toggleFavorite();

    if (current) {
      if (isNowFavorited) {
        this.sessionFavorites.add(current.id);
      } else {
        this.sessionFavorites.delete(current.id);
      }
    }

    this.checkStorageWarning();
    this.renderFavoriteButtonState();
    this.updateFavoritesButtonLabel();
  }

  /**
   * Updates the visual presentation of the favorite button.
   */
  renderFavoriteButtonState() {
    if (!this.elements.btnFavorite) return;

    const isFav = this.quoteManager.isFavorited();
    this.elements.btnFavorite.setAttribute('aria-pressed', isFav ? 'true' : 'false');

    if (isFav) {
      this.elements.btnFavorite.classList.add('is-favorited');
      this.elements.btnFavorite.innerHTML = '<span class="btn-icon heart-icon">♥</span> Favorited';
    } else {
      this.elements.btnFavorite.classList.remove('is-favorited');
      this.elements.btnFavorite.innerHTML = '<span class="btn-icon heart-icon">♥</span> Favorite';
    }
  }

  /**
   * Updates favorites button label with count of currently-favorited quotes.
   */
  updateFavoritesButtonLabel() {
    if (!this.elements.btnViewFavorites) return;
    if (this.isFavoritesViewOpen) {
      this.elements.btnViewFavorites.textContent = 'Back to Quote';
    } else {
      const count = this.quoteManager.getFavoriteQuotes().length;
      this.elements.btnViewFavorites.textContent = `View Favorites (${count})`;
    }
  }

  /**
   * Toggles between active quote view and saved favorites list view.
   */
  toggleFavoritesView() {
    this.isFavoritesViewOpen = !this.isFavoritesViewOpen;

    if (!this.elements.quoteCard || !this.elements.favoritesContainer) return;

    if (this.isFavoritesViewOpen) {
      this.elements.quoteCard.classList.add('is-hidden');
      this.elements.favoritesContainer.classList.remove('is-hidden');
      if (this.elements.btnNewQuote) {
        this.elements.btnNewQuote.classList.add('is-hidden');
      }
      if (this.elements.btnFavorite) {
        this.elements.btnFavorite.classList.add('is-hidden');
      }
      this.elements.btnViewFavorites.setAttribute('aria-expanded', 'true');
      this.renderFavoritesList();
    } else {
      this.elements.favoritesContainer.classList.add('is-hidden');
      this.elements.quoteCard.classList.remove('is-hidden');
      if (this.elements.btnNewQuote) {
        this.elements.btnNewQuote.classList.remove('is-hidden');
      }
      if (this.elements.btnFavorite) {
        this.elements.btnFavorite.classList.remove('is-hidden');
      }
      this.elements.btnViewFavorites.setAttribute('aria-expanded', 'false');
      this.renderFavoriteButtonState();
    }

    this.updateFavoritesButtonLabel();
  }

  /**
   * Renders the saved favorites list into the favorites panel.
   *
   * Iterates over sessionFavorites (not just currently-favorited quotes) so that
   * quotes unfavorited during this session are still displayed. Each row renders
   * differently based on whether the quote is still actively favorited:
   *
   *   - Still favorited → "✕ Remove" button (removes from storage, keeps row with .is-unfavorited)
   *   - Unfavorited this session → "+ Refavorite" button (re-adds to storage, removes .is-unfavorited)
   */
  renderFavoritesList() {
    if (!this.elements.favoritesList) return;

    this.elements.favoritesList.innerHTML = '';

    if (this.sessionFavorites.size === 0) {
      const emptyLi = this.doc.createElement('li');
      emptyLi.className = 'favorites-empty';
      emptyLi.textContent = 'You have not favorited any quotes yet. Click the heart icon on any quote to save it!';
      this.elements.favoritesList.appendChild(emptyLi);
      return;
    }

    for (const id of this.sessionFavorites) {
      const quote = this.quoteManager.getQuoteById(id);
      if (!quote) continue; // Guard against stale IDs not in the built-in collection

      const isStillFavorited = this.quoteManager.isFavorited(id);

      const li = this.doc.createElement('li');
      li.className = 'favorite-item' + (isStillFavorited ? '' : ' is-unfavorited');

      const contentDiv = this.doc.createElement('div');
      contentDiv.className = 'favorite-item-content';

      const quoteP = this.doc.createElement('p');
      quoteP.className = 'favorite-item-text';
      quoteP.textContent = `"${quote.text}"`;

      const authorSpan = this.doc.createElement('span');
      authorSpan.className = 'favorite-item-author';
      authorSpan.textContent = `— ${quote.author}`;

      contentDiv.appendChild(quoteP);
      contentDiv.appendChild(authorSpan);

      const actionBtn = this.doc.createElement('button');
      actionBtn.type = 'button';

      if (isStillFavorited) {
        // ✕ Remove: unfavorites from storage but keeps row in session list
        actionBtn.className = 'btn-remove-fav';
        actionBtn.setAttribute('aria-label', `Remove "${quote.text}" from favorites`);
        actionBtn.textContent = '✕ Remove';
        actionBtn.addEventListener('click', () => {
          this.quoteManager.toggleFavorite(id); // removes from storage + _favorites Set
          // Do NOT remove from sessionFavorites — row stays visible for refavoriting
          this.checkStorageWarning();
          this.renderFavoritesList();
          this.updateFavoritesButtonLabel();
          this.renderFavoriteButtonState();
        });
      } else {
        // + Refavorite: re-adds to storage and removes the muted state
        actionBtn.className = 'btn-refavorite';
        actionBtn.setAttribute('aria-label', `Refavorite "${quote.text}"`);
        actionBtn.textContent = '+ Refavorite';
        actionBtn.addEventListener('click', () => {
          this.quoteManager.toggleFavorite(id); // re-adds to storage + _favorites Set
          // sessionFavorites already contains the ID; re-render to update button state
          this.checkStorageWarning();
          this.renderFavoritesList();
          this.updateFavoritesButtonLabel();
          this.renderFavoriteButtonState();
        });
      }

      li.appendChild(contentDiv);
      li.appendChild(actionBtn);
      this.elements.favoritesList.appendChild(li);
    }
  }

  /**
   * Shows storage warning if localStorage is restricted/unavailable.
   */
  checkStorageWarning() {
    if (!this.storage.isAvailable() && this.elements.storageWarning) {
      this.elements.storageWarning.classList.remove('is-hidden');
    }
  }

  /**
   * Renders the currently active quote into the quote card.
   */
  renderCurrentQuote() {
    const current = this.quoteManager.getCurrentQuote();
    if (!current) {
      if (this.elements.quoteText) {
        this.elements.quoteText.textContent = 'No quotes available.';
      }
      if (this.elements.quoteAuthor) {
        this.elements.quoteAuthor.textContent = '';
      }
      return;
    }

    if (this.elements.quoteText) {
      this.elements.quoteText.textContent = current.text;
    }
    if (this.elements.quoteAuthor) {
      this.elements.quoteAuthor.textContent = current.author;
    }
    this.renderFavoriteButtonState();
  }
}

// Bootstrap on DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.__app = new AppController();
  });
}
