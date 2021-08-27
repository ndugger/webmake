export function getTemplate(document?: Document | DocumentFragment, id?: string): HTMLTemplateElement | undefined {
    const element = document?.getElementById(id ?? '')

    if (!element) {
        return void 0
    }

    return element as HTMLTemplateElement
}

export class WebComponent extends HTMLElement {

    public static readonly shadowTemplate = void 0 as HTMLTemplateElement | undefined
    public static readonly adoptedStyleSheets = [] as readonly CSSStyleSheet[]

    public connectedCallback() {}

    public constructor(template?: HTMLTemplateElement, adoptedStyleSheets?: CSSStyleSheet[]) {
        super()
        
        if (!this.shadowRoot) {
            this.attachShadow({ mode: 'open' }).append(
                template?.content?.cloneNode(true) ?? Reflect.get(this.constructor, 'shadowTemplate')?.content?.cloneNode(true) ?? ''
            )
        }

        if (this.shadowRoot) {
            this.shadowRoot.adoptedStyleSheets = adoptedStyleSheets ?? Reflect.get(this.constructor, 'adoptedStyleSheets') ?? []
        }
    }
}