export function getTemplate(document: Document | DocumentFragment | undefined, id: string): HTMLTemplateElement | undefined {
    const element = document?.getElementById(id)

    if (!element) {
        return void 0
    }

    return element as HTMLTemplateElement
}

export class WebComponent extends HTMLElement {

    public constructor(template?: HTMLTemplateElement, adoptedStyleSheets: CSSStyleSheet[] = []) {
        super()
        
        if (!this.shadowRoot) {
            this.attachShadow({ mode: 'open' }).append(template?.content?.cloneNode(true) ?? '')
        }

        if (this.shadowRoot) {
            this.shadowRoot.adoptedStyleSheets = adoptedStyleSheets
        }
    }
}