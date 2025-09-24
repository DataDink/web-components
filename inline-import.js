export default
/**
 * @class InlineImport
 * @extends HTMLElement
 * @description A custom element that imports content from a specified URL and attaches it to the DOM.
 */
class InlineImport extends HTMLElement {
  static get observedAttributes() { return ['src']; }
  /**
   * @property {string} src - The URL to the content to import.
   */
  get src() { return this.getAttribute('src'); }
  set src(value) { value == null ? this.removeAttribute('src') : this.setAttribute('src', value); }
  /**
   * @property {boolean} importBefore - Set to true if the content should be inserted before the element.
   */
  get importBefore() { return this.hasAttribute('import-before'); }
  set importBefore(value) { value ? this.setAttribute('import-before', 'import-before') : this.removeAttribute('import-before'); }
  /**
   * @property {boolean} importAfter - Set to true if the content should be inserted after the element.
   */
  get importAfter() { return this.hasAttribute('import-after'); }
  set importAfter(value) { value ? this.setAttribute('import-after', 'import-after') : this.removeAttribute('import-after'); }
  /**
   * @readonly
   * @property {Array} content - The content that is currently owned by this component.
   */
  get content() { return [...this.#content]; } #content = [];
  /**
   * @readonly
   * @property {boolean} attached - Indicates whether the component is currently attached to content.
   */
  get attached() { return this.#attached; } #attached = false;
  /**
   * @async
   * @static
   * @method attach
   * @description Imports and attaches content to the component.
   * @param {InlineImport} component - The instance of InlineImport to attach content to.
   */
  static async attach(component) {
    if (!(component instanceof InlineImport)) { throw new TypeError('Expected an instance of InlineImport'); }
    component.#attached = true;
    const path = component.src.split('?')[0].split('#')[0];
    const text = await fetch(path).then(async r => r.ok ? (await r.text()) : null);
    if (text == null) { throw new Error(`Failed to load content from ${path}`); }
    const fragment = document.createRange().createContextualFragment(text);
    component.#content = [...fragment.childNodes];
    if (component.importBefore) { return component.before(fragment); }
    if (component.importAfter) { return component.after(fragment); }
    component.append(fragment);
  }
  /**
   * @async
   * @static
   * @method detach
   * @description Detaches the content from the component.
   * @param {InlineImport} component - The instance of InlineImport to detach content from.
   */
  static async detach(component) {
    if (!(component instanceof InlineImport)) { throw new TypeError('Expected an instance of InlineImport'); }
    component.#attached = false;
    while (component.#content.length) { component.#content.shift().remove(); }
  }

  async connectedCallback() { await InlineImport.attach(this); }
  async disconnectedCallback() { await InlineImport.detach(this); }
  async attributeChangedCallback(name, oldValue, newValue) {
    if (!this.attached) { return; }
    if (name === 'src') {
      await InlineImport.detach(this);
      await InlineImport.attach(this);
    }
  }
}