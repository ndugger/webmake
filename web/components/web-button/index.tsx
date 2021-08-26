import WebComponent from '../../utilities/web-component'
import getTemplate from '../../utilities/get-template'

import '../web-text'

import webButtonDoc from './doc.html'
import webButtonStyle from './style.css'

export class WebButton extends WebComponent {

    static readonly observedAttributes = [ 'type' ]

    public constructor() {
        super(getTemplate(webButtonDoc, 'web-button'), [ webButtonStyle ])
    }
}

customElements.define('web-button', WebButton)
