import WebComponent from '../../utilities/web-component'
import getTemplate from '../../utilities/get-template'
import webButtonStyle from './style'

<html>
    <template id="web-button">
        <slot/>
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
