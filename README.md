# web-components
my common components for copy/paste

> [!WARNING]
> Breaking changes are sure to happen here.
> These files should only be copy/pasted into projects, not linked to.

## ImportComponent

```<import-component from target scripts reroute></import-component>```

A web component that imports content from a specified source URL or template ID.

* **from**: The ID of a &lt;template&gt; or URL to an HTML fragment file.
* **target**: Specifies how to insert content: 'insert', 'shadow', 'before', 'after', or queryselector to a container element.
* **scripts**: If set, will process script elements.
* **reroute**: If set, will reroute the urls of &lt;link&gt; and &lt;script&gt; elements.

> Notes: 
> * The `from` attribute must be set for this component to function.
> * JS module content should export a default function that will be passed a `DocumentFragment` context object.
> * The `DocumentFragment` passed to JS content will dispatch `attach` and `detatch` events.
> * Once content is imported into the shadow root of an &gt;import-component&lt;, its 'insert' method will no longer work properly.

### Example:

**usage**
```html
<import-component from="components/my-component.html" scripts reroute></import-component>
```

**my-component.html**
```html
<link rel="stylesheet" href="my-component.css" />
<header>My Component</header>
<p>Here is an example component</p>
<script type="module" src="my-component.css"></script>
```

**my-component.js**
```javascript
export default async function module(/** @type {DocumentFragment} */context) {
  const header = context.querySelector('header');
  if (!header) { return; }
  const suffix = ' (attached)';
  context.addEventListener('attached', () => header.textContent += suffix);
  context.addEventListener('detached', () => header.textContent = header.textContent.slice(0, -suffix.length));
}
```

## SrcNav

```<src-nav hash-name for attr></src-nav>```

Sets a target element's `src` attribute when an HTMLAnchorElement 
is invoked from within the `src-nav`'s hierarchy.

* **hash-name**: Setting a `hash-name` allows the `src-nav` to leverage the address' hash to respond to changes and coordinate with other `src-nav`s
* **for**: Must be set to the ID of the element this `src-nav` configures navigations for.
* **attr**: Controls the attribute name the `src-nav` configures on the targeted element. Defaults to `src`.

> Notes:
> * The `for` attribute must be set for this control to function.
> * `src-nav` controls sharing the same `hash-name` will coordinate with each other.
> * `src-nav` controls with different `hash-name`s will operate independenly.

## ToggleButton

```<toggle-button for events></toggle-button>```

Toggles the `toggled` attribute on a target element when clicked.

* **for**: Must be set to the ID of the element this `toggle-button` configures attributes for.
* **events**: Optional events listened for on the toggled element removing the `toggled` attribute.

> Notes:
> * The `for` attribute must be set for this control to function.
