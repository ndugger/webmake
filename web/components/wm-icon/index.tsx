import { WebComponent } from 'webmake/runtime'

import glyphs from './glyphs'
import iconStyle from './style.css'

export type Glyph = keyof typeof glyphs

export interface WebMakeIconAttributeMap {
    glyph: Glyph
}

export class WebMakeIcon extends WebComponent {

    public static override readonly adoptedStyleSheets = [
        iconStyle
    ] as const

    public static override readonly observedAttributes = [
        'glyph'
    ] as const

    protected clearIcon(glyph: Glyph) {
        this.shadowRoot?.getElementById(glyph)?.remove()
    }

    protected renderIcon(glyph: Glyph) {
        this.shadowRoot?.append(glyphs[ glyph ].getElementById(glyph)?.cloneNode(true) ?? '')
    }

    public override attributeChangedCallback(name: string, existing: string, incoming: string) {
        switch (name) {
            case 'glyph':
                this.clearIcon(existing as Glyph)
                this.renderIcon(incoming as Glyph)
                break
        }
    }
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'wm-icon': WebMakeIconAttributeMap
        }
    }
}

customElements.define('wm-icon', WebMakeIcon)
