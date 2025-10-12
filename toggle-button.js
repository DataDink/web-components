export default
/**
 * @class ToggleButton - A button that toggles the state of another element.
 * @extends HTMLElement
 */
class ToggleButton extends HTMLElement {
  /** @property {string} for - The id of the element to be toggled */
  get for() { return this.getAttribute('for'); }
  set for(value) { value == null ? this.removeAttribute('for') : this.setAttribute('for', value); }
  /** @property {string} events - The event(s) that revert the target element once toggled. */
  get events() { return this.getAttribute('events'); }
  set events(value) { value == null ? this.removeAttribute('events') : this.setAttribute('events', value); }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <button part="button" type="button">
        <slot></slot>
      </button>
    `;
    this.addEventListener('click', this.toggle);
  }
  /**
   * @method getTarget - Returns the current target this component is toggling.
   * @returns {HTMLElement|null} The target element or null if not found.
   */
  getTarget() {
    let root = this.getRootNode();
    while (root instanceof ShadowRoot) {
      const target = root.getElementById(this.for || '');
      if (target) { return target; }
      root = root.host;
    }
    return document.getElementById(this.for || '') || null;
  }
  /**
   * @method toggle - Toggles the targeted element.
   */
  toggle() {
    const target = this.getTarget();
    if (!target) { return; }
    target.toggleAttribute('toggled');
    if (!target.hasAttribute('toggled')) { return; }
    const events = this.events ? this.events.split(/\s+/g) : [];
    if (!events.length) { return; }
    const handler = () => {
      target.removeAttribute('toggled');
      for (const name of events) { target.removeEventListener(name, handler); }
    };
    for (const name of events) { target.addEventListener(name, handler); }
  };
}
export {ToggleButton};
customElements.define('toggle-button', ToggleButton);