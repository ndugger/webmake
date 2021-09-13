import { WebComponent } from 'webmake/runtime'

import glyphs from './glyphs'
import iconStyle from './style.css'

export class WebMakeIcon extends WebComponent {
    public static override readonly adoptedStyleSheets = [ iconStyle ] as const
    public static override readonly observedAttributes = [ 'glyph' ] as const

    protected clearIcon(glyph: WebMakeIcon.Glyph) {
        this.shadowRoot?.getElementById(glyph)?.remove()
    }

    protected renderIcon(glyph: WebMakeIcon.Glyph) {
        this.shadowRoot?.append(glyphs[ glyph ].getElementById(glyph)?.cloneNode(true) ?? '')
    }

    public override attributeChangedCallback(name: keyof WebMakeIcon.AttributeMap, existing: string, incoming: string) {
        if (name === 'glyph') {
            this.clearIcon(existing as WebMakeIcon.Glyph)
            this.renderIcon(incoming as WebMakeIcon.Glyph)
        }
    }
}

export namespace WebMakeIcon {
    export type Glyph = keyof typeof glyphs
    
    export interface AttributeMap {
        glyph: Glyph
    }
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'wm-icon': WebMakeIcon.AttributeMap
        }
    }
}

customElements.define('wm-icon', WebMakeIcon)
