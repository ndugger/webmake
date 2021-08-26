export default class WebComponent extends HTMLElement {
    
    protected template?: HTMLTemplateElement
    protected styles?: CSSStyleSheet[]

    public constructor(template?: HTMLTemplateElement, adoptedStyleSheets: CSSStyleSheet[] = []) {
        super()
        
        if (!this.shadowRoot) {
            this.attachShadow({ mode: 'open' }).append(template?.content?.cloneNode(true) ?? '')
        }
        
        (this.shadowRoot as ShadowRoot).adoptedStyleSheets = adoptedStyleSheets
    }
}