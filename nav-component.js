/** @typedef {{[key:string]: string}} KeyValue */
export default
/**
 * @class NavComponent
 * @extends HTMLElement
 * @description A custom element that sets a target element's src attribute when an HTMLAnchorElement is invoked from its hierarchy.
 * @author Greenwald
 * @source https://github.com/DataDink/web-components
 */
class NavComponent extends HTMLElement {
  static #ACTIVECLASS = 'active';
  /**
   * @property {string} hashName - If set, the component will use this as a url hash value to provide deep-linking and coordinate with other components.
   */
  get hashName() { return this.getAttribute('hash-name'); }
  set hashName(value) { value == null ? this.removeAttribute('hash-name') : this.setAttribute('hash-name', value); }
  /**
   * @property {string} target - A query selector to the element(s) this navigation controls.
   */
  get target() { return this.getAttribute('target'); }
  set target(value) { value == null ? this.removeAttribute('target') : this.setAttribute('target', value); }
  /**
   * @property {string} attribute - The attribute this navigation controls on the target element(s). Defaults to 'src'.
   */
  get attribute() { return this.getAttribute('attribute') || 'src'; }
  set attribute(value) { value == null ? this.removeAttribute('attribute') : this.setAttribute('attribute', value); }
  /** @type {boolean} */
  constructor() {
    super();
    this.addEventListener('click', e => {
      if (e.defaultPrevented) { return; }
      if (!(e.target instanceof Element)) { return; }
      const target = e.target.closest('a');
      if (!target) { return; }
      if (target.hasAttribute('target')) { return; }
      e.preventDefault();
      for (const a of NavComponent.queryNavItems(this)) {
        if (a !== target && a.classList.contains(NavComponent.#ACTIVECLASS)) { 
          a.classList.remove(NavComponent.#ACTIVECLASS); 
        } else if (a === target && !a.classList.contains(NavComponent.#ACTIVECLASS)) {
          a.classList.add(NavComponent.#ACTIVECLASS);
        }
      }
      NavComponent.push(this);
      this.dispatchEvent(new CustomEvent('navigation', {
        detail: {
          component: this,
          source: target
        },
        bubbles: true,
        composed: true
      }));
    });
    new MutationObserver(records => {
      const ignore = records.every(r => r.attributeName === 'class');
      if (ignore) { return; }
      NavComponent.pull(this);
    }).observe(this, { childList: true, subtree: true, attributes: true });
  }
  /**
   * @static
   * @method push
   * @description Pushes the current navigation state from the component.
   * @param {NavComponent} component - The instance of NavComponent to push.
   */
  static push(component) {
    const active = NavComponent.queryActiveItem(component) ?? NavComponent.queryDefaultItem(component);
    if (active && !active.classList.contains(NavComponent.#ACTIVECLASS)) {
      active.classList.add(NavComponent.#ACTIVECLASS);
    }
    const src = active?.hasAttribute('href') ? active.getAttribute('href') : null;
    const name = component.hashName;
    if (name) {
      const hash = NavComponent.getHash();
      if (src) { hash[name] = src; }
      else { delete hash[name]; }
      NavComponent.setHash(hash);
      return;
    }
    NavComponent.post(component);
  }
  /**
   * @static
   * @method pull
   * @description Pulls the current navigation state to the component.
   * @param {NavComponent} component - The instance of NavComponent to pull.
   */
  static pull(component) {
    const targets = NavComponent.queryTargets(component);
    if (!targets.length) { return; }
    const name = component.hashName;
    const attribute = component.attribute;
    const current = name ? NavComponent.getHash()[name]
        : attribute ? targets.find(t => t.getAttribute(attribute))?.getAttribute(attribute)
        : null;
    const items = NavComponent.queryNavItems(component);
    const match = items.find(i => i.getAttribute('href') === current);
    if (!match) {
      const fallback = NavComponent.queryDefaultItem(component);
      if (fallback) { return fallback.click(); }
    }
    for (const item of items) {
      if (item !== match && item.classList.contains(NavComponent.#ACTIVECLASS)) {
        item.classList.remove(NavComponent.#ACTIVECLASS);
      } else if (item === match && !item.classList.contains(NavComponent.#ACTIVECLASS)) {
        item.classList.add(NavComponent.#ACTIVECLASS);
      }
    }
    NavComponent.post(component);
  }
  /**
   * @static
   * @method post
   * @description Sends the current active navigation state to the target elements.
   * @param {NavComponent} component - The instance of NavComponent to send.
   */
  static post(component) {
    const attribute = component.attribute;
    if (!attribute) { return; }
    const active = NavComponent.queryActiveItem(component);
    const src = active?.hasAttribute('href') ? active.getAttribute('href') : null;
    for (const target of NavComponent.queryTargets(component)) {
      if (target.getAttribute(attribute) === src) { continue; }
      if (src == null) { target.removeAttribute(attribute); }
      else { target.setAttribute(attribute, src); }
    }
  }
  /**
   * @static
   * @method queryNavItems
   * @description Queries all navigable items within the component.
   * @param {NavComponent} component - The instance of NavComponent to query.
   * @returns {HTMLAnchorElement[]} An array of anchor elements that are navigable.
   */
  static queryNavItems(component) {
    return /** @type {HTMLAnchorElement[]} */ ([...component.querySelectorAll('a[href]:not([target])')]);
  }
  /**
   * @static
   * @method queryActiveItem
   * @description Queries the currently active navigable item within the component.
   * @param {NavComponent} component - The instance of NavComponent to query.
   * @returns {HTMLAnchorElement|null} The currently active anchor element or null if none is active.
   */
  static queryActiveItem(component) {
    const items = NavComponent.queryNavItems(component);
    return items.find(i => i.classList.contains(NavComponent.#ACTIVECLASS)) || null;
  }
  /**
   * @static
   * @method queryDefaultItem
   * @description Queries the default navigable item within the component.
   * @param {NavComponent} component - The instance of NavComponent to query.
   * @returns {HTMLAnchorElement|null} The default anchor element or null if none is set.
   */
  static queryDefaultItem(component) {
    const items = NavComponent.queryNavItems(component);
    return items.find(i => i.hasAttribute('default')) || null;
  }
  /**
   * @static
   * @method queryTargets
   * @description Queries all target elements within the component based on the target selector.
   * @param {NavComponent} component - The instance of NavComponent to query.
   * @returns {Element[]} An array of target elements.
   */
  static queryTargets(component) {
    const targets = /** @type {Element[]} */([]);
    const selector = component.target;
    if (!selector) { return targets; }
    let root = /** @type {ShadowRoot} */(component.getRootNode());
    while (root) {
      targets.push(...root.querySelectorAll(selector));
      root = /** @type {ShadowRoot} */(root.host ? root.host.getRootNode() : null);
    }
    return targets;
  }
  /**
   * @static
   * @method getHash
   * @description Parses the current URL hash and returns an object with key-value pairs.
   * @returns {KeyValue} An object representing the hash parameters.
   */
  static getHash() { 
    return Object.fromEntries(
      location.hash
        .split('#')
        .filter(v => v)
        .map(i => i.match(/^([^=]+)=?(.*)$/)?.slice(1,3)?.map(v => decodeURIComponent(v)) ?? [])
    ); 
  }
  /**
   * @static
   * @method setHash
   * @description Sets the URL hash with the provided key-value pairs.
   * @param {KeyValue} hash - An object representing the hash parameters to set.
   */
  static setHash(hash) {
    const next = Object.entries(hash)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('#');
    if (location.hash.slice(1) === next) { return; }
    location.hash = next;
  }
  /** @type {() => void} */
  #navHandler = () => { NavComponent.pull(this); };
  connectedCallback() {
    window.addEventListener('hashchange', this.#navHandler);
    NavComponent.pull(this);
  }
  disconnectedCallback() {
    for (const a of NavComponent.queryNavItems(this)) { a.classList.remove(NavComponent.#ACTIVECLASS); }
    window.removeEventListener('hashchange', this.#navHandler);
  }
}
export { NavComponent };
customElements.define('nav-component', NavComponent);
