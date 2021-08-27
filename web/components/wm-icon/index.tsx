import { WebComponent } from 'webmake/runtime'

import activityIcon from './icons/activity.svg'
import boxIcon from './icons/box.svg'
import gitMergeIcon from './icons/git-merge.svg'
import packageIcon from './icons/package.svg'

import iconStyle from './style.css'

export class WebMakeIcon extends WebComponent {

    public static override readonly adoptedStyleSheets = [
        iconStyle
    ] as const

    public static override readonly observedAttributes = [
        'glyph'
    ] as const

    public override attributeChangedCallback(name: string, existing: string, incoming: string) {

        switch (name) {
            case 'glyph':
                this.clearIcon(existing)
                this.renderIcon(incoming)
                break
        }
    }

    private clearIcon(glyph: string) {
        this.shadowRoot?.getElementById(glyph)?.remove()
    }

    private renderIcon(glyph: string) {
        let icon: XMLDocument

        switch (glyph) {
            case 'activity':
                icon = activityIcon
                break
            case 'box':
                icon = boxIcon
                break
            case 'git-merge': 
                icon = gitMergeIcon
                break
            case 'package':
                icon = packageIcon
                break
            default:
                icon = boxIcon
        }

        this.shadowRoot?.append(icon.getElementById(glyph)?.cloneNode(true) ?? '')
    }
}

customElements.define('wm-icon', WebMakeIcon)
