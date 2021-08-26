export default class WebComponent extends HTMLElement {

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