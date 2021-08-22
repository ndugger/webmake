<p align="center">
    <img src="https://i.imgur.com/NtvG502.png"/>
</p>

# webmake
WebMake is an experimental [TypeScript](https://www.typescriptlang.org/) -> [HTML module](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/html-modules-explainer.md) compiler. It works by allowing you to embed an HTML document in your TypeScript modules, thanks to JSX. The detection of an embedded document will signal to the compiler to invert the code for the module by compiling the remaining TypeScript source code and placing the resulting JavaScript inside of a `<script type="module">` tag within the document. Sounds complicated, but it's absolutely not! Just take a look at the example below.

**Input**: TypeScript Module
```tsx
import './custom-button'

<html lang="en">
    <template id="index-page">
        <section>
            <header>
                <h1>
                    Hello { name }
                </h1>
            </header>
            <article>
                <custom-button>
                    Lorem ipsum dolor sit amet...
                </custom-button>
            </article>
        </section>
    </template>
</html>

export class IndexPage extends HTMLElement {

    #template = import.meta.document.getElementById('index-page') as HTMLTemplateElement

    public constructor() {
        super()
    }
}

customElements.define('index-page', IndexPage)
```

**Output**: HTML Module
```html
<!doctype html>
<html lang="en">
    <template id="index-page">
        <section>
            <header>
                 <h1>Hello {{name}}</h1>
            </header>
            <article>
                <custom-button>Lorem ipsum dolor sit amet...</custom-button>
            </article>
        </section>
    </template>
    <script type="module">
        import "/src/custom-button";
        export class IndexPage extends HTMLElement {
            #template = import.meta.document.getElementById("index-page");
            constructor() {
                super();
            }
        }
        customElements.define("index-page", IndexPage);
    </script>
</html>
```

### Ok, but why?
There are a few key proposals that I've got my eyes on:
- [HTML Modules](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/html-modules-explainer.md)
- [Template instantiation](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Template-Instantiation.md)
- [Web Bundles](https://web.dev/web-bundles/)
- [Import Maps](https://github.com/WICG/import-maps)
- [Declarative Custom Elements](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md)

As web developers, we've decided to go the JS-first route, which opened a ton of doors for us, but my interpretation of where I think the platform is headed is more of an HTML-first approach. However, if we attempt to only write raw HTML modules, we lose the ability to write type-safe code with TypeScript. With this tool you'll be able to write type-safe code that will compile into fully web-compatible modules.

While some of these proposals are a good ways off from being implemented, I intend to keep this tool up to date with the current direction of the specifications. The usefulness of this tool banks almost entirely on HTML modules, though, so that must be implemented before this tool can be taken seriously.

### Web Bundles
WebMake supports bundling and code splitting in the form of Web Bundles.

### Compiler API
Compiler was just rewritten to be more functional, documentation is a WIP. The following code produces a single WBN file from multiple modules and static assets:

```typescript
import * as WebMake from 'webmake'

export async function webmake(index: string, outputConfig: WebMake.OutputConfig): Promise<WebMake.WebBundle> {
    const project = { 
        app: await WebMake.readPackageConfig(), 
        pkg: await WebMake.readWebAppConfig(), 
        tsc: await WebMake.readTypeScriptConfig(),
        out: outputConfig
    }
    
    const staticAssets = await WebMake.importStaticAssets(project)
    const dependencies = await WebMake.importDependencies(project)
    const projectIndex = await WebMake.importIndexModule(project, index, dependencies)
    const compiledCode = await WebMake.compileModuleTree(project, projectIndex)

    return WebMake.createWebBundle(project, staticAssets, compiledCode)
}
```
