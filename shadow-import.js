export default
/**
 * @class ShadowImport
 * @description A custom web component that imports HTML, CSS, and JavaScript content into a shadow DOM
 */
class ShadowImport extends HTMLElement {
  static get observedAttributes() { return ['src']; }
  /**
   * @property {string} src - The URL to the content to import.
   */
  get src() { return this.getAttribute('src'); }
  set src(value) { value == null ? this.removeAttribute('src') : this.setAttribute('src', value); }
  /**
   * @property {boolean} css - Set to true if a matching css file should be loaded.
   */
  get css() { return this.hasAttribute('css'); }
  set css(value) { value ? this.setAttribute('css', 'css') : this.removeAttribute('css'); }
  /**
   * @property {boolean} js - Set to true if a matching javascript file should be loaded.
   */
  get js() { return this.hasAttribute('js'); }
  set js(value) { value ? this.setAttribute('js', 'js') : this.removeAttribute('js'); }
  /**
   * @property {boolean} text - Set to true if the content should be treated as plain text.
   */
  get text() { return this.hasAttribute('text'); }
  set text(value) { value ? this.setAttribute('text', 'text') : this.removeAttribute('text'); }
  /**
   * @readonly
   * @property {ShadowRoot} content - The root shadow DOM where the imported content is attached.
   */
  get content() { return this.#content; } #content = this.attachShadow({ mode: 'open' });
  /**
   * @readonly
   * @property {ContentScript} script - The script instance that currently handles the imported content.
   */
  get script() { return this.#script; } #script = null;
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
   * @param {ShadowImport} component - The instance of ShadowImport to attach content to.
   */
  static async attach(component) {
    if (!(component instanceof ShadowImport)) { throw new TypeError('Expected an instance of ShadowImport'); }
    component.#attached = true;
    const path = component.src.split('?')[0].split('#')[0];
    const file = path.replace(/\.[^\\\/]+$/, '');
    const text = await fetch(path).then(async r => r.ok ? (await r.text()) : null)
                 ?? await fetch(`${file}.html`).then(async r => r.ok ? (await r.text()) : null)
                 ?? await fetch(`${file}.htm`).then(async r => r.ok ? (await r.text()) : null);
    if (text == null) { throw new Error(`Failed to load content from ${path} or ${file}.html or ${file}.htm`); }
    const markup = component.text ? document.createElement('div').appendChild(document.createTextNode(text)).parentNode.innerHTML : text;
    component.content.innerHTML = component.css
      ? `<link rel="stylesheet" href="${file}.css" />${markup}`
      : markup;
    if (!component.js) { return; }
    const url = new URL(file, location.href).href;
    const module = await import(`${url}.js`);
    const isScript = module.default && module.default.prototype instanceof ShadowImport.ContentScript;
    if (!isScript) { throw new TypeError(`Expected a default export of a ContentScript from ${dassdf}.js`); }
    component.#script = new module.default();
    await component.script.attach(component.content);
  }
  /**
   * @async
   * @static
   * @method detach
   * @description Detaches the content and script from the component.
   * @param {ShadowImport} component - The instance of ShadowImport to detach content from.
   */
  static async detach(component) {
    if (!(component instanceof ShadowImport)) { throw new TypeError('Expected an instance of ShadowImport'); }
    component.#attached = false;
    if (component.script) {
      await component.script.detach(component.content);
      component.#script = null;
    }
    component.content.innerHTML = '';
  }

  async connectedCallback() { await ShadowImport.attach(this); }
  async disconnectedCallback() { await ShadowImport.detach(this); }
  async attributeChangedCallback(name, oldValue, newValue) {
    if (!this.attached) { return; }
    if (name === 'src') {
      await ShadowImport.detach(this);
      await ShadowImport.attach(this); 
    }
  }

  static ContentScript = 
  /**
   * @abstract
   * @memberOf ShadowImport
   * @class ContentScript
   * @description Base class for scripts that handle imported content.
   */
  class ContentScript {
    /**
     * @async
     * @abstract
     * @method attach
     * @description Attaches the script to the shadow DOM root.
     * @param {ShadowRoot} root - The shadow DOM root to attach the script to.
     */
    async attach(root) { }
    /**
     * @async
     * @abstract
     * @method detach
     * @description Detaches the script from the shadow DOM root.
     * @param {ShadowRoot} root - The shadow DOM root to detach the script from.
     */
    async detach(root) { }
  }
}

export { ShadowImport };
export const ContentScript = ShadowImport.ContentScript;

customElements.define('shadow-import', ShadowImport);