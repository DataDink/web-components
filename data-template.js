export default
/**
 * @class DataTemplate
 * @extends {HTMLElement}
 * @description A web component that wraps a template and renders instances based on a dataset and binding function.
 */
class DataTemplate extends HTMLElement {
  static #NODES = Symbol('data-template-nodes');
  /** @typedef {(this: DocumentFragment, data: any, context: DocumentFragment) => Promise<void>} DataBinder - A binding or mapping function */
  static get observedAttributes() { return ['target']; }
  /** @type {DocumentFragment[]} */
  #content = [];

  /**
   * @property {string} target - The content target insertion type: 'before', 'after', 'shadow', or a query-selector. Defaults to a 'after'.
   */
  get target() { return this.hasAttribute('target') ? this.getAttribute('target') : 'after'; }
  set target(value) { value == null ? this.removeAttribute('target') : this.setAttribute('target', value); }
  /**
   * @async
   * @method render
   * @description Renders the data template content using the provided data and binder.
   * @param {any} data - The data to be rendered. If this is an array, each item will be rendered.
   * @param {DataBinder} binder - The data binder function.
   */
  async render(data, binder) {
    DataTemplate.clear(this);
    if (data == null) { return; }
    const template = DataTemplate.getTemplate(this);
    data = Array.isArray(data) ? [...data] : [data];
    const target = DataTemplate.getTargetContext(this);
    while (data.length) {
      const item = data.shift();
      const context = /** @type {DocumentFragment} */(template.content.cloneNode(true));
      await binder.call(context, item, context);
      /** @type {any} */(context)[DataTemplate.#NODES] = [...context.childNodes];
      this.#content.push(context);
      DataTemplate.insert(this, context, target);
    }
  }


  connectedCallback() { DataTemplate.insert(this); }
  disconnectedCallback() { DataTemplate.remove(this); }
  /** @type {number | undefined} */
  #deferAttributeChange;
  attributeChangedCallback(/** @type {string} */ name, /** @type {string | null} */ oldValue, /** @type {string | null} */newValue) {
    if (oldValue === newValue) { return; }
    if (DataTemplate.observedAttributes.includes(name)) {
      clearTimeout(this.#deferAttributeChange);
      this.#deferAttributeChange = setTimeout(() => {
        if (!this.#content.length) { return; }
        DataTemplate.remove(this);
        DataTemplate.insert(this);
      }, 0);
    }
  }

  // Note: Static methods are for future testability and extensibility.

  /**
   * @static
   * @method clear
   * @description Clears any content rendered by the DataTemplate.
   * @param {DataTemplate} component - The instance of DataTemplate to clear.
   */
  static clear(component) {
    DataTemplate.remove(component);
    component.#content = [];
  }
  /**
   * @method getTemplate
   * @description Locations the template element this DataTemplate is wrapping.
   * @param {DataTemplate} component - The instance of DataTemplate to locate the template for.
   * @returns {HTMLTemplateElement} The located template element.
   * @throws Will throw an error if there is not exactly one child element or if that element is not a template.
   */
  static getTemplate(component) {
    const children = [...component.childNodes].filter(n => n instanceof Element);
    if (children.length !== 1) { throw new Error('DataTemplate requires exactly one child element.'); }
    const template = /** @type {HTMLTemplateElement} */(children[0]);
    if (!(template instanceof HTMLTemplateElement)) { throw new Error('DataTemplate child must be a <template> element.'); }
    return template;
  }
  /**
   * @method getTargetContext
   * @description Locates the target context element for content insertion based on the `target` attribute.
   * @param {DataTemplate} component - The instance of DataTemplate to locate the target for.
   * @returns {Node | null} The context node for insertion or null.
   */
  static getTargetContext(component) {
    if (component.target === 'before') { return component; }
    if (component.target === 'after') { return component.nextSibling; }
    if (component.target === 'shadow') { return component.shadowRoot ?? component.attachShadow({ mode: 'open' }); }
    let root = /** @type {ShadowRoot} */(component.getRootNode());
    while (root) {
      const found = root.querySelector(component.target ?? '');
      if (found) { return found; }
      root = /** @type {ShadowRoot} */(root.host ? root.host.getRootNode() : null);
    }
    return null;
  }
  /**
   * @static
   * @method insert
   * @description Inserts the rendered content into the DOM.
   * @param {DataTemplate} component - The instance of DataTemplate to insert into.
   * @param {DocumentFragment | null} context - An optional context to insert. If not provided, will insert all existing content.
   * @param {Node | null} target - An optional target node for insertion. If not provided, will determine based on component.target.
   */
  static insert(component, context = null, target = null) {
    const fragments = context ? [context] : [...component.#content];
    for (const frag of fragments) {
      target ??= DataTemplate.getTargetContext(component);
      switch(component.target) {
        case 'shadow':
          target?.appendChild(frag);
          break;
        case 'before':
          component.parentNode?.insertBefore(frag, target);
          break;
        case 'after':
          component.parentNode?.insertBefore(frag, target);
          break;
        default:
          target?.appendChild(frag);
          break;
      }
      frag.dispatchEvent(new CustomEvent('attach'));
    }
  }
  /**
   * @static
   * @method remove
   * @description Removes the rendered content from the DOM.
   * @param {DataTemplate} component - The instance of DataTemplate to remove from.
   */
  static remove(component) {
    for (const entry of component.#content) {
      const nodes = /** @type {Node[]} */(/** @type {any} */(entry)[DataTemplate.#NODES] ?? []);
      for (const node of nodes) { entry.appendChild(node); }
      entry.dispatchEvent(new CustomEvent('detach'));
    }
  }
}
export {DataTemplate};
customElements.define('data-template', DataTemplate);
