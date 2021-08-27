import { WebComponent, getTemplate } from 'webmake/runtime'

import boxIconDoc from './icons/box.svg'
import iconStyle from './style.css'

export class WebMakeIcon extends WebComponent {

    public static readonly observedAttributes = [
        'glyph'
    ]

    private renderIcon(glyph: string) {
        let iconDoc: XMLDocument | undefined

        switch (glyph) {
            case 'box': iconDoc = boxIconDoc ;break
        }

        this.shadowRoot?.append(iconDoc?.getElementById(glyph)?.cloneNode(true) ?? '')
    }

    public attributeChangedCallback(name: string, existing: string, incoming: string): void {

        if (name === 'glyph') {
            this.shadowRoot?.getElementById(existing)?.remove()
            this.renderIcon(incoming)
        }
    }

    public constructor() {
        super(getTemplate(import.meta.document, 'wm-icon'), [ iconStyle ])
    }
}

customElements.define('wm-icon', WebMakeIcon)
