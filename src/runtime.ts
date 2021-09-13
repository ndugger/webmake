export function getStyleSheet(document?: Document | DocumentFragment, id?: string): CSSStyleSheet | undefined {
    const element = document?.getElementById(id ?? '') as HTMLStyleElement | undefined

    if (!element || !element.sheet) {
        return void 0
    }

    return element.sheet
}

export function getTemplate(document?: Document | DocumentFragment, id?: string): HTMLTemplateElement | undefined {
    const element = document?.getElementById(id ?? '') as HTMLTemplateElement | undefined

    if (!element) {
        return void 0
    }

    return element
}

export function cloneTemplate(template?: HTMLTemplateElement): DocumentFragment | undefined {
    const clone = template?.content?.cloneNode(true)

    if (!clone) {
        return void 0
    }

    return clone as DocumentFragment
}

export class WebComponent extends HTMLElement {

    public static readonly adoptedStyleSheets = [] as readonly CSSStyleSheet[]
    public static readonly observedAttributes = [] as readonly string[]
    public static readonly shadowRootTemplate = void 0 as HTMLTemplateElement | undefined

    /**
     * Lifecycle: invoked each time the custom element is moved to a new document
     */
    protected adoptedCallback() {}

    /**
     * Lifecycle: invoked each time one of the custom element's observed attributes is added, removed, or changed
     * @param name 
     * @param existing 
     * @param incoming 
     */
    protected attributeChangedCallback(_name: string, _existing: string, _incoming: string) {}

    /**
     * Lifecycle: invoked each time the custom element is appended into a document-connected element
     */
    protected connectedCallback() {}

    /**
     * Lifecycle: invoked at the time of element construction
     */
    protected createdCallback() {}

    /**
     * Lifecycle: invoked each time the custom element is disconnected from the document's DOM
     */
    protected disconnectedCallback() {}

    public constructor() {
        super()
        
        if (!this.shadowRoot) {
            this.attachShadow({ mode: 'open' }).append(
                Reflect.get(this.constructor, 'shadowRootTemplate')?.content?.cloneNode(true) ?? ''
            )
        }

        if (this.shadowRoot) {
            this.shadowRoot.adoptedStyleSheets = Reflect.get(this.constructor, 'adoptedStyleSheets') ?? []
        }

        requestAnimationFrame(() => this.createdCallback())
    }
}