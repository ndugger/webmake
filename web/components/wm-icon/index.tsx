import { WebComponent, getTemplate } from 'webmake/runtime'

import activityIconDoc from './icons/activity.svg'
import boxIconDoc from './icons/box.svg'
import gitMergeIconDoc from './icons/git-merge.svg'

import iconStyle from './style.css'

export class WebMakeIcon extends WebComponent {

    public static readonly observedAttributes = [
        'glyph'
    ]

    private renderIcon(glyph: string) {
        let iconDoc: XMLDocument | undefined

        switch (glyph) {
            case 'activity': iconDoc = activityIconDoc ;break
            case 'box': iconDoc = boxIconDoc ;break
            case 'git-merge': iconDoc = gitMergeIconDoc ;break
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
