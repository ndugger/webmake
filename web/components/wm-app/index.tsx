import { WebComponent, getTemplate, cloneTemplate } from 'webmake/runtime'

import '../wm-icon'

import webMakeAppDebuggerView from './views/debugger.html'
import webMakeAppGitManagerView from './views/git.html'
import webMakeAppProjectView from './views/project.html'
import webMakeAppStyle from './style.css'

<html lang="en">
    <template id="wm-app">
        <nav role="navigation">
            <ul>
                <li data-view="project">
                    <wm-icon glyph="package"></wm-icon>
                    <span>Project</span>
                </li>
                <li data-view="debug">
                    <wm-icon glyph="activity"></wm-icon>
                    <span>Debug</span>
                </li>
                <li data-view="git">
                    <wm-icon glyph="git-merge"></wm-icon>
                    <span>Git</span>
                </li>
            </ul>
        </nav>
        <main role="main"></main>
    </template>
</html>

export class WebMakeApp extends WebComponent {
    public static override readonly adoptedStyleSheets = [ webMakeAppStyle ] as const
    public static override readonly shadowRootTemplate = getTemplate(import.meta.document, 'wm-app')

    get #main() {
        return this.shadowRoot?.querySelector('main')
    }

    get #nav() {
        return this.shadowRoot?.querySelector('nav')
    }

    protected registerNavigation() {
        const navItems = this.#nav?.querySelectorAll('li')

        if (!navItems) {
            throw new Error('Missing elements: <li></li>')
        }

        navItems.forEach(navItem => navItem.addEventListener('pointerdown', () => {
            this.#main?.replaceChildren(this.render(navItem.dataset.view))
        }))
    }

    protected renderDebugger() {
        const debuggerTemplate = cloneTemplate(getTemplate(webMakeAppDebuggerView, 'debugger'))

        if (!debuggerTemplate) {
            throw new Error('Unable to clone missing template: "debugger"')
        }
        
        const iframe = debuggerTemplate.querySelector('iframe')

        if (!iframe) {
            throw new Error('Missing element: <iframe></iframe>')
        }

        iframe.src = 'http://localhost:' + this.getAttribute('port')

        return debuggerTemplate
    }

    protected renderGitManager() {
        const gitManagerDoc = cloneTemplate(getTemplate(webMakeAppGitManagerView, 'git'))

        if (!gitManagerDoc) {
            throw new Error('Unable to clone missing template: "git"')
        }

        return gitManagerDoc
    }

    protected renderProjectDetails() {
        const projectDoc = cloneTemplate(getTemplate(webMakeAppProjectView, 'project'))

        if (!projectDoc) {
            throw new Error('Unable to clone missing template: "project"')
        }

        return projectDoc
    }

    protected render(view = 'debug') {
        switch (view) {
            case 'debug': return this.renderDebugger()
            case 'project': return this.renderProjectDetails()
            case 'git': return this.renderGitManager()
            default: return this.renderProjectDetails()
        }
    }

    protected override createdCallback() {
        this.registerNavigation()
        this.#main?.replaceChildren(this.render())
    }
}

export interface WebMakeAppAttributeMap {
    port: string
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'wm-app': WebMakeAppAttributeMap
        }
    }
}

customElements.define('wm-app', WebMakeApp)
