# web-components
my common components for copy/paste

> [!WARNING]
> Breaking changes are sure to happen here.
> These files should only be copy/pasted into projects, not linked to.

## ShadowImport

```<shadow-import src css js></shadow-import>```

Loads the specified content into its shadow dom.

* **src**: The URL to the source content.
* **css**: If set, will also link a CSS file of the same file name.
* **js**: If set, will also load a JS module of the same file name.
* **text**: If set, will load content as plain text.

> Note: JS module content should import the ContentScript interface 
> and export a default ContentScript subclass

```javascript
import { ContentScript } from './shadow-import.js'

export default class MyScript extends ContentScript {
  async attach(root) {...}
  async detach(root) {...}
}
```

## InlineImport

```<inline-import src import-before import-after></inline-import>```

Loads the specified content inline to the document.

* **src**: The URL to the source content.
* **import-before**: If set, imports the content before the `inline-import` element.
* **import-after**: If set, imports the content after the `inline-import` element.

> Note: If neither `import-before` and `import-after` are specified 
> the content will be imported inside the `inline-import` element.

