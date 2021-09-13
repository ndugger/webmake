import { WebComponent, getTemplate, cloneTemplate } from 'webmake/runtime'

import '../wm-icon'

import webMakeDebuggerDoc from './views/debugger.html'
import webMakeGitManagerDoc from './views/git.html'
import webMakeProjectDoc from './views/project.html'
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

    protected registerNavItems() {
        const navItems = this.#nav?.querySelectorAll('li')

        if (!navItems) {
            throw new Error('Missing elements: <li></li>')
        }

        navItems.forEach(navItem => navItem.addEventListener('pointerdown', () => {
            this.switchView(navItem.dataset.view)
        }))
    }

    protected renderDebugger() {
        const debuggerTemplate = cloneTemplate(getTemplate(webMakeDebuggerDoc, 'debugger'))

        if (!debuggerTemplate) {
            throw new Error('Unable to clone missing template: "debugger"')
        }
        
        const iframe = debuggerTemplate.querySelector('iframe')

        if (!iframe) {
            throw new Error('Missing element: <iframe></iframe>')
        }

        iframe.src = 'http://localhost:' + this.getAttribute('port')

        this.#main?.append(debuggerTemplate)
    }

    protected renderGitManager() {
        const gitManagerDoc = cloneTemplate(getTemplate(webMakeGitManagerDoc, 'git'))

        if (!gitManagerDoc) {
            throw new Error('Unable to clone missing template: "git"')
        }

        this.#main?.append(gitManagerDoc)
    }

    protected renderProjectDetails() {
        const projectDoc = cloneTemplate(getTemplate(webMakeProjectDoc, 'project'))

        if (!projectDoc) {
            throw new Error('Unable to clone missing template: "project"')
        }

        this.#main?.append(projectDoc)
    }

    protected switchView(view = 'debug') {
        this.#main?.replaceChildren()

        switch (view) {
            case 'debug': return this.renderDebugger()
            case 'project': return this.renderProjectDetails()
            case 'git': return this.renderGitManager()
        }
    }

    protected override createdCallback() {
        this.registerNavItems()
        this.switchView()
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
