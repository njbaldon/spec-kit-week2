/**
 * Minimal DOM test double covering only the element APIs AppController uses,
 * so the UI controller can be exercised under node:test without a browser.
 */
export class FakeElement {
  /**
   * @param {string} tagName
   * @param {string} [id]
   */
  constructor(tagName, id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.type = '';
    this.textContent = '';
    this.children = [];
    this._classes = new Set();
    this._attributes = new Map();
    this._listeners = new Map();
    this._innerHTML = '';
    this.classList = {
      add: (name) => this._classes.add(name),
      remove: (name) => this._classes.delete(name),
      contains: (name) => this._classes.has(name)
    };
  }

  get className() {
    return Array.from(this._classes).join(' ');
  }

  set className(value) {
    this._classes = new Set(String(value).split(/\s+/).filter(Boolean));
  }

  get innerHTML() {
    return this._innerHTML;
  }

  /** Assigning markup replaces all children, mirroring the real DOM. */
  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
  }

  setAttribute(name, value) {
    this._attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this._attributes.has(name) ? this._attributes.get(name) : null;
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(type, handler) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(handler);
  }

  click() {
    for (const handler of this._listeners.get('click') || []) handler();
  }
}

/**
 * Builds a document double containing the element IDs defined in specs/.../contracts/ui-contract.md,
 * with the same initial classes and attributes as src/index.html.
 */
export class FakeDocument {
  constructor() {
    const make = (tag, id, classes = [], attrs = {}) => {
      const el = new FakeElement(tag, id);
      classes.forEach((c) => el.classList.add(c));
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      return el;
    };

    this._elements = new Map(
      [
        make('section', 'quote-card', ['quote-card'], { 'aria-live': 'polite' }),
        make('blockquote', 'quote-text'),
        make('cite', 'quote-author'),
        make('button', 'btn-new-quote', ['btn'], { 'aria-label': 'Show new random quote' }),
        make('button', 'btn-favorite', ['btn'], { 'aria-pressed': 'false', 'aria-label': 'Toggle favorite' }),
        make('button', 'btn-view-favorites', ['btn'], { 'aria-expanded': 'false' }),
        make('section', 'favorites-container', ['favorites-container', 'is-hidden']),
        make('ul', 'favorites-list'),
        make('div', 'storage-warning', ['storage-warning', 'is-hidden'], { role: 'alert' })
      ].map((el) => [el.id, el])
    );
  }

  getElementById(id) {
    return this._elements.get(id) || null;
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }
}

/** In-memory stand-in for window.localStorage shared across simulated reloads. */
export class MockBrowserStorage {
  constructor() {
    this._store = new Map();
  }
  getItem(k) { return this._store.has(k) ? this._store.get(k) : null; }
  setItem(k, v) { this._store.set(k, String(v)); }
  removeItem(k) { this._store.delete(k); }
  clear() { this._store.clear(); }
}
