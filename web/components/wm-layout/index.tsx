import { WebComponent, getTemplate } from 'webmake/runtime'

import '../wm-icon'

import themeStyle from '../theme.css'
import webMakeLayoutStyle from './style.css'

<html lang="en">
    <template id="wm-layout">
        <section class="flex-layout">
            <nav role="navigation">
                <ul>
                    <li>
                        <wm-icon glyph="box"></wm-icon>
                        <span>Project</span>
                    </li>
                    <li>
                        <wm-icon glyph="activity"></wm-icon>
                        <span>Debug</span>
                    </li>
                    <li>
                        <wm-icon glyph="git-merge"></wm-icon>
                        <span>Git</span>
                    </li>
                </ul>
            </nav>
            <main role="main">
                <iframe role="article" src="https://wikipedia.com/"></iframe>
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
            console.log(message)
        })
    }
}

customElements.define('wm-layout', WebMakeLayout)
