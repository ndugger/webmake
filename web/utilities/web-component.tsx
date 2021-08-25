export default class WebComponent extends HTMLElement {

    protected shadow = this.attachShadow({ mode: 'closed' })

    public constructor(template?: HTMLTemplateElement, adoptedStyleSheets: CSSStyleSheet[] = []) {
        super()

        this.shadow.adoptedStyleSheets = adoptedStyleSheets
        this.shadow.append(template?.content?.cloneNode(true) ?? '')
    }
}