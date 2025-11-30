export default
/**
 * @class ImportComponent
 * @extends {HTMLElement}
 * @description A web component that imports content from a specified source URL or template ID.
 * @author Greenwald
 * @source https://github.com/DataDink/web-components
 */
class ImportComponent extends HTMLElement {
  static #NODES = Symbol('import-nodes');
  /** @static @readonly @property {string[]} observedAttributes - The static list of attributes this custom element listens to. */
  static get observedAttributes() { return ['from', 'target', 'reroute', 'scripts']; }

  /** @type {DocumentFragment | null} */
  #context = null;

  /**
   * @property {string} from - The source URL or query-selector referencing a &lt;template&gt; to pull content from.
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
    if (oldValue === newValue) { return; }
    if (ImportComponent.observedAttributes.includes(name)) {
      clearTimeout(/** @type {number} */(this.#deferAttributeChange));
      this.#deferAttributeChange = setTimeout(() => {
        if (!this.#context) { return; }
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
    component.dispatchEvent(new CustomEvent('remove', { detail: component.#context, bubbles: true, composed: true }));
    component.#context.dispatchEvent(new CustomEvent('detach'));
    component.#context = null;
  }
  /**
   * @method getTargetContext
   * @description Locates the target context element for content insertion based on the `target` attribute.
   * @param {ImportComponent} component - The instance of ImportComponent to locate the target for.
   * @returns {Node | null} The context node for insertion or null.
   */
  static getTargetContext(component) {
    if (component.target === 'insert') { return component; }
    if (component.target === 'before') { return component; }
    if (component.target === 'after') { return component.nextSibling; }
    if (component.target === 'shadow') { return component.shadowRoot ?? component.attachShadow({ mode: 'open' }); }
    let root = /** @type {ShadowRoot} */(component.getRootNode());
    while (root) {
      const found = root.querySelector(component.target ?? '');
      if (found) { return found; }
      root = /** @type {ShadowRoot} */(root.host?.getRootNode());
    }
    return null;
  }
  /**
   * @async
   * @static
   * @method getFromContent
   * @description Retrieves content from the specified source URL or template ID.
   * @param {ImportComponent} component - The instance of ImportContent to get content for.
   * @returns {Promise<DocumentFragment>} The retrieved content as a DocumentFragment.
   */
  static async getFromContent(component) {
    try {
      let root = /** @type {ShadowRoot} */(component.getRootNode());
      while (root) {
        const found = root.querySelector(component.from ?? '');
        if (found instanceof HTMLTemplateElement) {
          return /** @type {DocumentFragment} */(found.content.cloneNode(true));
        }
        root = /** @type {ShadowRoot} */(root.host?.getRootNode());
      }
    } catch { }
    const html = await (await fetch(component.from)).text();
    const fragment = document.createDocumentFragment();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    while (doc.head.firstChild) { fragment.appendChild(doc.head.firstChild); }
    while (doc.body.firstChild) { fragment.appendChild(doc.body.firstChild); }
    if (component.reroute) { ImportComponent.rerouteContent(component, fragment); }
    return fragment;
  }
  /**
   * @async
   * @static
   * @method import
   * @description Imports the configured ImportComponent.
   * @param {ImportComponent} component - The instance of ImportContent to import with.
   */
  static async import(component) {
    ImportComponent.clear(component);
    if (!component.from) { return; }
    component.#context = await ImportComponent.getFromContent(component);
    if (component.scripts) {
      for (const script of [...component.#context.querySelectorAll('script')]) { 
        try { await ImportComponent.executeScript(component, script); }
        catch (error) { console.error(`Error executing imported script: ${error}`, error); }
      }
    }
    /** @type {any} */(component.#context)[ImportComponent.#NODES] = [...component.#context.childNodes];
    component.dispatchEvent(new CustomEvent('insert', { detail: component.#context, bubbles: true, composed: true }));
    const target = /** @type {Element} */ImportComponent.getTargetContext(component);
    switch (component.target) {
      case 'shadow':
        target?.appendChild(component.#context);
        break;
      case 'insert':
        target?.appendChild(component.#context);
        break;
      case 'before':
        component.parentNode?.insertBefore(component.#context, target);
        break;
      case 'after':
        component.parentNode?.insertBefore(component.#context, target);
        break;
      default:
        target?.appendChild(component.#context);
        break;
    }
    component.#context.dispatchEvent(new CustomEvent('attach'));
  }
  /**
   * @static
   * @method rerouteContent
   * @description Reroutes script and link elements in the imported content to be relative to the source URL.
   * @param {ImportComponent} component - The instance of ImportContent to reroute content for.
   * @param {DocumentFragment} content - The content to reroute.
   */
  static rerouteContent(component, content) {
    const baseUrl = new URL(component.from, location.href);
    for (const link of [...content.querySelectorAll('link[href]')]) {
      const href = link.getAttribute('href');
      if (!href) { continue; }
      const url = new URL(href, baseUrl);
      link.setAttribute('href', url.href);
    }
    for (const script of [...content.querySelectorAll('script[src]')]) {
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