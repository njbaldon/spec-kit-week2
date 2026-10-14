import { quotes } from './quotes.js';
import { StorageService } from './storage.js';
import { QuoteManager } from './quote-manager.js';

/**
 * AppController coordinates DOM elements and user gestures with QuoteManager and StorageService.
 */
export class AppController {
  constructor() {
    this.storage = new StorageService();
    this.quoteManager = new QuoteManager(quotes, this.storage);

    // Cache DOM references
    this.elements = {
      quoteCard: document.getElementById('quote-card'),
      quoteText: document.getElementById('quote-text'),
      quoteAuthor: document.getElementById('quote-author'),
      btnNewQuote: document.getElementById('btn-new-quote'),
      btnFavorite: document.getElementById('btn-favorite'),
      btnViewFavorites: document.getElementById('btn-view-favorites'),
      favoritesContainer: document.getElementById('favorites-container'),
      favoritesList: document.getElementById('favorites-list'),
      storageWarning: document.getElementById('storage-warning')
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
   */
  handleToggleFavorite() {
    this.quoteManager.toggleFavorite();
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
   * Updates favorites button label with count.
   */
  updateFavoritesButtonLabel() {
    if (!this.elements.btnViewFavorites) return;
    if (this.isFavoritesViewOpen) {
      this.elements.btnViewFavorites.textContent = 'Back to Quote';
    } else {
      const count = this.storage.getFavorites().length;
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
   */
  renderFavoritesList() {
    if (!this.elements.favoritesList) return;

    const favoriteQuotes = this.quoteManager.getFavoriteQuotes();
    this.elements.favoritesList.innerHTML = '';

    if (favoriteQuotes.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'favorites-empty';
      emptyLi.textContent = 'You have not favorited any quotes yet. Click the heart icon on any quote to save it!';
      this.elements.favoritesList.appendChild(emptyLi);
      return;
    }

    for (const quote of favoriteQuotes) {
      const li = document.createElement('li');
      li.className = 'favorite-item';

      const contentDiv = document.createElement('div');
      contentDiv.className = 'favorite-item-content';

      const quoteP = document.createElement('p');
      quoteP.className = 'favorite-item-text';
      quoteP.textContent = `“${quote.text}”`;

      const authorSpan = document.createElement('span');
      authorSpan.className = 'favorite-item-author';
      authorSpan.textContent = `— ${quote.author}`;

      contentDiv.appendChild(quoteP);
      contentDiv.appendChild(authorSpan);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-remove-fav';
      removeBtn.type = 'button';
      removeBtn.setAttribute('aria-label', `Remove "${quote.text}" from favorites`);
      removeBtn.textContent = '✕ Remove';

      removeBtn.addEventListener('click', () => {
        this.quoteManager.toggleFavorite(quote.id);
        this.renderFavoritesList();
        this.updateFavoritesButtonLabel();
        this.renderFavoriteButtonState();
      });

      li.appendChild(contentDiv);
      li.appendChild(removeBtn);
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
