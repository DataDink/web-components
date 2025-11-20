export default
/**
 * @class ImportComponent
 * @extends {HTMLElement}
 * @description A web component that imports content from a specified source URL or template ID.
 */
class ImportComponent extends HTMLElement {
  static #NODES = Symbol('import-nodes');
  static get observedAttributes() { return ['from', 'target']; }

  /** @type {DocumentFragment | null} */
  #context = null;
  /** @type {ShadowRoot | null} */
  #shadow = null;

  /**
   * @property {string} from - The source URL or template ID to pull content from.
   */
  get from() { return this.getAttribute('from') ?? ''; }
  set from(value) { value == null ? this.removeAttribute('from') : this.setAttribute('from', value); }
  /**
   * @property {string} target - The import target type: 'insert', 'before', 'after', 'shadow', or query-selector. Defaults to a 'insert'.
   */
  get target() { return this.hasAttribute('target') ? this.getAttribute('target') : 'insert'; }
  set target(value) { value == null ? this.removeAttribute('target') : this.setAttribute('target', value); }
  /**
   * @property {bool} scripts - Set to process script elements in the imported content.
   */
  get scripts() { return this.hasAttribute('scripts'); }
  set scripts(value) { value ? this.setAttribute('scripts', 'scripts') : this.removeAttribute('scripts'); }
  /**
   * @property {bool} reroute - Set to reroute script and link elements local to the imported content.
   */
  get reroute() { return this.hasAttribute('reroute'); }
  set reroute(value) { value ? this.setAttribute('reroute', 'reroute') : this.removeAttribute('reroute'); }

  connectedCallback() { ImportComponent.import(this); }
  disconnectedCallback() { ImportComponent.clear(this); }
  /** @type {number | null} */
  #deferAttributeChange = null;
  attributeChangedCallback(/** @type {string} */ name, /** @type {string | null} */ oldValue, /** @type {string | null} */newValue) {
    if (!this.#context || oldValue === newValue) { return; }
    if (ImportComponent.observedAttributes.includes(name)) {
      clearTimeout(/** @type {number} */(this.#deferAttributeChange));
      this.#deferAttributeChange = setTimeout(() => {
        ImportComponent.clear(this);
        ImportComponent.import(this);
      }, 0);
    }
  }

  /**
   * @static
   * @method clear
   * @description Clears any content imported by the ImportComponent.
   * @param {ImportComponent} component - The instance of ImportContent to clear.
   */
  static clear(component) {
    if (!component.#context) { return; }
    const nodes = /** @type {Node[]} */(/** @type {any} */(component.#context)[ImportComponent.#NODES] ?? []);
    while (nodes.length) { component.#context.appendChild(/** @type {Node} */(nodes.shift())); }
    component.#context.dispatchEvent(new CustomEvent('detach'));
    component.#context = null;
  }
  /**
   * @async
   * @static
   * @method import
   * @description Imports the configured ImportComponent.
   * @param {ImportComponent} component - The instance of ImportContent to import with.
   */
  static async import(component) {
    if (!component.from) { return; }
    const local = /** @type {DocumentFragment} */(ImportComponent.searchTemplate(component)?.content?.cloneNode(true));
    component.#context = local ?? await ImportComponent.downloadContent(component);
    /** @type {any} */(component.#context)[ImportComponent.#NODES] = [...component.#context.childNodes];
    if (!local && component.reroute) { 
      ImportComponent.rerouteContent(component); 
    }
    if (component.scripts) {
      for (const script of [...component.#context.querySelectorAll('script')]) { 
        try { await ImportComponent.executeScript(component, script); }
        catch (error) { console.error(`Error executing imported script: ${error}`, error); }
      }
    }
    switch (component.target) {
      case 'shadow':
        (component.#shadow ??= component.attachShadow({ mode: 'open' })).appendChild(component.#context);
        break;
      case 'insert':
        component.appendChild(component.#context);
        break;
      case 'before':
        component.parentNode?.insertBefore(component.#context, component);
        break;
      case 'after':
        component.parentNode?.insertBefore(component.#context, component.nextSibling);
        break;
      default:
        let root = /** @type {ShadowRoot} */ (component.getRootNode());
        while (root) {
          const target = root.querySelector(component.target ?? '');
          if (target) { 
            target.appendChild(component.#context);
            break;
          }
          root = /** @type {ShadowRoot} */ (root.host?.getRootNode());
        }
        break;
    }
    component.#context.dispatchEvent(new CustomEvent('attach'));
  }
  /**
   * @static
   * @method searchTemplate
   * @description Searches for a template element with the specified ID in the component's ancestor tree.
   * @param {ImportComponent} component - The instance of ImportContent to search from.
   * @returns {HTMLTemplateElement | null} The found template element or null if not found.
   */
  static searchTemplate(component) {
    if (!component.from?.trim()) { return null; }
    let root = /** @type {ShadowRoot} */ (component.getRootNode());
    while (root) {
      const template = root.getElementById(component.from);
      if (template instanceof HTMLTemplateElement) { return template; }
      root = /** @type {ShadowRoot} */ (root.host?.getRootNode());
    }
    return null;
  }
  /**
   * @async
   * @static
   * @method downloadContent
   * @description Downloads content from the specified source URL.
   * @param {ImportComponent} component - The instance of ImportContent to download content for.
   * @returns {Promise<DocumentFragment>} The downloaded content as a DocumentFragment.
   */
  static async downloadContent(component) {
    const html = await (await fetch(component.from)).text();
    const fragment = document.createDocumentFragment();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    while (doc.head.firstChild) {
      fragment.appendChild(doc.head.firstChild);
    }
    while (doc.body.firstChild) {
      fragment.appendChild(doc.body.firstChild);
    }
    return fragment;
  }
  /**
   * @static
   * @method rerouteContent
   * @description Reroutes script and link elements in the imported content to be relative to the source URL.
   * @param {ImportComponent} component - The instance of ImportContent to reroute content for.
   */
  static rerouteContent(component) {
    if (!component.#context || !component.from) { return; }
    const baseUrl = new URL(component.from, location.href);
    for (const link of [...component.#context.querySelectorAll('link[href]')]) {
      const href = link.getAttribute('href');
      if (!href) { continue; }
      const url = new URL(href, baseUrl);
      link.setAttribute('href', url.href);
    }
    for (const script of [...component.#context.querySelectorAll('script[src]')]) {
      const src = script.getAttribute('src');
      if (!src) { continue; }
      const url = new URL(src, baseUrl);
      script.setAttribute('src', url.href);
    }
  }
  /**
   * @async
   * @static
   * @method executeScript
   * @description Executes a script element within the context of the imported content.
   * @param {ImportComponent} component - The instance of ImportContent to execute the script for.
   * @param {HTMLScriptElement} script - The script element to execute.
   */
  static async executeScript(component, script) {
    if (!component.#context) { return; }
    const url = script.hasAttribute('src') ? script.src : `data:text/javascript,${encodeURIComponent(script.textContent ?? '')}`;
    const source = script.type === 'module'
      ? (await import(url)).default
      : new Function(await (await fetch(url)).text());
    if (!(source instanceof Function)) { throw new Error('Script content is not a valid function'); }
    await source.call(component.#context, component.#context);
  }
}
export {ImportComponent};
customElements.define('import-component', ImportComponent);