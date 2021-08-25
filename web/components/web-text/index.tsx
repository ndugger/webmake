import getTemplate from '../../utilities/get-template'
import WebComponent from '../../utilities/web-component'
import webTextStyle from './style'

<html>
    <template id="web-text">
        <slot/>
    </template>
</html>

export class WebText extends WebComponent {

    public constructor() {
        super(getTemplate(import.meta.document, 'web-text'), [ webTextStyle ])
    }
}

customElements.define('web-text', WebText)
