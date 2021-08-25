export default class WebComponent extends HTMLElement {

    protected shadow: ShadowRoot

    public constructor(template?: HTMLTemplateElement, adoptedStyleSheets: CSSStyleSheet[] = []) {
        super()

        this.shadow = this.attachShadow({ mode: 'closed' })

        this.shadow.adoptedStyleSheets = adoptedStyleSheets
        this.shadow.append(template?.content?.cloneNode(true) ?? '')
    }
}