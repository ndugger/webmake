import { WebComponent, getTemplate } from 'webmake/runtime'

import '../wm-icon'

import themeStyle from '../theme.css'
import webMakeLayoutStyle from './style.css'

<html lang="en">
    <template id="wm-layout">
        <section class="flex-layout">
            <nav role="navigation">
                <wm-icon glyph="box"></wm-icon>
            </nav>
            <main role="main">
                <iframe role="article"></iframe>
                <aside role="complementary">
                    ...
                </aside>
            </main>
        </section>
    </template>
</html>

export class WebMakeLayout extends WebComponent {
    
    public constructor() {
        super(getTemplate(import.meta.document, 'wm-layout'), [
            themeStyle,
            webMakeLayoutStyle
        ])
    }

    public connectedCallback() {
        const iframe = this.shadowRoot?.querySelector('iframe') as HTMLIFrameElement

        iframe.contentWindow?.addEventListener('message', message => {

        })
    }
}

customElements.define('wm-layout', WebMakeLayout)
