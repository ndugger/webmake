import WebComponent from '../../utilities/web-component'
import getTemplate from '../../utilities/get-template'
import webButtonStyle from './style'

import '../web-text'

<html>
    <template id="web-button">
        <web-text>
            <slot/>
        </web-text>
    </template>
</html>

export class WebButton extends WebComponent {

    static get observedAttributes() {
        return [ 'type' ]
    }

    public constructor() {
        super(getTemplate(import.meta.document, 'web-button'), [ webButtonStyle ])
    }
}

customElements.define('web-button', WebButton)
