export default
/**
 * @class SrcNav
 * @extends HTMLElement
 * @description A custom element that sets a target element's src attribute when an HTMLAnchorElement is invoked from its hierarchy.
 */
class SrcNav extends HTMLElement {
  /**
   * @property {string} hashName - If set, the component will use this as a url hash value to provide deep-linking and coordinate with other components.
   */
  get hashName() { return this.getAttribute('hash-name'); }
  set hashName(value) { value == null ? this.removeAttribute('hash-name') : this.setAttribute('hash-name', value); }
  /**
   * @property {string} for - The ID of the element to which this navigation is attached.
   */
  get for() { return this.getAttribute('for'); }
  set for(value) { value == null ? this.removeAttribute('for') : this.setAttribute('for', value); }
  /**
   * @property {string} attr - The attribute to use for navigation. Defaults to 'src'.
   */
  get attr() { return this.hasAttribute('attr') ? this.getAttribute('attr') : 'src'; }
  set attr(value) { value == null ? this.removeAttribute('attr') : this.setAttribute('attr', value); }
  /**
   * @readonly
   * @property {boolean} attached - Indicates whether the component is currently attached to the DOM.
   */
  get attached() { return this.#attached; } #attached = false;
  constructor() {
    super();
    this.addEventListener('click', e => {
      const target = e.target.closest('a');
      if (!target) { return; }
      if (target.hasAttribute('target')) { return; }
      e.preventDefault();
      const src = target.getAttribute('href');
      SrcNav.navigate(this, src);
      this.dispatchEvent(new CustomEvent('navigate', {
        detail: { target, src },
        bubbles: true,
        composed: true
      }))
    });
    new MutationObserver(mutations => {
      const anchorsAdded = [...mutations].some(m => [...m.addedNodes].some(n => n instanceof HTMLAnchorElement));
      if (anchorsAdded) { SrcNav.navigate(this); }
    }).observe(this, { childList: true, subtree: true });
  }
  /**
   * @async
   * @static
   * @method attach
   * @description Attaches the component to the DOM and sets up navigation.
   * @param {SrcNav} component - The instance of SrcNav to attach.
   */
  static attach(component) {
    if (!(component instanceof SrcNav)) { throw new TypeError('Expected an instance of SrcNav'); }
    component.#attached = true;
    window.addEventListener('hashchange', component.#navHandler);
    SrcNav.navigate(component);
  }
  /**
   * @async
   * @static
   * @method detach
   * @description Detaches the component from the DOM and removes navigation listeners.
   * @param {SrcNav} component - The instance of SrcNav to detach.
   */
  static detach(component) {
    if (!(component instanceof SrcNav)) { throw new TypeError('Expected an instance of SrcNav'); }
    component.#attached = false;
    window.removeEventListener('hashchange', component.#navHandler);
  }
  #navHandler = e => SrcNav.navigate(this);
  /**
   * @static
   * @method navigate
   * @description Navigates the component to the specified source or the current hash value.
   * @param {SrcNav} component - The instance of SrcNav to navigate.
   * @param {string|null} src - The source to navigate to. If null, uses the current hash value.
   */
  static navigate(component, src = null) {
    if (!(component instanceof SrcNav)) { throw new TypeError('Expected an instance of SrcNav'); }
    const items = [...component.querySelectorAll('a')];
    for (const item of items) { item.classList.remove('active'); }
    const fallback = items.find(i => i.hasAttribute('default'));
    const hash = SrcNav.getHash();
    const nav = src != null ? src 
      : component.hashName && component.hashName in hash ? hash[component.hashName]
      : fallback ? fallback.getAttribute('href') 
      : null;
    if (nav == null) { return; } 
    const actives = items.filter(i => i.getAttribute('href') === nav);
    for (const item of actives) { item.classList.add('active'); }
    const target = component.getRootNode()?.querySelector(`#${component.for}`);
    if (!target) { return; }
    const attr = component.attr;
    if (target.getAttribute(attr) === nav) { return; }
    target.setAttribute(attr, nav);
    if (!component.hashName) { return; }
    if (hash[component.hashName] === nav) { return; }
    hash[component.hashName] = nav;
    SrcNav.setHash(hash);
  }
  /**
   * @static
   * @method getHash
   * @description Parses the current URL hash and returns an object with key-value pairs.
   * @returns {Object} An object representing the hash parameters.
   */
  static getHash() { 
    return Object.fromEntries(
      location.hash
        .split('#')
        .filter(v => v)
        .map(i => i.split('=').map(v => decodeURIComponent(v)))
    ); 
  }
  /**
   * @static
   * @method setHash
   * @description Sets the URL hash with the provided key-value pairs.
   * @param {Object} hash - An object representing the hash parameters to set.
   */
  static setHash(hash) {
    location.hash = Object.entries(hash)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('#');
  }

  connectedCallback() { SrcNav.attach(this); }
  disconnectedCallback() { SrcNav.detach(this); }
}

export { SrcNav };
customElements.define('src-nav', SrcNav);
