# web-components
my common components for copy/paste

> [!WARNING]
> Breaking changes are sure to happen here.
> These components will continue to evolve and deprioritize backwards compatibility.
> These files should only be copy/pasted into projects, not linked to.

# Rules
* Portable
* Standalone
* ES Module
* No Compile / Raw JS
* JSDOC Fully Documented

## ImportComponent

```<import-component from target scripts reroute></import-component>```

A web component that imports content from a specified source URL or template ID.

**Attributes:**

* **from**: The ID of a &lt;template&gt; or URL to an HTML fragment file.
* **target**: Specifies how to insert content: 'insert', 'shadow', 'before', 'after', or queryselector to a container element.
* **scripts**: If set, will process script elements.
* **reroute**: If set, will reroute the urls of &lt;link&gt; and &lt;script&gt; elements.

> Notes: 
> * The `from` attribute must be set for this component to function.
> * `insert` and `remove` events are dispatched from the component: `{detail: DocumentFragment}`
> * JS module content should export a default function that will be passed a `DocumentFragment` context object.
> * The `DocumentFragment` passed to JS content will dispatch `attach` and `detatch` events.
> * Once content is imported into the shadow root of an &lt;import-component&gt;, its 'insert' method will no longer work properly.

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
<script type="module" src="my-component.js"></script>
```

**my-component.js**
```javascript
export default async function module(/** @type {DocumentFragment} */context) {
  const header = context.querySelector('header');
  const suffix = ' (attached)';
  context.addEventListener('attach', () => header.textContent += suffix);
  context.addEventListener('detach', () => header.textContent = header.textContent.slice(0, -suffix.length));
}
```

## DataTemplate

```<data-template target><template></template</data-template>```

A web component that wraps a template and provides data binding functionality.

**Attributes:**

* **target**: Specifies how to insert content: 'shadow', 'before', 'after', or queryselector to a container element.

**Properties:**

* **render(data, binder)**: Generates template instances based on the given dataset and binder function
  * **data: any|any[]**: The data to render
  * **binder(data, context)**: The async binder function
    * **data: any**: The data item being rendered
    * **context: DocumentFragment**: A context containing the content to be rendered to the DOM
      * **event: attach**: Event dispatched from the context after the content is inserted in the DOM
      * **event: detach**: Event dispatched from the context after the content is removed from the DOM

### Example:

**usage**
```html
<data-template target="after"><template>
  <header></header>
  <p></p>
</template></data-template>
<script>
  const template = document.querySelector('data-template');
  const data = [
    {title: 'Title 1', text: 'Text 1'},
    {title: 'Title 2', text: 'Text 2'},
    {title: 'Title 3', text: 'Text 3'}
  ];
  template.render(data, (item, instance) => {
    instance.querySelector('header').textContent = item.title;
    instance.querySelector('p').textContent = item.text;
  });
</script>
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
