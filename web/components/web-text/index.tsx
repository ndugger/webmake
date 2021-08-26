import { WebComponent, getTemplate } from 'webmake/runtime'

import webTextStyle from './style.css'

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
